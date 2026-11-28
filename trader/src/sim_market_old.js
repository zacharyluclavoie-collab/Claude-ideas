/* ---- synthetic market for the demo mode (hidden ground truth: legit, pump&dump, rug, honeypots) ---- */
const MOCK={toks:{},n:0,lastStep:0,crashUntil:0,major:{bitcoin:0,ethereum:0,solana:0},
  init(){this.toks={};this.n=0;this.lastStep=vnow;rng=mulberry(SEED);for(let i=0;i<40;i++)this.spawn(true);for(const t of Object.values(this.toks)){const n=Math.min(Math.floor((vnow-t.created)/60),1400);for(let i=0;i<n;i++)this.step(t,vnow-(n-i)*60)}},
  spawn(est){const chain=CFG.chains[Math.floor(rng()*CFG.chains.length)],n=++this.n,addr=chain==="solana"?"MOCK"+n:"0x"+n.toString(16).padStart(40,"0");let kind,age,liq;
    if(est){kind=["trend","trend","good","good","pumpdump"][Math.floor(rng()*5)];age=(100+rng()*800)*3600;liq=Math.exp(Math.log(150e3)+rng()*(Math.log(4e6)-Math.log(150e3)))}
    else{const r=rng();kind=r<0.3?"good":r<0.5?"pumpdump":r<0.62?"rug":r<0.72?"honeypot":r<0.78?"stealth":"dead";age=0;liq=Math.exp(Math.log(4e3)+rng()*(Math.log(2.5e5)-Math.log(4e3)))}
    const t={chain,addr,sym:"T"+n,kind,created:vnow-age,price:Math.pow(10,-6+rng()*6),liq,bv:liq*(0.15+rng()*1.05)/24,sigma:est?0.004:0.009,ev:(kind==="rug"||kind==="pumpdump")?(1.5+rng()*7.5)*3600:0,
      drift:0,until:0,boost:0,hist:[],rugged:false,est};if(est&&kind==="pumpdump")t.ev=(1+rng()*39)*3600+age;this.toks[addr.toLowerCase()]=t},
  step(t,ts){const age=ts-t.created;if(ts>=t.until){t.until=ts+(0.5+rng()*3.5)*3600;t.drift=(t.kind==="trend"||t.kind==="good")?[-0.0008,-0.0003,0,0.0003,0.0012][Math.floor(rng()*5)]:0;t.boost=Math.max(0,t.drift)*900+rng()*0.6-0.2}
    let ret=t.drift+gauss()*t.sigma;if(t.kind==="pumpdump"&&t.ev)ret=(age<t.ev?0.008:-0.012)+gauss()*t.sigma;if(t.kind==="dead")ret=-0.0004+gauss()*t.sigma*1.5;if(this.crashUntil>ts)ret-=0.0004;
    t.price=Math.max(t.price*(1+ret),1e-12);if(t.kind==="rug"&&!t.rugged&&age>=t.ev){t.rugged=true;t.liq*=0.03;t.price*=0.08}else if(!t.rugged)t.liq=Math.max(t.liq*(1+0.3*ret+gauss()*0.0005),1000);
    t.hist.push(t.price);if(t.hist.length>1500)t.hist.shift()},
  advance(){const steps=Math.min(Math.floor((vnow-this.lastStep)/60),30);if(steps<=0)return;for(let i=0;i<steps;i++){const ts=this.lastStep+(i+1)*60;for(const t of Object.values(this.toks))this.step(t,ts);
      if(rng()<0.25)this.spawn(false);if(rng()<1/6000)this.crashUntil=ts+3*3600}this.lastStep+=steps*60;
    for(const k of Object.keys(this.toks)){const t=this.toks[k];if(!t.est&&vnow-t.created>30*3600)delete this.toks[k]}
    const base=this.crashUntil>vnow?-9:0;for(const k in this.major)this.major[k]=base+gauss()*0.6},
  chg(t,secs){const k=Math.floor(secs/60);return t.hist.length<=k?0:(t.price/t.hist[t.hist.length-1-k]-1)*100},
  snap(t){const c1=this.chg(t,3600),c5=this.chg(t,300),b=clamp(0.52+c1/150+gauss()*0.03,0.2,0.85),v1=t.bv*(1+Math.max(0,t.boost)+Math.abs(c1)/20)*(t.rugged?0.4:1),tx=Math.max(5,Math.floor(v1/90));
    const buys=Math.floor(tx*b);let sells=tx-buys;if(t.kind==="honeypot")sells=Math.floor(sells*0.2);
    return{chain:t.chain,addr:t.addr,sym:t.sym,price:t.price,liq:t.liq,fdv:t.liq*12,vol5:v1/12,vol1h:v1,vol6:t.bv*7.2,vol24:t.bv*27.6,chg5m:c5,chg1h:c1,chg6h:this.chg(t,21600),chg24:this.chg(t,86400),buys1h:buys,sells1h:sells,pair:"pair-"+t.addr,created:t.created}},
  async discoverNew(){this.advance();return Object.values(this.toks).filter(t=>vnow-t.created<86400).sort((a,b)=>b.created-a.created).slice(0,40).map(t=>({chain:t.chain,addr:t.addr,source:"new",snap:this.snap(t)}))},
  async discoverTrending(){this.advance();return Object.values(this.toks).filter(t=>!t.rugged).map(t=>this.snap(t)).sort((a,b)=>b.vol1h/b.vol24-a.vol1h/a.vol24).slice(0,25).map(s=>({chain:s.chain,addr:s.addr,source:"trending",snap:s}))},
  async snapshots(chain,addrs){this.advance();const o={};for(const a of addrs){const t=this.toks[a.toLowerCase()];if(t)o[a.toLowerCase()]=this.snap(t)}return o},
  async breakout(s){const t=this.toks[s.addr.toLowerCase()];if(!t||t.hist.length<300)return null;return t.price>Math.max(...t.hist.slice(-1440,-60))},
  async majors(){this.advance();return{...this.major}},
  async security(chain,addr){const t=this.toks[addr.toLowerCase()];if(!t||rng()<0.02)return null;const bad=t.kind==="honeypot",ch=a=>a[Math.floor(rng()*a.length)];
    const sd={sol:chain==="solana",honeypot:bad,buyTax:ch([0,0,1,3]),sellTax:ch([0,0,1,3])+(bad?60:0),openSource:true,proxy:rng()<0.1,mintable:t.kind==="dead"&&rng()<0.5,hiddenOwner:false,takeBack:false,ownerBal:false,pausable:false,
      cannotSellAll:false,cooldown:rng()<0.05,blacklist:false,slipMod:false,selfdestruct:false,extCall:rng()<0.1,freezable:false,closable:false,nonTransferable:false,creatorHP:false,inDex:true,
      holders:Math.floor(t.kind==="dead"?10+rng()*110:60+rng()*2940),top10:t.kind==="rug"?30+rng()*40:12+rng()*26,creator:t.kind==="rug"?2+rng()*18:rng()*4,owner:rng()*3,lpLocked:t.kind==="rug"?ch([0,100,100]):85+rng()*15};
    if(t.rugged){sd.creator=40;sd.top10=80}if(t.kind==="good"&&rng()<0.15)sd.top10=46+rng()*24;return sd},
  blocked(chain,addr){const t=this.toks[addr.toLowerCase()];return!!(t&&t.kind==="stealth"&&vnow-t.created>1800)}
};
const P=()=>MODE==="mock"?MOCK:LIVE;

