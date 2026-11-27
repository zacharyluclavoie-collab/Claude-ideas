// V3 proof runner: 5 desks set up like the app, run in lockstep one simulated hour at a time, with the Master's hourly
// relay (v3Hour: shared memory, holdings, stair/governor) exactly as the app does it. Same seed = same market for every config.
// Usage: node test/v3_run.mjs <seed> <days> '<money json>' <label> [harsh] [out.json]
import { makeCtx, ev } from "./harness.mjs";
import fs from "node:fs";
const DESKS = [{ n: "Solana", chains: ["solana"] }, { n: "Base", chains: ["base"] }, { n: "BSC", chains: ["bsc"] }, { n: "Arbitrum", chains: ["arbitrum"] }, { n: "Big coins", chains: ["solana", "base", "bsc", "arbitrum"], trend: true }];
export const LEAN = { probeFirst: false, instant: false, lossCap: false };   // V3 lean: sell test, warnings, fingerprints and shared memory ON; probe-size, 10% test sell and loss-cap sizing OFF
export const V2 = { probe: false, probeFirst: false, instant: false, warn: false, finger: false, lossCap: false };
export async function runV3({ seed = 424242, days = 14, money = {}, harsh = false, step = 30 } = {}) {
  const ctxs = DESKS.map((D, i) => { const d = i + 1, ctx = makeCtx();
    ev(ctx, `MODE="mock";SEED=(${seed}+${d}*101)|0;rng=mulberry(SEED);load();S=newState(2000);seedPretrained();last={};stats=freshStats();regime="unknown";vnow=SIM0;
      applyPreset('lots');CFG.chains=${JSON.stringify(D.chains)};CFG.onlyTrend=${!!D.trend};${D.trend ? "CFG.tr.enabled=true;" : ""}CFG.core.on=false;CFG.simScale=1;CFG.tick=${step};
      Object.assign(CFG.money,${JSON.stringify(money)});${harsh === "bear" ? "MOCK.cfg.signal=-0.3;MOCK.cfg.crashPerMin=1/1500;" : harsh ? "MOCK.cfg.signal=0;" : ""}MOCK.init();regimeOk=vnow;S.curve=[[vnow,totalEquity()]];`); return ctx });
  const st = {}, logs = [], curve = []; let pk = 0, dd = 0;
  for (let hr = 1; hr <= days * 24; hr++) {
    const reps = []; for (const ctx of ctxs) { await ev(ctx, `__run(${3600 / step},${step})`); reps.push(JSON.parse(ev(ctx, "JSON.stringify(v3Drain())"))) }
    const g = 1759968000 + hr * 3600;
    const r = v3HourFn(st, reps, Object.assign({}, money), g); logs.push(...r.log); const msg = JSON.stringify(r.msg);
    for (const ctx of ctxs) ev(ctx, `v3Apply(${msg})`);
    const eq = reps.reduce((a, x) => a + x.eq, 0); curve.push(eq); pk = Math.max(pk, eq); dd = Math.max(dd, pk - eq);
  }
  const desks = ctxs.map((ctx, i) => Object.assign({ desk: DESKS[i].n }, JSON.parse(ev(ctx, `JSON.stringify((()=>{const pf=S.pf,T=pf.tot||{w:0,l:0,wn:0,ln:0},C=x=>Math.round((x||0)*100),fx=pf.fx||{};let openC=0,pvS=0;for(const p of Object.values(pf.positions)){pvS+=pv(p);openC+=C(p.real)-C(p.cost)}const pvC=C(pvS);openC+=pvC;
    return{eq:C(pf.cash)+pvC,start:C(pf.start),w:C(T.w),l:C(T.l),wn:T.wn||0,ln:T.ln||0,open:openC,openN:Object.keys(pf.positions).length,bb:C(fx.burnBuy),bs:C(fx.burnSell),woN:pf.woN||0,wo:C(pf.woLoss),ident:(C(pf.cash)+pvC-C(pf.start))-(C(T.w)+C(T.l)+openC-C(fx.burnBuy)+C(pf.yieldEarned)),v3:v3Stats(),exits:pf.exits||{},scamBought:stats.scamBought||0}})())`))));
  const t = { eq: 0, start: 0, w: 0, l: 0, wn: 0, ln: 0, bb: 0, bs: 0, woN: 0, wo: 0, ident: 0, warnLoss: 0, probeN: 0, memHits: 0, fingerHits: 0, scam: 0 };
  let largest = null; const capBreach = [];
  for (const d of desks) { for (const k of ["eq", "start", "w", "l", "wn", "ln", "bb", "bs", "woN", "wo", "ident"]) t[k] += d[k]; t.warnLoss += Math.round(d.v3.enemy.warnLoss * 100); t.probeN += d.v3.hits.probe; t.memHits += d.v3.hits.mem; t.fingerHits += d.v3.hits.finger; t.scam += d.scamBought;
    if (d.v3.largest && (!largest || d.v3.largest.pnl < largest.pnl)) largest = Object.assign({ desk: d.desk }, d.v3.largest); capBreach.push(...d.v3.capBreach) }
  const n = t.wn + t.ln; Object.assign(t, { n, profit: t.eq - t.start, exp: n ? (t.w + t.l) / n : 0, pf: t.l ? t.w / -t.l : null, dd, blockLoss: t.wo + t.warnLoss, largest, capBreach, logs, wr: n ? t.wn / n : 0 });
  return { t, desks };
}
const v3HourSrc = "0"; let v3HourFn;
{ const src = fs.readFileSync(new URL("../src/v3hour.js", import.meta.url), "utf8"); v3HourFn = new Function(src + "\nreturn v3Hour;")() }
export const fmtLine = (lab, t) => `${lab.padEnd(26)} profit ${(t.profit / 100).toFixed(2).padStart(9)} | trades ${String(t.n).padStart(5)} | win ${(100 * t.wr).toFixed(0)}% | exp ${(t.exp / 100).toFixed(3)} | PF ${t.pf ? t.pf.toFixed(2) : "-"} | maxDD ${(t.dd / 100).toFixed(2)} | fees ${((t.bb + t.bs) / 100).toFixed(2)} | write-offs ${t.woN} (${(t.wo / 100).toFixed(2)}) | block loss ${(t.blockLoss / 100).toFixed(2)} | probe skips ${t.probeN} mem ${t.memHits} fp ${t.fingerHits} | largest ${t.largest ? t.largest.pnl.toFixed(2) + " " + t.largest.sym + " " + t.largest.reason : "-"} | ident ${t.ident}`;
if (process.argv[1] && process.argv[1].endsWith("v3_run.mjs")) {
  const [seed, days, mj, lab, harsh, out] = [+(process.argv[2] || 424242), +(process.argv[3] || 14), process.argv[4] || "{}", process.argv[5] || "run", process.argv[6] === "bear" ? "bear" : process.argv[6] === "harsh", process.argv[7]];
  const money = mj === "V2" ? V2 : mj === "LEAN" ? LEAN : mj === "COLD2" ? Object.assign({}, LEAN, { cold2: true }) : mj === "GOV" ? Object.assign({}, LEAN, { governor: true }) : JSON.parse(mj), t0 = Date.now(), r = await runV3({ seed, days, money, harsh });
  console.log(fmtLine(`${lab} s${seed}${harsh ? " " + (harsh === "bear" ? "bear" : "harsh") : ""}`, r.t), `| ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  if (out) fs.writeFileSync(out, JSON.stringify({ seed, days, harsh, lab, money, t: Object.assign({}, r.t), desks: r.desks.map(d => Object.assign({}, d, { v3: Object.assign({}, d.v3, { form: undefined }) })) }));
}
