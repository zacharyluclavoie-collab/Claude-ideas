/* ============================ execution simulator ============================
 * Realistic frictions: constant-product price impact from the pool's real reserves, DEX fee, network fees (priority tips on
 * new tokens), latency (price keeps moving while the order lands, against you when flow follows your signal), sandwiching of
 * larger buys, dropped and reverted transactions, slippage limits, partial fills, token taxes, blocked sells.
 * In the demo market our swaps are applied to the pool, so we move the price like any other trader.
 */
const EXEC_LAT = { solana: 2.5, base: 4, bsc: 5, ethereum: 13, arbitrum: 3 };        // seconds from decision to inclusion
const EXEC_MEV = { solana: 0.22, base: 0.12, bsc: 0.35, ethereum: 0.30, arbitrum: 0.10 };
function gasUsd(chain, isNew) {
  const g = CFG.ex.gas[chain] ?? 0.5, tip = chain === "solana" && isNew ? 0.04 + rng() * 0.25 : 0;
  return g * (0.8 + rng() * 0.8) + tip;
}
function poolOf(snap) {
  if (MODE === "mock") { const t = MOCK.toks[snap.addr.toLowerCase()]; if (t) return { q: t.q, b: t.b, t, flow: t.flow } }
  const q = Math.max(snap.liq / 2, 1);
  return { q, b: q / Math.max(snap.price, 1e-18), t: null, flow: (snap.chg5m || 0) / 100 / 5 / 2 * 0.5 };   // per-minute net flow, inferred from the 5m move
}
// extra price move (fraction, >0 means against us) while the order is in flight
function driftAgainst(pool, side, lat) {
  const m = lat / 60, flowMove = Math.pow(1 + pool.flow * m, 2) - 1, noise = gauss() * 0.004 * Math.sqrt(Math.max(m, 0.02));
  return side === "buy" ? flowMove + noise : -flowMove + noise;
}
function simBuy0(s, usd, tax, isNew) {
  const x = CFG.ex, gas = gasUsd(s.chain, isNew), lat = (EXEC_LAT[s.chain] || 5) * (0.8 + rng() * 1.2) + 1;
  const pFail = x.fail + (isNew ? x.newFail : 0) + (s.chain === "solana" && isNew ? 0.06 : 0);
  if (rng() < pFail) return rng() < 0.6 ? { ok: false, why: "tx reverted, fee burned", gas, fee: 0, slip: 0 } : { ok: false, why: "tx dropped, no fill", gas: 0, fee: 0, slip: 0 };
  const pool = poolOf(s), tol = (isNew ? x.buyTolNew : x.buyTolTrend) / 100, fee = x.fee / 100;
  // size the pool can absorb inside the slippage limit
  const maxIn = pool.q * (Math.sqrt(1 + tol * 0.6) - 1) / (1 - fee);
  let partial = false, want = usd;
  if (usd > maxIn) { usd = maxIn; partial = true }
  if (isNew && rng() < x.partial) { usd *= 0.5 + rng() * 0.45; partial = true }
  if (usd < 1) return { ok: false, why: "no executable size", gas, fee: 0, slip: 0 };
  const dq = usd * (1 - fee), k = pool.q * pool.b, b2 = k / (pool.q + dq), tokPool = pool.b - b2;
  const impactPx = tokPool > 0 ? (usd / tokPool) / s.price - 1 : 1;                 // avg price paid vs mid, from pool math
  const drift = driftAgainst(pool, "buy", lat);
  let sandwich = 0;
  if (rng() < (EXEC_MEV[s.chain] || 0.2) * clamp(usd / 400, 0, 1)) sandwich = clamp(2 * impactPx + 0.005, 0, tol * 0.8);
  const total = impactPx + Math.max(drift, -0.01) + sandwich;
  if (total > tol) return { ok: false, why: `slippage ${(total * 100).toFixed(1)}% > ${(tol * 100).toFixed(1)}% limit, reverted`, gas, fee: 0, slip: total * 100 };
  if (pool.t) MOCK.buyQuote(pool.t, usd);
  const px = s.price * (1 + total), qty = usd / px * (1 - tax / 100);
  return { ok: true, why: (partial ? "filled (partial)" : "filled") + (sandwich ? ", sandwiched" : ""), qty, px, usd, fee: usd * fee, gas, slip: total * 100, partial, mev: sandwich > 0, lat };
}
function simSell0(s, qty, tax, urgent, attempt, blocked, extraTol) {
  const x = CFG.ex, gas = gasUsd(s.chain, false), lat = (EXEC_LAT[s.chain] || 5) * (0.8 + rng() * 1.2) + 1;
  if (blocked) return { ok: false, why: "sell reverted in pre-flight simulation (token restricts selling); no fee", gas: 0, fee: 0, slip: 0 };
  if (rng() < x.fail * (urgent ? 2 : 1)) return rng() < 0.6 ? { ok: false, why: "tx reverted, fee burned", gas, fee: 0, slip: 0 } : { ok: false, why: "tx dropped, no fill", gas: 0, fee: 0, slip: 0 };
  if (s.price <= 0 || s.liq <= 0) return { ok: false, why: "no liquidity", gas, fee: 0, slip: 0 };
  const pool = poolOf(s), fee = x.fee / 100, tol = Math.min((urgent ? x.maxEmSlip : x.maxSellSlip) + attempt * 2 + (extraTol || 0), extraTol >= 100 ? 99 : 60) / 100;
  let tokIn = qty * (1 - tax / 100), partial = false;
  // largest sale whose pool impact stays inside the limit: price impact of selling t tokens ~ 1-(b/(b+t))^2
  const maxTok = pool.b * (1 / Math.sqrt(1 - Math.min(tol * 0.7, 0.95)) - 1);
  if (tokIn > maxTok) { qty *= maxTok / tokIn; tokIn = maxTok; partial = true }
  const k = pool.q * pool.b, q2 = k / (pool.b + tokIn), outPool = (pool.q - q2) * (1 - fee);
  const mid = tokIn * s.price, impact = mid > 0 ? 1 - outPool / mid : 1;
  const drift = driftAgainst(pool, "sell", lat);
  let sandwich = 0;
  if (rng() < (EXEC_MEV[s.chain] || 0.2) * clamp(mid / 600, 0, 1) * 0.6) sandwich = clamp(2 * impact + 0.004, 0, tol * 0.8);
  const total = impact + Math.max(drift, -0.01) + sandwich;
  if (total > tol) return { ok: false, why: `slippage ${(total * 100).toFixed(1)}% > limit`, gas, fee: 0, slip: total * 100 };
  if (pool.t) MOCK.sellTokens(pool.t, tokIn);
  const out = Math.max(0, mid * (1 - total));
  return { ok: true, why: (partial ? "filled (partial)" : "filled") + (sandwich ? ", sandwiched" : ""), qty, px: s.price * (1 - total), usd: out, fee: mid * fee, gas, slip: total * 100, partial, mev: sandwich > 0, lat };
}
// liquidation value of a position: what selling it into the pool would return now
const exitValue = (qty, price, liq, tax) => { const val = qty * price, R = Math.max(liq / 2, 1); return val * R / (R + val) * (1 - tax / 100) * 0.997 };

// money is kept in whole cents: every cash amount a fill produces (spent, received, network fee) is rounded to the cent where it happens
const c2 = v => Math.round((v || 0) * 100) / 100;
function centsFill(f) { if (f) { if (f.gas != null) f.gas = c2(f.gas); if (f.usd != null) f.usd = c2(f.usd); if (f.fee != null) f.fee = c2(f.fee) } return f }
function simBuy(s, usd, tax, isNew) { return centsFill(simBuy0(s, usd, tax, isNew)) }
function simSell(s, qty, tax, urgent, attempt, blocked, extraTol) { return centsFill(simSell0(s, qty, tax, urgent, attempt, blocked, extraTol)) }
