// Re-tests the best round-2 search settings found so far on unseen seeds (401+), so the search can be stopped at any time.
//   node test/holdout2.mjs <topK=4> <seeds=10> <days=3>
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";   // works with spaces in folder names and on Windows
import fs from "node:fs";
import os from "node:os";
const [K, HS, DAYS] = [+process.argv[2] || 4, +process.argv[3] || 10, +process.argv[4] || 3];
const W = fileURLToPath(new URL("./worker.mjs", import.meta.url)), F = fileURLToPath(new URL("./search_results.jsonl", import.meta.url));
const rows = fs.readFileSync(F, "utf8").trim().split("\n").map(l => JSON.parse(l)).filter(r => r.round === 2 && r.phase === "train");
const EXTRA = ["rider", "dip", "whale", "gem", "trend"];
function setup(c) {
  let s = `applyPreset('lots');CFG.core.on=false;`; if (c.ref) return s;
  return s + `applyActivity('${c.act}');CFG.risk.perTradePct=${c.per};CFG.risk.posNew=${c.pos};CFG.risk.posTrend=${(c.pos * 1.5).toFixed(2)};CFG.risk.totalExp=${c.tot};CFG.risk.maxPos=${c.maxPos};` +
    `Object.assign(CFG.quick,{stop:${c.stop},tp1:${Math.max(c.tp1, c.stop * 1.2)},tp2:${Math.max(c.tp2, c.tp1 * 1.6)},trail:${c.trail}});CFG.tp1Frac=${c.frac};CFG.committeeMin=${c.com};CFG.nw.maxHoldH=${c.hold};CFG.tr.maxHoldH=${c.hold * 2};` +
    `CFG.risk.cooldownH=${c.cool};CFG.lessons.on=false;for(const a of ${JSON.stringify(c.on)})delete CFG.agentsOff[a];`;
}
function run(seeds, s) {
  return new Promise(done => { const res = []; let next = 0, live = 0;
    const go = () => { while (live < Math.min(4, os.cpus().length) && next < seeds.length) { const sd = seeds[next++]; live++; const p = spawn("node", [W, String(sd), String(DAYS), s]); let o = "";
      p.stdout.on("data", d => o += d); p.on("close", () => { try { res.push(JSON.parse(o.trim().split("\n").pop())) } catch (e) {} live--; if (next >= seeds.length && !live) done(res); else go() }) } }; go() });
}
const top = rows.sort((a, b) => b.score - a.score).slice(0, K); if (!top.some(r => r.i === 0)) { const ref = rows.find(r => r.i === 0); if (ref) top.push(ref) }
const hold = [...Array(HS)].map((_, i) => 401 + i);
for (const r of top) { const rs = await run(hold, setup(r.c)), m = k => rs.reduce((a, q) => a + q[k], 0) / rs.length, d = rs.map(q => q.ret / DAYS).sort((a, b) => a - b);
  const o = { round: 2, phase: "holdout", i: r.i, c: r.c, setup: setup(r.c), ret: m("ret") / DAYS, med: d[d.length >> 1], worst: d[0], trades: m("trades") / DAYS, mdd: m("mdd"), lose: rs.filter(q => q.ret < 0).length, win: m("win") };
  fs.appendFileSync(F, JSON.stringify(o) + "\n");
  console.log(`HOLDOUT #${r.i} train ${r.ret.toFixed(3)}% -> unseen ret/day ${o.ret.toFixed(3)}% med ${o.med.toFixed(3)} worst ${o.worst.toFixed(3)} trades/day ${o.trades.toFixed(1)} mdd ${o.mdd.toFixed(2)}% losing ${o.lose}/${HS} ${JSON.stringify(r.c)}`) }
console.log("DONE");
