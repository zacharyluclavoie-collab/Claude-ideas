// Round 7: lose less on bad days without giving up profit (Lots of trades, 5x market): tighter daily loss stop and drawdown limits.
//   node test/search7.mjs <days=3> <trainSeeds=6> <holdoutSeeds=8>
import fs from "node:fs";
import { run } from "./search3.mjs";
const [DAYS, TS, HS] = [+process.argv[2] || 3, +process.argv[3] || 6, +process.argv[4] || 8];
const OUT = new URL("./search_results.jsonl", import.meta.url).pathname;
const grid = [
  { name: "lots now" },
  { name: "daily loss stop 1.5%", dl: 1.5 },
  { name: "daily loss stop 1%", dl: 1 },
  { name: "shutdown at 5% drop", dd: 5 },
  { name: "pause 2h after 3 losses", pause: 120 },
  { name: "daily 1.5% + pause 2h", dl: 1.5, pause: 120 },
];
const setup = c => `applyPreset('lots');CFG.core.on=false;CFG.simScale=5;` + (c.dl ? `CFG.risk.dailyLoss=${c.dl};` : "") + (c.dd ? `CFG.risk.maxDD=${c.dd};` : "") + (c.pause ? `CFG.risk.streakPause=3;CFG.risk.pauseMin=${c.pause};` : "");
const score = (rs, d) => { const m = k => rs.reduce((a, q) => a + q[k], 0) / rs.length, x = rs.map(q => q.ret / d).sort((a, b) => a - b), lose = rs.filter(q => q.ret < 0).length;
  return { ret: m("ret") / d, win: m("win"), worst: x[0], trades: m("trades") / d, mdd: m("mdd"), worstMdd: Math.max(...rs.map(q => q.mdd)), lose, shut: rs.filter(q => q.shut).length, score: m("ret") / d - 0.3 * m("mdd") - 0.05 * lose } };
const line = (c, sc, n) => `${c.name.padEnd(26)} ret/day ${sc.ret.toFixed(3)}% worst ${sc.worst.toFixed(3)} mdd ${sc.mdd.toFixed(2)}% (worst ${sc.worstMdd.toFixed(2)}%) trades/day ${sc.trades.toFixed(0)} losing ${sc.lose}/${n} shutdowns ${sc.shut}`;
const train = [...Array(TS)].map((_, i) => 1301 + i), hold = [...Array(HS)].map((_, i) => 1351 + i), res = [];
for (const c of grid) { const sc = score(await run(train, setup(c), DAYS), DAYS); res.push({ c, sc }); fs.appendFileSync(OUT, JSON.stringify({ round: 7, phase: "train", c, setup: setup(c), ...sc }) + "\n"); console.log(line(c, sc, TS)) }
const byScore = [...res].sort((a, b) => b.sc.score - a.sc.score), fin = byScore.slice(0, 2); if (!fin.some(r => r.c.name === "lots now")) fin.push(res.find(r => r.c.name === "lots now"));
for (const r of fin) { const sc = score(await run(hold, setup(r.c), DAYS), DAYS); fs.appendFileSync(OUT, JSON.stringify({ round: 7, phase: "holdout", c: r.c, setup: setup(r.c), ...sc }) + "\n"); console.log("HOLDOUT " + line(r.c, sc, HS)) }
console.log("DONE");
