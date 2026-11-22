import { makeCtx, ev } from "./harness.mjs";
const [seed, days, setup] = [+process.argv[2], +process.argv[3], process.argv[4] || ""];
const step = 10, ctx = makeCtx();
ev(ctx, `MODE="mock";SEED=${seed};rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=${step};${setup}`);
await ev(ctx, `__run(${Math.round(days * 86400 / step)},${step})`);
console.log(ev(ctx, `JSON.stringify((()=>{const pf=S.pf,cl=pf.closed;let pk=0,mdd=0;for(const [,e] of S.curve){pk=Math.max(pk,e);mdd=Math.max(mdd,(pk-e)/pk*100)}
 const by={};for(const c of cl){const k=c.cat+":"+c.truth;const a=by[k]=by[k]||{n:0,pnl:0,w:0,r:0};a.n++;a.pnl+=c.pnl;a.w+=c.pnl>0?1:0;a.r+=c.r}
 const ba={};for(const c of cl){const a=ba[c.agent]=ba[c.agent]||{n:0,pnl:0,w:0,r:0};a.n++;a.pnl+=c.pnl;a.w+=c.pnl>0?1:0;a.r+=c.r}
 return{ba,seed:${seed},ret:(equity()/pf.start-1)*100,trades:cl.length,win:cl.length?cl.filter(c=>c.pnl>0).length/cl.length:0,mdd,fees:pf.feesPaid,shut:pf.shutdown,scamSeen:stats.scamSeen,scamBought:stats.scamBought,by,exp:cl.length?cl.reduce((a,c)=>a+c.r,0)/cl.length:0,vetoed:stats.vetoed,bought:stats.bought}})())`));
