// How many coins are open at the same time? Samples open positions every simulated hour.
//   node test/concur.mjs <days=2> <seedFrom=501> <seeds=4> "<setup>" ["<label>"]
import { makeCtx, ev } from "./harness.mjs";
const [DAYS, S0, NS, SETUP, LABEL] = [+process.argv[2] || 2, +process.argv[3] || 501, +process.argv[4] || 4, process.argv[5] || "applyPreset('lots')", process.argv[6] || ""];
const out = [];
for (let sd = S0; sd < S0 + NS; sd++) {
  const ctx = makeCtx();
  ev(ctx, `MODE="mock";SEED=${sd};rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10;CFG.core.on=false;${SETUP}`);
  const opens = [];
  for (let h = 0; h < DAYS * 24; h++) { await ev(ctx, `__run(360,10)`); opens.push(+ev(ctx, `Object.keys(S.pf.positions).length`)) }
  const r = JSON.parse(ev(ctx, `JSON.stringify({ret:(equity()/S.pf.start-1)*100,trades:S.pf.closed.length})`));
  out.push({ avg: opens.reduce((a, b) => a + b, 0) / opens.length, peak: Math.max(...opens), atLeast10: opens.filter(x => x >= 10).length / opens.length, ...r });
}
const m = k => out.reduce((a, o) => a + o[k], 0) / out.length;
console.log(`${LABEL} avg open ${m("avg").toFixed(1)} peak ${Math.max(...out.map(o => o.peak))} hours with 10+ open ${(100 * m("atLeast10")).toFixed(0)}% | ret/day ${(m("ret") / DAYS).toFixed(2)}% trades/day ${(m("trades") / DAYS).toFixed(0)}`);
