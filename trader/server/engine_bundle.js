/* ============================ config (mirrors paper_trader/config.py) ============================ */
const CFG = {
  chains:["solana","base","ethereum","bsc"],
  tick:5, monitorEvery:4, newEvery:30, trendEvery:120, recheckEvery:300, regimeEvery:120, equityEvery:300,
  deepPerScan:40, quickRejectSec:20, quickYoungSec:10, maxCands:16, rejectMin:45, rejectNewMin:8, rejectTrendMin:20,
  risk:{perTradePct:0.5, posTrend:2, posNew:1, totalExp:40, newExp:20, chainExp:20, cashReserve:20, maxPos:100,
        liqFrac:0.006, minTrade:15, dailyLoss:3, maxDD:12, maxTotalLoss:20, streakPause:3, pauseMin:60,
        perHour:30, perDay:150, cooldownH:12, maxRisk:65, riskFull:35, minRR:1.5, maxCostPct:5, dailyLock:0, worstCase:false},
  sec:{buyTax:5, sellTax:8, liqNew:15000, liqTrend:100000, holdersNew:100, holdersTrend:500, top10:45, creator:8, owner:8, lpLocked:70, volLiq:40},
  nw:{enabled:true, minAgeMin:10, maxAgeH:24, minTx:50, minBP:0.55, maxChg1h:300, maxFdvLiq:60, minScore:60, minVlr:0, minUniq:0.5, minChg1h:-1000, stop:18, tp1:40, tp2:100, trail:15, maxHoldH:12},
  nwFill:{minAgeMin:3,minTx:15,minBP:0.5,minScore:25,minVlr:0,minUniq:0.3,minChg1h:-30,maxChg1h:400,maxFdvLiq:200,maxAgeH:48},
  trFill:{minScore:20,minAccel:1.0,minBP:0.5,minVol:50000},
  lenient:{sec:true,regime:true},
  quick:{on:false,stop:6,tp1:8,tp2:16,trail:4}, agentProbation:0.6, committeeMin:2, agentHourly:8, watchdog:true, autoRearmMin:20,
  secMode:"balanced",
  keep:{on:true,target:10,sizeMult:0.5,reentrySec:0},
  tr:{enabled:false, minAgeH:72, minVol:150000, minAccel:1.5, minBP:0.52, maxChg24:150, minScore:62, stop:10, tp1:20, tp2:45, trail:8, maxHoldH:48},
  scalp:false, tp1Frac:0.5, tp2Frac:0.25,
  em:{liqTotal:0.5, liqStep:0.3, priceStep:0.3, staleMin:20, staleHaircut:0.5, maxAttempts:12, danger:-3, crash:-8, regimeUnknownMin:15},
  ex:{fee:0.30, gas:{ethereum:5,base:0.04,bsc:0.12,solana:0.01,arbitrum:0.08}, fail:0.04, newFail:0.05, partial:0.10, buyTolNew:4, buyTolTrend:1.5, maxSellSlip:8, maxEmSlip:30}
};
const LS={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const DEMO_ONLY=false;
const freshStats=()=>({uniq:0,scanned:0,strat:0,sec:0,vetoed:0,bought:0,scamSeen:0,scamBought:0,junkSeen:0,seen:{}});
const $ = id => document.getElementById(id);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fmt=(n,d=2)=>(n<0?"-":"")+"$"+Math.abs(n).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=(n)=>(n>=0?"+":"")+n.toFixed(2)+"%";
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let SEED=7,rng=mulberry(7);
const gauss=()=>{let u=0,v=0;while(!u)u=rng();v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};

/* ============================ state ============================ */
let MODE=DEMO_ONLY?"mock":(LS.get("pt_mode")||"live"),SPEED=+LS.get("pt_speed")||300;
let paused=false, vnow=1.76e9, last={}, regime="unknown", regimeOk=0, rejected={}, stats=freshStats();
let S; // {pf, journal[], trades[]}
const key=()=>"pt_state_"+MODE;
function newState(cap){return{feed:[],pf:{ag:{},exec:{buys:0,sells:0,failed:0,mev:0,slipSum:0,slipN:0},feesPaid:0,start:cap,cash:cap,positions:{},realized:0,peak:cap,day:"",dayStart:cap,streak:0,pauseUntil:0,entries:[],cool:{},shutdown:false,why:"",closed:[]},journal:[],trades:[],curve:[]}}
function load(){S=null;if(MODE!=="mock"){try{S=JSON.parse(LS.get(key()))}catch(e){S=null}}if(!S)S=newState(+LS.get("pt_cap")||10000);if(!S.feed)S.feed=[];if(S.pf.feesPaid==null)S.pf.feesPaid=0;if(!S.pf.ag)S.pf.ag={};if(typeof seedPretrained==="function")seedPretrained();if(!S.pf.exec)S.pf.exec={buys:0,sells:0,failed:0,mev:0,slipSum:0,slipN:0}}
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


/* activity levels: how much the bot is willing to trade. Measured in the demo market (12 markets x 5 days): trades per market-day and return per day */
const ACTIVITY = {
  selective: { name: "Selective", note: "about 3 trades a day, about -0.1% a day in testing", set() { CFG.risk.maxRisk = 45; CFG.risk.streakPause = 3 } },
  active: { name: "Active", note: "about 12 trades a day, about -0.3% a day in testing", set() { CFG.risk.maxRisk = 65; CFG.risk.streakPause = 4 } },
  max: { name: "Very active", note: "about 20 trades a day, about -0.6% a day in testing", set() { CFG.risk.maxRisk = 80; CFG.risk.streakPause = 5; Object.assign(CFG.nw, { minScore: 50, minBP: 0.52, minTx: 30, minAgeMin: 5, minUniq: 0.4 }); CFG.rejectNewMin = 4 } },
};
let ACT = "active";
function applyActivity(k) { if (!ACTIVITY[k]) k = "active"; ACT = k; Object.assign(CFG.nw, { minScore: 60, minBP: 0.55, minTx: 50, minAgeMin: 10, minUniq: 0.5 }); CFG.rejectNewMin = 8; ACTIVITY[k].set(); applyScan() }
function applyScan() { const turbo = (typeof LS !== "undefined" ? LS.get("pt_turbo") : null) !== "0"; CFG.newEvery = turbo ? 1 : 30; CFG.trendEvery = turbo ? 2 : 120; CFG.turbo = turbo }

let FILL=false;   // true while the portfolio is below its keep-open target

function applyExit(k) { const sc = k === "scalp"; CFG.scalp = sc; if (sc) { CFG.risk.minRR = 0.2; Object.assign(CFG.nw, { stop: 20, tp1: 10, tp2: 30, trail: 6 }); Object.assign(CFG.tr, { stop: 12, tp1: 6, tp2: 15, trail: 4 }); CFG.tp1Frac = 0.8 } else { CFG.risk.minRR = 1.5; Object.assign(CFG.nw, { stop: 18, tp1: 40, tp2: 100, trail: 15 }); Object.assign(CFG.tr, { stop: 10, tp1: 20, tp2: 45, trail: 8 }); CFG.tp1Frac = 0.5 } }

// stand-in report used only when the security source is unreachable and lenient mode is on (paper trading)
const UNVERIFIED = { unverified: true, honeypot: false, buyTax: 3, sellTax: 3, openSource: true, proxy: false, mintable: false, hiddenOwner: false, takeBack: false, ownerBal: false, pausable: false, cannotSellAll: false, cooldown: false, blacklist: false, slipMod: false, selfdestruct: false, extCall: false, creatorHP: false, inDex: true, holders: null, top10: null, creator: null, owner: null, lpLocked: null };
let uniMedian = null;
function applySecMode(m){CFG.secMode=["strict","balanced","loose"].includes(m)?m:"balanced";const L={strict:[15000,100000],balanced:[8000,50000],loose:[5000,25000]}[CFG.secMode];CFG.sec.liqNew=L[0];CFG.sec.liqTrend=L[1]}
const BUILD = "2026-11-24 00:24";

/* one-tap presets. "protect" is what the testing supports: small, selective, agents on probation until they prove a positive record */
function applyPreset(k) {
  CFG.wdSafe = false;
  if (k === "recommended") { applyPreset("safe"); return }
  if (k === "easy") { applyPreset("safe"); CFG.risk.perTradePct = 0.08; CFG.risk.posNew = 0.25; CFG.risk.posTrend = 0.4; CFG.risk.totalExp = 15; CFG.agentHourly = 3; CFG.risk.dailyLoss = 1; CFG.risk.maxDD = 4; return }
  if (k === "risky") { applyPreset("safe"); CFG.risk.perTradePct = 0.3; CFG.risk.posNew = 0.8; CFG.risk.posTrend = 1.2; CFG.risk.totalExp = 45; CFG.risk.dailyLoss = 2.5; CFG.risk.dailyLock = 0; CFG.risk.maxDD = 8; return }
  if (k === "most") { applyPreset("safe"); CFG.risk.perTradePct = 0.45; CFG.risk.posNew = 1.2; CFG.risk.posTrend = 1.8; CFG.risk.totalExp = 50; CFG.risk.dailyLoss = 3; CFG.risk.dailyLock = 0; CFG.risk.maxDD = 10; return }   // the best-tested size: 5x was worse (pool impact)
  if (k === "lots") { applyPreset("most"); applyActivity("active"); return }   // ~2.5x the trades of Most money in testing, similar average profit, more losers
  if (k === "safe") { applyPreset("protect"); CFG.learn.probation = false; CFG.swarmOff = true; CFG.core.on = true; CFG.wdSafe = true; applySecMode("balanced"); return }   // no real money for any agent until it has proven itself
  if (k === "protect") { applyActivity("selective"); applyQuick(true); CFG.learn.on = true; CFG.learn.probation = true; CFG.committeeMin = 2; CFG.agentHourly = 8; CFG.keep.on = false; CFG.agentProbation = 0.6; CFG.agentsOff = { rider: 1, dip: 1, whale: 1, gem: 1, trend: 1 }; CFG.risk.dailyLoss = 1.5; CFG.risk.dailyLock = 1.5; CFG.risk.maxDD = 6; CFG.risk.totalExp = 35; CFG.risk.maxPos = 100; CFG.risk.perHour = 60; CFG.risk.perDay = 400 }
  else if (k === "turbo") { applyActivity("active"); applyQuick(true); CFG.keep.on = false; CFG.learn.on = false; CFG.committeeMin = 1; CFG.agentHourly = 30; CFG.agentsOff = { rider: 1, dip: 1, whale: 1, gem: 1, trend: 1 }; CFG.risk.dailyLoss = 2; CFG.risk.dailyLock = 0; CFG.risk.maxDD = 8; CFG.risk.totalExp = 40; CFG.risk.maxPos = 100; CFG.risk.perHour = 200; CFG.risk.perDay = 2000; CFG.risk.maxCostPct = 6 }
  else { applyActivity("active"); applyQuick(false); CFG.learn.on = true; CFG.committeeMin = 2; CFG.agentHourly = 8; CFG.keep.on = true; CFG.agentProbation = 0.6; CFG.agentsOff = {}; CFG.risk.dailyLoss = 3; CFG.risk.dailyLock = 0; CFG.risk.maxDD = 12; CFG.risk.totalExp = 40; CFG.risk.maxPos = 100 }
  CFG.risk.perDay = CFG.risk.perHour * 5
}

/* "small trades, sell when it drops": tiny positions, take profit early, cut any loser fast */
function applyQuick(on) { CFG.quick.on = on; if (on) { CFG.risk.minRR = 1.0; CFG.risk.perTradePct = 0.15; CFG.risk.posNew = 0.4; CFG.risk.posTrend = 0.6; CFG.tp1Frac = 0.7; CFG.nw.maxHoldH = 3; CFG.tr.maxHoldH = 6 } else { CFG.risk.minRR = 1.5; CFG.risk.perTradePct = 0.5; CFG.risk.posNew = 1; CFG.risk.posTrend = 2; CFG.tp1Frac = 0.5; CFG.nw.maxHoldH = 12; CFG.tr.maxHoldH = 48 } }

/* ============================ security (mirrors security.py) ============================ */
function evalSecurity(sec,snap,cat,t){
  const checks=[];const add=(n,ok)=>checks.push([n,!!ok,true]);const soft=CFG.secMode!=="strict",addS=(n,ok)=>checks.push([n,!!ok,!soft]),loose=CFG.secMode==="loose",addU=(n,val,ok)=>{if(val==null)checks.push([n,!soft?false:false,!soft]);else checks.push([n,!!ok,!loose])};
  if(!sec)return{pass:false,risk:100,fails:["security_data_available"],checks:[["security_data_available",false]]};
  const isNew=cat==="new",c=CFG.sec,f=(n,v)=>(v==null&&soft)?addS(n,false):add(n,v===false);   // unknown is a risk point in Balanced/Loose, a veto only in Strict
  if(sec.unverified){add("security_unverified (source unreachable, small size)",true);add("liquidity",snap.liq>=(isNew?c.liqNew:c.liqTrend));add("sells_exist",!(snap.buys1h>=20&&snap.sells1h===0));add("no_wash",(snap.liq>0?snap.vol24/snap.liq:1e9)<=c.volLiq);add("no_vertical_pump",snap.chg1h<=1000&&snap.chg5m<=150);const fl=checks.filter(x=>!x[1]).map(x=>x[0]);return{pass:!fl.length,risk:Math.min(100,50+(isNew?15:0)),fails:fl,checks:checks.map(x=>[x[0],x[1]]),unverified:true}}
  if(!sec.sol){f("not_honeypot",sec.honeypot);f("no_hidden_owner",sec.hiddenOwner);f("no_ownership_takeback",sec.takeBack);
    f("owner_cannot_change_balance",sec.ownerBal);f("transfers_not_pausable",sec.pausable);f("can_sell_all",sec.cannotSellAll);
    f("no_slippage_modification",sec.slipMod);f("no_selfdestruct",sec.selfdestruct);f("not_mintable",sec.mintable);
    (soft?(n,v)=>addS(n,v===false):f)("no_blacklist",sec.blacklist);f("creator_no_honeypot_history",sec.creatorHP);addS("contract_verified",sec.openSource===true);add("tradable_on_dex",sec.inDex===true)}
  else{f("not_mintable",sec.mintable);f("not_freezable",sec.freezable);f("not_closable",sec.closable);f("transferable",sec.nonTransferable);f("owner_cannot_change_balance",sec.ownerBal)}
  (sec.buyTax==null&&soft?addS:add)("buy_tax",sec.buyTax!=null&&sec.buyTax<=c.buyTax);(sec.sellTax==null&&soft?addS:add)("sell_tax",sec.sellTax!=null&&sec.sellTax<=c.sellTax);
  addU("holders",sec.holders,sec.holders>=(isNew?c.holdersNew:c.holdersTrend)*(loose?0.2:soft?0.5:1));
  addU("top10",sec.top10,sec.top10<=c.top10+(loose?35:soft?10:0));
  for(const [n,v,l] of [["creator",sec.creator,c.creator],["owner",sec.owner,c.owner]]){if(v==null&&sec.sol)continue;addU(n,v,v<=l+(soft?5:0))}
  add("liquidity",snap.liq>=(isNew?c.liqNew:c.liqTrend));
  const lp=sec.lpLocked;if(isNew)addU("lp_locked",lp,lp>=c.lpLocked*(soft?0.6:1));else addS("lp_locked",lp==null||lp>=20||snap.liq>=1e6);
  add("sells_exist",!(snap.buys1h>=20&&snap.sells1h===0));
  add("no_wash",(snap.liq>0?snap.vol24/snap.liq:1e9)<=c.volLiq);
  add("no_vertical_pump",snap.chg1h<=1000&&snap.chg5m<=150);
  let r=Math.min(25,(sec.top10??50)*0.5)+Math.min(10,sec.creator??5)+Math.min(10,(sec.buyTax||0)+(sec.sellTax||0));
  r+=(sec.proxy?6:0)+(sec.extCall?4:0)+(sec.cooldown?5:0)+(sec.sol&&sec.creator==null?5:0)+(isNew?15:0);
  r+=snap.liq<30000?12:snap.liq<100000?6:0;r+=(sec.lpLocked||0)<90?5:0;r+=(sec.holders!=null&&sec.holders<300)?5:0;
  const age=snap.created?(t-snap.created)/3600:null;if(age!=null&&age<1)r+=8;
  r+=checks.filter(x=>!x[1]&&!x[2]).length*8;
  const fails=checks.filter(x=>x[2]&&!x[1]).map(x=>x[0]);
  return{pass:!fails.length,risk:Math.min(100,r),fails,checks:checks.map(c=>[c[0],c[1]])};
}


/* ============================ strategy (mirrors strategy.py) ============================ */
const bp=s=>{const n=s.buys1h+s.sells1h;return n?s.buys1h/n:0};
const ageH=(s,t)=>s.created?Math.max(0,(t-s.created)/3600):null;
function mkPlan(s,cat,score,reason){const c=cat==="new"?CFG.nw:CFG.tr;
  const stop=CFG.scalp?c.stop:clamp(Math.abs(s.chg1h)*0.4,c.stop,c.stop*2),tp1=CFG.scalp?c.tp1:Math.max(c.tp1,stop*2),tp2=CFG.scalp?c.tp2:Math.max(c.tp2,cat==="new"?tp1*2:tp1*2.2);
  return{stop,tp1,tp2,trail:c.trail,score,rr:tp1/stop,reason}}
function analyzeNew(s,t){const c=FILL?Object.assign({},CFG.nw,CFG.nwFill):CFG.nw,rej=[],age=ageH(s,t);if(!c.enabled)return[null,["new-token entries are switched off"]];if(age==null)return[null,["unknown age"]];
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
function analyzeTrend(s,t,breakout){const c=FILL?Object.assign({},CFG.tr,CFG.trFill):CFG.tr,rej=[],age=ageH(s,t);if(!c.enabled&&!FILL)return[null,["established-token entries are switched off"]];
  if(age==null||age<c.minAgeH)rej.push("insufficient history");if(s.liq<CFG.sec.liqTrend)rej.push("liquidity low");if(s.vol24<c.minVol)rej.push("volume low");
  const acc=s.vol24>0?s.vol1h*24/s.vol24:0;if(acc<(c.minAccel))rej.push("no volume acceleration");const b=bp(s);if(b<c.minBP)rej.push("weak buy pressure");
  if(!(s.chg1h>=(FILL?-3:1)&&s.chg1h<=(FILL?40:25)))rej.push("1h move outside range");if(s.chg6h<(FILL?-5:2))rej.push("6h trend weak");if(s.chg24>c.maxChg24)rej.push("overextended");
  if(s.chg5m<(FILL?-3:-1))rej.push("short-term weakness");if(rej.length)return[null,rej];
  const sc=clamp((acc-1)*20,0,25)+clamp((b-0.5)*150,0,20)+clamp(s.chg1h*1.2,0,15)+clamp(s.chg6h*0.6,0,10)+clamp(Math.log10(s.liq/CFG.sec.liqTrend+1)*20,0,15)+(breakout?15:breakout==null?0:-10);
  if(sc<c.minScore)return[null,["score "+sc.toFixed(0)+" < "+c.minScore]];
  return[mkPlan(s,"trending",sc,`accel=${acc.toFixed(1)}x bp=${b.toFixed(2)} breakout=${breakout}`),[]]}


const NOT_TRADABLE=new Set(["usdt","usdc","dai","weth","wbtc","wsol","sol","eth","btc","bnb","wbnb","usde","fdusd","tusd","usdd","busd","steth","wsteth","cbbtc","cbeth","usds","pyusd"]);
/* ============================ risk manager (mirrors risk.py) ============================ */
function riskMult(){const pf=S.pf,eq=equity(),dd=Math.max(0,(pf.peak-eq)/pf.peak*100);let m=1-0.6*Math.min(1,dd/CFG.risk.maxDD);if(pf.streak>=2)m*=0.5;return clamp(m,0.1,1)}
function shutdownReason(){const pf=S.pf;if(pf.shutdown)return pf.why;const eq=equity();pf.peak=Math.max(pf.peak,eq);
  const dd=(pf.peak-eq)/pf.peak*100;if(dd>=CFG.risk.maxDD)return`max drawdown ${dd.toFixed(1)}%`;
  const loss=(pf.start-eq)/pf.start*100;if(loss>=CFG.risk.maxTotalLoss)return`total loss ${loss.toFixed(1)}%`;return""}
function globalBlock(t){const pf=S.pf,R=CFG.risk;if(pf.shutdown)return"emergency shutdown active";if(!marketOk(t))return regime==="unknown"?"market data missing (entries blocked)":"market regime "+regime;if(pf.dayStart>0&&(pf.dayStart-equity())/pf.dayStart*100>=R.dailyLoss)return"daily loss limit reached";if(!CFG.keep.on&&t<pf.pauseUntil)return"paused after losses";if(R.dailyLock>0&&pf.dayStart>0&&(equity()-pf.dayStart)/pf.dayStart*100>=R.dailyLock)return"daily profit target reached: locking in today's gain";return""}
function approve(snap,cat,risk,plan,t,agentId){const R=CFG.risk,pf=S.pf,no=r=>({ok:false,why:r});
  if(pf.shutdown)return no("shutdown");if(!marketOk(t))return no("market regime");
  if(pf.dayStart>0&&(pf.dayStart-equity())/pf.dayStart*100>=R.dailyLoss)return no("daily loss limit");
  const K=CFG.keep.on;if(!K&&t<pf.pauseUntil)return no("paused after losses");const k=snap.chain+":"+snap.addr.toLowerCase();
  if(pf.positions[k])return no("already held");if(NOT_TRADABLE.has(snap.sym.toLowerCase()))return no("base asset or stablecoin");if(Object.values(pf.positions).some(p=>p.sym.toLowerCase()===snap.sym.toLowerCase()))return no("same symbol already held (clone risk)");if(t<(pf.cool[k]||0))return no("re-entry cooldown");
  if(!K&&pf.entries.filter(x=>t-x<3600).length>=R.perHour)return no("hourly entry limit");if(!K&&pf.entries.filter(x=>t-x<86400).length>=R.perDay)return no("daily entry limit");
  if(Object.keys(pf.positions).length>=R.maxPos)return no("max positions");if(!FILL&&risk>R.maxRisk)return no("risk score "+risk.toFixed(0));if(plan.rr<R.minRR)return no("reward/risk");
  const eq=equity(),ex=exposure(),caps={share:eq*R.totalExp/100/R.maxPos*1.6,risk:eq*R.perTradePct/100*growth()/(R.worstCase&&cat==="new"?1:plan.stop/100)*riskMult()*clamp(1-(risk-R.riskFull)/(R.maxRisk-R.riskFull)*0.75,0.25,1)*(FILL?CFG.keep.sizeMult:1),pos:eq*(cat==="new"?R.posNew:R.posTrend)/100,
    liq:snap.liq*R.liqFrac,total:eq*R.totalExp/100-ex,cash:pf.cash-eq*R.cashReserve/100,chain:eq*R.chainExp/100-(expBy(p=>p.chain)[snap.chain]||0)};
  {const lim=agentId?agentLimit(agentId,t):"";if(lim)return no(lim)}
  if(agentId)caps.agent=eq*R.totalExp/100*agentShare(agentId)*1.6-agentExposure(agentId);
  if(cat==="new")caps.newExp=eq*R.newExp/100-(expBy(p=>p.cat).new||0);
  let name="",usd=Infinity;for(const [n,v] of Object.entries(caps))if(v<usd){usd=v;name=n}
  if(usd<R.minTrade)return no(`size ${usd.toFixed(0)} below min (${name})`);
  {const gasRT=2*(CFG.ex.gas[snap.chain]??0.5)*1.2+(snap.chain==="solana"&&cat==="new"?0.15:0),res=Math.max(snap.liq/2,1),fee=2*CFG.ex.fee/100,cap=R.maxCostPct/100;
   const fit=Math.max(0,cap-fee)*res/2*0.9;                      // biggest size whose price impact stays inside the cost limit
   if(usd>fit){usd=fit;name="pool depth (cost limit)"}
   if(usd<R.minTrade)return no(`pool too shallow: a ${R.minTrade}$ trade would cost more than ${R.maxCostPct}% to round-trip`);
   const cost=gasRT/usd+fee+2*usd/res;
   if(cost>cap)return no(`network fees ${(gasRT/usd*100).toFixed(1)}% of a ${usd.toFixed(0)}$ trade are too high on ${snap.chain}`)}
  if(false)return no(`size ${usd.toFixed(0)} below min (${name})`);return{ok:true,usd,why:`size ${usd.toFixed(0)} (${name})`}}
function regimeOf(m){if(!m)return"unknown";const v=Object.values(m),w=Math.min(...v),a=v.reduce((x,y)=>x+y,0)/v.length;
  if(w<=CFG.em.crash||a<=CFG.em.crash/1.5)return"crash";if(w<=CFG.em.danger||a<=CFG.em.danger/1.5)return"danger";return"ok"}
const marketOk=t=>regime==="ok"&&(t-regimeOk)/60<=CFG.em.regimeUnknownMin;


/* ============================ the 10 agents ============================
 * Each agent is a specialist with its own entry rule, exits and share of the portfolio. Every discovered token is shown to every
 * enabled agent; the best-scoring match (weighted by that agent's track record) gets the trade. Each agent keeps its own results,
 * and agents that keep losing get a smaller share until they prove themselves again. Security checks and risk rules are shared and
 * cannot be bypassed by any agent.
 */
const _p = (stop, tp1, tp2, trail, score, reason) => ({ stop, tp1, tp2, trail, score, rr: tp1 / stop, reason });
const _vlr = s => s.liq > 0 ? s.vol1h / s.liq : 0;
const _avgTrade = s => { const n = s.buys1h + s.sells1h; return n ? s.vol1h / n : 0 };
const _acc = s => s.vol24 > 0 ? s.vol1h * 24 / s.vol24 : 0;
const _uniq = s => s.buyers1h != null && s.buys1h >= 20 ? s.buyers1h / s.buys1h : null;
const _no = r => [null, [r]];
const AGENTS = [
  { id: "launch", name: "Launch Scout", cat: "new", scope: "new", desc: "Fresh pools with real two-sided activity and organic buyers.", run: (s, t) => analyzeNew(s, t) },
  { id: "trend", name: "Trend Follower", cat: "trending", scope: "est", desc: "Older tokens with rising volume, steady buying and a breakout.", run: (s, t, bo) => analyzeTrend(s, t, bo === undefined ? true : bo) },
  { id: "rider", name: "Momentum Rider", cat: "new", scope: "new", desc: "New tokens in a steady climb, 1 to 8 hours old.", run(s, t) {
    const age = ageH(s, t); if (age == null || age < 0.75 || age > 8) return _no("age outside 0.75-8h");
    if (s.liq < CFG.sec.liqNew) return _no("liquidity low"); if (s.chg1h < 8 || s.chg1h > 60) return _no("1h move outside 8-60%");
    if (s.chg6h < s.chg1h * 0.8) return _no("climb not steady"); if (bp(s) < 0.56) return _no("weak buy pressure"); const v = _vlr(s); if (v < 0.4 || v > 12) return _no("turnover off");
    return [_p(15, 35, 90, 12, 55 + Math.min(25, s.chg1h / 3) + (bp(s) - 0.5) * 60, `climb ${s.chg1h.toFixed(0)}%/1h bp ${bp(s).toFixed(2)}`), []] } },
  { id: "dip", name: "Pullback Buyer", cat: "new", scope: "any", desc: "A strong token that dipped and is stabilising.", run(s, t) {
    if (s.liq < CFG.sec.liqNew) return _no("liquidity low"); if (s.chg6h < 15) return _no("no prior strength");
    if (s.chg1h > -6 || s.chg1h < -25) return _no("no pullback of 6-25%"); if (s.chg5m < 0) return _no("still falling"); if (bp(s) < 0.5) return _no("sellers in control");
    return [_p(12, 20, 45, 8, 50 + Math.min(20, s.chg6h / 3) + (s.chg5m) * 4, `dip ${s.chg1h.toFixed(0)}% after +${s.chg6h.toFixed(0)}%/6h`), []] } },
  { id: "breakout", name: "Volume Breakout", cat: "new", scope: "any", desc: "Volume jumps well above normal while price starts to rise.", run(s, t) {
    if (s.liq < CFG.sec.liqNew) return _no("liquidity low"); const a = Math.max(_acc(s), s.vol1h > 0 ? s.vol5 * 12 / s.vol1h : 0);
    if (a < 2.5) return _no("no volume surge"); if (s.chg1h < 3 || s.chg1h > 30) return _no("1h move outside 3-30%"); if (s.chg5m <= 0) return _no("5m not rising"); if (bp(s) < 0.55) return _no("weak buy pressure");
    return [_p(13, 28, 70, 10, 52 + Math.min(25, a * 5) + (bp(s) - 0.5) * 50, `volume x${a.toFixed(1)} 1h ${s.chg1h.toFixed(0)}%`), []] } },
  { id: "quality", name: "Quality Buyers", cat: "new", scope: "new", desc: "Many different real buyers and healthy selling too.", run(s, t) {
    const age = ageH(s, t); if (age == null || age < 0.3 || age > 12) return _no("age outside 0.3-12h"); if (s.liq < Math.max(20000, CFG.sec.liqNew)) return _no("liquidity low");
    const u = _uniq(s); if (u == null) return _no("no unique-buyer data"); if (u < 0.7) return _no("few unique buyers"); if (s.sells1h < s.buys1h * 0.25) return _no("one-sided flow"); if (s.chg1h < 0 || s.chg1h > 80) return _no("1h move outside 0-80%");
    return [_p(16, 36, 90, 12, 58 + (u - 0.7) * 60 + Math.min(15, s.chg1h / 4), `unique buyers ${(u * 100).toFixed(0)}%`), []] } },
  { id: "whale", name: "Whale Flow", cat: "new", scope: "any", desc: "Big average trade size with buyers in control.", run(s, t) {
    if (s.liq < Math.max(30000, CFG.sec.liqNew)) return _no("liquidity low"); const a = _avgTrade(s); if (a < 250) return _no("small trades only"); if (bp(s) < 0.58) return _no("weak buy pressure"); if (s.chg1h < 2 || s.chg1h > 40) return _no("1h move outside 2-40%");
    return [_p(14, 30, 75, 10, 54 + Math.min(20, a / 40) + (bp(s) - 0.5) * 50, `avg trade $${a.toFixed(0)} bp ${bp(s).toFixed(2)}`), []] } },
  { id: "gem", name: "Gem Hunter", cat: "new", scope: "new", desc: "Small pools with very high turnover and a strong buy majority.", run(s, t) {
    const age = ageH(s, t); if (age == null || age < 0.3 || age > 6) return _no("age outside 0.3-6h"); if (s.liq < 8000 || s.liq > 40000) return _no("liquidity outside 8-40k"); if (_vlr(s) < 2) return _no("turnover below 2x/h");
    if (bp(s) < 0.6) return _no("weak buy pressure"); if (s.chg1h < 5 || s.chg1h > 120) return _no("1h move outside 5-120%"); if (s.buys1h + s.sells1h < 80) return _no("thin activity");
    return [_p(20, 50, 120, 15, 50 + Math.min(25, _vlr(s) * 3) + (bp(s) - 0.5) * 50, `turnover ${_vlr(s).toFixed(1)}x/h`), []] } },
  { id: "reversal", name: "Dip Reversal", cat: "trending", scope: "est", desc: "Established tokens that fell hard and are turning up.", run(s, t) {
    const age = ageH(s, t); if (age == null || age < CFG.tr.minAgeH) return _no("insufficient history"); if (s.liq < Math.max(60000, CFG.sec.liqTrend)) return _no("liquidity low");
    if (s.chg24 > -12) return _no("no 24h drop"); if (s.chg1h < 1.5) return _no("no turn yet"); if (s.chg5m < 0) return _no("5m falling"); if (_acc(s) < 1.5) return _no("no volume pickup"); if (bp(s) < 0.54) return _no("weak buy pressure");
    return [_p(8, 12, 25, 6, 50 + Math.min(20, -s.chg24) + s.chg1h * 3, `24h ${s.chg24.toFixed(0)}% now +${s.chg1h.toFixed(1)}%/1h`), []] } },
  { id: "range", name: "Range Breaker", cat: "trending", scope: "est", desc: "Big liquid tokens pushing out of a quiet range on rising volume.", run(s, t) {
    const age = ageH(s, t); if (age == null || age < CFG.tr.minAgeH) return _no("insufficient history"); if (s.liq < Math.max(100000, CFG.sec.liqTrend)) return _no("liquidity low");
    if (s.chg6h < 6) return _no("6h below 6%"); if (s.chg1h < 2 || s.chg1h > 15) return _no("1h move outside 2-15%"); if (_acc(s) < 2) return _no("no volume surge"); if (bp(s) < 0.55) return _no("weak buy pressure");
    return [_p(9, 18, 40, 7, 52 + Math.min(20, _acc(s) * 6) + s.chg1h, `6h +${s.chg6h.toFixed(0)}% volume x${_acc(s).toFixed(1)}`), []] } },
];
// per-agent tuning found by the offline trainer (test/train_agents.mjs): stricter buy-pressure / liquidity gates and its own quick-mode exits
const AGENT_TUNE = {};
// agents that passed offline training on unseen simulated markets start with a small record (12 trades' worth, haircut) so they can trade from the first minute;
// real results then overrule it quickly. Agents that failed offline training start with no record and have to practise.
const AGENT_PRE = {
  launch: { n: 12, w: 7, r: 1.6 }, breakout: { n: 12, w: 8, r: 3.4 }, quality: { n: 12, w: 6, r: 0.8 }, reversal: { n: 12, w: 6, r: 2.1 },
};
function seedPretrained() { const A = S.pf.ag || (S.pf.ag = {}); for (const [id, r] of Object.entries(AGENT_PRE)) if (!A[id] || !A[id].n) A[id] = { n: r.n, w: r.w, r: r.r, pnl: 0, pre: true } }

/* trained agent settings (test/train_agents.mjs, validated on unseen markets) */
Object.assign(AGENT_TUNE, {"launch":{"quick":{"stop":4.5,"tp1":6,"tp2":12,"trail":3}},"rider":{"quick":{"stop":2.5,"tp1":3,"tp2":6,"trail":1.5}},"quality":{"bp":0.08},"whale":{"quick":{"stop":2.5,"tp1":3,"tp2":6,"trail":1.5}}});


/* ============================ the scout swarm (300 extra agents) ============================
 * Parameter variants of the same market-structure ideas (age window, liquidity floor, momentum band, buy pressure, turnover, volume surge,
 * unique buyers, exit style). They NEVER risk money while unproven: every scout takes virtual (shadow) trades with full costs, and may only
 * trade for real after 30+ virtual trades with positive average return AND win rate >= 50%. Real trades from scouts use half size.
 * Honest caveat: with 300 candidates some will look good by luck, so the bar is strict and live results keep re-judging them.
 */
const SWARM_N = 300;
function makeSwarm() {
  let x = 20240611; const rnd = () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296, pick = a => a[Math.floor(rnd() * a.length)];
  const seen = new Set(), out = [];
  const exits = [{ stop: 6, tp1: 8, tp2: 16, trail: 4 }, { stop: 8, tp1: 12, tp2: 28, trail: 6 }, { stop: 5, tp1: 7, tp2: 14, trail: 3 }, { stop: 10, tp1: 16, tp2: 36, trail: 7 }];
  let guard = 0;
  while (out.length < SWARM_N && guard++ < 20000) {
    const est = rnd() < 0.3;
    const c = { est, age: est ? [0, 0] : pick([[0.3, 3], [0.75, 8], [3, 24], [0.3, 12]]), liq: pick(est ? [60000, 100000, 250000] : [8000, 15000, 30000, 60000]), c1: pick(est ? [[1, 12], [2, 25], [-20, -3]] : [[2, 15], [5, 30], [10, 60], [-25, -5], [0, 80]]),
      c5: pick([-3, 0, 1, 2]), bp: pick([0.5, 0.55, 0.6, 0.65, 0.7]), vlr: pick([0, 0.5, 1.5, 3]), acc: pick([0, 0, 2, 3]), u: pick([0, 0, 0.6, 0.75]), ex: Math.floor(rnd() * exits.length) };
    const key = JSON.stringify(c); if (seen.has(key)) continue; seen.add(key);
    const ex = exits[c.ex], i = out.length + 1, tag = (c.c1[0] < 0 ? "dip " : "up ") + c.c1[0] + ".." + c.c1[1] + "%";
    out.push({ c, id: "sw" + String(i).padStart(3, "0"), name: "Scout " + String(i).padStart(3, "0"), swarm: true, cat: est ? "trending" : "new", scope: est ? "est" : "new", quick: ex,
      desc: `${est ? "Established" : "New"} coin · ${tag} 1h · liquidity ≥ $${c.liq / 1000}k · buyers ≥ ${Math.round(c.bp * 100)}%${c.vlr ? " · turnover ≥ " + c.vlr + "x" : ""}${c.acc ? " · volume surge ≥ " + c.acc + "x" : ""}${c.u ? " · unique buyers ≥ " + Math.round(c.u * 100) + "%" : ""}`,
      run(s, t) {
        const age = ageH(s, t); if (!c.est && (age == null || age < c.age[0] || age > c.age[1])) return _no("age window");
        if (s.liq < Math.max(c.liq, c.est ? CFG.sec.liqTrend : CFG.sec.liqNew)) return _no("liquidity low"); if (s.chg1h < c.c1[0] || s.chg1h > c.c1[1]) return _no("1h move outside band"); if (s.chg5m < c.c5) return _no("5m too weak");
        const b = bp(s); if (b < c.bp) return _no("weak buy pressure"); if (c.vlr && _vlr(s) < c.vlr) return _no("turnover low"); if (c.acc && Math.max(_acc(s), s.vol1h > 0 ? s.vol5 * 12 / s.vol1h : 0) < c.acc) return _no("no volume surge");
        if (c.u) { const u = _uniq(s); if (u == null || u < c.u) return _no("few unique buyers") }
        return [_p(ex.stop, ex.tp1, ex.tp2, ex.trail, 50 + (b - 0.5) * 60 + Math.min(10, Math.abs(s.chg1h) / 3), `scout ${i}: buyers ${(b * 100).toFixed(0)}% 1h ${s.chg1h.toFixed(0)}%`), []] } });
  }
  return out;
}
AGENTS.push(...makeSwarm());
const AG = Object.fromEntries(AGENTS.map(a => [a.id, a]));
const agentOn = id => !(CFG.agentsOff || {})[id] && !(CFG.swarmOff && AG[id] && AG[id].swarm);
function agentStat(id) { const a = (S && S.pf && S.pf.ag && S.pf.ag[id]) || { n: 0, pnl: 0, w: 0, r: 0 }; return a }
// share of the portfolio an agent may use: grows with proven expectancy, shrinks after a losing record (needs 8+ trades to judge)
function agentWeight(id) { const a = agentStat(id); if (a.n < 10) return CFG.agentProbation; const e = a.r / a.n; return clamp(1 + e * 3, 0.1, 2) }
function agentRecent(id, t, win = 3600) { let n = 0; for (const p of Object.values(S.pf.positions)) if (p.agent === id && t - p.opened < win) n++; for (const c of S.pf.closed.slice(-200)) if (c.agent === id && c.t - c.held * 3600 > t - win) n++; return n }
// proven agents trade freely; struggling agents are throttled; a benched agent only gets one probe trade every 6 hours
function agentLimit(id, t) { const w = agentWeight(id), a = agentStat(id); if (a.n >= 20 && w <= 0.1) return agentRecent(id, t, 21600) >= 1 ? "benched (probe every 6h)" : ""; const lim = w >= 1 ? CFG.agentHourly : w >= 0.5 ? Math.ceil(CFG.agentHourly / 2) : Math.ceil(CFG.agentHourly / 4); return agentRecent(id, t) >= lim ? "agent entry limit (" + lim + "/hour at its current record)" : "" }
function agentShare(id) { let tot = 0; for (const a of AGENTS) if (agentOn(a.id) && (!a.swarm || agentProven(a.id))) tot += agentWeight(a.id); return tot ? agentWeight(id) / tot : 0 }
function agentExposure(id) { let v = 0; for (const p of Object.values(S.pf.positions)) if (p.agent === id) v += pv(p); return v }
function ageOK(a, s, t) { const age = ageH(s, t); if (a.scope === "any") return true; if (age == null) return a.scope === "new"; return a.scope === "new" ? age <= 48 : age >= CFG.tr.minAgeH }
// every enabled agent looks at the token; returns the best match or null, plus the first rejection reason for diagnostics
function pickAgent(s, t, source) {
  let best = null, why = null;
  for (const a of AGENTS) {
    if (!agentOn(a.id) || !ageOK(a, s, t)) continue;
    if (source === "trending" && a.scope === "new" && false) continue;
    const [plan, rej] = a.run(s, t, true);
    if (plan) { const sc = plan.score * agentWeight(a.id); if (!best || sc > best.sc) best = { agent: a, plan, sc } } else if (!why) why = rej[0];
  }
  return { best, why: why || "no agent matched" };
}

/* ============================ learning phase, committee review, profit-funded growth ============================
 * 1. SHADOW TRADING: every agent that likes a coin records a virtual trade (no money) with the same stops, targets and realistic costs.
 *    An agent only gets real money after it has proven itself on those virtual trades (and later on real ones).
 * 2. COMMITTEE: many agents can study the same coin at once. A real trade needs a proven lead agent AND at least 3 of 5 independent
 *    reviewers (not chasing, two-sided flow, real buyers, enough depth, market not falling). More approvals = slightly larger size.
 * 3. GROWTH FROM PROFIT ONLY: position size can rise (up to 2x) only as realised profit builds, and never while in a drawdown.
 */
CFG.learn = { probation: true, on: true, minTrades: 12, minExp: 0.05, minWin: 0.45, maxShadow: 400, perAgent: 100 };
function agentProven(id) { if (!CFG.learn.on) return true; const a = agentStat(id), sw = AG[id] && AG[id].swarm; if (sw && !CFG.swarmReal) return false; if (a.n < (sw ? 30 : CFG.learn.minTrades)) return false; return a.r / a.n >= (sw ? 0.15 : CFG.learn.minExp) && a.w / a.n >= (sw ? 0.5 : CFG.learn.minWin) }
// probation: an agent without a clear bad record may trade real money at 40% size while it keeps practising (faster, still capped)
function agentExploring(id, t) { if (!CFG.learn.probation || (AG[id] && AG[id].swarm)) return false; const last = S.lastOpenAt || 0; if (t - last < 1800) return false; let best = null, be = -9; for (const a of AGENTS) { if (!agentOn(a.id) || a.swarm) continue; const s = agentStat(a.id), e = s.n ? s.r / s.n : 0; if (e > be) { be = e; best = a.id } } return best === id }
function agentProbation(id) { if (!CFG.learn.on || agentProven(id) || !CFG.learn.probation || (AG[id] && AG[id].swarm)) return false; const a = agentStat(id); return a.n < 8 || a.r / a.n > -0.25 }
function agentLearning(id) { const a = agentStat(id); return { n: a.n, need: CFG.learn.minTrades, proven: agentProven(id) } }
function pickAll(s, t, source) {
  const hits = []; let why = null; const age = ageH(s, t), b = bp(s), off = CFG.agentsOff || {};
  for (const a of AGENTS) {
    if (a.c) {   // scouts: cheap shared pre-filter so 300 of them cost almost nothing per coin
      const c = a.c; if (CFG.swarmOff || s.liq < c.liq || s.chg1h < c.c1[0] || s.chg1h > c.c1[1] || s.chg5m < c.c5 || b < c.bp || off[a.id]) continue;
      if (c.est ? (age == null || age < CFG.tr.minAgeH) : (age == null || age < c.age[0] || age > c.age[1])) continue;
    }
    if (!agentOn(a.id) || !ageOK(a, s, t)) continue;
    const [plan, rej] = a.run(s, t, true), T = AGENT_TUNE[a.id] || {};
    if (plan && T.bp && bp(s) < 0.5 + T.bp) { if (!why) why = "buy pressure below tuned bar"; continue }
    if (plan && T.liq && s.liq < CFG.sec.liqNew * T.liq) { if (!why) why = "liquidity below tuned bar"; continue }
    if (plan && T.vlr && _vlr(s) < T.vlr) { if (!why) why = "turnover below tuned bar"; continue }
    if (plan) hits.push({ agent: a, plan }); else if (!why) why = rej[0];
  }
  return { hits, why: why || "no agent matched" };
}
function quickPlan(plan, id) { if (!CFG.quick.on) return plan; const q = Object.assign({}, CFG.quick, (AG[id] && AG[id].quick) || {}, (AGENT_TUNE[id] || {}).quick || {}); return Object.assign({}, plan, { stop: q.stop, tp1: q.tp1, tp2: q.tp2, trail: q.trail, rr: q.tp1 / q.stop }) }
function reviewers(s, cat) {
  const u = _uniq(s);
  const r = [
    ["not chasing", s.chg1h <= 60 && s.chg5m >= -3],
    ["two-sided flow", s.sells1h >= s.buys1h * 0.2],
    ["real buyers", u == null || u >= 0.5],
    ["enough depth", s.liq >= 20000 || cat === "trending"],
    ["market not falling", regime === "ok"],
  ];
  return { ok: r.filter(x => x[1]).length, list: r };
}
function growth() { const pf = S.pf; const inDD = equity() < pf.peak * 0.97; return inDD ? 1 : 1 + clamp(pf.realized / pf.start * 5, 0, 1) }

/* ---- shadow (virtual) trades ---- */
function shadowOpen(snap, h, t) {
  const sh = S.shadow || (S.shadow = {}), k = h.agent.id + "|" + snap.chain + ":" + snap.addr.toLowerCase();
  const rc = S.shadowRecent || (S.shadowRecent = {}); if (sh[k] || (rc[k] && t - rc[k] < 21600)) return false;
  const sw = !!h.agent.swarm, mine = Object.values(sh), nSw = mine.filter(x => x.sw).length; if (sw ? nSw >= 500 : mine.length - nSw >= CFG.learn.maxShadow) return false; if (mine.filter(x => x.agent === h.agent.id).length >= (sw ? 3 : CFG.learn.perAgent)) return false;
  const p = quickPlan(h.plan, h.agent.id), usd = clamp(snap.liq * 0.004, 15, 60);   // about the size a real trade would get
  sh[k] = { fx: lessonFx(snap, t, h.agent), sw: !!h.agent.swarm, agent: h.agent.id, chain: snap.chain, addr: snap.addr, sym: snap.sym, cat: h.agent.cat, opened: t, entry: snap.price, last: snap.price, peak: snap.price, usd, stop: snap.price * (1 - p.stop / 100), tp1: snap.price * (1 + p.tp1 / 100), tp2: snap.price * (1 + p.tp2 / 100), trail: p.trail, tp1Done: false, real: 0, frac: 1, liq0: snap.liq, liq: snap.liq, stopPct: p.stop };
  return true;
}
function shadowCost(sh) { const R = Math.max(sh.liq0 / 2, 1), gas = 2 * (CFG.ex.gas[sh.chain] ?? 0.5) * 1.2; return sh.usd * (2 * CFG.ex.fee / 100 + 2 * sh.usd / R + 0.006) + gas }
function shadowClose(sh, key, why, t, px) {
  const sd = S.shadow; delete sd[key]; (S.shadowRecent || (S.shadowRecent = {}))[key] = t;
  const price = px ?? sh.last, leg = sh.frac * sh.usd * (price / sh.entry - 1), pnl = sh.real + leg - shadowCost(sh) * (sh.tp1Done ? 1 : 1), r = pnl / (sh.usd * sh.stopPct / 100);
  const A = S.pf.ag || (S.pf.ag = {}), a = A[sh.agent] || (A[sh.agent] = { n: 0, pnl: 0, w: 0, r: 0 });
  a.n++; a.pnl += pnl; a.w += pnl > 0 ? 1 : 0; a.r += r; a.sn = (a.sn || 0) + 1; lessonAdd(sh.fx, r);
  const L = S.shadowLog || (S.shadowLog = []); L.unshift({ t, agent: sh.agent, sym: sh.sym, pnl, r, why }); if (L.length > 150) L.length = 150;
  if (agentProven(sh.agent) && !sh.announced && a.n === CFG.learn.minTrades) ev("info", "agent_proven", sh.agent, "agent passed its learning phase and may now trade real money");
}
function shadowUpdate(snaps, t) {
  const sd = S.shadow; if (!sd) return;
  for (const [key, sh] of Object.entries(sd)) {
    const s = snaps[sh.chain + ":" + sh.addr.toLowerCase()], maxH = (sh.cat === "new" ? CFG.nw.maxHoldH : CFG.tr.maxHoldH) * 3600;
    if (!s || s.price <= 0) { if (t - sh.opened > maxH) shadowClose(sh, key, "no price", t); continue }
    const prevL = sh.liq; sh.last = s.price; sh.liq = s.liq; sh.peak = Math.max(sh.peak, s.price);
    if (s.liq < sh.liq0 * 0.5 || (prevL > 0 && s.liq < prevL * 0.7)) { shadowClose(sh, key, "liquidity pulled", t, sh.last * 0.6); continue }   // exit into a drained pool is costly
    const px = s.price;
    if (sh.tp1Done) sh.stop = Math.max(sh.stop, sh.entry * 1.01, sh.peak * (1 - sh.trail / 100)); else if (px >= sh.entry * (1 + (sh.tp1 / sh.entry - 1) / 2)) sh.stop = Math.max(sh.stop, sh.entry * 1.01);
    if (px <= sh.stop) shadowClose(sh, key, "stop", t, px * 0.995);
    else if (!sh.tp1Done && px >= sh.tp1) { const f = CFG.tp1Frac; sh.real += f * sh.usd * (px / sh.entry - 1); sh.frac -= f; sh.tp1Done = true }
    else if (sh.tp1Done && px >= sh.tp2) shadowClose(sh, key, "target", t, px)
    else if (t - sh.opened > maxH) shadowClose(sh, key, "time", t, px);
  }
}

/* ---- lessons: learn from every finished trade (real AND practice), above all from the failures ----
 * Each trade is described by a few plain features at entry (1h move, 5m move, buy share, liquidity, age, turnover, chain, agent).
 * Every close adds its result (in R) to each feature's bucket, with slow forgetting so recent markets count more.
 * A new real trade is blocked when trades that looked like it have lost on average (needs enough history first).
 * Practice trades are never blocked, so the lessons keep getting tested and can change their mind.
 */
CFG.swarmReal = false;   // testing: scouts that "proved" themselves on practice trades lost money with real money (mostly luck among 300), so scouts only practise and teach the lessons
CFG.lessons = { on: true, minSamples: 150, minPred: -0.12, k: 30, decay: 0.998 };
const _band = (v, cuts) => { if (v == null || !isFinite(v)) return "na"; let i = 0; while (i < cuts.length && v >= cuts[i]) i++; return i };
const LESSON_LABEL = {
  c1: ["1h move below -10%", "1h move -10..0%", "1h move 0..5%", "1h move 5..15%", "1h move 15..40%", "1h move above 40%"],
  c5: ["5m move below -2%", "5m move -2..0%", "5m move 0..2%", "5m move above 2%"],
  bp: ["buyers under 50%", "buyers 50-55%", "buyers 55-60%", "buyers 60-70%", "buyers over 70%"],
  lq: ["liquidity under $15k", "liquidity $15-40k", "liquidity $40-100k", "liquidity $100-300k", "liquidity over $300k"],
  ag: ["age under 1h", "age 1-4h", "age 4-24h", "age 1-7 days", "age over 7 days"],
  tv: ["turnover under 0.5x/h", "turnover 0.5-1.5x/h", "turnover 1.5-4x/h", "turnover over 4x/h"],
};
function lessonFx(s, t, agent) {
  return { c1: _band(s.chg1h, [-10, 0, 5, 15, 40]), c5: _band(s.chg5m, [-2, 0, 2]), bp: _band(bp(s), [0.5, 0.55, 0.6, 0.7]), lq: _band(s.liq, [15000, 40000, 100000, 300000]),
    ag: _band(ageH(s, t), [1, 4, 24, 168]), tv: _band(_vlr(s), [0.5, 1.5, 4]), ch: s.chain, by: agent ? (agent.swarm ? "scout" : agent.id) : "na" };
}
function lessonAdd(fx, r) {
  if (!fx || !isFinite(r) || !CFG.lessons.on) return; const L = S.lessons || (S.lessons = { n: 0, sum: 0, b: {} }), d = CFG.lessons.decay;
  r = clamp(r, -3, 6); L.n = L.n * d + 1; L.sum = L.sum * d + r; L.seen = (L.seen || 0) + 1;
  for (const k in L.b) { L.b[k].n *= d; L.b[k].s *= d }
  for (const [f, v] of Object.entries(fx)) { const o = L.b[f + "=" + v] || (L.b[f + "=" + v] = { n: 0, s: 0 }); o.n += 1; o.s += r }
}
function lessonPred(fx) {
  const L = S.lessons; if (!L || (L.seen || 0) < CFG.lessons.minSamples || !fx) return null;
  const gm = L.sum / L.n, K = CFG.lessons.k; let p = gm;
  for (const [f, v] of Object.entries(fx)) { const o = L.b[f + "=" + v]; if (o) p += (o.s + K * gm) / (o.n + K) - gm }
  return p;
}
function lessonList() {
  const L = S.lessons; if (!L || !L.n) return [];
  const gm = L.sum / L.n, K = CFG.lessons.k;
  return Object.entries(L.b).filter(([k, o]) => o.n >= 8 && !k.endsWith("=na")).map(([k, o]) => { const [f, v] = k.split("="); const lab = LESSON_LABEL[f] ? LESSON_LABEL[f][+v] : f === "ch" ? "chain " + v : f === "by" ? (v === "scout" ? "scout agents" : (AG[v] ? AG[v].name : v)) : k;
    return { k, lab, n: o.n, avg: o.s / o.n, edge: (o.s + K * gm) / (o.n + K) - gm } });
}

/* ============================ boot camp ============================
 * Runs the agents through days of simulated market in seconds and keeps only what each agent learned (its record), then restores the real account.
 * The simulated market is built to be hard, but it is still a simulation: this is a warm start. Live results keep updating every record.
 */
async function trainAgents(days, onProgress) {
  const keep = { S, MODE, vnow, last, stats, rejected, regime, regimeOk, rng, SEED, paused, FILL, uniMedian, LEARN: Object.assign({}, CFG.learn), tick: CFG.tick, hist: MOCK.toks, ev: [CFG.newEvery, CFG.trendEvery, CFG.monitorEvery] };
  const ag0 = JSON.parse(JSON.stringify(S.pf.ag || {})), rec = {}, coreOn = CFG.core.on, swOff = CFG.swarmOff; CFG.core.on = false; CFG.swarmOff = true;
  try {
    MODE = "mock"; S = newState(10000); S.curve = [[1.76e9, 10000]]; last = {}; stats = freshStats(); rejected = {}; regime = "unknown"; paused = false;
    SEED = 4242 + (Date.now() & 0xff); rng = mulberry(SEED); vnow = 1.76e9; MOCK.init(); regimeOk = vnow; CFG.tick = 30; CFG.newEvery = 10; CFG.trendEvery = 30; CFG.monitorEvery = 30;
    const total = Math.round(days * 86400 / 30);
    for (let i = 0; i < total; i++) { vnow += 30; await tick(); if (i % 150 === 0) { if (onProgress) onProgress(i / total); await new Promise(r => setTimeout(r, 15)) } }
    for (const a of AGENTS) { if (a.swarm) continue; const s = (S.pf.ag || {})[a.id]; if (s && s.n) rec[a.id] = { n: s.n, pnl: s.pnl, w: s.w, r: s.r } }
  } finally {
    S = keep.S; MODE = keep.MODE; vnow = keep.vnow; last = keep.last; stats = keep.stats; rejected = keep.rejected; regime = keep.regime; regimeOk = keep.regimeOk; rng = keep.rng; SEED = keep.SEED; paused = keep.paused; FILL = keep.FILL; uniMedian = keep.uniMedian; CFG.learn = keep.LEARN; CFG.core.on = coreOn; CFG.swarmOff = swOff; CFG.tick = keep.tick; [CFG.newEvery, CFG.trendEvery, CFG.monitorEvery] = keep.ev; MOCK.toks = keep.hist;
  }
  // blend: scale training records so a live record can overrule them quickly (at most 14 trades' worth), keep any existing live record
  const A = S.pf.ag || (S.pf.ag = {});
  // training NEVER overwrites a record an agent already has (pre-trained or live): it only gives a starting record to agents that have none.
  const applied = [];
  for (const [id, r] of Object.entries(rec)) { const cur = ag0[id]; if (cur && cur.n >= 8) continue; const k = Math.min(1, 14 / r.n); A[id] = { n: Math.round(r.n * k), pnl: 0, w: Math.round(r.w * k), r: r.r * k, trained: true }; applied.push(id) }
  for (const [id, c] of Object.entries(ag0)) if (!(id in rec) && A[id] === undefined) A[id] = c;
  rec.__applied = applied;
  return rec;
}

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
  // pool vaults and locked accounts are not real holders: drop them, and treat a single >25% account as the AMM vault
  const POOL = /pool|raydium|orca|meteora|vault|amm|liquidity|bonding|pump/i;
  let hs0 = (r.holders || []).filter(h => !(String(h.is_locked) === "1" || POOL.test(String(h.tag || "") + String(h.name || ""))));
  if (hs0.length && num(hs0[0].percent) > 0.25) hs0 = hs0.slice(1);
  const fee = r.transfer_fee && Object.keys(r.transfer_fee).length > 0, hs = hs0, burn = (r.dex || []).map(x => num(x.burn_percent));
  return { sol: true, honeypot: false, buyTax: fee ? 100 : 0, sellTax: fee ? 100 : 0, mintable: st("mintable"), freezable: st("freezable"), closable: st("closable"),
    nonTransferable: r.non_transferable == null ? null : String(r.non_transferable) === "1", ownerBal: st("balance_mutable_authority"),
    holders: /^\d+$/.test(String(r.holder_count)) ? +r.holder_count : null, top10: (r.holders || []).length ? hs.slice(0, 10).reduce((a, h) => a + num(h.percent), 0) * 100 : null,
    lpLocked: burn.length ? Math.max(...burn) : null };
}

const LIVE = {
  async pools(chain, path, source) {
    const net = GT_NET[chain]; if (!net) return [];
    const d = await getJSON(`https://api.geckoterminal.com/api/v2/networks/${net}/${path}`);
    return ((d && d.data) || []).map(p => geckoPool(chain, p)).filter(Boolean).map(s => ({ chain, addr: s.addr, source, snap: s }));
  },
  _cycle: 0,
  async discoverNew(chains) {
    const cs = chains || CFG.chains; let o = []; const cyc = this._cycle++;
    // GeckoTerminal: three pages of newest pools per chain, rotated so the free rate limit is shared (page 1 every time, 2 and 3 alternate)
    const pages = cyc % 2 ? [1, 2] : [1, 3];
    for (const c of cs) for (const pg of pages) o = o.concat(await this.pools(c, `new_pools?page=${pg}`, "new"));
    // DexScreener: newest profiles and boosted tokens (id lists), then keyword searches that return full pair data for up to 30 pairs each
    for (const u of ["token-profiles/latest/v1", "token-boosts/latest/v1"]) { const pr = await getJSON("https://api.dexscreener.com/" + u); for (const p of Array.isArray(pr) ? pr : []) if (cs.includes(p.chainId) && p.tokenAddress) o.push({ chain: p.chainId, addr: p.tokenAddress, source: "new" }) }
    const KW = ["pepe", "dog", "cat", "ai", "trump", "pump", "moon", "frog", "elon", "baby", "inu", "coin", "meme", "gpt", "bull", "king", "sol", "base", "degen", "wif", "bonk", "chad", "giga", "retard", "pixel", "based", "tiger", "duck", "rocket", "gold"];
    for (let i = 0; i < 6; i++) { const q = KW[(cyc * 6 + i) % KW.length], d = await getJSON("https://api.dexscreener.com/latest/dex/search?q=" + q); for (const p of (d && d.pairs) || []) { if (!cs.includes(p.chainId)) continue; const s = dexPair(p.chainId, p); if (s && s.price > 0 && s.liq > 0) o.push({ chain: p.chainId, addr: s.addr, source: "new", snap: s }) } }
    return o;
  },
  async discoverTrending(chains) {
    const cs = chains || CFG.chains; let o = [];
    const pg = 1 + (this._tcycle = (this._tcycle || 0) + 1) % 3;
    for (const c of cs) { o = o.concat(await this.pools(c, "trending_pools?page=1", "trending")); o = o.concat(await this.pools(c, `pools?page=${pg}&sort=h24_volume_usd_desc`, "trending")) }
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
  _sec: {},
  // one GoPlus call for many EVM tokens (it accepts a comma-separated list): turns 16 calls into 1
  async prefetchSecurity(cands) {
    const by = {}; for (const c of cands) if (c.chain !== "solana" && GP_CHAIN[c.chain] && !this._sec[c.chain + ":" + c.addr.toLowerCase()]) (by[c.chain] = by[c.chain] || []).push(c.addr.toLowerCase());
    for (const [ch, addrs] of Object.entries(by)) for (let i = 0; i < addrs.length; i += 25) {
      const part = addrs.slice(i, i + 25), d = await getJSON(`https://api.gopluslabs.io/api/v1/token_security/${GP_CHAIN[ch]}?contract_addresses=${part.join(",")}`), res = (d && d.result) || {};
      for (const a of part) { const r = res[a]; if (!r) continue; const sd = parseGoPlusEvm(r); if (!(sd.honeypot == null && sd.sellTax == null && sd.holders == null)) this._sec[ch + ":" + a] = { t: Date.now(), sd } }
    }
  },
  async security(chain, addr) {
    { const k = this._sec[chain + ":" + addr.toLowerCase()]; if (k && Date.now() - k.t < 120000) return k.sd }
    if (chain === "solana") {
      const d = await getJSON(`https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${addr}`);
      const r = d && d.result && d.result[addr]; if (!r) return null; const sd = parseGoPlusSol(r); return sd.mintable == null && sd.holders == null ? null : sd;
    }
    const cid = GP_CHAIN[chain]; if (!cid) return null;
    const lc = addr.toLowerCase(), d = await getJSON(`https://api.gopluslabs.io/api/v1/token_security/${cid}?contract_addresses=${lc}`);
    const r = d && d.result && d.result[lc]; if (!r) return null; const sd = parseGoPlusEvm(r); return sd.honeypot == null && sd.sellTax == null && sd.holders == null ? null : sd;   // empty report = not indexed yet
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
  async discoverNew(chains) { this.advance(); const now0 = vnow; return Object.values(this.toks).filter(t => !t.est && !t.dead && now0 - t.created < 86400 && t.visibleAt <= now0 && chains.includes(t.chain)).sort((a, b) => b.created - a.created).map(t => ({ chain: t.chain, addr: t.addr, source: "new", snap: this.snap(t) })) },
  async discoverTrending(chains) { this.advance(); return Object.values(this.toks).filter(t => !t.dead && t.visibleAt <= vnow && chains.includes(t.chain)).map(t => this.snap(t)).filter(s => s.vol1h > 0).sort((a, b) => b.vol1h * (b.chg1h > 0 ? 1 : 0.3) - a.vol1h * (a.chg1h > 0 ? 1 : 0.3)).map(s => ({ chain: s.chain, addr: s.addr, source: "trending", snap: s })) },
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

/* ============================ Core sleeve: BTC / ETH / SOL trend following + idle-cash yield ============================
 * The research (reports/Profitable crypto strategies for small accounts.md) found that slow, volatility-sized trend following on the big,
 * liquid coins is one of the few approaches with published after-cost evidence, mainly because it steps aside in long bear markets.
 * Rules (kept simple on purpose, so they are hard to over-fit):
 *   - signal per coin = share of {10, 20, 50}-day moving averages that the price is above (0, 1/3, 2/3 or 1)
 *   - size = signal x min(1, 35% target volatility / the coin's 20-day volatility), split evenly across the 3 coins
 *   - looked at every 3 days; only trades when the target moved by more than 35% of a slot (fewer trades = lower costs)
 *   - every trade pays 0.3% fee + 0.05% slippage; cash not in coins earns a stablecoin-lending yield (default 3%/yr, Aave-style)
 * It lives in its own sub-account so its swings never trip the memecoin kill switches, and it never touches memecoin cash after setup.
 * Honest expectation: a few % a month in good trends, flat or small losses in choppy markets. It does not get rich quick.
 */
CFG.core = { cashYield: true, on: true, share: 0.4, lookbacks: [10, 20, 50], volTarget: 0.3, fee: 0.3, slip: 0.05, checkH: 72, band: 0.35, yieldApr: 3, ids: ["bitcoin", "ethereum", "solana"] };
const CORE_SYM = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL" };
const coreValue = () => { const c = S && S.core; if (!c) return 0; let v = c.cash; for (const id in c.qty) v += c.qty[id] * (c.px[id] || 0); return v };
const totalEquity = () => equity() + coreValue();
const totalStart = () => S.pf.start + (S.core ? S.core.start : 0);
function coreInit(t) {
  if (S.core || !CFG.core.on) return;
  const pf = S.pf, amt = Math.floor(Math.max(0, pf.cash * CFG.core.share)); if (amt < 50) return;
  pf.cash -= amt; pf.start -= amt; pf.peak = Math.max(0, pf.peak - amt); pf.dayStart = Math.max(0, pf.dayStart - amt);
  S.core = { cash: amt, start: amt, qty: {}, px: {}, hist: {}, fees: 0, lastCheck: 0, lastPx: 0, lastYield: t, yieldEarned: 0, trades: [], sig: {}, vol: {}, why: "" };
  ev("info", "core_on", "CORE", `core sleeve opened with ${fmt(amt, 0)} (BTC/ETH/SOL trend + cash yield)`);
}
function coreOff() {
  const c = S.core; if (!c) return; for (const id in c.qty) coreTrade(id, -c.qty[id] * (c.px[id] || 0), now(), "core sleeve switched off");
  const pf = S.pf; pf.cash += c.cash; pf.start += c.start; pf.peak += c.cash; pf.dayStart += c.cash; delete S.core; save();
}
/* ---- prices: live from CoinGecko (daily history once, then spot), demo from a regime-switching simulator with its own random stream ---- */
const CSIM = { r: null, px: null, d: null, f: null, t: 0, vol: { bitcoin: 0.55, ethereum: 0.7, solana: 0.9 } };
function csimStep(hours) {
  if (!CSIM.r) { CSIM.r = mulberry((SEED || 1) * 7 + 13); CSIM.px = { bitcoin: 60000, ethereum: 3000, solana: 140 }; CSIM.d = 0 }
  const g = () => { let u = 0, v = 0; while (!u) u = CSIM.r(); v = CSIM.r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) };
  for (let h = 0; h < hours; h++) {
    if (CSIM.r() < 1 / (24 * 25)) CSIM.d = g() * 0.6;                       // market trend regime: lasts ~25 days, annual drift ~N(0, 60%) -> zero on average
    const m = g();
    for (const id of CFG.core.ids) { const s = CSIM.vol[id] / Math.sqrt(8760), beta = id === "bitcoin" ? 1 : id === "ethereum" ? 1.2 : 1.5;
      CSIM.px[id] *= Math.exp(CSIM.d * beta / 8760 - s * s / 2 + s * (0.75 * m + 0.66 * g())) }
  }
}
async function coreQuotes(t) {
  const c = S.core;
  if (MODE === "live") {
    for (const id of CFG.core.ids) if (!c.hist[id] || c.hist[id].length < 55 || (c.histAt || 0) < t - 7 * 86400) {
      const d = await getJSON(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=120&interval=daily`);
      if (d && Array.isArray(d.prices) && d.prices.length > 55) { c.hist[id] = d.prices.slice(-120).map(p => [Math.floor(p[0] / 86400000), +p[1]]); c.histAt = t }
    }
    const q = await getJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${CFG.core.ids.join(",")}&vs_currencies=usd`);
    if (q) for (const id of CFG.core.ids) if (q[id] && q[id].usd > 0) c.px[id] = +q[id].usd;
  } else {
    if (!CSIM.r || !c.hist.bitcoin) { CSIM.r = null; csimStep(1); for (const id of CFG.core.ids) c.hist[id] = []; const day0 = Math.floor(t / 86400) - 120;
      for (let d = 0; d < 120; d++) { csimStep(24); for (const id of CFG.core.ids) c.hist[id].push([day0 + d, CSIM.px[id]]) } CSIM.t = t }
    const h = Math.floor((t - CSIM.t) / 3600); if (h > 0) { csimStep(h); CSIM.t += h * 3600 }
    for (const id of CFG.core.ids) c.px[id] = CSIM.px[id];
  }
  const day = Math.floor(t / 86400);
  for (const id of CFG.core.ids) { const H = c.hist[id]; if (!H || !(c.px[id] > 0)) continue; if (H.length && H[H.length - 1][0] === day) H[H.length - 1][1] = c.px[id]; else { H.push([day, c.px[id]]); if (H.length > 130) H.shift() } }
}
function coreSignal(id) {
  const c = S.core, H = c.hist[id]; if (!H || H.length < 55 || !(c.px[id] > 0)) return null;
  const cl = H.map(x => x[1]), p = c.px[id]; let s = 0;
  for (const L of CFG.core.lookbacks) { const w = cl.slice(-L), ma = w.reduce((a, b) => a + b, 0) / w.length; if (p > ma) s++ }
  const r = []; for (let i = cl.length - 20; i < cl.length; i++) r.push(Math.log(cl[i] / cl[i - 1]));
  const mu = r.reduce((a, b) => a + b, 0) / r.length, vol = Math.sqrt(r.reduce((a, b) => a + (b - mu) ** 2, 0) / (r.length - 1) * 365) || 1;
  return { sig: s / CFG.core.lookbacks.length, vol };
}
function coreTrade(id, usd, t, why) {
  const c = S.core, px = c.px[id]; if (!(px > 0) || Math.abs(usd) < 5) return;
  const cost = Math.abs(usd) * (CFG.core.fee + CFG.core.slip) / 100;
  if (usd > 0) { usd = Math.min(usd, c.cash - cost); if (usd < 5) return; c.cash -= usd + cost; c.qty[id] = (c.qty[id] || 0) + usd / px }
  else { const q = Math.min(c.qty[id] || 0, -usd / px); if (q <= 0) return; c.qty[id] -= q; c.cash += q * px - cost; if (c.qty[id] * px < 1) delete c.qty[id] }
  c.fees += cost; c.trades.unshift({ t, sym: CORE_SYM[id], side: usd > 0 ? "buy" : "sell", usd: Math.abs(usd), px, why }); if (c.trades.length > 100) c.trades.length = 100;
  ev("info", "core_" + (usd > 0 ? "buy" : "sell"), CORE_SYM[id], `${why}: ${usd > 0 ? "buy" : "sell"} ${fmt(Math.abs(usd), 0)} @ ${px.toPrecision(5)}`);
}
// idle trading cash earns a stablecoin-lending rate too (Aave-style, about 2-5% a year): small, but money is never just sitting still
function cashYield(t) { const pf = S.pf; if (!CFG.core.cashYield) { pf.lastYield = t; return } const dt = Math.max(0, t - (pf.lastYield || t)); pf.lastYield = t; if (dt <= 0 || dt > 7 * 86400 || pf.cash <= 0) return;
  const y = pf.cash * CFG.core.yieldApr / 100 * dt / (365 * 86400); pf.cash += y; pf.realized += y; pf.yieldEarned = (pf.yieldEarned || 0) + y; dayAdd(y, t) }
async function coreStep(t) {
  cashYield(t);
  if (!CFG.core.on) { if (S.core) coreOff(); return } coreInit(t); const c = S.core; if (!c) return;
  if (t - (c.lastPx || 0) < (MODE === "live" ? 600 : 3600)) return; c.lastPx = t;
  // stablecoin-lending yield on the sleeve's idle cash
  const dt = Math.max(0, t - (c.lastYield || t)); if (dt > 0) { const y = c.cash * CFG.core.yieldApr / 100 * dt / (365 * 86400); c.cash += y; c.yieldEarned += y; c.lastYield = t }
  await coreQuotes(t);
  if (t - (c.lastCheck || 0) < CFG.core.checkH * 3600) return;
  const tot = coreValue(), n = CFG.core.ids.length; let traded = false;
  for (const id of CFG.core.ids) {
    const s = coreSignal(id); if (!s) { c.why = "waiting for price history"; continue }
    c.sig[id] = s.sig; c.vol[id] = s.vol;
    const target = tot / n * s.sig * Math.min(1, CFG.core.volTarget / s.vol), cur = (c.qty[id] || 0) * c.px[id], diff = target - cur;
    if ((s.sig === 0 && cur > 1) || Math.abs(diff) > CFG.core.band * tot / n) { coreTrade(id, diff, t, s.sig === 0 ? "trend down: step aside" : `trend ${Math.round(s.sig * 3)}/3, vol ${(s.vol * 100).toFixed(0)}%`); traded = true }
  }
  c.lastCheck = t; c.why = traded ? "rebalanced" : "holding (no change needed)"; save();
}

const P=()=>MODE==="mock"?MOCK:LIVE;
/* ============================ engine ============================ */
const due=(n,every,t)=>{if(t-(last[n]||0)>=every){last[n]=t;return true}return false};
function roll(t){const d=new Date(t*1000).toISOString().slice(0,10);if(d!==S.pf.day){S.pf.day=d;S.pf.dayStart=equity()}if(S.core&&d!==S.core.day){S.core.day=d;S.core.dayStart=coreValue()}}
async function updateRegime(t){let m=await P().majors();if(!m&&CFG.lenient.regime&&uniMedian!=null)m={universe:uniMedian};const r=regimeOf(m);
  if(r!=="unknown"){regimeOk=t;if(r!==regime)ev(r==="ok"?"info":"warn","regime","",`market ${regime} → ${r}`);regime=r}
  if(regime==="crash")for(const p of Object.values(S.pf.positions))p.emergency=p.emergency||"market crash"}
function safety(t){const pf=S.pf;let why="";
  if(pf.shutdown&&CFG.autoRearmMin>0&&LS.get("pt_kill_"+MODE)!=="1"&&t-(pf.shutAt||t)>=CFG.autoRearmMin*60){pf.shutdown=false;pf.why="";pf.peak=equity();pf.streak=0;ev("warn","auto_rearm","","Shutdown cleared automatically after "+CFG.autoRearmMin+" minutes (paper mode); drawdown measured from here")}if(LS.get("pt_kill_"+MODE)==="1")why="manual emergency stop";if(!why)why=shutdownReason();
  if(why&&!pf.shutdown){pf.shutdown=true;pf.why=why;pf.shutAt=t;ev("crit","shutdown","","EMERGENCY SHUTDOWN: "+why+" · flattening all positions")}
  if(pf.shutdown)for(const p of Object.values(pf.positions))p.emergency=p.emergency||"shutdown: "+pf.why}
/* Two-stage scan. Stage 1 judges EVERY discovered token locally from the feed's own numbers (no network, thousands per second).
   Stage 2 (network: fresh price, security report) runs only for the few that survive. */
async function scan(source,t){FILL=CFG.keep.on&&Object.keys(S.pf.positions).length<CFG.keep.target;const prov=P(),cands=source==="new"?await prov.discoverNew(CFG.chains):await prov.discoverTrending(CFG.chains),seen=new Set(),pass=[],w=stats.rejWhy||(stats.rejWhy={});
  for(const c of cands){const k=c.chain+":"+c.addr.toLowerCase();if(seen.has(k)||S.pf.positions[k]||(rejected[k]||0)>t)continue;seen.add(k);stats.scanned++;{const U=stats.uniqSet||(stats.uniqSet={});if(!U[k]&&stats.uniq<50000){U[k]=1;stats.uniq=(stats.uniq||0)+1}}
    const s=c.snap;if(s&&s.price>0){const pk=pickAll(s,t,source);
      if(!pk.hits.length){const y=pk.why.replace(/\d+(\.\d+)?(?![\dh])/g,"#").slice(0,34);w[y]=(w[y]||0)+1;rejected[k]=t+(pk.why==="too young"?CFG.quickYoungSec:CFG.quickRejectSec);continue}c.agent=pk.hits[0].agent.id;c.core=pk.hits.some(h=>!h.agent.swarm)}
    pass.push(c)}
  if(pass.length){const g=globalBlock(t);if(g){const V=stats.vwhy||(stats.vwhy={});V[g]=(V[g]||0)+1;stats.gated=(stats.gated||0)+pass.length;stats.strat+=pass.length;pass.length=0}}
  {const ch=cands.map(c=>c.snap).filter(s=>s&&s.liq>=30000&&isFinite(s.chg1h)).map(s=>s.chg1h).sort((a,b)=>a-b);if(ch.length>=8)uniMedian=ch[ch.length>>1]}
  {const a=pass.filter(c=>c.core!==false),b=pass.filter(c=>c.core===false);pass.length=0;pass.push(...a,...b.slice(0,Math.max(0,CFG.deepPerScan-a.length,Math.min(10,b.length))))}   // coins a real agent likes go first; scout-only coins get the leftover deep-check slots
  pass.length=Math.min(pass.length,CFG.deepPerScan+10);
  if(prov.prefetchSecurity&&pass.length)await prov.prefetchSecurity(pass);
  const byChain={};for(const c of pass)(byChain[c.chain]=byChain[c.chain]||[]).push(c.addr);const fresh={};
  for(const ch in byChain){const r=await prov.snapshots(ch,byChain[ch]);for(const a in r)fresh[ch+":"+a]=r[a]}
  for(const c of pass){if(S.pf.shutdown)break;const k=c.chain+":"+c.addr.toLowerCase(),snap=fresh[k]||c.snap;if(fresh[k]&&c.snap&&c.snap.buyers1h!=null){fresh[k].buyers1h=c.snap.buyers1h;fresh[k].sellers1h=c.snap.sellers1h}if(!snap||snap.price<=0)continue;await evaluate(k,snap,source,now(),c.agent)}
  const h=stats.hist||(stats.hist=[]);const rt=Date.now()/1000;h.push([rt,stats.scanned]);while(h.length>60||(h.length>2&&rt-h[0][0]>20))h.shift()}
function scanRate(){const h=stats.hist;if(!h||h.length<2)return 0;const a=h[0],b=h[h.length-1];return b[0]>a[0]?(b[1]-a[1])/(b[0]-a[0]):0}
const SCAM=SCAM_KINDS;
function truthOf(snap){if(MODE!=="mock")return null;const t=MOCK.toks[snap.addr.toLowerCase()];return t?t.kind:null}
function feedAdd(snap,src,outcome,detail,extra){const k=snap.chain+":"+snap.addr.toLowerCase(),tr=truthOf(snap);
  if(tr&&!stats.seen[k]){stats.seen[k]=1;if(SCAM.has(tr))stats.scamSeen++;else if(tr==="dead")stats.junkSeen++}
  S.feed.unshift(Object.assign({t:now(),sym:snap.sym,chain:snap.chain,src,outcome,detail,truth:tr},extra||{}));if(S.feed.length>80)S.feed.length=80}
function reject(k,snap,src,why,min,stage,extra){rejected[k]=now()+60*(min||(src==="new"?CFG.rejectNewMin:CFG.rejectTrendMin));feedAdd(snap,src,stage||"strategy",why,extra)}
async function evaluate(k,snap,src,t,agentId){
  const pk=pickAll(snap,t,src);
  if(!pk.hits.length)return reject(k,snap,src,pk.why,pk.why==="too young"?3:null);
  let hits=pk.hits;
  if(hits.some(h=>h.agent.id==="trend")){const bo=await P().breakout(snap);hits=hits.map(h=>{if(h.agent.id!=="trend")return h;const [pl]=h.agent.run(snap,t,bo);return pl?{agent:h.agent,plan:pl}:null}).filter(Boolean);if(!hits.length)return reject(k,snap,src,"no breakout confirmed")}
  for(const h of hits)h.plan=quickPlan(h.plan,h.agent.id);
  stats.strat++;
  let plan=hits[0].plan;
  let sec=await P().security(snap.chain,snap.addr);
  if(!sec)stats.secNull=(stats.secNull||0)+1;else stats.secOk=(stats.secOk||0)+1;
  if(!sec&&CFG.lenient.sec&&(stats.secNull||0)>=5&&(stats.secNull||0)>9*(stats.secOk||0))sec=UNVERIFIED;   // source is down: keep trading small, on market-structure checks only
  if(!sec)return reject(k,snap,src,"security report not available yet (retrying soon, fail closed)",2,"security",{checks:[["security_data_available",false]],score:plan.score});
  const v=evalSecurity(sec,snap,src,t);
  if(!v.pass){const W=stats.secWhy||(stats.secWhy={});for(const f of v.fails)W[f]=(W[f]||0)+1}
  if(!v.pass)return reject(k,snap,src,"failed: "+v.fails.join(", "),CFG.rejectMin*4,"security",{checks:v.checks,score:plan.score,risk:v.risk});
  stats.sec++;
  // learning phase: every unproven agent that likes this coin takes a virtual trade (many agents study one coin at once); only proven agents trade real money
  const proven=[];for(const h of hits){const pr=agentProven(h.agent.id),pb=!pr&&(agentProbation(h.agent.id)||agentExploring(h.agent.id,t));if(pr||pb){h.prob=pb;proven.push(h)}if(!pr)shadowOpen(snap,h,t)}
  if(!proven.length){feedAdd(snap,src,"learning",hits.map(h=>h.agent.name).join(", ")+" studying this coin with a virtual trade (no money yet)",{checks:v.checks,score:plan.score,risk:v.risk});rejected[k]=t+90;return}
  proven.sort((a,b)=>b.plan.score*agentWeight(b.agent.id)-a.plan.score*agentWeight(a.agent.id));
  const ag=proven[0].agent;plan=proven[0].plan;const cat=ag.cat;
  const com=reviewers(snap,cat);
  if(com.ok<CFG.committeeMin){stats.vetoed++;const nm=com.list.filter(x=>!x[1]).map(x=>x[0]).join(", ");{const w="committee: "+nm;(stats.vwhy||(stats.vwhy={}))[w]=((stats.vwhy||{})[w]||0)+1}feedAdd(snap,src,"vetoed","committee approved "+com.ok+"/5 (failed: "+nm+")",{checks:v.checks,score:plan.score,risk:v.risk});rejected[k]=t+60;return}
  {const lp=CFG.lessons.on?lessonPred(lessonFx(snap,t,ag)):null;if(lp!=null&&lp<CFG.lessons.minPred){stats.vetoed++;stats.lessonVeto=(stats.lessonVeto||0)+1;S.lessonVetoes=(S.lessonVetoes||0)+1;{const w="lessons: similar trades lost";(stats.vwhy||(stats.vwhy={}))[w]=((stats.vwhy||{})[w]||0)+1}feedAdd(snap,src,"vetoed","lessons from past trades: setups like this averaged "+lp.toFixed(2)+"R, skipped",{checks:v.checks,score:plan.score,risk:v.risk});rejected[k]=t+600;return}}
  const d=approve(snap,cat,v.risk,plan,t,ag.id);
  if(!d.ok){stats.vetoed++;{const w=d.why.replace(/[0-9.]+/g,"#").slice(0,50);(stats.vwhy||(stats.vwhy={}))[w]=((stats.vwhy||{})[w]||0)+1}feedAdd(snap,src,"vetoed",d.why,{checks:v.checks,score:plan.score,risk:v.risk});if(d.why!=="re-entry cooldown")rejected[k]=t+(CFG.keep.on?5:300);return}
  open(snap,cat,plan,v.risk,sec,d.usd*(v.unverified?0.5:1)*(0.6+0.1*com.ok)*(proven[0].prob?0.4:1)*(ag.swarm?0.5:1),t,v.checks,ag.id)}
function open(snap,cat,plan,risk,sec,usd,t,checks,agentId){const pf=S.pf,k=snap.chain+":"+snap.addr.toLowerCase(),f=simBuy(snap,usd,sec.buyTax||0,cat==="new");
  const tr={t,side:"buy",sym:snap.sym,chain:snap.chain,cat,ok:f.ok,note:f.why,usd:f.usd||0,px:f.px||0,slip:f.slip,fee:f.fee,gas:f.gas};
  if(!f.ok){pf.cash-=f.gas;pf.realized-=f.gas;pf.feesPaid+=f.gas;pf.cool[k]=t+(CFG.keep.on?0:900);pf.exec.failed++;S.trades.unshift(tr);feedAdd(snap,cat,"failed","tx failed: "+f.why,{checks,score:plan.score,risk});ev("warn","buy_failed",snap.sym,f.why);return save()}
  pf.cash-=f.usd+f.gas;pf.feesPaid+=f.fee+f.gas;pf.entries.push(t);pf.exec.buys++;pf.exec.slipSum+=f.slip;pf.exec.slipN++;if(f.mev)pf.exec.mev++;pf.entries=pf.entries.filter(x=>t-x<86400);
  S.lastOpenAt=t;pf.positions[k]={agent:agentId||"launch",scout:FILL,id:snap.sym+"-"+Math.floor(t),chain:snap.chain,addr:snap.addr,sym:snap.sym,cat,opened:t,entry:snap.price,qty:f.qty,qty0:f.qty,cost:f.usd+f.gas,
    stop:snap.price*(1-plan.stop/100),tp1:snap.price*(1+plan.tp1/100),tp2:snap.price*(1+plan.tp2/100),trail:plan.trail,peak:snap.price,last:snap.price,entryLiq:snap.liq,lastLiq:snap.liq,
    size0:f.usd,truth:truthOf(snap),why:plan.reason,score:plan.score,risk:risk,chk:t,sellTax:sec.sellTax??3,tp1Done:false,tp2Done:false,real:0,fees:f.fee+f.gas,stale:0,attempts:0,emergency:"",risk0:f.usd*plan.stop/100,pair:snap.pair,fx:lessonFx(snap,t,AG[agentId])};
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
  if(p.cost>1e-6){const l=recovered-p.cost;pf.realized+=l;p.real+=l;dayAdd(l,t)}delete pf.positions[k];pf.cool[k]=t+(CFG.keep.on?CFG.keep.reentrySec:CFG.risk.cooldownH*3600);
  {const A=pf.ag||(pf.ag={}),a=A[p.agent||"launch"]||(A[p.agent||"launch"]={n:0,pnl:0,w:0,r:0});a.n++;a.pnl+=p.real;a.w+=p.real>0?1:0;a.r+=(p.risk0?p.real/p.risk0:0)}
  pf.streak=p.real>0?0:pf.streak+1;if(pf.streak>=CFG.risk.streakPause){if(!CFG.keep.on)pf.pauseUntil=t+CFG.risk.pauseMin*60;ev("warn","pause",p.sym,pf.streak+" losses in a row: entries paused")}
  const r=p.risk0?p.real/p.risk0:0;lessonAdd(p.fx,r);{const T=pf.tot||(pf.tot={w:0,wn:0,l:0,ln:0});if(p.real>0){T.w+=p.real;T.wn++}else{T.l+=p.real;T.ln++}}pf.closed.push({agent:p.agent,sym:p.sym,chain:p.chain,cat:p.cat,pnl:p.real,r,reason,held:(t-p.opened)/3600,t,size:p.size0,truth:p.truth});if(pf.closed.length>500)pf.closed.shift();
  ev("info","closed",p.sym,`${reason}: total ${p.real>=0?"+":""}${p.real.toFixed(2)} (${r.toFixed(2)}R)`);save()}
function emergencyReason(p,s,pp,pl){const e=CFG.em;
  if(s.liq<p.entryLiq*(1-e.liqTotal))return`liquidity down ${(100*(1-s.liq/p.entryLiq)).toFixed(0)}% vs entry`;
  if(pl>0&&s.liq<pl*(1-e.liqStep))return"liquidity pulled";if(pp>0&&s.price<pp*(1-e.priceStep))return`flash crash ${(100*(1-s.price/pp)).toFixed(0)}% in one interval`;
  if(s.buys1h>=20&&s.sells1h===0)return"buys-only flow (honeypot signature)";if(s.sells1h>=40&&s.buys1h*4<s.sells1h&&s.chg5m<-10)return"heavy one-sided selling";return""}
function adjustStop(p,s){const old=p.stop,be=p.entry*1.01;
  if(p.tp1Done)p.stop=Math.max(p.stop,be,p.peak*(1-p.trail/100));else if(s.price>=p.entry*(1+(p.tp1/p.entry-1)/2))p.stop=Math.max(p.stop,be);
  if(regime==="danger"&&s.price>p.entry)p.stop=Math.max(p.stop,s.price*0.96);if(p.stop>old*1.0001)ev("info","stop_raised",p.sym,`${old.toPrecision(4)} → ${p.stop.toPrecision(4)}`)}
async function monitor(t){const pf=S.pf,ps=Object.values(pf.positions),shs=Object.values(S.shadow||{});if(!ps.length&&!shs.length)return;const byChain={},snaps={};for(const p of ps)(byChain[p.chain]=byChain[p.chain]||[]).push(p.addr);for(const x of shs){const L=(byChain[x.chain]=byChain[x.chain]||[]);if(!L.includes(x.addr))L.push(x.addr)}
  for(const ch in byChain){const r=await P().snapshots(ch,byChain[ch]);for(const a in r)snaps[ch+":"+a]=r[a]}
  shadowUpdate(snaps,t);
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
    else if(held>=maxHold&&!p.tp1Done)sellPos(p,s,1,"time_stop",false,t)
    else if(CFG.keep.on&&held>=1.5&&!p.tp1Done&&Math.abs(px/p.entry-1)<0.03)sellPos(p,s,1,"stagnant",false,t)}
  save()}
async function recheck(t){const ps=Object.values(S.pf.positions).filter(p=>!p.emergency).sort((a,b)=>(a.chk||0)-(b.chk||0)).slice(0,4);
  for(const p of ps){p.chk=t;const sec=await P().security(p.chain,p.addr);if(!sec||!S.pf.positions[p.chain+":"+p.addr.toLowerCase()])continue;
    const snap={chain:p.chain,addr:p.addr,liq:p.lastLiq,price:p.last,buys1h:0,sells1h:0,vol24:0,chg1h:0,chg5m:0,created:t-86400*30},v=evalSecurity(sec,snap,"trending",t);
    const soft=["holders","liquidity","no_wash","top10","lp_locked"],bad=v.fails.filter(f=>!soft.includes(f));
    if(bad.length){p.emergency="security recheck failed: "+bad.join(",");ev("crit","emergency",p.sym,p.emergency)}p.sellTax=sec.sellTax??p.sellTax}}

/* watchdog: if setups keep matching but nothing is ever bought, loosen one notch at a time so the bot cannot sit idle forever */
let wdStart=0,wdLast=0;
function watchdog(t){if(!CFG.watchdog)return;if(!wdStart){wdStart=t;wdLast=t;return}if(S.pf.shutdown||paused)return;if(stats.bought>0||stats.strat<30)return;
  if(t-wdLast<600)return;wdLast=t;
  if(CFG.secMode==="strict"){applySecMode("balanced");ev("warn","auto_relax","","No trades after 10 minutes of setup matches: security strictness lowered to Balanced")}
  else if(!CFG.lenient.sec||!CFG.lenient.regime){CFG.lenient.sec=true;CFG.lenient.regime=true;ev("warn","auto_relax","","No trades yet: now trading on market-structure checks when security or market data is missing")}
  else if(CFG.secMode==="balanced"&&!CFG.wdSafe){applySecMode("loose");ev("warn","auto_relax","","Still no trades: security strictness lowered to Loose")}
  else if(CFG.risk.maxRisk<95&&!CFG.wdSafe){CFG.risk.maxRisk=95;CFG.risk.maxCostPct=8;ev("warn","auto_relax","","Still no trades: risk-score and cost limits widened")}}
/* three independent loops so prices never wait on scanning */
let busySAt=0,busy=false,busyF=false,busyL=false,busyS=false,scanning=false;
const guard=async(fn)=>{try{await fn()}catch(e){ev("warn","error","",String(e&&e.message||e))}};
async function stepFast(t){if(busyF)return;busyF=true;await guard(async()=>{roll(t);safety(t);if(due("monitor",CFG.monitorEvery,t)){await monitor(t);if(MODE==="live")LS.set("pt_last_live",Math.floor(t))}
  if(due("equity",CFG.equityEvery,t)){S.curve.push([t,totalEquity()]);if(S.curve.length>4000)S.curve.shift();save()}});busyF=false}
async function stepSlow(t){if(busyL)return;busyL=true;await guard(async()=>{watchdog(t);if(due("regime",regime==="unknown"?15:CFG.regimeEvery,t))await updateRegime(t);
  if(Object.keys(S.pf.positions).length&&due("recheck",30,t))await recheck(t);await coreStep(t)});busyL=false}
async function stepScan(t){if(paused||S.pf.shutdown)return;if(busyS){if(Date.now()-(busySAt||0)<300e3)return;ev("warn","error","","a scan was stuck for 5 minutes and was restarted")}busyS=true;busySAt=Date.now();scanning=true;await guard(async()=>{if(due("new",CFG.newEvery,t))await scan("new",now());if(due("trend",CFG.trendEvery,t))await scan("trending",now())});busyS=false;scanning=false}
async function tick(){if(busy)return;busy=true;try{const t=now();await stepFast(t);await stepSlow(t);await stepScan(t)}finally{busy=false}}


