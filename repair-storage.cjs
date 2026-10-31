'use strict';
const crypto=require('node:crypto');
const {LocalBusiness}=require('./local-business.cjs');
const {safeName,groupName}=require('./local-files-host.cjs');
const {fileProof}=require('./local-file-proof.cjs');
function serverParts(order,file){
 const parts=new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(order.downloaded_at||order.created_at));
 const day=['year','month','day'].map(k=>parts.find(p=>p.type===k)?.value).join('-');if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('server_storage_date_missing');
 const customer=order.source==='walkin'?String(order.customer_name||'مشتری')+(order.customer_mobile?'-'+order.customer_mobile:''):order.customer_name||'مشتری';
 return[day,safeName(customer,'photographer'),safeName(groupName(order,file)),safeName(file.original_name,'file')];
}
async function repairStorage(store,request,storage){
 const lab=store.get('labId'),engine=new LocalBusiness(store);if(!storage||!store.get(engine.key()))return;
 const same=()=>{if(store.get('labId')!==lab||!store.get('auth'))throw Error('account_changed');};
 const save=(orderId,fn)=>{same();store.transaction(()=>{const state=engine.state();fn(state.orders[orderId]);store.set(engine.key(),state);});};
 for(const order of Object.values(engine.state().orders).filter(o=>!o.remote&&o.serverId&&o.localFiles?.length)){
  try{
   same();const current=store.get('nativeStorageRoot:'+lab);if(!current)continue;
   if(order.serverStorageVersion===1&&order.serverStorageRoot===current.id)continue;
   const response=await request('/api/lab/orders/'+order.serverId);same();if(!response.ok)throw Error('server_order_details_unavailable');const detail=await response.json();same();if(detail.order?.id!==order.serverId||detail.files?.length!==order.files.length)throw Error('server_file_manifest_mismatch');
   const plans=detail.files.map(file=>{const indexes=order.files.map((f,i)=>({f,i})).filter(({f})=>f.id===file.id||(f.original_name===file.original_name&&Number(f.bytes)===Number(file.bytes)));if(indexes.length!==1)throw Error('server_file_mapping_ambiguous');const source=order.localFiles[indexes[0].i];if(!source?.sha256||Number(source.bytes)!==Number(file.bytes))throw Error('local_files_not_verified');return{source,target:{rootId:current.id,parts:serverParts(detail.order,file),bytes:Number(file.bytes)},file};});
   if(new Set(plans.map(p=>p.target.parts.join('/').toLowerCase())).size!==plans.length)throw Error('server_storage_name_collision');
   for(const {source,target} of plans){
    same();if(await fileProof(storage,source)!==source.sha256)throw Error('local_file_hash_mismatch');same();
    let exists=false;try{await storage.operation('stat',target);exists=true;}catch(e){if(!['ENOENT','NotFoundError'].includes(e.code||e.name))throw e;}
    if(exists){if(await fileProof(storage,target)!==source.sha256)throw Error('server_storage_existing_file_conflict');continue;}
    for(let depth=1;depth<target.parts.length;depth++){same();await storage.operation('directory',{rootId:target.rootId,parts:target.parts.slice(0,depth),create:true});}
    const id=await storage.operation('begin',target),hash=crypto.createHash('sha256');try{for(let offset=0;offset<source.bytes;offset+=1024*1024){same();const length=Math.min(1024*1024,source.bytes-offset),bytes=await storage.operation('read',{...source,offset,length});if(bytes.length!==length)throw Error('local_file_changed');hash.update(bytes);await storage.writer('write',{id,bytes});}if(hash.digest('hex')!==source.sha256)throw Error('local_file_hash_mismatch');same();await storage.writer('close',{id,noReplace:true});}catch(e){await storage.writer('abort',{id}).catch(()=>{});throw e;}
    if(await fileProof(storage,target)!==source.sha256)throw Error('local_file_hash_mismatch');same();
   }
   save(order.id,o=>{o.serverStorageVersion=1;o.serverStorageRoot=current.id;o.serverLocalFiles=plans.map(p=>({...p.target,sha256:p.source.sha256}));delete o.storageRepairError;});
  }catch(error){if(error.message==='account_changed')throw error;save(order.id,o=>{o.storageRepairError={code:error.code||error.message};});}
 }
}
module.exports={repairStorage,serverParts};
