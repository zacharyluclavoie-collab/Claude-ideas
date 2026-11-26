#!/bin/bash
# Real-price paper test: one bot with $100 of pretend money, on real coin prices. Nothing real is ever bought.
cd "$(dirname "$0")/More" || exit 1
if ! command -v node >/dev/null; then
  echo "Node.js is needed. It is free: install the LTS version from https://nodejs.org, then double-click this again."
  open "https://nodejs.org" 2>/dev/null
  read -n 1 -s -r -p "Press any key to close"; exit 1
fi
echo ""
echo "  REAL-PRICE PAPER TEST"
echo "  One bot on Solana, Base, BSC and Arbitrum, \$100 of pretend money, real coin prices. Nothing real is bought."
echo "  Leave this window open. Keep the Mac plugged in with the lid open."
echo "  Results page: http://localhost:8787/   Saved results: More/real-test/"
echo ""
(sleep 4; open "http://localhost:8787/" 2>/dev/null) &
KEEP=""; command -v caffeinate >/dev/null && KEEP="caffeinate -i"   # keeps the Mac awake while the test runs
$KEEP node server/run.mjs --test --port 8787
