'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),{execFile}=require('node:child_process');
const {promisify}=require('node:util'),run=promisify(execFile);
const scriptName='access-reports.vbs';
async function addReports(file,{platform=process.platform,runner=run,validate=async()=>{}}={}){
 if(platform!=='win32')return{created:false,reason:'reports_require_windows_access'};
 // Work against a copy: an unavailable Access installation or incomplete report
 // must never damage the verified Jackcess-generated data-only database.
 const staged=file+'.reports-staging.accdb',vbs=file+'.reports-staging.vbs';
 try{
  const script=await fs.readFile(path.join(__dirname,scriptName),'utf8');
  await fs.copyFile(file,staged,require('node:fs').constants.COPYFILE_EXCL);
  await fs.writeFile(vbs,'\ufeff'+script,'utf16le');
  const result=await runner('cscript.exe',['//Nologo',vbs,staged],{windowsHide:true,timeout:120000,maxBuffer:1024*1024});
  if(!String(result?.stdout||'').includes('reports_created'))throw Error('access_reports_unconfirmed');
  await validate(staged);
  await fs.copyFile(staged,file);
  return{created:true};
 }catch(error){
  return{created:false,reason:String(error?.stdout||error?.stderr||error?.message||'access_reports_failed').trim().slice(0,400)};
 }finally{
  await fs.rm(staged,{force:true}).catch(()=>{});
  await fs.rm(vbs,{force:true}).catch(()=>{});
 }
}
module.exports={addReports};
