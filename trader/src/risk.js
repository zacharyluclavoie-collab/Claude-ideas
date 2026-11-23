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

