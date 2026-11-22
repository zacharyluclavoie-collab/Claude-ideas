// node test/sweep.mjs <seedFrom> <seedTo> <days> [setupJS] [label]   -- runs seeds in parallel worker processes
import { spawn } from "node:child_process";
import os from "node:os";
const [a, b, days, setup = "", label = ""] = [+process.argv[2], +process.argv[3], +process.argv[4], process.argv[5] || "", process.argv[6] || ""];
const seeds = []; for (let s = a; s <= b; s++) seeds.push(s);
const results = []; let next = 0, running = 0;
await new Promise(done => {
  const launch = () => {
    while (running < Math.min(4, os.cpus().length) && next < seeds.length) {
      const s = seeds[next++]; running++;
      const p = spawn("node", [new URL("./worker.mjs", import.meta.url).pathname, String(s), String(days), setup]); let out = "";
      p.stdout.on("data", d => out += d); p.stderr.on("data", d => process.stderr.write(d));
      p.on("close", () => { try { results.push(JSON.parse(out.trim().split("\n").pop())) } catch (e) { console.error("seed", s, "failed", out.slice(0, 200)) } running--; if (next >= seeds.length && running === 0) done(); else launch() });
    }
  };
  launch();
});
const m = x => x.reduce((p, c) => p + c, 0) / x.length, med = x => [...x].sort((p, c) => p - c)[x.length >> 1];
const rets = results.map(r => r.ret / days);
const by = {}; for (const r of results) for (const [k, v] of Object.entries(r.by)) { const o = by[k] = by[k] || { n: 0, pnl: 0, w: 0, r: 0 }; o.n += v.n; o.pnl += v.pnl; o.w += v.w; o.r += v.r }
console.log(`[${label}] seeds ${results.length} days ${days}: ret/day mean ${m(rets).toFixed(2)}% med ${med(rets).toFixed(2)}% worst ${Math.min(...rets).toFixed(2)}% best ${Math.max(...rets).toFixed(2)}% losing ${results.filter(r => r.ret < 0).length}/${results.length} | trades ${m(results.map(r => r.trades)).toFixed(0)} win ${(100 * m(results.map(r => r.win))).toFixed(0)}% expR ${m(results.map(r => r.exp)).toFixed(2)} mdd ${m(results.map(r => r.mdd)).toFixed(1)}% fees ${m(results.map(r => r.fees)).toFixed(0)} shut ${results.filter(r => r.shut).length} scamBought ${results.reduce((p, r) => p + r.scamBought, 0)}/${results.reduce((p, r) => p + r.scamSeen, 0)}`);
if (process.env.BYKIND) for (const [k, v] of Object.entries(by).sort()) console.log("  ", k.padEnd(18), "n", String(v.n).padStart(4), "pnl", v.pnl.toFixed(0).padStart(7), "win", (100 * v.w / v.n).toFixed(0) + "%", "avgR", (v.r / v.n).toFixed(2));
