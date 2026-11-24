/* ============================ live data providers (read-only public GET endpoints) ============================
 * DexScreener (prices, pairs), GeckoTerminal (new / trending pools, candles), GoPlus (token security), CoinGecko (majors).
 * No keys, no wallet. Any failure returns empty/null and the engine then fails closed (no data => no trade).
 */
const GT_NET = { solana: "solana", ethereum: "eth", base: "base", bsc: "bsc", arbitrum: "arbitrum" };
const GP_CHAIN = { ethereum: "1", bsc: "56", base: "8453", arbitrum: "42161" };
const MIN_GAP = { "api.dexscreener.com": 350, "api.geckoterminal.com": 2200, "api.gopluslabs.io": 2200, "api.coingecko.com": 3000 };
const nextAt = {}, coolUntil = {};
let health = { ok: 0, fail: 0, lastErr: "", byHost: {} };
const hostStat = h => health.byHost[h] || (health.byHost[h] = { ok: 0, fail: 0 });

async function getJSON(url) {
  const host = new URL(url).host, gap = (MIN_GAP[host] || 1000) * (DESK ? (host !== "api.dexscreener.com" ? 0.5 : 0.2) * ((typeof window !== "undefined" && window.DESKN) || 5) : 1),   // 5 desks share the free rate limits
    st = hostStat(host);
  if ((coolUntil[host] || 0) > Date.now()) { health.fail++; st.fail++; return null }                      // backing off after a rate limit
  const wait = Math.max(0, (nextAt[host] || 0) - Date.now());
  nextAt[host] = Math.max(Date.now(), nextAt[host] || 0) + gap;
  if (wait) await new Promise(r => setTimeout(r, wait));
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { accept: "application/json" } });
    if (r.status === 429) { coolUntil[host] = Date.now() + 30000; throw new Error("HTTP 429 rate limited, pausing 30s") }
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json(); health.ok++; st.ok++; return j;
  } catch (e) { health.fail++; st.fail++; health.lastErr = host + ": " + e.message; return null }
  finally { clearTimeout(to) }
}
const num = (x, d = 0) => { const n = parseFloat(x); return isFinite(n) ? n : d };
const int0 = x => { const n = parseInt(x, 10); return isFinite(n) ? n : 0 };

// ---- parsers (pure; unit-tested against recorded payload shapes) ----
function geckoPool(chain, pool) {
  try {
    const a = pool.attributes, addr = pool.relationships.base_token.data.id.split("_").slice(1).join("_"), tx = a.transactions || {}, v = a.volume_usd || {}, c = a.price_change_percentage || {};
    const h1 = tx.h1 || {}, h24 = tx.h24 || {};
    if (!addr) return null;
    return { chain, addr, sym: String(a.name || "?").split(" / ")[0].trim(), price: num(a.base_token_price_usd), liq: num(a.reserve_in_usd), fdv: num(a.fdv_usd),
      vol5: num(v.m5), vol1h: num(v.h1), vol6: num(v.h6), vol24: num(v.h24), chg5m: num(c.m5), chg1h: num(c.h1), chg6h: num(c.h6), chg24: num(c.h24),
      buys1h: int0(h1.buys), sells1h: int0(h1.sells), buyers1h: h1.buyers != null ? int0(h1.buyers) : null, sellers1h: h1.sellers != null ? int0(h1.sellers) : null,
      pair: a.address || "", created: a.pool_created_at ? Date.parse(a.pool_created_at) / 1000 : null };
  } catch (e) { return null }
}
function dexPair(chain, p) {
  try {
    const a = p.baseToken.address, liq = num((p.liquidity || {}).usd), tx = p.txns || {}, v = p.volume || {}, c = p.priceChange || {}, created = p.pairCreatedAt;
    return { chain, addr: a, sym: p.baseToken.symbol || "?", price: num(p.priceUsd), liq, fdv: num(p.fdv), vol5: num(v.m5), vol1h: num(v.h1), vol6: num(v.h6), vol24: num(v.h24),
      chg5m: num(c.m5), chg1h: num(c.h1), chg6h: num(c.h6), chg24: num(c.h24), buys1h: int0((tx.h1 || {}).buys), sells1h: int0((tx.h1 || {}).sells),
      buyers1h: null, sellers1h: null, pair: p.pairAddress || "", created: created ? created / 1000 : null };
  } catch (e) { return null }
}
const GP_DEAD = ["0x000000000000000000000000000000000000dead", "0x0000000000000000000000000000000000000000"];
function parseGoPlusEvm(r) {
  const b = v => v == null || v === "" ? null : String(v) === "1", pc = v => { const n = parseFloat(v); return isFinite(n) ? n * 100 : null };
  const lp = r.lp_holders || [], lpA = new Set(lp.map(h => (h.address || "").toLowerCase()));
  const locked = lp.filter(h => String(h.is_locked) === "1" || GP_DEAD.includes((h.address || "").toLowerCase())).reduce((a, h) => a + num(h.percent), 0);
  const hs = (r.holders || []).filter(h => !lpA.has((h.address || "").toLowerCase()) && !GP_DEAD.includes((h.address || "").toLowerCase()));
  return { honeypot: b(r.is_honeypot), buyTax: pc(r.buy_tax), sellTax: pc(r.sell_tax), openSource: b(r.is_open_source), proxy: b(r.is_proxy), mintable: b(r.is_mintable),
    hiddenOwner: b(r.hidden_owner), takeBack: b(r.can_take_back_ownership), ownerBal: b(r.owner_change_balance), pausable: b(r.transfer_pausable), cannotSellAll: b(r.cannot_sell_all),
    cooldown: b(r.trading_cooldown), blacklist: b(r.is_blacklisted), slipMod: b(r.slippage_modifiable), selfdestruct: b(r.selfdestruct), extCall: b(r.external_call),
    creatorHP: b(r.honeypot_with_same_creator), inDex: b(r.is_in_dex), holders: /^\d+$/.test(String(r.holder_count)) ? +r.holder_count : null,
    top10: r.holders ? hs.slice(0, 10).reduce((a, h) => a + num(h.percent), 0) * 100 : null, creator: pc(r.creator_percent), owner: pc(r.owner_percent), lpLocked: lp.length ? locked * 100 : null };
}
function parseGoPlusSol(r) {
  const st = k => r[k] == null ? null : String((r[k] || {}).status || "0") === "1";
  // pool vaults and locked accounts are not real holders: drop them, and treat a single >25% account as the AMM vault
  const POOL = /pool|raydium|orca|meteora|vault|amm|liquidity|bonding|pump/i;
  let hs0 = (r.holders || []).filter(h => !(String(h.is_locked) === "1" || POOL.test(String(h.tag || "") + String(h.name || ""))));
  if (hs0.length && num(hs0[0].percent) > 0.25) hs0 = hs0.slice(1);
  const fee = r.transfer_fee && Object.keys(r.transfer_fee).length > 0, hs = hs0, burn = (r.dex || []).map(x => num(x.burn_percent));
  return { sol: true, honeypot: false, buyTax: fee ? 100 : 0, sellTax: fee ? 100 : 0, mintable: st("mintable"), freezable: st("freezable"), closable: st("closable"),
    nonTransferable: r.non_transferable == null ? null : String(r.non_transferable) === "1", ownerBal: st("balance_mutable_authority"),
    holders: /^\d+$/.test(String(r.holder_count)) ? +r.holder_count : null, top10: (r.holders || []).length ? hs.slice(0, 10).reduce((a, h) => a + num(h.percent), 0) * 100 : null,
    lpLocked: burn.length ? Math.max(...burn) : null };
}

const LIVE = {
  async pools(chain, path, source) {
    const net = GT_NET[chain]; if (!net) return [];
    const d = await getJSON(`https://api.geckoterminal.com/api/v2/networks/${net}/${path}`);
    return ((d && d.data) || []).map(p => geckoPool(chain, p)).filter(Boolean).map(s => ({ chain, addr: s.addr, source, snap: s }));
  },
  _cycle: 0,
  async discoverNew(chains) {
    const cs = chains || CFG.chains; let o = []; const cyc = this._cycle++;
    // GeckoTerminal: three pages of newest pools per chain, rotated so the free rate limit is shared (page 1 every time, 2 and 3 alternate)
    const pages = [1, 2 + (cyc % 4)];   // page 1 every time, pages 2-5 in rotation: deeper into the list of brand-new pools
    for (const c of cs) for (const pg of pages) o = o.concat(await this.pools(c, `new_pools?page=${pg}`, "new"));
    // DexScreener: newest profiles and boosted tokens (id lists), then keyword searches that return full pair data for up to 30 pairs each
    for (const u of ["token-profiles/latest/v1", "token-boosts/latest/v1", "token-boosts/top/v1"]) { const pr = await getJSON("https://api.dexscreener.com/" + u); for (const p of Array.isArray(pr) ? pr : []) if (cs.includes(p.chainId) && p.tokenAddress) o.push({ chain: p.chainId, addr: p.tokenAddress, source: "new" }) }
    const KW = ["pepe", "dog", "cat", "ai", "trump", "pump", "moon", "frog", "elon", "baby", "inu", "coin", "meme", "gpt", "bull", "king", "sol", "base", "degen", "wif", "bonk", "chad", "giga", "retard", "pixel", "based", "tiger", "duck", "rocket", "gold", "shib", "floki", "popcat", "brett", "mog", "toshi", "goat", "pnut", "neiro", "mew", "bome", "slerf", "panda", "bear", "ape", "monkey", "penguin", "hamster", "cash", "money", "lambo", "pepe2", "wojak", "turbo", "kitty", "doge2", "sun", "moon2", "x", "grok", "agent", "bot", "fi", "dao"];
    // DexScreener allows ~300 calls/min (GeckoTerminal ~30), so most of the extra scanning goes here: 16 searches x up to 30 pairs per cycle
    for (let i = 0, N = DESK ? 6 : 16; i < N; i++) { const q = KW[(cyc * N + i + DESK * 5) % KW.length], d = await getJSON("https://api.dexscreener.com/latest/dex/search?q=" + q); for (const p of (d && d.pairs) || []) { if (!cs.includes(p.chainId)) continue; const s = dexPair(p.chainId, p); if (s && s.price > 0 && s.liq > 0) o.push({ chain: p.chainId, addr: s.addr, source: "new", snap: s }) } }
    return o;
  },
  async discoverTrending(chains) {
    const cs = chains || CFG.chains; let o = [];
    const pg = 1 + (this._tcycle = (this._tcycle || 0) + 1) % 3;
    for (const c of cs) { o = o.concat(await this.pools(c, "trending_pools?page=1", "trending")); o = o.concat(await this.pools(c, `pools?page=${pg}&sort=h24_volume_usd_desc`, "trending")) }
    return o;
  },
  async snapshots(chain, addrs) {
    const out = {};
    for (let i = 0; i < addrs.length; i += 30) {
      const d = await getJSON(`https://api.dexscreener.com/tokens/v1/${chain}/${addrs.slice(i, i + 30).join(",")}`);
      for (const p of Array.isArray(d) ? d : []) { const s = dexPair(chain, p); if (!s) continue; const cur = out[s.addr.toLowerCase()]; if (!cur || cur.liq < s.liq) out[s.addr.toLowerCase()] = s }
    }
    return out;
  },
  async breakout(s) {
    const net = GT_NET[s.chain]; if (!net || !s.pair) return null;
    const d = await getJSON(`https://api.geckoterminal.com/api/v2/networks/${net}/pools/${s.pair}/ohlcv/hour?aggregate=1&limit=26&currency=usd`);
    try {
      const rows = d.data.attributes.ohlcv_list, prior = rows.slice(1, 25);                    // newest first: [ts,o,h,l,c,v]
      if (prior.length < 12) return null;
      return s.price > Math.max(...prior.map(r => r[2])) && rows[0][5] > prior.reduce((a, r) => a + r[5], 0) / prior.length;
    } catch (e) { return null }
  },
  async majors() {
    const d = await getJSON("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&price_change_percentage=1h");
    try { const o = {}; for (const x of d) o[x.id] = +x.price_change_percentage_1h_in_currency; if (Object.keys(o).length && Object.values(o).every(isFinite)) return o } catch (e) { /* fall through to the backup source */ }
    // backup: 1h change of ETH, SOL and BTC from the deepest DexScreener pools
    const q = async (chain, addr, name) => { const r = await getJSON(`https://api.dexscreener.com/tokens/v1/${chain}/${addr}`); const ps = (Array.isArray(r) ? r : []).map(p => dexPair(chain, p)).filter(Boolean).sort((a, b) => b.liq - a.liq); return ps[0] && isFinite(ps[0].chg1h) && ps[0].liq > 1e6 ? [name, ps[0].chg1h] : null };
    const rs = await Promise.all([q("base", "0x4200000000000000000000000000000000000006", "ethereum"), q("solana", "So11111111111111111111111111111111111111112", "solana"), q("base", "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", "bitcoin")]);
    const o = {}; for (const x of rs) if (x) o[x[0]] = x[1];
    return Object.keys(o).length >= 2 ? o : null;
  },
  _sec: {},
  // one GoPlus call for many EVM tokens (it accepts a comma-separated list): turns 16 calls into 1
  async prefetchSecurity(cands) {
    const by = {}; for (const c of cands) if (c.chain !== "solana" && GP_CHAIN[c.chain] && !this._sec[c.chain + ":" + c.addr.toLowerCase()]) (by[c.chain] = by[c.chain] || []).push(c.addr.toLowerCase());
    for (const [ch, addrs] of Object.entries(by)) for (let i = 0; i < addrs.length; i += 25) {
      const part = addrs.slice(i, i + 25), d = await getJSON(`https://api.gopluslabs.io/api/v1/token_security/${GP_CHAIN[ch]}?contract_addresses=${part.join(",")}`), res = (d && d.result) || {};
      for (const a of part) { const r = res[a]; if (!r) continue; const sd = parseGoPlusEvm(r); if (!(sd.honeypot == null && sd.sellTax == null && sd.holders == null)) this._sec[ch + ":" + a] = { t: Date.now(), sd } }
    }
  },
  async security(chain, addr) {
    { const k = this._sec[chain + ":" + addr.toLowerCase()]; if (k && Date.now() - k.t < 120000) return k.sd }
    if (chain === "solana") {
      const d = await getJSON(`https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${addr}`);
      const r = d && d.result && d.result[addr]; if (!r) return null; const sd = parseGoPlusSol(r); return sd.mintable == null && sd.holders == null ? null : sd;
    }
    const cid = GP_CHAIN[chain]; if (!cid) return null;
    const lc = addr.toLowerCase(), d = await getJSON(`https://api.gopluslabs.io/api/v1/token_security/${cid}?contract_addresses=${lc}`);
    const r = d && d.result && d.result[lc]; if (!r) return null; const sd = parseGoPlusEvm(r); return sd.honeypot == null && sd.sellTax == null && sd.holders == null ? null : sd;   // empty report = not indexed yet
  },
  blocked() { return false },
  // One-tap check you can run on the phone: reachability (CORS / network) AND that the response shape still parses.
  async selfTest() {
    const out = [], raw = async url => { const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000); try { const r = await fetch(url, { signal: ctl.signal, headers: { accept: "application/json" } }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json() } finally { clearTimeout(to) } };
    const T = async (name, fn) => { const t0 = Date.now(); try { const r = await fn(); out.push({ name, ok: !!r.ok, ms: Date.now() - t0, detail: r.detail }) } catch (e) { out.push({ name, ok: false, ms: Date.now() - t0, detail: /Failed to fetch|Load failed|NetworkError/.test(String(e.message)) ? "blocked or offline (network / CORS)" : String(e.message || e) }) } };
    await T("DexScreener prices", async () => { const d = await raw("https://api.dexscreener.com/tokens/v1/base/0x4200000000000000000000000000000000000006"), s = Array.isArray(d) ? dexPair("base", d[0]) : null; return { ok: !!(s && s.price > 0 && s.liq > 0), detail: s ? `WETH $${s.price.toFixed(0)} · liquidity $${(s.liq / 1e6).toFixed(1)}M` : "unexpected response" } });
    await T("GeckoTerminal new pools", async () => { const d = await raw("https://api.geckoterminal.com/api/v2/networks/base/new_pools?page=1"), ps = ((d && d.data) || []).map(p => geckoPool("base", p)).filter(Boolean); return { ok: ps.length > 0 && ps.every(p => p.price >= 0), detail: `${ps.length} pools parsed` + (ps[0] ? `, unique buyers ${ps[0].buyers1h == null ? "n/a" : "ok"}` : "") } });
    await T("GoPlus token security", async () => { const a = "0xdac17f958d2ee523a2206206994597c13d831ec7", d = await raw(`https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=${a}`), r = d && d.result && d.result[a]; const sd = r ? parseGoPlusEvm(r) : null; return { ok: !!sd && sd.honeypot === false && sd.sellTax != null, detail: sd ? `USDT: honeypot ${sd.honeypot}, sell tax ${sd.sellTax}%, holders ${sd.holders}` : "unexpected response" } });
    await T("CoinGecko market", async () => { const d = await raw("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&price_change_percentage=1h"), x = d && d[0] && +d[0].price_change_percentage_1h_in_currency; return { ok: isFinite(x), detail: isFinite(x) ? `BTC 1h ${x.toFixed(2)}%` : "unexpected response" } });
    return out;
  },
};
