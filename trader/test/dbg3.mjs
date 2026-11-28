import { makeCtx, ev } from "./harness.mjs";
const ctx = makeCtx();
ev(ctx, `MODE="mock";SEED=1;rng=mulberry(1);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10`);
let found = null;
for (let i = 0; i < 8640 && !found; i++) { await ev(ctx, `__run(1,10)`); found = ev(ctx, `(()=>{const p=Object.values(S.pf.positions).find(p=>p.cat==="trending");return p?p.chain+":"+p.addr.toLowerCase():null})()`) }
console.log("entered", found);
const addr = found.split(":")[1];
const row = [];
for (let m = 0; m < 360; m += 15) { await ev(ctx, `__run(90,10)`); row.push(ev(ctx, `(()=>{const t=MOCK.toks["${addr}"];return [${m}+15, (MOCK.price(t)/t.px[mkIdx(MOCK.G-${m}-15)]-1).toFixed(3), t.h.toFixed(2), (t.flow*100).toFixed(3), t.waveUntil>MOCK.G-t.genG?"WAVE":"", (t.q*2/1000).toFixed(0)+"k"].join(" ")})()`)) }
console.log(row.join("\n"));
