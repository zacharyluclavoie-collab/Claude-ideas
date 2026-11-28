// Offline trainer: tests variants of each agent IN ISOLATION on training seeds, then re-tests the winner on unseen seeds.
// node test/train_agents.mjs [train:1-6] [test:101-112] [days]
import { spawnSync } from "node:child_process";
import fs from "node:fs";
const IDS = ["launch", "trend", "rider", "dip", "breakout", "quality", "whale", "gem", "reversal", "range"];
const days = +process.argv[4] || 4;
const VARIANTS = {
  base: {}, bp4: { bp: 0.04 }, bp8: { bp: 0.08 },
  tight: { quick: { stop: 2.5, tp1: 3, tp2: 6, trail: 1.5 } }, wide: { quick: { stop: 4.5, tp1: 6, tp2: 12, trail: 3 } },
  bp4wide: { bp: 0.04, quick: { stop: 4.5, tp1: 6, tp2: 12, trail: 3 } },
};
const run = (a, b, tune, id) => {
  const off = IDS.filter(x => x !== id).map(x => x + ":1").join(",");
  const setup = `applyPreset('protect');CFG.learn.on=false;CFG.agentsOff={${off}};AGENT_TUNE[${JSON.stringify(id)}]=${JSON.stringify(tune)};`;
  const r = spawnSync("node", ["test/sweep.mjs", String(a), String(b), String(days), setup, id], { env: { ...process.env, BYAGENT: "1" }, encoding: "utf8", timeout: 900000 });
  const m = /agent\s+(\S+)\s+n\s+(\d+)\s+pnl\s+(-?\d+)\s+win\s+(\d+)%\s+avgR\s+(-?[\d.]+)/.exec(r.stdout.split("\n").filter(l => l.includes("agent " + id)).join("\n"));
  return m ? { n: +m[2], pnl: +m[3], win: +m[4], r: +m[5] } : { n: 0, pnl: 0, win: 0, r: 0 };
};
const [ta, tb] = (process.argv[2] || "1-6").split("-").map(Number), [va, vb] = (process.argv[3] || "101-112").split("-").map(Number);
const out = {};
for (const id of IDS) {
  const res = {};
  for (const [name, tune] of Object.entries(VARIANTS)) { res[name] = run(ta, tb, tune, id); console.log(id.padEnd(9), name.padEnd(8), JSON.stringify(res[name])); }
  // best by expectancy with enough trades; must beat base
  const cands = Object.entries(res).filter(([k, v]) => v.n >= 15).sort((a, b) => b[1].r - a[1].r);
  const best = cands[0];
  let pick = "base", held = null;
  if (best && best[0] !== "base" && best[1].r > (res.base.n >= 15 ? res.base.r : -9) + 0.05) {
    held = run(va, vb, VARIANTS[best[0]], id); const hb = run(va, vb, {}, id);
    console.log(id.padEnd(9), "HELD-OUT", best[0], JSON.stringify(held), "vs base", JSON.stringify(hb));
    if (held.n >= 12 && held.r > hb.r) pick = best[0];
  }
  out[id] = { pick, tune: VARIANTS[pick], train: res[pick], held };
  console.log("=>", id, "pick", pick);
  fs.writeFileSync("test/agent_tune.json", JSON.stringify(out, null, 1));
}
