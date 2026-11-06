@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-windows-oneclick.ps1"
if errorlevel 1 echo Build stopped. See debug-logs for the full report.
pause
