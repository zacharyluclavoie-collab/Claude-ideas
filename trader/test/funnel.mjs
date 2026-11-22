import { makeCtx, ev } from "./harness.mjs";
const setup=process.argv[3]||"",days=+process.argv[2]||2;
const ctx=makeCtx();ev(ctx,`MODE="mock";SEED=3;rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10;${setup}`);
await ev(ctx,`__run(${days*8640},10)`);
console.log(ev(ctx,`JSON.stringify((()=>{const r={};for(const f of S.feed){const k=f.outcome+": "+String(f.detail).split(";").map(x=>x.replace(/[0-9.]+/g,"#").trim())[0].slice(0,45);r[k]=(r[k]||0)+1}
 return{stats:{...stats,seen:0},top:Object.entries(r).sort((a,b)=>b[1]-a[1]).slice(0,14)}})(),null,0)`));
