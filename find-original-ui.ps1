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
 throw 'Original 1.0.120 UI was not found or did not pass verification. Put the original 1.0.120 source ZIP in original-120-ui. The EXE alone is not a source ZIP.'
}
