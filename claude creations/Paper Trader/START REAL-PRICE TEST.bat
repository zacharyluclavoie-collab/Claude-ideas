@echo off
rem Real-price paper test: one bot with $100 of pretend money, on real coin prices. Nothing real is ever bought.
cd /d "%~dp0More"
where node >nul 2>nul
if errorlevel 1 goto nonode
echo.
echo   REAL-PRICE PAPER TEST
echo   One bot on Solana, Base, BSC and Arbitrum, $100 of pretend money, real coin prices. Nothing real is bought.
echo   Leave this window open. Keep the PC plugged in and set Sleep to Never while it runs.
echo   Results page: http://localhost:8787/   Saved results: More\real-test\
echo.
start "" cmd /c "timeout /t 4 >nul & start http://localhost:8787/"
node server\run.mjs --test --port 8787
pause
exit /b
:nonode
echo Node.js is needed. It is free: install the LTS version from https://nodejs.org, then double-click this again.
start "" https://nodejs.org
pause
