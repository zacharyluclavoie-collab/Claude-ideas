/* ===================== V3: win more, lose less =====================
 * Ideas 1–6  the sell-block war (ON by default: they only skip coins that FAIL an actual sell test, or cap what an unproven coin can lose)
 * Idea 7     shared memory across desks (blocked coins, proven coins, block fingerprints), relayed by the Master once every simulated hour
 * Ideas 8–20 learning, sizing, exits and portfolio rules (each behind its own toggle, OFF until proven)
 * Everything is in whole cents where it touches money, and every decision is logged. */
const M3 = () => S.m3 || (S.m3 = { blk: {}, prov: {}, fps: [], out: [], hits: { checks: 0, probe: 0, mem: 0, finger: 0, same: 0 },
  enemy: { probeSkips: [], blocks: [], warn: 0, warnLoss: 0, instantFail: 0 }, sb: {}, sbc: {}, hour: {}, age: {}, auto: [], win: [], streak: 0, brakeLog: [],
  cold2: { f: 1, at: 0, log: [] }, dead: { n: 0, pnl: 0 }, re: { n: 0, w: 0, pnl: 0 }, reent: {}, largest: null, capBreach: [], v3s: { f: 1, gov: false, held: {}, bal: 0 } });
const v3c = x => Math.round((x || 0) * 100) / 100;
// fingerprint of a coin at buy time (Idea 5)
function v3fp(snap, sec) { return { chain: snap.chain, liq: snap.liq || 0, b: snap.buyers1h || 0, age: snap.ageMin || 0, h: (sec && sec.holders) || 0, top: (sec && sec.top10) || 0, sr: snap.buys1h ? (snap.sells1h || 0) / snap.buys1h : 0 } }
function v3sim(a, b) {   // 0..1: how alike two coins looked when they were bought
  const lg = (x, y) => Math.max(0, 1 - Math.abs(Math.log1p(x) - Math.log1p(y)) / Math.log(4));
  const s = [a.chain === b.chain ? 1 : 0, lg(a.liq, b.liq), lg(a.b, b.b), lg(a.age, b.age), lg(a.h, b.h), Math.max(0, 1 - Math.abs(a.top - b.top) / 25), Math.max(0, 1 - Math.abs(a.sr - b.sr) / 0.4)];
  return s.reduce((x, y) => x + y, 0) / s.length;
}
function v3block(addr, sym, chain, why, t, fp, loss) {   // add a coin to the shared blocklist (and its fingerprint), and queue it for the other desks
  const m = M3(); if (m.blk[addr]) return; m.blk[addr] = { sym, chain, why, t, loss: v3c(loss) }; if (fp) { m.fps.push({ sym, fp }); if (m.fps.length > 200) m.fps.shift() }
  m.out.push({ k: "blk", addr, sym, chain, why, t, fp: fp || null });
}
// the gate before any buy: shared blocklist (7), sell test (1), fingerprint (5), same-coin guard (18), signal down-weight (9). false = skip.
function v3Gate(snap, sec, k, src, t, ag, plan, v, com) {
  const MN = CFG.money || {}, m = M3(), addr = String(snap.addr).toLowerCase();
  const skip = (why, kind, ttl) => { stats.vetoed++; talk("risk", "committee", 2, "no", snap, why); feedAdd(snap, src, "vetoed", why, { checks: v.checks, score: plan.score, risk: v.risk }); rejected[k] = t + (ttl || 3600); { const w = "v3: " + kind; (stats.vwhy || (stats.vwhy = {}))[w] = ((stats.vwhy || {})[w] || 0) + 1 } return false };
  m.hits.checks++;
  if ((MN.probe || MN.finger) && m.blk[addr]) { m.hits.mem++; const b = m.blk[addr]; return skip(`On the shared blocklist (${b.why} on ${b.chain}): skipped`, "blocklist", 86400) }
  if (MN.probe && P().probe) { const pr = P().probe(snap.chain, snap.addr), thr = (+MN.probeTax || 10) * (m.v3s.gov ? 0.5 : 1);
    if (pr && (pr.blocked || pr.tax > thr)) { m.hits.probe++; const why = pr.blocked ? "sell-blocked in probe" : `sell tax ${pr.tax.toFixed(0)}% in probe (limit ${thr}%)`;
      const E = m.enemy.probeSkips; E.push({ sym: snap.sym, chain: snap.chain, t, why, liq: Math.round(snap.liq || 0) }); if (E.length > 200) E.shift();
      v3block(addr, snap.sym, snap.chain, why, t, v3fp(snap, sec), 0); ev("warn", "probe_skip", snap.sym, why + " — skipped");
      return skip(`${why} — skipped (a dust sell was simulated first; no money spent)`, "probe", 86400) } }
  if (MN.finger && m.fps.length) { const fp = v3fp(snap, sec); let best = null, bs = 0; for (const x of m.fps) { const s = v3sim(fp, x.fp); if (s > bs) { bs = s; best = x } }
    if (best && bs >= (+MN.fingerSim || 0.8)) { m.hits.finger++; return skip(`Looks ${Math.round(bs * 100)}% like ${best.sym}, a coin that blocked sells: skipped`, "fingerprint", 3600) } }
  if (MN.sameCoin) { const h = m.v3s.held[addr]; if (h && h.n >= 2) { m.hits.same++; return skip(`Already held by ${h.n} desks: skipped (same-coin guard)`, "same coin", 1800) }
    if (h && m.v3s.bal && h.usd > m.v3s.bal * (+MN.sameCoinPct || 5) / 100) { m.hits.same++; return skip(`Exposure to this coin is already ${fmt(h.usd)}: skipped`, "same coin", 1800) } }
  if ((MN.loserKeys && MN.loserKeys.length) || (MN.loserSkip && MN.loserSkip.length)) { const ab = snap.ageMin == null ? "?" : snap.ageMin < 60 ? "<1h" : snap.ageMin < 360 ? "1–6h" : snap.ageMin < 1440 ? "6–24h" : ">24h", key = ag.id + "|" + ab;   // T3 loser filter (trained on seeds 424242 + 777 only)
    if ((MN.loserSkip || []).includes(key)) return skip(`${key} made under $1 a trade in training (large sample): skipped`, "loser filter", 300);
    if (MN.loserKeys.includes(key) && com && com.ok < CFG.committeeMin + 1) return skip(`${key} lost money in training: needs one more confirming vote`, "loser filter", 300) }
  if (MN.sigWeight) { const sb = m.sb[ag.id]; if (sb && sb.n >= 100 && sb.pnl < 0 && com && com.ok < CFG.committeeMin + 1) return skip(`${AG[ag.id] ? AG[ag.id].name : ag.id} has lost money over ${sb.n} trades: needs one more vote`, "signal down-weighted", 300) }
  return true;
}
// size of a new buy: brake (12), cold v2 (14), expectancy buckets (13), stair/governor (19/20), then probe-first (2) and the loss cap (6)
function v3Size(usd, snap, ag, t, com) {
  const MN = CFG.money || {}, m = M3(), addr = String(snap.addr).toLowerCase(); let f = 1, needProbe = false; const notes = [];
  if (MN.brake && m.streak >= 5) { f *= m.streak >= 8 ? 0.25 : 0.5; needProbe = m.streak >= 8; notes.push(`brake ${m.streak} losses`) }
  if (MN.cold2) { f *= v3cold2(t).f }
  if (MN.expSize) { const sb = m.sb[ag.id]; if (sb && sb.n >= 30) { const e = sb.pnl / sb.n; const b = e >= 2 ? 1.5 : e >= 0.5 ? 1 : e >= 0 ? 0.5 : (com && com.ok >= CFG.committeeMin + 2 ? 0.5 : 0); if (!b) return { usd: 0, why: `setup expectancy ${fmt(e)} below $0: skipped` }; f *= b } }
  if (MN.stair || MN.governor) f *= m.v3s.f || 1;
  if (+MN.sizeMul && +MN.sizeMul !== 1) f *= +MN.sizeMul;   // V5 lever 1: position size multiplier
  if (MN.reentry && m.reent[addr] > t) { f *= 0.5; notes.push("re-entry") }
  usd = Math.min(usd * f, S.pf.cash * 0.95);
  const proven = !!m.prov[addr] && !needProbe; let probe = null;
  if (!proven && MN.probeFirst) { let e = usd * 0.25; if (MN.lossCap) e = Math.min(e, +MN.capUsd || 15); probe = { rest: v3c(usd - e), until: t + 900, done: false }; usd = e }
  else if (!proven && MN.lossCap) usd = Math.min(usd, +MN.capUsd || 15);
  return { usd, probe, f, reent: MN.reentry && m.reent[addr] > t, notes };
}
// Idea 14: cold/hot desk sizing v2 — full / 75% / 50% / 25% by the last 50 trades, at most one step change every 2 simulated hours
function v3cold2(t) { const m = M3(), c = S.pf.closed.slice(-50); if (c.length < 20) return m.cold2;
  const e = c.reduce((a, x) => a + x.pnl, 0) / c.length, f = e > 0.5 ? 1 : e > 0 ? 0.75 : e > -0.5 ? 0.5 : 0.25;
  if (f !== m.cold2.f && t - m.cold2.at >= 7200) { m.cold2.log.push({ t, from: m.cold2.f, to: f, e: v3c(e) }); if (m.cold2.log.length > 100) m.cold2.log.shift(); ev("info", "cold2", "", `Size step ${m.cold2.f}x → ${f}x (last 50 trades average ${fmt(e)})`); m.cold2.f = f; m.cold2.at = t }
  return m.cold2 }
// add the rest of a probe entry once the probe proved it can be sold (Idea 2)
function v3Add(p, s, usd, t) {
  const pf = S.pf, f = simBuy(s, usd, p.buyTax || 0, p.cat === "new"), x = FX();
  if (!f.ok) { pf.cash -= f.gas; pf.realized -= f.gas; pf.feesPaid += f.gas; x.addFail = (x.addFail || 0) + 1; x.burnBuy += f.gas; ev("warn", "add_failed", p.sym, f.why); return false }
  pf.cash -= f.usd + f.gas; pf.feesPaid += f.fee + f.gas; x.addOk = (x.addOk || 0) + 1;
  p.entry = (p.entry * p.qty + f.px * f.qty) / (p.qty + f.qty); p.qty += f.qty; p.qty0 += f.qty; p.cost += f.usd + f.gas; p.cost0 = v3c((p.cost0 || 0) + f.usd + f.gas); p.size0 += f.usd; p.fees += f.fee + f.gas;
  p.risk0 = (p.risk0 || 0) + f.usd * Math.max(0.01, 1 - p.stop / Math.max(1e-12, p.entry)); S.trades.unshift({ t, side: "buy", sym: p.sym, chain: p.chain, cat: p.cat, ok: true, note: "rest of the entry after the probe sold", usd: f.usd, px: f.px, slip: f.slip, fee: f.fee, gas: f.gas });
  talk("trader", "watcher", 2, "buy", p, `Probe sold fine: bought the rest (${fmt(f.usd, 0)})`); return true }
// per open position, every tick (not in an emergency): probe stage (2), instant 10% sell (3), sell-block warning (4), dead money (17), trailing ladder (15)
function v3Manage(p, s, t) {
  const MN = CFG.money || {}, m = M3(), V = p.v3 || (p.v3 = {}), addr = String(p.addr).toLowerCase(), key = p.chain + ":" + addr;
  if (V.probe && !V.probe.done) {
    if (t > V.probe.until) { V.probe.done = true; V.probe.fail = true; ev("warn", "probe_unproven", p.sym, "probe sell did not go through in 15 min: the rest was not bought"); return false }
    const ok = sellPos(p, s, 0.1 * (p.qty / Math.max(1e-12, p.qty0)), "probe_test", false, t);
    if (ok) { V.probe.done = true; m.prov[addr] = 1; m.out.push({ k: "prov", addr, t }); if (S.pf.positions[key] && V.probe.rest > 0.5) { if (v3Add(p, s, V.probe.rest, t) && MN.instant) V.inst = true } }
    return true }
  if (V.inst && !V.instDone) { V.instDone = true; const ok = sellPos(p, s, 0.1, "instant_sell_test", false, t);
    if (ok) { m.prov[addr] = 1; m.out.push({ k: "prov", addr, t }) } else if (S.pf.positions[key]) { m.enemy.instantFail++; p.emergency = "instant 10% sell test failed (sell may be blocked)"; ev("crit", "emergency", p.sym, p.emergency); talk("watcher", "risk", 2, "warn", p, "Instant sell test failed: running the exit ladder now") }
    return true }
  if (MN.warn && t >= (V.q || 0)) { V.q = t + 900; const pr = P().probe ? P().probe(p.chain, p.addr) : null, thr = (+MN.probeTax || 10) * (m.v3s.gov ? 0.5 : 1);
    if (pr && (pr.blocked || pr.tax > thr)) { m.enemy.warn++; V.warned = true; talk("watcher", "risk", 2, "warn", p, `Sell starting to block on ${p.sym} — exiting what we can now`); ev("crit", "sell_block_warning", p.sym, pr.blocked ? "sell quote blocked" : `sell tax ${pr.tax.toFixed(0)}%`);
      sellPos(p, s, 0.25, "sell_block_warning", true, t); if (S.pf.positions[key] && !p.emergency) p.emergency = "sell test failing: exiting"; return true } }
  if (MN.crashGuard) { const H = V.cgh || (V.cgh = []); H.push([t, s.price]); while (H.length && t - H[0][0] > 900) H.shift(); const hi = Math.max(...H.map(x => x[1]));   // M2 crash guard: -30% within 15 simulated minutes = exit now
    if (hi > 0 && s.price <= hi * 0.7) { p.emergency = `crash guard: down ${Math.round((1 - s.price / hi) * 100)}% in 15 min`; ev("crit", "emergency", p.sym, p.emergency); m.cgN = (m.cgN || 0) + 1; sellPos(p, s, 1, "EMERGENCY: " + p.emergency, true, t); return true } }
  if (MN.tp100 && !V.tp100 && s.price >= p.entry * 2) { V.tp100 = true; sellPos(p, s, 0.5, "take_profit_100", false, t); return true }   // V5 lever 4: at +100% sell half, the rest trails
  if (MN.pyramid && !V.pyr && s.price >= p.entry * 1.5 && p.stop > p.entry) { V.pyr = true; const pr = P().probe ? P().probe(p.chain, p.addr) : null;   // Idea C1: add to a proven winner once, after a fresh sell test
    if (!pr || (!pr.blocked && pr.tax <= (+MN.probeTax || 10))) { const add = v3c(Math.min(p.size0 * 0.4, S.pf.cash * 0.5)); if (add >= 1 && v3Add(p, s, add, t)) { m.pyr = (m.pyr || 0) + 1; V.pyrAdd = add; ev("info", "pyramid", p.sym, `winner +${Math.round((s.price / p.entry - 1) * 100)}%: added ${fmt(add)}`) } } return true }
  if (MN.dead && (t - p.opened) / 3600 >= (+MN.deadH || 6) && Math.abs(s.price / p.entry - 1) < 0.02) { sellPos(p, s, 1, "dead_money", false, t); return true }
  if (MN.trailLadder) { const g = p.peak / p.entry - 1, tr = g >= 0.5 ? 0.05 : g >= 0.25 ? 0.06 : g >= 0.10 ? 0.04 : 0;
    if (tr) p.stop = Math.max(p.stop, p.peak * (1 - tr)); if (g >= 0.5 && !V.bank50) { V.bank50 = true; sellPos(p, s, 0.25, "ladder_bank", false, t); return true } }
  return false }
// every finished trade feeds the scoreboards, the streak brake, the autopsy, the hour/age maps, the enemy tracker and the shared memory
function v3Closed(p, reason, t) {
  const MN = CFG.money || {}, m = M3(), pnl = v3c(p.real), win = pnl > 0, addr = String(p.addr).toLowerCase(), V = p.v3 || {};
  const sb = m.sb[p.agent || "launch"] || (m.sb[p.agent || "launch"] = { n: 0, w: 0, pnl: 0 }); sb.n++; if (win) sb.w++; sb.pnl = v3c(sb.pnl + pnl);
  const ck = (p.agent || "launch") + " + " + (p.cat || "?") + (p.mem ? " + memory" : ""), sc = m.sbc[ck] || (m.sbc[ck] = { n: 0, w: 0, pnl: 0 }); sc.n++; if (win) sc.w++; sc.pnl = v3c(sc.pnl + pnl);
  const h = new Date(p.opened * 1000).getUTCHours(), H = m.hour[h] || (m.hour[h] = { n: 0, pnl: 0 }); H.n++; H.pnl = v3c(H.pnl + pnl);
  const ab = V.ageMin == null ? "?" : V.ageMin < 60 ? "<1h" : V.ageMin < 360 ? "1–6h" : V.ageMin < 1440 ? "6–24h" : ">24h", A = m.age[ab] || (m.age[ab] = { n: 0, pnl: 0 }); A.n++; A.pnl = v3c(A.pnl + pnl);
  { const k2 = (p.agent || "launch") + "|" + ab, Q = (m.sba || (m.sba = {}))[k2] || (m.sba[k2] = { n: 0, w: 0, pnl: 0 }); Q.n++; if (win) Q.w++; Q.pnl = v3c(Q.pnl + pnl); const hb = (t - p.opened) < 1800 ? "<30m" : (t - p.opened) < 7200 ? "30m–2h" : ">2h", lq = (p.entryLiq || 0) < 20000 ? "<$20k" : (p.entryLiq || 0) < 100000 ? "$20–100k" : ">$100k", HL = (m.hl || (m.hl = {}))[hb + " · " + lq] || (m.hl[hb + " · " + lq] = { n: 0, w: 0, pnl: 0 }); HL.n++; if (win) HL.w++; HL.pnl = v3c(HL.pnl + pnl) }   // T1 loss autopsy: signal × coin age, hold time × liquidity
  const was = m.streak; m.streak = win ? 0 : m.streak + 1; if (MN.brake && !win && (m.streak === 5 || m.streak === 8)) { m.brakeLog.push({ t, streak: m.streak, f: m.streak >= 8 ? 0.25 : 0.5 }); ev("warn", "brake", "", `${m.streak} losses in a row: new buys at ${m.streak >= 8 ? "quarter" : "half"} size`) } else if (MN.brake && win && was >= 5) m.brakeLog.push({ t, streak: 0, f: 1 });
  const grp = /writeoff/.test(reason) ? "write_off" : String(reason).startsWith("EMERGENCY") ? "hard_exit" : reason;
  m.win.push([grp, pnl]); if (m.win.length > 200) m.win.shift(); m.autoN = (m.autoN || 0) + 1;
  if (m.autoN % 200 === 0) { const L = {}; let tot = 0; for (const [g, x] of m.win) if (x < 0) { L[g] = (L[g] || 0) + x; tot += x } for (const [g, x] of Object.entries(L)) if (tot < 0 && x / tot > 0.4) { const sh = Math.round(100 * x / tot); m.auto.push({ t, g, share: sh, loss: v3c(x), n: m.win.length }); if (m.auto.length > 50) m.auto.shift(); ev("warn", "autopsy", "", `${g} exits = ${sh}% of losses in the last 200 trades`); talk("risk", "committee", 2, "warn", null, `Autopsy: ${g} exits caused ${sh}% of losses in the last 200 trades`) } }
  if (/writeoff/.test(reason)) { v3block(addr, p.sym, p.chain, "written off", t, V.fp, pnl); m.enemy.blocks.push({ sym: p.sym, chain: p.chain, t, loss: pnl, proven: !!m.prov[addr], size: v3c(p.cost0) }); if (m.enemy.blocks.length > 200) m.enemy.blocks.shift() }
  else if (V.warned) { m.enemy.warnLoss = v3c(m.enemy.warnLoss + Math.min(0, pnl)); v3block(addr, p.sym, p.chain, "sell started to block", t, V.fp, pnl) }
  if (reason === "stop_loss" && MOCK && MOCK.toks) { (m.sw || (m.sw = [])).push({ a: addr, px: p.lastPx || p.last, t }); if (m.sw.length > 300) m.sw.shift() }   // stop-loss autopsy: does the coin recover after we exit?
  if (V.pyrAdd) { const P2 = m.pyrG || (m.pyrG = { n: 0, w: 0, pnl: 0 }); P2.n++; if (win) P2.w++; P2.pnl = v3c(P2.pnl + pnl) }
  if (reason === "dead_money") { m.dead.n++; m.dead.pnl = v3c(m.dead.pnl + pnl) }
  if (V.reent) { m.re.n++; if (win) m.re.w++; m.re.pnl = v3c(m.re.pnl + pnl) }
  if (MN.reentry && p.tp1Done && !V.reent) { m.reent[addr] = t + 3600; S.pf.cool[p.chain + ":" + addr] = t }
  if (!m.largest || pnl < m.largest.pnl) m.largest = { sym: p.sym, pnl, reason, proven: !!(V.provenAtBuy || m.prov[addr]), t };
  if (MN.lossCap && !V.provenAtBuy && !V.probe && pnl < -(+MN.capUsd || 15) - 0.005) m.capBreach.push({ sym: p.sym, pnl, reason });
}
// the Master's hourly message (shared memory from other desks, coin holdings, portfolio size factor)
function v3Apply(msg) { const m = M3(); for (const e of msg.mem || []) { if (e.k === "blk" && !m.blk[e.addr]) { m.blk[e.addr] = { sym: e.sym, chain: e.chain, why: e.why, t: e.t }; if (e.fp) { m.fps.push({ sym: e.sym, fp: e.fp }); if (m.fps.length > 200) m.fps.shift() } } else if (e.k === "prov") m.prov[e.addr] = 1 }
  m.v3s = { f: msg.f || 1, gov: !!msg.gov, held: msg.held || {}, bal: msg.bal || 0 } }
function v3Drain() { const m = M3(), o = m.out; if (m.sw && typeof MOCK !== "undefined" && MODE === "mock") { const now0 = vnow, A = m.swA || (m.swA = { n: 0, up10: 0, sum: 0 }); m.sw = m.sw.filter(x => { if (now0 - x.t < 7200) return true; const tk = MOCK.toks[x.a]; if (tk && x.px > 0) { const r = MOCK.price(tk) / x.px - 1; A.n++; A.sum += r; if (r > 0.10) A.up10++ } return false }) } m.out = []; const held = {}; for (const p of Object.values(S.pf.positions)) held[String(p.addr).toLowerCase()] = v3c(pv(p)); return { out: o, held, eq: Math.round(totalEquity() * 100) } }
// form (Idea 11): rolling expectancy over the last 20 / 50 / 200 trades and the last 50 results for a sparkline
function v3Form() { const c = S.pf.closed, e = n => { const x = c.slice(-n); return x.length ? v3c(x.reduce((a, y) => a + y.pnl, 0) / x.length) : null }; return { e20: e(20), e50: e(50), e200: e(200), spark: c.slice(-50).map(x => v3c(x.pnl)) } }
function v3Stats() { const m = M3(); return { hits: m.hits, enemy: { probeN: m.enemy.probeSkips.length, probe: m.enemy.probeSkips.slice(-12), blocks: m.enemy.blocks.slice(-20), warn: m.enemy.warn, warnLoss: m.enemy.warnLoss, instantFail: m.enemy.instantFail }, memN: Object.keys(m.blk).length, provN: Object.keys(m.prov).length, fpsN: m.fps.length,
  sba: m.sba || {}, hl: m.hl || {}, sw: m.swA || null, pyr: m.pyr || 0, pyrG: m.pyrG || null, sb: m.sb, sbc: m.sbc, hour: m.hour, age: m.age, auto: m.auto.slice(-10), streak: m.streak, brakeLog: m.brakeLog.slice(-20), cold2: { f: m.cold2.f, log: m.cold2.log.slice(-20) }, dead: m.dead, re: m.re, largest: m.largest, capBreach: m.capBreach.slice(-10), form: v3Form(), v3s: { f: m.v3s.f, gov: m.v3s.gov } } }
