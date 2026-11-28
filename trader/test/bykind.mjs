import { makeCtx, ev } from "./harness.mjs";
const seeds = +process.argv[2] || 3, days = +process.argv[3] || 3, setup = process.argv[4] || "";
const agg = {};
for (let s = 1; s <= seeds; s++) {
  const ctx = makeCtx();
  ev(ctx, `MODE="mock";SEED=${s};rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10;${setup}`);
  await ev(ctx, `__run(${days * 8640},10)`);
  const cl = JSON.parse(ev(ctx, `JSON.stringify(S.pf.closed)`));
  for (const c of cl) { const k = c.cat + ":" + c.truth; const a = agg[k] = agg[k] || { n: 0, pnl: 0, w: 0, r: 0 }; a.n++; a.pnl += c.pnl; a.w += c.pnl > 0; a.r += c.r }
}
let tot = 0; for (const [k, a] of Object.entries(agg).sort()) { tot += a.pnl; console.log(k.padEnd(18), "n", String(a.n).padStart(4), "pnl", a.pnl.toFixed(0).padStart(7), "win", (100 * a.w / a.n).toFixed(0) + "%", "avgR", (a.r / a.n).toFixed(2)) }
console.log("total pnl", tot.toFixed(0));
