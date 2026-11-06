$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding
[Net.ServicePointManager]::SecurityProtocol=[Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
$logs=Join-Path $PSScriptRoot 'debug-logs'
New-Item -ItemType Directory -Force -Path $logs | Out-Null
$log=Join-Path $logs ('build-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.log')
$exitCode=1
Start-Transcript -Path $log -Force | Out-Null
try {
 if (!(Test-Path -LiteralPath (Join-Path $PSScriptRoot 'build-local.cjs'))) {throw 'Extract this launcher next to main.cjs and build-local.cjs.'}
 $publisher=Join-Path $PSScriptRoot '.publisher\update-private.pem'
 if (!(Test-Path -LiteralPath $publisher)) {throw 'Copy your ORIGINAL .publisher folder next to BUILD-WINDOWS.cmd. Expected: .publisher\update-private.pem'}
 $tools=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'PhotoBridgeBuild'
 $nodeFolder=Join-Path $tools 'node22'
 $node=Join-Path $nodeFolder 'node.exe'
 $ready=$false
 if (Test-Path -LiteralPath $node) {
  $version=& $node --version
  $arch=& $node -p process.arch
  $ready=($LASTEXITCODE -eq 0 -and $version -match '^v22\.\d+\.\d+$' -and $arch -eq 'x64')
 }
 if (!$ready) {
  Write-Host 'Preparing portable Node.js 22 x64. No system Node installation is changed.'
  New-Item -ItemType Directory -Force -Path $tools | Out-Null
  $base='https://nodejs.org/dist/latest-v22.x/'
  $sums=(Invoke-WebRequest -UseBasicParsing -Uri ($base+'SHASUMS256.txt')).Content
  $match=[regex]::Match([string]$sums,'(?m)^([a-f0-9]{64})\s+(node-v22\.\d+\.\d+-win-x64\.zip)\s*$')
  if (!$match.Success) {throw 'Could not locate the official Node.js 22 Windows x64 archive.'}
  $expected=$match.Groups[1].Value
  $name=$match.Groups[2].Value
  $zip=Join-Path $tools $name
  $zipReady=(Test-Path -LiteralPath $zip)
  if ($zipReady) {$zipReady=((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant() -eq $expected)}
  if (!$zipReady) {Invoke-WebRequest -UseBasicParsing -Uri ($base+$name) -OutFile $zip}
  if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) {throw 'Node.js archive checksum mismatch. Build stopped.'}
  # Extract outside the potentially deep source path. Windows tar also avoids
  # Expand-Archive's cleanup errors when npm's nested files exceed MAX_PATH.
  $stage=Join-Path ([IO.Path]::GetTempPath()) ('pn-'+[guid]::NewGuid().ToString('N').Substring(0,8))
  New-Item -ItemType Directory -Path $stage | Out-Null
  try {
   $tar=Join-Path $env:SystemRoot 'System32\tar.exe'
   if (Test-Path -LiteralPath $tar) {
    & $tar '-xf' $zip '-C' $stage
    if ($LASTEXITCODE -ne 0) {throw 'Portable Node extraction failed; see tar output above.'}
   } else {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [IO.Compression.ZipFile]::ExtractToDirectory($zip,$stage)
   }
  $unpacked=Join-Path $stage ($name.Substring(0,$name.Length-4))
  if (!(Test-Path -LiteralPath (Join-Path $unpacked 'node.exe'))) {throw 'Node.js extraction failed.'}
  if (Test-Path -LiteralPath $nodeFolder) {Remove-Item -LiteralPath $nodeFolder -Recurse -Force}
  if ([IO.Path]::GetPathRoot($unpacked) -eq [IO.Path]::GetPathRoot($nodeFolder)) {
   [IO.Directory]::Move($unpacked,$nodeFolder)
  } else {
   Copy-Item -LiteralPath $unpacked -Destination $nodeFolder -Recurse
  }
  if (!(Test-Path -LiteralPath (Join-Path $nodeFolder 'node_modules\npm\bin\npm-cli.js'))) {throw 'Portable npm files are incomplete.'}
  } finally {Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue}
 }
 $env:PATH=$nodeFolder+';'+$env:PATH
 $env:PB_UPDATE_SIGNING_KEY=$publisher
 Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
 Write-Host 'Building PhotoBridge Lab 1.0.93 with your existing publisher key...'
 $ErrorActionPreference='Continue'
 & $node (Join-Path $PSScriptRoot 'build-local.cjs') '1.0.93'
 $exitCode=$LASTEXITCODE
 if ($exitCode -eq 0) {Write-Host ('SUCCESS: '+(Join-Path $PSScriptRoot 'release\PhotoBridge-Lab-Setup-1.0.93-x64.exe'))}
 else {Write-Host 'Build stopped. The full error is saved in the log below.'}
} catch {
 Write-Host $_.Exception.Message
 $exitCode=1
} finally {
 Write-Host ('Log: '+$log)
 Stop-Transcript | Out-Null
}
exit $exitCode
