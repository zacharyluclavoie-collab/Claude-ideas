"""Autonomous paper-trading engine. One loop, strict priority:
   safety latches -> monitor/exit open positions -> scan for entries (new tokens first)."""
from __future__ import annotations

import logging
import os
import random
import time

from . import security as secmod
from . import strategy
from .config import Config
from .execution import Simulator
from .models import Position, Snapshot
from .portfolio import Portfolio
from .risk import RiskManager
from .store import Store

log = logging.getLogger("paper.bot")
# failures on these are ignored by the in-trade security recheck (they drift legitimately)
SOFT_RECHECK = {"holder_count", "liquidity_min", "no_wash_trading", "top10_concentration", "lp_locked_or_burned"}


class Bot:
    def __init__(self, cfg: Config, provider, clock, store: Store):
        self.cfg, self.prov, self.clock, self.store = cfg, provider, clock, store
        self.rng = random.Random(cfg.seed)
        self.risk = RiskManager(cfg)
        blocked = getattr(provider, "sell_blocked", None)
        self.sim = Simulator(cfg, self.rng, blocked)
        saved = store.get("portfolio")
        self.pf = Portfolio.from_dict(saved) if saved else Portfolio(cfg.starting_capital)
        self.rejected: dict[str, float] = {}
        self.regime = "unknown"
        self.regime_ok_at = clock.now()
        self.last = {k: 0.0 for k in ("monitor", "new", "trend", "recheck", "regime", "equity")}
        self._last_log_bucket = -1
        self.stats = {"scanned": 0, "rejected": 0, "bought": 0}
        self.kill_file = os.path.join(cfg.state_dir, "EMERGENCY_STOP")

    # ------------------------------------------------------------------ helpers
    def _due(self, name: str, every: float, now: float) -> bool:
        if now - self.last[name] >= every:
            self.last[name] = now
            return True
        return False

    def _ev(self, level, kind, token, msg, data=None):
        log.log(getattr(logging, level), "[%s] %s %s", kind, token, msg)
        self.store.event(self.clock.now(), level, kind, token, msg, data)

    def _save(self):
        self.store.set("portfolio", self.pf.to_dict())

    # ------------------------------------------------------------------ main tick
    def tick(self) -> None:
        now, cfg, pf = self.clock.now(), self.cfg, self.pf
        pf.roll_day(now)
        self._safety(now)
        if self._due("regime", cfg.regime_interval, now):
            self._update_regime(now)
        if self._due("monitor", cfg.monitor_interval, now):
            self.monitor(now)
        if pf.positions and self._due("recheck", cfg.security_recheck_interval, now):
            self.recheck_security(now)
        if not pf.shutdown:                       # entries only; monitoring above never stops
            if self._due("new", cfg.new_scan_interval, now):
                self.scan("new", now)
            if self._due("trend", cfg.trending_scan_interval, now):
                self.scan("trending", now)
        if self._due("equity", cfg.equity_log_interval, now):
            eq = pf.equity()
            self.store.equity(now, pf.cash, eq, pf.exposure(), len(pf.positions), pf.realized)
            if int(now // 900) != self._last_log_bucket:
                self._last_log_bucket = int(now // 900)
                log.info("equity=$%.2f cash=$%.2f exposure=$%.2f pos=%d realized=%+.2f regime=%s%s",
                         eq, pf.cash, pf.exposure(), len(pf.positions), pf.realized, self.regime,
                         " SHUTDOWN" if pf.shutdown else "")
            self._save()

    # ------------------------------------------------------------------ safety latches
    def _safety(self, now: float) -> None:
        pf = self.pf
        reason = ""
        if os.path.exists(self.kill_file):
            reason = "kill file present"
        if not reason:
            reason = self.risk.check_shutdown(pf)
        if reason and not pf.shutdown:
            pf.shutdown, pf.shutdown_reason = True, reason
            self._ev("CRITICAL", "shutdown", "", f"EMERGENCY SHUTDOWN: {reason}; flattening all positions")
        if pf.shutdown:
            for p in pf.positions.values():
                p.emergency = p.emergency or f"shutdown: {pf.shutdown_reason}"
            self._save()

    def _update_regime(self, now: float) -> None:
        majors = self.prov.majors()
        new = self.risk.regime(majors)
        if new != "unknown":
            self.regime_ok_at = now
            if new != self.regime:
                self._ev("WARNING" if new != "ok" else "INFO", "regime", "", f"market regime {self.regime} -> {new} {majors}")
            self.regime = new
        if self.regime == "crash":
            for p in self.pf.positions.values():
                p.emergency = p.emergency or "market crash"

    def market_ok(self, now: float) -> bool:
        stale = (now - self.regime_ok_at) / 60 > self.cfg.regime_max_unknown_minutes
        return self.regime == "ok" and not stale

    # ------------------------------------------------------------------ scanning
    def scan(self, source: str, now: float) -> None:
        cfg = self.cfg
        if source == "new":
            cands = self.prov.discover_new(cfg.chains)
        else:
            cands = self.prov.discover_trending(cfg.chains)
        seen, todo = set(), []
        for c in cands:
            if c.key in seen or c.key in self.pf.positions or self.rejected.get(c.key, 0) > now:
                continue
            seen.add(c.key)
            todo.append(c)
        if source == "new":   # newest pools first
            todo.sort(key=lambda c: -(c.snapshot.created_at or 0) if c.snapshot else 0)
        todo = todo[:cfg.max_candidates_per_scan]
        by_chain: dict[str, list] = {}
        for c in todo:
            by_chain.setdefault(c.chain, []).append(c.address)
        fresh: dict[str, Snapshot] = {}
        for chain, addrs in by_chain.items():
            fresh.update({f"{chain}:{a}": s for a, s in self.prov.snapshots(chain, addrs).items()})
        for c in todo:
            if self.pf.shutdown:
                break
            snap = fresh.get(c.key) or c.snapshot
            self.stats["scanned"] += 1
            if snap is None or snap.price_usd <= 0:
                continue          # not indexed yet; try again next scan
            self.evaluate(c.key, snap, source, now)

    def _reject(self, key, snap, source, why, minutes=None):
        self.stats["rejected"] += 1
        self.rejected[key] = self.clock.now() + 60 * (minutes or self.cfg.reject_cache_minutes)
        self.store.event(self.clock.now(), "INFO", "reject", f"{snap.symbol}/{key}", f"[{source}] {why}")

    def evaluate(self, key: str, snap: Snapshot, source: str, now: float) -> None:
        cfg = self.cfg
        # 1. opportunity analysis (cheap) -- a token is never bought merely for trending
        if source == "new":
            plan, rej = strategy.analyze_new(snap, now, cfg)
        else:
            plan, rej = strategy.analyze_trending(snap, now, cfg, breakout=True)   # optimistic pass
        if plan is None:
            young = any("too young" in r for r in rej)
            return self._reject(key, snap, source, "; ".join(rej), 3 if young else None)
        if source == "trending":
            bo = self.prov.breakout(snap)
            plan, rej = strategy.analyze_trending(snap, now, cfg, breakout=bo)
            if plan is None:
                return self._reject(key, snap, source, "; ".join(rej))
        # 2. mandatory security checks (fail closed)
        sec = self.prov.security(snap.chain, snap.address)
        verdict = secmod.evaluate(sec, snap, source, cfg, now)
        if not verdict.passed:
            return self._reject(key, snap, source, "SECURITY FAIL: " + ",".join(verdict.failures),
                                cfg.reject_cache_minutes * 4)
        # 3. risk manager has the final say
        dec = self.risk.approve_entry(snap, source, verdict.risk_score, plan, self.pf, now, self.market_ok(now))
        if not dec.approved:
            self.store.event(now, "INFO", "risk_veto", f"{snap.symbol}/{key}", "; ".join(dec.reasons))
            if "re-entry" not in dec.reasons[0]:
                self.rejected[key] = now + 300
            return
        self.open_position(snap, source, plan, verdict.risk_score, sec, dec.usd, now)

    # ------------------------------------------------------------------ execution
    def open_position(self, snap, category, plan, risk_score, sec, usd, now) -> None:
        pf = self.pf
        fill = self.sim.buy(snap, usd, sec.buy_tax or 0.0, is_new=category == "new")
        base = dict(ts=now, chain=snap.chain, address=snap.address, symbol=snap.symbol, category=category,
                    side="buy", req_usd=usd, fee_usd=fill.fee_usd, gas_usd=fill.gas_usd,
                    slippage_pct=fill.slippage_pct, partial=int(fill.partial), ok=int(fill.ok), note=fill.reason)
        if not fill.ok:
            pf.cash -= fill.gas_usd
            pf.realized -= fill.gas_usd
            pf.cooldowns[snap.key] = now + 900
            self.store.trade(position_id="", reason="entry", **base)
            self._ev("WARNING", "buy_failed", snap.symbol, fill.reason)
            return self._save()
        cost = fill.usd + fill.gas_usd
        pf.cash -= cost
        pf.entry_times.append(now)
        pf.entry_times = [t for t in pf.entry_times if now - t < 86400]
        pid = f"{snap.symbol}-{int(now)}"
        p = Position(
            id=pid, chain=snap.chain, address=snap.address, symbol=snap.symbol, category=category,
            pair_address=snap.pair_address, opened_at=now, entry_price=snap.price_usd, qty=fill.qty,
            qty_initial=fill.qty, cost_usd=cost, stop_price=snap.price_usd * (1 - plan.stop_pct / 100),
            tp1_price=snap.price_usd * (1 + plan.tp1_pct / 100), tp2_price=snap.price_usd * (1 + plan.tp2_pct / 100),
            trail_pct=plan.trail_pct, peak_price=snap.price_usd, last_price=snap.price_usd,
            entry_liq=snap.liquidity_usd, last_liq=snap.liquidity_usd, risk_score=risk_score,
            entry_score=plan.score, sell_tax=sec.sell_tax or 0.0, fees_usd=fill.fee_usd + fill.gas_usd,
            last_seen=now, initial_risk_usd=fill.usd * plan.stop_pct / 100)
        pf.positions[p.key] = p
        self.stats["bought"] += 1
        self.store.trade(position_id=pid, reason="entry", qty=fill.qty, price=fill.price, usd=fill.usd, **base)
        self._ev("INFO", "buy", snap.symbol,
                 f"[{category}] ${fill.usd:,.0f} @ {fill.price:.6g} slip={fill.slippage_pct:.2f}% score={plan.score:.0f} "
                 f"risk={risk_score:.0f} stop={p.stop_price:.6g} tp1={p.tp1_price:.6g} {fill.reason}")
        self._save()

    def _sell(self, p: Position, snap: Snapshot, frac: float, reason: str, urgent: bool) -> bool:
        pf, now = self.pf, self.clock.now()
        qty = p.qty if frac >= 0.999 else min(p.qty, p.qty_initial * frac)
        fill = self.sim.sell(snap, qty, p.sell_tax, urgent or p.exit_attempts >= 2, p.exit_attempts)
        base = dict(ts=now, position_id=p.id, side="sell", chain=p.chain, address=p.address, symbol=p.symbol,
                    category=p.category, reason=reason, req_usd=qty * snap.price_usd, fee_usd=fill.fee_usd,
                    gas_usd=fill.gas_usd, slippage_pct=fill.slippage_pct, partial=int(fill.partial),
                    ok=int(fill.ok), note=fill.reason)
        if not fill.ok:
            p.exit_attempts += 1
            pf.cash -= fill.gas_usd
            pf.realized -= fill.gas_usd
            p.realized_usd -= fill.gas_usd
            self.store.trade(pnl_usd=-fill.gas_usd, **base)
            self._ev("WARNING", "sell_failed", p.symbol, f"{reason}: {fill.reason} (attempt {p.exit_attempts})")
            if p.exit_attempts >= 3 and not p.emergency:
                p.emergency = "sell failing repeatedly (possible hidden sell restriction)"
                self._ev("CRITICAL", "emergency", p.symbol, p.emergency)
            return False
        part = fill.qty / p.qty if p.qty > 0 else 1.0
        cost_part = p.cost_usd * part
        net = fill.usd - fill.gas_usd
        pnl = net - cost_part
        pf.cash += net
        pf.realized += pnl
        p.realized_usd += pnl
        p.cost_usd -= cost_part
        p.qty -= fill.qty
        p.fees_usd += fill.fee_usd + fill.gas_usd
        p.exit_attempts = 0
        self.store.trade(qty=fill.qty, price=fill.price, usd=fill.usd, pnl_usd=pnl, **base)
        self._ev("INFO", "sell", p.symbol, f"{reason}: {fill.qty:.6g} @ {fill.price:.6g} net=${net:,.2f} pnl={pnl:+,.2f} "
                 f"slip={fill.slippage_pct:.2f}% {fill.reason}")
        if p.qty <= 1e-12 or p.qty * snap.price_usd < 1.0:
            self._close(p, reason, 0.0)
        return True

    def _close(self, p: Position, reason: str, recovered: float) -> None:
        pf, now = self.pf, self.clock.now()
        if recovered:
            pf.cash += recovered
        loss_booked = 0.0
        if p.cost_usd > 1e-6:                       # leftover cost basis is written off (net of recovery)
            loss_booked = recovered - p.cost_usd
            pf.realized += loss_booked
            p.realized_usd += loss_booked
        pf.positions.pop(p.key, None)
        pf.cooldowns[p.key] = now + self.cfg.reentry_cooldown_hours * 3600
        win = p.realized_usd > 0
        pf.loss_streak = 0 if win else pf.loss_streak + 1
        if pf.loss_streak >= self.cfg.loss_streak_pause:
            pf.pause_until = now + self.cfg.loss_pause_minutes * 60
            self._ev("WARNING", "pause", p.symbol, f"{pf.loss_streak} losses in a row: entries paused {self.cfg.loss_pause_minutes:.0f}m")
        r = p.realized_usd / p.initial_risk_usd if p.initial_risk_usd else 0.0
        pf.closed.append({"id": p.id, "symbol": p.symbol, "chain": p.chain, "category": p.category,
                          "pnl": round(p.realized_usd, 4), "r": round(r, 3), "reason": reason,
                          "held_h": round((now - p.opened_at) / 3600, 2), "fees": round(p.fees_usd, 4)})
        pf.closed = pf.closed[-1000:]
        self._ev("INFO", "closed", p.symbol, f"{reason}: total pnl={p.realized_usd:+,.2f} ({r:+.2f}R)")
        self._save()

    # ------------------------------------------------------------------ monitoring
    def monitor(self, now: float) -> None:
        cfg, pf = self.cfg, self.pf
        if not pf.positions:
            return
        by_chain: dict[str, list] = {}
        for p in pf.positions.values():
            by_chain.setdefault(p.chain, []).append(p.address)
        snaps: dict[str, Snapshot] = {}
        for chain, addrs in by_chain.items():
            snaps.update({f"{chain}:{a}": s for a, s in self.prov.snapshots(chain, addrs).items()})
        for p in list(pf.positions.values()):
            snap = snaps.get(p.key)
            if snap is None or snap.price_usd <= 0:
                p.stale_cycles += 1
                if p.stale_cycles >= cfg.stale_cycles_limit:
                    rec = self.pf.position_value(p) * cfg.stale_haircut
                    self._ev("CRITICAL", "stale_writeoff", p.symbol,
                             f"no price for {p.stale_cycles} cycles: closing at {cfg.stale_haircut:.0%} of last value")
                    p.qty = 0
                    self._close(p, "stale_data", rec)
                continue
            p.stale_cycles = 0
            prev_p, prev_l = p.last_price, p.last_liq
            p.last_price, p.last_liq, p.last_seen = snap.price_usd, snap.liquidity_usd, now
            p.peak_price = max(p.peak_price, snap.price_usd)
            if not p.emergency:
                p.emergency = self._emergency_reason(p, snap, prev_p, prev_l)
                if p.emergency:
                    self._ev("CRITICAL", "emergency", p.symbol, p.emergency)
            if p.emergency:
                if p.exit_attempts >= cfg.emergency_max_attempts:
                    self._ev("CRITICAL", "writeoff", p.symbol,
                             f"cannot sell after {p.exit_attempts} attempts (suspected honeypot/rug): written off")
                    p.qty = 0
                    self._close(p, "writeoff_unsellable", 0.0)
                else:
                    self._sell(p, snap, 1.0, f"EMERGENCY: {p.emergency}", urgent=True)
                continue
            self._adjust_stop(p, snap)
            px = snap.price_usd
            held_h = (now - p.opened_at) / 3600
            max_hold = cfg.new_max_hold_hours if p.category == "new" else cfg.trend_max_hold_hours
            if px <= p.stop_price:
                kind = "trailing_stop" if p.stop_price > p.entry_price else "stop_loss"
                self._sell(p, snap, 1.0, kind, urgent=False)
            elif not p.tp1_done and px >= p.tp1_price:
                if self._sell(p, snap, cfg.tp1_fraction, "take_profit_1", False) and p.key in pf.positions:
                    p.tp1_done = True
            elif p.tp1_done and not p.tp2_done and px >= p.tp2_price:
                if self._sell(p, snap, cfg.tp2_fraction, "take_profit_2", False) and p.key in pf.positions:
                    p.tp2_done = True
            elif held_h >= max_hold and not p.tp1_done:
                self._sell(p, snap, 1.0, "time_stop", False)
        self._save()

    def _adjust_stop(self, p: Position, snap: Snapshot) -> None:
        """Stops only ever move UP (risk never increases)."""
        px, old = snap.price_usd, p.stop_price
        be = p.entry_price * 1.01
        if p.tp1_done:
            p.stop_price = max(p.stop_price, be, p.peak_price * (1 - p.trail_pct / 100))
        elif px >= p.entry_price * (1 + (p.tp1_price / p.entry_price - 1) / 2):
            p.stop_price = max(p.stop_price, be)
        if self.regime == "danger" and px > p.entry_price:
            p.stop_price = max(p.stop_price, px * 0.96)
        if p.stop_price > old * 1.0001:
            self.store.event(self.clock.now(), "INFO", "stop_raised", p.symbol, f"{old:.6g} -> {p.stop_price:.6g}")

    def _emergency_reason(self, p: Position, snap: Snapshot, prev_p: float, prev_l: float) -> str:
        c = self.cfg
        if snap.liquidity_usd < p.entry_liq * (1 - c.emergency_liq_drop_total):
            return f"liquidity down {100*(1-snap.liquidity_usd/p.entry_liq):.0f}% vs entry"
        if prev_l > 0 and snap.liquidity_usd < prev_l * (1 - c.emergency_liq_drop_step):
            return f"liquidity pulled ({prev_l:,.0f} -> {snap.liquidity_usd:,.0f})"
        if prev_p > 0 and snap.price_usd < prev_p * (1 - c.emergency_price_drop_step):
            return f"flash crash {100*(1-snap.price_usd/prev_p):.0f}% in one interval"
        if snap.buys_1h >= 20 and snap.sells_1h == 0:
            return "buys-only flow (honeypot signature)"
        if snap.sells_1h >= 40 and snap.buys_1h * 4 < snap.sells_1h and snap.chg_5m < -10:
            return "heavy one-sided selling with falling price"
        return ""

    def recheck_security(self, now: float) -> None:
        for p in list(self.pf.positions.values()):
            if p.emergency:
                continue
            sec = self.prov.security(p.chain, p.address)
            if sec is None:
                continue
            snap = Snapshot(p.chain, p.address, p.symbol, p.last_price, p.last_liq, now, buys_1h=0, sells_1h=0,
                            created_at=now - 86400 * 30)
            v = secmod.evaluate(sec, snap, "trending", self.cfg, now)
            bad = [f for f in v.failures if f not in SOFT_RECHECK]
            if bad:
                p.emergency = "security recheck failed: " + ",".join(bad)
                self._ev("CRITICAL", "emergency", p.symbol, p.emergency)
            p.sell_tax = sec.sell_tax or p.sell_tax
