'use strict';
// Start an already verified NSIS installer only after PhotoBridge has exited.
// Keep existing Ed25519 manifest, hash, and unsaved-work checks unchanged.
const {spawn}=require('node:child_process');
const {Buffer}=require('node:buffer');
const path=require('node:path');
function validate({file,manifest,parentPid,args}){
 if(typeof file!=='string'||!path.win32.isAbsolute(file)||/[\r\n\x00]/.test(file)||
 !/^\d{1,5}\.\d{1,5}\.\d{1,5}$/.test(manifest?.version||'')||
 !/^[a-f0-9]{64}$/.test(manifest?.sha256||'')||
 !Number.isSafeInteger(manifest.size)||manifest.size<1||
 !Number.isSafeInteger(parentPid)||parentPid<1||
 !Array.isArray(args)||args.join('\0')!==['--updated','/S','--force-run'].join('\0'))
 throw Error('invalid_verified_update_handoff');
}
function makePowerShell({file,manifest,parentPid,args}){
 validate({file,manifest,parentPid,args});
 const b64=s=>Buffer.from(s,'utf8').toString('base64');
 const read=s=>" [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('"+b64(s)+"'))";
 return [
  "$ErrorActionPreference='Stop'",
  '$target='+read(file),
  '$expectedHash='+read(manifest.sha256),
  '$expectedSize=[int64]'+manifest.size,
  '$oldPid='+parentPid,
  '$until=[DateTime]::UtcNow.AddMinutes(10)',
  'while((Get-Process -Id $oldPid -ErrorAction SilentlyContinue) -and ([DateTime]::UtcNow -lt $until)){Start-Sleep -Milliseconds 400}',
  'if(Get-Process -Id $oldPid -ErrorAction SilentlyContinue){exit 24}',
  'try {',
  ' $item=Get-Item -LiteralPath $target -ErrorAction Stop',
  ' if(-not $item -or $item.Length -ne $expectedSize){exit 25}',
  ' $stream=[IO.File]::OpenRead($target)',
  ' try {$sha=[Security.Cryptography.SHA256]::Create();try {$actual=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace("-","").ToLowerInvariant()} finally {$sha.Dispose()}} finally {$stream.Dispose()}',
  ' if($actual -cne $expectedHash){exit 26}',
  " $proc=Start-Process -FilePath $target -ArgumentList @('/S','--updated','--force-run') -PassThru -Wait",
  ' if($null -eq $proc -or $proc.ExitCode -ne 0){exit 27}',
  ' exit 0',
  '} catch {exit 28}'
 ].join('\r\n');
}
function launchVerifiedAfterExit({file,args,manifest,parentPid=process.pid,platform=process.platform,spawnImpl=spawn}){
 if(platform!=='win32')return Promise.reject(Error('windows_only_verified_update'));
 const script=makePowerShell({file,args,manifest,parentPid});
 return new Promise((resolve,reject)=>{
  let child;
  try{child=spawnImpl('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{detached:true,stdio:'ignore',windowsHide:true});}
  catch(error){reject(error);return;}
  child.once('error',reject);
  child.once('spawn',()=>{child.unref?.();resolve(true)});
 });
}
module.exports={makePowerShell,launchVerifiedAfterExit};
