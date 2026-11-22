@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get it from https://nodejs.org then run this again.
  pause
  exit /b
)
start "" cmd /c "timeout /t 3 >nul & start http://localhost:8787/"
node server\run.mjs --port 8787
pause
