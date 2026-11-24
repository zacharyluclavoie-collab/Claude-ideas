// Unseen-market check for round-3 settings: re-tests chosen round-3 configs (and the current Lots of trades) on seeds 701+.
//   node test/holdout3.mjs <ids comma-separated, e.g. 17,14> <seeds=10> <days=3>
import fs from "node:fs";
import { setup, run, score } from "./search3.mjs";
const ids = (process.argv[2] || "17").split(",").map(Number), HS = +process.argv[3] || 10, DAYS = +process.argv[4] || 3;
const F = new URL("./search_results.jsonl", import.meta.url).pathname;
const rows = fs.readFileSync(F, "utf8").trim().split("\n").map(l => JSON.parse(l)).filter(r => r.round === 3 && r.phase === "train");
const seeds = [...Array(HS)].map((_, i) => 701 + i);
for (const c of [{ ref: "lots" }, ...ids.map(i => rows.find(r => r.i === i).c)]) {
  const sc = score(await run(seeds, setup(c), DAYS), DAYS);
  fs.appendFileSync(F, JSON.stringify({ round: 3, phase: "holdout", c, setup: setup(c), ...sc }) + "\n");
  console.log(`HOLDOUT ${c.ref || "#" + ids[0]} ret/day ${sc.ret.toFixed(3)}% med ${sc.med.toFixed(3)} worst ${sc.worst.toFixed(3)} open ${sc.open.toFixed(1)} trades/day ${sc.trades.toFixed(0)} mdd ${sc.mdd.toFixed(2)}% losing ${sc.lose}/${HS} ${JSON.stringify(c)}`);
}
console.log("DONE");
