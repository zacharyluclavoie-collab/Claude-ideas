#!/bin/bash
# Builds "claude creations/Paper Trader" (+ zip) from the current source. Run from trader/ after node build.mjs.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$ROOT/claude creations/Paper Trader"
rm -rf "$OUT"; mkdir -p "$OUT/app-files" "$OUT/More"
cp index.html "$OUT/index.html"
cp manifest.webmanifest sw.js icon-*.png "$OUT/app-files/"
sed -i 's#href="manifest.webmanifest"#href="app-files/manifest.webmanifest"#; s#href="icon-180.png"#href="app-files/icon-180.png"#' "$OUT/index.html"
cp "start/START HERE.html" "$OUT/"
cp "start/START REAL-PRICE TEST.command" "start/START REAL-PRICE TEST.bat" "$OUT/"; chmod +x "$OUT/START REAL-PRICE TEST.command"
printf '@echo off\r\ncd /d "%%~dp0"\r\necho.\r\necho   Paper Trader is opening in your browser...\r\necho   (fake money only - no real funds are ever used)\r\necho.\r\nstart "" "index.html"\r\ntimeout /t 4 >nul\r\n' > "$OUT/START PAPER TRADER.bat"
printf '#!/bin/bash\ncd "$(dirname "$0")"\nopen index.html 2>/dev/null || xdg-open index.html\n' > "$OUT/START PAPER TRADER.command"; chmod +x "$OUT/START PAPER TRADER.command"
cp -r server recorder "$OUT/More/"
printf '@echo off\r\ncd /d "%%~dp0"\r\nwhere node >nul 2>nul\r\nif errorlevel 1 (\r\n  echo Node.js is not installed. Get it from https://nodejs.org then run this again.\r\n  pause\r\n  exit /b\r\n)\r\nstart "" cmd /c "timeout /t 3 >nul & start http://localhost:8787/"\r\necho Paper Trader runner is starting. Leave this window open.\r\nnode server\\run.mjs --port 8787\r\npause\r\n' > "$OUT/More/Start 24-7 (needs Node.js).bat"
printf '#!/bin/bash\ncd "$(dirname "$0")"\ncommand -v node >/dev/null || { echo "Install Node.js from https://nodejs.org first"; exit 1; }\n(sleep 3; open http://localhost:8787/ 2>/dev/null || xdg-open http://localhost:8787/) &\nnode server/run.mjs --port 8787\n' > "$OUT/More/Start 24-7 (needs Node.js).command"; chmod +x "$OUT/More/"*.command
cp README.md RESULTS.md "$OUT/More/"; cp "$ROOT/reports/Memecoin bot evidence review.md" "$OUT/More/"
(cd "$ROOT/claude creations" && rm -f "Paper Trader.zip" && python3 -c "import shutil;shutil.make_archive('Paper Trader','zip','.','Paper Trader')")
echo "bundle ready: $OUT"
