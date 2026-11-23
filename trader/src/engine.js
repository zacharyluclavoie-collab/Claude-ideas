const P=()=>MODE==="mock"?MOCK:LIVE;
/* ============================ engine ============================ */
const due=(n,every,t)=>{if(t-(last[n]||0)>=every){last[n]=t;return true}return false};
function roll(t){const d=new Date(t*1000).toISOString().slice(0,10);if(d!==S.pf.day){S.pf.day=d;S.pf.dayStart=equity()}}
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
      if(!pk.hits.length){const y=pk.why.replace(/\d+(\.\d+)?(?![\dh])/g,"#").slice(0,34);w[y]=(w[y]||0)+1;rejected[k]=t+(pk.why==="too young"?CFG.quickYoungSec:CFG.quickRejectSec);continue}c.agent=pk.hits[0].agent.id}
    pass.push(c)}
  if(pass.length){const g=globalBlock(t);if(g){const V=stats.vwhy||(stats.vwhy={});V[g]=(V[g]||0)+1;stats.gated=(stats.gated||0)+pass.length;stats.strat+=pass.length;pass.length=0}}
  {const ch=cands.map(c=>c.snap).filter(s=>s&&s.liq>=30000&&isFinite(s.chg1h)).map(s=>s.chg1h).sort((a,b)=>a-b);if(ch.length>=8)uniMedian=ch[ch.length>>1]}
  pass.length=Math.min(pass.length,CFG.deepPerScan);
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
  const proven=[];for(const h of hits){const pr=agentProven(h.agent.id),pb=!pr&&agentProbation(h.agent.id);if(pr||pb){h.prob=pb;proven.push(h)}if(!pr)shadowOpen(snap,h,t)}
  if(!proven.length){feedAdd(snap,src,"learning",hits.map(h=>h.agent.name).join(", ")+" studying this coin with a virtual trade (no money yet)",{checks:v.checks,score:plan.score,risk:v.risk});rejected[k]=t+90;return}
  proven.sort((a,b)=>b.plan.score*agentWeight(b.agent.id)-a.plan.score*agentWeight(a.agent.id));
  const ag=proven[0].agent;plan=proven[0].plan;const cat=ag.cat;
  const com=reviewers(snap,cat);
  if(com.ok<3){stats.vetoed++;const nm=com.list.filter(x=>!x[1]).map(x=>x[0]).join(", ");{const w="committee: "+nm;(stats.vwhy||(stats.vwhy={}))[w]=((stats.vwhy||{})[w]||0)+1}feedAdd(snap,src,"vetoed","committee approved "+com.ok+"/5 (failed: "+nm+")",{checks:v.checks,score:plan.score,risk:v.risk});rejected[k]=t+60;return}
  const d=approve(snap,cat,v.risk,plan,t,ag.id);
  if(!d.ok){stats.vetoed++;{const w=d.why.replace(/[0-9.]+/g,"#").slice(0,50);(stats.vwhy||(stats.vwhy={}))[w]=((stats.vwhy||{})[w]||0)+1}feedAdd(snap,src,"vetoed",d.why,{checks:v.checks,score:plan.score,risk:v.risk});if(d.why!=="re-entry cooldown")rejected[k]=t+(CFG.keep.on?5:300);return}
  open(snap,cat,plan,v.risk,sec,d.usd*(v.unverified?0.5:1)*(0.6+0.1*com.ok)*(proven[0].prob?0.4:1),t,v.checks,ag.id)}
function open(snap,cat,plan,risk,sec,usd,t,checks,agentId){const pf=S.pf,k=snap.chain+":"+snap.addr.toLowerCase(),f=simBuy(snap,usd,sec.buyTax||0,cat==="new");
  const tr={t,side:"buy",sym:snap.sym,chain:snap.chain,cat,ok:f.ok,note:f.why,usd:f.usd||0,px:f.px||0,slip:f.slip,fee:f.fee,gas:f.gas};
  if(!f.ok){pf.cash-=f.gas;pf.realized-=f.gas;pf.feesPaid+=f.gas;pf.cool[k]=t+(CFG.keep.on?0:900);pf.exec.failed++;S.trades.unshift(tr);feedAdd(snap,cat,"failed","tx failed: "+f.why,{checks,score:plan.score,risk});ev("warn","buy_failed",snap.sym,f.why);return save()}
  pf.cash-=f.usd+f.gas;pf.feesPaid+=f.fee+f.gas;pf.entries.push(t);pf.exec.buys++;pf.exec.slipSum+=f.slip;pf.exec.slipN++;if(f.mev)pf.exec.mev++;pf.entries=pf.entries.filter(x=>t-x<86400);
  pf.positions[k]={agent:agentId||"launch",scout:FILL,id:snap.sym+"-"+Math.floor(t),chain:snap.chain,addr:snap.addr,sym:snap.sym,cat,opened:t,entry:snap.price,qty:f.qty,qty0:f.qty,cost:f.usd+f.gas,
    stop:snap.price*(1-plan.stop/100),tp1:snap.price*(1+plan.tp1/100),tp2:snap.price*(1+plan.tp2/100),trail:plan.trail,peak:snap.price,last:snap.price,entryLiq:snap.liq,lastLiq:snap.liq,
    size0:f.usd,truth:truthOf(snap),why:plan.reason,score:plan.score,risk:risk,chk:t,sellTax:sec.sellTax??3,tp1Done:false,tp2Done:false,real:0,fees:f.fee+f.gas,stale:0,attempts:0,emergency:"",risk0:f.usd*plan.stop/100,pair:snap.pair};
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
  const r=p.risk0?p.real/p.risk0:0;pf.closed.push({agent:p.agent,sym:p.sym,chain:p.chain,cat:p.cat,pnl:p.real,r,reason,held:(t-p.opened)/3600,t,size:p.size0,truth:p.truth});if(pf.closed.length>500)pf.closed.shift();
  ev("info","closed",p.sym,`${reason}: total ${p.real>=0?"+":""}${p.real.toFixed(2)} (${r.toFixed(2)}R)`);save()}
function emergencyReason(p,s,pp,pl){const e=CFG.em;
  if(s.liq<p.entryLiq*(1-e.liqTotal))return`liquidity down ${(100*(1-s.liq/p.entryLiq)).toFixed(0)}% vs entry`;
  if(pl>0&&s.liq<pl*(1-e.liqStep))return"liquidity pulled";if(pp>0&&s.price<pp*(1-e.priceStep))return`flash crash ${(100*(1-s.price/pp)).toFixed(0)}% in one interval`;
  if(s.buys1h>=20&&s.sells1h===0)return"buys-only flow (honeypot signature)";if(s.sells1h>=40&&s.buys1h*4<s.sells1h&&s.chg5m<-10)return"heavy one-sided selling";return""}
function adjustStop(p,s){const old=p.stop,be=p.entry*1.01;
  if(p.tp1Done)p.stop=Math.max(p.stop,be,p.peak*(1-p.trail/100));else if(s.price>=p.entry*(1+(p.tp1/p.entry-1)/2))p.stop=Math.max(p.stop,be);
  if(regime==="danger"&&s.price>p.entry)p.stop=Math.max(p.stop,s.price*0.96);if(p.stop>old*1.0001)ev("info","stop_raised",p.sym,`${old.toPrecision(4)} → ${p.stop.toPrecision(4)}`)}
async function monitor(t){const pf=S.pf,ps=Object.values(pf.positions),shs=Object.values(S.shadow||{});if(!ps.length&&!shs.length)return;const byChain={},snaps={};for(const p of ps)(byChain[p.chain]=byChain[p.chain]||[]).push(p.addr);for(const x of shs)(byChain[x.chain]=byChain[x.chain]||[]).push(x.addr);
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
  else if(CFG.secMode==="balanced"){applySecMode("loose");ev("warn","auto_relax","","Still no trades: security strictness lowered to Loose")}
  else if(CFG.risk.maxRisk<95){CFG.risk.maxRisk=95;CFG.risk.maxCostPct=8;ev("warn","auto_relax","","Still no trades: risk-score and cost limits widened")}}
/* three independent loops so prices never wait on scanning */
let busy=false,busyF=false,busyL=false,busyS=false,scanning=false;
const guard=async(fn)=>{try{await fn()}catch(e){ev("warn","error","",String(e&&e.message||e))}};
async function stepFast(t){if(busyF)return;busyF=true;await guard(async()=>{roll(t);safety(t);if(due("monitor",CFG.monitorEvery,t)){await monitor(t);if(MODE==="live")LS.set("pt_last_live",Math.floor(t))}
  if(due("equity",CFG.equityEvery,t)){S.curve.push([t,equity()]);if(S.curve.length>4000)S.curve.shift();save()}});busyF=false}
async function stepSlow(t){if(busyL)return;busyL=true;await guard(async()=>{watchdog(t);if(due("regime",regime==="unknown"?15:CFG.regimeEvery,t))await updateRegime(t);
  if(Object.keys(S.pf.positions).length&&due("recheck",30,t))await recheck(t)});busyL=false}
async function stepScan(t){if(busyS||paused||S.pf.shutdown)return;busyS=true;scanning=true;await guard(async()=>{if(due("new",CFG.newEvery,t))await scan("new",now());if(due("trend",CFG.trendEvery,t))await scan("trending",now())});busyS=false;scanning=false}
async function tick(){if(busy)return;busy=true;try{const t=now();await stepFast(t);await stepSlow(t);await stepScan(t)}finally{busy=false}}


