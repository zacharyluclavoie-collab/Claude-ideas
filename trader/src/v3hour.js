/* V3 portfolio hour: once every simulated hour the Master collects what each desk learned (blocked / proven coins), what each
 * holds, and the total balance; it sends every desk the same message. Used by the app (run.js) and by the test runner, so both
 * behave the same. Daily profit stair (Idea 19) and run drawdown governor (Idea 20) live here. */
function v3Hour(st, reps, money, g) {
  const mem = [], held = {}; let eq = 0;
  for (const r of reps) { for (const e of r.out || []) mem.push(e); for (const [a, u] of Object.entries(r.held || {})) { const h = held[a] || (held[a] = { n: 0, usd: 0 }); h.n++; h.usd = Math.round((h.usd + u) * 100) / 100 } eq += r.eq || 0 }
  mem.sort((a, b) => (a.t || 0) - (b.t || 0) || String(a.addr).localeCompare(String(b.addr)) || String(a.k).localeCompare(String(b.k)));   // same order on any computer
  const day = Math.floor((g - 1) / 86400), log = [];
  if (st.day !== day) { st.day = day; st.dayStart = eq }
  st.peak = Math.max(st.peak || 0, eq); const dd = st.peak ? (st.peak - eq) / st.peak : 0;
  if (money.governor) { if (!st.gov && dd >= 0.05) { st.gov = true; st.govAt = g; st.trough = eq; log.push({ g, kind: "governor on", peak: st.peak, eq, dd: +(dd * 100).toFixed(2) }) }
    else if (st.gov) { st.trough = Math.min(st.trough || eq, eq); if (dd <= 0.02) { st.gov = false; log.push({ g, kind: "governor off", peak: st.peak, eq, trough: st.trough, hours: Math.round((g - st.govAt) / 3600) }) } } } else st.gov = false;
  let f = 1, stair = 1; if (money.stair && st.dayStart) { const dp = (eq - st.dayStart) / st.dayStart; stair = dp >= 0.035 ? 0.5 : dp >= 0.02 ? 0.75 : 1; if (stair !== (st.stair || 1)) log.push({ g, kind: "stair", f: stair, dayPct: +(dp * 100).toFixed(2) }); st.stair = stair; f *= stair }
  if (st.gov) f *= 0.75;
  return { msg: { mem, held, f, gov: !!st.gov, bal: eq / 100 }, log };
}
