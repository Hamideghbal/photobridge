'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {valid,newer}=require('./update-trust.cjs');
class AppUpdate{
 constructor(options){Object.assign(this,options);this.flight=null;this.installing=false;this.ready=null;this.downloadController=null;}
 cancelDownload(){if(this.downloadController&&!this.downloadController.signal.aborted)this.downloadController.abort(Error('update_cancelled'));}
 async checkedFile(manifest){if(!valid(manifest,this.publicKey)||!newer(manifest.version,this.version))throw Error('invalid_update_manifest');const file=path.join(this.directory,manifest.sha256+'.exe'),hash=crypto.createHash('sha256');const handle=await fs.open(file,'r');try{if((await handle.stat()).size!==manifest.size)throw Error('update_size_mismatch');for await(const chunk of handle.createReadStream({autoClose:false}))hash.update(chunk);}finally{await handle.close();}if(hash.digest('hex')!==manifest.sha256)throw Error('update_hash_mismatch');return file;}
 async check(){if(this.flight)return this.flight;this.flight=this.checkOnce().finally(()=>this.flight=null);return this.flight;}
 async checkOnce(){const account=this.getAccount();if(!account)return {state:'login_required'};const same=()=>{if(this.getAccount()!==account)throw Error('update_account_changed');};
  const response=await this.request('/api/lab/desktop-installer/update');if(!response.ok)throw Error('update_check_failed');const {update}=await response.json();same();if(!update)return {state:'unavailable'};
  if(!valid(update,this.publicKey))throw Error('invalid_update_signature');if(!newer(update.version,this.version))return {state:'current'};
  if(this.highest&&newer(this.highest,update.version))throw Error('update_rollback_blocked');this.highest=update.version;this.onVersion?.(update.version);
  await fs.mkdir(this.directory,{recursive:true});
  try{await this.checkedFile(update);same();this.ready=update;return {state:'ready',version:update.version};}catch(e){if(e.code!=='ENOENT'&&!['update_size_mismatch','update_hash_mismatch'].includes(e.message))throw e;}
  if(this.confirmDownload&&!await this.confirmDownload(update)){same();return {state:'available',version:update.version};}same();
  const temp=path.join(this.directory,update.sha256+'.part'),file=path.join(this.directory,update.sha256+'.exe');let handle;const controller=new AbortController();this.downloadController=controller;let stalledTimer;
  const armStallTimeout=()=>{clearTimeout(stalledTimer);stalledTimer=setTimeout(()=>controller.abort(Error('update_stalled')),this.downloadStallTimeoutMs||120000);stalledTimer.unref?.();};
  try{
   let offset=0;try{const stat=await fs.stat(temp);offset=stat.size;if(offset>=update.size){if(offset===update.size){const partial=await fs.readFile(temp),sum=crypto.createHash('sha256').update(partial).digest('hex');if(sum===update.sha256){await fs.rename(temp,file);this.ready=update;this.onState?.({state:'ready',version:update.version,percent:100,loadedBytes:update.size,totalBytes:update.size});return{state:'ready',version:update.version};}}await fs.rm(temp,{force:true});offset=0;} }catch(e){if(e.code!=='ENOENT')throw e;}
   this.onState?.({state:'connecting',version:update.version,percent:Math.floor(offset*100/update.size),loadedBytes:offset,totalBytes:update.size});
   armStallTimeout();let result=await this.request('/api/lab/desktop-installer',{headers:offset?{Range:`bytes=${offset}-`}:undefined,signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15*60*1000)])});
   if(!result.ok||!result.body)throw Error('update_download_failed');
   if(offset&&result.status===200){offset=0;await fs.rm(temp,{force:true});}
   else if(offset&&result.status!==206)throw Error('update_resume_rejected');
   if(offset){const range=result.headers?.get?.('content-range')||'';const match=range.match(/^bytes (\d+)-(\d+)\/(\d+)$/);if(!match||Number(match[1])!==offset||Number(match[3])!==update.size)throw Error('update_resume_invalid');}
   this.onState?.({state:'downloading',version:update.version,percent:Math.floor(offset*100/update.size),loadedBytes:offset,totalBytes:update.size});
   handle=await fs.open(temp,offset?'r+':'w');if(offset)await handle.write(Buffer.alloc(0),0,0,offset);
   let loaded=offset;const hash=crypto.createHash('sha256');if(offset){const previous=await fs.open(temp,'r');try{for await(const chunk of previous.createReadStream({start:0,end:offset-1,autoClose:false}))hash.update(chunk);}finally{await previous.close();}}
   for await(const chunk of result.body){same();armStallTimeout();loaded+=chunk.length;if(loaded>update.size)throw Error('update_size_mismatch');hash.update(chunk);let written=0;while(written<chunk.length){const {bytesWritten}=await handle.write(chunk,written,chunk.length-written,loaded-chunk.length+written);if(!bytesWritten)throw Error('update_write_failed');written+=bytesWritten;}this.onState?.({state:'downloading',version:update.version,percent:Math.floor(loaded*100/update.size),loadedBytes:loaded,totalBytes:update.size});}
   clearTimeout(stalledTimer);if(loaded!==update.size)throw Error('update_size_mismatch');this.onState?.({state:'verifying',version:update.version,percent:100,loadedBytes:loaded,totalBytes:update.size});if(hash.digest('hex')!==update.sha256)throw Error('update_hash_mismatch');same();await handle.sync();await handle.close();handle=null;await fs.rm(file,{force:true});await fs.rename(temp,file);this.ready=update;this.onState?.({state:'ready',version:update.version,percent:100,loadedBytes:update.size,totalBytes:update.size});return{state:'ready',version:update.version};
  }catch(e){clearTimeout(stalledTimer);await handle?.close().catch(()=>{});if(['update_size_mismatch','update_hash_mismatch','update_resume_invalid','update_resume_rejected','update_account_changed'].includes(e.message))await fs.rm(temp,{force:true}).catch(()=>{});if(controller.signal.aborted){const reason=controller.signal.reason;throw Error(reason?.message==='update_cancelled'?'update_cancelled':'update_stalled');}throw e;}finally{clearTimeout(stalledTimer);if(this.downloadController===controller)this.downloadController=null;}
 }
 async install(){if(this.flight||this.installing)throw Error('update_busy');if(!this.ready)throw Error('update_not_ready');if(this.highest&&newer(this.highest,this.ready.version))throw Error('update_rollback_blocked');this.installing=true;try{if(!await this.canInstall())throw Error('finish_current_work');const file=await this.checkedFile(this.ready);if(!await this.canInstall())throw Error('finish_current_work');this.onState?.({state:'installing',version:this.ready.version,percent:100});await this.launch(file,['--updated','/S','--force-run']);await this.quit();return true;}finally{this.installing=false;}}
}
module.exports={AppUpdate};
