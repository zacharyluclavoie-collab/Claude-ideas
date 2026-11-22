import { makeCtx, ev } from "./harness.mjs";
const seed=+process.argv[2]||1,days=+process.argv[3]||4,setup=process.argv[4]||"";
const ctx=makeCtx();ev(ctx,`MODE="mock";SEED=${seed};rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10;${setup}`);
let n10=0,ns=0,sum=0;
for(let h=0;h<days*24;h++){await ev(ctx,`__run(360,10)`);const n=ev(ctx,`Object.keys(S.pf.positions).length`);ns++;sum+=n;if(n>=10)n10++}
console.log(JSON.stringify({seed,ret:+ev(ctx,`((equity()/S.pf.start-1)*100).toFixed(2)`),avgOpen:+(sum/ns).toFixed(1),shareAtLeast10:+(n10/ns).toFixed(2),trades:ev(ctx,`S.pf.closed.length`),shut:ev(ctx,`S.pf.shutdown`),why:ev(ctx,`S.pf.why`),scoutShare:ev(ctx,`S.pf.closed.length`)}));
