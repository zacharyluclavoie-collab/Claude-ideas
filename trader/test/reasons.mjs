import { makeCtx, ev } from "./harness.mjs";
const seed=+process.argv[2]||1,days=+process.argv[3]||5,setup=process.argv[4]||"";
const ctx=makeCtx();ev(ctx,`MODE="mock";SEED=${seed};rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10;${setup}`);
await ev(ctx,`__run(${days*8640},10)`);
console.log(ev(ctx,`JSON.stringify((()=>{const r={};for(const c of S.pf.closed){const k=c.reason.startsWith("EMERGENCY")?c.reason.slice(0,40):c.reason;const o=r[k]=r[k]||{n:0,pnl:0};o.n++;o.pnl+=c.pnl}return{ret:(equity()/S.pf.start-1)*100,r}})(),null,1)`));
