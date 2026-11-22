"""Opportunity analysis for both scanners. Returns a Plan (with score and
reward/risk) or None plus rejection reasons. Trending alone never triggers a buy."""
from __future__ import annotations

import math
from typing import Optional

from .config import Config
from .models import Plan, Snapshot


def _clamp(x, lo, hi):
    return max(lo, min(hi, x))


def buy_pressure(s: Snapshot) -> float:
    n = s.buys_1h + s.sells_1h
    return s.buys_1h / n if n else 0.0


def _plan(cfg: Config, s: Snapshot, category: str, score: float, reasons: list) -> Plan:
    if category == "new":
        stop, tp1, tp2, trail = cfg.new_stop_pct, cfg.new_tp1_pct, cfg.new_tp2_pct, cfg.new_trail_pct
    else:
        stop, tp1, tp2, trail = cfg.trend_stop_pct, cfg.trend_tp1_pct, cfg.trend_tp2_pct, cfg.trend_trail_pct
    # volatile tokens get a wider stop (position size shrinks accordingly) and wider targets
    stop = _clamp(abs(s.chg_1h) * 0.4, stop, stop * 2)
    tp1 = max(tp1, stop * 2.0)
    tp2 = max(tp2, tp1 * 2.0 if category == "new" else tp1 * 2.2)
    return Plan(stop_pct=stop, tp1_pct=tp1, tp2_pct=tp2, trail_pct=trail, score=score,
                rr=tp1 / stop, reasons=reasons)


def analyze_new(s: Snapshot, now: float, cfg: Config) -> tuple[Optional[Plan], list]:
    rej: list = []
    age = s.age_hours(now)
    if age is None:
        return None, ["unknown pool age"]
    if age * 60 < cfg.new_min_age_minutes:
        rej.append(f"too young ({age*60:.0f}m): wait for price discovery")
    if age > cfg.new_max_age_hours:
        rej.append(f"not new ({age:.1f}h)")
    if s.liquidity_usd < cfg.min_liquidity_new:
        rej.append("liquidity below minimum")
    txns = s.buys_1h + s.sells_1h
    if txns < cfg.new_min_txns_1h:
        rej.append(f"thin activity ({txns} txns/1h)")
    bp = buy_pressure(s)
    if bp < cfg.new_min_buy_pressure:
        rej.append(f"weak buy pressure {bp:.2f}")
    if s.chg_1h > cfg.new_max_chg_1h:
        rej.append(f"already pumped +{s.chg_1h:.0f}%/1h (not chasing)")
    if s.chg_5m < -5:
        rej.append("dumping now (5m)")
    if s.liquidity_usd > 0 and s.fdv_usd / s.liquidity_usd > cfg.new_max_fdv_liq and s.fdv_usd > 0:
        rej.append("FDV/liquidity too high")
    if rej:
        return None, rej
    vlr = s.volume_1h / s.liquidity_usd
    score = 0.0
    score += _clamp(math.log10(s.liquidity_usd / cfg.min_liquidity_new + 1) * 25, 0, 25)
    score += _clamp((bp - 0.5) * 120, 0, 20)
    score += 15 if 0.3 <= vlr <= 10 else 5 if vlr <= 25 else 0
    score += _clamp(s.chg_1h * 0.5, 0, 15) if s.chg_6h >= 0 else 0
    score += 10 if 0.5 <= age <= 8 else 5
    score += _clamp(math.log10(max(txns, 1) / cfg.new_min_txns_1h + 1) * 15, 0, 15)
    reasons = [f"age={age:.1f}h liq=${s.liquidity_usd:,.0f} bp={bp:.2f} vol/liq={vlr:.1f} 1h={s.chg_1h:+.0f}%"]
    if score < cfg.new_min_score:
        return None, [f"score {score:.0f} < {cfg.new_min_score:.0f}"] + reasons
    return _plan(cfg, s, "new", score, reasons), []


def analyze_trending(s: Snapshot, now: float, cfg: Config, breakout: Optional[bool]) -> tuple[Optional[Plan], list]:
    if not cfg.trending_entries_enabled:
        return None, ["established-token entries are switched off"]
    rej: list = []
    age = s.age_hours(now)
    if age is None or age < cfg.trend_min_age_hours:
        rej.append("insufficient trading history")
    if s.liquidity_usd < cfg.min_liquidity_trending:
        rej.append("liquidity below minimum")
    if s.volume_24h < cfg.trend_min_volume_24h:
        rej.append("24h volume too low")
    accel = (s.volume_1h * 24.0) / s.volume_24h if s.volume_24h > 0 else 0.0
    if accel < cfg.trend_min_vol_accel:
        rej.append(f"no volume acceleration ({accel:.2f}x)")
    bp = buy_pressure(s)
    if bp < cfg.trend_min_buy_pressure:
        rej.append(f"weak buy pressure {bp:.2f}")
    if not (1.0 <= s.chg_1h <= 25.0):
        rej.append(f"1h move {s.chg_1h:+.1f}% outside 1..25% (no chasing / no falling knives)")
    if s.chg_6h < 2.0:
        rej.append("6h trend not positive")
    if s.chg_24h > cfg.trend_max_chg_24h:
        rej.append(f"overextended +{s.chg_24h:.0f}%/24h")
    if s.chg_5m < -1.0:
        rej.append("short-term weakness (5m)")
    if rej:
        return None, rej
    score = 0.0
    score += _clamp((accel - 1.0) * 20, 0, 25)
    score += _clamp((bp - 0.5) * 150, 0, 20)
    score += _clamp(s.chg_1h * 1.2, 0, 15)
    score += _clamp(s.chg_6h * 0.6, 0, 10)
    score += _clamp(math.log10(s.liquidity_usd / cfg.min_liquidity_trending + 1) * 20, 0, 15)
    score += 15 if breakout else 0 if breakout is None else -10
    reasons = [f"accel={accel:.1f}x bp={bp:.2f} 1h={s.chg_1h:+.1f}% 6h={s.chg_6h:+.1f}% breakout={breakout}"]
    if score < cfg.trend_min_score:
        return None, [f"score {score:.0f} < {cfg.trend_min_score:.0f}"] + reasons
    return _plan(cfg, s, "trending", score, reasons), []
