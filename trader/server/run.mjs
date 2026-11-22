// Always-on headless runner: the same engine as the app, running 24/7 on a computer or server.
//   node server/run.mjs                    live data, state in ./state/
//   node server/run.mjs --demo --speed 60  synthetic market (testing)
//   node server/run.mjs --port 8787 --token SECRET   change the status page port / require ?token=SECRET
// Open http://<machine>:8787/ on your phone to watch it. State survives restarts (state/state.json).
import fs from "node:fs";
import vm from "node:vm";
import http from "node:http";
import path from "node:path";
const dir = path.dirname(new URL(import.meta.url).pathname);
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf("--" + n); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) };
const DEMO = !!opt("demo", false), SPEED = +opt("speed", 60) || 60, PORT = +opt("port", 8787), TOKEN = opt("token", ""), STATE = path.resolve(opt("state", "state"));
fs.mkdirSync(STATE, { recursive: true });
const file = path.join(STATE, DEMO ? "demo.json" : "state.json");

// localStorage stand-in persisted to disk (the engine keeps its account, settings and kill switch there)
let store = {}; try { store = JSON.parse(fs.readFileSync(file, "utf8")) } catch (e) {}
let dirty = false; const flush = () => { if (dirty) { dirty = false; fs.writeFileSync(file + ".tmp", JSON.stringify(store)); fs.renameSync(file + ".tmp", file) } };
const localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); dirty = true }, removeItem: k => { delete store[k]; dirty = true } };
const ctx = vm.createContext({ console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON, performance, fetch, AbortController, URL, localStorage, document: { getElementById: () => ({}) }, navigator: {} });
vm.runInContext('"use strict";\n' + fs.readFileSync(path.join(dir, "engine_bundle.js"), "utf8"), ctx);
const E = code => vm.runInContext(code, ctx);

E(`MODE=${JSON.stringify(DEMO ? "mock" : "live")};SEED=${DEMO ? 7 : Date.now() & 0xffffff};rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";regimeOk=now();
  (function(){let sv={};try{sv=JSON.parse(LS.get("pt_risk")||"{}")}catch(e){}for(const k of Object.keys(sv))if(typeof sv[k]==="number"&&k in CFG.risk)CFG.risk[k]=sv[k];CFG.risk.perDay=CFG.risk.perHour*5;
   applyActivity(LS.get("pt_activity")||"active");try{const k=JSON.parse(LS.get("pt_keep")||"{}");if(typeof k.on==="boolean")CFG.keep.on=k.on;if(typeof k.target==="number")CFG.keep.target=k.target}catch(e){}let f={};try{f=JSON.parse(LS.get("pt_flags")||"{}")}catch(e){}if(typeof f.nw==="boolean")CFG.nw.enabled=f.nw;if(typeof f.tr==="boolean")CFG.tr.enabled=f.tr})();
  if(!S.curve.length)S.curve=[[now(),equity()]];`);
if (DEMO) { E(`vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,equity()]]`); let acc = 0; setInterval(async () => { acc += SPEED * 0.25; while (acc >= 5) { acc -= 5; E("vnow+=5"); await E("tick()") } }, 250) }
else { setInterval(() => E("stepFast(now())"), 2000); setInterval(() => E("stepSlow(now())"), 5000); setInterval(() => E("stepScan(now())"), 3000) }
const away = +store["pt_last_live"] || 0; if (!DEMO && away && Date.now() / 1000 - away > 300) E(`ev("warn","restart","","Runner was stopped for ${Math.round((Date.now() / 1000 - away) / 60)} minutes; resuming")`);
setInterval(flush, 5000);
const bye = () => { try { E("save()") } catch (e) {} flush(); process.exit(0) }; process.on("SIGINT", bye); process.on("SIGTERM", bye);

const snapshot = () => JSON.parse(E(`JSON.stringify((()=>{const pf=S.pf,cl=pf.closed;return{mode:MODE,now:now(),equity:equity(),start:pf.start,cash:pf.cash,exposure:exposure(),realized:pf.realized,shutdown:pf.shutdown,why:pf.why,regime,paused,
  positions:Object.values(pf.positions).map(p=>({sym:p.sym,chain:p.chain,cat:p.cat,value:pv(p),pnl:p.real+pv(p)-p.cost,pct:(p.real+pv(p)-p.cost)/(p.size0||p.cost)*100,held:(now()-p.opened)/3600,emergency:p.emergency,seenAt:p.seenAt})),
  closed:cl.slice(-50).reverse(),curve:S.curve.slice(-400),journal:S.journal.slice(0,40),health:typeof health!=="undefined"?{ok:health.ok,fail:health.fail,lastErr:health.lastErr}:null,stats:{scanned:stats.scanned,bought:stats.bought,vetoed:stats.vetoed}}})())`));
const PAGE = `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Paper Trader runner</title>
<style>:root{color-scheme:light dark;--g:#0b9a68;--r:#d63a4b}body{font:15px/1.4 -apple-system,system-ui,sans-serif;margin:0;padding:16px;max-width:640px;margin:auto}h1{font-size:30px;margin:4px 0}.s{opacity:.65;font-size:13px}.g{color:var(--g)}.r{color:var(--r)}
table{width:100%;border-collapse:collapse}td{padding:7px 0;border-top:1px solid #8884}h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;opacity:.6;margin:22px 0 6px}svg{width:100%;height:auto}.l{font:12px ui-monospace,monospace;padding:4px 0;border-top:1px solid #8883;overflow-wrap:anywhere}</style>
<div class=s id=hd></div><h1 id=eq></h1><div class=s id=sub></div><h2>Equity</h2><div id=ch></div><h2>Open positions</h2><table id=pos></table><h2>Recent events</h2><div id=ev></div>
<script>const T=new URLSearchParams(location.search).get("token")||"";const f=n=>(n<0?"-":"")+"$"+Math.abs(n).toLocaleString(undefined,{maximumFractionDigits:2});const esc=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
async function go(){try{const d=await (await fetch("state.json?token="+encodeURIComponent(T))).json();const rt=(d.equity/d.start-1)*100;
hd.textContent=(d.mode==="live"?"LIVE DATA":"DEMO")+" · paper money · "+(d.shutdown?"SHUTDOWN: "+d.why:d.paused?"entries paused":"running")+" · market "+d.regime;eq.textContent=f(d.equity);sub.innerHTML='<span class="'+(rt>=0?"g":"r")+'">'+(rt>=0?"+":"")+rt.toFixed(2)+"%</span> · cash "+f(d.cash)+" · realized "+f(d.realized)+" · scanned "+d.stats.scanned+", bought "+d.stats.bought+(d.health?" · data ok "+d.health.ok+"/fail "+d.health.fail:"");
const c=d.curve;if(c.length>1){const ys=c.map(p=>p[1]).concat([d.start]),lo=Math.min(...ys),hi=Math.max(...ys),pd=(hi-lo)*.1||1,X=i=>4+i/(c.length-1)*332,Y=v=>116-(v-lo+pd)/(hi-lo+2*pd)*112;ch.innerHTML='<svg viewBox="0 0 340 120"><path d="'+c.map((p,i)=>(i?"L":"M")+X(i).toFixed(1)+" "+Y(p[1]).toFixed(1)).join("")+'" fill="none" stroke="'+(d.equity>=d.start?"#0b9a68":"#d63a4b")+'" stroke-width="2"/><line x1="0" x2="340" y1="'+Y(d.start)+'" y2="'+Y(d.start)+'" stroke="#888" stroke-dasharray="3 4"/></svg>'}
pos.innerHTML=d.positions.sort((a,b)=>b.pct-a.pct).map(p=>"<tr><td><b>"+esc(p.sym)+"</b> <span class=s>"+p.chain+" "+p.cat+(p.emergency?" EXITING":"")+"</span></td><td align=right class='"+(p.pnl>=0?"g":"r")+"'>"+(p.pct>=0?"+":"")+p.pct.toFixed(1)+"%</td><td align=right>"+f(p.value)+"</td></tr>").join("")||"<tr><td class=s>No open positions</td></tr>";
ev.innerHTML=d.journal.map(j=>"<div class=l>"+esc(j.kind)+" "+esc(j.tok)+" "+esc(j.msg)+"</div>").join("")}catch(e){hd.textContent="runner unreachable"}}go();setInterval(go,3000)</script>`;
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (TOKEN && u.searchParams.get("token") !== TOKEN) { res.writeHead(401); return res.end("token required") }
  if (u.pathname === "/state.json") { res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" }); return res.end(JSON.stringify(snapshot())) }
  if (u.pathname === "/stop" && req.method === "POST") { E(`LS.set("pt_kill_${DEMO ? "mock" : "live"}","1")`); res.writeHead(200); return res.end("emergency stop set") }
  res.writeHead(200, { "content-type": "text/html" }); res.end(PAGE);
}).listen(PORT, () => console.log(`Paper Trader runner (${DEMO ? "demo" : "live"}, paper money only) · status page http://localhost:${PORT}/ · state ${file}`));
