// Round 4: re-tune Lots of trades' size and exposure for the bigger demo market (5x), where many more good coins are available at once.
//   node test/search4.mjs <days=2> <trainSeeds=6> <holdoutSeeds=8>
import fs from "node:fs";
import { run } from "./search3.mjs";
const [DAYS, TS, HS] = [+process.argv[2] || 2, +process.argv[3] || 6, +process.argv[4] || 8];
const OUT = new URL("./search_results.jsonl", import.meta.url).pathname;
const grid = [{ ref: true }];
for (const per of [1.0, 1.4, 1.8]) for (const tot of [50, 75, 95]) grid.push({ per, pos: +(1.63 * per).toFixed(2), tot, maxPos: tot >= 75 ? 60 : 30 });
const setup = c => `applyPreset('lots');CFG.core.on=false;CFG.simScale=5;` + (c.ref ? "" : `CFG.risk.perTradePct=${c.per};CFG.risk.posNew=${c.pos};CFG.risk.posTrend=${(c.pos * 1.5).toFixed(2)};CFG.risk.totalExp=${c.tot};CFG.risk.maxPos=${c.maxPos};`);
const score = (rs, d) => { const m = k => rs.reduce((a, q) => a + q[k], 0) / rs.length, x = rs.map(q => q.ret / d).sort((a, b) => a - b);
  return { ret: m("ret") / d, med: x[x.length >> 1], worst: x[0], open: m("avgOpen"), trades: m("trades") / d, mdd: m("mdd"), lose: rs.filter(q => q.ret < 0).length, score: m("ret") / d - 0.15 * m("mdd") - 0.03 * rs.filter(q => q.ret < 0).length } };
const train = [...Array(TS)].map((_, i) => 901 + i), hold = [...Array(HS)].map((_, i) => 951 + i), res = [];
for (const c of grid) { const sc = score(await run(train, setup(c), DAYS), DAYS); res.push({ c, sc }); fs.appendFileSync(OUT, JSON.stringify({ round: 4, phase: "train", c, setup: setup(c), ...sc }) + "\n");
  console.log(`${c.ref ? "lots now" : JSON.stringify(c)} ret/day ${sc.ret.toFixed(3)}% open ${sc.open.toFixed(1)} trades/day ${sc.trades.toFixed(0)} mdd ${sc.mdd.toFixed(2)}% losing ${sc.lose}/${TS} score ${sc.score.toFixed(3)}`) }
res.sort((a, b) => b.sc.score - a.sc.score); const fin = res.slice(0, 2); if (!fin.some(r => r.c.ref)) fin.push(res.find(r => r.c.ref));
for (const r of fin) { const sc = score(await run(hold, setup(r.c), DAYS), DAYS); fs.appendFileSync(OUT, JSON.stringify({ round: 4, phase: "holdout", c: r.c, setup: setup(r.c), ...sc }) + "\n");
  console.log(`HOLDOUT ${r.c.ref ? "lots now" : JSON.stringify(r.c)} ret/day ${sc.ret.toFixed(3)}% med ${sc.med.toFixed(3)} worst ${sc.worst.toFixed(3)} open ${sc.open.toFixed(1)} trades/day ${sc.trades.toFixed(0)} mdd ${sc.mdd.toFixed(2)}% losing ${sc.lose}/${HS}`) }
console.log("DONE");
