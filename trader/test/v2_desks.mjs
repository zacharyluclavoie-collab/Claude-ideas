// Headless 5-desk run of the demo market, set up like the Master's desks (same areas, Lots of trades, $2,000 each,
// desk seed = seed + desk*101). Used to measure the money features one at a time (Spec V2, Part 4) and for the
// write-off ladder test (J2). Usage: node test/v2_desks.mjs <seed> <days> '<money json>' [label]
import { makeCtx, ev } from "./harness.mjs";
const DESKS = [{ n: "Solana", chains: ["solana"] }, { n: "Base", chains: ["base"] }, { n: "BSC", chains: ["bsc"] }, { n: "Arbitrum", chains: ["arbitrum"] }, { n: "Big coins", chains: ["solana", "base", "bsc", "arbitrum"], trend: true }];
export async function runDesk(d, { seed = 424242, days = 14, money = {}, step = 10, onDay } = {}) {
  const ctx = makeCtx(), D = DESKS[d - 1];
  ev(ctx, `MODE="mock";SEED=(${seed}+${d}*101)|0;rng=mulberry(SEED);load();S=newState(2000);seedPretrained();last={};stats=freshStats();regime="unknown";vnow=SIM0;
    applyPreset('lots');CFG.chains=${JSON.stringify(D.chains)};CFG.onlyTrend=${!!D.trend};${D.trend ? "CFG.tr.enabled=true;" : ""}CFG.core.on=false;CFG.simScale=1;CFG.tick=${step};
    Object.assign(CFG.money,${JSON.stringify(money)});MOCK.init();regimeOk=vnow;S.curve=[[vnow,totalEquity()]];`);
  const per = Math.round(86400 / step), eqs = [];
  for (let k = 0; k < days * 24; k++) { await ev(ctx, `__run(${per / 24},${step})`); eqs.push(+ev(ctx, "Math.round(totalEquity()*100)")); if (onDay && (k + 1) % 24 === 0) onDay(ctx, (k + 1) / 24) }
  const r = JSON.parse(ev(ctx, `JSON.stringify((()=>{const pf=S.pf,T=pf.tot||{w:0,l:0,wn:0,ln:0},C=x=>Math.round((x||0)*100),fx=pf.fx||{};let openC=0,pvS=0;for(const p of Object.values(pf.positions)){pvS+=pv(p);openC+=C(p.real)-C(p.cost)}const pvC=C(pvS);openC+=pvC;
    return{eq:C(pf.cash)+pvC,start:C(pf.start),w:C(T.w),l:C(T.l),wn:T.wn||0,ln:T.ln||0,open:openC,openN:Object.keys(pf.positions).length,bb:C(fx.burnBuy),bs:C(fx.burnSell),buyFail:fx.buyFail||0,sellFail:(fx.sellRev||0)+(fx.sellDrop||0)+(fx.sellOther||0),
      woN:pf.woN||0,wo:C(pf.woLoss),worst:pf.worst?{sym:pf.worst.sym,pnl:pf.worst.pnl,reason:pf.worst.reason}:null,ftc:pf.ftcN||0,bank:(pf.bankLog||[]).length,mem:stats.memInfl||0,memFlip:stats.memFlip||0,preSkip:stats.preSkip||0,preHalf:stats.preHalf||0,memG:pf.memG||{},
      scamBought:stats.scamBought||0,exits:pf.exits||{},audits:(pf.audits||[]).filter(a=>/writeoff/.test(a.reason))}})())`));
  r.eqs = eqs; r.desk = D.n; return r;
}
export async function runAll(opts) { const out = []; for (let d = 1; d <= 5; d++) out.push(await runDesk(d, opts)); return sum(out) }
export function sum(ds) {
  const t = { desks: ds, eq: 0, start: 0, w: 0, l: 0, wn: 0, ln: 0, open: 0, bb: 0, bs: 0, woN: 0, wo: 0, buyFail: 0, sellFail: 0, scamBought: 0, ftc: 0, bank: 0, mem: 0, preSkip: 0, preHalf: 0 };
  for (const d of ds) for (const k in t) if (k !== "desks") t[k] += d[k];
  const n = t.wn + t.ln, curve = ds[0].eqs.map((_, i) => ds.reduce((a, d) => a + d.eqs[i], 0)); let pk = t.start, dd = 0; for (const e of curve) { pk = Math.max(pk, e); dd = Math.max(dd, pk - e) }
  Object.assign(t, { n, exp: n ? (t.w + t.l) / n : 0, pf: t.l ? t.w / -t.l : null, profit: t.eq - t.start, dd, woPer1k: n ? t.woN / n * 1000 : 0, curve });
  return t;
}
export const line = (lab, t) => `${lab.padEnd(22)} profit ${(t.profit / 100).toFixed(2).padStart(9)} | trades ${String(t.n).padStart(5)} | win ${(100 * t.wn / Math.max(1, t.n)).toFixed(0)}% | expectancy ${(t.exp / 100).toFixed(3)} | PF ${t.pf ? t.pf.toFixed(2) : "-"} | maxDD ${(t.dd / 100).toFixed(2)} | write-offs ${t.woN} (${(t.wo / 100).toFixed(2)}, ${t.woPer1k.toFixed(1)}/1k) | fees burned ${((t.bb + t.bs) / 100).toFixed(2)} | scam bought ${t.scamBought}`;
if (process.argv[1] && process.argv[1].endsWith("v2_desks.mjs")) {
  const [seed, days, money, lab] = [+(process.argv[2] || 424242), +(process.argv[3] || 14), JSON.parse(process.argv[4] || "{}"), process.argv[5] || "run"];
  const t0 = Date.now(), t = await runAll({ seed, days, money }); console.log(line(lab, t), `| ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  console.log("JSON " + JSON.stringify(Object.assign({}, t, { desks: t.desks.map(d => Object.assign({}, d, { eqs: undefined })), curve: undefined, lab, seed, days, money })));
}
