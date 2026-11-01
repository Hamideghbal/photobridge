param([Parameter(Mandatory=$true)][ValidateSet('Begin','Record','Stop')][string]$Action,[Parameter(Mandatory=$true)][string]$OwnerFile,[long]$WindowHandle=0)
$ErrorActionPreference='Stop'
if ($Action -eq 'Begin') {
 $existing=@(Get-Process -Name MSACCESS -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
 @{baseline=$existing;pid=0;startTicks=''} | ConvertTo-Json -Compress | Set-Content -LiteralPath $OwnerFile -Encoding UTF8
 exit 0
}
$owner=Get-Content -LiteralPath $OwnerFile -Raw | ConvertFrom-Json
if ($Action -eq 'Record') {
 Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class PBAccessWindow { [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId); }'
 [uint32]$workerId=0
 [void][PBAccessWindow]::GetWindowThreadProcessId([IntPtr]$WindowHandle,[ref]$workerId)
 if ($workerId -eq 0 -or @($owner.baseline) -contains $workerId) { throw 'access_instance_not_owned' }
 $worker=Get-Process -Id $workerId
 if ($worker.ProcessName -ine 'MSACCESS') { throw 'access_process_mismatch' }
 $owner.pid=$workerId;$owner.startTicks=$worker.StartTime.ToUniversalTime().Ticks.ToString()
 $owner | ConvertTo-Json -Compress | Set-Content -LiteralPath $OwnerFile -Encoding UTF8
 exit 0
}
# Stop only the exact new instance recorded from this worker's Access window.
# Never kill by executable name or terminate an Access window already open by the user.
if ([long]$owner.pid -le 0) { exit 0 }
if (@($owner.baseline) -contains [int]$owner.pid) { throw 'access_instance_not_owned' }
$worker=Get-Process -Id ([int]$owner.pid) -ErrorAction SilentlyContinue
if ($null -eq $worker) { exit 0 }
if ($worker.ProcessName -ine 'MSACCESS' -or $worker.StartTime.ToUniversalTime().Ticks.ToString() -ne $owner.startTicks) { throw 'access_process_identity_changed' }
Stop-Process -Id $worker.Id -Force
if (-not $worker.WaitForExit(10000)) { throw 'access_worker_stop_timeout' }
