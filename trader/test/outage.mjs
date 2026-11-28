// Does it still trade when the live data sources are broken? (security source down, market feed down)
import { makeCtx, ev } from "./harness.mjs";
for (const [name, setup] of [["security down", "MOCK.security=async()=>null;"], ["market feed down", "MOCK.majors=async()=>null;"], ["both down", "MOCK.security=async()=>null;MOCK.majors=async()=>null;"], ["lenient off, both down", "CFG.lenient.sec=false;CFG.lenient.regime=false;MOCK.security=async()=>null;MOCK.majors=async()=>null;"]]) {
  const ctx = makeCtx();
  ev(ctx, `MODE="mock";SEED=4;rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10;${setup}`);
  await ev(ctx, `__run(8640,10)`);
  console.log(name.padEnd(24), ev(ctx, `JSON.stringify({bought:stats.bought,regime,secNull:stats.secNull,gated:stats.gated||0})`));
}
