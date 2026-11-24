// Any starting balance (e.g. $10): does it trade, and what happens?   node test/small.mjs <capital> <days> [setup]
import { makeCtx, ev } from "./harness.mjs";
const cap = +process.argv[2] || 10, days = +process.argv[3] || 2, setup = process.argv[4] || "applyPreset('recommended')";
const out = [];
for (let seed = 1; seed <= 6; seed++) {
  const ctx = makeCtx();
  ev(ctx, `MODE="mock";SEED=${seed};rng=mulberry(SEED);LS.set("pt_cap",${cap});load();S=newState(${cap});seedPretrained();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,totalEquity()]];CFG.tick=10;${setup}`);
  await ev(ctx, `__run(${Math.round(days * 8640)},10)`);
  out.push(JSON.parse(ev(ctx, `JSON.stringify({eq:totalEquity(),trades:S.pf.closed.length,open:Object.keys(S.pf.positions).length,win:S.pf.closed.filter(c=>c.pnl>0).length,chains:[...new Set(S.pf.closed.map(c=>c.chain))].join("/"),veto:Object.entries(stats.vwhy||{}).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0].slice(0,40)+" "+x[1]).join("; ")})`)));
}
for (const o of out) console.log(JSON.stringify(o));
const m = out.reduce((a, o) => a + (o.eq / cap - 1) * 100, 0) / out.length;
console.log(`start $${cap}, ${days} days, 6 seeds: mean return ${m.toFixed(2)}%  trades/run ${(out.reduce((a, o) => a + o.trades, 0) / out.length).toFixed(1)}`);
