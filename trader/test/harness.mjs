// Headless engine runner for backtests and tests: loads dist/engine_bundle.js into a vm context.
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
const dir = path.dirname(new URL(import.meta.url).pathname);
const bundle = fs.readFileSync(process.env.BUNDLE || path.join(dir, "..", "dist", "engine_bundle.js"), "utf8");

export function makeCtx() {
  const store = {};
  const ctx = vm.createContext({
    console, setTimeout, clearTimeout, Date, Math, JSON, performance,
    document: { getElementById: () => ({}) }, navigator: {},
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v) }, removeItem: k => { delete store[k] } },
  });
  vm.runInContext('"use strict";\n' + bundle + "\nasync function __run(n,step){for(let i=0;i<n;i++){vnow+=step;await tick()}}", ctx);
  return ctx;
}
export const ev = (ctx, code) => vm.runInContext(code, ctx);

// Run one demo-market simulation; returns summary metrics.
export async function runSim({ seed = 1, days = 3, step = 10, setup = "" } = {}) {
  const ctx = makeCtx();
  ev(ctx, `MODE="mock";SEED=${seed};rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=${step};${setup}`);
  const n = Math.round(days * 86400 / step);
  await ev(ctx, `__run(${n},${step})`);
  return JSON.parse(ev(ctx, `JSON.stringify((()=>{const pf=S.pf,cl=pf.closed,w=cl.filter(c=>c.pnl>0),l=cl.filter(c=>c.pnl<=0),gp=w.reduce((a,c)=>a+c.pnl,0),gl=-l.reduce((a,c)=>a+c.pnl,0);
    let pk=0,mdd=0;for(const [,e] of S.curve){pk=Math.max(pk,e);mdd=Math.max(mdd,(pk-e)/pk*100)}
    return{seed:${seed},eq:equity(),ret:(equity()/pf.start-1)*100,realized:pf.realized,trades:cl.length,win:cl.length?w.length/cl.length:0,pf:gl>0?gp/gl:null,mdd,fees:pf.feesPaid,open:Object.keys(pf.positions).length,shut:pf.shutdown,why:pf.why,
      scamSeen:stats.scamSeen,scamBought:stats.scamBought,bought:stats.bought,scanned:stats.scanned,exp:cl.length?cl.reduce((a,c)=>a+c.r,0)/cl.length:0}})())`));
}
export function summarize(rs) {
  const m = a => a.reduce((x, y) => x + y, 0) / a.length, med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] };
  const rets = rs.map(r => r.ret);
  return { n: rs.length, meanRet: m(rets).toFixed(2), medRet: med(rets).toFixed(2), worst: Math.min(...rets).toFixed(2), best: Math.max(...rets).toFixed(2),
    losing: rs.filter(r => r.ret < 0).length, meanTrades: m(rs.map(r => r.trades)).toFixed(0), meanWin: (100 * m(rs.map(r => r.win))).toFixed(0) + "%", meanMDD: m(rs.map(r => r.mdd)).toFixed(1),
    meanFees: m(rs.map(r => r.fees)).toFixed(0), shutdowns: rs.filter(r => r.shut).length, scamBought: rs.reduce((a, r) => a + r.scamBought, 0), scamSeen: rs.reduce((a, r) => a + r.scamSeen, 0) };
}
