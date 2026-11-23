/* ============================ boot camp ============================
 * Runs the agents through days of simulated market in seconds and keeps only what each agent learned (its record), then restores the real account.
 * The simulated market is built to be hard, but it is still a simulation: this is a warm start. Live results keep updating every record.
 */
async function trainAgents(days, onProgress) {
  const keep = { S, MODE, vnow, last, stats, rejected, regime, regimeOk, rng, SEED, paused, FILL, uniMedian, LEARN: Object.assign({}, CFG.learn), tick: CFG.tick, hist: MOCK.toks, ev: [CFG.newEvery, CFG.trendEvery, CFG.monitorEvery] };
  const ag0 = JSON.parse(JSON.stringify(S.pf.ag || {})), rec = {};
  try {
    MODE = "mock"; S = newState(10000); S.curve = [[1.76e9, 10000]]; last = {}; stats = freshStats(); rejected = {}; regime = "unknown"; paused = false;
    SEED = 4242 + (Date.now() & 0xff); rng = mulberry(SEED); vnow = 1.76e9; MOCK.init(); regimeOk = vnow; CFG.tick = 30; CFG.newEvery = 10; CFG.trendEvery = 30; CFG.monitorEvery = 30;
    const total = Math.round(days * 86400 / 30);
    for (let i = 0; i < total; i++) { vnow += 30; await tick(); if (i % 400 === 0 && onProgress) { onProgress(i / total); await new Promise(r => setTimeout(r, 0)) } }
    for (const a of AGENTS) { const s = (S.pf.ag || {})[a.id]; if (s && s.n) rec[a.id] = { n: s.n, pnl: s.pnl, w: s.w, r: s.r } }
  } finally {
    S = keep.S; MODE = keep.MODE; vnow = keep.vnow; last = keep.last; stats = keep.stats; rejected = keep.rejected; regime = keep.regime; regimeOk = keep.regimeOk; rng = keep.rng; SEED = keep.SEED; paused = keep.paused; FILL = keep.FILL; uniMedian = keep.uniMedian; CFG.learn = keep.LEARN; CFG.tick = keep.tick; [CFG.newEvery, CFG.trendEvery, CFG.monitorEvery] = keep.ev; MOCK.toks = keep.hist;
  }
  // blend: scale training records so a live record can overrule them quickly (at most 14 trades' worth), keep any existing live record
  const A = S.pf.ag || (S.pf.ag = {});
  for (const [id, r] of Object.entries(rec)) { const k = Math.min(1, 14 / r.n), cur = ag0[id] || { n: 0, pnl: 0, w: 0, r: 0 }; A[id] = { n: cur.n + Math.round(r.n * k), pnl: cur.pnl, w: cur.w + Math.round(r.w * k), r: cur.r + r.r * k, trained: true } }
  return rec;
}
