// 5-seed proof scheduler: control (current defaults) on every seed, then each idea seed by seed; an idea is stopped as soon
// as it can no longer win on 4 of 5 seeds (rule: expectancy AND profit beat control, max drawdown not >20% worse). Every run is logged.
import { spawn } from "node:child_process";
import fs from "node:fs";
const OUT = process.argv[2], IDEAS = (process.argv[3] || "PYR,EXP,TRT,TRL,STW,COLD2,DEAD,SAME").split(","), PAR = +(process.argv[4] || 4);
const SEEDS = [["424242", "x"], ["777", "x"], ["31337", "x"], ["9001", "x"], ["555", "bear"]];
fs.mkdirSync(OUT, { recursive: true });
const log = m => { fs.appendFileSync(OUT + "/proof.log", m + "\n"); console.log(m) };
const run = (seed, mode, lab, harsh) => new Promise(res => { const f = `${OUT}/${lab}_${seed}.json`; if (fs.existsSync(f)) return res(JSON.parse(fs.readFileSync(f, "utf8")));
  const p = spawn("node", ["test/v3_run.mjs", seed, "14", mode, lab, harsh, f], { stdio: ["ignore", "pipe", "pipe"] }); let o = ""; p.stdout.on("data", d => o += d); p.stderr.on("data", d => o += d);
  p.on("close", () => { log(o.trim().split("\n").slice(-1)[0]); try { res(JSON.parse(fs.readFileSync(f, "utf8"))) } catch (e) { res(null) } }) });
let slots = PAR; const q = []; const lim = fn => new Promise(r => { const go = async () => { slots--; try { r(await fn()) } finally { slots++; if (q.length) q.shift()() } }; slots > 0 ? go() : q.push(go) });
const ctrl = {}; await Promise.all(SEEDS.map(([s, h]) => lim(async () => { ctrl[s] = await run(s, "LEAN", "control", h) })));
const verdict = {};
await Promise.all(IDEAS.map(id => (async () => { let loss = 0, win = 0; const rows = [];
  for (const [s, h] of SEEDS) { if (loss >= 2) { rows.push({ s, skipped: true }); continue }
    const r = await lim(() => run(s, id, id.toLowerCase(), h)), c = ctrl[s]; if (!r || !c) { loss++; continue }
    const ok = r.t.exp > c.t.exp && r.t.profit > c.t.profit && (c.t.dd ? r.t.dd / c.t.dd - 1 <= 0.2 : true);
    ok ? win++ : loss++; rows.push({ s, cP: c.t.profit, tP: r.t.profit, cE: c.t.exp, tE: r.t.exp, cD: c.t.dd, tD: r.t.dd, ok }) }
  verdict[id] = { win, loss, promote: win >= 4, rows }; log(`VERDICT ${id}: ${win} wins, ${loss} losses → ${win >= 4 ? "PROMOTE" : "KILL"}`) })()));
fs.writeFileSync(OUT + "/verdict.json", JSON.stringify({ ctrl: Object.fromEntries(Object.entries(ctrl).map(([k, v]) => [k, v && v.t])), verdict }, null, 1)); log("ALL_DONE");
