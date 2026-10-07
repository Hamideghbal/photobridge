$target=Join-Path $env:LOCALAPPDATA 'PhotoBridge\PrintAlert'
Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'PhotoBridgePrintAlert' -ErrorAction SilentlyContinue
try {
  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { ($_.Name -match '^(powershell|pwsh)\.exe$') -and ([string]$_.CommandLine -match 'PhotoBridgePrintAlert\.ps1') } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
} catch {}
try { Remove-Item -LiteralPath (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\PhotoBridge Print Alert.lnk') -Force -ErrorAction SilentlyContinue } catch {}
try { Remove-Item -LiteralPath (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\PhotoBridge\PhotoBridge Print Alert.lnk') -Force -ErrorAction SilentlyContinue } catch {}
try { Remove-Item -LiteralPath (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup\PhotoBridge Print Alert.lnk') -Force -ErrorAction SilentlyContinue } catch {}
try { Remove-Item -LiteralPath (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\PhotoBridge') -Force -ErrorAction SilentlyContinue } catch {}
Start-Sleep -Milliseconds 300
Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction SilentlyContinue
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show('PhotoBridge Print Alert حذف شد.','PhotoBridge')|Out-Null
