function Get-InstalledRuntime([string]$Exe) {
 if (!$Exe -or !(Test-Path -LiteralPath $Exe -PathType Leaf)) {return}
 $file=Get-Item -LiteralPath $Exe
 if ($file.Name -ne 'PhotoBridge Lab.exe') {return}
 if ($file.VersionInfo.ProductVersion -notmatch '^1\.0\.(?:120|13[4-9]|14[0-9]|15[0-2])(?:\.0)?$' -and
     $file.VersionInfo.FileVersion -notmatch '^1\.0\.(?:120|13[4-9]|14[0-9]|15[0-2])(?:\.0)?$') {return}
 $runtime=Join-Path $file.DirectoryName 'resources/runtime'
 if ((Test-Path -LiteralPath (Join-Path $runtime '.pb-lab-bundle-manifest.json') -PathType Leaf) -or
     (Test-Path -LiteralPath (Join-Path $runtime 'manifest.json') -PathType Leaf)) {$runtime}
}

function Get-InstalledUiRoots([string]$Node) {
 $executables=@(Get-Process -Name 'PhotoBridge Lab' -ErrorAction SilentlyContinue | ForEach-Object {$_.Path})
 $folders=@()
 foreach ($parent in @($env:LOCALAPPDATA,$env:ProgramFiles,${env:ProgramFiles(x86)})) {
  if ($parent) {$folders+=Join-Path $parent 'Programs/PhotoBridge Lab';$folders+=Join-Path $parent 'PhotoBridge Lab'}
 }
 $uninstall=@('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*')
 $folders+=@(Get-ItemProperty -Path $uninstall -ErrorAction SilentlyContinue |
  Where-Object {$_.DisplayName -like 'PhotoBridge Lab*' -and $_.DisplayVersion -in @('1.0.120','1.0.134','1.0.135','1.0.136','1.0.137','1.0.138','1.0.139','1.0.140','1.0.141','1.0.142','1.0.143','1.0.144','1.0.145','1.0.146','1.0.147','1.0.148','1.0.149','1.0.150','1.0.151','1.0.152')} |
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
 # Reuse active or known-good UI from the installed profile. Selection still verifies the manifest and capabilities.
 if ($env:APPDATA) {
  foreach ($name in @('PhotoBridge Lab','photobridge-lab-desktop')) {
   $database=Join-Path (Join-Path $env:APPDATA $name) 'lab.sqlite'
   if (Test-Path -LiteralPath $database -PathType Leaf) {
    & $Node --disable-warning=ExperimentalWarning (Join-Path $PSScriptRoot 'read-original-ui-profile.cjs') $database '--compatible-cache'
   }
  }
 }
 foreach ($exe in ($executables | Where-Object {$_} | Select-Object -Unique)) {Get-InstalledRuntime $exe}
}

function Find-OriginalUi([string]$Node,[string[]]$InstalledRoots) {
 $manifestName='.pb-lab-bundle-manifest.json'
 $original=Join-Path $PSScriptRoot 'original-120-ui'
 $roots=@((Join-Path $env:USERPROFILE 'Downloads'),[Environment]::GetFolderPath('DesktopDirectory'),(Split-Path -Parent $PSScriptRoot),$original)
 $versionPattern='(?i)(?:1[._-]0[._-]120|R1961)(?![0-9])'
 $archives=@()
 $installers=@()
 $candidates=@($env:PB_120_UI_DIR,$original)+$InstalledRoots
 foreach ($root in ($roots | Where-Object {$_} | Select-Object -Unique)) {
  foreach ($file in (Get-ChildItem -LiteralPath $root -File -Filter '*.zip' -ErrorAction SilentlyContinue)) {
   if ($root -eq $original -or $file.Name -match $versionPattern) {$archives+=$file.FullName}
  }
  foreach ($file in (Get-ChildItem -LiteralPath $root -File -Filter '*.exe' -ErrorAction SilentlyContinue)) {
   if ($root -eq $original -or ($file.Name -like '*PhotoBridge*Lab*' -and $file.Name -match $versionPattern)) {
    $installers+=$file.FullName
   }
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
   if ($LASTEXITCODE -eq 2 -and (Find-CompatibleOfficialUi $Node)) {return}
  }
 }

 if (Find-OriginalUiInZip $Node $archives) {return}
 foreach ($installer in ($installers | Select-Object -Unique)) {
  if (Find-OriginalUiInInstaller $Node $installer) {return}
 }
 if ($env:OS -eq 'Windows_NT') {
  Add-Type -AssemblyName System.Windows.Forms
  $picker=New-Object System.Windows.Forms.OpenFileDialog
  try {
   $picker.Title='Select the PhotoBridge Lab 1.0.120 setup, source ZIP, or installed application'
   $picker.Filter='PhotoBridge setup or source|*.exe;*.zip|All files|*.*'
   $picker.CheckFileExists=$true
   if ($picker.ShowDialog() -eq 'OK') {
    if ([IO.Path]::GetExtension($picker.FileName) -ieq '.zip') {
     if (Find-OriginalUiInZip $Node @($picker.FileName)) {return}
    }
    $runtime=Get-InstalledRuntime $picker.FileName
    if ($runtime) {
     $env:PB_120_UI_DIR=$runtime
     & $Node (Join-Path $PSScriptRoot 'select-original-ui.cjs')
     if ($LASTEXITCODE -eq 0) {return}
     if ($LASTEXITCODE -eq 2 -and (Find-CompatibleOfficialUi $Node)) {return}
    } elseif ([IO.Path]::GetExtension($picker.FileName) -ieq '.exe') {
     if (Find-OriginalUiInInstaller $Node $picker.FileName) {return}
    }
   }
  } finally {$picker.Dispose()}
 }
 throw 'Original 1.0.120 UI was not found or did not pass verification. Put the original 1.0.120 Lab setup EXE or source ZIP in original-120-ui.'
}

function Find-OriginalUiInZip([string]$Node,[string[]]$Archives) {
 $manifestName='.pb-lab-bundle-manifest.json'
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
     & $Node (Join-Path $PSScriptRoot 'select-original-ui.cjs') | Out-Host
     if ($LASTEXITCODE -eq 0) {return $true}
     if ($LASTEXITCODE -eq 2 -and (Find-CompatibleOfficialUi $Node)) {return $true}
    } catch {Write-Host ('Skipping UI archive candidate: '+$_.Exception.Message)}
    finally {Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue}
   }
  } catch {Write-Host ('Skipping ZIP: '+$_.Exception.Message)}
  finally {if($zip){$zip.Dispose()}}
 }
 return $false
}

function Find-OriginalUiInInstaller([string]$Node,[string]$Installer) {
 $stage=Join-Path ([IO.Path]::GetTempPath()) ('pb120-installer-'+[guid]::NewGuid().ToString('N'))
 try {
  New-Item -ItemType Directory -Path $stage | Out-Null
  $seven=$null
  foreach ($parent in @($env:ProgramFiles,${env:ProgramFiles(x86)})) {
   if ($parent) {
    $candidate=Join-Path $parent '7-Zip/7z.exe'
    if (Test-Path -LiteralPath $candidate -PathType Leaf) {$seven=$candidate;break}
   }
  }
  if (!$seven) {
   $msi=Join-Path $stage '7zip.msi'
   $tools=Join-Path $stage 'tools'
   Write-Host 'Downloading 7-Zip for temporary installer extraction...'
   Invoke-WebRequest -UseBasicParsing -Uri 'https://github.com/ip7z/7zip/releases/download/25.01/7z2501-x64.msi' -OutFile $msi
   if ((Get-FileHash -Algorithm SHA256 -LiteralPath $msi).Hash -ne 'e7eb0b7ed5efa4e087b7b17f191797f7af5b7f442d1290c66f3a21777005ef57') {
    throw '7-Zip download checksum mismatch.'
   }
   $args=@('/a',('"'+$msi+'"'),('TARGETDIR="'+$tools+'"'),'/qn','/norestart')
   $unpack=Start-Process -FilePath (Join-Path $env:SystemRoot 'System32/msiexec.exe') -ArgumentList $args -PassThru -Wait
   if ($unpack.ExitCode -ne 0) {throw ('Could not extract 7-Zip MSI: '+$unpack.ExitCode)}
   $seven=(Get-ChildItem -LiteralPath $tools -Filter '7z.exe' -File -Recurse | Select-Object -First 1).FullName
   if (!$seven) {throw '7-Zip executable missing from extracted tools.'}
  }
  $payload=Join-Path $stage 'payload'
  & $seven x $Installer '-ir!app-64.7z' ('-o'+$payload) '-y' | Out-Host
  if ($LASTEXITCODE -ne 0) {return $false}
  $app=(Get-ChildItem -LiteralPath $payload -Filter 'app-64.7z' -File -Recurse | Select-Object -First 1).FullName
  if (!$app) {return $false}
  $installed=Join-Path $stage 'installed'
  & $seven x $app 'PhotoBridge Lab.exe' 'resources/app.asar' 'resources/runtime/*' ('-o'+$installed) '-y' | Out-Host
  if ($LASTEXITCODE -ne 0) {return $false}
  $package=Join-Path $installed 'resources/app.asar'
  $exe=Join-Path $installed 'PhotoBridge Lab.exe'
  $root=Join-Path $installed 'resources/runtime'
  $version=$null
  if (Test-Path -LiteralPath $package -PathType Leaf) {
   $version=& $Node (Join-Path $PSScriptRoot 'read-installer-app-version.cjs') $package
  }
  $versionInfo=(Get-Item -LiteralPath $exe -ErrorAction SilentlyContinue).VersionInfo
  Write-Host ('Installed executable version: '+$versionInfo.FileVersion+' / '+$versionInfo.ProductVersion)
  Write-Host ('Inner Lab package version: '+$version)
  if ($version -and $version -ne '1.0.120') {
   Write-Host 'The inner Lab package version is different from 1.0.120.'
   return $false
  }
  if (!$version -and $versionInfo.FileVersion -notmatch '^1\.0\.(?:120|13[4-9]|14[0-9]|15[0-2])(?:\.0)?$' -and
     $versionInfo.ProductVersion -notmatch '^1\.0\.(?:120|13[4-9]|14[0-9]|15[0-2])(?:\.0)?$') {
   Write-Host 'Could not verify the installer version as 1.0.120.'
   return $false
  }
  if (!(Test-Path -LiteralPath (Join-Path $root '.pb-lab-bundle-manifest.json') -PathType Leaf) -and
      !(Test-Path -LiteralPath (Join-Path $root 'manifest.json') -PathType Leaf)) {
   return (Find-UiWithoutInstallerManifest $Node $Installer)
  }
  $env:PB_120_UI_DIR=$root
  & $Node (Join-Path $PSScriptRoot 'select-original-ui.cjs') | Out-Host
  $selection=$LASTEXITCODE
  if ($selection -eq 2) {return (Find-CompatibleOfficialUi $Node)}
  return ($selection -eq 0)
 } catch {
  Write-Host ('Could not recover UI from installer: '+$_.Exception.Message)
  return $false
 } finally {Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue}
}

function Find-UiWithoutInstallerManifest([string]$Node,[string]$Installer) {
 Write-Host 'No bundled UI manifest was found. Checking the original release kit, then the verified official UI.'
 $kit=Split-Path -Parent $Installer
 while ($kit -and (Split-Path -Leaf $kit) -notlike 'kit-*') {
  $parent=Split-Path -Parent $kit
  if ($parent -eq $kit) {$kit=$null;break}
  $kit=$parent
 }
 if ($kit) {
  foreach ($candidate in @('verified-ui','native/verified-ui','runtime','release/win-unpacked/resources/runtime')) {
   $root=Join-Path $kit $candidate
   if ((Test-Path -LiteralPath (Join-Path $root '.pb-lab-bundle-manifest.json') -PathType Leaf) -or
       (Test-Path -LiteralPath (Join-Path $root 'manifest.json') -PathType Leaf)) {
    $env:PB_120_UI_DIR=$root
    & $Node (Join-Path $PSScriptRoot 'select-original-ui.cjs') | Out-Host
    if ($LASTEXITCODE -eq 0) {return $true}
   }
  }
 }
 return (Find-CompatibleOfficialUi $Node)
}

function Find-CompatibleOfficialUi([string]$Node) {
 Write-Host 'Using native 1.0.120 source. Checking the downloaded official UI for both required features.'
 if ($env:APPDATA) {
  foreach ($name in @('PhotoBridge Lab','photobridge-lab-desktop')) {
   $database=Join-Path (Join-Path $env:APPDATA $name) 'lab.sqlite'
   if (!(Test-Path -LiteralPath $database -PathType Leaf)) {continue}
   $cached=@(& $Node --disable-warning=ExperimentalWarning (Join-Path $PSScriptRoot 'read-original-ui-profile.cjs') $database '--compatible-cache')
   foreach ($root in $cached) {
    $env:PB_120_UI_DIR=$root
    & $Node (Join-Path $PSScriptRoot 'select-original-ui.cjs') | Out-Host
    if ($LASTEXITCODE -eq 0) {return $true}
   }
  }
 }
 $stage=Join-Path ([IO.Path]::GetTempPath()) ('pb120-official-'+[guid]::NewGuid().ToString('N'))
 try {
  Write-Host 'Checking the official PhotoBridge server for a verified compatible UI...'
  & $Node (Join-Path $PSScriptRoot 'fetch-compatible-ui.cjs') $stage | Out-Host
  return ($LASTEXITCODE -eq 0)
 } finally {Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue}
}
