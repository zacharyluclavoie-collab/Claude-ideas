/* Master board: runs the app 5 times (one iframe per desk) and adds their results together. Each desk reports once a second. */
const DN = ["Solana", "Base", "BSC", "Ethereum", "Big coins"], R = {}, hist = [], MODEN = { recommended: "Recommended", easy: "Easy", risky: "Risky", most: "Most money", lots: "Lots of trades", max: "Max trades", safe: "Recommended" };
const $h = id => document.getElementById(id), escH = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n, d = 2) => (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const sg = (n, d = 2) => (n >= 0 ? "+" : "-") + "$" + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
let cur = 0;
for (let i = 1; i <= 5; i++) {
  const f = document.createElement("iframe"); f.title = DN[i - 1] + " desk"; f.className = "hframe"; f.hidden = true;
  f.srcdoc = APP_DOC.replace("<!--DESK-->", "<script>window.DESK=" + i + "<\/script>"); $h("hframes").appendChild(f);
}
const bar = $h("deskbar");
bar.innerHTML = ["Master"].concat(DN).map((n, i) => `<button data-d="${i}" class="${i === 0 ? "on" : ""}"><span class="dot" id="hd_${i}"></span>${n}</button>`).join("");
bar.onclick = e => { const b = e.target.closest("button"); if (b) show(+b.dataset.d) };
function show(d) { cur = d; $h("hmaster").hidden = d !== 0; document.querySelectorAll(".hframe").forEach((f, i) => f.hidden = i + 1 !== d); bar.querySelectorAll("button").forEach(b => b.classList.toggle("on", +b.dataset.d === d)); if (d === 0) draw() }
window.addEventListener("message", e => { const m = e.data; if (m && m.pt && m.desk) { R[m.desk] = m; if (cur === 0) draw(); dots() } });
function dots() { for (let i = 1; i <= 5; i++) { const r = R[i], el = $h("hd_" + i); if (el) el.className = "dot " + (!r ? "" : r.eq >= r.start ? "g" : "r") } }
function totals() { const t = { eq: 0, start: 0, w: 0, wn: 0, l: 0, ln: 0, open: 0, openPl: 0, today: 0, todayN: 0, scanned: 0 }; for (const r of Object.values(R)) for (const k in t) t[k] += r[k] || 0; return t }
setInterval(() => { const t = totals(); if (Object.keys(R).length) { hist.push(t.eq); if (hist.length > 1500) hist.shift() } }, 2000);
function draw() {
  const t = totals(), pl = t.eq - t.start, n = Object.keys(R).length;
  $h("h_eq").textContent = money(t.eq); $h("h_sub").innerHTML = n ? `<span class="${pl >= 0 ? "g" : "r"}">${sg(pl)}</span> all time · <span class="${t.today >= 0 ? "g" : "r"}">${sg(t.today)}</span> today · ${n} of 5 desks running` : "Starting 5 desks…";
  $h("h_tot").textContent = sg(pl); $h("h_tot").className = pl >= 0 ? "g" : "r";
  $h("h_kv").innerHTML = [["Won", sg(t.w), "g", t.wn + (t.wn === 1 ? " coin" : " coins")], ["Lost", sg(t.l), "r", t.ln + (t.ln === 1 ? " coin" : " coins")], ["Open now", sg(t.openPl), t.openPl >= 0 ? "g" : "r", t.open + (t.open === 1 ? " coin" : " coins")], ["Trades today", String(t.todayN), "", ""], ["Win rate", t.wn + t.ln ? Math.round(100 * t.wn / (t.wn + t.ln)) + "%" : "–", "", ""], ["Coins scanned", t.scanned.toLocaleString(), "", ""]]
    .map(x => `<div><span>${x[0]}</span><b class="${x[2]}">${x[1]}</b>${x[3] ? `<span>${x[3]}</span>` : ""}</div>`).join("");
  $h("h_desks").innerHTML = DN.map((name, i) => { const r = R[i + 1]; if (!r) return `<div class="panel hdesk" data-d="${i + 1}" style="margin:10px 0"><b>${name}</b><div class="sub">starting…</div></div>`; const p = r.eq - r.start;
    return `<div class="panel hdesk" data-d="${i + 1}" style="margin:10px 0;cursor:pointer"><div class="row"><b>${name}</b><b class="${p >= 0 ? "g" : "r"}">${sg(p)}</b></div><div class="sub" style="margin-top:4px">${money(r.eq)} · ${escH(MODEN[r.mode] || r.mode)} · ${escH(r.status)}${r.clock ? " · " + escH(r.clock) : ""}</div>
      <div class="sub" style="margin-top:4px"><span class="g">${r.wn} won ${sg(r.w)}</span> · <span class="r">${r.ln} lost ${sg(r.l)}</span> · ${r.open} open · ${r.todayN} today</div>${r.lastSym ? `<div class="sub" style="margin-top:4px;opacity:.75">Last: ${escH(r.lastSym)} ${escH(String(r.last).slice(0, 70))}</div>` : ""}</div>` }).join("");
  document.querySelectorAll(".hdesk").forEach(el => el.onclick = () => show(+el.dataset.d));
  const ch = $h("h_chart"); if (hist.length > 1) { const lo = Math.min(...hist, t.start), hi = Math.max(...hist, t.start), pd = (hi - lo) * 0.12 || t.start * 0.001 || 1, w = 340, h = 120, X = i => 4 + i / (hist.length - 1) * (w - 8), Y = v => h - 4 - (v - lo + pd) / (hi - lo + 2 * pd) * (h - 8);
    const d = hist.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(""), c = hist[hist.length - 1] >= t.start ? "var(--g)" : "var(--r)";
    ch.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="120" preserveAspectRatio="none"><line x1="0" x2="${w}" y1="${Y(t.start)}" y2="${Y(t.start)}" stroke="var(--mut)" stroke-dasharray="3 4" stroke-width="1"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>` }
  else ch.innerHTML = '<div class="sub" style="padding:46px 0;text-align:center">Collecting data…</div>';
}
/* ---- Master settings: one tap changes every desk ---- */
const send = (ptcmd, v) => document.querySelectorAll(".hframe").forEach(f => { try { f.contentWindow.postMessage({ ptcmd, v }, "*") } catch (e) {} });
let capPick = 2000, resetArm = 0;
function buildSet() {
  const PR = [["recommended", "Recommended"], ["easy", "Easy"], ["risky", "Risky"], ["most", "Most money"], ["lots", "Lots of trades"], ["max", "Max trades"]];
  const SP = [1, 15, 60, 300, 1000, 3000, 10000, 30000], CAP = [2, 10, 100, 1000, 2000, 10000];
  $h("h_set").innerHTML = `<div class="sub"><b>Mode for every desk</b></div><div class="chips" id="hs_mode" style="margin-top:6px">${PR.map(x => `<button class="chip" data-v="${x[0]}">${x[1]}</button>`).join("")}</div>
    ${HOST_SW ? `<div class="sub" style="margin-top:12px"><b>Market data</b></div><div class="chips" id="hs_live" style="margin-top:6px"><button class="chip" data-v="live">Live market</button><button class="chip" data-v="mock">Demo (simulated)</button></div>` : ""}
    <div class="sub" style="margin-top:12px"><b>Demo speed</b> (live trading always runs in real time)</div><div class="chips" id="hs_speed" style="margin-top:6px">${SP.map(s => `<button class="chip" data-v="${s}">${s >= 30000 ? "Max" : s.toLocaleString() + "x"}</button>`).join("")}</div>
    <div class="sub" style="margin-top:12px"><b>New trades</b></div><div class="chips" id="hs_pause" style="margin-top:6px"><button class="chip" data-v="0">Running</button><button class="chip" data-v="1">Paused</button></div>
    <div class="sub" style="margin-top:12px"><b>Start over</b>: starting balance for each desk</div><div class="chips" id="hs_cap" style="margin-top:6px">${CAP.map(c => `<button class="chip" data-v="${c}">$${c.toLocaleString()}</button>`).join("")}</div>
    <button class="btn red" id="hs_reset" style="margin-top:10px">Reset all 5 desks</button><div class="sub" id="hs_note" style="margin-top:6px"></div>`;
  $h("hs_mode").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v) { send("preset", v); mark() } };
  if ($h("hs_live")) $h("hs_live").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v) send("mode", v) };
  $h("hs_speed").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v) send("speed", +v) };
  $h("hs_pause").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v != null) send("pause", v === "1") };
  $h("hs_cap").onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v) { capPick = +v; mark() } };
  $h("hs_reset").onclick = () => { if (Date.now() - resetArm > 4000) { resetArm = Date.now(); $h("hs_reset").textContent = "Tap again to reset all 5 desks to $" + capPick.toLocaleString() + " each"; return } resetArm = 0; send("reset", capPick); $h("hs_reset").textContent = "Reset all 5 desks"; hist.length = 0 };
  mark();
}
function mark() {
  const rs = Object.values(R), all = (k, v) => rs.length && rs.every(r => String(r[k]) === String(v));
  document.querySelectorAll("#hs_mode .chip").forEach(b => b.classList.toggle("on", all("mode", b.dataset.v)));
  document.querySelectorAll("#hs_speed .chip").forEach(b => b.classList.toggle("on", all("speed", b.dataset.v)));
  document.querySelectorAll("#hs_live .chip").forEach(b => b.classList.toggle("on", all("live", b.dataset.v === "live")));
  document.querySelectorAll("#hs_pause .chip").forEach(b => b.classList.toggle("on", all("paused", b.dataset.v === "1")));
  document.querySelectorAll("#hs_cap .chip").forEach(b => b.classList.toggle("on", +b.dataset.v === capPick));
  if ($h("hs_note")) $h("hs_note").textContent = "Resets every desk's paper account to $" + capPick.toLocaleString() + " (total $" + (capPick * 5).toLocaleString() + ").";
}
buildSet();
draw(); setInterval(() => { if (cur === 0) { draw(); mark() } }, 1000);
if (typeof HOST_SW !== "undefined" && HOST_SW && "serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
