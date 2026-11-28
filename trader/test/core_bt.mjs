// Backtest of the core sleeve (BTC/ETH/SOL trend + cash yield) on the built-in simulated majors, many seeds, vs buy-and-hold.
//   node test/core_bt.mjs [seeds=20] [days=365]
import { makeCtx, ev } from "./harness.mjs";
const N = +process.argv[2] || 20, DAYS = +process.argv[3] || 365, out = [];
const OFF = +process.argv[5] || 0; for (let seed = 1 + OFF; seed <= N + OFF; seed++) {
  const ctx = makeCtx();
  ev(ctx, `MODE="mock";SEED=${seed};rng=mulberry(SEED);load();vnow=1.76e9;CSIM.r=null;${process.argv[4]||""}`);
  const r = JSON.parse(await ev(ctx, `(async()=>{let t=vnow;await coreStep(t);const c=S.core,p0={...c.px};let pk=coreValue(),mdd=0;
    for(let h=0;h<${DAYS}*24;h++){t+=3600;vnow=t;await coreStep(t);const v=coreValue();pk=Math.max(pk,v);mdd=Math.max(mdd,(pk-v)/pk)}
    let bh=0;for(const id of CFG.core.ids)bh+=c.px[id]/p0[id]/3;
    return JSON.stringify({ret:(coreValue()/c.start-1)*100,bh:(bh-1)*100,mdd:mdd*100,trades:c.trades.length,fees:c.fees,yield:c.yieldEarned})})()`));
  out.push(r);
}
const m = k => out.reduce((a, r) => a + r[k], 0) / out.length, med = k => [...out.map(r => r[k])].sort((a, b) => a - b)[out.length >> 1];
console.log(`core sleeve, ${N} seeds x ${DAYS} days: trend mean ${m("ret").toFixed(1)}% median ${med("ret").toFixed(1)}% | buy&hold mean ${m("bh").toFixed(1)}% median ${med("bh").toFixed(1)}% | trend maxDD ${m("mdd").toFixed(1)}% | trades ${m("trades").toFixed(0)} fees ${m("fees").toFixed(0)} yield ${m("yield").toFixed(0)} | trend beat hold ${out.filter(r => r.ret > r.bh).length}/${N}, trend lost money ${out.filter(r => r.ret < 0).length}/${N}`);
