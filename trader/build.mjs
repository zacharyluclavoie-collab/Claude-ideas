// Usage: node build.mjs [artifactOutPath]
// Builds trader/index.html (PWA page), an engine-only bundle for Node tests/backtests, and the artifact fragment.
import fs from "node:fs";
import path from "node:path";
const dir = path.dirname(new URL(import.meta.url).pathname);
const rd = f => fs.readFileSync(path.join(dir, "src", f), "utf8");
const ENGINE_FILES = ["core.js", "security.js", "strategy.js", "risk.js", "execution.js", "providers_live.js", "sim_market.js", "engine.js"];
const engine = ENGINE_FILES.map(rd).join("\n");
const ui = rd("ui.js");
const distDir = process.env.BUILD_DIST || path.join(dir, "dist");
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, "engine_bundle.js"), engine);

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
<link rel="apple-touch-icon" href="../icon-180.png">
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
const out = process.argv[2];
if (out) fs.writeFileSync(out, art);
console.log("built", html.length, "bytes", out ? "artifact " + art.length : "");
