param([string]$ConfigPath = "")
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

if (-not $ConfigPath) { $ConfigPath = Join-Path $env:LOCALAPPDATA 'PhotoBridge\RentalAlert\config.json' }
$baseDir = Split-Path -Parent $ConfigPath
New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
$logPath = Join-Path $baseDir 'agent.log'
$readyPath = Join-Path $baseDir 'agent.ready'
function Log([string]$m){ try { Add-Content -LiteralPath $logPath -Value ((Get-Date).ToString('s')+' '+$m) -Encoding UTF8 } catch {} }

$createdNew=$false
$mutex=New-Object System.Threading.Mutex($true,'PhotoBridgeRentalAlertAgent_v1',[ref]$createdNew)
if(-not $createdNew){ exit 0 }
trap { Log ('FATAL '+$_.Exception.Message); try{$notify.Visible=$false}catch{}; try{$mutex.ReleaseMutex()}catch{}; exit 1 }
if(-not (Test-Path -LiteralPath $ConfigPath)){ [System.Windows.Forms.MessageBox]::Show('تنظیمات برنامه پیدا نشد. Install.cmd را دوباره اجرا کنید.','PhotoBridge')|Out-Null; exit 1 }
$cfg=Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$server=([string]$cfg.serverUrl).Trim().TrimEnd('/')
$token=([string]$cfg.token).Trim()
if(-not $server -or $token.Length -lt 32){ throw 'server/token missing' }
$headers=@{'x-photobridge-rental-agent-token'=$token}
$script:pending=@()
$script:seen=New-Object 'System.Collections.Generic.HashSet[string]'
$script:shop='فروشگاه تجهیزات'
$script:busy=$false

function Open-Bookings { try { Start-Process ($server+'/rental/bookings') } catch {} }
function Format-Money([object]$v){ try { return ([int64]$v).ToString('N0')+' تومان' } catch { return '—' } }
function Booking-Text($b){
  $name=[string]$b.customerName; if(-not $name){$name='عکاس'}
  $items=[string]$b.items; if(-not $items){$items='تجهیزات'}
  $range=([string]$b.startDate)+' تا '+([string]$b.endDate)
  return "کد: $($b.code)`r`nعکاس: $name  $($b.customerMobile)`r`nتجهیزات: $items`r`nبازه: $range`r`nاجاره: $(Format-Money $b.totalAmount) | ودیعه: $(Format-Money $b.depositAmount)"
}

$form=New-Object System.Windows.Forms.Form
$form.Text='PhotoBridge · آفیش تجهیزات'
$form.Size=New-Object System.Drawing.Size(620,390)
$form.MinimumSize=New-Object System.Drawing.Size(520,330)
$form.StartPosition='CenterScreen'
$form.RightToLeft=[System.Windows.Forms.RightToLeft]::Yes
$form.RightToLeftLayout=$true
$form.Font=New-Object System.Drawing.Font('Segoe UI',10)
$form.ShowInTaskbar=$false
$form.TopMost=$true

$title=New-Object System.Windows.Forms.Label
$title.Dock='Top';$title.Height=56;$title.Padding=New-Object System.Windows.Forms.Padding(14,10,14,4)
$title.Font=New-Object System.Drawing.Font('Segoe UI',12,[System.Drawing.FontStyle]::Bold)
$title.Text='درخواست‌های جدید آفیش تجهیزات'
$form.Controls.Add($title)

$details=New-Object System.Windows.Forms.RichTextBox
$details.Dock='Fill';$details.ReadOnly=$true;$details.BorderStyle='None';$details.BackColor=[System.Drawing.Color]::White
$details.Padding=New-Object System.Windows.Forms.Padding(12);$details.Font=New-Object System.Drawing.Font('Segoe UI',10)
$form.Controls.Add($details)

$bar=New-Object System.Windows.Forms.FlowLayoutPanel
$bar.Dock='Bottom';$bar.Height=58;$bar.FlowDirection='RightToLeft';$bar.Padding=New-Object System.Windows.Forms.Padding(8);$bar.WrapContents=$false
$form.Controls.Add($bar)
$openBtn=New-Object System.Windows.Forms.Button;$openBtn.Text='باز کردن صفحه آفیش‌ها';$openBtn.Width=170;$openBtn.Height=35;$openBtn.Add_Click({Open-Bookings});$bar.Controls.Add($openBtn)
$hideBtn=New-Object System.Windows.Forms.Button;$hideBtn.Text='بستن پنجره';$hideBtn.Width=115;$hideBtn.Height=35;$hideBtn.Add_Click({$form.Hide()});$bar.Controls.Add($hideBtn)
$form.Add_FormClosing({ param($sender,$e) $e.Cancel=$true; $form.Hide() })

function Render-Pending {
  $title.Text = if($script:pending.Count -gt 0){"$($script:shop) · $($script:pending.Count) درخواست جدید"}else{"$($script:shop) · درخواست جدیدی نیست"}
  if($script:pending.Count -eq 0){$details.Text="درخواست جدیدی برای نمایش نیست.`r`n`r`nبرنامه در پس‌زمینه فعال است و به محض ثبت آفیش جدید هشدار می‌دهد.";return}
  $parts=@(); foreach($b in $script:pending){ $parts += (Booking-Text $b) }
  $details.Text=($parts -join "`r`n`r`n────────────────────────`r`n`r`n")
}
function Ack-Bookings([string[]]$ids){
  if(-not $ids -or $ids.Count -eq 0){return}
  try {
    $body=@{bookingIds=$ids}|ConvertTo-Json -Compress
    Invoke-RestMethod -Method Post -Uri ($server+'/api/rental-alert-agent/ack') -Headers $headers -ContentType 'application/json' -Body $body -TimeoutSec 12 | Out-Null
  } catch { Log ('ACK '+$_.Exception.Message) }
}
function Poll {
  if($script:busy){return};$script:busy=$true
  try{
    $d=Invoke-RestMethod -Method Get -Uri ($server+'/api/rental-alert-agent/poll') -Headers $headers -TimeoutSec 12
    if($d.shop.name){$script:shop=[string]$d.shop.name}
    $rows=@($d.bookings)
    $new=@()
    foreach($b in $rows){if($b.id -and -not $script:seen.Contains([string]$b.id)){[void]$script:seen.Add([string]$b.id);$new+=$b}}
    if($new.Count -gt 0){
      $script:pending=@($new)+@($script:pending | Where-Object { $id=[string]$_.id; -not ($new | Where-Object {[string]$_.id -eq $id}) })
      Render-Pending
      [System.Media.SystemSounds]::Exclamation.Play()
      $first=$new[0];$who=[string]$first.customerName;if(-not $who){$who='عکاس'}
      $notify.BalloonTipTitle="آفیش جدید · $($script:shop)"
      $body="$who · $($first.items)";if($new.Count -gt 1){$body+="`r`nو $($new.Count-1) درخواست دیگر"}
      if($body.Length -gt 240){$body=$body.Substring(0,237)+'...'}
      $notify.BalloonTipText=$body;$notify.ShowBalloonTip(9000)
      $form.Show();$form.WindowState='Normal';$form.Activate()
      Ack-Bookings @($new | ForEach-Object {[string]$_.id})
    }
    $tip=("PhotoBridge · "+$script:shop);if($tip.Length -gt 63){$tip=$tip.Substring(0,63)};$notify.Text=$tip
  }catch{
    Log ('POLL '+$_.Exception.Message)
    $notify.Text='PhotoBridge · اتصال موقتاً قطع است'
  }finally{$script:busy=$false}
}

$notify=New-Object System.Windows.Forms.NotifyIcon
$notify.Icon=[System.Drawing.SystemIcons]::Information
$notify.Visible=$true
$notify.Text='PhotoBridge · هشدار آفیش تجهیزات'
$menu=New-Object System.Windows.Forms.ContextMenuStrip
$miShow=$menu.Items.Add('نمایش درخواست‌های جدید');$miShow.Add_Click({Render-Pending;$form.Show();$form.Activate()})
$miOpen=$menu.Items.Add('باز کردن صفحه آفیش‌ها');$miOpen.Add_Click({Open-Bookings})
$miPoll=$menu.Items.Add('بررسی الان');$miPoll.Add_Click({Poll})
[void]$menu.Items.Add('-')
$miExit=$menu.Items.Add('خروج');$miExit.Add_Click({$timer.Stop();$notify.Visible=$false;$form.Dispose();[System.Windows.Forms.Application]::Exit()})
$notify.ContextMenuStrip=$menu
$notify.Add_DoubleClick({Render-Pending;$form.Show();$form.Activate()})
$notify.Add_BalloonTipClicked({Open-Bookings})

$timer=New-Object System.Windows.Forms.Timer
$timer.Interval=4000
$timer.Add_Tick({Poll})
$timer.Start()
Set-Content -LiteralPath $readyPath -Value ((Get-Date).ToString('s')) -Encoding ASCII
Log ('START '+$server)
Poll
[System.Windows.Forms.Application]::Run()
try{$notify.Visible=$false}catch{}
try{$mutex.ReleaseMutex()}catch{}
