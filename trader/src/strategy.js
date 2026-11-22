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

