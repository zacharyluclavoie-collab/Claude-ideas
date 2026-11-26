// Spec V2 Part 4: each money feature alone vs the control, 5 desks, 14 days, same market seed, fixed 30 s step
// (the step the app uses at 10,000x), so the only difference between two runs is the feature.
import { runAll, line } from "./v2_desks.mjs";
import fs from "node:fs";
const seed = +(process.argv[2] || 424242), days = +(process.argv[3] || 14), out = process.argv[4] || "v2_features.json";
const CONF = [["control (defaults)", {}], ["ladder OFF", { ladder: false }], ["+ pre-buy check", { prebuy: true }], ["+ cost control", { ftc: true }], ["+ bank the day", { bank: true }], ["+ pattern memory", { memory: true }], ["+ cold-desk steps", { cold: true }]];
const res = [];
for (const [lab, money] of CONF) { const t0 = Date.now(), t = await runAll({ seed, days, money, step: 30 }); console.log(line(lab, t), `| ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  res.push(Object.assign({}, t, { lab, money, curve: undefined, desks: t.desks.map(d => ({ desk: d.desk, profit: d.eq - d.start, n: d.wn + d.ln, woN: d.woN, wo: d.wo, ftc: d.ftc, bank: d.bank, mem: d.mem, memFlip: d.memFlip, preSkip: d.preSkip, preHalf: d.preHalf, memG: d.memG, worst: d.worst, audits: d.audits })) }));
  fs.writeFileSync(out, JSON.stringify({ seed, days, res }, null, 1)) }
