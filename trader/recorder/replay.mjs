// Replays recorded data through the real engine (same strategy, risk and execution code) with no look-ahead:
// at each moment the bot sees only records with t <= now. Prints the overall result, a time-ordered train/test split and bootstrap intervals.
//   node recorder/replay.mjs data/ [--setup "CFG.keep.on=false;"] [--split 0.7]
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
const dir = path.dirname(new URL(import.meta.url).pathname);
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf("--" + n); return i < 0 ? d : args[i + 1] };
const src = path.resolve(args[0] || "data"), SETUP = opt("setup", ""), SPLIT = +opt("split", 0.7);
const files = fs.statSync(src).isDirectory() ? fs.readdirSync(src).filter(f => f.endsWith(".jsonl")).sort().map(f => path.join(src, f)) : [src];
const recs = [];
for (const f of files) for (const l of fs.readFileSync(f, "utf8").split("\n")) if (l) recs.push(JSON.parse(l));
recs.sort((a, b) => a.t - b.t);
if (!recs.length) { console.error("no records"); process.exit(1) }
const T0 = recs[0].t, T1 = recs[recs.length - 1].t;
const ctx = vm.createContext({ console, setTimeout, clearTimeout, Date, Math, JSON, performance, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { getElementById: () => ({}) }, navigator: {} });
vm.runInContext('"use strict";\n' + fs.readFileSync(path.join(dir, "..", "server", "engine_bundle.js"), "utf8"), ctx);
const E = c => vm.runInContext(c, ctx);

// replay provider: only the past is visible
const toks = new Map(), secs = new Map(), firstSeen = new Map();
let ptr = 0, maj = null;
ctx.__advance = t => {
  while (ptr < recs.length && recs[ptr].t <= t) {
    const r = recs[ptr++], key = r.c + ":" + (r.a || "").toLowerCase();
    if (r.k === "snap") { toks.set(key, { r, ended: false }); if (!firstSeen.has(key)) firstSeen.set(key, r.t) }
    else if (r.k === "sec") secs.set(key, r.d);
    else if (r.k === "maj") maj = r.d;
    else if (r.k === "end") { const x = toks.get(key); if (x) x.ended = true }
  }
};
ctx.__toSnap = (r) => ({ chain: r.c, addr: r.a, sym: r.s, price: r.p, liq: r.l, fdv: r.f || 0, vol5: r.v[0], vol1h: r.v[1], vol6: r.v[2], vol24: r.v[3], chg5m: r.g[0], chg1h: r.g[1], chg6h: r.g[2], chg24: r.g[3], buys1h: r.x === undefined ? r.b : r.b, sells1h: r.x, buyers1h: r.u, sellers1h: r.w, pair: r.pa, created: r.cr || firstSeen.get(r.c + ":" + r.a.toLowerCase()) });
ctx.__toks = toks; ctx.__secs = secs; ctx.__first = firstSeen; ctx.__getMaj = () => maj;
E(`MODE="mock";rng=mulberry(11);S=null;load();last={};stats=freshStats();regime="unknown";vnow=${T0};regimeOk=vnow;S.curve=[[vnow,equity()]];CFG.tick=10;
 MOCK.toks={};MOCK.cfg={};
 MOCK.discoverNew=async()=>{const o=[];for(const [k,x] of __toks)if(!x.ended&&vnow-(x.r.cr||__first.get(k))<86400)o.push({chain:x.r.c,addr:x.r.a,source:"new",snap:__toSnap(x.r)});return o};
 MOCK.discoverTrending=async()=>{const o=[];for(const [k,x] of __toks)if(!x.ended&&x.r.v[1]>0)o.push({chain:x.r.c,addr:x.r.a,source:"trending",snap:__toSnap(x.r)});return o.sort((a,b)=>b.snap.vol1h-a.snap.vol1h).slice(0,60)};
 MOCK.snapshots=async(ch,addrs)=>{const o={};for(const a of addrs){const x=__toks.get(ch+":"+a.toLowerCase());if(x&&!x.ended)o[a.toLowerCase()]=__toSnap(x.r)}return o};
 MOCK.security=async(ch,a)=>__secs.get(ch+":"+a.toLowerCase())||null;
 MOCK.majors=async()=>__getMaj();MOCK.breakout=async()=>null;MOCK.blocked=()=>false;MOCK.advance=()=>{};
 ${SETUP}`);
for (let t = T0; t <= T1; t += 10) { ctx.__advance(t); E(`vnow=${t}`); await E("tick()") }
const out = JSON.parse(E(`JSON.stringify({eq:equity(),start:S.pf.start,closed:S.pf.closed.map(c=>({t:c.t,pnl:c.pnl,r:c.r,cat:c.cat,reason:c.reason,size:c.size})),fees:S.pf.feesPaid,scanned:stats.scanned,bought:stats.bought})`));
const cl = out.closed, cut = T0 + (T1 - T0) * SPLIT;
const sum = a => a.reduce((x, y) => x + y, 0), mean = a => a.length ? sum(a) / a.length : 0;
function boot(a, n = 2000) { if (a.length < 5) return [NaN, NaN]; const ms = []; for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < a.length; j++) s += a[Math.floor(Math.random() * a.length)]; ms.push(s / a.length) } ms.sort((x, y) => x - y); return [ms[Math.floor(n * .025)], ms[Math.floor(n * .975)]] }
const rep = (name, a) => { const w = a.filter(c => c.pnl > 0); const [lo, hi] = boot(a.map(c => c.r)); console.log(`${name.padEnd(6)} trades ${String(a.length).padStart(4)} win ${a.length ? (100 * w.length / a.length).toFixed(0) : 0}% pnl $${sum(a.map(c => c.pnl)).toFixed(0)} expectancy ${mean(a.map(c => c.r)).toFixed(2)}R  95% CI [${lo.toFixed(2)}, ${hi.toFixed(2)}]R`) };
console.log(`replayed ${((T1 - T0) / 86400).toFixed(1)} days, ${recs.length} records, tokens ${firstSeen.size}; return ${((out.eq / out.start - 1) * 100).toFixed(2)}%, fees $${out.fees.toFixed(0)}, scanned ${out.scanned}`);
rep("ALL", cl); rep("TRAIN", cl.filter(c => c.t <= cut)); rep("TEST", cl.filter(c => c.t > cut));
const byReason = {};
for (const c of cl) { const k = String(c.reason).startsWith("EMERGENCY") ? "emergency" : c.reason; (byReason[k] = byReason[k] || []).push(c) }
for (const [k, a] of Object.entries(byReason)) console.log("  exit", k.padEnd(14), a.length, "avg", mean(a.map(c => c.r)).toFixed(2) + "R");
console.log("note: the interval is a bootstrap over trades (assumes independence); judge only after hundreds of trades, and test on data the settings were not tuned on.");
