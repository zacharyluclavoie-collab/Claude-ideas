import { makeCtx, ev } from "./harness.mjs";
const ctx = makeCtx();
ev(ctx, `MODE="mock";SEED=6;rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10;`);
await ev(ctx, `__run(300,10)`);
ev(ctx, `S.pf.peak=equity()*1.25`);
await ev(ctx, `__run(30,10)`);
console.log("after drawdown:", ev(ctx, `JSON.stringify({shut:S.pf.shutdown,why:S.pf.why})`));
await ev(ctx, `__run(8640,10)`);
console.log("a day later:", ev(ctx, `JSON.stringify({shut:S.pf.shutdown,bought:stats.bought,events:S.journal.filter(j=>j.kind==="auto_rearm").length})`));
