#!/bin/bash
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Install Node.js from https://nodejs.org first"; exit 1; }
(sleep 3; open http://localhost:8787/ 2>/dev/null || xdg-open http://localhost:8787/) &
node server/run.mjs --port 8787
