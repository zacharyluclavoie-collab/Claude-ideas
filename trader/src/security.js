/* ============================ security (mirrors security.py) ============================ */
function evalSecurity(sec,snap,cat,t){
  const checks=[];const add=(n,ok)=>checks.push([n,!!ok,true]);
  if(!sec)return{pass:false,risk:100,fails:["security_data_available"],checks:[["security_data_available",false]]};
  const isNew=cat==="new",c=CFG.sec,f=(n,v)=>add(n,v===false);
  if(sec.unverified){add("security_unverified (source unreachable, small size)",true);add("liquidity",snap.liq>=(isNew?c.liqNew:c.liqTrend));add("sells_exist",!(snap.buys1h>=20&&snap.sells1h===0));add("no_wash",(snap.liq>0?snap.vol24/snap.liq:1e9)<=c.volLiq);add("no_vertical_pump",snap.chg1h<=1000&&snap.chg5m<=150);const fl=checks.filter(x=>!x[1]).map(x=>x[0]);return{pass:!fl.length,risk:Math.min(100,50+(isNew?15:0)),fails:fl,checks:checks.map(x=>[x[0],x[1]]),unverified:true}}
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

