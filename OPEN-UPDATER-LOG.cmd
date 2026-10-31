@echo off
setlocal
for %%D in ("%APPDATA%\photobridge-lab-desktop" "%APPDATA%\PhotoBridge Lab") do (
 if exist "%%~D\updater-debug.log" (
  start "" notepad.exe "%%~D\updater-debug.log"
  exit /b 0
 )
)
echo updater-debug.log not found. Run the UPD-02 build and check updates first.
pause
