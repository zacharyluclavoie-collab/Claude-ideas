// J2: write-off ladder. Three open positions are made unsellable (the token starts restricting sells) and three more
// get sells that fail for a while (reverted / dropped) and then work. Checks every ladder step, the audit trail and the
// accounting. Then the natural write-off rate is measured with the ladder on vs off.
import { makeCtx, ev } from "./harness.mjs";
const setup = (money, seed) => `MODE="mock";SEED=${seed};rng=mulberry(SEED);load();S=newState(2000);seedPretrained();last={};stats=freshStats();regime="unknown";vnow=SIM0;
  applyPreset('lots');CFG.chains=["solana"];CFG.core.on=false;CFG.simScale=1;CFG.tick=30;Object.assign(CFG.money,${JSON.stringify(money)});MOCK.init();regimeOk=vnow;S.curve=[[vnow,totalEquity()]];`;
async function forced(ladder) {
  const ctx = makeCtx(); ev(ctx, setup({ ladder }, 77));
  let picked = null;
  for (let i = 0; i < 400 && !picked; i++) { await ev(ctx, "__run(20,30)"); const n = +ev(ctx, "Object.keys(S.pf.positions).length"); if (n >= 6) picked = JSON.parse(ev(ctx, "JSON.stringify(Object.values(S.pf.positions).slice(0,6).map(p=>({addr:p.addr.toLowerCase(),sym:p.sym})))")) }
  if (!picked) throw new Error("never had 6 open positions");
  const blk = picked.slice(0, 3).map(p => p.addr), flaky = picked.slice(3).map(p => p.addr);
  // 3 tokens start restricting sells (pre-flight revert, as a honeypot does); 3 more fail their next 5 sells (random revert / drop), then sell normally
  ev(ctx, `(()=>{const B=new Set(${JSON.stringify(blk)}),F=${JSON.stringify(Object.fromEntries(flaky.map(a => [a, 5])))};const ob=MOCK.blocked.bind(MOCK);MOCK.blocked=(c,a)=>B.has(String(a).toLowerCase())||ob(c,a);
    const os=simSell;simSell=function(s,q,tax,u,att,bl,xt){const a=String(s.addr||"").toLowerCase();if(F[a]>0){F[a]--;const g=gasUsd(s.chain,false);return F[a]%2?{ok:false,why:"tx reverted, fee burned",gas:Math.round(g*100)/100,fee:0,slip:0}:{ok:false,why:"tx dropped, no fill",gas:0,fee:0,slip:0}}return os(s,q,tax,u,att,bl,xt)};
    for(const p of Object.values(S.pf.positions))if(B.has(p.addr.toLowerCase())||F[p.addr.toLowerCase()]!=null)p.forceExit=1})()`);
  // make every picked position want to exit now (time stop), so the sells start at once
  ev(ctx, `for(const p of Object.values(S.pf.positions))if(p.forceExit){p.opened-=86400*3;p.tp1Done=false}`);   // held 3 days: the time stop fires now, so the sells start at once
  for (let i = 0; i < 60; i++) { await ev(ctx, "__run(40,30)"); const left = +ev(ctx, `Object.values(S.pf.positions).filter(p=>${JSON.stringify(picked.map(p => p.addr))}.includes(p.addr.toLowerCase())).length`); if (!left) break }
  return JSON.parse(ev(ctx, `JSON.stringify((()=>{const pf=S.pf,ids=${JSON.stringify(picked.map(p => p.addr))},C=x=>Math.round((x||0)*100),T=pf.tot,fx=pf.fx||{};let openC=0,pvC=0;for(const p of Object.values(pf.positions)){const v=C(pv(p));pvC+=v;openC+=C(p.real)+v-C(p.cost)}
    const cl=pf.closed.filter(c=>${JSON.stringify(picked.map(p => p.sym))}.includes(c.sym)),still=Object.values(pf.positions).filter(p=>ids.includes(p.addr.toLowerCase())).map(p=>({sym:p.sym,attempts:p.attempts,alog:p.alog}));
    return{closed:cl.map(c=>({sym:c.sym,reason:c.reason,pnl:c.pnl,failN:c.failN})),still,audits:(pf.audits||[]).filter(a=>ids.includes(String(a.addr||a.sym).toLowerCase())||${JSON.stringify(picked.map(p => p.sym))}.includes(a.sym)),
      ident:(C(pf.cash)+pvC-C(pf.start))-(C(T.w)+C(T.l)+openC-C(fx.burnBuy)+C(pf.yieldEarned)),alerts:pf.log?pf.log.filter(l=>/ladder|escalated|hard exit/.test(l.msg||l.m||"")).length:null,picked:${JSON.stringify(picked.map(p => p.sym))}}})())`));
}
const lad = await forced(true);
console.log("LADDER ON, forced failures:");
for (const c of lad.closed) console.log(`  ${c.sym}: closed by ${c.reason}, ${c.failN || 0} failed sells, result ${c.pnl.toFixed(2)}`);
for (const p of lad.still) console.log(`  ${p.sym}: STILL OPEN after ${p.attempts} attempts`);
for (const a of lad.audits) console.log(`  AUDIT ${a.sym}: entry ${a.entry} in $${(+a.in).toFixed(2)} · ${a.attempts.length} attempts: ${a.attempts.map(x => x.type + "/" + x.step).join(", ")} · fees burned $${(+a.burned).toFixed(2)} · rule "${a.rule}" · loss ${(+a.loss).toFixed(2)}`);
console.log("  accounting identity residual (cents):", lad.ident);
const off = await forced(false);
console.log("LADDER OFF, same forced failures:");
for (const c of off.closed) console.log(`  ${c.sym}: closed by ${c.reason}, ${c.failN || 0} failed sells, result ${c.pnl.toFixed(2)}`);
for (const a of off.audits) console.log(`  AUDIT ${a.sym}: ${a.attempts.length} attempts · rule "${a.rule}" · loss ${(+a.loss).toFixed(2)}`);
console.log("  accounting identity residual (cents):", off.ident);
console.log("JSON " + JSON.stringify({ lad, off }));
