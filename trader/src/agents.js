/* ============================ the 10 agents ============================
 * Each agent is a specialist with its own entry rule, exits and share of the portfolio. Every discovered token is shown to every
 * enabled agent; the best-scoring match (weighted by that agent's track record) gets the trade. Each agent keeps its own results,
 * and agents that keep losing get a smaller share until they prove themselves again. Security checks and risk rules are shared and
 * cannot be bypassed by any agent.
 */
const _p = (stop, tp1, tp2, trail, score, reason) => ({ stop, tp1, tp2, trail, score, rr: tp1 / stop, reason });
const _vlr = s => s.liq > 0 ? s.vol1h / s.liq : 0;
const _avgTrade = s => { const n = s.buys1h + s.sells1h; return n ? s.vol1h / n : 0 };
const _acc = s => s.vol24 > 0 ? s.vol1h * 24 / s.vol24 : 0;
const _uniq = s => s.buyers1h != null && s.buys1h >= 20 ? s.buyers1h / s.buys1h : null;
const _no = r => [null, [r]];
const AGENTS = [
  { id: "launch", name: "Launch Scout", cat: "new", scope: "new", desc: "Fresh pools with real two-sided activity and organic buyers.", run: (s, t) => analyzeNew(s, t) },
  { id: "trend", name: "Trend Follower", cat: "trending", scope: "est", desc: "Older tokens with rising volume, steady buying and a breakout.", run: (s, t, bo) => analyzeTrend(s, t, bo === undefined ? true : bo) },
  { id: "rider", name: "Momentum Rider", cat: "new", scope: "new", desc: "New tokens in a steady climb, 1 to 8 hours old.", run(s, t) {
    const age = ageH(s, t); if (age == null || age < 0.75 || age > 8) return _no("age outside 0.75-8h");
    if (s.liq < CFG.sec.liqNew) return _no("liquidity low"); if (s.chg1h < 8 || s.chg1h > 60) return _no("1h move outside 8-60%");
    if (s.chg6h < s.chg1h * 0.8) return _no("climb not steady"); if (bp(s) < 0.56) return _no("weak buy pressure"); const v = _vlr(s); if (v < 0.4 || v > 12) return _no("turnover off");
    return [_p(15, 35, 90, 12, 55 + Math.min(25, s.chg1h / 3) + (bp(s) - 0.5) * 60, `climb ${s.chg1h.toFixed(0)}%/1h bp ${bp(s).toFixed(2)}`), []] } },
  { id: "dip", name: "Pullback Buyer", cat: "new", scope: "any", desc: "A strong token that dipped and is stabilising.", run(s, t) {
    if (s.liq < CFG.sec.liqNew) return _no("liquidity low"); if (s.chg6h < 15) return _no("no prior strength");
    if (s.chg1h > -6 || s.chg1h < -25) return _no("no pullback of 6-25%"); if (s.chg5m < 0) return _no("still falling"); if (bp(s) < 0.5) return _no("sellers in control");
    return [_p(12, 20, 45, 8, 50 + Math.min(20, s.chg6h / 3) + (s.chg5m) * 4, `dip ${s.chg1h.toFixed(0)}% after +${s.chg6h.toFixed(0)}%/6h`), []] } },
  { id: "breakout", name: "Volume Breakout", cat: "new", scope: "any", desc: "Volume jumps well above normal while price starts to rise.", run(s, t) {
    if (s.liq < CFG.sec.liqNew) return _no("liquidity low"); const a = Math.max(_acc(s), s.vol1h > 0 ? s.vol5 * 12 / s.vol1h : 0);
    if (a < 2.5) return _no("no volume surge"); if (s.chg1h < 3 || s.chg1h > 30) return _no("1h move outside 3-30%"); if (s.chg5m <= 0) return _no("5m not rising"); if (bp(s) < 0.55) return _no("weak buy pressure");
    return [_p(13, 28, 70, 10, 52 + Math.min(25, a * 5) + (bp(s) - 0.5) * 50, `volume x${a.toFixed(1)} 1h ${s.chg1h.toFixed(0)}%`), []] } },
  { id: "quality", name: "Quality Buyers", cat: "new", scope: "new", desc: "Many different real buyers and healthy selling too.", run(s, t) {
    const age = ageH(s, t); if (age == null || age < 0.3 || age > 12) return _no("age outside 0.3-12h"); if (s.liq < Math.max(20000, CFG.sec.liqNew)) return _no("liquidity low");
    const u = _uniq(s); if (u == null) return _no("no unique-buyer data"); if (u < 0.7) return _no("few unique buyers"); if (s.sells1h < s.buys1h * 0.25) return _no("one-sided flow"); if (s.chg1h < 0 || s.chg1h > 80) return _no("1h move outside 0-80%");
    return [_p(16, 36, 90, 12, 58 + (u - 0.7) * 60 + Math.min(15, s.chg1h / 4), `unique buyers ${(u * 100).toFixed(0)}%`), []] } },
  { id: "whale", name: "Whale Flow", cat: "new", scope: "any", desc: "Big average trade size with buyers in control.", run(s, t) {
    if (s.liq < Math.max(30000, CFG.sec.liqNew)) return _no("liquidity low"); const a = _avgTrade(s); if (a < 250) return _no("small trades only"); if (bp(s) < 0.58) return _no("weak buy pressure"); if (s.chg1h < 2 || s.chg1h > 40) return _no("1h move outside 2-40%");
    return [_p(14, 30, 75, 10, 54 + Math.min(20, a / 40) + (bp(s) - 0.5) * 50, `avg trade $${a.toFixed(0)} bp ${bp(s).toFixed(2)}`), []] } },
  { id: "gem", name: "Gem Hunter", cat: "new", scope: "new", desc: "Small pools with very high turnover and a strong buy majority.", run(s, t) {
    const age = ageH(s, t); if (age == null || age < 0.3 || age > 6) return _no("age outside 0.3-6h"); if (s.liq < 8000 || s.liq > 40000) return _no("liquidity outside 8-40k"); if (_vlr(s) < 2) return _no("turnover below 2x/h");
    if (bp(s) < 0.6) return _no("weak buy pressure"); if (s.chg1h < 5 || s.chg1h > 120) return _no("1h move outside 5-120%"); if (s.buys1h + s.sells1h < 80) return _no("thin activity");
    return [_p(20, 50, 120, 15, 50 + Math.min(25, _vlr(s) * 3) + (bp(s) - 0.5) * 50, `turnover ${_vlr(s).toFixed(1)}x/h`), []] } },
  { id: "reversal", name: "Dip Reversal", cat: "trending", scope: "est", desc: "Established tokens that fell hard and are turning up.", run(s, t) {
    const age = ageH(s, t); if (age == null || age < CFG.tr.minAgeH) return _no("insufficient history"); if (s.liq < Math.max(60000, CFG.sec.liqTrend)) return _no("liquidity low");
    if (s.chg24 > -12) return _no("no 24h drop"); if (s.chg1h < 1.5) return _no("no turn yet"); if (s.chg5m < 0) return _no("5m falling"); if (_acc(s) < 1.5) return _no("no volume pickup"); if (bp(s) < 0.54) return _no("weak buy pressure");
    return [_p(8, 12, 25, 6, 50 + Math.min(20, -s.chg24) + s.chg1h * 3, `24h ${s.chg24.toFixed(0)}% now +${s.chg1h.toFixed(1)}%/1h`), []] } },
  { id: "range", name: "Range Breaker", cat: "trending", scope: "est", desc: "Big liquid tokens pushing out of a quiet range on rising volume.", run(s, t) {
    const age = ageH(s, t); if (age == null || age < CFG.tr.minAgeH) return _no("insufficient history"); if (s.liq < Math.max(100000, CFG.sec.liqTrend)) return _no("liquidity low");
    if (s.chg6h < 6) return _no("6h below 6%"); if (s.chg1h < 2 || s.chg1h > 15) return _no("1h move outside 2-15%"); if (_acc(s) < 2) return _no("no volume surge"); if (bp(s) < 0.55) return _no("weak buy pressure");
    return [_p(9, 18, 40, 7, 52 + Math.min(20, _acc(s) * 6) + s.chg1h, `6h +${s.chg6h.toFixed(0)}% volume x${_acc(s).toFixed(1)}`), []] } },
];
// per-agent tuning found by the offline trainer (test/train_agents.mjs): stricter buy-pressure / liquidity gates and its own quick-mode exits
const AGENT_TUNE = {};
// agents that passed offline training on unseen simulated markets start with a small record (12 trades' worth, haircut) so they can trade from the first minute;
// real results then overrule it quickly. Agents that failed offline training start with no record and have to practise.
const AGENT_PRE = {
  launch: { n: 12, w: 7, r: 1.6 }, breakout: { n: 12, w: 8, r: 3.4 }, quality: { n: 12, w: 6, r: 0.8 }, reversal: { n: 12, w: 6, r: 2.1 },
};
function seedPretrained() { const A = S.pf.ag || (S.pf.ag = {}); for (const [id, r] of Object.entries(AGENT_PRE)) if (!A[id] || !A[id].n) A[id] = { n: r.n, w: r.w, r: r.r, pnl: 0, pre: true } }
/*TUNE*/

/* ============================ the scout swarm (300 extra agents) ============================
 * Parameter variants of the same market-structure ideas (age window, liquidity floor, momentum band, buy pressure, turnover, volume surge,
 * unique buyers, exit style). They NEVER risk money while unproven: every scout takes virtual (shadow) trades with full costs, and may only
 * trade for real after 30+ virtual trades with positive average return AND win rate >= 50%. Real trades from scouts use half size.
 * Honest caveat: with 300 candidates some will look good by luck, so the bar is strict and live results keep re-judging them.
 */
const SWARM_N = 300;
function makeSwarm() {
  let x = 20240611; const rnd = () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296, pick = a => a[Math.floor(rnd() * a.length)];
  const seen = new Set(), out = [];
  const exits = [{ stop: 6, tp1: 8, tp2: 16, trail: 4 }, { stop: 8, tp1: 12, tp2: 28, trail: 6 }, { stop: 5, tp1: 7, tp2: 14, trail: 3 }, { stop: 10, tp1: 16, tp2: 36, trail: 7 }];
  let guard = 0;
  while (out.length < SWARM_N && guard++ < 20000) {
    const est = rnd() < 0.3;
    const c = { est, age: est ? [0, 0] : pick([[0.3, 3], [0.75, 8], [3, 24], [0.3, 12]]), liq: pick(est ? [60000, 100000, 250000] : [8000, 15000, 30000, 60000]), c1: pick(est ? [[1, 12], [2, 25], [-20, -3]] : [[2, 15], [5, 30], [10, 60], [-25, -5], [0, 80]]),
      c5: pick([-3, 0, 1, 2]), bp: pick([0.5, 0.55, 0.6, 0.65, 0.7]), vlr: pick([0, 0.5, 1.5, 3]), acc: pick([0, 0, 2, 3]), u: pick([0, 0, 0.6, 0.75]), ex: Math.floor(rnd() * exits.length) };
    const key = JSON.stringify(c); if (seen.has(key)) continue; seen.add(key);
    const ex = exits[c.ex], i = out.length + 1, tag = (c.c1[0] < 0 ? "dip " : "up ") + c.c1[0] + ".." + c.c1[1] + "%";
    out.push({ id: "sw" + String(i).padStart(3, "0"), name: "Scout " + String(i).padStart(3, "0"), swarm: true, cat: est ? "trending" : "new", scope: est ? "est" : "new", quick: ex,
      desc: `${est ? "Established" : "New"} coin · ${tag} 1h · liquidity ≥ $${c.liq / 1000}k · buyers ≥ ${Math.round(c.bp * 100)}%${c.vlr ? " · turnover ≥ " + c.vlr + "x" : ""}${c.acc ? " · volume surge ≥ " + c.acc + "x" : ""}${c.u ? " · unique buyers ≥ " + Math.round(c.u * 100) + "%" : ""}`,
      run(s, t) {
        const age = ageH(s, t); if (!c.est && (age == null || age < c.age[0] || age > c.age[1])) return _no("age window");
        if (s.liq < Math.max(c.liq, c.est ? CFG.sec.liqTrend : CFG.sec.liqNew)) return _no("liquidity low"); if (s.chg1h < c.c1[0] || s.chg1h > c.c1[1]) return _no("1h move outside band"); if (s.chg5m < c.c5) return _no("5m too weak");
        const b = bp(s); if (b < c.bp) return _no("weak buy pressure"); if (c.vlr && _vlr(s) < c.vlr) return _no("turnover low"); if (c.acc && Math.max(_acc(s), s.vol1h > 0 ? s.vol5 * 12 / s.vol1h : 0) < c.acc) return _no("no volume surge");
        if (c.u) { const u = _uniq(s); if (u == null || u < c.u) return _no("few unique buyers") }
        return [_p(ex.stop, ex.tp1, ex.tp2, ex.trail, 50 + (b - 0.5) * 60 + Math.min(10, Math.abs(s.chg1h) / 3), `scout ${i}: buyers ${(b * 100).toFixed(0)}% 1h ${s.chg1h.toFixed(0)}%`), []] } });
  }
  return out;
}
AGENTS.push(...makeSwarm());
const AG = Object.fromEntries(AGENTS.map(a => [a.id, a]));
const agentOn = id => !(CFG.agentsOff || {})[id] && !(CFG.swarmOff && AG[id] && AG[id].swarm);
function agentStat(id) { const a = (S && S.pf && S.pf.ag && S.pf.ag[id]) || { n: 0, pnl: 0, w: 0, r: 0 }; return a }
// share of the portfolio an agent may use: grows with proven expectancy, shrinks after a losing record (needs 8+ trades to judge)
function agentWeight(id) { const a = agentStat(id); if (a.n < 10) return CFG.agentProbation; const e = a.r / a.n; return clamp(1 + e * 3, 0.1, 2) }
function agentRecent(id, t, win = 3600) { let n = 0; for (const p of Object.values(S.pf.positions)) if (p.agent === id && t - p.opened < win) n++; for (const c of S.pf.closed.slice(-200)) if (c.agent === id && c.t - c.held * 3600 > t - win) n++; return n }
// proven agents trade freely; struggling agents are throttled; a benched agent only gets one probe trade every 6 hours
function agentLimit(id, t) { const w = agentWeight(id), a = agentStat(id); if (a.n >= 20 && w <= 0.1) return agentRecent(id, t, 21600) >= 1 ? "benched (probe every 6h)" : ""; const lim = w >= 1 ? CFG.agentHourly : w >= 0.5 ? Math.ceil(CFG.agentHourly / 2) : Math.ceil(CFG.agentHourly / 4); return agentRecent(id, t) >= lim ? "agent entry limit (" + lim + "/hour at its current record)" : "" }
function agentShare(id) { let tot = 0; for (const a of AGENTS) if (agentOn(a.id)) tot += agentWeight(a.id); return tot ? agentWeight(id) / tot : 0 }
function agentExposure(id) { let v = 0; for (const p of Object.values(S.pf.positions)) if (p.agent === id) v += pv(p); return v }
function ageOK(a, s, t) { const age = ageH(s, t); if (a.scope === "any") return true; if (age == null) return a.scope === "new"; return a.scope === "new" ? age <= 48 : age >= CFG.tr.minAgeH }
// every enabled agent looks at the token; returns the best match or null, plus the first rejection reason for diagnostics
function pickAgent(s, t, source) {
  let best = null, why = null;
  for (const a of AGENTS) {
    if (!agentOn(a.id) || !ageOK(a, s, t)) continue;
    if (source === "trending" && a.scope === "new" && false) continue;
    const [plan, rej] = a.run(s, t, true);
    if (plan) { const sc = plan.score * agentWeight(a.id); if (!best || sc > best.sc) best = { agent: a, plan, sc } } else if (!why) why = rej[0];
  }
  return { best, why: why || "no agent matched" };
}
