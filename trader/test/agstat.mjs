import { makeCtx, ev } from "./harness.mjs";
const ctx = makeCtx();
ev(ctx, `MODE="mock";SEED=${process.argv[2]||3};rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10;applyPreset('protect');`);
for (let d = 1; d <= 8; d++) { await ev(ctx, `__run(8640,10)`); console.log("day", d, ev(ctx, `JSON.stringify(Object.fromEntries(AGENTS.filter(a=>agentOn(a.id)).map(a=>{const s=agentStat(a.id);return[a.id,s.n+"/"+(s.n?(s.r/s.n).toFixed(2):"-")+(agentProven(a.id)?"*":"")]})))`), "ret", ev(ctx, `((equity()/S.pf.start-1)*100).toFixed(2)`)) }
