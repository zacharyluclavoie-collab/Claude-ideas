// Round 8 unseen-market check, resumable (survives restarts): Lots of trades vs Max trades + scam filters.
//   node test/holdout8.mjs <days=2> <firstSeed=1451> <nSeeds=8>     results cached in test/holdout8_cache.jsonl
import fs from "node:fs";
import { fileURLToPath } from "node:url";   // works with spaces in folder names and on Windows
import { run } from "./search3.mjs";
const [DAYS, S0, N, SC] = [+process.argv[2] || 2, +process.argv[3] || 1451, +process.argv[4] || 8, +process.argv[5] || 5];   // 5th arg: demo market size
const CACHE = fileURLToPath(new URL("./holdout8_cache.jsonl", import.meta.url));
const grid = [
  { name: "lots now", s: "applyPreset('lots');" },
  { name: "max trades + scam filters", s: "applyPreset('max');CFG.flt.minBuyers=25;CFG.flt.minUniq=0.4;" },
];
const setup = c => `CFG.core.on=false;CFG.simScale=${SC};` + c.s;
const done = {}; try { for (const l of fs.readFileSync(CACHE, "utf8").split("\n")) if (l) { const o = JSON.parse(l); done[o.name + "|" + o.seed + "|" + o.days] = o.r } } catch (e) {}
const seeds = [...Array(N)].map((_, i) => S0 + i);
for (const c of grid) {
  const todo = seeds.filter(sd => !done[c.name + "|" + sd + "|" + DAYS + (SC !== 5 ? "|x" + SC : "")]);
  for (let k = 0; k < todo.length; k += 4) {   // 4 at a time, saved as each batch finishes
    const batch = todo.slice(k, k + 4), rs = await run(batch, setup(c), DAYS);
    for (const r of rs) { delete r.ba; delete r.by; done[c.name + "|" + r.seed + "|" + DAYS + (SC !== 5 ? "|x" + SC : "")] = r; fs.appendFileSync(CACHE, JSON.stringify({ name: c.name, seed: r.seed, days: DAYS + (SC !== 5 ? "|x" + SC : ""), r }) + "\n") }
  }
}
for (const c of grid) {
  const rs = seeds.map(sd => done[c.name + "|" + sd + "|" + DAYS + (SC !== 5 ? "|x" + SC : "")]).filter(Boolean), m = k => rs.reduce((a, q) => a + q[k], 0) / rs.length, per = rs.map(q => q.ret / DAYS);
  console.log(`${c.name.padEnd(26)} ret/day ${(m("ret") / DAYS).toFixed(3)}% trades/day ${(m("trades") / DAYS).toFixed(0)} win ${(m("win") * 100).toFixed(0)}% worst ${Math.min(...per).toFixed(3)} scams ${rs.reduce((a, q) => a + q.scamBought, 0)} mdd ${m("mdd").toFixed(2)}% losing ${per.filter(x => x < 0).length}/${N}`);
  console.log("   per market %/day: " + per.map(x => x.toFixed(2)).join(" "));
}
console.log("DONE");
