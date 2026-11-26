// Self-search, round 3: many coins open at the same time (target 8-10+) while staying profitable.
// Explores longer holds, more agents, looser committee, smaller per-coin size so many fit, all on the widest scan.
//   node test/search3.mjs <configs=24> <days=3> <trainSeeds=6>      results -> test/search_results.jsonl (round 3)
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";   // works with spaces in folder names and on Windows
import fs from "node:fs";
import os from "node:os";
const [N, DAYS, TS] = [+process.argv[2] || 24, +process.argv[3] || 3, +process.argv[4] || 6];
const W = fileURLToPath(new URL("./worker.mjs", import.meta.url)), OUT = fileURLToPath(new URL("./search_results.jsonl", import.meta.url));
let x = 777001; const r = () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296, pick = a => a[Math.floor(r() * a.length)], rng = (a, b, d = 2) => +(a + r() * (b - a)).toFixed(d);
const EXTRA = ["rider", "dip", "whale", "gem", "trend"];
export function cfg(i) {
  if (i === 0) return { ref: "lots" };
  if (i === 1) return { ref: "max" };
  return { per: rng(0.4, 1.0), pos: rng(0.6, 1.6), tot: pick([70, 80, 90, 100]), maxPos: pick([30, 45, 60, 100]), stop: pick([4, 4.5, 5, 6, 8]), tp1: pick([6, 7, 8, 10]),
    tp2: pick([24, 30, 40, 60]), trail: pick([5, 6, 8, 10]), frac: pick([0.3, 0.4, 0.5]), hold: pick([4, 6, 8, 12]), com: pick([1, 1, 2]), cool: pick([0.5, 2, 6]),
    hourly: pick([20, 40, 80]), on: EXTRA.filter(() => r() < 0.4) };
}
export function setup(c) {
  if (c.ref) return `applyPreset('${c.ref}');CFG.core.on=false;`;
  return `applyPreset('lots');CFG.core.on=false;CFG.risk.perTradePct=${c.per};CFG.risk.posNew=${c.pos};CFG.risk.posTrend=${(c.pos * 1.5).toFixed(2)};CFG.risk.totalExp=${c.tot};CFG.risk.maxPos=${c.maxPos};` +
    `Object.assign(CFG.quick,{stop:${c.stop},tp1:${Math.max(c.tp1, c.stop * 1.2)},tp2:${Math.max(c.tp2, c.tp1 * 1.6)},trail:${c.trail}});CFG.tp1Frac=${c.frac};CFG.committeeMin=${c.com};CFG.nw.maxHoldH=${c.hold};CFG.tr.maxHoldH=${c.hold * 2};` +
    `CFG.risk.cooldownH=${c.cool};CFG.agentHourly=${c.hourly};CFG.risk.perHour=1000;CFG.risk.perDay=10000;CFG.lessons.on=false;for(const a of ${JSON.stringify(c.on)})delete CFG.agentsOff[a];`;
}
export function run(seeds, s, days) {
  return new Promise(done => { const res = []; let next = 0, live = 0;
    const go = () => { while (live < Math.min(4, os.cpus().length) && next < seeds.length) { const sd = seeds[next++]; live++; const p = spawn("node", [W, String(sd), String(days), s]); let o = "";
      p.stdout.on("data", d => o += d); p.on("close", () => { try { res.push(JSON.parse(o.trim().split("\n").pop())) } catch (e) {} live--; if (next >= seeds.length && !live) done(res); else go() }) } }; go() });
}
export const score = (rs, days) => { const m = k => rs.reduce((a, q) => a + q[k], 0) / rs.length, ret = m("ret") / days, open = m("avgOpen"), lose = rs.filter(q => q.ret < 0).length, d = rs.map(q => q.ret / days).sort((a, b) => a - b);
  return { ret, med: d[d.length >> 1], worst: d[0], open, mdd: m("mdd"), trades: m("trades") / days, lose, score: ret - 0.15 * m("mdd") - 0.03 * lose - 0.25 * Math.max(0, 8 - open) } };
if (process.argv[1] && process.argv[1].endsWith("search3.mjs")) {
  const train = [...Array(TS)].map((_, i) => 601 + i);
  for (let i = 0; i < N; i++) { const c = cfg(i), s = setup(c), sc = score(await run(train, s, DAYS), DAYS);
    fs.appendFileSync(OUT, JSON.stringify({ round: 3, phase: "train", i, c, setup: s, ...sc }) + "\n");
    console.log(`#${i} ret/day ${sc.ret.toFixed(3)}% open ${sc.open.toFixed(1)} trades/day ${sc.trades.toFixed(0)} mdd ${sc.mdd.toFixed(2)}% losing ${sc.lose}/${TS} score ${sc.score.toFixed(3)} ${JSON.stringify(c)}`) }
  console.log("DONE");
}
