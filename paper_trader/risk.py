"""Risk manager: final authority over every entry. Strategies cannot bypass it."""
from __future__ import annotations

from dataclasses import dataclass, field

from .config import Config
from .models import Plan, Snapshot
from .portfolio import Portfolio


@dataclass
class Decision:
    approved: bool
    usd: float = 0.0
    reasons: list = field(default_factory=list)


NOT_TRADABLE = {"usdt", "usdc", "dai", "weth", "wbtc", "wsol", "sol", "eth", "btc", "bnb", "wbnb", "usde", "fdusd", "tusd", "usdd",
                "busd", "steth", "wsteth", "cbbtc", "cbeth", "usds", "pyusd"}


class RiskManager:
    def __init__(self, cfg: Config):
        self.cfg = cfg

    # ---- global state checks (run every tick) ----
    def check_shutdown(self, pf: Portfolio) -> str:
        """Return a reason if the emergency shutdown must be (or already is) active."""
        if pf.shutdown:
            return pf.shutdown_reason
        eq = pf.equity()
        pf.peak_equity = max(pf.peak_equity, eq)
        dd = (pf.peak_equity - eq) / pf.peak_equity * 100
        if dd >= self.cfg.max_drawdown_pct:
            return f"max drawdown {dd:.1f}% >= {self.cfg.max_drawdown_pct}%"
        loss = (pf.start - eq) / pf.start * 100
        if loss >= self.cfg.max_total_loss_pct:
            return f"total loss {loss:.1f}% >= {self.cfg.max_total_loss_pct}%"
        return ""

    def daily_loss_hit(self, pf: Portfolio) -> bool:
        if pf.day_start_equity <= 0:
            return False
        return (pf.day_start_equity - pf.equity()) / pf.day_start_equity * 100 >= self.cfg.daily_loss_limit_pct

    def risk_multiplier(self, pf: Portfolio) -> float:
        """Sizing scalar in (0,1]. It only ever shrinks risk after losses; it never exceeds 1."""
        eq = pf.equity()
        dd = max(0.0, (pf.peak_equity - eq) / pf.peak_equity * 100)
        m = 1.0 - 0.6 * min(1.0, dd / self.cfg.max_drawdown_pct)
        if pf.loss_streak >= 2:
            m *= 0.5
        return max(0.1, min(1.0, m))

    # ---- entry approval ----
    def approve_entry(self, snap: Snapshot, category: str, risk_score: float, plan: Plan,
                      pf: Portfolio, now: float, market_ok: bool) -> Decision:
        c = self.cfg
        no = lambda r: Decision(False, 0.0, [r])
        if pf.shutdown:
            return no("emergency shutdown active")
        if not market_ok:
            return no("dangerous / unknown market regime")
        if self.daily_loss_hit(pf):
            return no("daily loss limit reached")
        if now < pf.pause_until:
            return no("paused after loss streak")
        if snap.symbol.lower() in NOT_TRADABLE:
            return no("base asset or stablecoin")
        if any(p.symbol.lower() == snap.symbol.lower() for p in pf.positions.values()):
            return no("same symbol already held (clone risk)")
        if snap.key in pf.positions:
            return no("already holding this token")
        if now < pf.cooldowns.get(snap.key, 0):
            return no("re-entry cooldown")
        recent = [t for t in pf.entry_times if now - t < 3600]
        if len(recent) >= c.max_entries_per_hour:
            return no("hourly entry limit")
        if len([t for t in pf.entry_times if now - t < 86400]) >= c.max_entries_per_day:
            return no("daily entry limit")
        if len(pf.positions) >= c.max_open_positions:
            return no("max open positions")
        if risk_score > c.max_risk_score:
            return no(f"risk score {risk_score:.0f} > {c.max_risk_score:.0f}")
        if plan.rr < c.min_reward_risk:
            return no(f"reward/risk {plan.rr:.2f} < {c.min_reward_risk}")

        eq = pf.equity()
        exp = pf.exposure()
        caps = {
            "risk_budget": eq * c.risk_per_trade_pct / 100 / (plan.stop_pct / 100) * self.risk_multiplier(pf),
            "position_cap": eq * (c.max_position_pct_new if category == "new" else c.max_position_pct_trending) / 100,
            "liquidity_cap": snap.liquidity_usd * c.max_liquidity_fraction,
            "total_exposure_cap": eq * c.max_total_exposure_pct / 100 - exp,
            "cash_reserve_cap": pf.cash - eq * c.min_cash_reserve_pct / 100,
            "chain_cap": eq * c.max_chain_exposure_pct / 100 - pf.exposure_by(lambda p: p.chain).get(snap.chain, 0.0),
        }
        if category == "new":
            caps["new_exposure_cap"] = (eq * c.max_new_token_exposure_pct / 100
                                        - pf.exposure_by(lambda p: p.category).get("new", 0.0))
        name, usd = min(caps.items(), key=lambda kv: kv[1])
        if usd < c.min_trade_usd:
            return no(f"size {usd:.0f} below minimum (binding limit: {name})")
        # round-trip cost gate: network fees + DEX fees + price impact must stay small relative to the trade
        gas_rt = 2 * c.gas_usd.get(snap.chain, 0.5) * 1.2 + (0.15 if snap.chain == "solana" and category == "new" else 0.0)
        reserve = max(snap.liquidity_usd / 2, 1.0)
        cost = gas_rt / usd + 2 * c.dex_fee_pct / 100 + 2 * usd / reserve
        if cost > c.max_round_trip_cost_pct / 100:
            return no(f"round-trip cost {cost*100:.1f}% of size too high ({gas_rt/usd*100:.1f}% network fees)")
        return Decision(True, usd, [f"size ${usd:,.0f} (binding limit: {name}, mult {self.risk_multiplier(pf):.2f})"])

    # ---- market regime ----
    def regime(self, majors: dict | None) -> str:
        """'ok' | 'danger' | 'crash' | 'unknown' from 1h % changes of majors."""
        if not majors:
            return "unknown"
        worst = min(majors.values())
        avg = sum(majors.values()) / len(majors)
        if worst <= self.cfg.market_crash_1h or avg <= self.cfg.market_crash_1h / 1.5:
            return "crash"
        if worst <= self.cfg.market_danger_1h or avg <= self.cfg.market_danger_1h / 1.5:
            return "danger"
        return "ok"
