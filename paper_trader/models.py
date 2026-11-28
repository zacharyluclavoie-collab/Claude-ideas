from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Snapshot:
    """Point-in-time market view of the best trading pair for a token."""
    chain: str
    address: str
    symbol: str
    price_usd: float
    liquidity_usd: float
    ts: float
    name: str = ""
    fdv_usd: float = 0.0
    volume_5m: float = 0.0
    volume_1h: float = 0.0
    volume_6h: float = 0.0
    volume_24h: float = 0.0
    chg_5m: float = 0.0   # percent
    chg_1h: float = 0.0
    chg_6h: float = 0.0
    chg_24h: float = 0.0
    buys_1h: int = 0
    sells_1h: int = 0
    buys_24h: int = 0
    sells_24h: int = 0
    pair_address: str = ""
    dex: str = ""
    created_at: Optional[float] = None  # epoch seconds of pool creation

    def age_hours(self, now: float) -> Optional[float]:
        return None if self.created_at is None else max(0.0, (now - self.created_at) / 3600.0)

    @property
    def key(self) -> str:
        return f"{self.chain}:{self.address.lower()}"


@dataclass
class Candidate:
    chain: str
    address: str
    source: str  # "new" | "trending"
    snapshot: Optional[Snapshot] = None  # optional prefilled data from the discovery feed

    @property
    def key(self) -> str:
        return f"{self.chain}:{self.address.lower()}"


@dataclass
class SecurityData:
    """Normalised token-security facts. None means 'unknown' (treated as a failure
    for every mandatory field: the bot fails closed)."""
    is_honeypot: Optional[bool] = None
    buy_tax: Optional[float] = None    # percent
    sell_tax: Optional[float] = None   # percent
    is_open_source: Optional[bool] = None
    is_proxy: Optional[bool] = None
    mintable: Optional[bool] = None
    hidden_owner: Optional[bool] = None
    can_take_back_ownership: Optional[bool] = None
    owner_change_balance: Optional[bool] = None
    transfer_pausable: Optional[bool] = None
    cannot_sell_all: Optional[bool] = None
    trading_cooldown: Optional[bool] = None
    has_blacklist: Optional[bool] = None
    slippage_modifiable: Optional[bool] = None
    selfdestruct: Optional[bool] = None
    external_call: Optional[bool] = None
    freezable: Optional[bool] = None
    closable: Optional[bool] = None
    non_transferable: Optional[bool] = None
    creator_honeypot_history: Optional[bool] = None
    is_in_dex: Optional[bool] = None
    holder_count: Optional[int] = None
    top10_pct: Optional[float] = None     # excl. LP / burn addresses
    creator_pct: Optional[float] = None
    owner_pct: Optional[float] = None
    lp_locked_pct: Optional[float] = None  # locked or burned share of LP
    is_solana: bool = False


@dataclass
class Check:
    name: str
    passed: bool
    mandatory: bool
    detail: str = ""


@dataclass
class Verdict:
    passed: bool
    risk_score: float          # 0 (safe) .. 100 (dangerous)
    checks: list = field(default_factory=list)
    failures: list = field(default_factory=list)


@dataclass
class Plan:
    stop_pct: float
    tp1_pct: float
    tp2_pct: float
    trail_pct: float
    score: float
    rr: float
    reasons: list = field(default_factory=list)


@dataclass
class Position:
    id: str
    chain: str
    address: str
    symbol: str
    category: str
    pair_address: str
    opened_at: float
    entry_price: float
    qty: float
    qty_initial: float
    cost_usd: float            # remaining cost basis (incl. fees/gas)
    stop_price: float
    tp1_price: float
    tp2_price: float
    trail_pct: float
    peak_price: float
    last_price: float
    entry_liq: float
    last_liq: float
    risk_score: float
    entry_score: float
    sell_tax: float = 0.0
    tp1_done: bool = False
    tp2_done: bool = False
    realized_usd: float = 0.0
    fees_usd: float = 0.0
    stale_cycles: int = 0
    exit_attempts: int = 0
    emergency: str = ""        # non-empty => exit in progress, value is the reason
    last_seen: float = 0.0
    initial_risk_usd: float = 0.0

    @property
    def key(self) -> str:
        return f"{self.chain}:{self.address.lower()}"
