// Would a typical live-sized new token be approved? (regression for "risk manager blocks everything")
import { makeCtx, ev } from "./harness.mjs";
const ctx = makeCtx();
ev(ctx, `MODE="mock";rng=mulberry(1);load();vnow=1.76e9;regimeOk=vnow;regime="ok";FILL=false;CFG.keep.on=false;`);
const cases = [["solana new $9k", "solana", 9000], ["solana new $20k", "solana", 20000], ["base new $12k", "base", 12000], ["bsc new $15k", "bsc", 15000], ["ethereum new $40k", "ethereum", 40000], ["solana new $200k", "solana", 200000]];
for (const [n, ch, liq] of cases) {
  console.log(n.padEnd(20), ev(ctx, `JSON.stringify((()=>{const s={chain:"${ch}",addr:"0xabc",sym:"X"+${liq},price:1,liq:${liq},created:vnow-3*3600,chg1h:20,chg5m:2,buys1h:100,sells1h:60,vol24:50000};const d=approve(s,"new",40,{stop:18,tp1:40,tp2:100,trail:15,score:70,rr:2.2},vnow);return d})())`).replace(/"/g, ""));
}
