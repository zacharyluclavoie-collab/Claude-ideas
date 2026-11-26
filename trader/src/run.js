/* ===== Run controller (Master): ONE simulated clock, ONE snapshot object in whole cents, real pause, verified saves, money features =====
 * Demo market only (on live prices every desk runs on real time). The Master advances the global clock G; each desk simulates up to exactly G
 * and answers with a report taken at G. When every desk has answered for G, the reports become one snapshot object (all money in integer
 * cents). The screen is drawn only from that object, at most 4 times a second, so every number on screen comes from the same moment. */
// same small IndexedDB store the desks use (desk frames share this page's storage)
const IDB={db:null,open(){return new Promise((res,rej)=>{try{const r=indexedDB.open("papertrader",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}})},
  async tx(mode,fn){const db=this.db||(this.db=await this.open());return new Promise((res,rej)=>{const t=db.transaction("kv",mode),st=t.objectStore("kv"),r=fn(st);t.oncomplete=()=>res(r&&"result" in r?r.result:true);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})},
  put(k,v){return this.tx("readwrite",st=>st.put(v,k))},get(k){return this.tx("readonly",st=>st.get(k))},del(k){return this.tx("readwrite",st=>st.delete(k))},clear(){return this.tx("readwrite",st=>st.clear())},keys(){return this.tx("readonly",st=>st.getAllKeys())}};
const PEND = {}, ACK = {}, READY = {}, DIAG = [], SETLOG = [], ACTLOG = [], SPD = [], SPH = [], WARN = { inv: 0 };
const RESTORE = window.__ptRestore || null;
const DCFG = {};
let SNAPT = { g: CLK.g, real: Date.now() }, SNAP = null, NEXT = null, snapId = 0, saving = null, lastSave = 0, lastSaveTrades = 0, skipTo = 0, budget = 0, stepAt = performance.now(), bootAt = Date.now(), waitN = 0, stepN = 0, drawTimer = 0;
let restoreWait = !!RESTORE || tabBlocked, lastDayN = 0, maxTrades = 0, todayPrev = null, fpsNow = 0, drawAt = 0, lastCommitG = 0, restoreCheck = null;
const KEEP = (RESTORE && RUNSV) ? RUNSV : {};
let DAYS = KEEP.days || {}, DSTATE = KEEP.dstate || {}, DD = KEEP.dd || { peak: 0, peakG: 0, max: 0, pct: 0, from: 0, to: 0 }, SID = KEEP.sid || 0, SAVES = KEEP.saves || [], MODELOG = KEEP.modelog || {}, ALLOC = KEEP.alloc || {}, ALLOCLOG = KEEP.alloclog || [];
let MONEY = Object.assign({ ladder: true, slipPlus: 1, prebuy: false, ftc: false, bank: false, bankTarget: 150, memory: false, cold: false, smart: false, tournament: false }, (() => { try { return JSON.parse(localStorage.getItem("pt_host_money") || "{}") } catch (e) { return {} } })(), KEEP.money || {});
if (RUNSV && RESTORE) { (RUNSV.setlog || []).forEach(x => SETLOG.push(x)); (RUNSV.actlog || []).forEach(x => ACTLOG.push(x)) }
function isLive() { return Object.values(R).some(r => r.live) }
function dayN(g) { return Math.floor((g - CLK.g0) / 86400) + 1 }
function isoDay(g) { return new Date(g * 1000).toISOString().slice(0, 10) }
function isoOfDay(n) { return isoDay(CLK.g0 + (n - 1) * 86400) }
function hhmm(g) { const s = ((g - HSIM0) % 86400 + 86400) % 86400; return String(Math.floor(s / 3600)).padStart(2, "0") + ":" + String(Math.floor(s % 3600 / 60)).padStart(2, "0") }
function simLabel(g) { return CLK.done && CLK.until && g >= CLK.until && (g - CLK.g0) % 86400 === 0 ? `End of Day ${dayN(g) - 1}` : `Day ${dayN(g)} · ${hhmm(g)}` }
function dateLabel(g) { return new Date(g * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" }) }
function stepQ(sp) { return sp >= 30000 ? 60 : sp >= 3000 ? 30 : sp >= 1000 ? 15 : 10 }
const D$ = c => money(c / 100), SG$ = c => sg(c / 100);   // display only: money lives in integer cents
function diag(kind, msg) { DIAG.unshift({ t: Date.now(), g: CLK.g, kind, msg }); if (DIAG.length > 300) DIAG.length = 300; if (kind === "invariant" || kind === "error") drawDiag() }
function actLog(msg) { ACTLOG.unshift({ t: Date.now(), g: CLK.g, msg }); if (ACTLOG.length > 80) ACTLOG.length = 80; drawActLog() }
function setLog(name, a, b) { SETLOG.unshift({ t: Date.now(), g: CLK.g, name, a: String(a), b: String(b) }); if (SETLOG.length > 300) SETLOG.length = 300; drawSetLog(); drawDiag(); if (CLK.state === "paused" && !restoreWait && name !== "Export") setTimeout(() => doSave("setting changed"), 50) }   // a change made while paused is saved too
function toast(msg) { const el = $h("htoast"); if (!el) return; el.textContent = msg; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 3200) }
const post = (d, o) => { const f = document.querySelectorAll(".hframe")[d - 1]; try { f.contentWindow.postMessage(o, "*") } catch (e) {} };
const readyDesks = () => { const a = []; for (let i = 1; i <= NDESK; i++) if (READY[i]) a.push(i); return a };

/* ---- the snapshot object: one per simulated moment, all money in integer cents ---- */
function buildSnap(rr, g) {
  const tot = { eq: 0, start: 0, w: 0, l: 0, openPl: 0, bb: 0, bs: 0, y: 0, wo: 0, flat: 0, wn: 0, ln: 0, openN: 0, scanned: 0, ch1h: 0, ch24h: 0, woN: 0 }, desks = {}, days = {};
  const today = isoDay(g - 1 >= CLK.g0 ? g : g) /* the day the clock is in */, dk = isoDay(g);
  for (const [d, r] of Object.entries(rr)) {
    const m = r.mc || {}, C = x => Math.round((x || 0) * 100), x = { eq: m.eq ?? C(r.eq), start: m.start ?? C(r.start), w: m.w ?? C(r.w), l: m.l ?? C(r.l), openPl: m.open ?? C(r.openPl), bb: m.bb || 0, bs: m.bs || 0, y: m.y || 0, wo: m.wo || 0, flat: m.flat || 0, wn: r.wn || 0, ln: r.ln || 0, openN: r.open || 0, todayN: 0, todayMade: 0, todayLost: 0, woN: r.woN || 0, ch1h: C(r.ch1h), ch24h: C(r.ch24h) };
    for (const [k, y] of Object.entries(r.dayc || {})) { const z = days[k] || (days[k] = { n: 0, w: 0, l: 0, made: 0, lost: 0 }); z.n += y.n; z.w += y.w; z.l += y.l; z.made += y.made; z.lost += y.lost; if (k === dk) { x.todayN = y.n; x.todayMade = y.made; x.todayLost = y.lost } }
    x.deskToday = r.todayN || 0; desks[d] = x;
    for (const k of ["eq", "start", "w", "l", "openPl", "bb", "bs", "y", "wo", "flat", "wn", "ln", "openN", "woN", "ch1h", "ch24h"]) tot[k] += x[k]; tot.scanned += r.scanned || 0;
  }
  const td = days[dk] || { n: 0, made: 0, lost: 0 }; tot.todayN = td.n; tot.todayMade = td.made; tot.todayLost = td.lost;
  return { id: ++snapId, g, real: Date.now(), desks, tot, days, dk };
}
// the dollar view the older screen code reads (from the one snapshot)
function totals() { const s = SNAP; if (!s) return { eq: 0, start: 0, w: 0, wn: 0, l: 0, ln: 0, open: 0, openPl: 0, today: 0, todayN: 0, scanned: 0, ch1h: 0, ch24h: 0 }; const t = s.tot;
  return { eq: t.eq / 100, start: t.start / 100, w: t.w / 100, wn: t.wn, l: t.l / 100, ln: t.ln, open: t.openN, openPl: t.openPl / 100, today: (t.todayMade + t.todayLost) / 100, todayN: t.todayN, scanned: t.scanned, ch1h: t.ch1h / 100, ch24h: t.ch24h / 100 } }
function dailyRows() { const out = {}; if (!SNAP) return out; for (const [k, x] of Object.entries(SNAP.days)) out[k] = { n: x.n, w: x.w, l: x.l, made: x.made / 100, lost: x.lost / 100 }; return out }

/* ---- reports in, snapshots out ---- */
function runIn(m) {
  if (m.err) { diag("error", `${DN[m.desk - 1]}: ${m.err}`); return }
  if (m.saved != null) saveAck(m);
  if (m.live) { R[m.desk] = m; SNAP = buildSnap(R, Date.now() / 1000); SNAPT = { g: Date.now() / 1000, real: Date.now(), live: true }; return }
  if (m.vnow == null) return;
  PEND[m.desk] = m; if (m.ack != null) ACK[m.desk] = m.ack;
  { const o = DCFG[m.desk], k = { mode: m.mode, paused: !!m.paused }; if (o && READY[m.desk]) { if (o.mode !== k.mode) setLog(`${DN[m.desk - 1]}: mode`, MODEN[o.mode] || o.mode, MODEN[k.mode] || k.mode); if (o.paused !== k.paused) setLog(`${DN[m.desk - 1]}: no new trades`, o.paused ? "on" : "off", k.paused ? "on" : "off") } DCFG[m.desk] = k }   // every desk setting change is logged, whoever made it (you, Full Auto, the tournament, the desk page)
  if (m.ready && !READY[m.desk]) {
    READY[m.desk] = true; sendMoney(m.desk);
    if (!RESTORE && readyDesks().length === NDESK && !SETLOG.some(l => l.name === "Run start")) setLog("Run start", "", `seed ${CLK.seed}, ${NDESK} desks, speed ${CLK.speed.toLocaleString()}x, Full Auto ${FA ? "on" : "off"}, market size ${autoSize ? "Auto" : (m.simScale || "?") + "x fixed"}, money features on: ${Object.entries(MONEY).filter(([, v]) => v === true).map(([k]) => MONEYN[k] || k).join(", ") || "none"}`);   // the starting setup, so a run can be explained from its export alone
    if (RESTORE) { if (m.restored) diag("storage", `${DN[m.desk - 1]} restored save #${RESTORE.sid} at ${simLabel(m.vnow)}`); else diag("storage", `${DN[m.desk - 1]} could not load save #${RESTORE.sid}: started fresh at ${simLabel(m.vnow)}`) }
    if (m.vnow > CLK.g) { CLK.g = m.vnow; for (const d of readyDesks()) if (d !== m.desk) advance(d, CLK.g) }
    else if (m.vnow < CLK.g) advance(m.desk, CLK.g)
  }
  tryCommit();
}
function advance(d, g) { post(d, { ptcmd: "adv", v: g, stp: skipTo > CLK.g ? 30 : stepQ(CLK.speed) }) }
function tryCommit() { const ds = readyDesks(); if (!ds.length || !ds.every(d => PEND[d] && PEND[d].vnow === CLK.g)) return; commit(ds) }
function commit(ds) {
  const rr = {}; for (const d of ds) rr[d] = PEND[d];
  const sn = buildSnap(rr, CLK.g); NEXT = { rr, sn };
  afterCommit(sn, rr);
  const still = CLK.state === "paused" || CLK.state === "emergency" || CLK.done || restoreWait, n = performance.now();
  if (still || n - drawAt >= 250) applyNext(); else if (!drawTimer) drawTimer = setTimeout(() => { drawTimer = 0; applyNext() }, 250 - (n - drawAt));   // the screen: at most 4 times a second (Fix 10)
}
// the snapshot on screen is replaced as a whole, then drawn: screen and data never disagree
function applyNext() { if (!NEXT) return; const { rr, sn } = NEXT; NEXT = null; for (const k of Object.keys(R)) if (!(k in rr)) delete R[k]; Object.assign(R, rr); SNAP = sn; SNAPT = { g: sn.g, real: sn.real }; drawAt = performance.now(); if (cur === 0) { draw(); checkScreen() } else if (cur === -1) brDraw() }

/* ---- the clock ---- */
function clkStep() {
  const n = performance.now(), dtReal = Math.min(n - stepAt, 500); stepAt = n;
  if (isLive() || restoreWait || readOnly) { budget = 0; return }
  const ds = readyDesks(); if (!ds.length || (ds.length < NDESK && Date.now() - bootAt < 30000)) return;
  const running = (CLK.state === "running" || CLK.state === "nonew") && !CLK.done;
  const eff = SPEEDV.val, cap = Math.max(stepQ(CLK.speed) * 2, Math.min(CLK.speed * 0.5 + 60, eff ? eff * 0.3 : 600));
  if (running) { budget = Math.min(budget + CLK.speed * dtReal / 1000, cap) } else budget = 0;
  if (saving) return;
  if (!ds.every(d => ACK[d] >= CLK.g)) { if (running) waitN++; return }
  stepN++;
  let target = CLK.g;
  if (skipTo > CLK.g) target = Math.min(skipTo, CLK.g + Math.floor(Math.max(600, (eff || 2000) * 0.3) / 30) * 30);   // whole 30 s steps, so the desks' ticks never depend on the computer's speed
  else if (running) { const Q = stepQ(CLK.speed), k = Math.floor(budget / Q); if (!k) return; target = CLK.g + k * Q; budget -= k * Q }
  else return;
  const mid = HSIM0 + (Math.floor((CLK.g - HSIM0) / 86400) + 1) * 86400; if (target > mid) target = mid;   // stop exactly at every simulated midnight
  if (CLK.until && !CLK.done && target > CLK.until) target = CLK.until;
  if (target <= CLK.g) return;
  CLK.g = target; for (const d of ds) advance(d, target);
}
setInterval(clkStep, 16);
function afterCommit(sn, rr) {
  const g = sn.g, t = sn.tot, trades = t.wn + t.ln, dN = dayN(g), dg = Math.max(0, g - (lastCommitG || g)); lastCommitG = g;
  if (CLK.state === "running" || CLK.state === "nonew") SPD.push([performance.now(), g]);
  // time spent in each run state per simulated day: the reason a quiet day was quiet (Fix 3)
  if (dg > 0) { const k = isoDay(g - 1), st = skipTo > g - dg ? "skip" : CLK.state, x = DSTATE[k] || (DSTATE[k] = {}); x[st] = (x[st] || 0) + dg }
  // max drawdown of the balance, on every snapshot (Money 9)
  if (t.eq > DD.peak) { DD.peak = t.eq; DD.peakG = g } else if (DD.peak - t.eq > DD.max) { DD.max = DD.peak - t.eq; DD.pct = (DD.peak - t.eq) / DD.peak * 100; DD.from = DD.peakG; DD.to = g }
  // a new simulated day: the finished day's end balance and its parts are written down once, at exactly midnight
  if (!lastDayN) lastDayN = dN;
  if (dN > lastDayN) { const pd = isoDay(g - 1); DAYS[pd] = { eod: t.eq, open: t.openPl, bb: t.bb, y: t.y, scanned: t.scanned, nonew: (DSTATE[pd] || {}).nonew || 0, skip: (DSTATE[pd] || {}).skip || 0 };
    const y = sn.days[pd] || { n: 0, made: 0, lost: 0 }; actLog(`New simulated day ${dN} (${dateLabel(g)}): daily counters reset. Day ${dN - 1}: ${y.n} trades, net ${SG$(y.made + y.lost)}, ended at ${D$(t.eq)}`);
    diag("day", `Day ${dN - 1} closed at ${D$(t.eq)}; "today" counters reset for Day ${dN}`); lastDayN = dN; todayPrev = null; onMidnight(sn, rr, pd) }
  if (!DAYS.__start && Object.keys(rr).length >= NDESK) DAYS.__start = { eod: t.start, open: 0, bb: 0, y: 0 };   // only once every desk is in: the run's real starting balance
  checkInvariants(sn, rr, trades); histSampleSnap(sn);
  if (CLK.until && !CLK.done && g >= CLK.until) finishRun();
  else if ((CLK.state === "running" || CLK.state === "nonew") && (Date.now() - lastSave > 2500 || (trades > lastSaveTrades && Date.now() - lastSave > 1000))) doSave(trades > lastSaveTrades ? "trade closed" : "auto");   // on a schedule and on every trade close (max 1 a second)
}

/* ---- ONE speed measurement (Fix 7): one rolling 10 s window, one value, one id and time, read by every display ---- */
const SPEEDV = { id: 0, at: 0, g: 0, val: 0, v1m: null, v5m: null, run: 0 };
setInterval(() => {
  const n = performance.now(); while (SPD.length > 2 && n - SPD[0][0] > 10000) SPD.shift();
  const running = (CLK.state === "running" || CLK.state === "nonew") && !CLK.done && !restoreWait;
  let v = 0; if (running && SPD.length >= 2) { const a = SPD[0], b = SPD[SPD.length - 1]; v = b[0] > a[0] ? (b[1] - a[1]) / ((b[0] - a[0]) / 1000) : 0 }
  if (!running) SPD.length = 0;
  SPH.push([n, running ? v : null]); while (SPH.length > 330) SPH.shift();
  const ago = s => { const x = SPH.find(p => n - p[0] <= s * 1000 + 600 && n - p[0] >= s * 1000 - 600); return x ? x[1] : null };
  Object.assign(SPEEDV, { id: SPEEDV.id + 1, at: Date.now(), g: SNAPT.g, val: v, v1m: ago(60), v5m: ago(300), run: CLK.realRun > 1000 ? (CLK.g - CLK.g0) / (CLK.realRun / 1000) : 0 });
  if (!document.hidden) { try { drawRun(); if (typeof brDrawStage === "function") brDrawStage() } catch (e) {} }   // every speed label moves to the new measurement at the same moment
}, 1000);
function effSpeed() { return SPEEDV.val }
function speedText() { return SPEEDV.val ? "~" + Math.round(SPEEDV.val).toLocaleString() + "x" : "…" }
function limiting() {
  const eff = SPEEDV.val, sel = CLK.speed, sc = (Object.values(R)[0] || {}).simScale || "?";
  if (CLK.state === "paused" || CLK.state === "emergency" || CLK.done) return "";
  if (!eff || eff >= sel * 0.8) return "";
  return `limited by computer speed: ${NDESK} desks share one browser thread, market size ${sc}×, ${fpsNow} fps`;
}
{ let fr = 0, t0 = performance.now(); const f = n => { fr++; if (n - t0 >= 1000) { fpsNow = Math.round(fr * 1000 / (n - t0)); fr = 0; t0 = n } requestAnimationFrame(f) }; requestAnimationFrame(f) }
setInterval(() => { waitN = Math.round(waitN * 0.5); stepN = Math.round(stepN * 0.5) }, 5000);

/* ---- run states ---- */
const STATEN = { running: "Running", nonew: "No new trades", paused: "Paused", emergency: "Emergency stop" };
function setState(st, why) {
  if (readOnly && st !== "paused") { toast("Read-only tab: it cannot run or save."); return }
  if (st === CLK.state) return; const old = CLK.state; CLK.state = st; setLog("Run state", STATEN[old], STATEN[st]);
  send("pause", st === "nonew");
  if (isLive()) send("hold", st === "paused" || st === "emergency");
  if (st === "paused" || st === "emergency") { SPD.length = 0; doSave(why || "pause") }
  if (st === "emergency") actLog("EMERGENCY STOP: everything frozen. Nothing was sold. Tap Run twice to continue.");
  if (st === "nonew") actLog("No new trades: scanners off, open coins are still watched and sold.");
  drawRun(); drawTicker(true); mark(); if (cur === 0) draw();
}
function setSpeed(v) { v = +v; if (!v || v === CLK.speed) { drawRun(); return } setLog("Demo speed", CLK.speed.toLocaleString() + "x", v.toLocaleString() + "x"); CLK.speed = v; SPD.length = 0; try { localStorage.setItem("pt_host_speed", String(v)) } catch (e) {} drawRun(); mark() }
function skip(sec) { if (isLive() || readOnly) return; skipTo = Math.max(skipTo, CLK.g) + sec; setLog("Skip ahead", "", (sec / 3600) + " h"); actLog(`Skipping ahead ${sec >= 86400 ? sec / 86400 + " day" + (sec > 86400 ? "s" : "") : sec / 3600 + " hour"} (as fast as possible, then back to the chosen speed)`) }
function finishRun() {
  CLK.done = true; CLK.state = "paused"; setLog("Run state", "Running", "Paused (target reached)"); SPD.length = 0;
  const lab = (CLK.until - CLK.g0) % 86400 === 0 ? `Day ${dayN(CLK.until) - 1}` : simLabel(CLK.until);
  actLog(`Run target reached: ${lab}. Everything is paused.${CLK.untilMode === "sell" ? " Every open coin is being sold at this moment's prices." : " Open coins were frozen as they are."}`);
  if (CLK.untilMode === "sell") send("closeall");
  setTimeout(() => { applyNext(); doSave("finish"); drawRun(); openReport(true) }, CLK.untilMode === "sell" ? 1500 : 300); drawRun(); drawTicker(true);
}

/* ---- saving (Fix 5): every desk saves the same simulated moment under one save id; the save counts only when all of them succeeded ----
 * The save record (localStorage) is written last and carries a stamp (clock, balance, trades, open coins, positions) taken from the
 * snapshot of that moment. Restore loads exactly that save id and checks the restored run against the stamp. The last 3 saves are kept. */
let lastSaveG = 0, leaving = false;
function stampOf(sn, rr) { const pos = Object.entries(rr).map(([d, r]) => d + ":" + (r.posKey || "")).join("|"); return { g: sn.g, eq: sn.tot.eq, trades: sn.tot.wn + sn.tot.ln, open: sn.tot.openN, pos: hashStr(pos) } }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }
function doSave(why) {
  if (saving || isLive() || leaving || readOnly || restoreWait) return; const ds = readyDesks();
  if (!ds.length || !ds.every(d => ACK[d] === CLK.g && (PEND[d] || {}).vnow === CLK.g)) { if (why !== "auto" && why !== "trade closed") setTimeout(() => doSave(why), 300); return }
  const rr = {}; for (const d of ds) rr[d] = PEND[d]; const sn = buildSnap(rr, CLK.g); snapId--;
  lastSave = Date.now(); const id = SID + 1; saving = { id, g: CLK.g, need: new Set(ds), ok: true, why, t0: Date.now(), stamp: stampOf(sn, rr), sn, keep: JSON.parse(JSON.stringify({ days: DAYS, dstate: DSTATE, dd: DD, modelog: MODELOG, alloc: ALLOC, alloclog: ALLOCLOG.slice(-200), money: MONEY })) };   // everything the run record holds, from this same moment
  for (const d of ds) post(d, { ptcmd: "save", v: CLK.g, id });
  setTimeout(() => { if (saving && saving.id === id) finishSave(false, "a desk did not answer in 6 s") }, 6000);
}
function saveAck(m) { if (!saving || m.saved !== saving.g) return; if (!m.ok) { saving.ok = false; saving.err = m.saveErr || "save refused" } saving.need.delete(m.desk); if (!saving.need.size) finishSave(saving.ok) }
function finishSave(ok, err) {
  const sv = saving; saving = null; if (!sv) return;
  if (!ok) { diag("storage", `save #${sv.id} failed at ${simLabel(sv.g)}: ${err || sv.err} (the previous save stays the one to restore)`); return }
  SID = sv.id; lastSaveG = sv.g; lastSaveTrades = sv.stamp.trades; SAVES.push({ id: sv.id, g: sv.g, stamp: sv.stamp, savedAt: Date.now(), why: sv.why, keep: sv.keep }); while (SAVES.length > 3) { const old = SAVES.shift(); for (let d = 1; d <= NDESK; d++) IDB.del("desk" + d + "#" + old.id).catch(() => {}) }
  writeRun(sv);
  if (sv.why !== "auto" && sv.why !== "trade closed") diag("storage", `save #${sv.id} at ${simLabel(sv.g)} (${sv.why}): ${D$(sv.stamp.eq)}, ${sv.stamp.trades} trades, in ${Date.now() - sv.t0} ms`);
  setTimeout(() => { if (cur === 0) draw() }, 0);
}
let handState = null;   // the state a tab that takes over should continue in
function runRecord(sv) {
  return { v: 2, sid: sv.id, g: sv.g, stamp: sv.stamp, saves: SAVES.slice(-3), g0: CLK.g0, seed: CLK.seed, speed: CLK.speed, state: handState || CLK.state, until: CLK.until, untilMode: CLK.untilMode, done: CLK.done, startedAt: CLK.startedAt, realRun: CLK.realRun, nd: NDESK,
    days: sv.keep.days, dstate: sv.keep.dstate, dd: sv.keep.dd, money: sv.keep.money, modelog: sv.keep.modelog, alloc: sv.keep.alloc, alloclog: sv.keep.alloclog, savedAt: Date.now(), bal: sv.stamp.eq / 100, trades: sv.stamp.trades, setlog: SETLOG.slice(0, 300), actlog: ACTLOG.slice(0, 60) } }
function writeRun(sv) { if (leaving || readOnly) return; try { localStorage.setItem(RUNK, JSON.stringify(runRecord(sv))) } catch (e) { diag("storage", "could not write the save record: " + e.message) } }
setInterval(() => { if ((CLK.state === "running" || CLK.state === "nonew") && !restoreWait && !readOnly) CLK.realRun += 1000 }, 1000);
function startOver(cap) {
  leaving = true; CLK.state = "paused";
  try { localStorage.removeItem(RUNK); localStorage.removeItem("pt_host_hist2"); for (let i = 1; i <= 25; i++) { localStorage.setItem("d" + i + "_pt_cap", String(cap)); localStorage.setItem("d" + i + "_pt_reset_pending", "1") } } catch (e) {}
  const done = () => location.reload(); try { IDB.clear().then(done, done) } catch (e) { done() }
}
// restore: the banner is built from the save record that is being restored, then the restored run is checked against its stamp
function verifyRestore() {
  if (!RESTORE || restoreCheck || !RUNSV) return; const ds = readyDesks(); if (ds.length < NDESK || !SNAP || SNAP.g !== RUNSV.g) return;
  const st = RUNSV.stamp || { g: RUNSV.g, eq: Math.round((RUNSV.bal || 0) * 100), trades: RUNSV.trades }, sn = SNAP, now = stampOf(sn, R), diff = [];
  if (now.g !== st.g) diff.push(`clock ${simLabel(now.g)} vs saved ${simLabel(st.g)}`); if (now.eq !== st.eq) diff.push(`balance ${D$(now.eq)} vs saved ${D$(st.eq)}`); if (now.trades !== st.trades) diff.push(`trades ${now.trades} vs saved ${st.trades}`);
  if (st.open != null && now.open !== st.open) diff.push(`open coins ${now.open} vs saved ${st.open}`); if (st.pos && now.pos !== st.pos) diff.push("open positions differ");
  restoreCheck = { ok: !diff.length, diff, sid: RUNSV.sid }; diag(restoreCheck.ok ? "storage" : "invariant", restoreCheck.ok ? `restore of save #${RUNSV.sid} verified: balance, trades, clock and positions match` : `restore of save #${RUNSV.sid} does NOT match: ${diff.join("; ")}`); if (!restoreCheck.ok) WARN.inv++;
  drawRestore();
}
setInterval(verifyRestore, 500);
function drawRestore() {
  const el = $h("h_restore"); if (!el) return;
  if (tabBlocked && readOnly && !restoreWait) { el.hidden = false; el.innerHTML = "👀 <b>Read-only view.</b> This run is live in another tab. This tab never runs or saves."; return }
  if (!restoreWait || !RUNSV || !RESTORE) { el.hidden = true; return } el.hidden = false; const st = RUNSV.stamp || {};
  const head = `💾 <b>Restore save #${RUNSV.sid || "?"}</b> (saved ${new Date(RUNSV.savedAt).toLocaleString()}): simulated ${simLabel(RUNSV.g)}, balance ${D$(st.eq ?? Math.round((RUNSV.bal || 0) * 100))}, ${st.trades ?? RUNSV.trades} trades, ${st.open ?? "?"} open coins.`;
  const chk = !restoreCheck ? " <i>Checking…</i>" : restoreCheck.ok ? ` <b class="g">Verified: balance, trades, clock and positions all match.</b>` : ` <b class="r">Does not match: ${escH(restoreCheck.diff.join("; "))}.</b>`;
  const prev = SAVES.length > 1 ? `<button id="rs_prev" class="chip">Use the save before (#${SAVES[SAVES.length - 2].id})</button>` : "";
  el.innerHTML = head + chk + ` Everything is paused until you choose. <span class="rbtns"><button id="rs_go" class="chip on" ${restoreCheck ? "" : "disabled"}>Resume</button>${restoreCheck && !restoreCheck.ok ? `<button id="rs_retry" class="chip">Retry restore</button>${prev}` : ""}<button id="rs_new" class="chip">Start over</button></span>`;
  const go = $h("rs_go"); if (go) go.onclick = () => { restoreWait = false; el.hidden = true; const s0 = RUNSV.state === "emergency" ? "paused" : (RUNSV.done ? "paused" : (RUNSV.state || "running")); CLK.state = "paused"; lastSaveTrades = (RUNSV.stamp || {}).trades || 0; setState(s0 === "paused" ? "paused" : s0, "resume"); setLog("Restore", "", `resumed save #${RUNSV.sid}${restoreCheck && restoreCheck.ok ? " (verified)" : " (NOT verified)"}`); drawRun() };
  const rt = $h("rs_retry"); if (rt) rt.onclick = () => location.reload();
  const pv = $h("rs_prev"); if (pv) pv.onclick = () => { const p = SAVES[SAVES.length - 2]; try { localStorage.setItem(RUNK, JSON.stringify(Object.assign({}, RUNSV, { sid: p.id, g: p.g, stamp: p.stamp, saves: SAVES.slice(0, -1) }, p.keep || {}))) } catch (e) {} location.reload() };
  let arm = 0; $h("rs_new").onclick = e => { if (!arm) { arm = 1; e.target.textContent = "Tap again: delete the saved run"; setTimeout(() => { arm = 0; e.target.textContent = "Start over" }, 4000); return } startOver(+(localStorage.getItem("d1_pt_cap") || 2000)) };
}

/* ---- one live tab (Fix 11): heartbeat lock; a second tab is blocked until Take over (which pauses and saves this one) or Read-only ---- */
setInterval(() => { if (readOnly) return; try { const l = JSON.parse(localStorage.getItem(LOCKK) || "null"); if (l && l.id !== TAB && l.id) return; localStorage.setItem(LOCKK, JSON.stringify({ id: TAB, t: Date.now() })) } catch (e) {} }, 2000);
window.addEventListener("storage", e => {
  if (e.key === "pt_host_takeover" && e.newValue && !readOnly) { const req = JSON.parse(e.newValue); if (req.by === TAB) return;   // another tab asks: pause, save, hand over
    handState = CLK.state === "nonew" ? "nonew" : CLK.state === "running" ? "running" : null; setState("paused", "handing over to another tab"); const wait = () => { if (saving) return setTimeout(wait, 200); readOnly = true; try { localStorage.setItem(LOCKK, JSON.stringify({ id: null, t: 0, to: req.by })) } catch (x) {} actLog("Another tab took over this run. This tab is now read-only."); showTabBlock("taken") }; setTimeout(wait, 400) }
  if (e.key === LOCKK && tabBlocked && takeoverAsked) { try { const l = JSON.parse(e.newValue || "null"); if (!l || !l.id || l.to === TAB) location.reload() } catch (x) {} }
});
let takeoverAsked = false;
function showTabBlock(kind) {
  const el = $h("h_tab"); if (!el) return; el.hidden = false;
  el.innerHTML = `<div class="rep small"><h3>${kind === "taken" ? "This run moved to another tab" : "This run is live in another tab"}</h3><div class="sub">${kind === "taken" ? "It was paused and saved here first. This tab is now read-only and never saves." : "Only one tab may run and save it, or the saved run could be damaged."}</div><div class="chips" style="margin-top:12px">${kind === "taken" ? `<button class="chip on" id="tb_close">OK, read-only</button>` : `<button class="chip on" id="tb_take">Take over</button><button class="chip" id="tb_ro">View read-only</button>`}</div></div>`;
  const ro = $h("tb_ro") || $h("tb_close"); if (ro) ro.onclick = () => { el.hidden = true; readOnly = true; restoreWait = false; CLK.state = "paused"; drawRestore(); drawRun() };
  const tk = $h("tb_take"); if (tk) tk.onclick = () => { takeoverAsked = true; tk.textContent = "Waiting for the other tab to pause and save…"; try { localStorage.setItem("pt_host_takeover", JSON.stringify({ by: TAB, t: Date.now() })) } catch (x) {} setTimeout(() => { try { const l = JSON.parse(localStorage.getItem(LOCKK) || "null"); if (!l || !l.id || Date.now() - l.t > 6000) location.reload() } catch (x) { location.reload() } }, 7000) };
}

/* ---- checks on every snapshot (Fix 9); every failure is counted, logged and shown in the report ---- */
let invOk = 0, invBad = 0;
function checkInvariants(sn, rr, trades) {
  const bad = [], t = sn.tot, rs = Object.entries(rr);
  if (rs.some(([, r]) => r.vnow !== sn.g)) bad.push("one clock: a desk is not at the Master's time");
  let se = 0, sp = 0, sf = 0, sTd = 0; for (const [d, r] of rs) { const x = sn.desks[d]; se += r.mc ? r.mc.eq : Math.round(r.eq * 100); sp += x.eq - x.start; sf += x.bb + x.bs; sTd += r.todayN || 0 }
  if (se !== t.eq) bad.push(`desk balances add up to ${D$(se)}, total ${D$(t.eq)}`); if (sp !== t.eq - t.start) bad.push("desk profits do not add up to the total profit");
  if (sf !== t.bb + t.bs) bad.push(`fees burned: desks ${D$(sf)} vs total ${D$(t.bb + t.bs)}`);
  if (sTd !== t.todayN) bad.push(`trades today: total ${t.todayN} vs desks ${sTd}`);
  const full = rs.length >= NDESK; if (!full) todayPrev = null;   // while desks are still joining (start or restore) only the per-snapshot sums are checked
  if (todayPrev && todayPrev.dk === sn.dk) { const dTd = t.todayN - todayPrev.n, dTr = trades - todayPrev.trades; if (dTd !== dTr) bad.push(`trades today moved ${todayPrev.n} → ${t.todayN} while ${dTr} trades closed`) } else if (todayPrev && t.todayN !== 0 && sn.g % 86400 === HSIM0 % 86400) bad.push(`trades today did not reset at midnight (${t.todayN})`);
  if (full) todayPrev = { dk: sn.dk, n: t.todayN, trades };
  for (const [d, r] of rs) { const x = sn.desks[d], nm = DN[d - 1]; if (r.buysOk != null && r.buysOk !== r.wn + r.ln + r.open) bad.push(`${nm}: ${r.buysOk} coins bought, but ${r.wn} won + ${r.ln} lost + ${r.open} open = ${r.wn + r.ln + r.open}`);
    if (r.mc && Math.abs(Math.round(r.eq * 100) - r.mc.eq) > (r.open || 0) + 1) bad.push(`${nm}: balance in cents ${D$(r.mc.eq)} does not match the desk's own balance ${D$(Math.round(r.eq * 100))} (money outside the counted accounts)`);
    if (x.eq - x.start !== x.w + x.l + x.openPl - x.bb + x.y) bad.push(`${nm}: profit ${SG$(x.eq - x.start)} vs won + lost + open − failed-buy fees + interest ${SG$(x.w + x.l + x.openPl - x.bb + x.y)}`) }
  if (full) { if (trades < maxTrades) bad.push(`total trades went down ${maxTrades} → ${trades}`); maxTrades = Math.max(maxTrades, trades) }
  const daySum = Object.values(sn.days).reduce((a, x) => a + x.n, 0); if (daySum !== trades) bad.push(`daily table adds up to ${daySum} trades, total ${trades}`);
  const rec = reconcile(sn); if (rec.unexplained !== 0) bad.push(`report does not reconcile: unexplained ${SG$(rec.unexplained)}`);
  const rows = dayRows(sn); if (rows.length !== dayN(sn.g) - ((sn.g - CLK.g0) % 86400 === 0 && sn.g > CLK.g0 ? 1 : 0) && rows.length) bad.push(`daily table has ${rows.length} rows for ${dayN(sn.g)} days`);
  const chain = full && rows.filter(r => r.eod != null).find(r => r.chainErr); if (chain) bad.push(`Day ${chain.day}: end balance does not follow from the day before (off ${SG$(chain.chainErr)})`);
  if (bad.length) { invBad++; WARN.inv += bad.length; for (const b of bad) diag("invariant", b) } else invOk++;
}
// screen checks (same snapshot id everywhere, one speed id everywhere), run after each draw
function checkScreen() {
  const ids = ["h_kv", "sumbar", "h_wl"].map(id => ($h(id) || {}).dataset && $h(id).dataset.snap).filter(Boolean);
  if (new Set(ids).size > 1) { invBad++; WARN.inv++; diag("invariant", `bottom bar and main panel show different snapshots (${ids.join(" / ")})`) }
  const sp = ["rn_speedline", "rn_hudkv", "br_trades"].map(id => ($h(id) || {}).dataset && $h(id).dataset.spd).filter(Boolean);
  if (new Set(sp).size > 1) { invBad++; WARN.inv++; diag("invariant", `speed shown from different measurements (${sp.join(" / ")})`) }
}

/* ---- the day-by-day table (Fix 3) and the reconciliation (Fix 4), all in cents, from one snapshot ---- */
function dayRows(sn) {
  sn = sn || SNAP; if (!sn) return []; const last = dayN(sn.g) - ((sn.g - CLK.g0) % 86400 === 0 && sn.g > CLK.g0 ? 1 : 0), rows = [];
  let prev = DAYS.__start || { eod: sn.tot.start, open: 0, bb: 0, y: 0 };
  for (let n = 1; n <= last; n++) {
    const k = isoOfDay(n), x = sn.days[k] || { n: 0, w: 0, l: 0, made: 0, lost: 0 }, rec = DAYS[k], cur = rec || { eod: sn.tot.eq, open: sn.tot.openPl, bb: sn.tot.bb, y: sn.tot.y }, st = DSTATE[k] || {};
    const net = x.made + x.lost, dOpen = cur.open - prev.open, dBb = -(cur.bb - prev.bb), dY = cur.y - prev.y, chainErr = cur.eod - (prev.eod + net + dOpen + dBb + dY);
    const notes = []; if (st.nonew) notes.push(`No new trades for ${fmtDur(st.nonew)} (set by you)`); if (st.skip) notes.push(`skipped ahead ${fmtDur(st.skip)}`); if (!x.n && !st.nonew && !st.skip) notes.push(`No coin passed the checks${rec && rec.scanned != null ? ` (${(rec.scanned - (prev.scanned || 0)).toLocaleString()} coins checked)` : ""}`);
    if (rec && MONEY.bank) { const b = bankOf(k); if (b.length) notes.push(b.join("; ")) }
    rows.push({ day: n, k, date: dateLabel(CLK.g0 + (n - 1) * 86400), n: x.n, w: x.w, l: x.l, made: x.made, lost: x.lost, net, dOpen, dBb, dY, eod: rec ? rec.eod : null, now: rec ? null : sn.tot.eq, chainErr: rec ? chainErr : 0, notes: notes.join("; ") });
    prev = cur;
  }
  return rows;
}
function reconcile(sn) { sn = sn || SNAP; const t = sn.tot, total = t.eq - t.start, realised = Object.values(sn.days).reduce((a, x) => a + x.made + x.lost, 0), parts = realised + t.openPl - t.bb + t.y; return { total, realised, open: t.openPl, bb: -t.bb, bs: t.bs, y: t.y, rounding: 0, unexplained: total - parts } }
function bankOf(k) { const out = []; for (const [d, r] of Object.entries(R)) for (const b of ((r.money || {}).bankLog || [])) if (b.day === k) out.push(`${DN[d - 1]} banked at ${hhmm(b.at)} with ${sg(b.pnl)}`); return out }

/* ---- money features: the Master owns the toggles and sends them to every desk (Part 3) ---- */
function sendMoney(d) { const v = Object.assign({}, MONEY, { alloc: ALLOC[d] || 1 }); delete v.tournament; post(d, { ptcmd: "money", v }) }
function setMoney(k, v) { if (MONEY[k] === v) return; setLog("Money: " + (MONEYN[k] || k), String(MONEY[k]), String(v)); MONEY[k] = v; try { localStorage.setItem("pt_host_money", JSON.stringify(MONEY)) } catch (e) {} for (const d of readyDesks()) sendMoney(d); if (k === "tournament" && v) startTournament(); if (k === "smart" && !v) { for (const d of readyDesks()) ALLOC[d] = 1; for (const d of readyDesks()) sendMoney(d) } buildMoney() }
const MONEYN = { ladder: "Write-off ladder", slipPlus: "Ladder extra slippage %", prebuy: "Pre-buy sellability check", ftc: "Failed-sell cost control", bank: "Bank the day", bankTarget: "Bank-the-day target $", memory: "Coin pattern memory", cold: "Cold-desk size steps", smart: "Smart allocation", tournament: "Mode tournament" };
const TMODES = ["lots", "max", "most", "runner", "tight"];
function startTournament() { const ds = readyDesks(); ds.forEach((d, i) => { const m = i === 0 ? "lots" : TMODES[i % TMODES.length]; sendTo(d, "preset", m); (MODELOG[isoDay(CLK.g)] || (MODELOG[isoDay(CLK.g)] = {}))[d] = m }); actLog(`Mode tournament on: ${ds.map((d, i) => DN[d - 1] + " " + (MODEN[i === 0 ? "lots" : TMODES[i % TMODES.length]])).join(", ")}. ${DN[ds[0] - 1]} stays on Lots of trades as the control.`) }
function onMidnight(sn, rr, pd) {
  // Smart allocation (Money 1): rank desks by the last 3 days' expectancy; top 2 size up (max 2x), the bottom one down 25% (floor 25%)
  if (MONEY.smart) { const keys = [0, 1, 2].map(i => isoDay(sn.g - 1 - i * 86400)), sc = Object.keys(rr).map(d => { let n = 0, p = 0; for (const k of keys) { const y = (rr[d].dayc || {})[k]; if (y) { n += y.n; p += y.made + y.lost } } return { d: +d, n, e: n ? p / n : 0 } }).filter(x => x.n >= 10).sort((a, b) => b.e - a.e);
    if (sc.length >= 3) { const msg = []; sc.forEach((x, i) => { const old = ALLOC[x.d] || 1; let nw = old; if (i < 2) nw = Math.min(2, +(old * 1.25).toFixed(3)); else if (i === sc.length - 1) nw = Math.max(0.25, +(old * 0.75).toFixed(3)); ALLOC[x.d] = nw; msg.push(`${DN[x.d - 1]} ${SG$(Math.round(x.e))}/trade → ${nw}x`) }); ALLOCLOG.push({ g: sn.g, msg: msg.join(", ") }); actLog("Smart allocation for " + simLabel(sn.g) + ": " + msg.join(", ")); for (const d of readyDesks()) sendMoney(d) }
    else actLog("Smart allocation: not enough trades in the last 3 days to rank the desks (10 a desk needed); sizes unchanged") }
  // Mode tournament (Money 2): rank the modes by yesterday's expectancy (30+ trades); the worst desk copies the best mode; desk 1 stays the control
  if (MONEY.tournament) { const ml = MODELOG[pd] || {}, rk = Object.keys(rr).map(d => { const y = (rr[d].dayc || {})[pd] || { n: 0, made: 0, lost: 0 }; return { d: +d, mode: ml[d] || rr[d].mode, n: y.n, e: y.n ? (y.made + y.lost) / y.n : 0 } }).filter(x => x.n >= 30).sort((a, b) => b.e - a.e);
    const nextDay = isoDay(sn.g), nm = MODELOG[nextDay] || (MODELOG[nextDay] = {}); for (const d of Object.keys(rr)) nm[d] = ml[d] || rr[d].mode;
    if (rk.length >= 2) { const best = rk[0], worst = rk.filter(x => x.d !== readyDesks()[0]).slice(-1)[0]; if (worst && worst.mode !== best.mode) { sendTo(worst.d, "preset", best.mode); nm[worst.d] = best.mode; actLog(`Tournament: ${MODEN[best.mode] || best.mode} was best yesterday (${SG$(Math.round(best.e))}/trade over ${best.n} trades); ${DN[worst.d - 1]} switches from ${MODEN[worst.mode] || worst.mode} (${SG$(Math.round(worst.e))}/trade)`) } }
    else actLog("Tournament: fewer than 2 desks had 30+ trades yesterday; modes unchanged") }
}
