"""Live, read-only market data: DexScreener, GeckoTerminal, GoPlus, CoinGecko.
Public GET endpoints only; no keys, no wallets. Every failure returns empty/None and
the bot then fails closed (no data => no trade)."""
from __future__ import annotations

import json
import logging
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime
from typing import Optional

from .models import Candidate, SecurityData, Snapshot

log = logging.getLogger("paper.live")

DS = "https://api.dexscreener.com"
GT = "https://api.geckoterminal.com/api/v2"
GP = "https://api.gopluslabs.io/api/v1"
CG = "https://api.coingecko.com/api/v3"
GT_NET = {"solana": "solana", "ethereum": "eth", "base": "base", "bsc": "bsc", "arbitrum": "arbitrum"}
GP_CHAIN = {"ethereum": "1", "bsc": "56", "base": "8453", "arbitrum": "42161"}
MIN_INTERVAL = {"api.dexscreener.com": 0.35, "api.geckoterminal.com": 2.2,
                "api.gopluslabs.io": 2.2, "api.coingecko.com": 3.0}


class Http:
    def __init__(self, timeout: float = 10.0):
        self.timeout = timeout
        self._last: dict[str, float] = {}
        self._lock = threading.Lock()

    def get(self, url: str) -> Optional[object]:
        host = url.split("/")[2]
        for attempt in range(2):
            with self._lock:
                wait = self._last.get(host, 0) + MIN_INTERVAL.get(host, 1.0) - time.time()
                if wait > 0:
                    time.sleep(wait)
                self._last[host] = time.time()
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "paper-trader/1.0", "Accept": "application/json"})
                with urllib.request.urlopen(req, timeout=self.timeout) as r:
                    return json.loads(r.read().decode())
            except urllib.error.HTTPError as e:
                if e.code == 429 and attempt == 0:
                    time.sleep(5)
                    continue
                log.warning("HTTP %s %s", e.code, url[:120])
                return None
            except Exception as e:  # network / parse
                log.warning("GET failed %s: %s", url[:120], e)
                if attempt == 0:
                    time.sleep(1)
        return None


def _f(x, default=0.0) -> float:
    try:
        return float(x)
    except (TypeError, ValueError):
        return default


def _iso(s: str) -> Optional[float]:
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
    except Exception:
        return None


class LiveProvider:
    def __init__(self):
        self.http = Http()

    # ---------- discovery ----------
    def _gecko_pools(self, chain: str, path: str, source: str) -> list[Candidate]:
        net = GT_NET.get(chain)
        if not net:
            return []
        data = self.http.get(f"{GT}/networks/{net}/{path}")
        out = []
        for pool in (data or {}).get("data", []) if isinstance(data, dict) else []:
            try:
                a = pool["attributes"]
                base_id = pool["relationships"]["base_token"]["data"]["id"]        # "eth_0xabc..."
                addr = base_id.split("_", 1)[1]
                tx = a.get("transactions", {})
                vol, chg = a.get("volume_usd", {}), a.get("price_change_percentage", {})
                snap = Snapshot(
                    chain=chain, address=addr, symbol=str(a.get("name", "?")).split(" / ")[0],
                    price_usd=_f(a.get("base_token_price_usd")), liquidity_usd=_f(a.get("reserve_in_usd")),
                    ts=time.time(), fdv_usd=_f(a.get("fdv_usd")),
                    volume_5m=_f(vol.get("m5")), volume_1h=_f(vol.get("h1")), volume_6h=_f(vol.get("h6")),
                    volume_24h=_f(vol.get("h24")),
                    chg_5m=_f(chg.get("m5")), chg_1h=_f(chg.get("h1")), chg_6h=_f(chg.get("h6")),
                    chg_24h=_f(chg.get("h24")),
                    buys_1h=int(tx.get("h1", {}).get("buys", 0)), sells_1h=int(tx.get("h1", {}).get("sells", 0)),
                    buys_24h=int(tx.get("h24", {}).get("buys", 0)), sells_24h=int(tx.get("h24", {}).get("sells", 0)),
                    pair_address=a.get("address", ""), created_at=_iso(a.get("pool_created_at", "")))
                out.append(Candidate(chain, addr, source, snap))
            except (KeyError, IndexError, AttributeError):
                continue
        return out

    def discover_new(self, chains) -> list[Candidate]:
        out: list[Candidate] = []
        for ch in chains:
            out += self._gecko_pools(ch, "new_pools?page=1", "new")           # newly created liquidity pools
        prof = self.http.get(f"{DS}/token-profiles/latest/v1")                 # newly listed/profiled tokens
        for p in prof if isinstance(prof, list) else []:
            if p.get("chainId") in chains and p.get("tokenAddress"):
                out.append(Candidate(p["chainId"], p["tokenAddress"], "new"))
        return out

    def discover_trending(self, chains) -> list[Candidate]:
        out: list[Candidate] = []
        for ch in chains:
            out += self._gecko_pools(ch, "trending_pools?page=1", "trending")
            out += self._gecko_pools(ch, "pools?page=1&sort=h24_volume_usd_desc", "trending")
        return out

    # ---------- market data ----------
    def snapshots(self, chain: str, addresses: list[str]) -> dict[str, Snapshot]:
        res: dict[str, Snapshot] = {}
        for i in range(0, len(addresses), 30):
            chunk = addresses[i:i + 30]
            data = self.http.get(f"{DS}/tokens/v1/{chain}/{','.join(chunk)}")
            for p in data if isinstance(data, list) else []:
                try:
                    addr = p["baseToken"]["address"]
                    liq = _f((p.get("liquidity") or {}).get("usd"))
                    cur = res.get(addr.lower())
                    if cur and cur.liquidity_usd >= liq:
                        continue
                    tx, vol, chg = p.get("txns", {}), p.get("volume", {}), p.get("priceChange", {})
                    created = p.get("pairCreatedAt")
                    res[addr.lower()] = Snapshot(
                        chain=chain, address=addr, symbol=p["baseToken"].get("symbol", "?"),
                        name=p["baseToken"].get("name", ""), price_usd=_f(p.get("priceUsd")), liquidity_usd=liq,
                        ts=time.time(), fdv_usd=_f(p.get("fdv")),
                        volume_5m=_f(vol.get("m5")), volume_1h=_f(vol.get("h1")), volume_6h=_f(vol.get("h6")),
                        volume_24h=_f(vol.get("h24")),
                        chg_5m=_f(chg.get("m5")), chg_1h=_f(chg.get("h1")), chg_6h=_f(chg.get("h6")),
                        chg_24h=_f(chg.get("h24")),
                        buys_1h=int(tx.get("h1", {}).get("buys", 0)), sells_1h=int(tx.get("h1", {}).get("sells", 0)),
                        buys_24h=int(tx.get("h24", {}).get("buys", 0)), sells_24h=int(tx.get("h24", {}).get("sells", 0)),
                        pair_address=p.get("pairAddress", ""), dex=p.get("dexId", ""),
                        created_at=created / 1000.0 if created else None)
                except (KeyError, TypeError):
                    continue
        return res

    def breakout(self, snap: Snapshot) -> Optional[bool]:
        """True if price is above the highest hourly high of the previous 24h and the last hour's volume
        is above its 24h mean. None if candle data is unavailable."""
        net = GT_NET.get(snap.chain)
        if not net or not snap.pair_address:
            return None
        data = self.http.get(f"{GT}/networks/{net}/pools/{snap.pair_address}/ohlcv/hour?aggregate=1&limit=26&currency=usd")
        try:
            rows = data["data"]["attributes"]["ohlcv_list"]           # newest first: [ts,o,h,l,c,v]
            prior = rows[1:25]
            if len(prior) < 12:
                return None
            hi = max(r[2] for r in prior)
            avg_v = sum(r[5] for r in prior) / len(prior)
            return snap.price_usd > hi and rows[0][5] > avg_v
        except (KeyError, TypeError, IndexError):
            return None

    def majors(self) -> Optional[dict]:
        data = self.http.get(f"{CG}/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&price_change_percentage=1h")
        try:
            return {d["id"]: float(d["price_change_percentage_1h_in_currency"]) for d in data}
        except (TypeError, KeyError, ValueError):
            return None

    # ---------- security ----------
    def security(self, chain: str, address: str) -> Optional[SecurityData]:
        if chain == "solana":
            data = self.http.get(f"{GP}/solana/token_security?contract_addresses={address}")
            r = ((data or {}).get("result") or {}).get(address) if isinstance(data, dict) else None
            return self._parse_solana(r) if r else None
        cid = GP_CHAIN.get(chain)
        if not cid:
            return None
        data = self.http.get(f"{GP}/token_security/{cid}?contract_addresses={address.lower()}")
        r = ((data or {}).get("result") or {}).get(address.lower()) if isinstance(data, dict) else None
        return self._parse_evm(r) if r else None

    @staticmethod
    def _b(v) -> Optional[bool]:
        return None if v in (None, "") else str(v) == "1"

    @staticmethod
    def _pct(v) -> Optional[float]:
        try:
            return float(v) * 100.0
        except (TypeError, ValueError):
            return None

    DEAD = ("0x000000000000000000000000000000000000dead", "0x0000000000000000000000000000000000000000")

    def _parse_evm(self, r: dict) -> SecurityData:
        b, pct = self._b, self._pct
        lp = r.get("lp_holders") or []
        lp_addrs = {h.get("address", "").lower() for h in lp}
        locked = sum(_f(h.get("percent")) for h in lp
                     if str(h.get("is_locked")) == "1" or h.get("address", "").lower() in self.DEAD)
        holders = [h for h in (r.get("holders") or [])
                   if h.get("address", "").lower() not in lp_addrs and h.get("address", "").lower() not in self.DEAD]
        top10 = sum(_f(h.get("percent")) for h in holders[:10]) * 100 if r.get("holders") else None
        hc = r.get("holder_count")
        return SecurityData(
            is_honeypot=b(r.get("is_honeypot")), buy_tax=pct(r.get("buy_tax")), sell_tax=pct(r.get("sell_tax")),
            is_open_source=b(r.get("is_open_source")), is_proxy=b(r.get("is_proxy")), mintable=b(r.get("is_mintable")),
            hidden_owner=b(r.get("hidden_owner")), can_take_back_ownership=b(r.get("can_take_back_ownership")),
            owner_change_balance=b(r.get("owner_change_balance")), transfer_pausable=b(r.get("transfer_pausable")),
            cannot_sell_all=b(r.get("cannot_sell_all")), trading_cooldown=b(r.get("trading_cooldown")),
            has_blacklist=b(r.get("is_blacklisted")), slippage_modifiable=b(r.get("slippage_modifiable")),
            selfdestruct=b(r.get("selfdestruct")), external_call=b(r.get("external_call")),
            creator_honeypot_history=b(r.get("honeypot_with_same_creator")), is_in_dex=b(r.get("is_in_dex")),
            holder_count=int(hc) if str(hc or "").isdigit() else None, top10_pct=top10,
            creator_pct=pct(r.get("creator_percent")), owner_pct=pct(r.get("owner_percent")),
            lp_locked_pct=locked * 100 if lp else None)

    def _parse_solana(self, r: dict) -> SecurityData:
        def st(key):
            v = r.get(key)
            return None if v is None else str((v or {}).get("status", "0")) == "1"
        fee = r.get("transfer_fee")
        has_fee = bool(fee) and fee != {}
        holders = r.get("holders") or []
        top10 = sum(_f(h.get("percent")) for h in holders[:10]) * 100 if holders else None
        burn = [_f(d.get("burn_percent")) for d in (r.get("dex") or [])]
        hc = r.get("holder_count")
        return SecurityData(
            is_solana=True, is_honeypot=False, buy_tax=0.0 if not has_fee else 100.0, sell_tax=0.0 if not has_fee else 100.0,
            mintable=st("mintable"), freezable=st("freezable"), closable=st("closable"),
            non_transferable=self._b(r.get("non_transferable")), owner_change_balance=st("balance_mutable_authority"),
            holder_count=int(hc) if str(hc or "").isdigit() else None, top10_pct=top10,
            lp_locked_pct=max(burn) if burn else None)
