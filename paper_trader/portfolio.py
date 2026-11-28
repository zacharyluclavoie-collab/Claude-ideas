from __future__ import annotations

import time
from dataclasses import asdict

from .models import Position


class Portfolio:
    def __init__(self, starting_capital: float):
        self.start = starting_capital
        self.cash = starting_capital
        self.positions: dict[str, Position] = {}       # key -> Position
        self.realized = 0.0
        self.peak_equity = starting_capital
        self.day = ""                                  # UTC date string
        self.day_start_equity = starting_capital
        self.loss_streak = 0
        self.pause_until = 0.0
        self.entry_times: list[float] = []
        self.cooldowns: dict[str, float] = {}          # token key -> no re-entry until ts
        self.shutdown = False
        self.shutdown_reason = ""
        self.closed: list[dict] = []                   # closed-position summaries

    # liquidation value is conservative: last price net of the token's sell tax
    def position_value(self, p: Position) -> float:
        return p.qty * p.last_price * (1 - p.sell_tax / 100.0)

    def exposure(self) -> float:
        return sum(self.position_value(p) for p in self.positions.values())

    def equity(self) -> float:
        return self.cash + self.exposure()

    def exposure_by(self, fn) -> dict:
        out: dict = {}
        for p in self.positions.values():
            out[fn(p)] = out.get(fn(p), 0.0) + self.position_value(p)
        return out

    def roll_day(self, now: float) -> None:
        day = time.strftime("%Y-%m-%d", time.gmtime(now))
        if day != self.day:
            self.day = day
            self.day_start_equity = self.equity()

    def to_dict(self) -> dict:
        d = {k: v for k, v in self.__dict__.items() if k != "positions"}
        d["positions"] = {k: asdict(p) for k, p in self.positions.items()}
        return d

    @staticmethod
    def from_dict(d: dict) -> "Portfolio":
        p = Portfolio(d["start"])
        for k, v in d.items():
            if k != "positions":
                setattr(p, k, v)
        p.positions = {k: Position(**v) for k, v in d["positions"].items()}
        return p
