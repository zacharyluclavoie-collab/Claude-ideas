// Calibration of the synthetic market: what happens to tokens that pass basic liquidity at age 30 min (no bot involved).
import { makeCtx, ev } from "./harness.mjs";
const days = +process.argv[2] || 4, seed = +process.argv[3] || 1;
const ctx = makeCtx();
ev(ctx, `MODE="mock";SEED=${seed};rng=mulberry(SEED);load();vnow=1.76e9;MOCK.init();`);
const out = ev(ctx, `(()=>{const rec={};const kinds={};
 for(let i=0;i<${days}*1440;i++){vnow+=60;MOCK.advance();
  for(const t of Object.values(MOCK.toks)){if(t.est)continue;const age=MOCK.G-t.genG;
   if(age===30&&t.q*2>=15000){rec[t.addr]={k:t.kind,p30:MOCK.price(t),liq:t.q*2,max:MOCK.price(t)}}
   const r=rec[t.addr];if(r){r.max=Math.max(r.max,MOCK.price(t));if(age===90)r.p1h=MOCK.price(t);if(age===390)r.p6h=MOCK.price(t);if(age===1470)r.p24=MOCK.price(t);if(age===1470||t.dead&&r.p24==null)r.p24=r.p24??MOCK.price(t);}}}
 return JSON.stringify(Object.values(rec))})()`);
const rs = JSON.parse(out).filter(r => r.p24 != null);
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))] };
const byK = {}; for (const r of rs) (byK[r.k] = byK[r.k] || []).push(r);
const f = x => (x * 100).toFixed(0) + "%";
console.log("eligible tokens (liq>=15k at 30m):", rs.length);
for (const [k, a] of Object.entries(byK)) console.log(k.padEnd(8), "n", String(a.length).padStart(4), "share", f(a.length / rs.length), "median +1h", f(q(a.map(r => r.p1h / r.p30 - 1), .5)), "median +24h", f(q(a.map(r => r.p24 / r.p30 - 1), .5)), "p90 max", (q(a.map(r => r.max / r.p30), .9)).toFixed(2) + "x");
const all = rs.map(r => r.p24 / r.p30 - 1), mx = rs.map(r => r.max / r.p30);
console.log("ALL median +1h", f(q(rs.map(r => r.p1h / r.p30 - 1), .5)), "+6h", f(q(rs.map(r => r.p6h / r.p30 - 1), .5)), "+24h", f(q(all, .5)), "mean +24h", f(all.reduce((a, b) => a + b, 0) / all.length));
console.log("share that ever hit 2x:", f(mx.filter(x => x >= 2).length / mx.length), "5x:", f(mx.filter(x => x >= 5).length / mx.length), "10x:", f(mx.filter(x => x >= 10).length / mx.length), "lost >80% by 24h:", f(all.filter(x => x < -.8).length / all.length));
