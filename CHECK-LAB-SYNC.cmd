@echo off
setlocal
cd /d "%~dp0"
echo Make sure PhotoBridge Lab is completely closed from the Windows tray before proceeding.
echo This tool only READS the sync queue; it does not send, reset or delete any orders.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not on PATH.
  pause
  exit /b 1
)
node tools\diagnose-lab-sync.cjs > "Lab-Sync-Diagnostic.txt"
if errorlevel 1 (
  echo Diagnostic failed. Check the error message below:
  node tools\diagnose-lab-sync.cjs
  pause
  exit /b 1
)
echo Report created: %CD%\Lab-Sync-Diagnostic.txt
echo This report contains NO order bodies, session cookies or customer names.
pause
