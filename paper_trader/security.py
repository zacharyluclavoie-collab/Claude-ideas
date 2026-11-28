"""Mandatory token security checks. Any failed mandatory check rejects the trade.
Unknown data is a failure (fail closed)."""
from __future__ import annotations

from .config import Config
from .models import Check, SecurityData, Snapshot, Verdict


def evaluate(sec: SecurityData | None, snap: Snapshot, category: str, cfg: Config, now: float) -> Verdict:
    checks: list[Check] = []

    def add(name, passed, mandatory=True, detail=""):
        checks.append(Check(name, bool(passed), mandatory, detail))

    if sec is None:
        add("security_data_available", False, True, "no security report: fail closed")
        return Verdict(False, 100.0, checks, ["security_data_available"])

    def flag_false(name, value, detail=""):
        """Mandatory: value must be known and False."""
        add(name, value is False, True, detail or f"{name}={value}")

    new = category == "new"
    # --- contract / honeypot / rug indicators ---
    if not sec.is_solana:
        flag_false("not_honeypot", sec.is_honeypot)
        flag_false("no_hidden_owner", sec.hidden_owner)
        flag_false("no_ownership_takeback", sec.can_take_back_ownership)
        flag_false("owner_cannot_change_balance", sec.owner_change_balance)
        flag_false("transfers_not_pausable", sec.transfer_pausable)
        flag_false("can_sell_all", sec.cannot_sell_all)
        flag_false("no_slippage_modification", sec.slippage_modifiable)
        flag_false("no_selfdestruct", sec.selfdestruct)
        flag_false("not_mintable", sec.mintable)
        flag_false("no_blacklist_function", sec.has_blacklist)
        flag_false("creator_no_honeypot_history", sec.creator_honeypot_history)
        add("contract_verified", sec.is_open_source is True, True, f"open_source={sec.is_open_source}")
        add("tradable_on_dex", sec.is_in_dex is True, True, f"is_in_dex={sec.is_in_dex}")
    else:
        flag_false("not_mintable", sec.mintable)
        flag_false("not_freezable", sec.freezable)
        flag_false("not_closable", sec.closable)
        flag_false("transferable", sec.non_transferable)
        flag_false("owner_cannot_change_balance", sec.owner_change_balance)
    # --- taxes (also the sell restriction check) ---
    add("buy_tax_ok", sec.buy_tax is not None and sec.buy_tax <= cfg.max_buy_tax, True, f"buy_tax={sec.buy_tax}")
    add("sell_tax_ok", sec.sell_tax is not None and sec.sell_tax <= cfg.max_sell_tax, True, f"sell_tax={sec.sell_tax}")
    # --- developer wallet / holder distribution ---
    min_holders = cfg.min_holders_new if new else cfg.min_holders_trending
    add("holder_count", sec.holder_count is not None and sec.holder_count >= min_holders, True,
        f"holders={sec.holder_count} min={min_holders}")
    add("top10_concentration", sec.top10_pct is not None and sec.top10_pct <= cfg.max_top10_pct, True,
        f"top10={sec.top10_pct}")
    # creator/owner share: unknown only tolerated on Solana (feed does not expose it) with a risk penalty
    for name, val, lim in (("creator_holding", sec.creator_pct, cfg.max_creator_pct),
                           ("owner_holding", sec.owner_pct, cfg.max_owner_pct)):
        if val is None and sec.is_solana:
            add(name, True, False, "unknown on solana (penalised)")
        else:
            add(name, val is not None and val <= lim, True, f"{name}={val} max={lim}")
    # --- liquidity ---
    min_liq = cfg.min_liquidity_new if new else cfg.min_liquidity_trending
    add("liquidity_min", snap.liquidity_usd >= min_liq, True, f"liq={snap.liquidity_usd:.0f} min={min_liq:.0f}")
    lp = sec.lp_locked_pct
    if new:
        add("lp_locked_or_burned", lp is not None and lp >= cfg.min_lp_locked_pct, True, f"lp_locked={lp}")
    else:
        add("lp_locked_or_burned", lp is None or lp >= 20.0 or snap.liquidity_usd >= 1_000_000, True, f"lp_locked={lp}")
    # --- market-structure rug / honeypot indicators ---
    add("sells_exist", not (snap.buys_1h >= 20 and snap.sells_1h == 0), True,
        f"buys_1h={snap.buys_1h} sells_1h={snap.sells_1h} (buys-only flow = honeypot signature)")
    vlr = snap.volume_24h / snap.liquidity_usd if snap.liquidity_usd > 0 else 1e9
    add("no_wash_trading", vlr <= cfg.max_volume_liq_ratio, True, f"vol24/liq={vlr:.1f}")
    add("no_vertical_pump", snap.chg_1h <= 1000 and snap.chg_5m <= 150, True,
        f"chg1h={snap.chg_1h:.0f}% chg5m={snap.chg_5m:.0f}%")

    # --- risk score (lower is safer) ---
    r = 0.0
    r += min(25.0, (sec.top10_pct or 50) * 0.5)
    r += min(10.0, (sec.creator_pct if sec.creator_pct is not None else 5) * 1.0)
    r += min(10.0, ((sec.buy_tax or 0) + (sec.sell_tax or 0)) * 1.0)
    r += 6.0 if sec.is_proxy else 0.0
    r += 4.0 if sec.external_call else 0.0
    r += 5.0 if sec.trading_cooldown else 0.0
    r += 5.0 if (sec.is_solana and sec.creator_pct is None) else 0.0
    r += 15.0 if new else 0.0
    liq = max(snap.liquidity_usd, 1.0)
    r += 12.0 if liq < 30_000 else 6.0 if liq < 100_000 else 0.0
    r += 5.0 if (sec.lp_locked_pct or 0) < 90 else 0.0
    if sec.holder_count is not None and sec.holder_count < 300:
        r += 5.0
    age = snap.age_hours(now)
    if age is not None and age < 1:
        r += 8.0

    failures = [c.name for c in checks if c.mandatory and not c.passed]
    return Verdict(not failures, min(100.0, r), checks, failures)
