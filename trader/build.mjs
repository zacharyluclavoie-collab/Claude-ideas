// Usage: node build.mjs [artifactOutPath]
// Builds trader/index.html (PWA page), an engine-only bundle for Node tests/backtests, and the artifact fragment.
import fs from "node:fs";
import { fileURLToPath } from "node:url";   // works with spaces in folder names and on Windows
import path from "node:path";
const dir = path.dirname(fileURLToPath(new URL(import.meta.url)));
const rd = f => fs.readFileSync(path.join(dir, "src", f), "utf8");
const ENGINE_FILES = ["core.js", "security.js", "strategy.js", "risk.js", "agents.js", "learn.js", "train.js", "execution.js", "providers_live.js", "sim_market.js", "backtest_summary.js", "majors.js", "engine.js", "v3.js", "v3hour.js"];
const BUILD = new Date().toISOString().slice(0, 16).replace("T", " ");
let tuneJs = "";
try { const t = JSON.parse(fs.readFileSync(path.join(dir, "src", "agent_tune.json"), "utf8")); tuneJs = "\n/* trained agent settings (test/train_agents.mjs, validated on unseen markets) */\nObject.assign(AGENT_TUNE, " + JSON.stringify(t) + ");\n" } catch (e) {}
const engine = ENGINE_FILES.map(rd).join("\n").replace("__BUILD__", BUILD).replace("/*TUNE*/", tuneJs);
const ui = rd("anim.js") + "\n" + rd("ui.js");
const distDir = process.env.BUILD_DIST || path.join(dir, "dist");
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, "engine_bundle.js"), engine);
fs.mkdirSync(path.join(dir, "server"), { recursive: true });
fs.writeFileSync(path.join(dir, "server", "engine_bundle.js"), engine);   // self-contained copy for the always-on runner

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Paper Trader</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Paper Trader">
<meta name="theme-color" content="#0b0f17">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<style>
${rd("style.css")}
</style>
</head>
<body>
${rd("body.html")}
<script>
"use strict";
${engine}
${ui}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(dir, "index.html"), html);

let art = html.replace("const DEMO_ONLY=false;", "const DEMO_ONLY=true;");
art = art.replace(/<meta name="(apple-mobile-web-app-[a-z-]+|mobile-web-app-capable|theme-color)"[^>]*>\n/g, "")
  .replace(/<link rel="(manifest|apple-touch-icon)"[^>]*>\n/g, "")
  .replace(/<meta name="viewport"[^>]*>\n/g, "")
  .replace('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n', "")
  .replace("</head>\n<body>\n", "").replace("\n</body>\n</html>\n", "\n")
  .replace(/<!--LIVEONLY-->[\s\S]*?<!--\/LIVEONLY-->/g, "");
// offline shell: network first (so updates arrive), cached copy when offline
fs.writeFileSync(path.join(dir, "sw.js"), `const V = "pt-${Date.now()}";
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"]))); self.skipWaiting() });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
self.addEventListener("fetch", e => { const u = new URL(e.request.url); if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))) });
`);
// ---- the shipped page is the Master board: it runs the single app 5 times (one desk per market area) and adds them up ----
fs.writeFileSync(path.join(dir, "app.html"), html);   // the single app on its own
const J = x => JSON.stringify(x).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const appLive = html.replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n<!--DESK-->\n');
const appDemo = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<!--DESK-->\n<meta name="viewport" content="width=device-width, initial-scale=1">\n</head>\n<body>\n${art}\n</body>\n</html>\n`;
const hostCss = rd("style.css"), hostBody = rd("host.html"), hostJs = rd("anim.js") + "\n" + rd("v3hour.js") + "\n" + rd("host.js") + "\n" + rd("botroom.js") + "\n" + rd("run.js") + "\n" + rd("runui.js");
const hostPage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Paper Trader</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Paper Trader">
<meta name="theme-color" content="#0b0f17">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<style>
${hostCss}
</style>
</head>
<body class="hostbody">
${hostBody}
<script>
"use strict";
const HOST_SW = true;
const APP_DOC = ${J(appLive)};
${hostJs}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(dir, "index.html"), hostPage);
const hostArt = `<meta charset="utf-8">
<title>Paper Trader</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${hostCss}
</style>
<div class="hostbody-wrap"></div>
${hostBody}
<script>
"use strict";
document.body.classList.add("hostbody");
const HOST_SW = false;
const APP_DOC = ${J(appDemo)};
${hostJs}
</script>
`;
const out = process.argv[2];
if (out) fs.writeFileSync(out, hostArt);
console.log("built", html.length, "bytes", out ? "artifact " + art.length : "");
