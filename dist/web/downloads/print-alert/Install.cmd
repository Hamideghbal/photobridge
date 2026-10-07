@echo off
setlocal
title PhotoBridge Print Alert Setup
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install.ps1"
set "PB_EXIT=%ERRORLEVEL%"
echo.
if not "%PB_EXIT%"=="0" (
  echo PhotoBridge Print Alert setup failed. The log was opened in Notepad.
) else (
  echo PhotoBridge Print Alert setup completed successfully.
)
echo Press any key to close this window.
pause >nul
exit /b %PB_EXIT%
