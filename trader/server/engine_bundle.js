/* ============================ config (mirrors paper_trader/config.py) ============================ */
const CFG = {
  chains:["solana","base","ethereum","bsc"],
  tick:5, monitorEvery:10, newEvery:30, trendEvery:120, recheckEvery:300, regimeEvery:120, equityEvery:300,
  maxCands:16, rejectMin:45, rejectNewMin:8, rejectTrendMin:20,
  risk:{perTradePct:0.5, posTrend:2, posNew:1, totalExp:40, newExp:20, chainExp:20, cashReserve:20, maxPos:100,
        liqFrac:0.006, minTrade:15, dailyLoss:3, maxDD:12, maxTotalLoss:20, streakPause:3, pauseMin:60,
        perHour:30, perDay:150, cooldownH:12, maxRisk:45, minRR:1.5, maxCostPct:3},
  sec:{buyTax:5, sellTax:8, liqNew:15000, liqTrend:100000, holdersNew:100, holdersTrend:500, top10:45, creator:8, owner:8, lpLocked:70, volLiq:40},
  nw:{enabled:true, minAgeMin:10, maxAgeH:24, minTx:50, minBP:0.55, maxChg1h:300, maxFdvLiq:60, minScore:60, minVlr:0, minUniq:0.5, minChg1h:-1000, stop:18, tp1:40, tp2:100, trail:15, maxHoldH:12},
  tr:{enabled:false, minAgeH:72, minVol:150000, minAccel:1.5, minBP:0.52, maxChg24:150, minScore:62, stop:10, tp1:20, tp2:45, trail:8, maxHoldH:48},
  tp1Frac:0.5, tp2Frac:0.25,
  em:{liqTotal:0.5, liqStep:0.3, priceStep:0.3, staleMin:20, staleHaircut:0.5, maxAttempts:12, danger:-3, crash:-8, regimeUnknownMin:15},
  ex:{fee:0.30, gas:{ethereum:5,base:0.04,bsc:0.12,solana:0.01,arbitrum:0.08}, fail:0.04, newFail:0.05, partial:0.10, buyTolNew:4, buyTolTrend:1.5, maxSellSlip:8, maxEmSlip:30}
};
const LS={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const DEMO_ONLY=false;
const freshStats=()=>({scanned:0,strat:0,sec:0,vetoed:0,bought:0,scamSeen:0,scamBought:0,junkSeen:0,seen:{}});
const $ = id => document.getElementById(id);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fmt=(n,d=2)=>(n<0?"-":"")+"$"+Math.abs(n).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=(n)=>(n>=0?"+":"")+n.toFixed(2)+"%";
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let SEED=7,rng=mulberry(7);
const gauss=()=>{let u=0,v=0;while(!u)u=rng();v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};

/* ============================ state ============================ */
let MODE=DEMO_ONLY?"mock":(LS.get("pt_mode")||"live"),SPEED=+LS.get("pt_speed")||60;
let paused=false, vnow=1.76e9, last={}, regime="unknown", regimeOk=0, rejected={}, stats=freshStats();
let S; // {pf, journal[], trades[]}
const key=()=>"pt_state_"+MODE;
function newState(cap){return{feed:[],pf:{exec:{buys:0,sells:0,failed:0,mev:0,slipSum:0,slipN:0},feesPaid:0,start:cap,cash:cap,positions:{},realized:0,peak:cap,day:"",dayStart:cap,streak:0,pauseUntil:0,entries:[],cool:{},shutdown:false,why:"",closed:[]},journal:[],trades:[],curve:[]}}
function load(){S=null;if(MODE!=="mock"){try{S=JSON.parse(LS.get(key()))}catch(e){S=null}}if(!S)S=newState(+LS.get("pt_cap")||10000);if(!S.feed)S.feed=[];if(S.pf.feesPaid==null)S.pf.feesPaid=0;if(!S.pf.exec)S.pf.exec={buys:0,sells:0,failed:0,mev:0,slipSum:0,slipN:0}}
function dayAdd(v,t){const d=new Date(t*1000).toISOString().slice(0,10),m=S.pf.daily||(S.pf.daily={});m[d]=(m[d]||0)+v}
function save(){if(S.trades.length>600)S.trades.length=600;if(MODE!=="mock")LS.set(key(),JSON.stringify(S))}
const now=()=>MODE==="mock"?vnow:Date.now()/1000;
const toastQ=[];
function ev(level,kind,tok,msg){S.journal.unshift({t:now(),level,kind,tok,msg});toastQ.push({level,kind,tok,msg});if(toastQ.length>30)toastQ.shift();if(S.journal.length>300)S.journal.length=300}

/* ============================ portfolio helpers ============================ */
const pv=p=>exitValue(p.qty,p.last,p.lastLiq,p.sellTax);
const exposure=()=>Object.values(S.pf.positions).reduce((a,p)=>a+pv(p),0);
const equity=()=>S.pf.cash+exposure();
const expBy=fn=>{const o={};for(const p of Object.values(S.pf.positions))o[fn(p)]=(o[fn(p)]||0)+pv(p);return o};


/* ============================ security (mirrors security.py) ============================ */
function evalSecurity(sec,snap,cat,t){
  const checks=[];const add=(n,ok)=>checks.push([n,!!ok,true]);
  if(!sec)return{pass:false,risk:100,fails:["security_data_available"],checks:[["security_data_available",false]]};
  const isNew=cat==="new",c=CFG.sec,f=(n,v)=>add(n,v===false);
  if(!sec.sol){f("not_honeypot",sec.honeypot);f("no_hidden_owner",sec.hiddenOwner);f("no_ownership_takeback",sec.takeBack);
    f("owner_cannot_change_balance",sec.ownerBal);f("transfers_not_pausable",sec.pausable);f("can_sell_all",sec.cannotSellAll);
    f("no_slippage_modification",sec.slipMod);f("no_selfdestruct",sec.selfdestruct);f("not_mintable",sec.mintable);
    f("no_blacklist",sec.blacklist);f("creator_no_honeypot_history",sec.creatorHP);add("contract_verified",sec.openSource===true);add("tradable_on_dex",sec.inDex===true)}
  else{f("not_mintable",sec.mintable);f("not_freezable",sec.freezable);f("not_closable",sec.closable);f("transferable",sec.nonTransferable);f("owner_cannot_change_balance",sec.ownerBal)}
  add("buy_tax",sec.buyTax!=null&&sec.buyTax<=c.buyTax);add("sell_tax",sec.sellTax!=null&&sec.sellTax<=c.sellTax);
  add("holders",sec.holders!=null&&sec.holders>=(isNew?c.holdersNew:c.holdersTrend));
  add("top10",sec.top10!=null&&sec.top10<=c.top10);
  for(const [n,v,l] of [["creator",sec.creator,c.creator],["owner",sec.owner,c.owner]]){if(v==null&&sec.sol)continue;add(n,v!=null&&v<=l)}
  add("liquidity",snap.liq>=(isNew?c.liqNew:c.liqTrend));
  const lp=sec.lpLocked;add("lp_locked",isNew?(lp!=null&&lp>=c.lpLocked):(lp==null||lp>=20||snap.liq>=1e6));
  add("sells_exist",!(snap.buys1h>=20&&snap.sells1h===0));
  add("no_wash",(snap.liq>0?snap.vol24/snap.liq:1e9)<=c.volLiq);
  add("no_vertical_pump",snap.chg1h<=1000&&snap.chg5m<=150);
  let r=Math.min(25,(sec.top10??50)*0.5)+Math.min(10,sec.creator??5)+Math.min(10,(sec.buyTax||0)+(sec.sellTax||0));
  r+=(sec.proxy?6:0)+(sec.extCall?4:0)+(sec.cooldown?5:0)+(sec.sol&&sec.creator==null?5:0)+(isNew?15:0);
  r+=snap.liq<30000?12:snap.liq<100000?6:0;r+=(sec.lpLocked||0)<90?5:0;r+=(sec.holders!=null&&sec.holders<300)?5:0;
  const age=snap.created?(t-snap.created)/3600:null;if(age!=null&&age<1)r+=8;
  const fails=checks.filter(x=>!x[1]).map(x=>x[0]);
  return{pass:!fails.length,risk:Math.min(100,r),fails,checks:checks.map(c=>[c[0],c[1]])};
}


/* ============================ strategy (mirrors strategy.py) ============================ */
const bp=s=>{const n=s.buys1h+s.sells1h;return n?s.buys1h/n:0};
const ageH=(s,t)=>s.created?Math.max(0,(t-s.created)/3600):null;
function mkPlan(s,cat,score,reason){const c=cat==="new"?CFG.nw:CFG.tr;
  const stop=clamp(Math.abs(s.chg1h)*0.4,c.stop,c.stop*2),tp1=Math.max(c.tp1,stop*2),tp2=Math.max(c.tp2,cat==="new"?tp1*2:tp1*2.2);
  return{stop,tp1,tp2,trail:c.trail,score,rr:tp1/stop,reason}}
function analyzeNew(s,t){const c=CFG.nw,rej=[],age=ageH(s,t);if(!c.enabled)return[null,["new-token entries are switched off"]];if(age==null)return[null,["unknown age"]];
  if(age*60<c.minAgeMin)rej.push("too young");if(age>c.maxAgeH)rej.push("not new");if(s.liq<CFG.sec.liqNew)rej.push("liquidity low");
  const tx=s.buys1h+s.sells1h;if(tx<c.minTx)rej.push("thin activity ("+tx+"/1h)");const b=bp(s);if(b<c.minBP)rej.push("weak buy pressure "+b.toFixed(2));
  if(s.chg1h>c.maxChg1h)rej.push("already pumped "+s.chg1h.toFixed(0)+"%");if(s.chg5m<-5)rej.push("dumping now");
  if(s.fdv>0&&s.liq>0&&s.fdv/s.liq>c.maxFdvLiq)rej.push("FDV/liq high");
  const vlr=s.vol1h/s.liq;if(vlr<c.minVlr)rej.push("turnover too low ("+vlr.toFixed(2)+"x/h)");
  if(s.buyers1h!=null&&s.buys1h>=20&&s.buyers1h/s.buys1h<c.minUniq)rej.push("few unique buyers (wash trading?)");
  if(s.chg1h<c.minChg1h)rej.push("no uptrend ("+s.chg1h.toFixed(0)+"%/1h)");
  if(rej.length)return[null,rej];
let sc=clamp(Math.log10(s.liq/CFG.sec.liqNew+1)*25,0,25)+clamp((b-0.5)*120,0,20)+(vlr>=0.3&&vlr<=10?15:vlr<=25?5:0)
   +(s.chg6h>=0?clamp(s.chg1h*0.5,0,15):0)+(age>=0.5&&age<=8?10:5)+clamp(Math.log10(Math.max(tx,1)/c.minTx+1)*15,0,15);
  if(sc<c.minScore)return[null,["score "+sc.toFixed(0)+" < "+c.minScore]];
  return[mkPlan(s,"new",sc,`age=${age.toFixed(1)}h liq=${s.liq.toFixed(0)} bp=${b.toFixed(2)}`),[]]}
function analyzeTrend(s,t,breakout){const c=CFG.tr,rej=[],age=ageH(s,t);if(!c.enabled)return[null,["established-token entries are switched off"]];
  if(age==null||age<c.minAgeH)rej.push("insufficient history");if(s.liq<CFG.sec.liqTrend)rej.push("liquidity low");if(s.vol24<c.minVol)rej.push("volume low");
  const acc=s.vol24>0?s.vol1h*24/s.vol24:0;if(acc<c.minAccel)rej.push("no volume acceleration");const b=bp(s);if(b<c.minBP)rej.push("weak buy pressure");
  if(!(s.chg1h>=1&&s.chg1h<=25))rej.push("1h move outside 1..25%");if(s.chg6h<2)rej.push("6h trend weak");if(s.chg24>c.maxChg24)rej.push("overextended");
  if(s.chg5m<-1)rej.push("short-term weakness");if(rej.length)return[null,rej];
  const sc=clamp((acc-1)*20,0,25)+clamp((b-0.5)*150,0,20)+clamp(s.chg1h*1.2,0,15)+clamp(s.chg6h*0.6,0,10)+clamp(Math.log10(s.liq/CFG.sec.liqTrend+1)*20,0,15)+(breakout?15:breakout==null?0:-10);
  if(sc<c.minScore)return[null,["score "+sc.toFixed(0)+" < "+c.minScore]];
  return[mkPlan(s,"trending",sc,`accel=${acc.toFixed(1)}x bp=${b.toFixed(2)} breakout=${breakout}`),[]]}


const NOT_TRADABLE=new Set(["usdt","usdc","dai","weth","wbtc","wsol","sol","eth","btc","bnb","wbnb","usde","fdusd","tusd","usdd","busd","steth","wsteth","cbbtc","cbeth","usds","pyusd"]);
/* ============================ risk manager (mirrors risk.py) ============================ */
function riskMult(){const pf=S.pf,eq=equity(),dd=Math.max(0,(pf.peak-eq)/pf.peak*100);let m=1-0.6*Math.min(1,dd/CFG.risk.maxDD);if(pf.streak>=2)m*=0.5;return clamp(m,0.1,1)}
function shutdownReason(){const pf=S.pf;if(pf.shutdown)return pf.why;const eq=equity();pf.peak=Math.max(pf.peak,eq);
  const dd=(pf.peak-eq)/pf.peak*100;if(dd>=CFG.risk.maxDD)return`max drawdown ${dd.toFixed(1)}%`;
  const loss=(pf.start-eq)/pf.start*100;if(loss>=CFG.risk.maxTotalLoss)return`total loss ${loss.toFixed(1)}%`;return""}
function approve(snap,cat,risk,plan,t){const R=CFG.risk,pf=S.pf,no=r=>({ok:false,why:r});
  if(pf.shutdown)return no("shutdown");if(!marketOk(t))return no("market regime");
  if(pf.dayStart>0&&(pf.dayStart-equity())/pf.dayStart*100>=R.dailyLoss)return no("daily loss limit");
  if(t<pf.pauseUntil)return no("paused after losses");const k=snap.chain+":"+snap.addr.toLowerCase();
  if(pf.positions[k])return no("already held");if(NOT_TRADABLE.has(snap.sym.toLowerCase()))return no("base asset or stablecoin");if(Object.values(pf.positions).some(p=>p.sym.toLowerCase()===snap.sym.toLowerCase()))return no("same symbol already held (clone risk)");if(t<(pf.cool[k]||0))return no("re-entry cooldown");
  if(pf.entries.filter(x=>t-x<3600).length>=R.perHour)return no("hourly entry limit");if(pf.entries.filter(x=>t-x<86400).length>=R.perDay)return no("daily entry limit");
  if(Object.keys(pf.positions).length>=R.maxPos)return no("max positions");if(risk>R.maxRisk)return no("risk score "+risk.toFixed(0));if(plan.rr<R.minRR)return no("reward/risk");
  const eq=equity(),ex=exposure(),caps={share:eq*R.totalExp/100/R.maxPos*1.6,risk:eq*R.perTradePct/100/(plan.stop/100)*riskMult(),pos:eq*(cat==="new"?R.posNew:R.posTrend)/100,
    liq:snap.liq*R.liqFrac,total:eq*R.totalExp/100-ex,cash:pf.cash-eq*R.cashReserve/100,chain:eq*R.chainExp/100-(expBy(p=>p.chain)[snap.chain]||0)};
  if(cat==="new")caps.newExp=eq*R.newExp/100-(expBy(p=>p.cat).new||0);
  let name="",usd=Infinity;for(const [n,v] of Object.entries(caps))if(v<usd){usd=v;name=n}
  if(usd<R.minTrade)return no(`size ${usd.toFixed(0)} below min (${name})`);
  {const gasRT=2*(CFG.ex.gas[snap.chain]??0.5)*1.2+(snap.chain==="solana"&&cat==="new"?0.15:0),res=Math.max(snap.liq/2,1),cost=gasRT/usd+2*CFG.ex.fee/100+2*usd/res;
   if(cost>R.maxCostPct/100)return no(`round-trip cost ${(cost*100).toFixed(1)}% of size is too high (${(gasRT/usd*100).toFixed(1)}% network fees)`)}
  if(false)return no(`size ${usd.toFixed(0)} below min (${name})`);return{ok:true,usd,why:`size ${usd.toFixed(0)} (${name})`}}
function regimeOf(m){if(!m)return"unknown";const v=Object.values(m),w=Math.min(...v),a=v.reduce((x,y)=>x+y,0)/v.length;
  if(w<=CFG.em.crash||a<=CFG.em.crash/1.5)return"crash";if(w<=CFG.em.danger||a<=CFG.em.danger/1.5)return"danger";return"ok"}
const marketOk=t=>regime==="ok"&&(t-regimeOk)/60<=CFG.em.regimeUnknownMin;


/* ============================ execution simulator ============================
 * Realistic frictions: constant-product price impact from the pool's real reserves, DEX fee, network fees (priority tips on
 * new tokens), latency (price keeps moving while the order lands, against you when flow follows your signal), sandwiching of
 * larger buys, dropped and reverted transactions, slippage limits, partial fills, token taxes, blocked sells.
 * In the demo market our swaps are applied to the pool, so we move the price like any other trader.
 */
const EXEC_LAT = { solana: 2.5, base: 4, bsc: 5, ethereum: 13, arbitrum: 3 };        // seconds from decision to inclusion
const EXEC_MEV = { solana: 0.22, base: 0.12, bsc: 0.35, ethereum: 0.30, arbitrum: 0.10 };
function gasUsd(chain, isNew) {
  const g = CFG.ex.gas[chain] ?? 0.5, tip = chain === "solana" && isNew ? 0.04 + rng() * 0.25 : 0;
  return g * (0.8 + rng() * 0.8) + tip;
}
function poolOf(snap) {
  if (MODE === "mock") { const t = MOCK.toks[snap.addr.toLowerCase()]; if (t) return { q: t.q, b: t.b, t, flow: t.flow } }
  const q = Math.max(snap.liq / 2, 1);
  return { q, b: q / Math.max(snap.price, 1e-18), t: null, flow: (snap.chg5m || 0) / 100 / 5 / 2 * 0.5 };   // per-minute net flow, inferred from the 5m move
}
// extra price move (fraction, >0 means against us) while the order is in flight
function driftAgainst(pool, side, lat) {
  const m = lat / 60, flowMove = Math.pow(1 + pool.flow * m, 2) - 1, noise = gauss() * 0.004 * Math.sqrt(Math.max(m, 0.02));
  return side === "buy" ? flowMove + noise : -flowMove + noise;
}
function simBuy(s, usd, tax, isNew) {
  const x = CFG.ex, gas = gasUsd(s.chain, isNew), lat = (EXEC_LAT[s.chain] || 5) * (0.8 + rng() * 1.2) + 1;
  const pFail = x.fail + (isNew ? x.newFail : 0) + (s.chain === "solana" && isNew ? 0.06 : 0);
  if (rng() < pFail) return rng() < 0.6 ? { ok: false, why: "tx reverted, fee burned", gas, fee: 0, slip: 0 } : { ok: false, why: "tx dropped, no fill", gas: 0, fee: 0, slip: 0 };
  const pool = poolOf(s), tol = (isNew ? x.buyTolNew : x.buyTolTrend) / 100, fee = x.fee / 100;
  // size the pool can absorb inside the slippage limit
  const maxIn = pool.q * (Math.sqrt(1 + tol * 0.6) - 1) / (1 - fee);
  let partial = false, want = usd;
  if (usd > maxIn) { usd = maxIn; partial = true }
  if (isNew && rng() < x.partial) { usd *= 0.5 + rng() * 0.45; partial = true }
  if (usd < 1) return { ok: false, why: "no executable size", gas, fee: 0, slip: 0 };
  const dq = usd * (1 - fee), k = pool.q * pool.b, b2 = k / (pool.q + dq), tokPool = pool.b - b2;
  const impactPx = tokPool > 0 ? (usd / tokPool) / s.price - 1 : 1;                 // avg price paid vs mid, from pool math
  const drift = driftAgainst(pool, "buy", lat);
  let sandwich = 0;
  if (rng() < (EXEC_MEV[s.chain] || 0.2) * clamp(usd / 400, 0, 1)) sandwich = clamp(2 * impactPx + 0.005, 0, tol * 0.8);
  const total = impactPx + Math.max(drift, -0.01) + sandwich;
  if (total > tol) return { ok: false, why: `slippage ${(total * 100).toFixed(1)}% > ${(tol * 100).toFixed(1)}% limit, reverted`, gas, fee: 0, slip: total * 100 };
  if (pool.t) MOCK.buyQuote(pool.t, usd);
  const px = s.price * (1 + total), qty = usd / px * (1 - tax / 100);
  return { ok: true, why: (partial ? "filled (partial)" : "filled") + (sandwich ? ", sandwiched" : ""), qty, px, usd, fee: usd * fee, gas, slip: total * 100, partial, mev: sandwich > 0, lat };
}
function simSell(s, qty, tax, urgent, attempt, blocked) {
  const x = CFG.ex, gas = gasUsd(s.chain, false), lat = (EXEC_LAT[s.chain] || 5) * (0.8 + rng() * 1.2) + 1;
  if (blocked) return { ok: false, why: "sell reverted in pre-flight simulation (token restricts selling); no fee", gas: 0, fee: 0, slip: 0 };
  if (rng() < x.fail * (urgent ? 2 : 1)) return rng() < 0.6 ? { ok: false, why: "tx reverted, fee burned", gas, fee: 0, slip: 0 } : { ok: false, why: "tx dropped, no fill", gas: 0, fee: 0, slip: 0 };
  if (s.price <= 0 || s.liq <= 0) return { ok: false, why: "no liquidity", gas, fee: 0, slip: 0 };
  const pool = poolOf(s), fee = x.fee / 100, tol = Math.min((urgent ? x.maxEmSlip : x.maxSellSlip) + attempt * 2, 60) / 100;
  let tokIn = qty * (1 - tax / 100), partial = false;
  // largest sale whose pool impact stays inside the limit: price impact of selling t tokens ~ 1-(b/(b+t))^2
  const maxTok = pool.b * (1 / Math.sqrt(1 - Math.min(tol * 0.7, 0.95)) - 1);
  if (tokIn > maxTok) { qty *= maxTok / tokIn; tokIn = maxTok; partial = true }
  const k = pool.q * pool.b, q2 = k / (pool.b + tokIn), outPool = (pool.q - q2) * (1 - fee);
  const mid = tokIn * s.price, impact = mid > 0 ? 1 - outPool / mid : 1;
  const drift = driftAgainst(pool, "sell", lat);
  let sandwich = 0;
  if (rng() < (EXEC_MEV[s.chain] || 0.2) * clamp(mid / 600, 0, 1) * 0.6) sandwich = clamp(2 * impact + 0.004, 0, tol * 0.8);
  const total = impact + Math.max(drift, -0.01) + sandwich;
  if (total > tol) return { ok: false, why: `slippage ${(total * 100).toFixed(1)}% > limit`, gas, fee: 0, slip: total * 100 };
  if (pool.t) MOCK.sellTokens(pool.t, tokIn);
  const out = Math.max(0, mid * (1 - total));
  return { ok: true, why: (partial ? "filled (partial)" : "filled") + (sandwich ? ", sandwiched" : ""), qty, px: s.price * (1 - total), usd: out, fee: mid * fee, gas, slip: total * 100, partial, mev: sandwich > 0, lat };
}
// liquidation value of a position: what selling it into the pool would return now
const exitValue = (qty, price, liq, tax) => { const val = qty * price, R = Math.max(liq / 2, 1); return val * R / (R + val) * (1 - tax / 100) * 0.997 };

/* ============================ live data providers (read-only public GET endpoints) ============================
 * DexScreener (prices, pairs), GeckoTerminal (new / trending pools, candles), GoPlus (token security), CoinGecko (majors).
 * No keys, no wallet. Any failure returns empty/null and the engine then fails closed (no data => no trade).
 */
const GT_NET = { solana: "solana", ethereum: "eth", base: "base", bsc: "bsc", arbitrum: "arbitrum" };
const GP_CHAIN = { ethereum: "1", bsc: "56", base: "8453", arbitrum: "42161" };
const MIN_GAP = { "api.dexscreener.com": 350, "api.geckoterminal.com": 2200, "api.gopluslabs.io": 2200, "api.coingecko.com": 3000 };
const nextAt = {}, coolUntil = {};
let health = { ok: 0, fail: 0, lastErr: "", byHost: {} };
const hostStat = h => health.byHost[h] || (health.byHost[h] = { ok: 0, fail: 0 });

async function getJSON(url) {
  const host = new URL(url).host, gap = MIN_GAP[host] || 1000, st = hostStat(host);
  if ((coolUntil[host] || 0) > Date.now()) { health.fail++; st.fail++; return null }                      // backing off after a rate limit
  const wait = Math.max(0, (nextAt[host] || 0) - Date.now());
  nextAt[host] = Math.max(Date.now(), nextAt[host] || 0) + gap;
  if (wait) await new Promise(r => setTimeout(r, wait));
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { accept: "application/json" } });
    if (r.status === 429) { coolUntil[host] = Date.now() + 30000; throw new Error("HTTP 429 rate limited, pausing 30s") }
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json(); health.ok++; st.ok++; return j;
  } catch (e) { health.fail++; st.fail++; health.lastErr = host + ": " + e.message; return null }
  finally { clearTimeout(to) }
}
const num = (x, d = 0) => { const n = parseFloat(x); return isFinite(n) ? n : d };
const int0 = x => { const n = parseInt(x, 10); return isFinite(n) ? n : 0 };

// ---- parsers (pure; unit-tested against recorded payload shapes) ----
function geckoPool(chain, pool) {
  try {
    const a = pool.attributes, addr = pool.relationships.base_token.data.id.split("_").slice(1).join("_"), tx = a.transactions || {}, v = a.volume_usd || {}, c = a.price_change_percentage || {};
    const h1 = tx.h1 || {}, h24 = tx.h24 || {};
    if (!addr) return null;
    return { chain, addr, sym: String(a.name || "?").split(" / ")[0].trim(), price: num(a.base_token_price_usd), liq: num(a.reserve_in_usd), fdv: num(a.fdv_usd),
      vol5: num(v.m5), vol1h: num(v.h1), vol6: num(v.h6), vol24: num(v.h24), chg5m: num(c.m5), chg1h: num(c.h1), chg6h: num(c.h6), chg24: num(c.h24),
      buys1h: int0(h1.buys), sells1h: int0(h1.sells), buyers1h: h1.buyers != null ? int0(h1.buyers) : null, sellers1h: h1.sellers != null ? int0(h1.sellers) : null,
      pair: a.address || "", created: a.pool_created_at ? Date.parse(a.pool_created_at) / 1000 : null };
  } catch (e) { return null }
}
function dexPair(chain, p) {
  try {
    const a = p.baseToken.address, liq = num((p.liquidity || {}).usd), tx = p.txns || {}, v = p.volume || {}, c = p.priceChange || {}, created = p.pairCreatedAt;
    return { chain, addr: a, sym: p.baseToken.symbol || "?", price: num(p.priceUsd), liq, fdv: num(p.fdv), vol5: num(v.m5), vol1h: num(v.h1), vol6: num(v.h6), vol24: num(v.h24),
      chg5m: num(c.m5), chg1h: num(c.h1), chg6h: num(c.h6), chg24: num(c.h24), buys1h: int0((tx.h1 || {}).buys), sells1h: int0((tx.h1 || {}).sells),
      buyers1h: null, sellers1h: null, pair: p.pairAddress || "", created: created ? created / 1000 : null };
  } catch (e) { return null }
}
const GP_DEAD = ["0x000000000000000000000000000000000000dead", "0x0000000000000000000000000000000000000000"];
function parseGoPlusEvm(r) {
  const b = v => v == null || v === "" ? null : String(v) === "1", pc = v => { const n = parseFloat(v); return isFinite(n) ? n * 100 : null };
  const lp = r.lp_holders || [], lpA = new Set(lp.map(h => (h.address || "").toLowerCase()));
  const locked = lp.filter(h => String(h.is_locked) === "1" || GP_DEAD.includes((h.address || "").toLowerCase())).reduce((a, h) => a + num(h.percent), 0);
  const hs = (r.holders || []).filter(h => !lpA.has((h.address || "").toLowerCase()) && !GP_DEAD.includes((h.address || "").toLowerCase()));
  return { honeypot: b(r.is_honeypot), buyTax: pc(r.buy_tax), sellTax: pc(r.sell_tax), openSource: b(r.is_open_source), proxy: b(r.is_proxy), mintable: b(r.is_mintable),
    hiddenOwner: b(r.hidden_owner), takeBack: b(r.can_take_back_ownership), ownerBal: b(r.owner_change_balance), pausable: b(r.transfer_pausable), cannotSellAll: b(r.cannot_sell_all),
    cooldown: b(r.trading_cooldown), blacklist: b(r.is_blacklisted), slipMod: b(r.slippage_modifiable), selfdestruct: b(r.selfdestruct), extCall: b(r.external_call),
    creatorHP: b(r.honeypot_with_same_creator), inDex: b(r.is_in_dex), holders: /^\d+$/.test(String(r.holder_count)) ? +r.holder_count : null,
    top10: r.holders ? hs.slice(0, 10).reduce((a, h) => a + num(h.percent), 0) * 100 : null, creator: pc(r.creator_percent), owner: pc(r.owner_percent), lpLocked: lp.length ? locked * 100 : null };
}
function parseGoPlusSol(r) {
  const st = k => r[k] == null ? null : String((r[k] || {}).status || "0") === "1";
  const fee = r.transfer_fee && Object.keys(r.transfer_fee).length > 0, hs = r.holders || [], burn = (r.dex || []).map(x => num(x.burn_percent));
  return { sol: true, honeypot: false, buyTax: fee ? 100 : 0, sellTax: fee ? 100 : 0, mintable: st("mintable"), freezable: st("freezable"), closable: st("closable"),
    nonTransferable: r.non_transferable == null ? null : String(r.non_transferable) === "1", ownerBal: st("balance_mutable_authority"),
    holders: /^\d+$/.test(String(r.holder_count)) ? +r.holder_count : null, top10: hs.length ? hs.slice(0, 10).reduce((a, h) => a + num(h.percent), 0) * 100 : null,
    lpLocked: burn.length ? Math.max(...burn) : null };
}

const LIVE = {
  async pools(chain, path, source) {
    const net = GT_NET[chain]; if (!net) return [];
    const d = await getJSON(`https://api.geckoterminal.com/api/v2/networks/${net}/${path}`);
    return ((d && d.data) || []).map(p => geckoPool(chain, p)).filter(Boolean).map(s => ({ chain, addr: s.addr, source, snap: s }));
  },
  async discoverNew(chains) {
    const cs = chains || CFG.chains; let o = [];
    for (const c of cs) o = o.concat(await this.pools(c, "new_pools?page=1", "new"));
    const pr = await getJSON("https://api.dexscreener.com/token-profiles/latest/v1");
    for (const p of Array.isArray(pr) ? pr : []) if (cs.includes(p.chainId) && p.tokenAddress) o.push({ chain: p.chainId, addr: p.tokenAddress, source: "new" });
    return o;
  },
  async discoverTrending(chains) {
    const cs = chains || CFG.chains; let o = [];
    for (const c of cs) { o = o.concat(await this.pools(c, "trending_pools?page=1", "trending")); o = o.concat(await this.pools(c, "pools?page=1&sort=h24_volume_usd_desc", "trending")) }
    return o;
  },
  async snapshots(chain, addrs) {
    const out = {};
    for (let i = 0; i < addrs.length; i += 30) {
      const d = await getJSON(`https://api.dexscreener.com/tokens/v1/${chain}/${addrs.slice(i, i + 30).join(",")}`);
      for (const p of Array.isArray(d) ? d : []) { const s = dexPair(chain, p); if (!s) continue; const cur = out[s.addr.toLowerCase()]; if (!cur || cur.liq < s.liq) out[s.addr.toLowerCase()] = s }
    }
    return out;
  },
  async breakout(s) {
    const net = GT_NET[s.chain]; if (!net || !s.pair) return null;
    const d = await getJSON(`https://api.geckoterminal.com/api/v2/networks/${net}/pools/${s.pair}/ohlcv/hour?aggregate=1&limit=26&currency=usd`);
    try {
      const rows = d.data.attributes.ohlcv_list, prior = rows.slice(1, 25);                    // newest first: [ts,o,h,l,c,v]
      if (prior.length < 12) return null;
      return s.price > Math.max(...prior.map(r => r[2])) && rows[0][5] > prior.reduce((a, r) => a + r[5], 0) / prior.length;
    } catch (e) { return null }
  },
  async majors() {
    const d = await getJSON("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&price_change_percentage=1h");
    try { const o = {}; for (const x of d) o[x.id] = +x.price_change_percentage_1h_in_currency; if (Object.keys(o).length && Object.values(o).every(isFinite)) return o } catch (e) { /* fall through to the backup source */ }
    // backup: 1h change of ETH, SOL and BTC from the deepest DexScreener pools
    const q = async (chain, addr, name) => { const r = await getJSON(`https://api.dexscreener.com/tokens/v1/${chain}/${addr}`); const ps = (Array.isArray(r) ? r : []).map(p => dexPair(chain, p)).filter(Boolean).sort((a, b) => b.liq - a.liq); return ps[0] && isFinite(ps[0].chg1h) && ps[0].liq > 1e6 ? [name, ps[0].chg1h] : null };
    const rs = await Promise.all([q("base", "0x4200000000000000000000000000000000000006", "ethereum"), q("solana", "So11111111111111111111111111111111111111112", "solana"), q("base", "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", "bitcoin")]);
    const o = {}; for (const x of rs) if (x) o[x[0]] = x[1];
    return Object.keys(o).length >= 2 ? o : null;
  },
  async security(chain, addr) {
    if (chain === "solana") {
      const d = await getJSON(`https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${addr}`);
      const r = d && d.result && d.result[addr]; return r ? parseGoPlusSol(r) : null;
    }
    const cid = GP_CHAIN[chain]; if (!cid) return null;
    const lc = addr.toLowerCase(), d = await getJSON(`https://api.gopluslabs.io/api/v1/token_security/${cid}?contract_addresses=${lc}`);
    const r = d && d.result && d.result[lc]; return r ? parseGoPlusEvm(r) : null;
  },
  blocked() { return false },
  // One-tap check you can run on the phone: reachability (CORS / network) AND that the response shape still parses.
  async selfTest() {
    const out = [], raw = async url => { const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000); try { const r = await fetch(url, { signal: ctl.signal, headers: { accept: "application/json" } }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json() } finally { clearTimeout(to) } };
    const T = async (name, fn) => { const t0 = Date.now(); try { const r = await fn(); out.push({ name, ok: !!r.ok, ms: Date.now() - t0, detail: r.detail }) } catch (e) { out.push({ name, ok: false, ms: Date.now() - t0, detail: /Failed to fetch|Load failed|NetworkError/.test(String(e.message)) ? "blocked or offline (network / CORS)" : String(e.message || e) }) } };
    await T("DexScreener prices", async () => { const d = await raw("https://api.dexscreener.com/tokens/v1/base/0x4200000000000000000000000000000000000006"), s = Array.isArray(d) ? dexPair("base", d[0]) : null; return { ok: !!(s && s.price > 0 && s.liq > 0), detail: s ? `WETH $${s.price.toFixed(0)} · liquidity $${(s.liq / 1e6).toFixed(1)}M` : "unexpected response" } });
    await T("GeckoTerminal new pools", async () => { const d = await raw("https://api.geckoterminal.com/api/v2/networks/base/new_pools?page=1"), ps = ((d && d.data) || []).map(p => geckoPool("base", p)).filter(Boolean); return { ok: ps.length > 0 && ps.every(p => p.price >= 0), detail: `${ps.length} pools parsed` + (ps[0] ? `, unique buyers ${ps[0].buyers1h == null ? "n/a" : "ok"}` : "") } });
    await T("GoPlus token security", async () => { const a = "0xdac17f958d2ee523a2206206994597c13d831ec7", d = await raw(`https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=${a}`), r = d && d.result && d.result[a]; const sd = r ? parseGoPlusEvm(r) : null; return { ok: !!sd && sd.honeypot === false && sd.sellTax != null, detail: sd ? `USDT: honeypot ${sd.honeypot}, sell tax ${sd.sellTax}%, holders ${sd.holders}` : "unexpected response" } });
    await T("CoinGecko market", async () => { const d = await raw("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&price_change_percentage=1h"), x = d && d[0] && +d[0].price_change_percentage_1h_in_currency; return { ok: isFinite(x), detail: isFinite(x) ? `BTC 1h ${x.toFixed(2)}%` : "unexpected response" } });
    return out;
  },
};

/* ============================ realistic synthetic market (NOT real data) ============================
 * Every token owns a constant-product pool (quote reserve q in USD, token reserve b). Organic flow, whales,
 * insiders, dev actions and OUR OWN trades all move that pool, so price impact, liquidity and price are consistent.
 * Hype dynamics, not hand-drawn price paths, create pumps and fades. Most launches fail. Hidden ground truth
 * (rug, honeypot, ...) is only used for the demo's reveal labels and for the security-feed model.
 * Fixed assumptions are listed in MODEL_NOTES and shown in the app.
 */
const KIND_LABEL = { dud: "dud", modest: "short pump", runner: "runner", moon: "moonshot", dead: "dead pool", rug_i: "rug pull", rug_s: "slow rug",
  honey: "honeypot", stealth: "stealth honeypot", est: "established" };
const SCAM_KINDS = new Set(["rug_i", "rug_s", "honey", "stealth"]);
const MODEL_NOTES = [
  "Most new tokens fade: about half are duds, about a fifth are rugs or honeypots, only a few percent run for days.",
  "Prices move through a real constant-product pool, including your own buys and sells.",
  "Fills are late: the price drifts against you while your order lands, and larger buys can be sandwiched.",
  "Scam tokens fake activity (inflated trades, few unique buyers). The security feed misses some scams and flags some good tokens.",
  "Insiders sell into rallies, so early pumps usually give some back.",
  "Established tokens have no built-in edge: returns there are a random walk with occasional hype waves.",
];
const MK_KAPPA = { dud: 0.18, modest: 0.12, runner: 0.09, moon: 0.07, rug_i: 0.12, rug_s: 0.12, honey: 0.12, stealth: 0.10, dead: 0.10 };
const MK_RING = 1500;
const mkIdx = g => ((g % MK_RING) + MK_RING) % MK_RING;
// archetype table: w=share of launches, A=peak turnover per hour (x liquidity), rise/fall in minutes, s=flow bias while rising/falling
const MK_ARCH = {
  dead:   { w: 0.075, A: [0.0, 0.1], rise: [5, 20], fall: [30, 90], sUp: 0.02, sDn: -0.05 },
  dud:    { w: 0.500, A: [0.6, 6.0], rise: [8, 35], fall: [45, 220], sUp: 0.12, sDn: -0.10 },
  modest: { w: 0.140, A: [1.5, 9.0], rise: [30, 150], fall: [150, 700], sUp: 0.15, sDn: -0.05 },
  runner: { w: 0.032, A: [2.5, 11.0], rise: [120, 500], fall: [1200, 3500], sUp: 0.17, sDn: -0.035 },
  moon:   { w: 0.006, A: [3.0, 14.0], rise: [300, 1000], fall: [3000, 9000], sUp: 0.20, sDn: -0.05 },
  rug_i:  { w: 0.115, A: [1.0, 9.0], rise: [10, 60], fall: [90, 300], sUp: 0.14, sDn: -0.08 },
  rug_s:  { w: 0.075, A: [1.0, 9.0], rise: [20, 90], fall: [90, 300], sUp: 0.14, sDn: -0.09 },
  honey:  { w: 0.040, A: [2.0, 6.0], rise: [20, 120], fall: [200, 600], sUp: 0.10, sDn: -0.02 },
  stealth:{ w: 0.017, A: [2.0, 7.0], rise: [20, 120], fall: [100, 400], sUp: 0.14, sDn: -0.08 },
};
const mkU = (a, b) => a + (b - a) * rng();
const mkLogN = (med, sd) => med * Math.exp(sd * gauss());
function mkPoisson(l) { if (l > 25) return Math.max(0, Math.round(l + Math.sqrt(l) * gauss())); const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rng() } while (p > L); return k - 1 }

const MOCK = {
  toks: {}, n: 0, t0: 0, G: 0, lastMin: 0, crashUntil: 0, major: { bitcoin: 0, ethereum: 0, solana: 0 }, majorHist: [], vol: 1,
  cfg: { newPerMin: { solana: 0.16, base: 0.07, ethereum: 0.025, bsc: 0.07 }, lagNew: [60, 240], signal: 0.35, crashPerMin: 1 / 5500, estUp: 0.038, estRev: 0.004, estMR: 0.015, estFall: [200, 700] },

  init() {
    this.toks = {}; this.n = 0; this.t0 = vnow; this.G = 0; this.lastMin = vnow; this.crashUntil = 0; this.majorHist = []; this.vol = 1;
    for (let i = 0; i < 160; i++) this.spawn(true);
    for (let m = 0; m < MK_RING; m++) { this.G = m - MK_RING; for (const t of Object.values(this.toks)) this.step(t) }   // warm-up history for established tokens
    this.G = 0;
  },
  pickKind() { let r = rng(), acc = 0; for (const [k, a] of Object.entries(MK_ARCH)) { acc += a.w; if (r < acc) return k } return "dud" },
  spawn(est, forced) {
    const chains = CFG.chains, chain = forced || chains[Math.floor(rng() * chains.length)], n = ++this.n;
    const addr = chain === "solana" ? "MOCK" + n : "0x" + n.toString(16).padStart(40, "0");
    const kind = est ? "est" : this.pickKind(), ar = MK_ARCH[kind] || { A: [0.5, 2], rise: [100, 400], fall: [1000, 5000], sUp: 0.05, sDn: -0.03 };
    const liq = est ? clamp(mkLogN(500e3, 0.9), 120e3, 6e6) : clamp(mkLogN(8e3, 1.05), 2500, 700e3);
    const q = liq / 2, p0 = Math.pow(10, -7 + rng() * 7), b = q / p0;
    const t = { chain, addr, sym: "T" + n, kind, est, created: est ? vnow - (80 + rng() * 800) * 3600 : vnow, genG: est ? -MK_RING - 1 : this.G, q, b, p0, price: p0,
      A: est ? mkU(0.3, 1.6) : mkU(...ar.A), rise: mkU(...ar.rise), fall: est ? mkU(...this.cfg.estFall) : mkU(...ar.fall), sUp: ar.sUp, sDn: ar.sDn, h: est ? 0.15 : 0.02, peak: 0, waveUntil: 0,
      noise: 0, sigN: est ? 0.04 : 0.09, tax0: rng() < 0.7 ? 0 : mkU(0, 3), sellTax: 0, flow: 0, rugged: false, dead: false, insIdx: 0,
      holders: Math.floor(est ? mkU(3e3, 8e4) : mkU(25, 300)), launchHolders: 0, soph: SCAM_KINDS.has(kind) && rng() < 0.25, wash: 1,
      cumV: new Float64Array(MK_RING), cumB: new Float64Array(MK_RING), cumS: new Float64Array(MK_RING), cumU: new Float64Array(MK_RING), px: new Float64Array(MK_RING), qs: new Float64Array(MK_RING),
      c: { v: 0, b: 0, s: 0, u: 0 }, visibleAt: vnow + (est ? -1e6 : mkU(...this.cfg.lagNew)), tRug: 0, rugFrac: 0, blockAfter: 1e9, taxAfter: 0, taxFrom: 1e9 };
    t.sellTax = t.tax0; t.peak = t.rise * mkU(1.2, 2.2);
    if (SCAM_KINDS.has(kind)) t.wash = t.soph ? mkU(1.2, 2) : mkU(2, 7);          // sophisticated scams spread fake volume over many wallets and look organic
    if (kind === "rug_i") { t.tRug = mkU(20, 700); t.rugFrac = mkU(0.85, 0.995) }
    if (kind === "rug_s") { t.tRug = mkU(30, 400); t.devSell = mkU(0.004, 0.02) }
    if (kind === "honey") { t.blockAfter = 0; t.tRug = mkU(240, 900) }
    if (kind === "stealth") { t.blockAfter = mkU(30, 200); if (rng() < 0.5) { t.taxFrom = t.blockAfter; t.taxAfter = mkU(45, 95); t.blockAfter = 1e9 } }
    if (kind === "runner" || kind === "moon") t.waveEvery = mkU(300, 1500);
    this.toks[addr.toLowerCase()] = t; return t;
  },

  // ----- constant-product pool primitives (fee stays in the pool) -----
  buyQuote(t, usd) { const fee = 0.003, dq = usd * (1 - fee), k = t.q * t.b, b2 = k / (t.q + dq), out = t.b - b2; t.q += usd; t.b = b2; return out },
  sellTokens(t, tok) { const fee = 0.003, k = t.q * t.b, q2 = k / (t.b + tok), out = (t.q - q2) * (1 - fee); t.q = Math.max(q2 + (t.q - q2) * fee, 1); t.b += tok; return out },
  price(t) { return t.q / t.b },

  step(t) {
    if (t.dead) return;
    const G = this.G, age = (G - t.genG), r = mkIdx(G);
    // hype state machine
    if (!t.est && t.rising === undefined) t.rising = true;
    // pumps end without warning: the chance of ending each minute grows with how far price has run (no learnable schedule)
    if (!t.est && t.rising && rng() < (1 / t.peak) * (1 + 0.6 * Math.max(0, Math.log(this.price(t) / t.p0)))) t.rising = false;
    if (!t.est && t.rising) t.h += (1 - t.h) / Math.max(4, t.rise); else if (t.waveUntil > age) t.h += (1 - t.h) / 40; else t.h *= Math.exp(-1 / t.fall);
    if (t.waveEvery && rng() < 1 / t.waveEvery) { t.waveUntil = age + mkU(40, 240); t.h = Math.min(1, t.h + mkU(0.3, 0.8)); t.peak = Math.max(t.peak, age) }
    if (t.est && rng() < 0.30 / 1440) { t.waveDir = rng() < 0.5 ? 1 : -1; t.waveUntil = age + mkU(20, 150); t.revUntil = t.waveUntil + mkU(60, 300); t.h = Math.min(1, t.h + mkU(0.3, 0.9)) }
    const rising = t.est ? t.waveUntil > age : (t.rising || t.waveUntil > age);
    // dev actions
    if (t.kind === "rug_i" && !t.rugged && age >= t.tRug) { t.rugged = true; const f = t.rugFrac; const dumped = t.b * mkU(0.5, 2.5); t.q *= 1 - f; t.b *= 1 - f; this.sellTokens(t, dumped * (1 - f)); t.h = 0.01 }
    if (t.kind === "honey" && !t.rugged && age >= t.tRug) { t.rugged = true; t.q *= 0.04; t.b *= 0.04; t.h = 0.01 }
    if (t.kind === "rug_s" && age >= t.tRug && t.q > 300) { this.sellTokens(t, t.b * t.devSell * mkU(0.5, 1.5)); t.rugged = true }
    if (age >= t.taxFrom) t.sellTax = t.taxAfter;
    // organic flow
    const base = t.est ? 0.5 : 0.12, V = t.q * (base + t.A * t.h) / 60 * (this.crashUntil > vnow ? 1.4 : 1);
    t.noise = 0.85 * t.noise + 0.15 * gauss() * t.sigN * 3;
    let s = (rising ? t.sUp * this.cfg.signal : t.sDn) * (rising ? 1 : (t.est ? 0.4 : 1)) + t.noise;
    if (t.est) { const lnr = Math.log(this.price(t) / this.pxAgo(t, 360)); s = t.noise * 0.6 - this.cfg.estMR * clamp(lnr, -0.6, 0.6) + (t.waveUntil > age ? this.cfg.estUp * t.waveDir : age < (t.revUntil || 0) ? -this.cfg.estRev * t.waveDir : 0) }
    if (this.crashUntil > vnow) s -= 0.07;
    if (!t.est) { const lnm = Math.log(this.price(t) / t.p0); s += lnm > 0 ? -(MK_KAPPA[t.kind] || 0.1) * lnm : -0.03 * lnm }   // profit-taking into strength, bargain hunting after collapses
    if (t.kind === "dead") s = -0.02 + t.noise * 0.3;
    let net = V * s;
    if (rng() < (t.est ? 0.004 : 0.012)) net += (rng() < (0.35 + Math.max(0, s)) ? 1 : -1) * t.q * (t.est ? mkU(0.002, 0.012) : mkU(0.004, 0.03));    // whale
    // insiders / snipers take profit into strength (new tokens only)
    if (!t.est && t.kind !== "dead") { const mult = this.price(t) / t.p0, th = [1.6, 2.6, 4.2, 7]; if (t.insIdx < th.length && mult >= th[t.insIdx]) { net -= t.q * mkU(0.03, 0.1) * (t.kind === "moon" ? 0.4 : 1); t.insIdx++ } }
    const maxNet = t.q * 0.22; net = clamp(net, -maxNet, maxNet);
    const blocked = this.isBlocked(t, age);
    if (blocked) net = this.price(t) / t.p0 > 4 ? 0 : Math.max(net, 0) * 0.4;          // sellers cannot exit: buys only, price creeps up to a plateau
    if (net > 0) this.buyQuote(t, net); else if (net < 0 && t.q > 50) this.sellTokens(t, Math.min(-net / Math.max(this.price(t), 1e-18), t.b * 0.2));
    t.flow = net / t.q;
    // activity counters (wash inflates scam tokens' apparent activity)
    const avgTrade = clamp(t.q * 0.004, 25, 450), vol = V * (net ? 1 : 0.5), nTx = Math.max(0, vol / avgTrade * (0.8 + 0.4 * rng()));
    const pBuy = clamp(0.5 + s * 1.6, 0.08, 0.92), buys = nTx * pBuy * (blocked ? 1.0 : 1), sells = nTx * (1 - pBuy) * (blocked ? 0.06 : 1);
    const wash = t.wash;
    t.c.v += vol * wash; t.c.b += buys * wash; t.c.s += sells * (wash > 1 ? 1 : 1); t.c.u += buys * (wash > 1 && !t.soph ? 0.25 : 0.75);
    t.cumV[r] = t.c.v; t.cumB[r] = t.c.b; t.cumS[r] = t.c.s; t.cumU[r] = t.c.u; t.px[r] = this.price(t); t.qs[r] = t.q;
    if (t.q < 120 || (!t.est && t.h < 0.003 && age > 2880 && t.q < 4000)) t.dead = true;
  },
  isBlocked(t, age) { if (t.kind === "honey") return true; if (t.kind === "stealth") return age >= t.blockAfter; return false },
  blocked(chain, addr) { const t = this.toks[addr.toLowerCase()]; return !!(t && this.isBlocked(t, this.G - t.genG)) },

  advance() {
    const mins = Math.min(Math.floor((vnow - this.lastMin) / 60), 40);
    for (let i = 0; i < mins; i++) {
      this.G++; this.lastMin += 60;
      this.vol = clamp(0.97 * this.vol + 0.03 * (0.6 + 0.8 * rng()) + (rng() < 0.002 ? 0.8 : 0), 0.5, 3);
      if (rng() < this.cfg.crashPerMin && this.crashUntil < vnow) this.crashUntil = vnow + mkU(2, 5) * 3600;     // market-wide sell-off about every 4 days
      const bm = (this.crashUntil > vnow ? -0.0006 : 0) + gauss() * 0.00045 * this.vol;
      this.majorHist.push(bm); if (this.majorHist.length > 61) this.majorHist.shift();
      for (const [ch, rate] of Object.entries(this.cfg.newPerMin)) if (CFG.chains.includes(ch) && rng() < rate) this.spawn(false, ch);
      for (const t of Object.values(this.toks)) this.step(t);
    }
    if (mins) for (const k of Object.keys(this.toks)) { const t = this.toks[k]; if (t.dead && (this.G - t.genG) > 600 && !(S && S.pf && S.pf.positions[t.chain + ":" + t.addr.toLowerCase()])) delete this.toks[k] }
  },

  // ----- views the bot gets (with realistic feed behaviour) -----
  win(t, arr, mins) { const r = mkIdx(this.G), from = Math.max(this.G - mins, t.genG), rp = mkIdx(from); return Math.max(0, arr[r] - (from <= t.genG ? 0 : arr[rp])) },
  pxAgo(t, mins) { const g = this.G - mins; if (g <= t.genG) return t.p0; const v = t.px[mkIdx(g)]; return v > 0 ? v : t.p0 },
  snap(t) {
    const p = this.price(t), chg = m => (p / this.pxAgo(t, m) - 1) * 100, ageMin = this.G - t.genG;
    return { chain: t.chain, addr: t.addr, sym: t.sym, price: p, liq: t.q * 2, fdv: p * t.b * (t.est ? 40 : 6) * 1, vol5: this.win(t, t.cumV, 5), vol1h: this.win(t, t.cumV, 60), vol6: this.win(t, t.cumV, 360), vol24: this.win(t, t.cumV, 1440),
      chg5m: chg(5), chg1h: chg(60), chg6h: chg(360), chg24: chg(1440), buys1h: Math.round(this.win(t, t.cumB, 60)), sells1h: Math.round(this.win(t, t.cumS, 60)), buyers1h: Math.round(this.win(t, t.cumU, 60)),
      sellers1h: Math.round(this.win(t, t.cumS, 60) * 0.7), pair: "pair-" + t.addr, created: t.created, ageMin }
  },
  async discoverNew(chains) { this.advance(); const now0 = vnow; return Object.values(this.toks).filter(t => !t.est && !t.dead && now0 - t.created < 86400 && t.visibleAt <= now0 && chains.includes(t.chain)).sort((a, b) => b.created - a.created).slice(0, 60).map(t => ({ chain: t.chain, addr: t.addr, source: "new", snap: this.snap(t) })) },
  async discoverTrending(chains) { this.advance(); return Object.values(this.toks).filter(t => !t.dead && t.visibleAt <= vnow && chains.includes(t.chain)).map(t => this.snap(t)).filter(s => s.vol1h > 0).sort((a, b) => b.vol1h * (b.chg1h > 0 ? 1 : 0.3) - a.vol1h * (a.chg1h > 0 ? 1 : 0.3)).slice(0, 40).map(s => ({ chain: s.chain, addr: s.addr, source: "trending", snap: s })) },
  async snapshots(chain, addrs) { this.advance(); const o = {}; for (const a of addrs) { const t = this.toks[a.toLowerCase()]; if (t) o[a.toLowerCase()] = this.snap(t) } return o },
  async breakout(s) { const t = this.toks[s.addr.toLowerCase()]; if (!t || this.G - t.genG < 300) return null; let hi = 0; for (let m = 60; m < 1440 && m < this.G - t.genG; m += 10) hi = Math.max(hi, this.pxAgo(t, m)); return this.price(t) > hi },
  async majors() { this.advance(); let acc = 1; for (const r of this.majorHist) acc *= 1 + r; const c = (acc - 1) * 100; return { bitcoin: c, ethereum: c * 1.15 + gauss() * 0.1, solana: c * 1.4 + gauss() * 0.15 } },
  async security(chain, addr) {
    const t = this.toks[addr.toLowerCase()]; if (!t) return null; const age = this.G - t.genG, k = t.kind;
    if (rng() < 0.03 || (age < 4 && rng() < 0.65)) return null;                         // feed outage or token not indexed yet: bot fails closed
    if (t.secStatic) { const o = Object.assign({}, t.secStatic); o.sellTax = t.sellTax > 20 && age >= t.taxFrom + 60 ? t.sellTax : (t.secStatic.honeypot ? 99 : t.tax0); o.holders = Math.floor(t.secStatic.holders0 * (1 + age / 300)); if (t.rugged) { o.creator = Math.max(o.creator, 40); o.top10 = Math.max(o.top10, 80) } return o }
    const sol = chain === "solana", c = rng, chance = p => c() < p, pick = a => a[Math.floor(c() * a.length)];
    const scam = SCAM_KINDS.has(k), est = t.est, fp = !scam && !est;
    let honeypot = false, sellTax = t.sellTax > 20 && age >= t.taxFrom + 60 ? t.sellTax : t.tax0, flagged = false;
    if (k === "honey" && chance(t.soph ? 0.55 : 0.9)) { honeypot = true; sellTax = 99 }
    const mintable = (k === "rug_s" && chance(0.7)) || (k === "rug_i" && chance(0.3)) || (fp && chance(0.04)) || (k === "dead" && chance(0.4));
    const lpLocked = est ? null : k === "rug_i" ? (chance(0.5) ? mkU(85, 100) : mkU(0, 20)) : k === "rug_s" ? (chance(0.55) ? mkU(80, 100) : mkU(0, 30)) : k === "honey" ? mkU(0, 100) : (chance(0.78) ? mkU(80, 100) : mkU(0, 40));
    const creator = (k === "rug_i" || k === "rug_s") ? (chance(0.55) ? mkU(9, 35) : mkU(0.5, 6)) : (fp && chance(0.07)) ? mkU(8.5, 20) : mkU(0, 5);
    const top10 = est ? mkU(10, 42) : (scam && chance(0.5)) ? mkU(42, 80) : (fp && chance(0.13)) ? mkU(46, 70) : mkU(14, 40);
    const holders = Math.floor(est ? mkU(3000, 90000) : Math.max(15, t.holders * (1 + age / 300) * mkU(0.6, 1.4)));
    const rep = { sol, honeypot, buyTax: t.tax0 * 0.5, sellTax, openSource: scam && chance(0.25) ? false : true, proxy: chance(0.08), mintable, hiddenOwner: k === "rug_s" && chance(0.25), takeBack: false, ownerBal: k === "rug_s" && chance(0.2),
      pausable: k === "honey" && chance(0.3), cannotSellAll: false, cooldown: chance(0.04), blacklist: scam && chance(0.15), slipMod: k === "stealth" && chance(0.15), selfdestruct: false, extCall: chance(0.08), freezable: false, closable: false, nonTransferable: false,
      creatorHP: scam && chance(0.12), inDex: true, holders, holders0: holders / (1 + age / 300), top10, creator, owner: mkU(0, 3), lpLocked };
    t.secStatic = rep; return Object.assign({}, rep);
  },
};

/* filled from test/sweep.mjs (seeds 101-124, 7 simulated days, default settings); shown in the app so expectations stay honest */
const BACKTEST = { seeds: 24, days: 7, med: "-0.13", worst: "-0.52", best: "0.21", trades: 23, losing: 17, none: "-0.20", mid: "+0.45", high: "+0.94" };

const P=()=>MODE==="mock"?MOCK:LIVE;
/* ============================ engine ============================ */
const due=(n,every,t)=>{if(t-(last[n]||0)>=every){last[n]=t;return true}return false};
function roll(t){const d=new Date(t*1000).toISOString().slice(0,10);if(d!==S.pf.day){S.pf.day=d;S.pf.dayStart=equity()}}
async function updateRegime(t){const m=await P().majors(),r=regimeOf(m);
  if(r!=="unknown"){regimeOk=t;if(r!==regime)ev(r==="ok"?"info":"warn","regime","",`market ${regime} → ${r}`);regime=r}
  if(regime==="crash")for(const p of Object.values(S.pf.positions))p.emergency=p.emergency||"market crash"}
function safety(t){const pf=S.pf;let why="";if(LS.get("pt_kill_"+MODE)==="1")why="manual emergency stop";if(!why)why=shutdownReason();
  if(why&&!pf.shutdown){pf.shutdown=true;pf.why=why;ev("crit","shutdown","","EMERGENCY SHUTDOWN: "+why+" · flattening all positions")}
  if(pf.shutdown)for(const p of Object.values(pf.positions))p.emergency=p.emergency||"shutdown: "+pf.why}
async function scan(source,t){const prov=P(),cands=source==="new"?await prov.discoverNew(CFG.chains):await prov.discoverTrending(CFG.chains),seen=new Set(),todo=[];
  for(const c of cands){const k=c.chain+":"+c.addr.toLowerCase();if(seen.has(k)||S.pf.positions[k]||(rejected[k]||0)>t)continue;seen.add(k);todo.push(c)}
  if(source==="new")todo.sort((a,b)=>((b.snap&&b.snap.created)||0)-((a.snap&&a.snap.created)||0));todo.length=Math.min(todo.length,CFG.maxCands);
  const byChain={};for(const c of todo)(byChain[c.chain]=byChain[c.chain]||[]).push(c.addr);const fresh={};
  for(const ch in byChain){const r=await prov.snapshots(ch,byChain[ch]);for(const a in r)fresh[ch+":"+a]=r[a]}
  for(const c of todo){if(S.pf.shutdown)break;const k=c.chain+":"+c.addr.toLowerCase(),snap=fresh[k]||c.snap;if(fresh[k]&&c.snap&&c.snap.buyers1h!=null){fresh[k].buyers1h=c.snap.buyers1h;fresh[k].sellers1h=c.snap.sellers1h}stats.scanned++;if(!snap||snap.price<=0)continue;await evaluate(k,snap,source,now())}}
const SCAM=SCAM_KINDS;
function truthOf(snap){if(MODE!=="mock")return null;const t=MOCK.toks[snap.addr.toLowerCase()];return t?t.kind:null}
function feedAdd(snap,src,outcome,detail,extra){const k=snap.chain+":"+snap.addr.toLowerCase(),tr=truthOf(snap);
  if(tr&&!stats.seen[k]){stats.seen[k]=1;if(SCAM.has(tr))stats.scamSeen++;else if(tr==="dead")stats.junkSeen++}
  S.feed.unshift(Object.assign({t:now(),sym:snap.sym,chain:snap.chain,src,outcome,detail,truth:tr},extra||{}));if(S.feed.length>80)S.feed.length=80}
function reject(k,snap,src,why,min,stage,extra){rejected[k]=now()+60*(min||(src==="new"?CFG.rejectNewMin:CFG.rejectTrendMin));feedAdd(snap,src,stage||"strategy",why,extra)}
async function evaluate(k,snap,src,t){let plan,rej;
  [plan,rej]=src==="new"?analyzeNew(snap,t):analyzeTrend(snap,t,true);
  if(!plan)return reject(k,snap,src,rej.join("; "),rej.some(r=>r==="too young")?3:null);
  if(src==="trending"){const bo=await P().breakout(snap);[plan,rej]=analyzeTrend(snap,t,bo);if(!plan)return reject(k,snap,src,rej.join("; "))}
  stats.strat++;
  const sec=await P().security(snap.chain,snap.addr);
  if(!sec)return reject(k,snap,src,"security report not available yet (retrying soon, fail closed)",2,"security",{checks:[["security_data_available",false]],score:plan.score});
  const v=evalSecurity(sec,snap,src,t);
  if(!v.pass)return reject(k,snap,src,"failed: "+v.fails.join(", "),CFG.rejectMin*4,"security",{checks:v.checks,score:plan.score,risk:v.risk});
  stats.sec++;
  const d=approve(snap,src,v.risk,plan,t);
  if(!d.ok){stats.vetoed++;feedAdd(snap,src,"vetoed",d.why,{checks:v.checks,score:plan.score,risk:v.risk});if(d.why!=="re-entry cooldown")rejected[k]=t+300;return}
  open(snap,src,plan,v.risk,sec,d.usd,t,v.checks)}
function open(snap,cat,plan,risk,sec,usd,t,checks){const pf=S.pf,k=snap.chain+":"+snap.addr.toLowerCase(),f=simBuy(snap,usd,sec.buyTax||0,cat==="new");
  const tr={t,side:"buy",sym:snap.sym,chain:snap.chain,cat,ok:f.ok,note:f.why,usd:f.usd||0,px:f.px||0,slip:f.slip,fee:f.fee,gas:f.gas};
  if(!f.ok){pf.cash-=f.gas;pf.realized-=f.gas;pf.feesPaid+=f.gas;pf.cool[k]=t+900;pf.exec.failed++;S.trades.unshift(tr);feedAdd(snap,cat,"failed","tx failed: "+f.why,{checks,score:plan.score,risk});ev("warn","buy_failed",snap.sym,f.why);return save()}
  pf.cash-=f.usd+f.gas;pf.feesPaid+=f.fee+f.gas;pf.entries.push(t);pf.exec.buys++;pf.exec.slipSum+=f.slip;pf.exec.slipN++;if(f.mev)pf.exec.mev++;pf.entries=pf.entries.filter(x=>t-x<86400);
  pf.positions[k]={id:snap.sym+"-"+Math.floor(t),chain:snap.chain,addr:snap.addr,sym:snap.sym,cat,opened:t,entry:snap.price,qty:f.qty,qty0:f.qty,cost:f.usd+f.gas,
    stop:snap.price*(1-plan.stop/100),tp1:snap.price*(1+plan.tp1/100),tp2:snap.price*(1+plan.tp2/100),trail:plan.trail,peak:snap.price,last:snap.price,entryLiq:snap.liq,lastLiq:snap.liq,
    size0:f.usd,truth:truthOf(snap),why:plan.reason,score:plan.score,risk:risk,chk:t,sellTax:sec.sellTax||0,tp1Done:false,tp2Done:false,real:0,fees:f.fee+f.gas,stale:0,attempts:0,emergency:"",risk0:f.usd*plan.stop/100,pair:snap.pair};
  stats.bought++;if(SCAM.has(truthOf(snap)))stats.scamBought++;feedAdd(snap,cat,"bought",`${fmt(f.usd,0)} · score ${plan.score.toFixed(0)} · risk ${risk.toFixed(0)}`,{checks,score:plan.score,risk});S.trades.unshift(tr);ev("info","buy",snap.sym,`[${cat}] ${fmt(f.usd,0)} @ ${f.px.toPrecision(4)} slip ${f.slip.toFixed(2)}% score ${plan.score.toFixed(0)} risk ${risk.toFixed(0)} · ${f.why}`);save()}
function sellPos(p,snap,frac,reason,urgent,t){const pf=S.pf,qty=frac>=0.999?p.qty:Math.min(p.qty,p.qty0*frac);
  const f=simSell(snap,qty,p.sellTax,urgent||p.attempts>=2,p.attempts,P().blocked(p.chain,p.addr));
  const tr={t,side:"sell",sym:p.sym,chain:p.chain,cat:p.cat,ok:f.ok,note:reason+" · "+f.why,usd:f.usd||0,px:f.px||0,slip:f.slip,fee:f.fee,gas:f.gas,pnl:null};
  if(!f.ok){p.attempts++;pf.exec.failed++;pf.feesPaid+=f.gas;pf.cash-=f.gas;pf.realized-=f.gas;p.real-=f.gas;dayAdd(-f.gas,t);S.trades.unshift(tr);ev("warn","sell_failed",p.sym,`${reason}: ${f.why} (#${p.attempts})`);
    if(p.attempts>=3&&!p.emergency){p.emergency="sell failing repeatedly (possible hidden restriction)";ev("crit","emergency",p.sym,p.emergency)}return false}
  const part=p.qty>0?f.qty/p.qty:1,costPart=p.cost*part,net=f.usd-f.gas,pnl=net-costPart;pf.cash+=net;pf.exec.sells++;pf.exec.slipSum+=f.slip;pf.exec.slipN++;if(f.mev)pf.exec.mev++;pf.feesPaid+=f.fee+f.gas;pf.realized+=pnl;p.real+=pnl;p.cost-=costPart;p.qty-=f.qty;p.fees+=f.fee+f.gas;p.attempts=0;
  tr.pnl=pnl;tr.px=f.px;dayAdd(pnl,t);S.trades.unshift(tr);ev("info","sell",p.sym,`${reason}: net ${fmt(net)} pnl ${pnl>=0?"+":""}${pnl.toFixed(2)} slip ${f.slip.toFixed(2)}% · ${f.why}`);
  if(p.qty<=1e-12||p.qty*snap.price<1)closePos(p,reason,0,t);return true}
function closePos(p,reason,recovered,t){const pf=S.pf,k=p.chain+":"+p.addr.toLowerCase();if(recovered)pf.cash+=recovered;
  if(p.cost>1e-6){const l=recovered-p.cost;pf.realized+=l;p.real+=l;dayAdd(l,t)}delete pf.positions[k];pf.cool[k]=t+CFG.risk.cooldownH*3600;
  pf.streak=p.real>0?0:pf.streak+1;if(pf.streak>=CFG.risk.streakPause){pf.pauseUntil=t+CFG.risk.pauseMin*60;ev("warn","pause",p.sym,pf.streak+" losses in a row: entries paused")}
  const r=p.risk0?p.real/p.risk0:0;pf.closed.push({sym:p.sym,chain:p.chain,cat:p.cat,pnl:p.real,r,reason,held:(t-p.opened)/3600,t,size:p.size0,truth:p.truth});if(pf.closed.length>500)pf.closed.shift();
  ev("info","closed",p.sym,`${reason}: total ${p.real>=0?"+":""}${p.real.toFixed(2)} (${r.toFixed(2)}R)`);save()}
function emergencyReason(p,s,pp,pl){const e=CFG.em;
  if(s.liq<p.entryLiq*(1-e.liqTotal))return`liquidity down ${(100*(1-s.liq/p.entryLiq)).toFixed(0)}% vs entry`;
  if(pl>0&&s.liq<pl*(1-e.liqStep))return"liquidity pulled";if(pp>0&&s.price<pp*(1-e.priceStep))return`flash crash ${(100*(1-s.price/pp)).toFixed(0)}% in one interval`;
  if(s.buys1h>=20&&s.sells1h===0)return"buys-only flow (honeypot signature)";if(s.sells1h>=40&&s.buys1h*4<s.sells1h&&s.chg5m<-10)return"heavy one-sided selling";return""}
function adjustStop(p,s){const old=p.stop,be=p.entry*1.01;
  if(p.tp1Done)p.stop=Math.max(p.stop,be,p.peak*(1-p.trail/100));else if(s.price>=p.entry*(1+(p.tp1/p.entry-1)/2))p.stop=Math.max(p.stop,be);
  if(regime==="danger"&&s.price>p.entry)p.stop=Math.max(p.stop,s.price*0.96);if(p.stop>old*1.0001)ev("info","stop_raised",p.sym,`${old.toPrecision(4)} → ${p.stop.toPrecision(4)}`)}
async function monitor(t){const pf=S.pf,ps=Object.values(pf.positions);if(!ps.length)return;const byChain={},snaps={};for(const p of ps)(byChain[p.chain]=byChain[p.chain]||[]).push(p.addr);
  for(const ch in byChain){const r=await P().snapshots(ch,byChain[ch]);for(const a in r)snaps[ch+":"+a]=r[a]}
  const feedUp=Object.keys(snaps).length>0;     // if no token at all came back, the price feed is down: that is not evidence the token died
  for(const p of ps){const s=snaps[p.chain+":"+p.addr.toLowerCase()];
    if(!s||s.price<=0){if(!feedUp)continue;p.staleSince=p.staleSince||t;if(t-p.staleSince>=CFG.em.staleMin*60){ev("crit","stale_writeoff",p.sym,"no price for "+CFG.em.staleMin+" minutes while other tokens update: closing at a haircut");const rec=pv(p)*CFG.em.staleHaircut;p.qty=0;closePos(p,"stale_data",rec,t)}continue}
    p.staleSince=0;p.seenAt=t;const pp=p.last,pl=p.lastLiq;p.last=s.price;p.lastLiq=s.liq;p.peak=Math.max(p.peak,s.price);
    if(!p.emergency){p.emergency=emergencyReason(p,s,pp,pl);if(p.emergency)ev("crit","emergency",p.sym,p.emergency)}
    if(p.emergency){if(p.attempts>=CFG.em.maxAttempts){ev("crit","writeoff",p.sym,"cannot sell after "+p.attempts+" attempts: written off");p.qty=0;closePos(p,"writeoff_unsellable",0,t)}
      else sellPos(p,s,1,"EMERGENCY: "+p.emergency,true,t);continue}
    adjustStop(p,s);const px=s.price,held=(t-p.opened)/3600,maxHold=p.cat==="new"?CFG.nw.maxHoldH:CFG.tr.maxHoldH;
    if(px<=p.stop)sellPos(p,s,1,p.stop>p.entry?"trailing_stop":"stop_loss",false,t);
    else if(!p.tp1Done&&px>=p.tp1){if(sellPos(p,s,CFG.tp1Frac,"take_profit_1",false,t)&&pf.positions[p.chain+":"+p.addr.toLowerCase()])p.tp1Done=true}
    else if(p.tp1Done&&!p.tp2Done&&px>=p.tp2){if(sellPos(p,s,CFG.tp2Frac,"take_profit_2",false,t)&&pf.positions[p.chain+":"+p.addr.toLowerCase()])p.tp2Done=true}
    else if(held>=maxHold&&!p.tp1Done)sellPos(p,s,1,"time_stop",false,t)}
  save()}
async function recheck(t){const ps=Object.values(S.pf.positions).filter(p=>!p.emergency).sort((a,b)=>(a.chk||0)-(b.chk||0)).slice(0,4);
  for(const p of ps){p.chk=t;const sec=await P().security(p.chain,p.addr);if(!sec||!S.pf.positions[p.chain+":"+p.addr.toLowerCase()])continue;
    const snap={chain:p.chain,addr:p.addr,liq:p.lastLiq,price:p.last,buys1h:0,sells1h:0,vol24:0,chg1h:0,chg5m:0,created:t-86400*30},v=evalSecurity(sec,snap,"trending",t);
    const soft=["holders","liquidity","no_wash","top10","lp_locked"],bad=v.fails.filter(f=>!soft.includes(f));
    if(bad.length){p.emergency="security recheck failed: "+bad.join(",");ev("crit","emergency",p.sym,p.emergency)}p.sellTax=sec.sellTax??p.sellTax}}

/* three independent loops so prices never wait on scanning */
let busy=false,busyF=false,busyL=false,busyS=false,scanning=false;
const guard=async(fn)=>{try{await fn()}catch(e){ev("warn","error","",String(e&&e.message||e))}};
async function stepFast(t){if(busyF)return;busyF=true;await guard(async()=>{roll(t);safety(t);if(due("monitor",CFG.monitorEvery,t)){await monitor(t);if(MODE==="live")LS.set("pt_last_live",Math.floor(t))}
  if(due("equity",CFG.equityEvery,t)){S.curve.push([t,equity()]);if(S.curve.length>4000)S.curve.shift();save()}});busyF=false}
async function stepSlow(t){if(busyL)return;busyL=true;await guard(async()=>{if(due("regime",CFG.regimeEvery,t))await updateRegime(t);
  if(Object.keys(S.pf.positions).length&&due("recheck",30,t))await recheck(t)});busyL=false}
async function stepScan(t){if(busyS||paused||S.pf.shutdown)return;busyS=true;scanning=true;await guard(async()=>{if(due("new",CFG.newEvery,t))await scan("new",now());if(due("trend",CFG.trendEvery,t))await scan("trending",now())});busyS=false;scanning=false}
async function tick(){if(busy)return;busy=true;try{const t=now();await stepFast(t);await stepSlow(t);await stepScan(t)}finally{busy=false}}


