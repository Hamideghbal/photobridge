@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [PhotoBridge Lab] Node.js 22 or newer is required.
  echo Install Node.js LTS, reopen this window, and try again.
  pause
  exit /b 1
)
node tools\build-lab-windows-local.mjs %*
set "RESULT=%errorlevel%"
if not "%RESULT%"=="0" echo [PhotoBridge Lab] Build failed. See the error above.
if "%RESULT%"=="0" echo [PhotoBridge Lab] Installer output: apps\lab-desktop\release\
pause
exit /b %RESULT%
