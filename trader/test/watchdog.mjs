import { makeCtx, ev } from "./harness.mjs";
const ctx = makeCtx();
ev(ctx, `MODE="mock";SEED=4;rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10;applySecMode("strict");CFG.lenient.sec=false;CFG.lenient.regime=false;MOCK.security=async()=>null;MOCK.majors=async()=>null;`);
await ev(ctx, `__run(8640,10)`);
console.log(ev(ctx, `JSON.stringify({bought:stats.bought,mode:CFG.secMode,len:CFG.lenient,relax:S.journal.filter(j=>j.kind==="auto_relax").map(j=>j.msg)})`));
