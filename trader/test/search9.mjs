// Round 9: fine-tune the round-8 Lots of trades one setting at a time, then re-test the best on unseen markets. Resumable (cache).
//   node test/search9.mjs train            -> 4 training markets (seeds 1501-1504) per variant
//   node test/search9.mjs hold "<names>"   -> 8 unseen markets (1551-1558) for base + the named variants (comma separated; "a + b" combines)
//   node test/search9.mjs show             -> tables from the cache
import fs from "node:fs";
import { fileURLToPath } from "node:url";   // works with spaces in folder names and on Windows
import { run } from "./search3.mjs";
const DAYS = 2, CACHE = fileURLToPath(new URL("./search9_cache.jsonl", import.meta.url));
export const V = {
  "base": "",
  "stop 4": "CFG.quick.stop=4;",
  "stop 5.5": "CFG.quick.stop=5.5;",
  "sell 20% at tp1": "CFG.tp1Frac=0.2;",
  "sell 50% at tp1": "CFG.tp1Frac=0.5;",
  "tp1 +8": "CFG.quick.tp1=8;",
  "tp2 +45": "CFG.quick.tp2=45;",
  "trail 7": "CFG.quick.trail=7;",
  "30 coins": "CFG.risk.maxPos=30;CFG.risk.totalExp=90;",
  "1 agent enough": "CFG.committeeMin=1;",
  "bigger trades": "CFG.risk.perTradePct=1.4;CFG.risk.posNew=2.4;",
  "hold 3h": "CFG.nw.maxHoldH=3;",
  "hold 10h": "CFG.nw.maxHoldH=10;",
  "40 real buyers": "CFG.flt.minBuyers=40;",
  "cooldown 3h": "CFG.risk.cooldownH=3;",
};
const setup = v => `CFG.core.on=false;CFG.simScale=5;applyPreset('lots');` + v.split(" + ").map(x => V[x]).join("");   // "a + b" combines variants
const done = {}; try { for (const l of fs.readFileSync(CACHE, "utf8").split("\n")) if (l) { const o = JSON.parse(l); done[o.v + "|" + o.seed] = o.r } } catch (e) {}
async function runV(v, seeds) {
  const todo = seeds.filter(sd => !done[v + "|" + sd]);
  for (let k = 0; k < todo.length; k += 4) { const rs = await run(todo.slice(k, k + 4), setup(v), DAYS);
    for (const r of rs) { delete r.ba; delete r.by; done[v + "|" + r.seed] = r; fs.appendFileSync(CACHE, JSON.stringify({ v, seed: r.seed, r }) + "\n") } }
}
function table(names, seeds, label) {
  console.log(`\n${label} (seeds ${seeds[0]}-${seeds[seeds.length - 1]}, 5x, ${DAYS} days)`);
  const base = seeds.map(sd => done["base|" + sd]);
  for (const v of names) { const rs = seeds.map(sd => done[v + "|" + sd]); if (rs.some(r => !r)) { console.log(v.padEnd(18) + " (not finished)"); continue }
    const per = rs.map(q => q.ret / DAYS), m = k => rs.reduce((a, q) => a + q[k], 0) / rs.length, beat = base.every(Boolean) ? rs.filter((r, i) => r.ret > base[i].ret).length : 0;
    console.log(`${v.padEnd(18)} ret/day ${(m("ret") / DAYS).toFixed(2)}% worst ${Math.min(...per).toFixed(2)} trades/day ${(m("trades") / DAYS).toFixed(0)} win ${(m("win") * 100).toFixed(0)}% scams ${rs.reduce((a, q) => a + q.scamBought, 0)} mdd ${m("mdd").toFixed(2)}% beats base on ${beat}/${seeds.length}`) }
}
const TRAIN = [1501, 1502, 1503, 1504], HOLD = [1551, 1552, 1553, 1554, 1555, 1556, 1557, 1558];
const cmd = process.argv[2] || "train";
if (cmd === "train") { for (const v of Object.keys(V)) { await runV(v, TRAIN); console.log("done", v) } table(Object.keys(V), TRAIN, "Training markets") }
if (cmd === "hold") { const names = ["base", ...(process.argv[3] || "").split(",").map(s => s.trim()).filter(s => s && s !== "base" && s.split(" + ").every(x => V[x] !== undefined))];
  for (const v of names) { await runV(v, HOLD); console.log("done", v) } table(names, HOLD, "Unseen markets") }
if (cmd === "show") { table(Object.keys(V), TRAIN, "Training markets"); table(Object.keys(V).filter(v => HOLD.every(sd => done[v + "|" + sd])), HOLD, "Unseen markets") }
console.log("DONE");
