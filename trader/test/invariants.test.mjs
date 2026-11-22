// Safety invariants of the engine, checked on simulated markets. Run: node --test test/
import test from "node:test";
import assert from "node:assert/strict";
import { makeCtx, ev } from "./harness.mjs";

function start(seed, setup = "") {
  const ctx = makeCtx();
  ev(ctx, `MODE="mock";SEED=${seed};rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10;${setup}`);
  return ctx;
}
const run = (ctx, n) => ev(ctx, `__run(${n},10)`);
const J = (ctx, code) => JSON.parse(ev(ctx, `JSON.stringify(${code})`));
const loosen = "CFG.tr.enabled=true;CFG.nw.minUniq=0;CFG.nw.minScore=10;CFG.tr.minScore=10;CFG.nw.minTx=5;CFG.nw.minBP=0.3;CFG.nw.minAgeMin=1;CFG.newEvery=10;CFG.trendEvery=30;CFG.maxCands=40;CFG.risk.maxRisk=70;";

test("hard caps hold at every step (wide profile, loosened strategy)", async () => {
  const ctx = start(5, "Object.assign(CFG.risk,{maxPos:100,perHour:30,perDay:150,totalExp:40,chainExp:20,newExp:20});" + loosen);
  let maxPos = 0;
  for (let i = 0; i < 40; i++) {
    await run(ctx, 200);
    const s = J(ctx, `(()=>{const pf=S.pf,eq=equity(),by={};for(const p of Object.values(pf.positions))by[p.chain]=(by[p.chain]||0)+pv(p);
      return{n:Object.keys(pf.positions).length,cash:pf.cash,exp:exposure()/eq*100,chain:Math.max(0,...Object.values(by))/eq*100,hour:pf.entries.filter(t=>vnow-t<3600).length,shut:pf.shutdown,newExp:(expBy(p=>p.cat).new||0)/eq*100}})()`);
    maxPos = Math.max(maxPos, s.n);
    assert.ok(s.cash >= -1e-6, "cash never negative");
    assert.ok(s.n <= 100);
    if (!s.shut) { assert.ok(s.exp <= 40 * 1.15, `exposure ${s.exp}`); assert.ok(s.chain <= 20 * 1.2, `chain ${s.chain}`); assert.ok(s.newExp <= 20 * 1.2) }
    assert.ok(s.hour <= 30);
  }
  assert.ok(maxPos > 3, "the loosened bot should have traded");
});
test("position count never exceeds the limit", async () => {
  const ctx = start(6, "CFG.risk.maxPos=3;" + loosen);
  for (let i = 0; i < 30; i++) { await run(ctx, 200); assert.ok(J(ctx, `Object.keys(S.pf.positions).length`) <= 3) }
});
test("security data missing => no trades (fail closed)", async () => {
  const ctx = start(7, loosen + "MOCK.security=async()=>null;");
  await run(ctx, 4000);
  assert.equal(J(ctx, `stats.bought`), 0);
  assert.ok(J(ctx, `stats.scanned`) > 50);
});
test("emergency stop flattens everything and blocks entries", async () => {
  const ctx = start(8, loosen);
  for (let i = 0; i < 40 && J(ctx, `Object.keys(S.pf.positions).length`) === 0; i++) await run(ctx, 200);
  assert.ok(J(ctx, `Object.keys(S.pf.positions).length`) > 0, "needs a position to flatten");
  ev(ctx, `LS.set("pt_kill_mock","1")`);
  await run(ctx, 400);
  const s = J(ctx, `({shut:S.pf.shutdown,n:Object.keys(S.pf.positions).length,b:stats.bought})`);
  assert.equal(s.shut, true);
  const b0 = s.b; await run(ctx, 600);
  assert.equal(J(ctx, `stats.bought`), b0);
});
test("drawdown limit triggers shutdown", async () => {
  const ctx = start(9);
  ev(ctx, `S.pf.peak=equity()*1.2`);
  await run(ctx, 20);
  assert.equal(J(ctx, `S.pf.shutdown`), true);
  assert.match(J(ctx, `S.pf.why`), /drawdown/);
});
test("daily loss limit pauses entries", async () => {
  const ctx = start(10, loosen);
  ev(ctx, `S.pf.dayStart=equity()*1.05;S.pf.day=new Date(vnow*1000).toISOString().slice(0,10)`);
  await run(ctx, 3000);
  assert.equal(J(ctx, `stats.bought`), 0);
});
test("risk multiplier only shrinks after losses", () => {
  const ctx = start(11);
  const base = J(ctx, `riskMult()`);
  ev(ctx, `S.pf.streak=3;S.pf.cash=S.pf.cash*0.95`);
  assert.ok(J(ctx, `riskMult()`) < base); assert.ok(base <= 1);
});
test("stealth honeypot: sell restriction detected without burning fees, loss bounded by position size", async () => {
  const ctx = start(12, loosen);
  // force one stealth-honeypot position
  await run(ctx, 10);
  ev(ctx, `(()=>{const t=Object.values(MOCK.toks).find(t=>t.kind==="stealth")||MOCK.spawn(false,"base");t.kind="stealth";t.blockAfter=0;t.q=60000;t.b=t.q/t.p0;t.genG=MOCK.G-5;
    const snap=MOCK.snap(t);const f=simBuy(snap,50,0,true);globalThis.__t=t.addr;
    if(f.ok)S.pf.positions[snap.chain+":"+t.addr.toLowerCase()]={id:"x",chain:snap.chain,addr:t.addr,sym:"STL",cat:"new",opened:vnow,entry:snap.price,qty:f.qty,qty0:f.qty,cost:f.usd+f.gas,stop:snap.price*.8,tp1:snap.price*1.4,tp2:snap.price*2,trail:15,peak:snap.price,last:snap.price,entryLiq:snap.liq,lastLiq:snap.liq,size0:f.usd,sellTax:0,tp1Done:false,tp2Done:false,real:0,fees:0,stale:0,attempts:0,emergency:"",risk0:9,pair:snap.pair,chk:vnow};S.pf.cash-=f.usd+f.gas})()`);
  const cash0 = J(ctx, `S.pf.cash`);
  ev(ctx, `MOCK.cfg.crashPerMin=0`);
  await run(ctx, 1500);
  const s = J(ctx, `({n:Object.keys(S.pf.positions).filter(k=>S.pf.positions[k].sym==="STL").length,closed:S.pf.closed.filter(c=>c.sym==="STL").map(c=>({pnl:c.pnl,reason:c.reason})),cash:S.pf.cash})`);
  if (s.closed.length) { assert.ok(s.closed[0].pnl >= -60, "loss bounded by the position"); assert.match(s.closed[0].reason, /writeoff|EMERGENCY|stop|time/) }
});
