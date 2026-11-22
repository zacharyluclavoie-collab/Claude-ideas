/* ============================ config (mirrors paper_trader/config.py) ============================ */
const CFG = {
  chains:["solana","base","ethereum","bsc"],
  tick:5, monitorEvery:10, newEvery:30, trendEvery:120, recheckEvery:300, regimeEvery:120, equityEvery:300,
  maxCands:16, rejectMin:45, rejectNewMin:8, rejectTrendMin:20,
  risk:{perTradePct:0.5, posTrend:2, posNew:1, totalExp:40, newExp:20, chainExp:20, cashReserve:20, maxPos:100,
        liqFrac:0.006, minTrade:15, dailyLoss:3, maxDD:12, maxTotalLoss:20, streakPause:3, pauseMin:60,
        perHour:30, perDay:150, cooldownH:12, maxRisk:65, riskFull:35, minRR:1.5, maxCostPct:3},
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


/* activity levels: how much the bot is willing to trade. Measured in the demo market (12 markets x 5 days): trades per market-day and return per day */
const ACTIVITY = {
  selective: { name: "Selective", note: "about 3 trades a day, about -0.1% a day in testing", set() { CFG.risk.maxRisk = 45; CFG.risk.streakPause = 3 } },
  active: { name: "Active", note: "about 12 trades a day, about -0.3% a day in testing", set() { CFG.risk.maxRisk = 65; CFG.risk.streakPause = 4 } },
  max: { name: "Very active", note: "about 20 trades a day, about -0.6% a day in testing", set() { CFG.risk.maxRisk = 80; CFG.risk.streakPause = 5; Object.assign(CFG.nw, { minScore: 50, minBP: 0.52, minTx: 30, minAgeMin: 5, minUniq: 0.4 }); CFG.rejectNewMin = 4; CFG.newEvery = 20 } },
};
let ACT = "active";
function applyActivity(k) { if (!ACTIVITY[k]) k = "active"; ACT = k; Object.assign(CFG.nw, { minScore: 60, minBP: 0.55, minTx: 50, minAgeMin: 10, minUniq: 0.5 }); CFG.rejectNewMin = 8; CFG.newEvery = 30; ACTIVITY[k].set() }
