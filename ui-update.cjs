'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const ROOT_FILE='index.html',MAX_FILE_BYTES=20e6;
function validRoot(root){try{return Boolean(root&&fs.statSync(path.join(root,ROOT_FILE)).isFile())}catch{return false}}
function validate(manifest){
 if(manifest.protocol!==1)throw Error('native_update_required');
 if(!/^[a-f0-9]{64}$/.test(manifest.build)||!Array.isArray(manifest.files)||manifest.files.length>2000||!manifest.files.some(f=>f.name===ROOT_FILE))throw Error('invalid_ui_manifest');
 if(hash(JSON.stringify(manifest.files))!==manifest.build)throw Error('ui_manifest_hash_mismatch');
 const names=new Set();for(const f of manifest.files){if(typeof f.name!=='string'||!/^[a-zA-Z0-9_./-]+$/.test(f.name)||f.name.startsWith('/')||f.name.includes('..')||names.has(f.name)||f.url!=='/lab-desktop-ui/'+f.name||!/^[a-f0-9]{64}$/.test(f.sha256))throw Error('invalid_update_path');names.add(f.name);}
}
// Keep exact per-file hash verification; asynchronous reads avoid monopolizing Electron's main loop.
async function verified(root,f){try{const file=path.join(root,f.name),stat=await fs.promises.stat(file);if(!stat.isFile()||stat.size>MAX_FILE_BYTES)return null;const bytes=await fs.promises.readFile(file);return bytes.length<=MAX_FILE_BYTES&&hash(bytes)===f.sha256?bytes:null}catch{return null}}
async function everyVerified(root,files){for(const f of files){if(!await verified(root,f))return false}return true}
async function fetchManifest(request,timeout){let last;for(const endpoint of ['/api/desktop-ui/lab-manifest','/api/lab/desktop-ui-manifest']){try{const r=await request(endpoint,{signal:AbortSignal.timeout(Math.min(Math.max(timeout,8000),15000)),anonymous:true,headers:{'Cache-Control':'no-cache','Pragma':'no-cache'}});if(r.ok)return await r.json();last=Error(r.status===401?'login_required':'ui_manifest_unavailable_'+r.status);if(![401,403,404,503].includes(r.status))throw last}catch(error){last=error}}throw last||Error('ui_manifest_unavailable')}
async function remote(request,url,remaining){if(remaining<=0)throw Error('ui_update_timeout');const r=await request(url,{signal:AbortSignal.timeout(Math.max(1,Math.min(30000,remaining))),anonymous:true,headers:{'Cache-Control':'no-cache','Pragma':'no-cache'}});if(!r.ok)throw Error('update_download_failed');if(Number(r.headers?.get('content-length'))>MAX_FILE_BYTES)throw Error('update_too_large');const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length>MAX_FILE_BYTES)throw Error('update_too_large');return bytes;}
async function cleanup(directory,keep){try{for(const ent of await fs.promises.readdir(directory,{withFileTypes:true})){if(!ent.isDirectory())continue;const full=path.join(directory,ent.name);if((/^[a-f0-9]{64}$/.test(ent.name)||/^[a-f0-9]{64}\.partial$/.test(ent.name))&&!keep.has(full))await fs.promises.rm(full,{recursive:true,force:true});}}catch{}}
async function updateUi({store,request,bundled,directory,timeout=120000,onProgress=()=>{},acceptRoot=()=>{},retryFailedBuild=false,getActiveRoot=()=>null}){
 const manifest=await fetchManifest(request,timeout);validate(manifest);/* R1959 native UI refresh */store.set('uiRemoteBuild',manifest.build);store.set('uiRemoteFileCount',manifest.files.length);if(manifest.build===store.get('uiFailedBuild')&&!retryFailedBuild)throw Error('ui_build_quarantined');
 const target=path.join(directory,manifest.build);
 if(manifest.build===store.get('uiBuild')&&validRoot(target)&&await everyVerified(target,manifest.files)){acceptRoot(target);const oldRoot=store.get('uiRoot'),pending=oldRoot!==target;store.transaction(()=>{if(pending){store.set('uiPreviousRoot',validRoot(oldRoot)?oldRoot:null);store.set('uiPreviousBuild',store.get('uiBuild')||null);store.set('uiRoot',target)}store.set('uiLastCheckedAt',new Date().toISOString());store.set('updateError',null)});return pending;}
 // The installer can contain the exact currently published UI snapshot.
 // Activating that trusted snapshot on first run avoids re-downloading hundreds
 // of identical assets and ensures the first login uses the latest packaged UI.
 // Older installers without the snapshot keep the existing verified downloader.
 try{
  const embedded=JSON.parse(await fs.promises.readFile(path.join(bundled,'.pb-lab-bundle-manifest.json'),'utf8'));
  if(embedded.build===manifest.build&&validRoot(bundled)&&await everyVerified(bundled,manifest.files)){
   acceptRoot(bundled);const previousRoot=validRoot(store.get('uiRoot'))?store.get('uiRoot'):null;
   store.transaction(()=>{
    store.set('uiPreviousRoot',previousRoot);
    store.set('uiPreviousBuild',store.get('uiBuild')||null);
    store.set('uiRoot',bundled);
    store.set('uiBuild',manifest.build);
    store.set('uiDownloadedAt',new Date().toISOString());
    store.set('uiLastCheckedAt',new Date().toISOString());
    store.set('updateError',null);
   });
   return previousRoot!==bundled;
  }
 }catch{/* No valid embedded snapshot: safely use the existing verified remote downloader. */}
 const previousRoot=validRoot(store.get('uiRoot'))?store.get('uiRoot'):null,previousBuild=store.get('uiBuild')||null,staging=target+'.partial',deadline=Date.now()+Math.max(timeout,manifest.files.length>500?600000:30000);fs.mkdirSync(staging,{recursive:true});let cursor=0,count=0,failure;
 async function worker(){while(!failure){const i=cursor++;if(i>=manifest.files.length)return;const f=manifest.files[i];try{if(Date.now()>=deadline)throw Error('ui_update_timeout');const file=path.join(staging,f.name);let content;for(const root of [staging,previousRoot,bundled].filter(Boolean)){content=await verified(root,f);if(content)break;}if(!content){let last=null;for(let attempt=1;attempt<=3;attempt++){try{content=await remote(request,f.url,deadline-Date.now());last=null;break}catch(error){last=error;if(Date.now()>=deadline||attempt===3||['update_too_large','ui_update_timeout'].includes(error.message))break;await new Promise(resolve=>setTimeout(resolve,250*attempt));}}if(last)throw last;}if(hash(content)!==f.sha256)throw Error('update_hash_mismatch');await fs.promises.mkdir(path.dirname(file),{recursive:true});await fs.promises.writeFile(file+'.download',content);await fs.promises.rename(file+'.download',file);onProgress(++count,manifest.files.length);}catch(error){failure=error;}}}
 try{await Promise.all(Array.from({length:Math.min(4,manifest.files.length)},worker));if(failure)throw failure;
 if(!manifest.files.some(f=>f.name==='desktop-overlay.js')&&fs.existsSync(path.join(bundled,'desktop-overlay.js')))fs.copyFileSync(path.join(bundled,'desktop-overlay.js'),path.join(staging,'desktop-overlay.js'));
 if(!validRoot(staging))throw Error('ui_root_missing');fs.writeFileSync(path.join(staging,'.pb-lab-bundle-manifest.json'),JSON.stringify(manifest));acceptRoot(staging);const backup=target+'.replaced';fs.rmSync(backup,{recursive:true,force:true});const existed=fs.existsSync(target);if(existed)fs.renameSync(target,backup);try{fs.renameSync(staging,target);}catch(error){if(existed)fs.renameSync(backup,target);throw error;}fs.rmSync(backup,{recursive:true,force:true});
 store.transaction(()=>{store.set('uiPreviousRoot',previousRoot);store.set('uiPreviousBuild',previousBuild);store.set('uiRoot',target);store.set('uiBuild',manifest.build);store.set('uiDownloadedAt',new Date().toISOString());store.set('uiLastCheckedAt',new Date().toISOString());store.set('updateError',null);});await cleanup(directory,new Set([target,previousRoot,getActiveRoot(),store.get('uiKnownGoodRoot')].filter(Boolean)));return true;
 }catch(error){store.set('uiLastCheckedAt',new Date().toISOString());store.set('uiLastUpdateFailureAt',new Date().toISOString());store.set('updateError',String(error.message||error));throw error;}
}
module.exports={updateUi};
