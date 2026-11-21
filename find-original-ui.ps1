function Get-Exact120Runtime([string]$Exe) {
 if (!$Exe -or !(Test-Path -LiteralPath $Exe -PathType Leaf)) {return}
 $file=Get-Item -LiteralPath $Exe
 if ($file.Name -ne 'PhotoBridge Lab.exe') {return}
 if ($file.VersionInfo.ProductVersion -notmatch '^1\.0\.120(?:\.0)?$' -and
     $file.VersionInfo.FileVersion -notmatch '^1\.0\.120(?:\.0)?$') {return}
 $runtime=Join-Path $file.DirectoryName 'resources/runtime'
 if (Test-Path -LiteralPath (Join-Path $runtime '.pb-lab-bundle-manifest.json') -PathType Leaf) {$runtime}
}

function Get-Installed120Roots([string]$Node) {
 $executables=@(Get-Process -Name 'PhotoBridge Lab' -ErrorAction SilentlyContinue | ForEach-Object {$_.Path})
 $folders=@()
 foreach ($parent in @($env:LOCALAPPDATA,$env:ProgramFiles,${env:ProgramFiles(x86)})) {
  if ($parent) {$folders+=Join-Path $parent 'Programs/PhotoBridge Lab';$folders+=Join-Path $parent 'PhotoBridge Lab'}
 }
 $uninstall=@('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*')
 $folders+=@(Get-ItemProperty -Path $uninstall -ErrorAction SilentlyContinue |
  Where-Object {$_.DisplayName -like 'PhotoBridge Lab*' -and $_.DisplayVersion -eq '1.0.120'} |
  ForEach-Object {$_.InstallLocation} | Where-Object {$_})
 foreach ($folder in $folders) {$executables+=Join-Path $folder 'PhotoBridge Lab.exe'}
 if ($env:OS -eq 'Windows_NT') {
  try {
   $shell=New-Object -ComObject WScript.Shell
   foreach ($shortcutRoot in @([Environment]::GetFolderPath('DesktopDirectory'),[Environment]::GetFolderPath('StartMenu'),[Environment]::GetFolderPath('CommonStartMenu'))) {
    if (!$shortcutRoot) {continue}
    foreach ($shortcut in (Get-ChildItem -LiteralPath $shortcutRoot -Filter '*PhotoBridge*Lab*.lnk' -File -Recurse -ErrorAction SilentlyContinue)) {
     $executables+=$shell.CreateShortcut($shortcut.FullName).TargetPath
    }
   }
  } catch {Write-Host 'Windows shortcuts could not be inspected.'}
 }
 # Prefer the verified active UI from a profile last opened by version 120.
 if ($env:APPDATA) {
  foreach ($name in @('PhotoBridge Lab','photobridge-lab-desktop')) {
   $database=Join-Path (Join-Path $env:APPDATA $name) 'lab.sqlite'
   if (Test-Path -LiteralPath $database -PathType Leaf) {
    & $Node --disable-warning=ExperimentalWarning (Join-Path $PSScriptRoot 'read-original-ui-profile.cjs') $database
   }
  }
 }
 foreach ($exe in ($executables | Where-Object {$_} | Select-Object -Unique)) {Get-Exact120Runtime $exe}
}

function Find-OriginalUi([string]$Node,[string[]]$InstalledRoots) {
 $manifestName='.pb-lab-bundle-manifest.json'
 $original=Join-Path $PSScriptRoot 'original-120-ui'
 $roots=@((Join-Path $env:USERPROFILE 'Downloads'),[Environment]::GetFolderPath('DesktopDirectory'),(Split-Path -Parent $PSScriptRoot),$original)
 $versionPattern='(?i)(?:1[._-]0[._-]120|R1961)(?![0-9])'
 $archives=@()
 $candidates=@($env:PB_120_UI_DIR,$original)+$InstalledRoots
 foreach ($root in ($roots | Where-Object {$_} | Select-Object -Unique)) {
  foreach ($file in (Get-ChildItem -LiteralPath $root -File -Filter '*.zip' -ErrorAction SilentlyContinue)) {
   if ($root -eq $original -or $file.Name -match $versionPattern) {$archives+=$file.FullName}
  }
  foreach ($folder in (Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue | Where-Object {$_.Name -match $versionPattern})) {
   foreach ($relative in @('', 'runtime','resources/runtime','verified-ui','win-unpacked/resources/runtime')) {
    $candidates+=Join-Path $folder.FullName $relative
   }
   $candidates+=@(Get-ChildItem -LiteralPath $folder.FullName -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    Join-Path $_.FullName 'verified-ui'
    Join-Path $_.FullName 'runtime'
   })
  }
 }
 foreach ($candidate in ($candidates | Where-Object {$_} | Select-Object -Unique)) {
  if (Test-Path -LiteralPath (Join-Path $candidate $manifestName) -PathType Leaf) {
   $env:PB_120_UI_DIR=$candidate
   & $Node (Join-Path $PSScriptRoot 'select-original-ui.cjs')
   if ($LASTEXITCODE -eq 0) {return}
  }
 }

 Add-Type -AssemblyName System.IO.Compression.FileSystem
 foreach ($archive in ($archives | Select-Object -Unique)) {
  $zip=$null
  try {
   $zip=[IO.Compression.ZipFile]::OpenRead($archive)
   foreach ($entry in ($zip.Entries | Where-Object {$_.Name -eq $manifestName -and $_.Length -le 4MB})) {
    $stage=Join-Path ([IO.Path]::GetTempPath()) ('pb120-ui-'+[guid]::NewGuid().ToString('N'))
    try {
     New-Item -ItemType Directory -Path $stage | Out-Null
     $manifestFile=Join-Path $stage $manifestName
     [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$manifestFile)
     $manifest=Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
     if (!$manifest.files -or $manifest.files.Count -gt 2000) {throw 'Invalid UI manifest'}
     $prefix=$entry.FullName.Substring(0,$entry.FullName.Length-$manifestName.Length)
     foreach ($asset in $manifest.files) {
      $name=[string]$asset.name
      if ($name -notmatch '^(?:[A-Za-z0-9_.-]+/)*[A-Za-z0-9_.-]+$' -or $name.Contains('..') -or $name -match '(?:^|/)\.(?:/|$)') {throw 'Invalid UI path'}
      $item=$zip.GetEntry($prefix+$name)
      if (!$item -or $item.Length -gt 20000000) {throw 'Missing or oversized UI file'}
      $target=Join-Path $stage $name
      [IO.Directory]::CreateDirectory((Split-Path -Parent $target)) | Out-Null
      [IO.Compression.ZipFileExtensions]::ExtractToFile($item,$target)
     }
     $env:PB_120_UI_DIR=$stage
     & $Node (Join-Path $PSScriptRoot 'select-original-ui.cjs')
     if ($LASTEXITCODE -eq 0) {return}
    } catch {Write-Host ('Skipping UI archive candidate: '+$_.Exception.Message)}
    finally {Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue}
   }
  } catch {Write-Host ('Skipping ZIP: '+$_.Exception.Message)}
  finally {if($zip){$zip.Dispose()}}
 }
 if ($env:OS -eq 'Windows_NT') {
  Add-Type -AssemblyName System.Windows.Forms
  $picker=New-Object System.Windows.Forms.OpenFileDialog
  try {
   $picker.Title='Select the installed PhotoBridge Lab 1.0.120 executable (not Setup)'
   $picker.Filter='Installed PhotoBridge Lab|PhotoBridge Lab.exe'
   $picker.CheckFileExists=$true
   if ($picker.ShowDialog() -eq 'OK') {
    $runtime=Get-Exact120Runtime $picker.FileName
    if ($runtime) {
     $env:PB_120_UI_DIR=$runtime
     & $Node (Join-Path $PSScriptRoot 'select-original-ui.cjs')
     if ($LASTEXITCODE -eq 0) {return}
    }
   }
  } finally {$picker.Dispose()}
 }
 throw 'Original 1.0.120 UI was not found or did not pass verification. Put the original 1.0.120 source ZIP in original-120-ui. The EXE alone is not a source ZIP.'
}
