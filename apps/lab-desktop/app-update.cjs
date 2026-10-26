'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {valid,newer}=require('./update-trust.cjs');
class AppUpdate{
 constructor(options){Object.assign(this,options);this.flight=null;this.installing=false;this.ready=null;}
 async checkedFile(manifest){if(!valid(manifest,this.publicKey)||!newer(manifest.version,this.version))throw Error('invalid_update_manifest');const file=path.join(this.directory,manifest.sha256+'.exe'),hash=crypto.createHash('sha256');const handle=await fs.open(file,'r');try{if((await handle.stat()).size!==manifest.size)throw Error('update_size_mismatch');for await(const chunk of handle.createReadStream({autoClose:false}))hash.update(chunk);}finally{await handle.close();}if(hash.digest('hex')!==manifest.sha256)throw Error('update_hash_mismatch');return file;}
 async check(){if(this.flight)return this.flight;this.flight=this.checkOnce().finally(()=>this.flight=null);return this.flight;}
 async checkOnce(){const account=this.getAccount();if(!account)return {state:'login_required'};const same=()=>{if(this.getAccount()!==account)throw Error('update_account_changed');};
  const response=await this.request('/api/lab/desktop-installer/update');if(!response.ok)throw Error('update_check_failed');const {update}=await response.json();same();if(!update)return {state:'unavailable'};
  if(!valid(update,this.publicKey))throw Error('invalid_update_signature');if(!newer(update.version,this.version))return {state:'current'};
  if(this.highest&&newer(this.highest,update.version))throw Error('update_rollback_blocked');this.highest=update.version;this.onVersion?.(update.version);
  await fs.mkdir(this.directory,{recursive:true});
  try{await this.checkedFile(update);same();this.ready=update;return {state:'ready',version:update.version};}catch(e){if(e.code!=='ENOENT'&&!['update_size_mismatch','update_hash_mismatch'].includes(e.message))throw e;}
  if(this.confirmDownload&&!await this.confirmDownload(update)){same();return {state:'available',version:update.version};}same();
  this.onState?.({state:'downloading',version:update.version,percent:0});const temp=path.join(this.directory,crypto.randomUUID()+'.part'),file=path.join(this.directory,update.sha256+'.exe');let handle;
  try{const result=await this.request('/api/lab/desktop-installer',{signal:AbortSignal.timeout(15*60*1000)});if(!result.ok||!result.body)throw Error('update_download_failed');handle=await fs.open(temp,'wx');let loaded=0;const hash=crypto.createHash('sha256');for await(const chunk of result.body){same();loaded+=chunk.length;if(loaded>update.size)throw Error('update_size_mismatch');hash.update(chunk);let offset=0;while(offset<chunk.length){const {bytesWritten}=await handle.write(chunk,offset,chunk.length-offset);if(!bytesWritten)throw Error('update_write_failed');offset+=bytesWritten;}this.onState?.({state:'downloading',version:update.version,percent:Math.floor(loaded*100/update.size)});}if(loaded!==update.size||hash.digest('hex')!==update.sha256)throw Error('update_hash_mismatch');same();await handle.sync();await handle.close();handle=null;await fs.rm(file,{force:true});await fs.rename(temp,file);this.ready=update;this.onState?.({state:'ready',version:update.version,percent:100});return{state:'ready',version:update.version};
  }catch(e){await handle?.close().catch(()=>{});await fs.rm(temp,{force:true}).catch(()=>{});throw e;}
 }
 async install(){if(this.flight||this.installing)throw Error('update_busy');if(!this.ready)throw Error('update_not_ready');if(this.highest&&newer(this.highest,this.ready.version))throw Error('update_rollback_blocked');this.installing=true;try{if(!await this.canInstall())throw Error('finish_current_work');const file=await this.checkedFile(this.ready);if(!await this.canInstall())throw Error('finish_current_work');await this.launch(file,['--updated','/S','--force-run']);await this.quit();return true;}finally{this.installing=false;}}
}
module.exports={AppUpdate};
