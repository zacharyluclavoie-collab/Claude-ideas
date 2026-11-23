// Exercises the REAL live code path (LIVE provider, parsers, scan, security, risk, execution) against a fake HTTP layer that
// returns API payloads shaped like DexScreener / GeckoTerminal / GoPlus / CoinGecko. Network is stubbed; everything else is production code.
//   node test/live_sim.mjs [seconds] [mode]     mode: normal | nosec | nomarket | empty
import { makeCtx, ev } from "./harness.mjs";
const SECS = +process.argv[2] || 25, MODE = process.argv[3] || "normal";
let seed = 12345; const r = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const ln = (m, s) => m * Math.exp(s * (r() + r() + r() - 1.5) * 1.1);
const hex = n => "0x" + [...Array(40)].map(() => "0123456789abcdef"[Math.floor(r() * 16)]).join("");
const b58 = () => [...Array(44)].map(() => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789"[Math.floor(r() * 57)]).join("");
const NET = { base: "base", solana: "solana", ethereum: "eth", bsc: "bsc" }, TOK = {};
for (const chain of Object.keys(NET)) {
  TOK[chain] = [...Array(45)].map((_, i) => {
    const addr = chain === "solana" ? b58() : hex(), liq = ln(20000, 1.1), ageMin = 15 + r() * 1200;
    const good = r() < 0.7, bp = 0.45 + r() * 0.3, tx = Math.floor(ln(180, 1)), vol1h = liq * (0.3 + r() * 3);
    return { chain, addr, sym: ["PEPE", "DOGE", "WOJAK", "CAT", "FROG", "AI", "MOON", "BONK"][i % 8] + i, price: Math.pow(10, -7 + r() * 5), liq, ageMin, tx, bp, vol1h,
      chg: [r() * 4 - 1, r() * 40 - 5, r() * 60 - 10, r() * 80 - 20], good, pair: hex(), holders: Math.floor(ln(400, 1)), top10: 10 + r() * 40, lp: r() < 0.6 ? 90 + r() * 10 : r() * 30, verified: r() < 0.75, mint: r() < 0.08, honey: r() < 0.06, unkTax: r() < 0.25, empty: r() < 0.15, created: Date.now() - ageMin * 60000 };
  });
}
const pair = t => ({ chainId: t.chain, dexId: "x", pairAddress: t.pair, baseToken: { address: t.addr, name: t.sym, symbol: t.sym }, priceUsd: String(t.price * (1 + (r() - 0.5) * 0.004)), txns: { m5: { buys: 5, sells: 4 }, h1: { buys: Math.round(t.tx * t.bp), sells: Math.round(t.tx * (1 - t.bp)) }, h6: { buys: 900, sells: 800 }, h24: { buys: 4000, sells: 3900 } },
  volume: { m5: t.vol1h / 12, h1: t.vol1h, h6: t.vol1h * 5, h24: t.vol1h * 14 }, priceChange: { m5: t.chg[0], h1: t.chg[1], h6: t.chg[2], h24: t.chg[3] }, liquidity: { usd: t.liq }, fdv: t.liq * 8, pairCreatedAt: t.created });
const gpEvm = t => t.empty ? {} : { is_honeypot: t.honey ? "1" : "0", buy_tax: t.unkTax ? "" : "0.01", sell_tax: t.unkTax ? "" : "0.02", is_open_source: t.verified ? "1" : "0", is_proxy: "0", is_mintable: t.mint ? "1" : "0", hidden_owner: "0", can_take_back_ownership: "0", owner_change_balance: "0", transfer_pausable: "0", cannot_sell_all: "0", trading_cooldown: "0", is_blacklisted: "0", slippage_modifiable: "0", selfdestruct: "0", external_call: "0", honeypot_with_same_creator: "0", is_in_dex: "1", holder_count: String(t.holders), creator_percent: String((r() * 0.06).toFixed(4)), owner_percent: "0",
  lp_holders: [{ address: "0xlp", is_locked: t.lp > 50 ? 1 : 0, percent: String(t.lp / 100) }], holders: [{ address: "0xlp", percent: "0.4" }, ...[...Array(10)].map((_, i) => ({ address: "0xh" + i, percent: String((t.top10 / 1000).toFixed(4)) }))] };
const gpSol = t => t.empty ? {} : { mintable: { status: t.mint ? "1" : "0" }, freezable: { status: "0" }, closable: { status: "0" }, non_transferable: "0", balance_mutable_authority: { status: "0" }, transfer_fee: {}, holder_count: String(t.holders), holders: [{ account: "pool", percent: "0.35", tag: "raydium pool" }, ...[...Array(10)].map((_, i) => ({ account: "h" + i, percent: String((t.top10 / 1000).toFixed(4)) }))], dex: [{ type: "raydium", burn_percent: t.lp }] };
const ctx = makeCtx(), log = { calls: 0 };
ctx.__api = async url => {
  log.calls++;
  const u = new URL(url);
  if (u.host === "api.geckoterminal.com") {
    const m = u.pathname.match(/networks\/(\w+)\/(new_pools|trending_pools|pools)$/); if (m) { const chain = Object.keys(NET).find(c => NET[c] === m[1]); return { data: TOK[chain].slice(0, 20).map(t => ({ id: m[1] + "_" + t.pair, type: "pool", attributes: { base_token_price_usd: String(t.price), name: t.sym + " / WETH", pool_created_at: new Date(t.created).toISOString(), fdv_usd: String(t.liq * 8), price_change_percentage: { m5: String(t.chg[0]), h1: String(t.chg[1]), h6: String(t.chg[2]), h24: String(t.chg[3]) }, transactions: { h1: { buys: Math.round(t.tx * t.bp), sells: Math.round(t.tx * (1 - t.bp)), buyers: Math.round(t.tx * t.bp * 0.7), sellers: Math.round(t.tx * 0.3) } }, volume_usd: { m5: String(t.vol1h / 12), h1: String(t.vol1h), h6: String(t.vol1h * 5), h24: String(t.vol1h * 14) }, reserve_in_usd: String(t.liq), address: t.pair }, relationships: { base_token: { data: { id: m[1] + "_" + t.addr, type: "token" } } } })) } }
    if (/ohlcv/.test(u.pathname)) return null;
  }
  if (u.host === "api.dexscreener.com") {
    if (u.pathname.startsWith("/token-profiles") || u.pathname.startsWith("/token-boosts")) return [];
    if (u.pathname.startsWith("/latest/dex/search")) { const all = Object.values(TOK).flat(); return { pairs: all.filter(() => r() < 0.1).slice(0, 30).map(pair) } }
    const m = u.pathname.match(/tokens\/v1\/(\w+)\/(.+)$/); if (m) { const addrs = decodeURIComponent(m[2]).split(","); const out = []; for (const a of addrs) { const t = (TOK[m[1]] || []).find(x => x.addr.toLowerCase() === a.toLowerCase()); if (t) out.push(pair(t)); else if (/4200000000000000000000000000000000000006|So1111|cbB7/.test(a)) out.push({ chainId: m[1], pairAddress: "p", baseToken: { address: a, symbol: "W" }, priceUsd: "1", liquidity: { usd: 5e7 }, priceChange: { h1: -0.2 } }) } return out }
  }
  if (u.host === "api.gopluslabs.io") {
    if (MODE === "nosec") return null;
    const sol = /solana\/token_security/.test(u.pathname), list = u.searchParams.get("contract_addresses").split(","), all = Object.values(TOK).flat(), result = {};
    for (const a of list) { const t = all.find(x => x.addr.toLowerCase() === a.toLowerCase()); if (t) result[sol ? a : a.toLowerCase()] = sol ? gpSol(t) : gpEvm(t) }
    log.sec = (log.sec || 0) + 1; return { code: 1, message: "OK", result };
  }
  if (u.host === "api.coingecko.com") { if (MODE === "nomarket") return null; return [{ id: "bitcoin", price_change_percentage_1h_in_currency: 0.1 }, { id: "ethereum", price_change_percentage_1h_in_currency: -0.2 }, { id: "solana", price_change_percentage_1h_in_currency: 0.3 }] }
  return null;
};
ev(ctx, `getJSON = async (url) => { const j = await __api(url); if (j == null) { health.fail++; health.lastErr = "stub: no data"; return null } health.ok++; return j }`);
ev(ctx, `MODE="live";rng=mulberry(3);load();last={};stats=freshStats();regime="unknown";regimeOk=now();S.curve=[[now(),equity()]];applySecMode("balanced");applyActivity("active");CFG.keep.on=false;`);
const t0 = Date.now();
while (Date.now() - t0 < SECS * 1000) { await ev(ctx, `Promise.all([stepFast(now()),stepSlow(now()),stepScan(now())])`); await new Promise(r => setTimeout(r, 200)) }
const out = JSON.parse(ev(ctx, `JSON.stringify({mode:${JSON.stringify(MODE)},uniq:stats.uniq,checks:stats.scanned,strat:stats.strat,sec:stats.sec,vetoed:stats.vetoed,bought:stats.bought,open:Object.keys(S.pf.positions).length,regime,secNull:stats.secNull||0,gated:stats.gated||0,
  rej:Object.entries(stats.rejWhy||{}).sort((a,b)=>b[1]-a[1]).slice(0,4),secWhy:Object.entries(stats.secWhy||{}).sort((a,b)=>b[1]-a[1]).slice(0,5),vwhy:Object.entries(stats.vwhy||{}).sort((a,b)=>b[1]-a[1]).slice(0,4),journal:S.journal.filter(j=>["buy","buy_failed","auto_relax","error"].includes(j.kind)).slice(0,3).map(j=>j.kind+": "+j.msg.slice(0,90))})`));
out.goplusCalls = log.sec; out.apiCalls = log.calls;
console.log(JSON.stringify(out, null, 1));
