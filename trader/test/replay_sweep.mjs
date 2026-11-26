// Replays one recording of the real market through the real engine with several settings and prints one line each.
// Each replay runs as fast as the computer allows (hours of market in seconds).
//   node test/replay_sweep.mjs <market-data folder> [capital=100]
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const dir = path.dirname(fileURLToPath(new URL(import.meta.url)));
const DATA = process.argv[2], CAP = +process.argv[3] || 100;
const base = `applyPreset('lots');CFG.core.on=false;CFG.chains=["solana","base","bsc","arbitrum"];S=newState(${CAP});seedPretrained();S.curve=[[vnow,equity()]];`;
export const VARIANTS = {
  "current best (Lots of trades)": "",
  "sell all at first target": "CFG.tp1Frac=1;",
  "first target +10%, sell all": "CFG.quick.tp1=10;CFG.tp1Frac=1;",
  "fee cap 3%": "CFG.risk.maxCostPct=3;",
  "wider stop (-7%)": "CFG.quick.stop=7;",
  "40% of account per coin": "CFG.risk.smallShare=0.4;",
  "established coins too": "CFG.tr.enabled=true;",
};
const only = process.argv[4] ? process.argv[4].split("|") : null;
for (const [name, v] of Object.entries(VARIANTS)) {
  if (only && !only.includes(name)) continue;
  const t0 = Date.now(), r = spawnSync("node", [path.join(dir, "..", "recorder", "replay.mjs"), DATA, "--setup", base + v], { encoding: "utf8", maxBuffer: 1e8 });
  const out = r.stdout || "", head = (out.match(/replayed ([\d.]+) days.*return (-?[\d.]+)%, fees \$(\d+)/) || []), all = (out.match(/ALL\s+trades\s+(\d+) win (\d+)% pnl \$(-?\d+) expectancy (-?[\d.]+|NaN)R/) || []);
  console.log(`${name.padEnd(32)} ${head[2] != null ? (+head[2] >= 0 ? "+" : "") + head[2] + "%" : "?"}  trades ${all[1] ?? "?"}  won ${all[2] ?? "?"}%  pnl $${all[3] ?? "?"}  fees $${head[3] ?? "?"}  (${((Date.now() - t0) / 1000).toFixed(1)} s for ${head[1] ?? "?"} days)`);
  if (r.status) console.log("   failed:", (r.stderr || "").slice(0, 300));
}
