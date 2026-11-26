// Round 6: more winning coins without less profit (Lots of trades, 5x market). Win rate is reported for every variant.
//   node test/search6.mjs <days=2> <trainSeeds=6> <holdoutSeeds=8>
import fs from "node:fs";
import { fileURLToPath } from "node:url";   // works with spaces in folder names and on Windows
import { run } from "./search3.mjs";
const [DAYS, TS, HS] = [+process.argv[2] || 2, +process.argv[3] || 6, +process.argv[4] || 8];
const OUT = fileURLToPath(new URL("./search_results.jsonl", import.meta.url));
const grid = [
  { name: "lots now" },
  { name: "first target +4%", tp1: 4 },
  { name: "first target +5%, sell 60%", tp1: 5, frac: 0.6 },
  { name: "break-even stop early", be: 0.3 },
  { name: "stricter entry score", score: 72 },
  { name: "target +5% + early BE", tp1: 5, be: 0.3 },
];
const setup = c => `applyPreset('lots');CFG.core.on=false;CFG.simScale=5;` + (c.tp1 ? `CFG.quick.tp1=${c.tp1};` : "") + (c.frac ? `CFG.tp1Frac=${c.frac};` : "") + (c.be ? `CFG.beAt=${c.be};` : "") + (c.score ? `CFG.nw.minScore=${c.score};` : "");
const score = (rs, d) => { const m = k => rs.reduce((a, q) => a + q[k], 0) / rs.length, x = rs.map(q => q.ret / d).sort((a, b) => a - b), lose = rs.filter(q => q.ret < 0).length;
  return { ret: m("ret") / d, win: m("win"), worst: x[0], trades: m("trades") / d, mdd: m("mdd"), lose, score: m("ret") / d - 0.15 * m("mdd") - 0.03 * lose } };
const line = (c, sc, n) => `${c.name.padEnd(28)} ret/day ${sc.ret.toFixed(3)}% win ${(sc.win * 100).toFixed(0)}% worst ${sc.worst.toFixed(3)} trades/day ${sc.trades.toFixed(0)} mdd ${sc.mdd.toFixed(2)}% losing ${sc.lose}/${n}`;
const train = [...Array(TS)].map((_, i) => 1201 + i), hold = [...Array(HS)].map((_, i) => 1251 + i), res = [];
for (const c of grid) { const sc = score(await run(train, setup(c), DAYS), DAYS); res.push({ c, sc }); fs.appendFileSync(OUT, JSON.stringify({ round: 6, phase: "train", c, setup: setup(c), ...sc }) + "\n"); console.log(line(c, sc, TS)) }
// finalists: best profit among those that win more often than now, plus the best overall, plus now
const base = res.find(r => r.c.name === "lots now"), byScore = [...res].sort((a, b) => b.sc.score - a.sc.score);
const fin = [base]; for (const r of byScore) { if (fin.length >= 3) break; if (!fin.includes(r) && (r.sc.win > base.sc.win || fin.length < 2)) fin.push(r) }
for (const r of fin) { const sc = score(await run(hold, setup(r.c), DAYS), DAYS); fs.appendFileSync(OUT, JSON.stringify({ round: 6, phase: "holdout", c: r.c, setup: setup(r.c), ...sc }) + "\n"); console.log("HOLDOUT " + line(r.c, sc, HS)) }
console.log("DONE");
