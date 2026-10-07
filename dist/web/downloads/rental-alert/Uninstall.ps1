$ErrorActionPreference='SilentlyContinue'
$target=Join-Path $env:LOCALAPPDATA 'PhotoBridge\RentalAlert'
Get-CimInstance Win32_Process | Where-Object {($_.Name -match '^(powershell|pwsh)\.exe$') -and ([string]$_.CommandLine -match 'PhotoBridgeRentalAlert\.ps1')} | ForEach-Object {Stop-Process -Id $_.ProcessId -Force}
Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'PhotoBridgeRentalAlert' -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $target -Force -Recurse -ErrorAction SilentlyContinue
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show('PhotoBridge Rental Alert حذف شد.','PhotoBridge')|Out-Null
