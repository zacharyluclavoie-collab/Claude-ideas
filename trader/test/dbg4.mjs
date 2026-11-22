import { makeCtx, ev } from "./harness.mjs";
const ctx = makeCtx();
ev(ctx, `MODE="mock";SEED=1;rng=mulberry(1);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10`);
let key = null;
for (let i = 0; i < 8640 && !key; i++) { await ev(ctx, `__run(1,10)`); key = ev(ctx, `(()=>{const p=Object.values(S.pf.positions).find(p=>p.cat==="trending");return p?p.chain+":"+p.addr.toLowerCase():null})()`) }
for (let i = 0; i < 700; i++) {
  await ev(ctx, `__run(6,10)`);
  const o = ev(ctx, `(()=>{const p=S.pf.positions["${key}"];if(!p)return null;return JSON.stringify({m:${i},last:p.last,entry:p.entry,stop:p.stop,tp1:p.tp1,em:p.emergency,pv:pv(p),cost:p.cost,qty:p.qty,liq:p.lastLiq,entryLiq:p.entryLiq})})()`);
  if (i % 20 === 0 || !o) console.log(o);
  if (!o) { console.log(ev(ctx, `JSON.stringify(S.pf.closed.slice(-1))`)); break }
}
