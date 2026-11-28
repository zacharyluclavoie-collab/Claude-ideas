import { makeCtx, ev } from "./harness.mjs";
const ctx = makeCtx();
ev(ctx, `MODE="mock";SEED=3;rng=mulberry(SEED);load();vnow=1.76e9;MOCK.init();`);
const out = ev(ctx, `(()=>{const rets=[],r24=[],dd=[];const toks=Object.values(MOCK.toks).filter(t=>t.est);
 for(let h=0;h<24*3;h++){for(let m=0;m<60;m++){vnow+=60;MOCK.advance()}
  for(const t of toks){if(t.dead)continue;rets.push(Math.log(MOCK.price(t)/MOCK.pxAgo(t,60)));if(h%24===23)r24.push(Math.log(MOCK.price(t)/MOCK.pxAgo(t,1440)))}}
 const sd=a=>{const m=a.reduce((x,y)=>x+y,0)/a.length;return{mean:m,sd:Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/a.length)}};
 return JSON.stringify({h1:sd(rets),d1:sd(r24),liqs:toks.slice(0,5).map(t=>Math.round(t.q*2)),dead:toks.filter(t=>t.dead).length,n:toks.length})})()`);
console.log(out);
