// Forward return of established tokens after the "trending" signal fires (no bot): is there built-in edge/anti-edge?
import { makeCtx, ev } from "./harness.mjs";
const seed = +process.argv[2] || 1, days = +process.argv[3] || 6;
const ctx = makeCtx();
ev(ctx, `MODE="mock";SEED=${seed};rng=mulberry(SEED);load();vnow=1.76e9;MOCK.init();${process.argv[4]||""}`);
const out = ev(ctx, `(()=>{const fw=[],base=[];const pend=[];
 for(let m=0;m<${days}*1440;m++){vnow+=60;MOCK.advance();
  if(m%20!==0)continue;
  for(const t of Object.values(MOCK.toks)){if(!t.est||t.dead)continue;const s=MOCK.snap(t);
   const accel=s.vol24>0?s.vol1h*24/s.vol24:0,b=s.buys1h/Math.max(1,s.buys1h+s.sells1h);
   const sig=s.chg1h>=1&&s.chg1h<=25&&s.chg6h>=2&&accel>=1.5&&b>=0.52&&s.chg5m>=-1;
   const e={t,p:s.price,at:m,sig};pend.push(e)}
  for(let i=pend.length-1;i>=0;i--){const e=pend[i];if(m-e.at>=240){const r=MOCK.price(e.t)/e.p-1;(e.sig?fw:base).push(r);pend.splice(i,1)}}}
 const st=a=>{const mu=a.reduce((x,y)=>x+y,0)/a.length;return{n:a.length,mean:+(mu*100).toFixed(2),med:+([...a].sort((x,y)=>x-y)[a.length>>1]*100).toFixed(2),up10:+(a.filter(x=>x>=.1).length/a.length*100).toFixed(1),dn10:+(a.filter(x=>x<=-.1).length/a.length*100).toFixed(1)}};
 return JSON.stringify({signal:st(fw),all:st(base)})})()`);
console.log(out);
