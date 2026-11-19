param([Parameter(Mandatory=$true)][string]$Archive,[Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference='Stop'
# Windows PowerShell 5.1 Expand-Archive may call an unavailable 3-argument
# ExtractToDirectory overload on the Windows CI runner. Use the compatible
# 2-argument overload for the already SHA-256-verified vendor runtime ZIP.
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($Archive, $Destination)
