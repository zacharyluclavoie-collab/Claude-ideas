/* Master board: runs the app 5 times (one iframe per desk) and adds their results together. Each desk reports once a second. */
// Arbitrum replaced Ethereum: Ethereum network fees (~$5 a trade) blocked almost every trade
const AREAS = ["Solana", "Base", "BSC", "Arbitrum", "Big coins"]; let NDESK = 5; try { NDESK = Math.max(1, Math.min(25, +localStorage.getItem("pt_host_n") || 5)) } catch (e) {}
const DN = [...Array(NDESK)].map((_, i) => AREAS[i % 5] + (i >= 5 ? " " + (Math.floor(i / 5) + 1) : "")), R = {}, hist = [], MODEN = { recommended: "Recommended", easy: "Easy", risky: "Risky", most: "Most money", lots: "Lots of trades", max: "Max trades", safe: "Recommended" };
const $h = id => document.getElementById(id), escH = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n, d = 2) => (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const sg = (n, d = 2) => (n >= 0 ? "+" : "-") + "$" + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
let cur = 0;
function deskDoc(i) { return APP_DOC.replace("<!--DESK-->", "<script>window.DESK=" + i + ";window.DESKN=" + NDESK + "<\/script>") }
for (let i = 1; i <= NDESK; i++) {
  const f = document.createElement("iframe"); f.title = DN[i - 1] + " desk"; f.className = "hframe"; f.hidden = true;
  f.srcdoc = deskDoc(i); $h("hframes").appendChild(f);
}
const bar = $h("deskbar"); if (NDESK > 5) bar.classList.add("many");
bar.innerHTML = ["Master"].concat(DN).map((n, i) => `<button data-d="${i}" class="${i === 0 ? "on" : ""}"><span class="dot" id="hd_${i}"></span>${n}</button>`).join("");
bar.onclick = e => { const b = e.target.closest("button"); if (b) show(+b.dataset.d) };
function show(d) { cur = d; $h("hmaster").hidden = d !== 0; document.querySelectorAll(".hframe").forEach((f, i) => f.hidden = i + 1 !== d); bar.querySelectorAll("button").forEach(b => b.classList.toggle("on", +b.dataset.d === d)); if (d === 0) draw() }
window.addEventListener("message", e => { const m = e.data; if (m && m.pt && m.desk && !m.hb) { R[m.desk] = m; if (cur === 0) draw(); dots() } });
function dots() { for (let i = 1; i <= NDESK; i++) { const r = R[i], el = $h("hd_" + i); if (el) el.className = "dot " + (!r ? "" : r.eq >= r.start ? "g" : "r") } }
function totals() { const t = { eq: 0, start: 0, w: 0, wn: 0, l: 0, ln: 0, open: 0, openPl: 0, today: 0, todayN: 0, scanned: 0, ch1h: 0, ch24h: 0 }; for (const r of Object.values(R)) for (const k in t) t[k] += r[k] || 0; return t }
try { const h = JSON.parse(localStorage.getItem("pt_host_hist2") || "null"); if (h && h.n === NDESK && Array.isArray(h.v)) hist.push(...h.v.slice(-1500)) } catch (e) {}   // the Master chart survives reloads
setInterval(() => { const t = totals(); if (Object.keys(R).length) { hist.push(t.eq - t.start); if (hist.length > 1800) hist.shift() } }, 1000);   // total profit/loss, so a desk joining late never makes the line jump
setInterval(() => { try { localStorage.setItem("pt_host_hist2", JSON.stringify({ n: NDESK, v: hist.slice(-1800) })) } catch (e) {} }, 20000);
let built = false; const lastSeen = {};
function buildBoard() {
  built = true;
  $h("h_kv").innerHTML = [["Won", "hk_w", "g", "hk_wn"], ["Lost", "hk_l", "r", "hk_ln"], ["Open now", "hk_o", "", "hk_on"], ["Trades today", "hk_td", "", ""], ["Win rate", "hk_wr", "", ""], ["Avg win / avg loss", "hk_avg", "", "hk_avgs"]]
    .map(x => `<div><span>${x[0]}</span><b id="${x[1]}" class="num ${x[2]}">–</b>${x[3] ? `<span id="${x[3]}"></span>` : ""}</div>`).join("");
  $h("h_desks").innerHTML = DN.map((name, i) => `<div class="panel hdesk rise" data-d="${i + 1}" id="dk${i + 1}" style="margin:10px 0;cursor:pointer;animation-delay:${i * 70}ms">
    <div class="row"><span class="dkname"><span class="cb cb-${(AREAS[i % 5] || "").split(" ")[0].toLowerCase()}">${["SOL", "BASE", "BSC", "ARB", "ALL"][i % 5]}</span><b>${name}</b></span><b id="dkp${i + 1}" class="num">starting…</b></div><div class="spark" id="dks${i + 1}"></div>
    <div class="sub" style="margin-top:4px"><span id="dke${i + 1}" class="num"></span> · <span id="dki${i + 1}"></span></div>
    <div class="sub" style="margin-top:4px" id="dkw${i + 1}"></div><div class="sub" style="margin-top:4px;opacity:.75" id="dkl${i + 1}"></div>
    <div class="dkctl" data-d="${i + 1}"><select data-act="mode" aria-label="Mode for ${DN[i]}">${PRM.map(x => `<option value="${x[0]}">${x[1]}</option>`).join("")}</select><button class="chip" data-act="pause" id="dkpz${i + 1}">Pause</button><button class="chip" data-act="close">Sell all</button><button class="chip" data-act="open">Open</button></div></div>`).join("");
  document.querySelectorAll(".dkctl").forEach(el => { el.onclick = e => e.stopPropagation(); const d = +el.dataset.d;
    el.querySelector("select").onchange = e => sendTo(d, "preset", e.target.value);
    el.querySelectorAll("button").forEach(b => b.onclick = e => { e.stopPropagation(); const a = b.dataset.act, r = R[d];
      if (a === "pause") sendTo(d, "pause", !(r && r.paused)); else if (a === "open") show(d);
      else if (a === "close") { if (b.dataset.arm) { delete b.dataset.arm; b.textContent = "Sell all"; sendTo(d, "closeall") } else { b.dataset.arm = 1; b.textContent = "Tap again"; setTimeout(() => { delete b.dataset.arm; b.textContent = "Sell all" }, 3500) } } }) });
  document.querySelectorAll(".hdesk").forEach(el => el.onclick = () => show(+el.dataset.d));
}
const CHN = { solana: "SOL", base: "BASE", bsc: "BSC", ethereum: "ETH", arbitrum: "ARB" };
function drawRates(t) {
  const pl = t.eq - t.start, hrs = Math.max(0, ...Object.values(R).map(r => r.hours || 0)), perH = hrs > 0.05 ? pl / hrs : 0, c = v => v >= 0 ? "num g" : "num r";
  if (!$h("hr_1h")) $h("h_rate").innerHTML = [["⏱ Last hour", "hr_1h"], ["📅 Last 24 hours", "hr_24h"], ["🪙 Coins open", "hr_open", "hr_opens"], ["⚡ Per hour", "hr_ph"], ["📈 Per day", "hr_pd", "hr_pds"], ["⏳ Running for", "hr_run", "hr_runs"]]
    .map(x => `<div><span>${x[0]}</span><b id="${x[1]}" class="num">–</b>${x[2] ? `<span id="${x[2]}"></span>` : ""}</div>`).join("");
  anim("hr_1h", t.ch1h, v => sg(v)); $h("hr_1h").className = c(t.ch1h); anim("hr_24h", t.ch24h, v => sg(v)); $h("hr_24h").className = c(t.ch24h);
  anim("hr_open", t.open, v => String(Math.round(v)), 1); $h("hr_opens").textContent = "in all desks";
  anim("hr_ph", perH, v => sg(v), 0); $h("hr_ph").className = c(perH);
  if (hrs >= 6) { anim("hr_pd", perH * 24, v => sg(v), 0); $h("hr_pd").className = c(perH); $h("hr_pds").textContent = "" } else { $h("hr_pd").textContent = "–"; $h("hr_pds").textContent = "after 6 h of data" }
  $h("hr_run").textContent = hrs < 48 ? hrs.toFixed(1) + " h" : (hrs / 24).toFixed(1) + " days"; $h("hr_runs").textContent = Object.values(R).some(r => !r.live) ? "demo time" : "";
}
let openSeen = new Set(), openAll = false;
function drawOpen() {
  const all = []; for (let i = 1; i <= NDESK; i++) for (const p of ((R[i] && R[i].pos) || [])) all.push(Object.assign({ desk: DN[i - 1], d: i }, p));
  all.sort((a, b) => b.pnl - a.pnl); $h("h_opencount").textContent = all.length ? all.length + " across " + new Set(all.map(a => a.d)).size + " desks" : "";
  const fmtH = h => h < 1 ? Math.round(h * 60) + "m" : h.toFixed(1) + "h";
  const nowKeys = new Set(all.map(a => a.d + a.sym));
  const lim = openAll ? 60 : 5, row = a => `<div class="orow one${openSeen.size && !openSeen.has(a.d + a.sym) ? " new" : ""}" data-d="${a.d}"><div class="ol"><b>${escH(a.sym)}</b> <span class="sub">${escH(a.desk)} · ${fmtH(a.held)}${a.exit ? " · exiting" : ""}</span></div><div class="oval"><b class="${a.pnl >= 0 ? "g" : "r"}">${a.pct >= 0 ? "+" : ""}${a.pct.toFixed(1)}%</b> <span class="sub">${sg(a.pnl)}</span></div></div>`;
  $h("h_open").innerHTML = all.length ? all.slice(0, lim).map(row).join("") + (all.length > 5 ? `<button class="chip more" id="openmore">${openAll ? "Show less" : "Show all " + all.length}</button>` : "")
    : '<div class="sub">No coins open right now. The desks buy when a coin passes every check.</div>';
  { const b = $h("openmore"); if (b) b.onclick = e => { e.stopPropagation(); openAll = !openAll; touchHold = 0; drawOpen() } }
  $h("h_open").querySelectorAll(".orow").forEach(el => el.onclick = () => show(+el.dataset.d));
  openSeen = nowKeys.size ? nowKeys : new Set(["-"]);
}
let touchHold = 0; ["pointerdown", "touchstart", "mousedown"].forEach(t => document.addEventListener(t, () => { touchHold = performance.now() + 700 }, { capture: true, passive: true }));
["pointerup", "touchend", "mouseup", "pointercancel"].forEach(t => document.addEventListener(t, () => { touchHold = Math.min(touchHold, performance.now() + 250) }, { capture: true, passive: true }));
/* ---- live scanner feed: what every desk is checking right now, plus coins checked per minute ---- */
const OUTN = { bought: ["🟢", "bought"], learning: ["🎓", "practice"], vetoed: ["✋", "skipped"], security: ["🛡", "failed safety"], strategy: ["🔍", "not good enough"], failed: ["⚠️", "buy failed"] };
let feedSeen = new Set(), checkHist = [];
function drawFeed() {
  const tot = Object.values(R).reduce((a, r) => a + (r.checks || 0), 0), now = Date.now(); checkHist.push([now, tot]); while (checkHist.length > 2 && now - checkHist[0][0] > 60000) checkHist.shift();
  const perMin = checkHist.length > 1 ? (tot - checkHist[0][1]) / ((now - checkHist[0][0]) / 60000) : 0;
  const watched = Object.values(R).reduce((a, r) => a + (r.scanned || 0), 0); $h("h_rate2").textContent = perMin > 0 ? watched.toLocaleString() + " coins watched · " + Math.round(perMin).toLocaleString() + " checks a minute" : "";
  const items = []; for (let i = 1; i <= NDESK; i++) for (const f of ((R[i] && R[i].feed) || [])) items.push(Object.assign({ desk: DN[i - 1], k: i + "|" + f.t + "|" + f.sym }, f));
  items.sort((a, b) => (b.o === "bought") - (a.o === "bought") || b.t - a.t);   // buys first, then newest
  const seenSym = new Set(), perDesk = {}, top = []; for (const x of items) { const k2 = x.desk + x.sym; if (seenSym.has(k2) || (perDesk[x.desk] || 0) >= 2) continue; seenSym.add(k2); perDesk[x.desk] = (perDesk[x.desk] || 0) + 1; top.push(x); if (top.length >= 5) break }
  const keys = new Set(top.map(x => x.k));
  $h("h_feed").innerHTML = top.length ? top.map(x => { const o = OUTN[x.o] || ["•", x.o]; return `<div class="frow${feedSeen.size && !feedSeen.has(x.k) ? " new" : ""}"><span class="fi">${o[0]}</span><div class="ft"><b>${escH(x.sym)}</b> <span class="sub">${escH(x.desk)} · ${o[1]}</span><div class="sub fd">${escH(x.d)}</div></div></div>` }).join("") : '<div class="sub">Starting the scanners…</div>';
  feedSeen = keys.size ? keys : new Set(["-"]);
}
const vsw = $h("viewsw"); let simple = true; try { simple = localStorage.getItem("pt_host_simple") !== "0" } catch (e) {}   // Simple view is the default: less to scroll
const applyView = () => { document.body.classList.toggle("simple", simple); vsw.querySelectorAll("button").forEach(b => b.classList.toggle("on", (b.dataset.v === "simple") === simple)) };
vsw.onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (!v) return; simple = v === "simple"; try { localStorage.setItem("pt_host_simple", simple ? "1" : "0") } catch (e) {} applyView() }; applyView();
function draw() {
  if (performance.now() < touchHold) return;
  drawFeed();   // never swap a button out while it is being pressed
  if (!built) buildBoard();
  const t = totals(), pl = t.eq - t.start, n = Object.keys(R).length;
  { const el = $h("h_best"), rs = Object.values(R); if (el && rs.length) { const off = rs.filter(r => r.mode !== "lots"); el.innerHTML = off.length ? `⚠️ ${off.length} desk${off.length > 1 ? "s are" : " is"} not on the best mode <button id="fixbest">Fix</button>` : "★ All desks on the best tested mode"; el.className = "bestchk " + (off.length ? "warn" : "ok");
    const fb = $h("fixbest"); if (fb) fb.onclick = () => { for (let i = 1; i <= NDESK; i++) if (R[i] && R[i].mode !== "lots") sendTo(i, "preset", "lots") } } }
  { const el = $h("h_fa"); if (el) { el.textContent = FA ? "🤖 Full Auto on" + (faLog.length ? " · " + faLog.filter(l => Date.now() - l.t < 3600e3 && !/switched/.test(l.msg)).length + " fixes this hour" : "") : "✋ Full Auto off"; el.classList.toggle("off", !FA) } }
  { const el = $h("h_auto"), r0 = Object.values(R)[0] || {}, live = Object.values(R).some(r => r.live); if (el) el.innerHTML = live ? "⚡ Live market" : `⚙️ Market <b>${r0.simScale || "?"}×</b> ${autoSize ? "· Auto" : "· fixed"}${lastFps ? " · " + lastFps + " fps" : ""}${AP.on ? " · Autopilot on" : ""}` }
  anim("h_eq", t.eq, v => money(v), 0); { const pc = t.start ? (t.eq / t.start - 1) * 100 : 0, el = $h("h_pct"); if (el) { el.textContent = (pc >= 0 ? "▲ +" : "▼ ") + pc.toFixed(2) + "%"; el.className = "hero-pct " + (pc >= 0 ? "up" : "dn") } } drawRates(t); drawOpen();
  $h("h_sub").innerHTML = n ? `<span class="${pl >= 0 ? "g" : "r"}">${sg(pl)}</span> all time · <span class="${t.today >= 0 ? "g" : "r"}">${sg(t.today)}</span> today · ${n} of ${NDESK} desks running` : "Starting 5 desks…";
  anim("h_tot", pl, v => sg(v)); $h("h_tot").classList.toggle("g", pl >= 0); $h("h_tot").classList.toggle("r", pl < 0);
  { const wr = t.wn + t.ln ? t.wn / (t.wn + t.ln) : 0, C = 2 * Math.PI * 15.5, ring = $h("h_ring"); if (ring) { ring.style.strokeDasharray = (wr * C).toFixed(1) + " " + C.toFixed(1) } $h("h_ringlab").textContent = t.wn + t.ln ? "win rate " + Math.round(wr * 100) + "% · " + (t.wn + t.ln) + " trades" : "win rate –" }
  anim("hk_w", t.w, v => sg(v)); anim("hk_l", t.l, v => sg(v)); anim("hk_o", t.openPl, v => sg(v), 0); $h("hk_o").className = "num " + (t.openPl >= 0 ? "g" : "r");
  const pc = (k, w) => k + (k === 1 ? " " + w : " " + w + "s");
  $h("hk_wn").textContent = pc(t.wn, "coin"); $h("hk_ln").textContent = pc(t.ln, "coin"); $h("hk_on").textContent = pc(t.open, "coin");
  $h("hk_td").textContent = String(t.todayN); $h("hk_wr").textContent = t.wn + t.ln ? Math.round(100 * t.wn / (t.wn + t.ln)) + "%" : "–"; { const aw = t.wn ? t.w / t.wn : 0, al = t.ln ? t.l / t.ln : 0; $h("hk_avg").innerHTML = t.wn + t.ln ? `<em class="g">${sg(aw)}</em> / <em class="r">${sg(al)}</em>` : "–";
    $h("hk_avgs").textContent = t.wn && t.ln && al < 0 ? "wins are " + (aw / -al).toFixed(1) + "x the size of losses" : "" }
  for (let i = 1; i <= NDESK; i++) { const r = R[i]; if (!r) continue; const p = r.eq - r.start;
    anim("dkp" + i, p, v => sg(v)); $h("dkp" + i).className = "num " + (p >= 0 ? "g" : "r"); anim("dke" + i, r.eq, v => money(v), 0);
    { const sp = r.spark || [], el = $h("dks" + i); if (el && sp.length > 1) { const lo = Math.min(...sp, r.start), hi = Math.max(...sp, r.start), pd = (hi - lo) * 0.1 || 1, X = k => k / (sp.length - 1) * 100, Y = v => 28 - (v - lo + pd) / (hi - lo + 2 * pd) * 28;
      el.innerHTML = `<svg viewBox="0 0 100 28" preserveAspectRatio="none"><line x1="0" x2="100" y1="${Y(r.start)}" y2="${Y(r.start)}" stroke="var(--mut)" stroke-dasharray="2 3" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".6"/><path d="${sp.map((v, k) => (k ? "L" : "M") + X(k).toFixed(1) + " " + Y(v).toFixed(1)).join("")}" fill="none" stroke="${sp[sp.length - 1] >= r.start ? "var(--g)" : "var(--r)"}" stroke-width="1.8" vector-effect="non-scaling-stroke"/></svg>` } }
    $h("dki" + i).textContent = `${r.mode === "lots" ? "★ " : ""}${MODEN[r.mode] || r.mode} · ${r.status}${r.clock ? " · " + r.clock : ""}`;
    $h("dkw" + i).innerHTML = `<span class="g">${r.wn} won ${sg(r.w)}</span> · <span class="r">${r.ln} lost ${sg(r.l)}</span> · ${r.open} open · ${r.todayN} today`;
    { const sel = document.querySelector(`.dkctl[data-d="${i}"] select`); if (sel && document.activeElement !== sel && sel.value !== r.mode) sel.value = r.mode; const pz = $h("dkpz" + i); if (pz) { pz.textContent = r.shutdown ? "Stopped" : r.paused ? "Resume" : "Pause"; pz.classList.toggle("on", !!r.paused || !!r.shutdown) } }
    $h("dkl" + i).textContent = r.lastSym ? `Last: ${r.lastSym} ${String(r.last).slice(0, 70)}` : "";
    const key = r.lastSym + "|" + r.last; if (lastSeen[i] !== undefined && lastSeen[i] !== key) { const c = $h("dk" + i); c.classList.remove("pulse"); void c.offsetWidth; c.classList.add("pulse") } lastSeen[i] = key }
  const ch = $h("h_chart"), pts = Object.keys(R).length ? hist.concat([t.eq - t.start]) : []; if (pts.length > 1) { const lo = Math.min(...pts, 0), hi = Math.max(...pts, 0), pd = (hi - lo) * 0.12 || 1, w = 340, h = 120, X = i => 4 + i / (pts.length - 1) * (w - 8), Y = v => h - 4 - (v - lo + pd) / (hi - lo + 2 * pd) * (h - 8);
    const d = pts.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(""), up = pts[pts.length - 1] >= 0, c = up ? "var(--g)" : "var(--r)", lx = X(pts.length - 1), ly = Y(pts[pts.length - 1]);
    if (!ch.firstElementChild || ch.firstElementChild.tagName !== "svg") ch.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="120" preserveAspectRatio="none"><defs><linearGradient id="hg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".28"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><line id="hc_base" x1="0" x2="${w}" stroke="var(--mut)" stroke-dasharray="3 4" stroke-width="1" vector-effect="non-scaling-stroke"/><path id="hc_area" fill="url(#hg)"/><path id="hc_line" class="drawin" fill="none" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><span class="livedot" id="hc_dot"></span><span class="hc_lab" id="hc_lab"></span>`;
    const svg = ch.firstElementChild; svg.style.color = c; $h("hc_base").setAttribute("y1", Y(0)); $h("hc_base").setAttribute("y2", Y(0));
    $h("hc_area").setAttribute("d", d + `L${lx} ${h}L4 ${h}Z`); $h("hc_line").setAttribute("d", d); $h("hc_line").setAttribute("stroke", c);
    const dot = $h("hc_dot"); dot.className = "livedot " + (up ? "g" : "r"); dot.style.left = (lx / w * 100).toFixed(2) + "%"; dot.style.top = (ly / h * 100).toFixed(2) + "%";
    $h("hc_lab").textContent = "profit/loss " + sg(pts[pts.length - 1]) + " · last " + (pts.length < 120 ? pts.length + " s" : Math.round(pts.length / 60) + " min") }
  else ch.innerHTML = '<div class="sub" style="padding:46px 0;text-align:center">Collecting data…</div>';
}

/* ---- Master settings: one tap changes every desk ---- */
const PRM = [["recommended", "Recommended"], ["easy", "Easy"], ["risky", "Risky"], ["most", "Most money"], ["lots", "Lots of trades"], ["max", "Max trades"]];
const sendTo = (d, ptcmd, v) => { const f = document.querySelectorAll(".hframe")[d - 1]; try { f.contentWindow.postMessage({ ptcmd, v }, "*") } catch (e) {} };
const send = (ptcmd, v) => document.querySelectorAll(".hframe").forEach(f => { try { f.contentWindow.postMessage({ ptcmd, v }, "*") } catch (e) {} });
let capPick = 2000, resetArm = 0;
/* ---- FULL AUTO: runs the whole app for the best tested results ----
 * every 10 s: any desk off the best mode is put back on it; hand-made risk/selling/chain overrides are cleared (they tested worse);
 * a desk that stopped itself after a bad day is restarted when a new day begins; Auto market size stays on. Every action is logged. */
let FA = true; try { FA = localStorage.getItem("pt_host_fullauto") !== "0" } catch (e) {}
const faLog = []; let faDay = {};
const faNote = msg => { faLog.unshift({ t: Date.now(), msg }); faLog.length = Math.min(faLog.length, 30); const el = $h("fa_log"); if (el) drawFaLog() };
function drawFaLog() { const el = $h("fa_log"); if (el) el.innerHTML = faLog.length ? faLog.slice(0, 6).map(l => `<div class="sub" style="margin-top:3px">${new Date(l.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${escH(l.msg)}</div>`).join("") : '<div class="sub" style="margin-top:3px">Everything is already on the best settings.</div>' }
const faSeen = {}, faOnce = {}, faStart = Date.now();
window.addEventListener("message", e => { const m = e.data; if (m && m.pt && m.desk) faSeen[m.desk] = Date.now() });
const faEvery = (key, ms) => { const t = faOnce[key] || 0; if (Date.now() - t < ms) return false; faOnce[key] = Date.now(); return true };
function faLive() {   // real-market checks: small balances, failing data, quiet desks
  const rs = Object.values(R), live = rs.some(r => r.live), start = rs.reduce((a, r) => a + (r.start || 0), 0), tip = $h("fa_tip");
  if (live && NDESK > 1 && start > 0 && start < 500) { tip.hidden = false; tip.innerHTML = `💡 With ${money(start, 0)} in total, network fees eat small trades when it is split over ${NDESK} desks. <b>1 desk on Solana</b> works best for small balances. <button id="fa_one">Use 1 Solana desk</button>`;
    const b = $h("fa_one"); if (b) b.onclick = () => { try { localStorage.setItem("pt_host_n", "1") } catch (e) {} location.reload() } } else tip.hidden = true;
  if (!live) return;
  for (let i = 1; i <= NDESK; i++) { const r = R[i]; if (!r || !r.live) continue; const nm = DN[i - 1];
    if (r.data != null && r.data < 30 && faEvery("data" + i, 1800e3)) faNote(`${nm}: market data is failing (${r.data}% of requests work${r.dataErr ? ": " + r.dataErr : ""}); it keeps retrying by itself`);
    const idleH = r.lastBuyT ? (r.nowT - r.lastBuyT) / 3600 : (Date.now() - faStart) / 3600e3;
    if (idleH > 6 && faEvery("idle" + i, 6 * 3600e3)) faNote(`${nm}: no buys for ${Math.round(idleH)} h. Normal when few coins pass the safety checks; the live scanner shows why coins are skipped`) }
}
function faTick() {
  faLive();
  if (FA) for (let i = 1; i <= NDESK; i++) { const f = document.querySelectorAll(".hframe")[i - 1]; if (f && faSeen[i] && Date.now() - faSeen[i] > 60000 && faEvery("heal" + i, 120000)) { f.srcdoc = deskDoc(i); faSeen[i] = Date.now(); faNote(`${DN[i - 1]}: stopped responding, restarted it`) } }
  if (!FA) return; if (!autoSize) { autoSize = true; try { localStorage.setItem("pt_host_autosize", "1") } catch (e) {} }
  if (AP.on) { AP.on = false; apSave() }   // Full Auto replaces the Autopilot (which could move desks off the best mode)
  for (let i = 1; i <= NDESK; i++) { const r = R[i]; if (!r) continue; const nm = DN[i - 1];
    if (r.mode !== "lots" || r.custom) { sendTo(i, "fullauto"); faNote(`${nm}: back to ★ Lots of trades with the tested settings`) }
    if (r.shutdown && faDay[i] && r.day && r.day !== faDay[i]) { sendTo(i, "rearm"); faNote(`${nm}: new day, restarted after yesterday's stop`) }
    faDay[i] = r.day; sendTo(i, "fa", FA) }
}
setInterval(faTick, 10000); setTimeout(faTick, 4000);
function setFA(v) { FA = v; try { localStorage.setItem("pt_host_fullauto", v ? "1" : "0") } catch (e) {} send("fa", v); document.body.classList.toggle("fullauto", v); faNote(v ? "Full Auto switched on" : "Full Auto switched off: settings can be changed by hand"); if (v) faTick(); mark() }
function buildSet() {
  const PR = [["recommended", "Recommended"], ["easy", "Easy"], ["risky", "Risky"], ["most", "Most money"], ["lots", "Lots of trades"], ["max", "Max trades"]];
  const SP = [1, 15, 60, 300, 1000, 3000, 10000, 30000], CAP = [2, 10, 100, 1000, 2000, 10000];
  $h("h_set").innerHTML = `<div class="fabox"><div class="row"><b>🤖 Full Auto</b><span class="chips" id="fa_sel"><button class="chip" data-v="1">On</button><button class="chip" data-v="0">Off</button></span></div><div class="sub" style="margin-top:4px">Runs everything for the best tested results: every desk on ★ Lots of trades with the tested settings, biggest market your device handles, desks restarted after a bad day. While it is on, the settings below are locked.</div><div id="fa_log"></div><button class="btn" id="setup10" style="margin-top:10px">💲 Set up for $10 on the real market</button><div class="sub" id="setup10n">One desk on Solana with all $10 (splitting $10 over several desks lets fees eat every trade).${HOST_SW ? " Switches that desk to the live market." : " In this web version it stays on the demo market; use the laptop version for live data."} Full Auto stays on.</div></div><div class="fa-lock"><div class="sub"><b>Mode for every desk</b></div><div class="chips" id="hs_mode" style="margin-top:6px">${PR.map(x => `<button class="chip" data-v="${x[0]}">${x[1]}</button>`).join("")}</div>
    ${HOST_SW ? `<div class="sub" style="margin-top:12px"><b>Market data</b></div><div class="chips" id="hs_live" style="margin-top:6px"><button class="chip" data-v="live">Live market</button><button class="chip" data-v="mock">Demo (simulated)</button></div>` : ""}
    <div class="sub" style="margin-top:12px"><b>Demo speed</b> (live trading always runs in real time)</div><div class="chips" id="hs_speed" style="margin-top:6px">${SP.map(s => `<button class="chip" data-v="${s}">${s >= 30000 ? "Max" : s.toLocaleString() + "x"}</button>`).join("")}</div>
    ${HOST_SW ? "" : ""}<div class="sub" style="margin-top:12px"><b>Demo market size</b> (more coins to pick from: more trades and more coins open at once; uses more of your device)</div><div class="chips" id="hs_sim" style="margin-top:6px">${[[1, "1x small"], [5, "5x"], [10, "10x"], [20, "20x real-like"]].map(([v, n]) => `<button class="chip" data-v="${v}">${n}</button>`).join("")}<button class="chip" data-v="auto" id="hs_simauto">Auto</button></div><div class="sub" id="hs_simnote" style="margin-top:4px"></div>
    <div class="sub" style="margin-top:12px"><b>New trades</b></div><div class="chips" id="hs_pause" style="margin-top:6px"><button class="chip" data-v="0">Running</button><button class="chip" data-v="1">Paused</button></div>
    <div class="sub" style="margin-top:12px"><b>Number of desks</b> (more desks use more of your computer; on the live market they share the same coins and data limits)</div><div class="chips" id="hs_n" style="margin-top:6px">${[5, 10, 15, 20, 25].map(k => `<button class="chip ${k === NDESK ? "on" : ""}" data-v="${k}">${k}</button>`).join("")}</div>
    <div class="sub" style="margin-top:12px"><b>Start over</b>: starting balance for each desk</div><div class="chips" id="hs_cap" style="margin-top:6px">${CAP.map(c => `<button class="chip" data-v="${c}">$${c.toLocaleString()}</button>`).join("")}</div>
    <button class="btn red" id="hs_reset" style="margin-top:10px">Reset all desks</button><div class="sub" id="hs_note" style="margin-top:6px"></div>
    <div class="sub" style="margin-top:16px"><b>Risk for every desk</b> (on top of each desk's mode)</div>
    ${[["Trade size", "mr_size", 0.5, 2, 0.1, 1, "x"], ["Sell a loser at", "mr_stop", 2, 15, 0.5, 0, "%"], ["First take-profit at", "mr_tp1", 4, 30, 1, 0, "%"], ["Most coins open at once (per desk)", "mr_max", 5, 100, 5, 0, ""], ["Stop for the day after losing", "mr_dl", 1, 10, 0.5, 0, "%"]]
      .map(x => `<div class="mrow"><label for="${x[1]}">${x[0]}</label><input type="range" id="${x[1]}" min="${x[2]}" max="${x[3]}" step="${x[4]}" value="${x[5] || x[2]}"><b id="${x[1]}_v"></b><button class="chip" data-off="${x[1]}" title="Back to the mode's own value">Reset</button></div>`).join("")}
    <button class="btn pri" id="mr_apply" style="margin-top:8px">Apply risk to all desks</button><button class="btn" id="mr_clear">Use each mode's own risk</button>
    <div class="sub" style="margin-top:16px"><b>Quick actions</b></div>
    <div class="chips" style="margin-top:6px"><button class="chip" id="qa_best">Copy best desk's mode to all</button>${HOST_SW ? "" : `<button class="chip" data-skip="3600">Skip 1 hour</button><button class="chip" data-skip="86400">Skip 1 day</button><button class="chip" data-skip="259200">Skip 3 days</button>`}</div>
    <button class="btn" id="qa_close" style="margin-top:8px">Sell every open coin (all desks)</button>
    <button class="btn red" id="qa_kill">Emergency stop: sell everything and halt all desks</button>
    <button class="btn" id="qa_rearm">Restart all desks after a stop</button></div>`;
  const MR = { mr_size: 0, mr_stop: 0, mr_tp1: 0, mr_max: 0, mr_dl: 0 }; try { Object.assign(MR, JSON.parse(localStorage.getItem("pt_host_mr") || "{}")) } catch (e) {}
  const lab = id => { const el = $h(id), v = MR[id]; $h(id + "_v").textContent = v ? (id === "mr_size" ? "x" + (+v).toFixed(1) : id === "mr_max" ? String(v) : v + "%") : "auto"; if (v) el.value = v; el.classList.toggle("off", !v) };
  for (const id in MR) { lab(id); $h(id).oninput = e => { MR[id] = +e.target.value; lab(id) } }
  document.querySelectorAll("[data-off]").forEach(b => b.onclick = () => { MR[b.dataset.off] = 0; lab(b.dataset.off) });
  const pack = () => ({ size: MR.mr_size || 0, stop: MR.mr_stop || 0, tp1: MR.mr_tp1 || 0, maxPos: MR.mr_max || 0, dailyLoss: MR.mr_dl || 0 });
  $h("mr_apply").onclick = () => { try { localStorage.setItem("pt_host_mr", JSON.stringify(MR)) } catch (e) {} send("risk", pack()); $h("mr_apply").textContent = "Applied ✓"; setTimeout(() => $h("mr_apply").textContent = "Apply risk to all desks", 1500) };
  $h("mr_clear").onclick = () => { for (const id in MR) { MR[id] = 0; lab(id) } try { localStorage.removeItem("pt_host_mr") } catch (e) {} send("risk", null) };
  $h("qa_best").onclick = () => { const b = Object.values(R).sort((x, y) => (y.eq - y.start) - (x.eq - x.start))[0]; if (b) send("preset", b.mode) };
  document.querySelectorAll("[data-skip]").forEach(b => b.onclick = () => send("skip", +b.dataset.skip));
  const two = (id, label, fn) => { const b = $h(id), o = b.textContent; let arm = 0; b.onclick = () => { if (arm) { arm = 0; b.textContent = o; fn(); return } arm = 1; b.textContent = label; setTimeout(() => { arm = 0; b.textContent = o }, 4000) } };
  two("qa_close", "Tap again to sell every open coin", () => send("closeall"));
  two("qa_kill", "Tap again: sell everything and halt", () => send("kill"));
  $h("qa_rearm").onclick = () => send("rearm");
  $h("hs_n").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v && +v !== NDESK) { try { localStorage.setItem("pt_host_n", v) } catch (e) {} location.reload() } };
  { let arm = 0; $h("setup10").onclick = () => { const b = $h("setup10"); if (!arm) { arm = 1; b.textContent = "Tap again: 1 Solana desk with $10 (other desks are hidden)"; setTimeout(() => { arm = 0; b.textContent = "💲 Set up for $10 on the real market" }, 4000); return }
    try { localStorage.setItem("pt_host_n", "1"); localStorage.setItem("d1_pt_cap", "10"); localStorage.setItem("d1_pt_reset_pending", "1"); localStorage.removeItem("d1_pt_chains"); if (HOST_SW) localStorage.setItem("d1_pt_mode", "live"); localStorage.setItem("pt_host_fullauto", "1") } catch (e) {} location.reload() } }
  $h("fa_sel").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v != null) setFA(v === "1") };
  $h("hs_mode").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v) { send("preset", v); mark() } };
  if ($h("hs_live")) $h("hs_live").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v) send("mode", v) };
  $h("hs_sim").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (!v) return; if (v === "auto") { autoSize = !autoSize } else { autoSize = false; send("simscale", +v) } try { localStorage.setItem("pt_host_autosize", autoSize ? "1" : "0") } catch (e) {} mark() };
  $h("hs_speed").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v) send("speed", +v) };
  $h("hs_pause").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v != null) send("pause", v === "1") };
  $h("hs_cap").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v) { capPick = +v; mark() } };
  $h("hs_reset").onclick = () => { if (Date.now() - resetArm > 4000) { resetArm = Date.now(); $h("hs_reset").textContent = "Tap again to reset all " + NDESK + " desks to $" + capPick.toLocaleString() + " each"; return } resetArm = 0; send("reset", capPick); $h("hs_reset").textContent = "Reset all desks"; hist.length = 0 };
  mark();
}
function mark() {
  const rs = Object.values(R), all = (k, v) => rs.length && rs.every(r => String(r[k]) === String(v));
  document.querySelectorAll("#fa_sel .chip").forEach(b => b.classList.toggle("on", (b.dataset.v === "1") === FA));
  document.querySelectorAll("#hs_mode .chip").forEach(b => b.classList.toggle("on", all("mode", b.dataset.v)));
  document.querySelectorAll("#hs_sim .chip").forEach(b => b.classList.toggle("on", b.dataset.v === "auto" ? autoSize : !autoSize && all("simScale", b.dataset.v)));
  if ($h("hs_simnote")) $h("hs_simnote").textContent = autoSize ? "Auto: the biggest market your device runs smoothly (now " + ((Object.values(R)[0] || {}).simScale || "?") + "x, " + lastFps + " fps)" : "";
  document.querySelectorAll("#hs_speed .chip").forEach(b => b.classList.toggle("on", all("speed", b.dataset.v)));
  document.querySelectorAll("#hs_live .chip").forEach(b => b.classList.toggle("on", all("live", b.dataset.v === "live")));
  document.querySelectorAll("#hs_pause .chip").forEach(b => b.classList.toggle("on", all("paused", b.dataset.v === "1")));
  document.querySelectorAll("#hs_cap .chip").forEach(b => b.classList.toggle("on", +b.dataset.v === capPick));
  if ($h("hs_note")) $h("hs_note").textContent = "Resets every desk's paper account to $" + capPick.toLocaleString() + " (total $" + (capPick * NDESK).toLocaleString() + ").";
}
/* ---- Autopilot: looks at every desk on its own and adjusts it ----
 * - a desk whose last 20 trades lost money steps DOWN one mode (Max trades > Lots of trades > Most money > Recommended)
 * - a desk whose last 20 trades made money with a win rate of 55%+ steps back UP (never above Lots of trades by itself)
 * - a desk that stopped itself after losses is restarted when a new trading day begins
 * Each desk needs 20 new finished trades between changes, so it never flips back and forth on noise. Every action is logged. */
const LADDER = ["recommended", "most", "lots", "max"], AP = { on: false, last: {}, log: [] };
try { const a = JSON.parse(localStorage.getItem("pt_host_auto") || "{}"); AP.on = !!a.on; AP.log = a.log || [] } catch (e) {}
const apSave = () => { try { localStorage.setItem("pt_host_auto", JSON.stringify({ on: AP.on, log: AP.log.slice(0, 40) })) } catch (e) {} };
const apLog = msg => { AP.log.unshift({ t: Date.now(), msg }); AP.log.length = Math.min(AP.log.length, 40); apSave(); apDraw() };
function apTick() {
  if (!AP.on) return;
  for (let i = 1; i <= NDESK; i++) { const r = R[i]; if (!r) continue; const st = AP.last[i] || (AP.last[i] = { n: r.wn + r.ln, day: r.day }), name = DN[i - 1];
    if (r.shutdown && r.day && st.day && r.day !== st.day) { sendTo(i, "rearm"); apLog(`${name}: new trading day, restarted after yesterday's stop`) }
    st.day = r.day;
    if (r.wn + r.ln - st.n < 20 || !r.r20 || r.r20.n < 20) continue;
    const k = LADDER.indexOf(r.mode), wr = r.r20.w / r.r20.n;
    if (r.r20.pnl < 0 && k > 0) { sendTo(i, "preset", LADDER[k - 1]); st.n = r.wn + r.ln; apLog(`${name}: last 20 trades ${sg(r.r20.pnl)}, stepped down to ${MODEN[LADDER[k - 1]]}`) }
    else if (r.r20.pnl > 0 && wr >= 0.55 && k >= 0 && k < 2) { sendTo(i, "preset", LADDER[k + 1]); st.n = r.wn + r.ln; apLog(`${name}: last 20 trades ${sg(r.r20.pnl)} (${Math.round(wr * 100)}% won), stepped up to ${MODEN[LADDER[k + 1]]}`) }
    else st.n = r.wn + r.ln;
  }
}
function apDraw() { const el = $h("ap_log"); if (!el) return; el.innerHTML = AP.log.length ? AP.log.slice(0, 8).map(l => `<div class="sub" style="margin-top:4px">${new Date(l.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${escH(l.msg)}</div>`).join("") : `<div class="sub" style="margin-top:4px">${AP.on ? "Watching every desk. Nothing needed changing yet." : "Off."}</div>`;
  document.querySelectorAll("#ap_sel .chip").forEach(b => b.classList.toggle("on", (b.dataset.v === "1") === AP.on)) }
setInterval(apTick, 5000);
/* ---- Auto market size: the biggest demo market this device runs smoothly (more coins = more trades), checked every 20 s ---- */
const SIZES = [1, 5, 10, 20]; let autoSize = true, lastFps = 0, fpsOk = 0; try { autoSize = localStorage.getItem("pt_host_autosize") !== "0" } catch (e) {}
function measureFps(ms) { return new Promise(res => { let n = 0; const t0 = performance.now(); const f = t => { n++; if (t - t0 < ms) requestAnimationFrame(f); else res(Math.round(n * 1000 / (t - t0))) }; requestAnimationFrame(f) }) }
setInterval(async () => { if (!autoSize || document.hidden || Object.values(R).some(r => r.live)) return; lastFps = await measureFps(1500); const cur = (Object.values(R)[0] || {}).simScale || 5, k = SIZES.indexOf(cur);
  if (lastFps >= 52) { if (++fpsOk >= 2 && k >= 0 && k < SIZES.length - 1) { send("simscale", SIZES[k + 1]); fpsOk = 0 } } else { fpsOk = 0; if (lastFps < 35 && k > 0) send("simscale", SIZES[k - 1]) } }, 20000);
/* ---- theme: dark "pro" look by default, Light or match-device on request; desks follow the Master ---- */
let theme = "dark"; try { theme = localStorage.getItem("pt_host_theme") || "dark" } catch (e) {}
const themed = {};
function applyTheme() { if (theme === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme; send("theme", theme); document.querySelectorAll("#themesw button").forEach(b => b.classList.toggle("on", b.dataset.v === theme)) }
$h("themesw").onclick = e => { const b = e.target.closest("button"); if (!b) return; theme = b.dataset.v; try { localStorage.setItem("pt_host_theme", theme) } catch (e) {} applyTheme() };
window.addEventListener("message", e => { const m = e.data; if (m && m.pt && m.desk && !themed[m.desk]) { themed[m.desk] = 1; sendTo(m.desk, "theme", theme) } });
applyTheme();
/* ---- ticker tape: open coins and recent buys scrolling under the hero (refreshed every 12 s so the motion never restarts mid-way) ---- */
let tickTxt = "";
function drawTicker() {
  const items = []; for (let i = 1; i <= NDESK; i++) { const r = R[i]; if (!r) continue; for (const p of r.pos || []) items.push(`<span class="tk ${p.pct >= 0 ? "g" : "r"}"><b>${escH(p.sym)}</b> ${p.pct >= 0 ? "▲" : "▼"} ${Math.abs(p.pct).toFixed(1)}%</span>`);
    for (const f of (r.feed || []).filter(f => f.o === "bought").slice(0, 2)) items.push(`<span class="tk b">🟢 <b>${escH(f.sym)}</b> bought</span>`) }
  const html = items.length ? items.join("") : '<span class="tk">Scanning the market…</span>'; if (html === tickTxt) return; tickTxt = html;
  const tr = $h("tk_track"); tr.innerHTML = html + html; tr.style.animationDuration = Math.max(18, items.length * 3.5) + "s";
}
setInterval(drawTicker, 12000); setTimeout(drawTicker, 3000);
{ const g = $h("guide"); let gs = null; try { gs = localStorage.getItem("pt_host_guide") } catch (e) {} if (gs === "hidden") g.hidden = true; else g.open = gs === "open";   // folded by default: one line, tap to read
  g.addEventListener("toggle", () => { try { localStorage.setItem("pt_host_guide", g.open ? "open" : "closed") } catch (e) {} });
  $h("guide_hide").onclick = () => { g.hidden = true; try { localStorage.setItem("pt_host_guide", "hidden") } catch (e) {} } }
buildSet(); document.body.classList.toggle("fullauto", FA); drawFaLog();
{ const box = document.createElement("div"); box.innerHTML = `<div class="sub"><b>Autopilot</b>: steps a losing desk down to a safer mode, steps a steady winner back up, restarts desks that stopped themselves when a new day starts</div><div class="chips" id="ap_sel" style="margin-top:6px"><button class="chip" data-v="1">On</button><button class="chip" data-v="0">Off</button></div><div id="ap_log" style="margin:4px 0 14px"></div>`;
  box.className = "fa-lock"; const fb = document.querySelector("#h_set .fabox"); if (fb) fb.after(box); else $h("h_set").prepend(box); $h("ap_sel").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v == null) return; AP.on = v === "1"; AP.last = {}; apSave(); apLog(AP.on ? "Autopilot switched on" : "Autopilot switched off") }; apDraw() }
draw(); setInterval(() => { if (cur === 0) { draw(); mark() } }, 1000);
if (typeof HOST_SW !== "undefined" && HOST_SW && "serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
