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
 if (!(Test-Path -LiteralPath (Join-Path $PSScriptRoot 'package-lock.json'))) {throw 'Extract this launcher next to main.cjs and package-lock.json.'}
 $keyFolder=Join-Path $PSScriptRoot 'publisher-key'
 $publisher=Join-Path $keyFolder 'update-private.pem'
 if (!(Test-Path -LiteralPath $publisher -PathType Leaf)) {
  $legacyFolder=Join-Path $PSScriptRoot '.publisher'
  $legacyKey=Join-Path $legacyFolder 'update-private.pem'
  if (!(Test-Path -LiteralPath $legacyKey -PathType Leaf)) {throw 'Copy your original update-private.pem into the publisher-key folder.'}
  $keyFolder=$legacyFolder
  $publisher=$legacyKey
 }
 $tools=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'PhotoBridgeBuild'
 function Get-PortableNode([string]$selector,[string]$versionPattern) {
  $nodeFolder=Join-Path $tools $selector
  $node=Join-Path $nodeFolder 'node.exe'
  $ready=$false
  if (Test-Path -LiteralPath $node) {
   $version=& $node --version
   $arch=& $node -p process.arch
   $ready=($LASTEXITCODE -eq 0 -and $version -match ('^'+$versionPattern+'$') -and $arch -eq 'x64')
  }
  if (!$ready) {
   Write-Host ('Preparing portable Node.js '+$selector+' x64...')
   New-Item -ItemType Directory -Force -Path $tools | Out-Null
   $base='https://nodejs.org/dist/'+$selector+'/'
   $sums=(Invoke-WebRequest -UseBasicParsing -Uri ($base+'SHASUMS256.txt')).Content
   $match=[regex]::Match([string]$sums,('(?m)^([a-f0-9]{64})\s+(node-'+$versionPattern+'-win-x64\.zip)\s*$'))
   if (!$match.Success) {throw 'Could not locate the official Node.js Windows x64 archive.'}
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
  return $node
 }
 $node=Get-PortableNode 'latest-v22.x' 'v22\.\d+\.\d+'
 $env:PATH=(Split-Path -Parent $node)+';'+$env:PATH
 $env:PB_UPDATE_SIGNING_KEY=$publisher
 $env:PB_LAB_REFRESH_UI='0'
 $env:PB_LAB_UI_ORIGIN='https://photobridge.ir'
 Remove-Item Env:PB_LAB_PREPARE_OFFLINE -ErrorAction SilentlyContinue
 Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
 function Invoke-Checked([string]$exe,[string[]]$arguments) {
  & $exe @arguments
  if ($LASTEXITCODE -ne 0) {throw ((Split-Path -Leaf $exe)+' exited with code '+$LASTEXITCODE+'.')}
 }
 # Find the original installed 1.0.120 runtime. Newer installed versions
 # are deliberately excluded from this recovery build.
 if (!$env:PB_120_UI_DIR) {
  $folders=@()
  foreach ($parent in @($env:LOCALAPPDATA,$env:ProgramFiles,${env:ProgramFiles(x86)})) {
   if ($parent) {$folders+=Join-Path $parent 'Programs\PhotoBridge Lab';$folders+=Join-Path $parent 'PhotoBridge Lab'}
  }
  $uninstall=@('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*')
  $folders+=@(Get-ItemProperty -Path $uninstall -ErrorAction SilentlyContinue |
   Where-Object {$_.DisplayName -like 'PhotoBridge Lab*' -and $_.DisplayVersion -eq '1.0.120'} |
   ForEach-Object {$_.InstallLocation} | Where-Object {$_})
  foreach ($folder in ($folders | Select-Object -Unique)) {
   $exe=Join-Path $folder 'PhotoBridge Lab.exe'
   $runtime=Join-Path $folder 'resources\runtime'
   if ((Test-Path -LiteralPath $exe -PathType Leaf) -and (Test-Path -LiteralPath $runtime -PathType Container) -and
    (Get-Item -LiteralPath $exe).VersionInfo.ProductVersion -match '^1\.0\.120(?:\.0)?$') {
    $env:PB_120_UI_DIR=$runtime
    break
   }
  }
 }
 Invoke-Checked $node @('select-original-ui.cjs')
 $env:PB_LAB_PINNED_DIRECTORY=Join-Path $PSScriptRoot 'original-ui-input'
 $env:PB_LAB_PIN_FILE=Join-Path $PSScriptRoot 'original-ui-input\pin.json'
 $version=(Get-Content -LiteralPath (Join-Path $PSScriptRoot 'BUILD-VERSION.txt') -Raw).Trim()
 Invoke-Checked $node @('-e',
  "const fs=require('fs'),c=require('crypto'); const key=c.createPrivateKey(fs.readFileSync(process.env.PB_UPDATE_SIGNING_KEY)); if(c.createPublicKey(key).export({type:'spki',format:'pem'})!==require('./update-trust.cjs').PUBLIC_KEY) throw Error('Wrong original update signing key');")
 Invoke-Checked $node @('-e',
  "const v=process.argv[1],p=require('./package.json'); if(!require('./update-trust.cjs').newer(v,'1.0.128')) throw Error('Build version must be newer than 1.0.128'); if(v!==p.version) require('./prepare-next-version.cjs').prepare(v);", $version)
 $node16=Get-PortableNode 'v16.20.2' 'v16\.20\.2'
 $path22=$env:PATH
 try {
  $env:PATH=(Split-Path -Parent $node16)+';'+$path22
  $npm16=Join-Path (Split-Path -Parent $node16) 'node_modules\npm\bin\npm-cli.js'
  Invoke-Checked $node16 @($npm16,'ci','--no-audit','--no-fund')
 } finally {$env:PATH=$path22}
 $npm22=Join-Path (Split-Path -Parent $node) 'node_modules\npm\bin\npm-cli.js'
 $certificate=Join-Path $keyFolder 'windows-signing.pfx'
 if ((Test-Path -LiteralPath $certificate -PathType Leaf) -and !$env:CSC_LINK -and !$env:WIN_CSC_LINK) {
  $env:WIN_CSC_LINK=$certificate
  if (!$env:WIN_CSC_KEY_PASSWORD) {
   $password=Read-Host 'Windows certificate password' -AsSecureString
   $env:WIN_CSC_KEY_PASSWORD=[System.Net.NetworkCredential]::new('',$password).Password
  }
 }
 $task='dist:unsigned'
 if ($env:CSC_LINK -or $env:WIN_CSC_LINK) {$task='dist'}
 else {Write-Host 'Building a local test installer without Authenticode.'}
 Invoke-Checked $node @($npm22,'run',$task)
 $packaged=Join-Path $PSScriptRoot 'release\win-unpacked\PhotoBridge Lab.exe'
 $smokeLog=Join-Path $logs 'packaged-smoke.log'
 $smokeErrors=Join-Path $logs 'packaged-smoke-errors.log'
 $smokeProfile=Join-Path $logs ('smoke-profile-'+[guid]::NewGuid().ToString('N'))
 $smokeArgs=@('--compat-smoke',('--user-data-dir="'+$smokeProfile+'"'))
 $smoke=Start-Process -FilePath $packaged -ArgumentList $smokeArgs -PassThru -Wait -RedirectStandardOutput $smokeLog -RedirectStandardError $smokeErrors
 Get-Content -LiteralPath $smokeLog,$smokeErrors
 if ($smoke.ExitCode -ne 0 -or !(Select-String -LiteralPath $smokeLog -Pattern 'PB_COMPAT_SMOKE_PASS' -Quiet)) {
  throw 'Packaged Windows startup test failed.'
 }
 Invoke-Checked $node @('create-update-release.cjs')
 Invoke-Checked $node @('release-kit.cjs','verify-json')
 $exitCode=0
 $release=Join-Path $PSScriptRoot 'release'
 Write-Host ('Installer: '+(Join-Path $release ('PhotoBridge-Lab-Setup-'+$version+'-x64.exe')))
 Write-Host ('Update JSON: '+(Join-Path $release ('PhotoBridge-Lab-Update-'+$version+'.json')))
} catch {
 Write-Host $_.Exception.Message
 $exitCode=1
} finally {
 Write-Host ('Log: '+$log)
 Stop-Transcript | Out-Null
}
exit $exitCode
