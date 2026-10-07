param([string]$ServerUrl='', [string]$Token='')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
$source=Split-Path -Parent $MyInvocation.MyCommand.Path
$target=Join-Path $env:LOCALAPPDATA 'PhotoBridge\RentalAlert'
try{
  New-Item -ItemType Directory -Force -Path $target|Out-Null
  foreach($name in @('PhotoBridgeRentalAlert.ps1')){Copy-Item -LiteralPath (Join-Path $source $name) -Destination (Join-Path $target $name) -Force}
  $server=if($ServerUrl){$ServerUrl}else{Read-Host 'آدرس PhotoBridge (مثال: https://photobridge.ir)'}
  $server=$server.Trim().TrimEnd('/')
  $token=if($Token){$Token}else{Read-Host 'کد اتصال فروشگاه تجهیزات'}
  $token=$token.Trim()
  if(-not ($server.StartsWith('https://') -or $server.StartsWith('http://'))){throw 'آدرس سایت معتبر نیست.'}
  if($token.Length -lt 32){throw 'کد اتصال معتبر نیست.'}
  @{serverUrl=$server;token=$token}|ConvertTo-Json -Compress|Set-Content -LiteralPath (Join-Path $target 'config.json') -Encoding UTF8
  $agent=Join-Path $target 'PhotoBridgeRentalAlert.ps1'
  $vbsPath=Join-Path $target 'LaunchHidden.vbs'
  $vbs="Set sh = CreateObject(`"WScript.Shell`")`r`nsh.Run `"powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"`"$agent`"`"`", 0, False"
  Set-Content -LiteralPath $vbsPath -Value $vbs -Encoding Unicode
  $run='wscript.exe "'+$vbsPath+'"'
  New-Item -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Force|Out-Null
  New-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'PhotoBridgeRentalAlert' -Value $run -PropertyType String -Force|Out-Null
  Start-Process -FilePath (Join-Path $env:WINDIR 'System32\wscript.exe') -ArgumentList ('"'+$vbsPath+'"')
  [System.Windows.Forms.MessageBox]::Show("برنامه هشدار آفیش تجهیزات نصب شد و کنار ساعت ویندوز اجرا می‌شود.`r`n`r`nبه محض ثبت درخواست جدید، مشخصات آفیش نمایش داده می‌شود.",'PhotoBridge',[System.Windows.Forms.MessageBoxButtons]::OK,[System.Windows.Forms.MessageBoxIcon]::Information)|Out-Null
}catch{
  [System.Windows.Forms.MessageBox]::Show("نصب کامل نشد:`r`n$($_.Exception.Message)",'PhotoBridge',[System.Windows.Forms.MessageBoxButtons]::OK,[System.Windows.Forms.MessageBoxIcon]::Error)|Out-Null
  exit 1
}
