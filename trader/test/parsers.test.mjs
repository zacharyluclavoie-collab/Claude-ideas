// Live-provider parsing against recorded API payload shapes. Run: BUNDLE=/path/engine_bundle.js node --test test/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { makeCtx, ev } from "./harness.mjs";
const fx = n => fs.readFileSync(new URL("./fixtures/" + n, import.meta.url), "utf8");
function ctxWith(map) {
  const ctx = makeCtx();
  ctx.__fx = map;
  ev(ctx, `getJSON = async (url) => { for (const [k, v] of Object.entries(__fx)) if (url.includes(k)) return JSON.parse(v); return null }`);
  return ctx;
}
async function run(ctx, code) { return JSON.parse(await ev(ctx, `(async()=>JSON.stringify(await (${code})))()`)) }

test("DexScreener pairs: picks deepest pool per token, skips malformed rows", async () => {
  const ctx = ctxWith({ "tokens/v1/base": fx("dexscreener_tokens.json") });
  const r = await run(ctx, `LIVE.snapshots("base",["0xAbCdEf0000000000000000000000000000000001"])`);
  const s = r["0xabcdef0000000000000000000000000000000001"];
  assert.ok(s, "snapshot present");
  assert.equal(s.liq, 250000.5); assert.equal(s.price, 0.01012); assert.equal(s.buys1h, 210); assert.equal(s.sells1h, 150);
  assert.equal(s.chg1h, 3.2); assert.equal(s.chg24, 25.3); assert.equal(s.created, 1730000000);
  assert.equal(s.pair, "0xPAIRaaa"); assert.equal(Object.keys(r).length, 2);   // second token is the malformed one with price 0, still parsed safely
});
test("GeckoTerminal new pools: fields, unique buyers, solana ids, malformed rows dropped", async () => {
  const ctx = ctxWith({ "new_pools": fx("gecko_new_pools.json") });
  const cands = await run(ctx, `LIVE.pools("base","new_pools?page=1","new")`);
  assert.equal(cands.length, 2);
  const a = cands[0].snap; assert.equal(a.addr, "0xTOKEN1"); assert.equal(a.sym, "NEWCOIN"); assert.equal(a.liq, 40123.77);
  assert.equal(a.buys1h, 160); assert.equal(a.buyers1h, 120); assert.equal(a.chg1h, 35.5); assert.equal(a.created, Date.parse("2025-11-22T08:00:00Z") / 1000);
  const b = cands[1].snap; assert.equal(b.addr, "MintAddr111"); assert.equal(b.buyers1h, null); assert.equal(b.liq, 180000);
});
test("GoPlus EVM: clean token", async () => {
  const ctx = ctxWith({ "token_security/8453": fx("goplus_evm.json") });
  const sd = await run(ctx, `LIVE.security("base","0xtoken1")`);
  assert.equal(sd.honeypot, false); assert.equal(sd.sellTax, 3); assert.equal(sd.buyTax, 1); assert.equal(sd.holders, 1523);
  assert.equal(Math.round(sd.lpLocked), 95); assert.equal(Math.round(sd.creator), 2);
  assert.equal(Math.round(sd.top10), 17);          // lp + burn addresses excluded: 0.08+0.05+0.04
  assert.equal(sd.mintable, false); assert.equal(sd.openSource, true);
});
test("GoPlus EVM: honeypot flagged, unknown fields stay null (fail closed)", async () => {
  const ctx = ctxWith({ "token_security/8453": fx("goplus_evm.json") });
  assert.equal((await run(ctx, `LIVE.security("base","0xhoney")`)).honeypot, true);
  assert.equal(await run(ctx, `LIVE.security("base","0xunknown")`), null);   // empty report = not indexed yet
  const v = await run(ctx, `evalSecurity(null,{liq:1e6,vol24:1,buys1h:0,sells1h:0,chg1h:0,chg5m:0,created:0},"new",0)`);
  assert.equal(v.pass, false);
});
test("GoPlus Solana: authorities, fee and burn", async () => {
  const ctx = ctxWith({ "solana/token_security": fx("goplus_sol.json") });
  const ok = await run(ctx, `LIVE.security("solana","MintAddr111")`);
  assert.equal(ok.sol, true); assert.equal(ok.mintable, false); assert.equal(ok.freezable, false); assert.equal(ok.sellTax, 0); assert.equal(ok.lpLocked, 99.5); assert.equal(Math.round(ok.top10), 9);
  const bad = await run(ctx, `LIVE.security("solana","RiskyMint")`);
  assert.equal(bad.mintable, true); assert.equal(bad.freezable, true); assert.equal(bad.sellTax, 100);
});
test("candles: breakout needs price above 24h high and volume above average", async () => {
  const ctx = ctxWith({ "ohlcv/hour": fx("gecko_ohlcv.json") });
  assert.equal(await run(ctx, `LIVE.breakout({chain:"base",pair:"0xp",price:1.3})`), true);
  assert.equal(await run(ctx, `LIVE.breakout({chain:"base",pair:"0xp",price:1.03})`), false);
});
test("CoinGecko majors and regime", async () => {
  const ctx = ctxWith({ "coins/markets": fx("coingecko_markets.json") });
  const m = await run(ctx, `LIVE.majors()`);
  assert.equal(m.bitcoin, -0.31); assert.equal(await run(ctx, `regimeOf(${JSON.stringify(m)})`), "ok");
  assert.equal(await run(ctx, `regimeOf({bitcoin:-9,ethereum:-8})`), "crash");
});
test("malformed or missing responses never throw and fail closed", async () => {
  const ctx = ctxWith({});
  assert.deepEqual(await run(ctx, `LIVE.snapshots("base",["0x1"])`), {});
  assert.equal(await run(ctx, `LIVE.security("base","0x1")`), null);
  assert.equal(await run(ctx, `LIVE.majors()`), null);
  assert.equal(await run(ctx, `LIVE.breakout({chain:"base",pair:"0xp",price:1})`), null);
});

test("majors fall back to DexScreener when CoinGecko is unreachable", async () => {
  const pool = (chg, liq) => JSON.stringify([{ chainId: "x", pairAddress: "p", baseToken: { address: "0xa", symbol: "W" }, priceUsd: "1", liquidity: { usd: liq }, priceChange: { h1: chg } }]);
  const ctx = ctxWith({ "tokens/v1/base": pool(-0.4, 5e7), "tokens/v1/solana": pool(-1.1, 2e7) });
  const m = await run(ctx, `LIVE.majors()`);
  assert.equal(m.ethereum, -0.4); assert.equal(m.solana, -1.1); assert.equal(await run(ctx, `regimeOf(${JSON.stringify(m)})`), "ok");
  const none = await run(ctxWith({}), `LIVE.majors()`); assert.equal(none, null);
});

test("Balanced mode: unknown values are risk points, not vetoes; known-bad still blocks; Strict vetoes unknowns", async () => {
  const ctx = makeCtx();
  const snap = `{chain:"base",addr:"0x1",sym:"A",price:1,liq:20000,vol24:30000,buys1h:90,sells1h:60,chg1h:10,chg5m:1,created:0}`;
  const sd = `{honeypot:null,buyTax:null,sellTax:null,openSource:true,proxy:false,mintable:false,hiddenOwner:false,takeBack:false,ownerBal:false,pausable:false,cannotSellAll:false,cooldown:false,blacklist:false,slipMod:false,selfdestruct:false,extCall:false,creatorHP:false,inDex:true,holders:null,top10:null,creator:null,owner:null,lpLocked:null}`;
  ev(ctx, `applySecMode("balanced")`);
  assert.equal(await run(ctx, `evalSecurity(${sd},${snap},"new",9999).pass`), true);
  assert.equal(await run(ctx, `evalSecurity(Object.assign(${sd},{honeypot:true}),${snap},"new",9999).pass`), false);
  assert.equal(await run(ctx, `evalSecurity(Object.assign(${sd},{sellTax:40}),${snap},"new",9999).pass`), false);
  ev(ctx, `applySecMode("strict")`);
  assert.equal(await run(ctx, `evalSecurity(${sd},${snap},"new",9999).pass`), false);
});
