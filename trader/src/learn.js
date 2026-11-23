/* ============================ learning phase, committee review, profit-funded growth ============================
 * 1. SHADOW TRADING: every agent that likes a coin records a virtual trade (no money) with the same stops, targets and realistic costs.
 *    An agent only gets real money after it has proven itself on those virtual trades (and later on real ones).
 * 2. COMMITTEE: many agents can study the same coin at once. A real trade needs a proven lead agent AND at least 3 of 5 independent
 *    reviewers (not chasing, two-sided flow, real buyers, enough depth, market not falling). More approvals = slightly larger size.
 * 3. GROWTH FROM PROFIT ONLY: position size can rise (up to 2x) only as realised profit builds, and never while in a drawdown.
 */
CFG.learn = { probation: true, on: true, minTrades: 12, minExp: 0.05, minWin: 0.45, maxShadow: 400, perAgent: 100 };
function agentProven(id) { if (!CFG.learn.on) return true; const a = agentStat(id), sw = AG[id] && AG[id].swarm; if (sw && !CFG.swarmReal) return false; if (a.n < (sw ? 30 : CFG.learn.minTrades)) return false; return a.r / a.n >= (sw ? 0.15 : CFG.learn.minExp) && a.w / a.n >= (sw ? 0.5 : CFG.learn.minWin) }
// probation: an agent without a clear bad record may trade real money at 40% size while it keeps practising (faster, still capped)
function agentExploring(id, t) { if (!CFG.learn.probation || (AG[id] && AG[id].swarm)) return false; const last = S.lastOpenAt || 0; if (t - last < 1800) return false; let best = null, be = -9; for (const a of AGENTS) { if (!agentOn(a.id) || a.swarm) continue; const s = agentStat(a.id), e = s.n ? s.r / s.n : 0; if (e > be) { be = e; best = a.id } } return best === id }
function agentProbation(id) { if (!CFG.learn.on || agentProven(id) || !CFG.learn.probation || (AG[id] && AG[id].swarm)) return false; const a = agentStat(id); return a.n < 8 || a.r / a.n > -0.25 }
function agentLearning(id) { const a = agentStat(id); return { n: a.n, need: CFG.learn.minTrades, proven: agentProven(id) } }
function pickAll(s, t, source) {
  const hits = []; let why = null; const age = ageH(s, t), b = bp(s), off = CFG.agentsOff || {};
  for (const a of AGENTS) {
    if (a.c) {   // scouts: cheap shared pre-filter so 300 of them cost almost nothing per coin
      const c = a.c; if (CFG.swarmOff || s.liq < c.liq || s.chg1h < c.c1[0] || s.chg1h > c.c1[1] || s.chg5m < c.c5 || b < c.bp || off[a.id]) continue;
      if (c.est ? (age == null || age < CFG.tr.minAgeH) : (age == null || age < c.age[0] || age > c.age[1])) continue;
    }
    if (!agentOn(a.id) || !ageOK(a, s, t)) continue;
    const [plan, rej] = a.run(s, t, true), T = AGENT_TUNE[a.id] || {};
    if (plan && T.bp && bp(s) < 0.5 + T.bp) { if (!why) why = "buy pressure below tuned bar"; continue }
    if (plan && T.liq && s.liq < CFG.sec.liqNew * T.liq) { if (!why) why = "liquidity below tuned bar"; continue }
    if (plan && T.vlr && _vlr(s) < T.vlr) { if (!why) why = "turnover below tuned bar"; continue }
    if (plan) hits.push({ agent: a, plan }); else if (!why) why = rej[0];
  }
  return { hits, why: why || "no agent matched" };
}
function quickPlan(plan, id) { if (!CFG.quick.on) return plan; const q = Object.assign({}, CFG.quick, (AG[id] && AG[id].quick) || {}, (AGENT_TUNE[id] || {}).quick || {}); return Object.assign({}, plan, { stop: q.stop, tp1: q.tp1, tp2: q.tp2, trail: q.trail, rr: q.tp1 / q.stop }) }
function reviewers(s, cat) {
  const u = _uniq(s);
  const r = [
    ["not chasing", s.chg1h <= 60 && s.chg5m >= -3],
    ["two-sided flow", s.sells1h >= s.buys1h * 0.2],
    ["real buyers", u == null || u >= 0.5],
    ["enough depth", s.liq >= 20000 || cat === "trending"],
    ["market not falling", regime === "ok"],
  ];
  return { ok: r.filter(x => x[1]).length, list: r };
}
function growth() { const pf = S.pf; const inDD = equity() < pf.peak * 0.97; return inDD ? 1 : 1 + clamp(pf.realized / pf.start * 5, 0, 1) }

/* ---- shadow (virtual) trades ---- */
function shadowOpen(snap, h, t) {
  const sh = S.shadow || (S.shadow = {}), k = h.agent.id + "|" + snap.chain + ":" + snap.addr.toLowerCase();
  const rc = S.shadowRecent || (S.shadowRecent = {}); if (sh[k] || (rc[k] && t - rc[k] < 21600)) return false;
  const sw = !!h.agent.swarm, mine = Object.values(sh), nSw = mine.filter(x => x.sw).length; if (sw ? nSw >= 500 : mine.length - nSw >= CFG.learn.maxShadow) return false; if (mine.filter(x => x.agent === h.agent.id).length >= (sw ? 3 : CFG.learn.perAgent)) return false;
  const p = quickPlan(h.plan, h.agent.id), usd = clamp(snap.liq * 0.004, 15, 60);   // about the size a real trade would get
  sh[k] = { fx: lessonFx(snap, t, h.agent), sw: !!h.agent.swarm, agent: h.agent.id, chain: snap.chain, addr: snap.addr, sym: snap.sym, cat: h.agent.cat, opened: t, entry: snap.price, last: snap.price, peak: snap.price, usd, stop: snap.price * (1 - p.stop / 100), tp1: snap.price * (1 + p.tp1 / 100), tp2: snap.price * (1 + p.tp2 / 100), trail: p.trail, tp1Done: false, real: 0, frac: 1, liq0: snap.liq, liq: snap.liq, stopPct: p.stop };
  return true;
}
function shadowCost(sh) { const R = Math.max(sh.liq0 / 2, 1), gas = 2 * (CFG.ex.gas[sh.chain] ?? 0.5) * 1.2; return sh.usd * (2 * CFG.ex.fee / 100 + 2 * sh.usd / R + 0.006) + gas }
function shadowClose(sh, key, why, t, px) {
  const sd = S.shadow; delete sd[key]; (S.shadowRecent || (S.shadowRecent = {}))[key] = t;
  const price = px ?? sh.last, leg = sh.frac * sh.usd * (price / sh.entry - 1), pnl = sh.real + leg - shadowCost(sh) * (sh.tp1Done ? 1 : 1), r = pnl / (sh.usd * sh.stopPct / 100);
  const A = S.pf.ag || (S.pf.ag = {}), a = A[sh.agent] || (A[sh.agent] = { n: 0, pnl: 0, w: 0, r: 0 });
  a.n++; a.pnl += pnl; a.w += pnl > 0 ? 1 : 0; a.r += r; a.sn = (a.sn || 0) + 1; lessonAdd(sh.fx, r);
  const L = S.shadowLog || (S.shadowLog = []); L.unshift({ t, agent: sh.agent, sym: sh.sym, pnl, r, why }); if (L.length > 150) L.length = 150;
  if (agentProven(sh.agent) && !sh.announced && a.n === CFG.learn.minTrades) ev("info", "agent_proven", sh.agent, "agent passed its learning phase and may now trade real money");
}
function shadowUpdate(snaps, t) {
  const sd = S.shadow; if (!sd) return;
  for (const [key, sh] of Object.entries(sd)) {
    const s = snaps[sh.chain + ":" + sh.addr.toLowerCase()], maxH = (sh.cat === "new" ? CFG.nw.maxHoldH : CFG.tr.maxHoldH) * 3600;
    if (!s || s.price <= 0) { if (t - sh.opened > maxH) shadowClose(sh, key, "no price", t); continue }
    const prevL = sh.liq; sh.last = s.price; sh.liq = s.liq; sh.peak = Math.max(sh.peak, s.price);
    if (s.liq < sh.liq0 * 0.5 || (prevL > 0 && s.liq < prevL * 0.7)) { shadowClose(sh, key, "liquidity pulled", t, sh.last * 0.6); continue }   // exit into a drained pool is costly
    const px = s.price;
    if (sh.tp1Done) sh.stop = Math.max(sh.stop, sh.entry * 1.01, sh.peak * (1 - sh.trail / 100)); else if (px >= sh.entry * (1 + (sh.tp1 / sh.entry - 1) / 2)) sh.stop = Math.max(sh.stop, sh.entry * 1.01);
    if (px <= sh.stop) shadowClose(sh, key, "stop", t, px * 0.995);
    else if (!sh.tp1Done && px >= sh.tp1) { const f = CFG.tp1Frac; sh.real += f * sh.usd * (px / sh.entry - 1); sh.frac -= f; sh.tp1Done = true }
    else if (sh.tp1Done && px >= sh.tp2) shadowClose(sh, key, "target", t, px)
    else if (t - sh.opened > maxH) shadowClose(sh, key, "time", t, px);
  }
}

/* ---- lessons: learn from every finished trade (real AND practice), above all from the failures ----
 * Each trade is described by a few plain features at entry (1h move, 5m move, buy share, liquidity, age, turnover, chain, agent).
 * Every close adds its result (in R) to each feature's bucket, with slow forgetting so recent markets count more.
 * A new real trade is blocked when trades that looked like it have lost on average (needs enough history first).
 * Practice trades are never blocked, so the lessons keep getting tested and can change their mind.
 */
CFG.swarmReal = false;   // testing: scouts that "proved" themselves on practice trades lost money with real money (mostly luck among 300), so scouts only practise and teach the lessons
CFG.lessons = { on: true, minSamples: 150, minPred: -0.12, k: 30, decay: 0.998 };
const _band = (v, cuts) => { if (v == null || !isFinite(v)) return "na"; let i = 0; while (i < cuts.length && v >= cuts[i]) i++; return i };
const LESSON_LABEL = {
  c1: ["1h move below -10%", "1h move -10..0%", "1h move 0..5%", "1h move 5..15%", "1h move 15..40%", "1h move above 40%"],
  c5: ["5m move below -2%", "5m move -2..0%", "5m move 0..2%", "5m move above 2%"],
  bp: ["buyers under 50%", "buyers 50-55%", "buyers 55-60%", "buyers 60-70%", "buyers over 70%"],
  lq: ["liquidity under $15k", "liquidity $15-40k", "liquidity $40-100k", "liquidity $100-300k", "liquidity over $300k"],
  ag: ["age under 1h", "age 1-4h", "age 4-24h", "age 1-7 days", "age over 7 days"],
  tv: ["turnover under 0.5x/h", "turnover 0.5-1.5x/h", "turnover 1.5-4x/h", "turnover over 4x/h"],
};
function lessonFx(s, t, agent) {
  return { c1: _band(s.chg1h, [-10, 0, 5, 15, 40]), c5: _band(s.chg5m, [-2, 0, 2]), bp: _band(bp(s), [0.5, 0.55, 0.6, 0.7]), lq: _band(s.liq, [15000, 40000, 100000, 300000]),
    ag: _band(ageH(s, t), [1, 4, 24, 168]), tv: _band(_vlr(s), [0.5, 1.5, 4]), ch: s.chain, by: agent ? (agent.swarm ? "scout" : agent.id) : "na" };
}
function lessonAdd(fx, r) {
  if (!fx || !isFinite(r) || !CFG.lessons.on) return; const L = S.lessons || (S.lessons = { n: 0, sum: 0, b: {} }), d = CFG.lessons.decay;
  r = clamp(r, -3, 6); L.n = L.n * d + 1; L.sum = L.sum * d + r; L.seen = (L.seen || 0) + 1;
  for (const k in L.b) { L.b[k].n *= d; L.b[k].s *= d }
  for (const [f, v] of Object.entries(fx)) { const o = L.b[f + "=" + v] || (L.b[f + "=" + v] = { n: 0, s: 0 }); o.n += 1; o.s += r }
}
function lessonPred(fx) {
  const L = S.lessons; if (!L || (L.seen || 0) < CFG.lessons.minSamples || !fx) return null;
  const gm = L.sum / L.n, K = CFG.lessons.k; let p = gm;
  for (const [f, v] of Object.entries(fx)) { const o = L.b[f + "=" + v]; if (o) p += (o.s + K * gm) / (o.n + K) - gm }
  return p;
}
function lessonList() {
  const L = S.lessons; if (!L || !L.n) return [];
  const gm = L.sum / L.n, K = CFG.lessons.k;
  return Object.entries(L.b).filter(([k, o]) => o.n >= 8 && !k.endsWith("=na")).map(([k, o]) => { const [f, v] = k.split("="); const lab = LESSON_LABEL[f] ? LESSON_LABEL[f][+v] : f === "ch" ? "chain " + v : f === "by" ? (v === "scout" ? "scout agents" : (AG[v] ? AG[v].name : v)) : k;
    return { k, lab, n: o.n, avg: o.s / o.n, edge: (o.s + K * gm) / (o.n + K) - gm } });
}
