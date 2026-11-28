// Self-search: tries many random settings in the simulator, ranks them, then re-tests the best ones on unseen seeds.
//   node test/search.mjs <configs=24> <days=3> <trainSeeds=6> <holdoutSeeds=8>   (results appended to test/search_results.jsonl)
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";   // works with spaces in folder names and on Windows
import fs from "node:fs";
import os from "node:os";
const [N, DAYS, TS, HS] = [+process.argv[2] || 24, +process.argv[3] || 3, +process.argv[4] || 6, +process.argv[5] || 8];
const W = fileURLToPath(new URL("./worker.mjs", import.meta.url)), OUT = fileURLToPath(new URL("./search_results.jsonl", import.meta.url));
let x = 9137; const r = () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296, pick = a => a[Math.floor(r() * a.length)], rng = (a, b, d = 2) => +(a + r() * (b - a)).toFixed(d);
function cfg(i) {
  if (i === 0) return { base: "most" };   // the current best, as the reference
  if (i === 1) return { base: "lots" };
  return { base: pick(["most", "lots"]), per: rng(0.25, 0.8), pos: rng(0.8, 2.2), tot: pick([40, 50, 60, 70]), stop: pick([4, 5, 6, 8, 10]), tp1: pick([5, 6, 8, 10, 14]), tp2: pick([10, 16, 24, 32]), trail: pick([3, 4, 6, 8]),
    frac: pick([0.5, 0.6, 0.7, 0.8]), com: pick([1, 2, 3]), hold: pick([2, 3, 4, 6]), flt: pick([0, 1]), les: pick([0, 1]), maxPos: pick([30, 60, 100]) };
}
function setup(c) {
  let s = `applyPreset('${c.base}');CFG.core.on=false;`;
  if (c.per != null) s += `CFG.risk.perTradePct=${c.per};CFG.risk.posNew=${c.pos};CFG.risk.posTrend=${(c.pos * 1.5).toFixed(2)};CFG.risk.totalExp=${c.tot};CFG.risk.maxPos=${c.maxPos};` +
    `Object.assign(CFG.quick,{stop:${c.stop},tp1:${Math.max(c.tp1, c.stop * 0.8)},tp2:${Math.max(c.tp2, c.tp1 * 1.5)},trail:${c.trail}});CFG.tp1Frac=${c.frac};CFG.committeeMin=${c.com};CFG.nw.maxHoldH=${c.hold};CFG.tr.maxHoldH=${c.hold * 2};` +
    `CFG.flt.minBuyers=${c.flt ? 25 : 0};CFG.flt.minUniq=${c.flt ? 0.4 : 0};CFG.lessons.on=${!!c.les};`;
  return s;
}
function run(seeds, s) {
  return new Promise(done => { const res = []; let next = 0, live = 0;
    const go = () => { while (live < Math.min(4, os.cpus().length) && next < seeds.length) { const sd = seeds[next++]; live++; const p = spawn("node", [W, String(sd), String(DAYS), s]); let o = "";
      p.stdout.on("data", d => o += d); p.on("close", () => { try { res.push(JSON.parse(o.trim().split("\n").pop())) } catch (e) {} live--; if (next >= seeds.length && !live) done(res); else go() }) } }; go() });
}
const score = rs => { const m = k => rs.reduce((a, q) => a + q[k], 0) / rs.length, ret = m("ret") / DAYS;
  return { ret, mdd: m("mdd"), trades: m("trades") / DAYS, lose: rs.filter(q => q.ret < 0).length, win: m("win"), score: ret - 0.15 * m("mdd") - 0.03 * rs.filter(q => q.ret < 0).length } };
const train = [...Array(TS)].map((_, i) => 101 + i), hold = [...Array(HS)].map((_, i) => 201 + i), all = [];
for (let i = 0; i < N; i++) { const c = cfg(i), s = setup(c), rs = await run(train, s); const sc = score(rs); all.push({ i, c, s, train: sc });
  fs.appendFileSync(OUT, JSON.stringify({ phase: "train", i, c, ...sc }) + "\n"); console.log(`#${i} ${c.base} ret/day ${sc.ret.toFixed(3)}% trades/day ${sc.trades.toFixed(1)} mdd ${sc.mdd.toFixed(2)}% losing ${sc.lose}/${TS} score ${sc.score.toFixed(3)}`) }
all.sort((a, b) => b.train.score - a.train.score);
const finals = [...all.slice(0, 3), ...all.filter(a => a.i <= 1 && !all.slice(0, 3).includes(a))];
for (const a of finals) { const rs = await run(hold, a.s), sc = score(rs); a.hold = sc; fs.appendFileSync(OUT, JSON.stringify({ phase: "holdout", i: a.i, c: a.c, ...sc }) + "\n");
  console.log(`HOLDOUT #${a.i} ${JSON.stringify(a.c)} ret/day ${sc.ret.toFixed(3)}% trades/day ${sc.trades.toFixed(1)} mdd ${sc.mdd.toFixed(2)}% losing ${sc.lose}/${HS}`) }
console.log("DONE");
