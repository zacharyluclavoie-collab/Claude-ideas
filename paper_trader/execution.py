"""Realistic execution simulator: DEX fee, gas, constant-product price impact,
latency drift, partial fills, failed transactions, taxes and selling restrictions."""
from __future__ import annotations

import random
from dataclasses import dataclass

from .config import Config
from .models import Snapshot


@dataclass
class Fill:
    ok: bool
    reason: str = ""
    qty: float = 0.0          # tokens bought / sold
    price: float = 0.0        # effective execution price (USD / token, pre-tax)
    usd: float = 0.0          # buy: USD spent on the swap; sell: net USD received
    fee_usd: float = 0.0      # DEX fee
    gas_usd: float = 0.0
    slippage_pct: float = 0.0
    partial: bool = False


class Simulator:
    def __init__(self, cfg: Config, rng: random.Random, hidden_sell_blocked=None):
        self.cfg = cfg
        self.rng = rng
        # optional oracle used by the mock market: (chain, address) -> True if sells secretly revert
        self.hidden_sell_blocked = hidden_sell_blocked or (lambda chain, addr: False)

    def _gas(self, chain: str) -> float:
        return float(self.cfg.gas_usd.get(chain, 0.5))

    def _drift(self, snap: Snapshot, adverse: bool) -> float:
        """Price move between quote and inclusion (fraction, >=0 when adverse)."""
        vol = abs(snap.chg_5m) / 100.0 * 0.25 + 0.002
        x = abs(self.rng.gauss(0, vol)) if adverse else self.rng.gauss(0, vol * 0.5)
        return x

    def buy(self, snap: Snapshot, usd: float, tax_pct: float, is_new: bool) -> Fill:
        c, rng = self.cfg, self.rng
        gas = self._gas(snap.chain)
        p_fail = c.base_fail_prob + (c.new_token_extra_fail_prob if is_new else 0.0)
        if rng.random() < p_fail:
            return Fill(False, "tx failed (reverted / dropped), gas burned", gas_usd=gas)
        reserve = snap.liquidity_usd / 2.0
        lim = 0.7 * c.max_buy_slippage_pct / 100.0          # leave headroom for latency drift
        max_in = reserve * lim / (1 - lim)
        want = usd
        partial = False
        if usd > max_in:                      # route cannot absorb it within slippage limit
            usd, partial = max_in, True
        if is_new and rng.random() < c.partial_fill_prob:
            usd *= rng.uniform(0.5, 0.95)
            partial = True
        if usd < 1.0:
            return Fill(False, "no executable size", gas_usd=gas)
        impact = usd / (reserve + usd)
        slip = impact + self._drift(snap, True)
        if slip * 100 > c.max_buy_slippage_pct:
            return Fill(False, f"slippage {slip*100:.1f}% > limit, reverted", gas_usd=gas, slippage_pct=slip * 100)
        px = snap.price_usd * (1 + slip)
        fee = usd * c.dex_fee_pct / 100.0
        qty = (usd - fee) / px * (1 - tax_pct / 100.0)
        return Fill(True, "filled" + (" (partial)" if partial else ""), qty=qty, price=px, usd=usd,
                    fee_usd=fee, gas_usd=gas, slippage_pct=slip * 100, partial=partial or usd < want * 0.999)

    def sell(self, snap: Snapshot, qty: float, tax_pct: float, urgent: bool, attempt: int = 0) -> Fill:
        c, rng = self.cfg, self.rng
        gas = self._gas(snap.chain)
        if self.hidden_sell_blocked(snap.chain, snap.address):
            return Fill(False, "sell reverted in pre-flight simulation (token restricts selling); no gas spent")
        p_fail = c.base_fail_prob * (2.0 if urgent else 1.0)   # congestion during stress
        if rng.random() < p_fail:
            return Fill(False, "tx failed (reverted / dropped), gas burned", gas_usd=gas)
        if snap.price_usd <= 0 or snap.liquidity_usd <= 0:
            return Fill(False, "no liquidity", gas_usd=gas)
        reserve = snap.liquidity_usd / 2.0
        limit = (c.max_emergency_slippage_pct if urgent else c.max_sell_slippage_pct) + attempt * 2.0
        limit = min(limit, 60.0) / 100.0
        value = qty * snap.price_usd
        lim = 0.7 * limit
        max_val = reserve * lim / (1 - lim)
        partial = False
        if value > max_val:                   # sell only what the pool can absorb within the limit
            qty *= max_val / value
            value, partial = max_val, True
        impact = value / (reserve + value)
        slip = impact + self._drift(snap, True)
        if slip > limit:
            return Fill(False, f"slippage {slip*100:.1f}% > limit", gas_usd=gas, slippage_pct=slip * 100)
        px = snap.price_usd * (1 - slip)
        gross = qty * px
        fee = gross * c.dex_fee_pct / 100.0
        net = (gross - fee) * (1 - tax_pct / 100.0)
        return Fill(True, "filled" + (" (partial)" if partial else ""), qty=qty, price=px, usd=net,
                    fee_usd=fee, gas_usd=gas, slippage_pct=slip * 100, partial=partial)
