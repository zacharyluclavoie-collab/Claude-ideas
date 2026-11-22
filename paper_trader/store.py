"""SQLite journal: every decision, trade and equity point is recorded."""
from __future__ import annotations

import json
import os
import sqlite3


class Store:
    def __init__(self, state_dir: str):
        os.makedirs(state_dir, exist_ok=True)
        self.dir = state_dir
        self.db = sqlite3.connect(os.path.join(state_dir, "paper.db"))
        self.db.executescript("""
        CREATE TABLE IF NOT EXISTS trades(ts REAL, position_id TEXT, side TEXT, chain TEXT, address TEXT,
            symbol TEXT, category TEXT, reason TEXT, req_usd REAL, qty REAL, price REAL, usd REAL,
            fee_usd REAL, gas_usd REAL, slippage_pct REAL, partial INT, ok INT, note TEXT, pnl_usd REAL);
        CREATE TABLE IF NOT EXISTS events(ts REAL, level TEXT, kind TEXT, token TEXT, message TEXT, data TEXT);
        CREATE TABLE IF NOT EXISTS equity(ts REAL, cash REAL, equity REAL, exposure REAL, positions INT, realized REAL);
        CREATE TABLE IF NOT EXISTS kv(k TEXT PRIMARY KEY, v TEXT);
        """)

    def event(self, ts, level, kind, token, message, data=None):
        self.db.execute("INSERT INTO events VALUES(?,?,?,?,?,?)",
                        (ts, level, kind, token, message, json.dumps(data) if data else None))
        self.db.commit()

    def trade(self, **t):
        cols = ("ts position_id side chain address symbol category reason req_usd qty price usd fee_usd "
                "gas_usd slippage_pct partial ok note pnl_usd").split()
        self.db.execute(f"INSERT INTO trades VALUES({','.join('?'*len(cols))})", [t.get(c) for c in cols])
        self.db.commit()

    def equity(self, ts, cash, equity, exposure, n, realized):
        self.db.execute("INSERT INTO equity VALUES(?,?,?,?,?,?)", (ts, cash, equity, exposure, n, realized))
        self.db.commit()

    def set(self, k, v):
        self.db.execute("INSERT OR REPLACE INTO kv VALUES(?,?)", (k, json.dumps(v)))
        self.db.commit()

    def get(self, k, default=None):
        r = self.db.execute("SELECT v FROM kv WHERE k=?", (k,)).fetchone()
        return json.loads(r[0]) if r else default

    def rows(self, sql, args=()):
        return self.db.execute(sql, args).fetchall()

    def close(self):
        self.db.close()
