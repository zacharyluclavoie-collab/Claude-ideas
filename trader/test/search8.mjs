// Round 8: more trades without worse trades: Max trades with the scam filters, vs Lots of trades (5x market).
//   node test/search8.mjs <days=2> <trainSeeds=6> <holdoutSeeds=8>
import fs from "node:fs";
import { fileURLToPath } from "node:url";   // works with spaces in folder names and on Windows
import { run } from "./search3.mjs";
const [DAYS, TS, HS] = [+process.argv[2] || 2, +process.argv[3] || 6, +process.argv[4] || 8];
const OUT = fileURLToPath(new URL("./search_results.jsonl", import.meta.url));
const grid = [
  { name: "lots now", s: "applyPreset('lots');" },
  { name: "max trades", s: "applyPreset('max');" },
  { name: "max trades + scam filters", s: "applyPreset('max');CFG.flt.minBuyers=25;CFG.flt.minUniq=0.4;" },
  { name: "lots, 45 coins max", s: "applyPreset('lots');CFG.risk.maxPos=45;CFG.risk.totalExp=70;" },
];
const setup = c => `CFG.core.on=false;CFG.simScale=5;` + c.s;
const score = (rs, d) => { const m = k => rs.reduce((a, q) => a + q[k], 0) / rs.length, x = rs.map(q => q.ret / d).sort((a, b) => a - b), lose = rs.filter(q => q.ret < 0).length;
  return { ret: m("ret") / d, win: m("win"), worst: x[0], trades: m("trades") / d, open: m("avgOpen"), scam: rs.reduce((a, q) => a + q.scamBought, 0), mdd: m("mdd"), lose, score: m("ret") / d - 0.15 * m("mdd") - 0.03 * lose } };
const line = (c, sc, n) => `${c.name.padEnd(26)} ret/day ${sc.ret.toFixed(3)}% trades/day ${sc.trades.toFixed(0)} open ${sc.open.toFixed(1)} win ${(sc.win * 100).toFixed(0)}% worst ${sc.worst.toFixed(3)} scams ${sc.scam} mdd ${sc.mdd.toFixed(2)}% losing ${sc.lose}/${n}`;
const train = [...Array(TS)].map((_, i) => 1401 + i), hold = [...Array(HS)].map((_, i) => 1451 + i), res = [];
for (const c of grid) { const sc = score(await run(train, setup(c), DAYS), DAYS); res.push({ c, sc }); fs.appendFileSync(OUT, JSON.stringify({ round: 8, phase: "train", c, ...sc }) + "\n"); console.log(line(c, sc, TS)) }
const base = res[0], fin = [base, ...res.slice(1).filter(r => r.sc.trades > base.sc.trades).sort((a, b) => b.sc.score - a.sc.score).slice(0, 2)];
for (const r of fin) { const sc = score(await run(hold, setup(r.c), DAYS), DAYS); fs.appendFileSync(OUT, JSON.stringify({ round: 8, phase: "holdout", c: r.c, ...sc }) + "\n"); console.log("HOLDOUT " + line(r.c, sc, HS)) }
console.log("DONE");
