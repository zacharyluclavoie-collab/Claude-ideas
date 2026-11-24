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
  flt:{minBuyers:0,minUniq:0},
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
const BUILD = "__BUILD__";

/* one-tap presets. "protect" is what the testing supports: small, selective, agents on probation until they prove a positive record */
function applyPreset(k) {
  CFG.wdSafe = false; CFG.flt.minBuyers = 0; CFG.flt.minUniq = 0;
  if (k === "recommended") { applyPreset("safe"); CFG.flt.minBuyers = 25; CFG.flt.minUniq = 0.4; return }   // research scam filters: ~12x fewer scam buys in testing at similar profit
  if (k === "easy") { applyPreset("safe"); CFG.flt.minBuyers = 25; CFG.flt.minUniq = 0.4; CFG.risk.perTradePct = 0.08; CFG.risk.posNew = 0.25; CFG.risk.posTrend = 0.4; CFG.risk.totalExp = 15; CFG.agentHourly = 3; CFG.risk.dailyLoss = 1; CFG.risk.maxDD = 4; return }
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
