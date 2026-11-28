// Self-search, round 2: explores around the current best "Lots of trades" setting (search #10), including which agents trade,
// how wide the scan is, cooldowns and exits. New training seeds (301+) and new unseen seeds (401+) so round 1 can't leak in.
//   node test/search2.mjs <configs=40> <days=3> <trainSeeds=6> <holdoutSeeds=10> <topK=4>
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";   // works with spaces in folder names and on Windows
import fs from "node:fs";
import os from "node:os";
const [N, DAYS, TS, HS, TOPK] = [+process.argv[2] || 40, +process.argv[3] || 3, +process.argv[4] || 6, +process.argv[5] || 10, +process.argv[6] || 4];
const W = fileURLToPath(new URL("./worker.mjs", import.meta.url)), OUT = fileURLToPath(new URL("./search_results.jsonl", import.meta.url));
let x = 424242; const r = () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296, pick = a => a[Math.floor(r() * a.length)], rng = (a, b, d = 2) => +(a + r() * (b - a)).toFixed(d);
const EXTRA = ["rider", "dip", "whale", "gem", "trend"];
function cfg(i) {
  if (i === 0) return { ref: "lots (current best)" };
  const c = { per: rng(0.5, 1.2), pos: rng(1.0, 2.5), tot: pick([50, 60, 70, 80, 90]), maxPos: pick([20, 30, 45, 60]), stop: pick([3, 3.5, 4, 4.5, 5, 6]), tp1: pick([6, 7, 8, 10, 12]),
    tp2: pick([16, 20, 24, 30, 40]), trail: pick([4, 5, 6, 8, 10]), frac: pick([0.3, 0.4, 0.5, 0.6, 0.7]), hold: pick([2, 3, 4, 6]), com: pick([1, 2, 2, 3]), act: pick(["active", "active", "max"]),
    cool: pick([0.5, 2, 6, 12]), on: EXTRA.filter(() => r() < 0.2) };
  return c;
}
function setup(c) {
  let s = `applyPreset('lots');CFG.core.on=false;`;
  if (c.ref) return s;
  s += `applyActivity('${c.act}');CFG.risk.perTradePct=${c.per};CFG.risk.posNew=${c.pos};CFG.risk.posTrend=${(c.pos * 1.5).toFixed(2)};CFG.risk.totalExp=${c.tot};CFG.risk.maxPos=${c.maxPos};` +
    `Object.assign(CFG.quick,{stop:${c.stop},tp1:${Math.max(c.tp1, c.stop * 1.2)},tp2:${Math.max(c.tp2, c.tp1 * 1.6)},trail:${c.trail}});CFG.tp1Frac=${c.frac};CFG.committeeMin=${c.com};CFG.nw.maxHoldH=${c.hold};CFG.tr.maxHoldH=${c.hold * 2};` +
    `CFG.risk.cooldownH=${c.cool};CFG.lessons.on=false;for(const a of ${JSON.stringify(c.on)})delete CFG.agentsOff[a];`;
  return s;
}
function run(seeds, s) {
  return new Promise(done => { const res = []; let next = 0, live = 0;
    const go = () => { while (live < Math.min(4, os.cpus().length) && next < seeds.length) { const sd = seeds[next++]; live++; const p = spawn("node", [W, String(sd), String(DAYS), s]); let o = "";
      p.stdout.on("data", d => o += d); p.on("close", () => { try { res.push(JSON.parse(o.trim().split("\n").pop())) } catch (e) {} live--; if (next >= seeds.length && !live) done(res); else go() }) } }; go() });
}
const score = rs => { const m = k => rs.reduce((a, q) => a + q[k], 0) / rs.length, ret = m("ret") / DAYS, sorted = rs.map(q => q.ret / DAYS).sort((a, b) => a - b);
  return { ret, med: sorted[sorted.length >> 1], worst: sorted[0], mdd: m("mdd"), trades: m("trades") / DAYS, lose: rs.filter(q => q.ret < 0).length, win: m("win"), score: ret - 0.15 * m("mdd") - 0.03 * rs.filter(q => q.ret < 0).length } };
const train = [...Array(TS)].map((_, i) => 301 + i), hold = [...Array(HS)].map((_, i) => 401 + i), all = [];
for (let i = 0; i < N; i++) { const c = cfg(i), s = setup(c), rs = await run(train, s); const sc = score(rs); all.push({ i, c, s, train: sc });
  fs.appendFileSync(OUT, JSON.stringify({ round: 2, phase: "train", i, c, ...sc }) + "\n");
  console.log(`#${i} ret/day ${sc.ret.toFixed(3)}% med ${sc.med.toFixed(3)} trades/day ${sc.trades.toFixed(1)} mdd ${sc.mdd.toFixed(2)}% losing ${sc.lose}/${TS} score ${sc.score.toFixed(3)} ${JSON.stringify(c)}`) }
all.sort((a, b) => b.train.score - a.train.score);
const finals = all.slice(0, TOPK); if (!finals.some(a => a.i === 0)) finals.push(all.find(a => a.i === 0));
for (const a of finals) { const rs = await run(hold, a.s), sc = score(rs); a.hold = sc; fs.appendFileSync(OUT, JSON.stringify({ round: 2, phase: "holdout", i: a.i, c: a.c, setup: a.s, ...sc }) + "\n");
  console.log(`HOLDOUT #${a.i} ret/day ${sc.ret.toFixed(3)}% med ${sc.med.toFixed(3)} worst ${sc.worst.toFixed(3)} trades/day ${sc.trades.toFixed(1)} mdd ${sc.mdd.toFixed(2)}% losing ${sc.lose}/${HS} ${JSON.stringify(a.c)}`) }
console.log("DONE");
