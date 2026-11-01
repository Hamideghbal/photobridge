'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{execFile}=require('node:child_process');
const run=require('node:util').promisify(execFile);
async function addReports(file,{platform=process.platform,runner=run,ownerRunner=run,validate=async()=>{},timeout=120000}={}){
 if(platform!=='win32')return{created:false,reason:'reports_require_windows_access'};
 // Work outside the backup bundle: a locked optional report must never block
 // publishing/cleaning the verified data backup, even when Office is unresponsive.
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'pb-access-report-')),staged=path.join(folder,'report.accdb'),vbs=path.join(folder,'build.vbs'),ownerFile=path.join(folder,'owner.json'),ownerScript=path.join(folder,'owner.ps1');
 let owned=false,stopped=false;
 const owner=async action=>ownerRunner('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',ownerScript,'-Action',action,'-OwnerFile',ownerFile],{windowsHide:true,timeout:20000,maxBuffer:1024*1024});
 try{
  await fs.copyFile(file,staged,require('node:fs').constants.COPYFILE_EXCL);
  await fs.writeFile(ownerScript,await fs.readFile(path.join(__dirname,'access-worker-owner.ps1')));
  await fs.writeFile(vbs,'\ufeff'+await fs.readFile(path.join(__dirname,'access-reports.vbs'),'utf8'),'utf16le');
  await owner('Begin');owned=true;
  const result=await runner('cscript.exe',['//Nologo',vbs,staged,ownerFile,ownerScript],{windowsHide:true,timeout,maxBuffer:1024*1024});
  if(!String(result?.stdout||'').includes('reports_created'))throw Error('access_reports_unconfirmed');
  await owner('Stop');stopped=true;
  await validate(staged);await fs.copyFile(staged,file);return{created:true};
 }catch(error){
  const progress=await fs.readFile(ownerFile+'.progress').catch(()=>Buffer.alloc(0)),phase=progress[0]===255&&progress[1]===254?progress.subarray(2).toString('utf16le'):progress.toString('utf8'),reason=error.killed||error.code==='ETIMEDOUT'?'access_report_timeout':String(error.stdout||error.stderr||error.message||'access_reports_failed').trim();
  return{created:false,reason:(reason+(phase?' · stage: '+phase.trim():'' )).slice(0,600)};
 }finally{
  if(owned&&!stopped)await owner('Stop').catch(()=>{});
  await fs.rm(folder,{recursive:true,force:true,maxRetries:5,retryDelay:200}).catch(()=>{});
 }
}
module.exports={addReports};
