function Get-BuildWorkspace([string]$Source,[object[]]$Volumes,[long]$Minimum=5GB) {
 $sourceRoot=[IO.Path]::GetPathRoot($Source)
 $local=$Volumes | Where-Object {$_.Name -eq $sourceRoot} | Select-Object -First 1
 if ($local -and $local.AvailableFreeSpace -ge $Minimum) {return $Source}
 $alternate=$Volumes | Where-Object {
  $_.Name -ne $sourceRoot -and $_.IsReady -and
  $_.DriveType -eq 'Fixed' -and $_.AvailableFreeSpace -ge $Minimum
 } | Sort-Object AvailableFreeSpace -Descending | Select-Object -First 1
 if (!$alternate) {throw 'No build drive has 5 GB free. Free space or extract the kit on a drive with at least 5 GB available.'}
 $stage=Join-Path $alternate.Name ('PhotoBridgeBuild/pb-'+[guid]::NewGuid().ToString('N').Substring(0,8))
 New-Item -ItemType Directory -Force -Path $stage | Out-Null
 & robocopy.exe $Source $stage '/E' '/XJ' '/R:1' '/W:1' '/NFL' '/NDL' '/NJH' '/NJS' '/NP' '/XD' 'node_modules' 'release' 'runtime' 'access-runtime' '.git' '.build-work' 'debug-logs' 'publisher-key' '.publisher' 'original-ui-input' '/XF' '*.pem' '*.pfx' '*.p12' | Out-Host
 if ($LASTEXITCODE -ge 8) {throw ('Could not stage the build on '+$alternate.Name+' (robocopy '+$LASTEXITCODE+').')}
 return $stage
}

function Set-BuildScratch([string]$Workspace) {
 $scratch=Join-Path $Workspace '.build-work'
 # Keep extraction paths short without moving writes back to a full drive.
 $localData=[Environment]::GetFolderPath('LocalApplicationData')
 if ($localData -and [IO.Path]::GetPathRoot($localData) -eq [IO.Path]::GetPathRoot($Workspace)) {
  $sha=[Security.Cryptography.SHA256]::Create()
  try {$id=([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($Workspace)))) -replace '-',''}
  finally {$sha.Dispose()}
  $scratch=Join-Path $localData ('PhotoBridgeBuild/work-'+$id.Substring(0,10))
 }
 foreach ($name in @('temp','npm','electron','electron-builder','node')) {
  New-Item -ItemType Directory -Force -Path (Join-Path $scratch $name) | Out-Null
 }
 $env:TEMP=Join-Path $scratch 'temp'
 $env:TMP=$env:TEMP
 $env:npm_config_cache=Join-Path $scratch 'npm'
 $env:ELECTRON_CACHE=Join-Path $scratch 'electron'
 $env:ELECTRON_BUILDER_CACHE=Join-Path $scratch 'electron-builder'
 return (Join-Path $scratch 'node')
}
