@echo off
cd /d "%~dp0"
echo.
echo   Paper Trader is opening in your browser...
echo   (fake money only - no real funds are ever used)
echo.
start "" "index.html"
timeout /t 4 >nul
