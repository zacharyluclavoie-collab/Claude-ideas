from __future__ import annotations

import json
from dataclasses import dataclass, field, fields, asdict


@dataclass
class Config:
    # ---- runtime ----
    provider: str = "live"            # live | mock (synthetic market, for offline tests)
    state_dir: str = "state"
    chains: list = field(default_factory=lambda: ["solana", "base", "ethereum", "bsc"])
    seed: int = 7
    # ---- scan cadence (seconds) ----
    tick_interval: float = 5.0
    monitor_interval: float = 15.0
    new_scan_interval: float = 30.0
    trending_scan_interval: float = 120.0
    security_recheck_interval: float = 300.0
    regime_interval: float = 120.0
    equity_log_interval: float = 60.0
    max_candidates_per_scan: int = 12
    reject_cache_minutes: float = 45.0
    # ---- capital & risk limits (risk manager has final authority) ----
    starting_capital: float = 10_000.0
    risk_per_trade_pct: float = 0.5        # equity risked to the stop, per trade
    max_position_pct_trending: float = 2.0
    max_position_pct_new: float = 1.0
    max_total_exposure_pct: float = 30.0
    max_new_token_exposure_pct: float = 10.0
    max_chain_exposure_pct: float = 15.0
    min_cash_reserve_pct: float = 20.0
    max_open_positions: int = 8
    max_liquidity_fraction: float = 0.006  # position <= 0.6% of pool liquidity (keeps round-trip impact small)
    max_round_trip_cost_pct: float = 3.0   # veto trades whose fees + impact exceed this share of size
    trending_entries_enabled: bool = False  # established-token momentum showed no edge after costs in testing
    min_trade_usd: float = 25.0
    daily_loss_limit_pct: float = 3.0      # halts new entries for the UTC day
    max_drawdown_pct: float = 12.0         # from peak equity -> emergency shutdown
    max_total_loss_pct: float = 20.0       # from starting capital -> emergency shutdown
    loss_streak_pause: int = 3
    loss_pause_minutes: float = 60.0
    max_entries_per_hour: int = 4
    max_entries_per_day: int = 20
    reentry_cooldown_hours: float = 12.0
    max_risk_score: float = 45.0
    min_reward_risk: float = 1.5
    # ---- security thresholds (mandatory) ----
    max_buy_tax: float = 5.0
    max_sell_tax: float = 8.0
    min_liquidity_new: float = 15_000.0
    min_liquidity_trending: float = 100_000.0
    min_holders_new: int = 100
    min_holders_trending: int = 500
    max_top10_pct: float = 45.0
    max_creator_pct: float = 8.0
    max_owner_pct: float = 8.0
    min_lp_locked_pct: float = 70.0
    max_volume_liq_ratio: float = 40.0     # wash-trading indicator
    # ---- strategy: new tokens ----
    new_min_age_minutes: float = 10.0
    new_max_age_hours: float = 24.0
    new_min_txns_1h: int = 50
    new_min_buy_pressure: float = 0.55
    new_max_chg_1h: float = 300.0
    new_max_fdv_liq: float = 60.0
    new_min_score: float = 60.0
    new_stop_pct: float = 18.0
    new_tp1_pct: float = 40.0
    new_tp2_pct: float = 100.0
    new_trail_pct: float = 15.0
    new_max_hold_hours: float = 12.0
    # ---- strategy: trending ----
    trend_min_age_hours: float = 72.0
    trend_min_volume_24h: float = 150_000.0
    trend_min_vol_accel: float = 1.5
    trend_min_buy_pressure: float = 0.52
    trend_max_chg_24h: float = 150.0
    trend_min_score: float = 62.0
    trend_stop_pct: float = 10.0
    trend_tp1_pct: float = 20.0
    trend_tp2_pct: float = 45.0
    trend_trail_pct: float = 8.0
    trend_max_hold_hours: float = 48.0
    tp1_fraction: float = 0.5
    tp2_fraction: float = 0.25
    # ---- emergency exits ----
    emergency_liq_drop_total: float = 0.5   # vs entry
    emergency_liq_drop_step: float = 0.3    # between observations
    emergency_price_drop_step: float = 0.3
    stale_cycles_limit: int = 8
    stale_haircut: float = 0.5              # fraction of last value assumed recovered
    emergency_max_attempts: int = 12
    market_danger_1h: float = -3.0          # majors 1h % -> pause entries, tighten stops
    market_crash_1h: float = -8.0           # -> exit everything
    regime_max_unknown_minutes: float = 15.0
    # ---- execution simulation ----
    dex_fee_pct: float = 0.30
    gas_usd: dict = field(default_factory=lambda: {
        "ethereum": 6.0, "base": 0.05, "bsc": 0.15, "solana": 0.02, "arbitrum": 0.10})
    base_fail_prob: float = 0.03
    new_token_extra_fail_prob: float = 0.05
    partial_fill_prob: float = 0.10
    max_buy_slippage_pct: float = 4.0
    max_sell_slippage_pct: float = 8.0
    max_emergency_slippage_pct: float = 30.0
    latency_seconds: float = 2.0

    @staticmethod
    def load(path: str | None) -> "Config":
        cfg = Config()
        if path:
            with open(path) as f:
                data = json.load(f)
            names = {f.name for f in fields(Config)}
            unknown = set(data) - names
            if unknown:
                raise ValueError(f"unknown config keys: {sorted(unknown)}")
            for k, v in data.items():
                setattr(cfg, k, v)
        cfg.validate()
        return cfg

    def validate(self) -> None:
        assert self.provider in ("live", "mock"), "provider must be live|mock"
        assert self.starting_capital > 0
        assert 0 < self.risk_per_trade_pct <= 2, "risk_per_trade_pct must be in (0,2]"
        assert self.max_total_exposure_pct <= 60, "total exposure above 60% is not allowed"
        assert self.min_cash_reserve_pct >= 5
        assert self.new_stop_pct > 0 and self.trend_stop_pct > 0
        assert self.max_drawdown_pct > 0 and self.max_total_loss_pct > 0

    def to_dict(self) -> dict:
        return asdict(self)
