'use strict';
const crypto=require('node:crypto');
const key=store=>'offlineOrders:'+store.get('labId');
const list=store=>store.get(key(store))||[];
const save=(store,rows)=>store.set(key(store),rows);
const canonical=url=>new URL(url,'http://local').pathname.replace(/\/download$/,'');
const localName=f=>{const name=String(f.name||'file'),copies=Number(f.printCopies||1),dot=name.lastIndexOf('.');return copies>1?(dot>0?name.slice(0,dot):name)+' = '+copies+(dot>0?name.slice(dot):''):name;};
const uuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''));
function result(draft){return {ok:true,desktopPending:true,offline:true,orderId:draft.id,orderNumber:draft.number,customerId:draft.body.customerId,status:'pending_server_confirmation'};}
function localRequest(store,method,url,body={}){
 const pathname=canonical(url),rows=list(store);
 if(method==='POST'&&pathname==='/api/lab/delegated-orders'){
  if(body.localOnly!==true||!uuid(body.clientOrderId))return null;
  let draft=rows.find(x=>x.id===body.clientOrderId);if(!draft){draft={id:body.clientOrderId,number:'محلی-'+body.clientOrderId.slice(0,8),body,files:[],state:'editing',createdAt:new Date().toISOString()};rows.push(draft);save(store,rows);}return result(draft);
 }
 const match=pathname.match(/^\/api\/lab\/(?:delegated-orders|orders)\/([0-9a-f-]{36})(?:\/(files\/presign|submit))?$/i);if(!match)return null;
 const draft=rows.find(x=>x.id===match[1]&&x.state!=='synced');if(!draft)return null;
 let bootstrap={};try{const cache=store.cached('/api/lab/delegated-orders/bootstrap?mode=print')||store.cached('/api/lab/delegated-orders/bootstrap');if(cache)bootstrap=JSON.parse(Buffer.from(cache.body,'base64').toString())}catch{}const customer=(bootstrap.customers||[]).find(x=>x.id===draft.body.customerId)||{};
 if(method==='GET'&&!match[2])return {desktopPending:true,order:{...draft.body,id:draft.id,number:draft.number,status:'downloaded',customer_id:draft.body.customerId,customer_name:customer.name||customer.customer_name||draft.body.studioName||'مشتری',album_data:draft.body.albumData,created_at:draft.createdAt,_desktop_pending:true},files:draft.files.map(f=>({...f,id:f.clientFileId,original_name:localName(f),bytes:f.bytes,print_size_id:f.printSizeId,size_label:(bootstrap.printSizes||[]).find(x=>x.id===f.printSizeId)?.label,print_type:f.printType,print_copies:f.printCopies,original_state:'ready',storage_mode:'device-local'}))};
 if(method==='POST'&&match[2]==='files/presign'){
  if(body.localOnly!==true||!uuid(body.clientFileId))throw Error('invalid_local_file');
  if(!draft.files.some(x=>x.clientFileId===body.clientFileId)){draft.files.push(body);save(store,rows);}return {fileId:body.clientFileId,storageMode:'device-local',desktopPending:true};
 }
 if(method==='POST'&&match[2]==='submit'){
  if(!draft.files.length)throw Error('local_files_missing');draft.proforma=body.desktopProforma||null;draft.localFiles=body.desktopLocalFiles||[];draft.submit={sendInvoiceSms:body.sendInvoiceSms===true};draft.state='pending';save(store,rows);return result(draft);
 }
 return null;
}
async function syncLocalOrders(store,request,verifyLocalFiles){
 const lab=store.get('labId'),rows=list(store);let sent=0;
 const same=()=>{if(store.get('labId')!==lab)throw Error('account_changed');};
 for(const draft of rows.filter(x=>x.state==='pending')){
  const persist=()=>{same();const current=list(store),index=current.findIndex(x=>x.id===draft.id);if(index<0)throw Error('local_draft_changed');current[index]=draft;save(store,current);};
  try{
   if(verifyLocalFiles)await verifyLocalFiles(draft.localFiles||[]);same();
   const call=async(url,body)=>{same();const r=await request(url,{method:'POST',body:JSON.stringify(body)});const data=await r.json();same();if(!r.ok)throw Object.assign(Error(data.error||'local_order_rejected'),{httpStatus:r.status});return data;};
   // Both creation and file metadata have durable server-side client IDs.
   const created=await call('/api/lab/delegated-orders',draft.body);if(!uuid(created.orderId))throw Error('invalid_server_order_id');
   draft.serverOrderId=created.orderId;draft.serverNumber=created.orderNumber;same();persist();
   const status=await request('/api/lab/orders/'+draft.serverOrderId);const current=await status.json();same();if(!status.ok)throw Error('order_reconciliation_failed');
   if(current.order?.status==='uploading'){
    for(const file of draft.files)await call('/api/lab/delegated-orders/'+draft.serverOrderId+'/files/presign',file);
    await call('/api/lab/delegated-orders/'+draft.serverOrderId+'/submit',draft.submit);
   }else if(!['submitted','downloaded','printing','ready','delivered'].includes(current.order?.status))throw Object.assign(Error('order_status_needs_review'),{httpStatus:409});
   draft.state='synced';draft.confirmedAt=new Date().toISOString();draft.error=null;persist();sent++;
  }catch(error){same();draft.error={code:error.message,httpStatus:error.httpStatus||null};if(error.httpStatus&&error.httpStatus<500)draft.state='conflict';persist();break;}
 }
 return sent;
}
function pendingOrders(store){return list(store).filter(x=>x.state!=='synced').map(x=>({id:x.id,number:x.number,customerId:x.body.customerId,state:x.state,createdAt:x.createdAt,files:x.files.length,mode:x.body.mode,error:x.error||null,serverNumber:x.serverNumber||null,proforma:x.proforma||null}));}
module.exports={localRequest,syncLocalOrders,pendingOrders,canonical};
