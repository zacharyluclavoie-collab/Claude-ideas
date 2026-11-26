// Round 5: fewer losses to fees and bad coins, on the current best setting (Lots of trades) in the 5x market.
// Tests a stricter fee limit (max round-trip cost per trade), stricter coin-risk limit, and the scam filters, alone and combined.
//   node test/search5.mjs <days=2> <trainSeeds=6> <holdoutSeeds=8>
import fs from "node:fs";
import { fileURLToPath } from "node:url";   // works with spaces in folder names and on Windows
import { run } from "./search3.mjs";
const [DAYS, TS, HS] = [+process.argv[2] || 2, +process.argv[3] || 6, +process.argv[4] || 8];
const OUT = fileURLToPath(new URL("./search_results.jsonl", import.meta.url));
const grid = [
  { name: "lots now" },
  { name: "fee limit 3%", cost: 3 },
  { name: "fee limit 2%", cost: 2 },
  { name: "coin risk max 50", risk: 50 },
  { name: "scam filters", flt: 1 },
  { name: "fee 3% + risk 50", cost: 3, risk: 50 },
  { name: "fee 3% + scam filters", cost: 3, flt: 1 },
];
const setup = c => `applyPreset('lots');CFG.core.on=false;CFG.simScale=5;` + (c.cost ? `CFG.risk.maxCostPct=${c.cost};` : "") + (c.risk ? `CFG.risk.maxRisk=${c.risk};` : "") + (c.flt ? `CFG.flt.minBuyers=25;CFG.flt.minUniq=0.4;` : "");
const score = (rs, d) => { const m = k => rs.reduce((a, q) => a + q[k], 0) / rs.length, x = rs.map(q => q.ret / d).sort((a, b) => a - b), lose = rs.filter(q => q.ret < 0).length;
  return { ret: m("ret") / d, med: x[x.length >> 1], worst: x[0], open: m("avgOpen"), trades: m("trades") / d, fees: m("fees"), scam: rs.reduce((a, q) => a + q.scamBought, 0), mdd: m("mdd"), lose, score: m("ret") / d - 0.15 * m("mdd") - 0.03 * lose } };
const line = (c, sc, n) => `${c.name.padEnd(22)} ret/day ${sc.ret.toFixed(3)}% med ${sc.med.toFixed(3)} worst ${sc.worst.toFixed(3)} trades/day ${sc.trades.toFixed(0)} fees $${sc.fees.toFixed(0)} scams ${sc.scam} mdd ${sc.mdd.toFixed(2)}% losing ${sc.lose}/${n}`;
const train = [...Array(TS)].map((_, i) => 1101 + i), hold = [...Array(HS)].map((_, i) => 1151 + i), res = [];
for (const c of grid) { const sc = score(await run(train, setup(c), DAYS), DAYS); res.push({ c, sc }); fs.appendFileSync(OUT, JSON.stringify({ round: 5, phase: "train", c, setup: setup(c), ...sc }) + "\n"); console.log(line(c, sc, TS)) }
res.sort((a, b) => b.sc.score - a.sc.score); const fin = res.slice(0, 2); if (!fin.some(r => r.c.name === "lots now")) fin.push(res.find(r => r.c.name === "lots now"));
for (const r of fin) { const sc = score(await run(hold, setup(r.c), DAYS), DAYS); fs.appendFileSync(OUT, JSON.stringify({ round: 5, phase: "holdout", c: r.c, setup: setup(r.c), ...sc }) + "\n"); console.log("HOLDOUT " + line(r.c, sc, HS)) }
console.log("DONE");
