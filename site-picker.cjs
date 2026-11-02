'use strict';
const crypto=require('node:crypto'),path=require('node:path');
const {configuredPath}=require('./configured-storage.cjs');
async function probe(storage,value){const folder=configuredPath(value);let current=folder.slice(0,3);for(const part of folder.slice(3).split('\\')){current=path.win32.join(current,part);if((await storage.fs.lstat(current)).isSymbolicLink())throw Error('unsafe_link')}const canonical=await storage.fs.realpath(folder);if(path.win32.normalize(canonical).toLowerCase()!==folder.toLowerCase()||!(await storage.fs.stat(canonical)).isDirectory())throw Error('folder_changed');const file=path.join(canonical,'.photobridge-check-'+crypto.randomUUID());let handle;try{handle=await storage.fs.open(file,'wx');await handle.writeFile('PhotoBridge');await handle.sync()}finally{await handle?.close();await storage.fs.unlink(file).catch(()=>{})}return canonical;}
function installSitePicker(storage){
 let running=false;
 storage.pollSitePicker=async function(){
  if(running||this.selection||this.writers.size)return;let account;try{account=this.account()}catch{return}running=true;let job;
  const call=async(action,payload={})=>{this.checkAccount(account);const response=await this.request('/api/lab/storage-picker',action?{method:'POST',body:JSON.stringify({action,...payload})}:{});const data=await response.json();this.checkAccount(account);if(!response.ok||response.status===202)throw Error(data.display||data.error||'picker_unconfirmed');return data};
  try{
   job=(await call()).job;if(job&&job.deviceId!=='pblab-'+this.store.get('deviceId'))return;if(!job||!['pending','activating'].includes(job.state))return;
   const work=async()=>{
    let canonical;
    if(job.state==='pending'){
     await call('claim',{id:job.id});
     const chosen=await this.selectDirectory();this.checkAccount(account);
     if(chosen.canceled||!chosen.filePaths?.[0]){await call('fail',{id:job.id,cancelled:true});return}
     if(this.writers.size)throw Error('download_busy');canonical=await probe(this,chosen.filePaths[0]);this.checkAccount(account);
     job=(await call('finish',{id:job.id,path:canonical})).job;
    }
    // Resume a server-confirmed selection after restart/temporary network failure.
    if(job.state!=='activating')throw Error('picker_unconfirmed');
    canonical=canonical||await probe(this,job.path);this.checkAccount(account);
    const target=await this.target();this.checkAccount(account);
    if(!target.active||!target.isThisDevice||!target.isSelectedDevice||target.path!==job.path||target.revision!==job.revision)throw Error('storage_target_changed');
    if(this.writers.size)throw Error('download_busy');
    this.rememberRoot({id:crypto.randomUUID(),path:canonical,configuredPath:target.path,configurationRevision:target.revision,selectedAt:new Date().toISOString(),configurationBlocked:false},account);
    await call('ack',{id:job.id});
   };
   this.selection=work();try{await this.selection}finally{this.selection=null}
  }catch(error){if(job&&job.state!=='activating'&&this.getAccount()===account)await call('fail',{id:job.id}).catch(()=>{});return {error:String(error.message||error)}}finally{running=false}
 };
 return storage;
}
module.exports={installSitePicker,probe};
