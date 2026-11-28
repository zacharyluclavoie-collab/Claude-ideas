// quick check of the lessons learner on one seed: how many samples, what it learned, how many trades it blocked
import { makeCtx, ev } from "./harness.mjs";
const ctx = makeCtx(), days = +process.argv[2] || 2, setup = process.argv[3] || "applyPreset('safe');CFG.core.on=false";
ev(ctx, `MODE="mock";SEED=3;rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10;${setup}`);
await ev(ctx, `__run(${Math.round(days * 8640)},10)`);
console.log(ev(ctx, `JSON.stringify({seen:(S.lessons||{}).seen,gm:S.lessons?(S.lessons.sum/S.lessons.n).toFixed(3):null,vetoes:S.lessonVetoes||0,closed:S.pf.closed.length,ret:((equity()/S.pf.start-1)*100).toFixed(2),
  worst:lessonList().sort((a,b)=>a.edge-b.edge).slice(0,5).map(x=>x.lab+" n"+x.n.toFixed(0)+" avg "+x.avg.toFixed(2)),best:lessonList().sort((a,b)=>b.edge-a.edge).slice(0,5).map(x=>x.lab+" n"+x.n.toFixed(0)+" avg "+x.avg.toFixed(2))},null,1)`));
