'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),{execFile}=require('node:child_process');
const {promisify}=require('node:util'),run=promisify(execFile);
const scriptName='access-forms.vbs';
async function addForms(file,{platform=process.platform,runner=run,validate=async()=>{}}={}){
 if(platform!=='win32')return{created:false,reason:'forms_require_windows_access'};
 // Work against a copy: an unavailable Access installation or incomplete form
 // must never damage the verified Jackcess-generated data-only report.
 const staged=file+'.forms-staging.accdb',vbs=file+'.forms-staging.vbs';
 try{
  const script=await fs.readFile(path.join(__dirname,scriptName),'utf8');
  await fs.copyFile(file,staged,require('node:fs').constants.COPYFILE_EXCL);
  await fs.writeFile(vbs,'\ufeff'+script,'utf16le');
  const result=await runner('cscript.exe',['//Nologo',vbs,staged],{windowsHide:true,timeout:120000,maxBuffer:1024*1024});
  if(!String(result?.stdout||'').includes('forms_created'))throw Error('access_forms_unconfirmed');
  await validate(staged);
  await fs.copyFile(staged,file);
  return{created:true};
 }catch(error){
  return{created:false,reason:String(error?.stdout||error?.stderr||error?.message||'access_forms_failed').trim().slice(0,400)};
 }finally{
  await fs.rm(staged,{force:true}).catch(()=>{});
  await fs.rm(vbs,{force:true}).catch(()=>{});
 }
}
module.exports={addForms};
