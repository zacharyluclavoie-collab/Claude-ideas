from __future__ import annotations

import math
from collections import Counter

from .portfolio import Portfolio
from .store import Store


def build(store: Store) -> str:
    saved = store.get("portfolio")
    if not saved:
        return "no state found"
    pf = Portfolio.from_dict(saved)
    eq = pf.equity()
    closed = pf.closed
    wins = [c["pnl"] for c in closed if c["pnl"] > 0]
    losses = [c["pnl"] for c in closed if c["pnl"] <= 0]
    pfactor = (sum(wins) / -sum(losses)) if losses and sum(losses) < 0 else float("inf") if wins else 0.0
    curve = [r[0] for r in store.rows("SELECT equity FROM equity ORDER BY ts")]
    peak, mdd = 0.0, 0.0
    for e in curve:
        peak = max(peak, e)
        mdd = max(mdd, (peak - e) / peak * 100 if peak else 0)
    fails = Counter(r[0] for r in store.rows("SELECT note FROM trades WHERE ok=0"))
    fees = store.rows("SELECT COALESCE(SUM(fee_usd+gas_usd),0) FROM trades")[0][0]
    by_reason = Counter(c["reason"].split(":")[0] for c in closed)
    by_cat: dict = {}
    for c in closed:
        by_cat.setdefault(c["category"], []).append(c["pnl"])
    L = [
        "=== PAPER TRADING REPORT (simulated money) ===",
        f"equity ${eq:,.2f}  start ${pf.start:,.2f}  return {100*(eq/pf.start-1):+.2f}%  cash ${pf.cash:,.2f}",
        f"realized pnl ${pf.realized:+,.2f}   open positions {len(pf.positions)}   max drawdown {mdd:.2f}%",
        f"closed trades {len(closed)}  win rate {100*len(wins)/len(closed):.1f}%" if closed else "closed trades 0",
        f"avg win ${sum(wins)/len(wins):,.2f}  avg loss ${sum(losses)/len(losses):,.2f}  profit factor {pfactor:.2f}"
        if wins and losses else "",
        f"fees+gas paid ${fees:,.2f}   shutdown: {pf.shutdown_reason if pf.shutdown else 'no'}",
        "exits by reason: " + ", ".join(f"{k}={v}" for k, v in by_reason.most_common()),
        "pnl by category: " + ", ".join(f"{k}: n={len(v)} ${sum(v):+,.2f}" for k, v in by_cat.items()),
        "failed txs: " + (", ".join(f"{k[:40]}={v}" for k, v in fails.most_common(5)) or "none"),
    ]
    return "\n".join(x for x in L if x)
