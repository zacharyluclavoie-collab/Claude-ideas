import { runSim, summarize } from "./harness.mjs";
const seeds = +process.argv[2] || 6, days = +process.argv[3] || 3, rs = [];
const t0 = Date.now();
for (let s = 1; s <= seeds; s++) { const r = await runSim({ seed: s, days }); rs.push(r); console.log(`seed ${s}: ret ${r.ret.toFixed(2)}% trades ${r.trades} win ${(100*r.win).toFixed(0)}% mdd ${r.mdd.toFixed(1)} scamBought ${r.scamBought}/${r.scamSeen}`); }
console.log(summarize(rs), ((Date.now() - t0) / 1000).toFixed(0) + "s");
