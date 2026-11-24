// Always-on headless runner: the same engine as the app, running 24/7 on a computer or server, as several trading desks.
//   node server/run.mjs                       5 desks (Solana, Base, BSC, Ethereum, Big coins), live data, state in ./state/
//   node server/run.mjs --desks 1             one bot trading every chain (the original single-app setup)
//   node server/run.mjs --desks 10            10 desks (desks 6-10 repeat the areas in "Most money" mode)
//   node server/run.mjs --preset most         mode for every desk: recommended | easy | risky | most | lots | max
//   node server/run.mjs --demo --speed 60     synthetic market (testing)
//   node server/run.mjs --port 8787 --token SECRET   status page port / require ?token=SECRET
// Open http://<machine>:8787/ on your phone to watch it. State survives restarts (one file per desk in state/).
import fs from "node:fs";
import vm from "node:vm";
import http from "node:http";
import path from "node:path";
const dir = path.dirname(new URL(import.meta.url).pathname);
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf("--" + n); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) };
const DEMO = !!opt("demo", false), SPEED = +opt("speed", 60) || 60, PORT = +opt("port", 8787), TOKEN = opt("token", ""), STATE = path.resolve(opt("state", "state"));
const NDESK = Math.max(1, Math.min(25, +opt("desks", 5) || 5)), PRESET = opt("preset", "");
fs.mkdirSync(STATE, { recursive: true });
const bundle = fs.readFileSync(path.join(dir, "engine_bundle.js"), "utf8");
const AREAS = [{ n: "Solana", chains: ["solana"] }, { n: "Base", chains: ["base"] }, { n: "BSC", chains: ["bsc"] }, { n: "Ethereum", chains: ["ethereum"] }, { n: "Big coins", chains: ["solana", "base", "bsc", "ethereum"], trend: true }];
const MODES = ["lots", "most", "risky", "recommended", "lots"];

function makeDesk(i) {   // i = 0 for the single all-chain bot, 1..N for desks
  const file = path.join(STATE, (DEMO ? "demo" : "state") + (i ? "_desk" + i : "") + ".json");
  let store = {}; try { store = JSON.parse(fs.readFileSync(file, "utf8")) } catch (e) {}
  let dirty = false; const flush = () => { if (dirty) { dirty = false; fs.writeFileSync(file + ".tmp", JSON.stringify(store)); fs.renameSync(file + ".tmp", file) } };
  const area = i ? AREAS[(i - 1) % 5] : null, name = i ? area.n + (i > 5 ? " " + (Math.floor((i - 1) / 5) + 1) : "") : "All chains";
  const P = i ? "d" + i + "_" : "";   // the engine prefixes a desk's keys with its desk number, exactly like the app
  if (!store[P + "pt_preset"]) { store[P + "pt_preset"] = i ? MODES[Math.floor((i - 1) / 5)] || "lots" : "recommended"; dirty = true }
  if (PRESET) { store[P + "pt_preset"] = String(PRESET); dirty = true }
  if (i && !store[P + "pt_cap"]) { store[P + "pt_cap"] = "2000"; dirty = true }
  const localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); dirty = true }, removeItem: k => { delete store[k]; dirty = true } };
  // window.DESK makes the engine share the free API limits between desks (same as the app)
  const ctx = vm.createContext({ console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON, performance, fetch, AbortController, URL, localStorage, window: i ? { DESK: i, DESKN: NDESK } : undefined, document: { getElementById: () => ({}) }, navigator: {} });
  vm.runInContext('"use strict";\n' + bundle, ctx);
  const E = code => vm.runInContext(code, ctx);
  E(`MODE=${JSON.stringify(DEMO ? "mock" : "live")};SEED=${(DEMO ? 7 : Date.now() & 0xffffff) + i * 101};rng=mulberry(SEED);load();last={};stats=freshStats();regime="unknown";regimeOk=now();
    applySecMode(LS.get("pt_secmode")||"balanced");
    applyPreset(LS.get("pt_preset")||"recommended");CFG.core.on=${i ? "false" : 'LS.get("pt_core")!=="0"'};CFG.swarmOff=LS.get("pt_swarm")!=="1";CFG.lessons.on=LS.get("pt_lessons")?LS.get("pt_lessons")!=="0":CFG.lessons.on;
    ${area ? `CFG.chains=${JSON.stringify(area.chains)};CFG.onlyTrend=${!!area.trend};${area.trend ? "CFG.tr.enabled=true;" : ""}` : ""}
    if(!S.curve.length)S.curve=[[now(),totalEquity()]];`);
  const d = { i, name, E, store, flush, hold: false, file };
  if (DEMO) { E(`vnow=1.76e9;MOCK.init();regimeOk=vnow;S.curve=[[vnow,totalEquity()]]`); let acc = 0, busy = false; setInterval(async () => { if (busy) return; busy = true; acc += SPEED * 0.25; while (acc >= 5) { acc -= 5; E("vnow+=5"); await E("tick()") } busy = false }, 250) }
  else {
    // practice in simulation every 3 days, one desk at a time (the account is set aside and restored; no money is used)
    d.train = async () => { if (Date.now() - (+store[P + "pt_autotrain_at_live"] || 0) < 3 * 86400e3) return; d.hold = true;
      for (let k = 0; k < 1200 && E("busy||busyF||busyL||busyS"); k++) await new Promise(r => setTimeout(r, 100));
      try { await E("trainAgents(3)"); E(`LS.set("pt_autotrain_at_live",Date.now());save();ev("info","auto_train","","agents practised 3 simulated days (no money used)")`) } catch (e) { console.error(name, "training failed", e) } d.hold = false };
    setInterval(() => { if (!d.hold) E("stepFast(now())") }, 2000); setInterval(() => { if (!d.hold) E("stepSlow(now())") }, 5000); setInterval(() => { if (!d.hold) E("stepScan(now())") }, 3000);
    const away = +store[P + "pt_last_live"] || 0; if (away && Date.now() / 1000 - away > 300) E(`ev("warn","restart","","Runner was stopped for ${Math.round((Date.now() / 1000 - away) / 60)} minutes; resuming")`);
  }
  setInterval(flush, 5000);
  return d;
}
const desks = NDESK === 1 ? [makeDesk(0)] : [...Array(NDESK)].map((_, k) => makeDesk(k + 1));
if (!DEMO) { let k = 0; const nextTrain = async () => { const d = desks[k++ % desks.length]; if (d.train) await d.train() }; setTimeout(function loop() { nextTrain().finally(() => setTimeout(loop, 120000)) }, 15000) }
const bye = () => { for (const d of desks) { try { d.E("save()") } catch (e) {} d.flush() } process.exit(0) }; process.on("SIGINT", bye); process.on("SIGTERM", bye);

const snap = d => JSON.parse(d.E(`JSON.stringify((()=>{const pf=S.pf,cl=pf.closed;return{name:${JSON.stringify(d.name)},mode:MODE,preset:LS.get("pt_preset"),now:now(),equity:totalEquity(),start:totalStart(),cash:pf.cash,exposure:exposure(),realized:pf.realized,shutdown:pf.shutdown,why:pf.why,regime,paused,
  won:cl.filter(c=>c.pnl>0).length,lost:cl.filter(c=>c.pnl<=0).length,
  positions:Object.values(pf.positions).map(p=>({sym:p.sym,chain:p.chain,cat:p.cat,value:pv(p),pnl:p.real+pv(p)-p.cost,pct:(p.real+pv(p)-p.cost)/(p.size0||p.cost)*100,held:(now()-p.opened)/3600,emergency:p.emergency})),
  curve:S.curve.slice(-300),journal:S.journal.slice(0,15),health:typeof health!=="undefined"?{ok:health.ok,fail:health.fail,lastErr:health.lastErr}:null,stats:{scanned:stats.scanned,bought:stats.bought,vetoed:stats.vetoed}}})())`));
const PAGE = `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Paper Trader runner</title>
<style>:root{color-scheme:light dark;--g:#0b9a68;--r:#d63a4b}body{font:15px/1.4 -apple-system,system-ui,sans-serif;margin:0;padding:16px;max-width:680px;margin:auto}h1{font-size:30px;margin:4px 0}.s{opacity:.65;font-size:13px}.g{color:var(--g)}.r{color:var(--r)}
table{width:100%;border-collapse:collapse}td{padding:6px 0;border-top:1px solid #8884}h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;opacity:.6;margin:22px 0 6px}svg{width:100%;height:auto}.l{font:12px ui-monospace,monospace;padding:3px 0;border-top:1px solid #8883;overflow-wrap:anywhere}
details{border-top:1px solid #8884;padding:8px 0}summary{cursor:pointer;display:flex;justify-content:space-between;gap:8px}</style>
<div class=s id=hd></div><h1 id=eq></h1><div class=s id=sub></div><h2>Equity, all desks</h2><div id=ch></div><h2>Desks</h2><div id=dk></div>
<script>const T=new URLSearchParams(location.search).get("token")||"";const f=n=>(n<0?"-":"")+"$"+Math.abs(n).toLocaleString(undefined,{maximumFractionDigits:2});const sg=n=>(n>=0?"+":"-")+"$"+Math.abs(n).toLocaleString(undefined,{maximumFractionDigits:2});const esc=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));const open=new Set();
async function go(){try{const ds=await (await fetch("state.json?token="+encodeURIComponent(T))).json();const eq=ds.reduce((a,d)=>a+d.equity,0),st=ds.reduce((a,d)=>a+d.start,0),w=ds.reduce((a,d)=>a+d.won,0),l=ds.reduce((a,d)=>a+d.lost,0),op=ds.reduce((a,d)=>a+d.positions.length,0);
hd.textContent=(ds[0].mode==="live"?"LIVE DATA":"DEMO")+" · paper money · "+ds.length+" desk"+(ds.length>1?"s":"");eq.textContent=f(eq);sub.innerHTML='<span class="'+(eq>=st?"g":"r")+'">'+sg(eq-st)+" ("+((eq/st-1)*100).toFixed(2)+"%)</span> · "+w+" won · "+l+" lost · "+op+" open";
const n=Math.min(...ds.map(d=>d.curve.length));if(n>1){const c=[...Array(n)].map((_,i)=>ds.reduce((a,d)=>a+d.curve[d.curve.length-n+i][1],0)),lo=Math.min(...c,st),hi=Math.max(...c,st),pd=(hi-lo)*.1||1,X=i=>4+i/(n-1)*332,Y=v=>116-(v-lo+pd)/(hi-lo+2*pd)*112;ch.innerHTML='<svg viewBox="0 0 340 120"><path d="'+c.map((v,i)=>(i?"L":"M")+X(i).toFixed(1)+" "+Y(v).toFixed(1)).join("")+'" fill="none" stroke="'+(eq>=st?"#0b9a68":"#d63a4b")+'" stroke-width="2"/><line x1="0" x2="340" y1="'+Y(st)+'" y2="'+Y(st)+'" stroke="#888" stroke-dasharray="3 4"/></svg>'}
dk.innerHTML=ds.map((d,i)=>{const p=d.equity-d.start;return'<details data-i="'+i+'"'+(open.has(i)?" open":"")+'><summary><b>'+esc(d.name)+'</b><span class="'+(p>=0?"g":"r")+'">'+sg(p)+'</span></summary><div class=s>'+f(d.equity)+" · "+esc(d.preset||"")+" · "+(d.shutdown?"SHUTDOWN: "+esc(d.why):d.paused?"paused":"running")+" · "+d.won+" won / "+d.lost+" lost · scanned "+d.stats.scanned+(d.health?" · data ok "+d.health.ok+"/fail "+d.health.fail:"")+'</div><table>'+(d.positions.sort((a,b)=>b.pct-a.pct).map(p=>"<tr><td><b>"+esc(p.sym)+"</b> <span class=s>"+p.chain+(p.emergency?" EXITING":"")+"</span></td><td align=right class='"+(p.pnl>=0?"g":"r")+"'>"+(p.pct>=0?"+":"")+p.pct.toFixed(1)+"%</td><td align=right>"+f(p.value)+"</td></tr>").join("")||"<tr><td class=s>No open positions</td></tr>")+"</table>"+d.journal.slice(0,6).map(j=>"<div class=l>"+esc(j.kind)+" "+esc(j.tok)+" "+esc(j.msg)+"</div>").join("")+"</details>"}).join("");
dk.querySelectorAll("details").forEach(e=>e.ontoggle=()=>{const i=+e.dataset.i;e.open?open.add(i):open.delete(i)})}catch(e){hd.textContent="runner unreachable"}}go();setInterval(go,3000)</script>`;
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (TOKEN && u.searchParams.get("token") !== TOKEN) { res.writeHead(401); return res.end("token required") }
  if (u.pathname === "/state.json") { res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" }); return res.end(JSON.stringify(desks.map(snap))) }
  if (u.pathname === "/stop" && req.method === "POST") { for (const d of desks) d.E(`LS.set("pt_kill_${DEMO ? "mock" : "live"}","1")`); res.writeHead(200); return res.end("emergency stop set for every desk") }
  if (u.pathname === "/app") { const f = [path.join(dir, "..", "index.html"), path.join(dir, "..", "..", "index.html")].find(p => fs.existsSync(p)); if (f) { res.writeHead(200, { "content-type": "text/html" }); return res.end(fs.readFileSync(f)) } }
  res.writeHead(200, { "content-type": "text/html" }); res.end(PAGE);
}).listen(PORT, () => console.log(`Paper Trader runner (${DEMO ? "demo" : "live"}, paper money only, ${desks.length} desk${desks.length > 1 ? "s" : ""}) · status page http://localhost:${PORT}/ · state ${STATE}`));
