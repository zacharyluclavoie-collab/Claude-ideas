"""Synthetic market (NOT real data) with hidden ground truth: legit tokens, pump&dumps,
rug pulls, detectable honeypots and 'stealth' honeypots that pass the security feed but
revert on sell. Used for offline runs and tests of the whole pipeline."""
from __future__ import annotations

import math
import random
from collections import deque
from dataclasses import dataclass, field
from typing import Optional

from .models import Candidate, SecurityData, Snapshot


@dataclass
class _Tok:
    chain: str
    address: str
    symbol: str
    kind: str                      # good|trend|pumpdump|rug|honeypot|stealth|dead
    created: float
    price: float
    liq: float
    base_vol: float
    sigma: float
    t_event: float = 0.0           # seconds after creation of rug / dump start
    drift: float = 0.0
    phase_until: float = 0.0
    boost: float = 0.0
    hist: deque = field(default_factory=lambda: deque(maxlen=1500))
    rugged: bool = False
    est: bool = False


class MockProvider:
    def __init__(self, clock, rng: random.Random, chains, new_per_min: float = 0.25):
        self.clock, self.rng, self.chains = clock, rng, chains
        self.new_per_min = new_per_min
        self.toks: dict[str, _Tok] = {}
        self.last = clock.now()
        self.n = 0
        self.market_1h = {"bitcoin": 0.0, "ethereum": 0.0, "solana": 0.0}
        self.crash_until = 0.0
        for _ in range(40):                                   # established tokens with history
            self._spawn(established=True)
        self._warm()

    # ---- world generation ----
    def _spawn(self, established=False):
        r, now = self.rng, self.clock.now()
        self.n += 1
        chain = r.choice(self.chains)
        addr = f"0x{self.n:040x}" if chain != "solana" else f"MOCK{self.n:040d}"
        if established:
            kind, age = r.choice(["trend", "trend", "good", "good", "pumpdump"]), r.uniform(100, 900) * 3600
            liq, vol = math.exp(r.uniform(math.log(150e3), math.log(4e6))), None
        else:
            kind = r.choices(["good", "pumpdump", "rug", "honeypot", "stealth", "dead"],
                             [0.30, 0.20, 0.12, 0.10, 0.06, 0.22])[0]
            age, liq = 0.0, math.exp(r.uniform(math.log(4e3), math.log(2.5e5)))
        base_vol = liq * r.uniform(0.15, 1.2) / 24
        t = _Tok(chain, addr, f"T{self.n}", kind, now - age, 10 ** r.uniform(-6, 0), liq, base_vol,
                 sigma=0.004 if established else 0.009)
        t.t_event = r.uniform(1.5, 9) * 3600 if kind in ("rug", "pumpdump") else 0.0
        t.est = established
        if established and kind == "pumpdump":
            t.t_event = r.uniform(1, 40) * 3600 + age
        self.toks[addr.lower()] = t

    def _step(self, t: _Tok, now: float):
        r = self.rng
        age = now - t.created
        if now >= t.phase_until:                                # new momentum phase
            t.phase_until = now + r.uniform(0.5, 4) * 3600
            t.drift = r.choice([-0.0004, 0.0, 0.0003, 0.0010, 0.0016]) if t.kind in ("trend", "good") else 0.0
            t.boost = max(0.0, t.drift) * 900 + r.uniform(-0.2, 0.4)
        ret = t.drift + r.gauss(0, t.sigma)
        if t.kind == "pumpdump" and t.t_event:
            ret = (0.008 if age < t.t_event else -0.012) + r.gauss(0, t.sigma)
        if t.kind == "dead":
            ret = -0.0004 + r.gauss(0, t.sigma * 1.5)
        if self.crash_until > now:
            ret -= 0.0004
        t.price = max(t.price * (1 + ret), 1e-12)
        if t.kind == "rug" and not t.rugged and age >= t.t_event:
            t.rugged, t.liq, t.price = True, t.liq * 0.03, t.price * 0.08
        elif not t.rugged:
            t.liq = max(t.liq * (1 + 0.3 * ret + r.gauss(0, 0.0005)), 1000)
        t.hist.append((now, t.price))

    def _warm(self):
        now = self.clock.now()
        for t in self.toks.values():
            age = min(now - t.created, 1500 * 60)
            n = int(age // 60)
            for i in range(n):
                self._step(t, now - (n - i) * 60)

    def advance(self):
        now = self.clock.now()
        steps = int((now - self.last) // 60)
        if steps <= 0:
            return
        steps = min(steps, 30)
        for i in range(steps):
            ts = self.last + (i + 1) * 60
            for t in self.toks.values():
                self._step(t, ts)
            if self.rng.random() < self.new_per_min:
                self._spawn()
            if self.rng.random() < 1 / 6000:                    # rare market-wide sell-off
                self.crash_until = ts + 3 * 3600
        self.last += steps * 60
        for k in [k for k, t in self.toks.items() if not t.est and now - t.created > 30 * 3600]:
            del self.toks[k]
        # majors' 1h change
        base = -9.0 if self.crash_until > now else 0.0
        for k in self.market_1h:
            self.market_1h[k] = base + self.rng.gauss(0, 0.6)

    # ---- provider interface ----
    def _chg(self, t: _Tok, now: float, secs: float) -> float:
        k = int(secs // 60)
        if len(t.hist) <= k:
            return 0.0
        return (t.price / t.hist[-k - 1][1] - 1) * 100

    def _snap(self, t: _Tok) -> Snapshot:
        now, r = self.clock.now(), self.rng
        c1h, c5 = self._chg(t, now, 3600), self._chg(t, now, 300)
        bp = min(0.85, max(0.2, 0.52 + c1h / 150 + r.gauss(0, 0.03)))
        vol1h = t.base_vol * (1 + max(0.0, t.boost) + abs(c1h) / 20) * (0.4 if t.rugged else 1)
        txn = max(5, int(vol1h / 90))
        buys = int(txn * bp)
        sells = txn - buys
        if t.kind == "honeypot":
            sells = int(sells * 0.2)
        return Snapshot(
            chain=t.chain, address=t.address, symbol=t.symbol, price_usd=t.price, liquidity_usd=t.liq, ts=now,
            fdv_usd=t.liq * 12, volume_5m=vol1h / 12, volume_1h=vol1h, volume_6h=t.base_vol * 6 * 1.2,
            volume_24h=t.base_vol * 24 * 1.15, chg_5m=c5, chg_1h=c1h, chg_6h=self._chg(t, now, 6 * 3600),
            chg_24h=self._chg(t, now, 86400), buys_1h=buys, sells_1h=sells, buys_24h=buys * 20, sells_24h=sells * 20,
            pair_address=f"pair-{t.address}", dex="mockswap", created_at=t.created)

    def discover_new(self, chains):
        self.advance()
        now = self.clock.now()
        fresh = [t for t in self.toks.values() if now - t.created < 24 * 3600 and t.chain in chains]
        fresh.sort(key=lambda t: -t.created)
        return [Candidate(t.chain, t.address, "new", self._snap(t)) for t in fresh[:40]]

    def discover_trending(self, chains):
        self.advance()
        snaps = [self._snap(t) for t in self.toks.values() if t.chain in chains and not t.rugged]
        snaps.sort(key=lambda s: -(s.volume_1h * 24 / max(s.volume_24h, 1)))
        return [Candidate(s.chain, s.address, "trending", s) for s in snaps[:25]]

    def snapshots(self, chain, addresses):
        self.advance()
        return {a.lower(): self._snap(self.toks[a.lower()]) for a in addresses if a.lower() in self.toks}

    def breakout(self, snap) -> Optional[bool]:
        t = self.toks.get(snap.address.lower())
        if not t or len(t.hist) < 300:
            return None
        hi = max(p for _, p in list(t.hist)[-1440:-60])
        return t.price > hi

    def majors(self):
        self.advance()
        return dict(self.market_1h)

    def security(self, chain, address) -> Optional[SecurityData]:
        t = self.toks.get(address.lower())
        if not t or self.rng.random() < 0.02:                   # occasional feed outage -> fail closed
            return None
        r = self.rng
        bad = t.kind in ("honeypot",)
        sol = chain == "solana"
        sd = SecurityData(
            is_solana=sol, is_honeypot=bad, buy_tax=r.choice([0, 0, 1, 3]), sell_tax=r.choice([0, 0, 1, 3]) + (60 if bad else 0),
            is_open_source=True, is_proxy=r.random() < 0.1, mintable=t.kind == "dead" and r.random() < 0.5,
            hidden_owner=False, can_take_back_ownership=False, owner_change_balance=False, transfer_pausable=False,
            cannot_sell_all=False, trading_cooldown=r.random() < 0.05, has_blacklist=False, slippage_modifiable=False,
            selfdestruct=False, external_call=r.random() < 0.1, freezable=False, closable=False, non_transferable=False,
            creator_honeypot_history=False, is_in_dex=True,
            holder_count=int(r.uniform(60, 3000) if t.kind != "dead" else r.uniform(10, 120)),
            top10_pct=r.uniform(12, 38) if t.kind != "rug" else r.uniform(30, 70),
            creator_pct=r.uniform(0, 4) if t.kind != "rug" else r.uniform(2, 20),
            owner_pct=r.uniform(0, 3),
            lp_locked_pct=r.uniform(85, 100) if t.kind not in ("rug",) else r.choice([0.0, 100.0, 100.0]))
        if t.rugged:                                            # post-rug rechecks see the damage
            sd.creator_pct, sd.top10_pct = 40.0, 80.0
        if t.kind == "good" and r.random() < 0.15:
            sd.top10_pct = r.uniform(46, 70)
        return sd

    def sell_blocked(self, chain, address) -> bool:
        t = self.toks.get(address.lower())
        return bool(t and t.kind == "stealth" and (self.clock.now() - t.created) > 1800)
