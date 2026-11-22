import { makeCtx, ev } from "./harness.mjs";
const ctx = makeCtx();
ev(ctx, `MODE="mock";SEED=1;rng=mulberry(1);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10`);
await ev(ctx, `__run(8640,10)`);
const cl = JSON.parse(ev(ctx, `JSON.stringify(S.pf.closed.filter(c=>c.cat==="trending").slice(0,12))`));
for (const c of cl) console.log(c.sym, c.chain, "size", c.size.toFixed(0), "pnl", c.pnl.toFixed(1), c.r.toFixed(2)+"R", c.reason, "held", c.held.toFixed(1));
console.log(ev(ctx, `JSON.stringify(S.trades.filter(t=>t.cat==="trending").slice(0,8).map(t=>[t.side,t.sym,t.usd.toFixed(1),(t.slip||0).toFixed(2),t.fee&&t.fee.toFixed(2),t.gas.toFixed(2),t.note]))`));
