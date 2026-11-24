/* ============================ Core sleeve: BTC / ETH / SOL trend following + idle-cash yield ============================
 * The research (reports/Profitable crypto strategies for small accounts.md) found that slow, volatility-sized trend following on the big,
 * liquid coins is one of the few approaches with published after-cost evidence, mainly because it steps aside in long bear markets.
 * Rules (kept simple on purpose, so they are hard to over-fit):
 *   - signal per coin = share of {10, 20, 50}-day moving averages that the price is above (0, 1/3, 2/3 or 1)
 *   - size = signal x min(1, 35% target volatility / the coin's 20-day volatility), split evenly across the 3 coins
 *   - looked at every 3 days; only trades when the target moved by more than 35% of a slot (fewer trades = lower costs)
 *   - every trade pays 0.3% fee + 0.05% slippage; cash not in coins earns a stablecoin-lending yield (default 3%/yr, Aave-style)
 * It lives in its own sub-account so its swings never trip the memecoin kill switches, and it never touches memecoin cash after setup.
 * Honest expectation: a few % a month in good trends, flat or small losses in choppy markets. It does not get rich quick.
 */
CFG.core = { cashYield: true, on: true, share: 0.4, lookbacks: [10, 20, 50], volTarget: 0.3, fee: 0.3, slip: 0.05, checkH: 72, band: 0.35, yieldApr: 3, ids: ["bitcoin", "ethereum", "solana"] };
const CORE_SYM = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL" };
const coreValue = () => { const c = S && S.core; if (!c) return 0; let v = c.cash; for (const id in c.qty) v += c.qty[id] * (c.px[id] || 0); return v };
const totalEquity = () => equity() + coreValue();
const totalStart = () => S.pf.start + (S.core ? S.core.start : 0);
function coreInit(t) {
  if (S.core || !CFG.core.on) return;
  const pf = S.pf, amt = Math.floor(Math.max(0, pf.cash * CFG.core.share)); if (amt < 50) return;
  pf.cash -= amt; pf.start -= amt; pf.peak = Math.max(0, pf.peak - amt); pf.dayStart = Math.max(0, pf.dayStart - amt);
  S.core = { cash: amt, start: amt, qty: {}, px: {}, hist: {}, fees: 0, lastCheck: 0, lastPx: 0, lastYield: t, yieldEarned: 0, trades: [], sig: {}, vol: {}, why: "" };
  ev("info", "core_on", "CORE", `core sleeve opened with ${fmt(amt, 0)} (BTC/ETH/SOL trend + cash yield)`);
}
function coreOff() {
  const c = S.core; if (!c) return; for (const id in c.qty) coreTrade(id, -c.qty[id] * (c.px[id] || 0), now(), "core sleeve switched off");
  const pf = S.pf; pf.cash += c.cash; pf.start += c.start; pf.peak += c.cash; pf.dayStart += c.cash; delete S.core; save();
}
/* ---- prices: live from CoinGecko (daily history once, then spot), demo from a regime-switching simulator with its own random stream ---- */
const CSIM = { r: null, px: null, d: null, f: null, t: 0, vol: { bitcoin: 0.55, ethereum: 0.7, solana: 0.9 } };
function csimStep(hours) {
  if (!CSIM.r) { CSIM.r = mulberry((SEED || 1) * 7 + 13); CSIM.px = { bitcoin: 60000, ethereum: 3000, solana: 140 }; CSIM.d = 0 }
  const g = () => { let u = 0, v = 0; while (!u) u = CSIM.r(); v = CSIM.r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) };
  for (let h = 0; h < hours; h++) {
    if (CSIM.r() < 1 / (24 * 25)) CSIM.d = g() * 0.6;                       // market trend regime: lasts ~25 days, annual drift ~N(0, 60%) -> zero on average
    const m = g();
    for (const id of CFG.core.ids) { const s = CSIM.vol[id] / Math.sqrt(8760), beta = id === "bitcoin" ? 1 : id === "ethereum" ? 1.2 : 1.5;
      CSIM.px[id] *= Math.exp(CSIM.d * beta / 8760 - s * s / 2 + s * (0.75 * m + 0.66 * g())) }
  }
}
async function coreQuotes(t) {
  const c = S.core;
  if (MODE === "live") {
    for (const id of CFG.core.ids) if (!c.hist[id] || c.hist[id].length < 55 || (c.histAt || 0) < t - 7 * 86400) {
      const d = await getJSON(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=120&interval=daily`);
      if (d && Array.isArray(d.prices) && d.prices.length > 55) { c.hist[id] = d.prices.slice(-120).map(p => [Math.floor(p[0] / 86400000), +p[1]]); c.histAt = t }
    }
    const q = await getJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${CFG.core.ids.join(",")}&vs_currencies=usd`);
    if (q) for (const id of CFG.core.ids) if (q[id] && q[id].usd > 0) c.px[id] = +q[id].usd;
  } else {
    if (!CSIM.r || !c.hist.bitcoin) { CSIM.r = null; csimStep(1); for (const id of CFG.core.ids) c.hist[id] = []; const day0 = Math.floor(t / 86400) - 120;
      for (let d = 0; d < 120; d++) { csimStep(24); for (const id of CFG.core.ids) c.hist[id].push([day0 + d, CSIM.px[id]]) } CSIM.t = t }
    const h = Math.floor((t - CSIM.t) / 3600); if (h > 0) { csimStep(h); CSIM.t += h * 3600 }
    for (const id of CFG.core.ids) c.px[id] = CSIM.px[id];
  }
  const day = Math.floor(t / 86400);
  for (const id of CFG.core.ids) { const H = c.hist[id]; if (!H || !(c.px[id] > 0)) continue; if (H.length && H[H.length - 1][0] === day) H[H.length - 1][1] = c.px[id]; else { H.push([day, c.px[id]]); if (H.length > 130) H.shift() } }
}
function coreSignal(id) {
  const c = S.core, H = c.hist[id]; if (!H || H.length < 55 || !(c.px[id] > 0)) return null;
  const cl = H.map(x => x[1]), p = c.px[id]; let s = 0;
  for (const L of CFG.core.lookbacks) { const w = cl.slice(-L), ma = w.reduce((a, b) => a + b, 0) / w.length; if (p > ma) s++ }
  const r = []; for (let i = cl.length - 20; i < cl.length; i++) r.push(Math.log(cl[i] / cl[i - 1]));
  const mu = r.reduce((a, b) => a + b, 0) / r.length, vol = Math.sqrt(r.reduce((a, b) => a + (b - mu) ** 2, 0) / (r.length - 1) * 365) || 1;
  return { sig: s / CFG.core.lookbacks.length, vol };
}
function coreTrade(id, usd, t, why) {
  const c = S.core, px = c.px[id]; if (!(px > 0) || Math.abs(usd) < 5) return;
  const cost = Math.abs(usd) * (CFG.core.fee + CFG.core.slip) / 100;
  if (usd > 0) { usd = Math.min(usd, c.cash - cost); if (usd < 5) return; c.cash -= usd + cost; c.qty[id] = (c.qty[id] || 0) + usd / px }
  else { const q = Math.min(c.qty[id] || 0, -usd / px); if (q <= 0) return; c.qty[id] -= q; c.cash += q * px - cost; if (c.qty[id] * px < 1) delete c.qty[id] }
  c.fees += cost; c.trades.unshift({ t, sym: CORE_SYM[id], side: usd > 0 ? "buy" : "sell", usd: Math.abs(usd), px, why }); if (c.trades.length > 100) c.trades.length = 100;
  ev("info", "core_" + (usd > 0 ? "buy" : "sell"), CORE_SYM[id], `${why}: ${usd > 0 ? "buy" : "sell"} ${fmt(Math.abs(usd), 0)} @ ${px.toPrecision(5)}`);
}
// idle trading cash earns a stablecoin-lending rate too (Aave-style, about 2-5% a year): small, but money is never just sitting still
function cashYield(t) { const pf = S.pf; if (!CFG.core.cashYield) { pf.lastYield = t; return } const dt = Math.max(0, t - (pf.lastYield || t)); pf.lastYield = t; if (dt <= 0 || dt > 7 * 86400 || pf.cash <= 0) return;
  const y = pf.cash * CFG.core.yieldApr / 100 * dt / (365 * 86400); pf.cash += y; pf.realized += y; pf.yieldEarned = (pf.yieldEarned || 0) + y; dayAdd(y, t) }
async function coreStep(t) {
  cashYield(t);
  if (!CFG.core.on) { if (S.core) coreOff(); return } coreInit(t); const c = S.core; if (!c) return;
  if (t - (c.lastPx || 0) < (MODE === "live" ? 600 : 3600)) return; c.lastPx = t;
  // stablecoin-lending yield on the sleeve's idle cash
  const dt = Math.max(0, t - (c.lastYield || t)); if (dt > 0) { const y = c.cash * CFG.core.yieldApr / 100 * dt / (365 * 86400); c.cash += y; c.yieldEarned += y; c.lastYield = t }
  await coreQuotes(t);
  if (t - (c.lastCheck || 0) < CFG.core.checkH * 3600) return;
  const tot = coreValue(), n = CFG.core.ids.length; let traded = false;
  for (const id of CFG.core.ids) {
    const s = coreSignal(id); if (!s) { c.why = "waiting for price history"; continue }
    c.sig[id] = s.sig; c.vol[id] = s.vol;
    const target = tot / n * s.sig * Math.min(1, CFG.core.volTarget / s.vol), cur = (c.qty[id] || 0) * c.px[id], diff = target - cur;
    if ((s.sig === 0 && cur > 1) || Math.abs(diff) > CFG.core.band * tot / n) { coreTrade(id, diff, t, s.sig === 0 ? "trend down: step aside" : `trend ${Math.round(s.sig * 3)}/3, vol ${(s.vol * 100).toFixed(0)}%`); traded = true }
  }
  c.lastCheck = t; c.why = traded ? "rebalanced" : "holding (no change needed)"; save();
}
