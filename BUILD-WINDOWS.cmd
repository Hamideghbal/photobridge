@echo off
setlocal
cd /d "%~dp0"
node build-local.cjs 1.0.67
if errorlevel 1 goto failed
echo Build completed. See release folder.
pause
exit /b 0
:failed
echo Build stopped. Read the error above.
pause
exit /b 1
