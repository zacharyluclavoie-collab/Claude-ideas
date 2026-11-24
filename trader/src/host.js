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
let built = false; const lastSeen = {};
function buildBoard() {
  built = true;
  $h("h_kv").innerHTML = [["Won", "hk_w", "g", "hk_wn"], ["Lost", "hk_l", "r", "hk_ln"], ["Open now", "hk_o", "", "hk_on"], ["Trades today", "hk_td", "", ""], ["Win rate", "hk_wr", "", ""], ["Coins scanned", "hk_sc", "", ""]]
    .map(x => `<div><span>${x[0]}</span><b id="${x[1]}" class="num ${x[2]}">–</b>${x[3] ? `<span id="${x[3]}"></span>` : ""}</div>`).join("");
  $h("h_desks").innerHTML = DN.map((name, i) => `<div class="panel hdesk rise" data-d="${i + 1}" id="dk${i + 1}" style="margin:10px 0;cursor:pointer;animation-delay:${i * 70}ms">
    <div class="row"><b>${name}</b><b id="dkp${i + 1}" class="num">starting…</b></div>
    <div class="sub" style="margin-top:4px"><span id="dke${i + 1}" class="num"></span> · <span id="dki${i + 1}"></span></div>
    <div class="sub" style="margin-top:4px" id="dkw${i + 1}"></div><div class="sub" style="margin-top:4px;opacity:.75" id="dkl${i + 1}"></div></div>`).join("");
  document.querySelectorAll(".hdesk").forEach(el => el.onclick = () => show(+el.dataset.d));
}
function draw() {
  if (!built) buildBoard();
  const t = totals(), pl = t.eq - t.start, n = Object.keys(R).length;
  anim("h_eq", t.eq, v => money(v));
  $h("h_sub").innerHTML = n ? `<span class="${pl >= 0 ? "g" : "r"}">${sg(pl)}</span> all time · <span class="${t.today >= 0 ? "g" : "r"}">${sg(t.today)}</span> today · ${n} of 5 desks running` : "Starting 5 desks…";
  anim("h_tot", pl, v => sg(v)); $h("h_tot").classList.toggle("g", pl >= 0); $h("h_tot").classList.toggle("r", pl < 0);
  anim("hk_w", t.w, v => sg(v)); anim("hk_l", t.l, v => sg(v)); anim("hk_o", t.openPl, v => sg(v)); $h("hk_o").className = "num " + (t.openPl >= 0 ? "g" : "r");
  const pc = (k, w) => k + (k === 1 ? " " + w : " " + w + "s");
  $h("hk_wn").textContent = pc(t.wn, "coin"); $h("hk_ln").textContent = pc(t.ln, "coin"); $h("hk_on").textContent = pc(t.open, "coin");
  $h("hk_td").textContent = String(t.todayN); $h("hk_wr").textContent = t.wn + t.ln ? Math.round(100 * t.wn / (t.wn + t.ln)) + "%" : "–"; $h("hk_sc").textContent = t.scanned.toLocaleString();
  for (let i = 1; i <= 5; i++) { const r = R[i]; if (!r) continue; const p = r.eq - r.start;
    anim("dkp" + i, p, v => sg(v)); $h("dkp" + i).className = "num " + (p >= 0 ? "g" : "r"); anim("dke" + i, r.eq, v => money(v));
    $h("dki" + i).textContent = `${MODEN[r.mode] || r.mode} · ${r.status}${r.clock ? " · " + r.clock : ""}`;
    $h("dkw" + i).innerHTML = `<span class="g">${r.wn} won ${sg(r.w)}</span> · <span class="r">${r.ln} lost ${sg(r.l)}</span> · ${r.open} open · ${r.todayN} today`;
    $h("dkl" + i).textContent = r.lastSym ? `Last: ${r.lastSym} ${String(r.last).slice(0, 70)}` : "";
    const key = r.lastSym + "|" + r.last; if (lastSeen[i] !== undefined && lastSeen[i] !== key) { const c = $h("dk" + i); c.classList.remove("pulse"); void c.offsetWidth; c.classList.add("pulse") } lastSeen[i] = key }
  const ch = $h("h_chart"); if (hist.length > 1) { const lo = Math.min(...hist, t.start), hi = Math.max(...hist, t.start), pd = (hi - lo) * 0.12 || t.start * 0.001 || 1, w = 340, h = 120, X = i => 4 + i / (hist.length - 1) * (w - 8), Y = v => h - 4 - (v - lo + pd) / (hi - lo + 2 * pd) * (h - 8);
    const d = hist.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(""), up = hist[hist.length - 1] >= t.start, c = up ? "var(--g)" : "var(--r)", lx = X(hist.length - 1), ly = Y(hist[hist.length - 1]);
    ch.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="120" preserveAspectRatio="none"><defs><linearGradient id="hg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".28"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs>
      <line x1="0" x2="${w}" y1="${Y(t.start)}" y2="${Y(t.start)}" stroke="var(--mut)" stroke-dasharray="3 4" stroke-width="1" vector-effect="non-scaling-stroke"/><path d="${d}L${lx} ${h}L4 ${h}Z" fill="url(#hg)"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><span class="livedot ${up ? "g" : "r"}" style="left:${(lx / w * 100).toFixed(2)}%;top:${(ly / h * 100).toFixed(2)}%"></span>` }
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
