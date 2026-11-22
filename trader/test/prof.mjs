import { makeCtx, ev } from "./harness.mjs";
const ctx = makeCtx();
ev(ctx, `MODE="mock";SEED=1;rng=mulberry(1);load();vnow=1.76e9;MOCK.init();`);
let t0 = Date.now();
ev(ctx, `for(let i=0;i<1440;i++){vnow+=60;MOCK.advance()}`);
console.log("market only, 1 sim-day:", Date.now() - t0, "ms; tokens", ev(ctx, `Object.keys(MOCK.toks).length`));
const ctx2 = makeCtx();
ev(ctx2, `MODE="mock";SEED=1;rng=mulberry(1);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10`);
t0 = Date.now(); await ev(ctx2, `__run(8640,10)`); console.log("bot+market, 1 sim-day:", Date.now() - t0, "ms");
