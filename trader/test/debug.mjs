import { makeCtx, ev } from "./harness.mjs";
const ctx = makeCtx();
ev(ctx, `MODE="mock";SEED=1;rng=mulberry(1);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10`);
await ev(ctx, `__run(400,10)`);
console.log(ev(ctx, `JSON.stringify({journal:S.journal.slice(0,5),stats:{...stats,seen:0},toks:Object.keys(MOCK.toks).length,regime,feed:S.feed.length})`));
