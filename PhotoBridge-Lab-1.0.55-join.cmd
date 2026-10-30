@echo off
setlocal
cd /d "%~dp0"
copy /b "PhotoBridge-Lab-1.0.55-portable-debug.zip.001"+"PhotoBridge-Lab-1.0.55-portable-debug.zip.002"+"PhotoBridge-Lab-1.0.55-portable-debug.zip.003"+"PhotoBridge-Lab-1.0.55-portable-debug.zip.004"+"PhotoBridge-Lab-1.0.55-portable-debug.zip.005" "PhotoBridge-Lab-1.0.55-portable-debug.zip"
if errorlevel 1 (
  echo Failed. Make sure all five parts are in this folder.
  pause
  exit /b 1
)
echo Done: PhotoBridge-Lab-1.0.55-portable-debug.zip
pause
