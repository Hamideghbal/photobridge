param([string]$ServerUrl = '', [string]$Token = '', [switch]$Quiet)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms

$source=Split-Path -Parent $MyInvocation.MyCommand.Path
$target=Join-Path $env:LOCALAPPDATA 'PhotoBridge\PrintAlert'
$setupLog=Join-Path $env:TEMP 'PhotoBridge-Print-Alert-Setup.log'
$agentLog=Join-Path $target 'agent.log'

function Setup-Log([string]$Message){
  try{Add-Content -LiteralPath $setupLog -Value ((Get-Date).ToString('s')+' '+$Message) -Encoding UTF8}catch{}
}
function Show-SetupError([string]$Message){
  Setup-Log ('ERROR '+$Message)
  if(-not $Quiet){
    try{[System.Windows.Forms.MessageBox]::Show("نصب PhotoBridge Print Alert کامل نشد.`r`n`r`n$Message`r`n`r`nگزارش نصب:`r`n$setupLog",'PhotoBridge - خطای نصب',[System.Windows.Forms.MessageBoxButtons]::OK,[System.Windows.Forms.MessageBoxIcon]::Error)|Out-Null}catch{}
    try{if(Test-Path -LiteralPath $setupLog){Start-Process notepad.exe -ArgumentList ('"'+$setupLog+'"')}}catch{}
  }
}

try{
  Setup-Log ('INSTALL START source='+$source)
  New-Item -ItemType Directory -Force -Path $target | Out-Null

  # Ask a current v0.17.65+ agent to exit cleanly first. Older agents fall back to a bounded CIM scan.
  $shutdownPath=Join-Path $target 'agent.shutdown'
  try {
    Set-Content -LiteralPath $shutdownPath -Value ((Get-Date).ToString('s')) -Encoding ASCII
    for($i=0;$i -lt 12;$i++){
      Start-Sleep -Milliseconds 250
      try{
        $probe=[System.IO.File]::Open((Join-Path $target 'agent.lock'),[System.IO.FileMode]::OpenOrCreate,[System.IO.FileAccess]::ReadWrite,[System.IO.FileShare]::None)
        $probe.Dispose();break
      }catch{}
    }
  } catch { Setup-Log ('Graceful shutdown warning: '+$_.Exception.Message) }
  Remove-Item -LiteralPath $shutdownPath -Force -ErrorAction SilentlyContinue

  try {
    Get-CimInstance Win32_Process -OperationTimeoutSec 3 -ErrorAction Stop |
      Where-Object { ($_.Name -match '^(powershell|pwsh)\.exe$') -and ([string]$_.CommandLine -match 'PhotoBridgePrintAlert\.ps1') } |
      ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch {} }
    Start-Sleep -Milliseconds 450
  } catch { Setup-Log ('Older-process scan warning: '+$_.Exception.Message) }

  foreach($name in @('PhotoBridgePrintAlert.ps1','PhotoBridgeOfflineIntake.ps1','PhotoBridgeAlert.wav')){
    $src=Join-Path $source $name
    if(-not (Test-Path -LiteralPath $src)){throw "$name در بسته نصب پیدا نشد."}
    Copy-Item -LiteralPath $src -Destination (Join-Path $target $name) -Force
  }

  # Keep the Windows UI on the same Vazirmatn typeface used by the PhotoBridge web app.
  # Fonts are downloaded at install time and loaded privately by the agent (no system-wide font install).
  try{
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $fontSources=@(
      @((Join-Path $target 'Vazirmatn-Regular.ttf'),'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Regular.ttf'),
      @((Join-Path $target 'Vazirmatn-Bold.ttf'),'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Bold.ttf')
    )
    foreach($item in $fontSources){
      $fontPath=[string]$item[0];$fontUrl=[string]$item[1]
      if(-not(Test-Path -LiteralPath $fontPath) -or (Get-Item -LiteralPath $fontPath).Length -lt 20000){
        try{Invoke-WebRequest -UseBasicParsing -Uri $fontUrl -OutFile $fontPath -TimeoutSec 8;Setup-Log ('UI font ready '+[IO.Path]::GetFileName($fontPath))}catch{Setup-Log ('UI font download warning: '+$_.Exception.Message)}
      }
    }
  }catch{Setup-Log ('UI font prepare warning: '+$_.Exception.Message)}

  $server=if($ServerUrl){$ServerUrl}else{Read-Host 'PhotoBridge server URL (example: https://photobridge.ir)'}
  $server=$server.Trim().TrimEnd('/')
  $token=if($Token){$Token}else{Read-Host 'Connection token from PhotoBridge settings'}
  $token=$token.Trim()
  if(-not $server.StartsWith('https://') -and -not $server.StartsWith('http://')){throw 'آدرس سرور معتبر نیست.'}
  if($token.Length -lt 32){throw 'کلید اتصال معتبر نیست.'}

  $configPath=Join-Path $target 'config.json'
  $existingAlarmMode='balanced'
  try{
    if(Test-Path -LiteralPath $configPath){
      $oldConfig=Get-Content -LiteralPath $configPath -Raw -Encoding UTF8|ConvertFrom-Json
      if(@('strong','balanced','gentle','silent') -contains ([string]$oldConfig.alarmMode)){$existingAlarmMode=[string]$oldConfig.alarmMode}
    }
  }catch{}
  $config=@{serverUrl=$server;token=$token;alarmMode=$existingAlarmMode}|ConvertTo-Json -Compress
  Set-Content -LiteralPath $configPath -Value $config -Encoding UTF8

  $agentPath=Join-Path $target 'PhotoBridgePrintAlert.ps1'
  $launchPath=Join-Path $target 'LaunchHidden.vbs'
  # Unicode is intentional: Windows usernames/paths may contain Persian characters.
  $vbs=@"
Set shell = CreateObject("WScript.Shell")
shell.Run "powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$agentPath""", 0, False
"@
  Set-Content -LiteralPath $launchPath -Value $vbs -Encoding Unicode

  # Startup redundancy: registry + Startup shortcut. Both point to the same single-instance agent.
  $quotedLaunch='"{0}"' -f $launchPath
  $run='wscript.exe {0}' -f $quotedLaunch
  New-Item -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Force | Out-Null
  New-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'PhotoBridgePrintAlert' -Value $run -PropertyType String -Force | Out-Null

  $shell=New-Object -ComObject WScript.Shell
  $programs=Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\PhotoBridge'
  New-Item -ItemType Directory -Force -Path $programs | Out-Null
  $shortcut=$shell.CreateShortcut((Join-Path $programs 'PhotoBridge Print Alert.lnk'))
  $shortcut.TargetPath=(Join-Path $env:WINDIR 'System32\wscript.exe')
  $shortcut.Arguments=$quotedLaunch
  $shortcut.WorkingDirectory=$target
  $shortcut.Description='PhotoBridge Print Alert'
  $shortcut.Save()

  $startup=Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
  $startupShortcut=$shell.CreateShortcut((Join-Path $startup 'PhotoBridge Print Alert.lnk'))
  $startupShortcut.TargetPath=(Join-Path $env:WINDIR 'System32\wscript.exe')
  $startupShortcut.Arguments=$quotedLaunch
  $startupShortcut.WorkingDirectory=$target
  $startupShortcut.Description='PhotoBridge Print Alert'
  $startupShortcut.Save()

  $readyPath=Join-Path $target 'agent.ready'
  Remove-Item -LiteralPath $readyPath -Force -ErrorAction SilentlyContinue
  Setup-Log 'Launching tray agent'
  try{Add-Content -LiteralPath $agentLog -Value ((Get-Date).ToString('s')+' INSTALL launching agent') -Encoding UTF8}catch{}

  Start-Process -FilePath (Join-Path $env:WINDIR 'System32\wscript.exe') -ArgumentList $quotedLaunch
  $started=$false
  for($i=0;$i -lt 20;$i++){
    Start-Sleep -Milliseconds 500
    if(Test-Path -LiteralPath $readyPath){$started=$true;break}
  }

  if(-not $started){
    # Fallback launch without VBS, still hidden. This also makes the failure mode diagnosable.
    Setup-Log 'Ready marker not found after VBS launch; trying direct hidden PowerShell fallback'
    Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',$agentPath) -WindowStyle Hidden
    for($i=0;$i -lt 12;$i++){
      Start-Sleep -Milliseconds 500
      if(Test-Path -LiteralPath $readyPath){$started=$true;break}
    }
  }

  if(-not $started){
    $tail=''
    try{if(Test-Path -LiteralPath $agentLog){$tail=(Get-Content -LiteralPath $agentLog -Tail 12 -ErrorAction SilentlyContinue)-join "`r`n"}}catch{}
    if($tail){Setup-Log ("Agent tail:`r`n"+$tail)}
    throw "Agent نصب شد اما آیکون کنار ساعت راه‌اندازی نشد. فایل agent.log برای بررسی باز می‌شود."
  }

  Setup-Log 'INSTALL SUCCESS ready marker detected'
  if(-not $Quiet){
    try{
      [System.Windows.Forms.MessageBox]::Show("PhotoBridge Print Alert با موفقیت نصب و اجرا شد.`r`n`r`nآیکون باید کنار ساعت یا داخل فلش ^ آیکون‌های مخفی دیده شود.`r`n`r`nبا ورود بعدی به ویندوز هم خودکار اجرا می‌شود.",'PhotoBridge',[System.Windows.Forms.MessageBoxButtons]::OK,[System.Windows.Forms.MessageBoxIcon]::Information)|Out-Null
    }catch{}
  }
  exit 0
}catch{
  $message=[string]$_.Exception.Message
  Show-SetupError $message
  if(-not $Quiet){try{if(Test-Path -LiteralPath $agentLog){Start-Process notepad.exe -ArgumentList ('"'+$agentLog+'"')}}catch{}}
  exit 1
}
