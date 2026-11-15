/* Whole-file recovery for print only. No multipart claims or changes to image bytes. */
(function(root){
'use strict';
const clone=value=>JSON.parse(JSON.stringify(value));
const uuid=()=>root.crypto.randomUUID();
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function failure(error){
 const code=String(error?.data?.error||error?.code||error?.message||'upload_failed');
 const status=Number(error?.status||0);
 const temporary=error?.data?.retryable!==false&&!['needs_reselection','identity_mismatch','local_checkpoint_failed','selection_locked','session_changed_in_another_tab','file_read_failed'].includes(code)&&(error?.data?.retryable===true||!status||[408,425,429,500,502,503,504].includes(status));
 const reasons={storage_capacity_exceeded:'ظرفیت سرویس ذخیره‌سازی کافی نیست. عکس‌های تأییدشده حفظ شده‌اند؛ فضای سرویس باید بررسی شود.',upload_url_rejected:'سرویس ذخیره‌سازی لینک ارسال را نپذیرفت؛ لینک تازه دریافت می‌شود. اگر ادامه داشت، مجوز ذخیره‌سازی باید بررسی شود.',file_read_failed:'خواندن اصل این عکس از مرورگر انجام نشد؛ همان عکس را دوباره انتخاب کنید.',storage_access_denied:'سرویس ذخیره‌سازی اجازهٔ دسترسی به عکس را نداد. فایل‌ها حفظ شده‌اند؛ پشتیبانی باید دسترسی سرویس را بررسی کند.',storage_temporarily_unavailable:'سرویس ذخیره‌سازی موقتاً پاسخ نمی‌دهد. فایل‌های تأییدشده حفظ شده‌اند.',upload_missing:'این عکس هنوز به‌طور کامل در ذخیره‌سازی دریافت نشده است.',size_mismatch:'اندازهٔ فایل دریافت‌شده با عکس اصلی یکسان نیست؛ فقط همین عکس دوباره ارسال می‌شود.',file_too_large:'حجم این عکس از حد مجاز ارسال بیشتر است.',upload_not_configured:'سرویس ارسال فایل در دسترس نیست.',needs_reselection:'دسترسی مرورگر به اصل عکس از بین رفته است؛ همان عکس را دوباره انتخاب کنید.',identity_mismatch:'عکس انتخاب‌شده با اصل عکس ذخیره‌شده یکسان نیست.',local_checkpoint_failed:'ذخیرهٔ وضعیت ارسال در مرورگر ممکن نشد. این صفحه را باز نگه دارید.',session_changed_in_another_tab:'وضعیت این ارسال در صفحهٔ دیگری تغییر کرده است. همین صفحه را تازه‌سازی کنید؛ فایل‌های تأییدشده محفوظ‌اند.',selection_locked:'این انتخاب به پیش‌نویس ارسال متصل است؛ ابتدا ارسال باقی‌مانده را ادامه دهید.'};
 return {code,status,retryable:temporary&&code!=='storage_access_denied',reason:reasons[code]||error?.data?.reason||error?.data?.message||(status===401?'برای ادامهٔ همین ارسال دوباره وارد حساب شوید.':status===403?'اجازهٔ دسترسی به این ارسال تأیید نشد.':temporary?'ارتباط قطع شد یا سرور پاسخ نداد. عکس‌های تأییدشده محفوظ‌اند.':'ارسال این عکس کامل نشد؛ دوباره تلاش کنید.'),reference:error?.data?.correlationId||uuid()};
}
function browserStore(scope){
 const fallback='pb1854:'+scope;
 let opening;
 const db=()=>opening||(opening=new Promise((resolve,reject)=>{const q=root.indexedDB.open('photobridge-print-recovery-v1',1);q.onupgradeneeded=()=>{q.result.createObjectStore('sessions');q.result.createObjectStore('bytes')};q.onsuccess=()=>{q.result.onversionchange=()=>q.result.close();resolve(q.result)};q.onerror=()=>reject(q.error);q.onblocked=()=>reject(Error('indexeddb_blocked'))}));
 async function tx(store,mode,operation){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(store,mode),q=operation(t.objectStore(store));let result;q.onsuccess=()=>result=q.result;t.oncomplete=()=>resolve(result);t.onerror=t.onabort=()=>reject(t.error||q.error||Error('checkpoint_failed'))})}
 return {
  async load(){let a=null,b=null;try{a=await tx('sessions','readonly',s=>s.get(scope))}catch{}try{b=JSON.parse(root.localStorage.getItem(fallback)||'null')}catch{}return !a?b:!b?a:(a.updatedAt||0)>(b.updatedAt||0)?a:b},
  async save(session){
   const changed=old=>old&&((old.id===session.id&&(old.version||0)>session.version-1)||(old.id!==session.id&&old.state!=='submitted'&&old.groups?.some(g=>g.files?.length)));
   const write=async()=>{
    let local=false,indexed=false,old=null;try{old=JSON.parse(root.localStorage.getItem(fallback)||'null')}catch{}if(changed(old))throw Error('session_changed_in_another_tab');
    try{const d=await db();await new Promise((resolve,reject)=>{const t=d.transaction('sessions','readwrite'),store=t.objectStore('sessions'),q=store.get(scope);let conflict=false;q.onsuccess=()=>{if(changed(q.result)){conflict=true;t.abort()}else store.put(session,scope)};t.oncomplete=resolve;t.onabort=t.onerror=()=>reject(Error(conflict?'session_changed_in_another_tab':'indexeddb_checkpoint_failed'))});indexed=true}catch(error){if(error.message==='session_changed_in_another_tab')throw error}
    try{root.localStorage.setItem(fallback,JSON.stringify(session));local=true}catch{}if(!local&&!indexed)throw Error('local_checkpoint_failed');
   };
   return root.navigator?.locks?.request?root.navigator.locks.request('pb1854-checkpoint:'+scope,write):write();
  },
  getFile(id){return tx('bytes','readonly',s=>s.get(scope+':'+id))},
  putFile(id,file){return tx('bytes','readwrite',s=>s.put(file,scope+':'+id))},
  deleteFile(id){return tx('bytes','readwrite',s=>s.delete(scope+':'+id))}
 };
}
async function digest(file){return Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256',await file.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('')}
function createManager({store,request,transfer,verify,sleep=wait,hash=digest,onChange=()=>{},recordFailure=async()=>{},online=()=>root.navigator?.onLine!==false,locks=root.navigator?.locks}){
 let session=null,bytes=new Map(),busy=null,saves=Promise.resolve(),selectionTail=Promise.resolve(),verifyTail=Promise.resolve(),hashTail=Promise.resolve(),lastUpdated=0,savingSelection=0;const listeners=new Set();
 const emit=()=>{const value=session?clone(session):null;onChange(value);listeners.forEach(fn=>fn(value))};
 const save=()=>{session.version=(session.version||0)+1;session.updatedAt=lastUpdated=Math.max(Date.now(),lastUpdated+1);const value=clone(session);saves=saves.catch(()=>{}).then(()=>store.save(value));emit();return saves};
 const all=()=>session.groups.flatMap(g=>g.files);
 const checksum=blob=>{const task=hashTail.catch(()=>{}).then(()=>hash(blob)).catch(()=>{throw Error('file_read_failed')});hashTail=task;return task};
 const assertActive=signal=>{if(signal?.aborted)throw Object.assign(Error('upload_paused'),{name:'AbortError'})};
 async function original(file){let blob=bytes.get(file.id);if(!(blob instanceof root.Blob)){try{blob=await store.getFile(file.id)}catch{}}if(!(blob instanceof root.Blob))throw Error('needs_reselection');bytes.set(file.id,blob);return blob}
 async function reconcileOrder(){if(!session.orderId)return null;try{const r=await request('/api/customer/orders/'+session.orderId,{method:'GET'});if(r.order?.status&&r.order.status!=='uploading'){if(['cancelled','deleted'].includes(r.order.status))throw Object.assign(Error('order_no_longer_uploading'),{status:409});session.state='submitted';session.result={order:r.order,invoice:r.order.invoice_id?{id:r.order.invoice_id,total:r.order.invoice_total}:null,paymentRequired:r.order.settlement_mode==='prepaid',paymentSettings:r.paymentSettings};await save();return session.result}return r}catch(e){if(e.status===404&&!session.orderCreated)return null;throw e}}
 const api={
  subscribe(fn){listeners.add(fn);fn(session?clone(session):null);return()=>listeners.delete(fn)},
  snapshot:()=>session?clone(session):null,
  isBusy:()=>!!busy,
  hasUnsavedAccess:()=>savingSelection>0||!!busy||!!session&&all().some(f=>f.state!=='done'&&!f.persisted),
  reset(){if(session&&session.state!=='submitted')throw Error('selection_locked');session=null;bytes.clear();emit()},
  async restore(){session=await store.load();if(!session)return null;lastUpdated=Number(session.updatedAt||0);bytes=new Map();if(session.state!=='submitted')for(const f of all()){if(['uploading','verifying'].includes(f.state))f.state='paused';try{await original(f);f.missing=false}catch{f.missing=true;f.persisted=false;if(f.state!=='done'){f.state='needs_attention';f.error=failure(Error('needs_reselection'))}}}emit();return session},
  async selection(groups,settings){
   if(session?.orderId){if(JSON.stringify(groups.map(g=>[g.id,g.files.map(f=>f.id)]))!==JSON.stringify(session.groups.map(g=>[g.id,g.files.map(f=>f.id)])))throw Error('selection_locked');return}
   const previous=new Map(session?all().map(f=>[f.id,f]):[]);
   session=session||{id:uuid(),state:'queued',groups:[],version:0};session.settings=clone(settings);session.groups=groups.map(g=>{const copy={...g,files:g.files.map(f=>{const {file,previewUrl,thumbUrl,...meta}=f;const cached=bytes.get(f.id),replaced=cached&&file instanceof root.Blob&&cached!==file,old=replaced?null:previous.get(f.id);return {...old,...meta,id:f.id,name:file.name,size:file.size,type:file.type,lastModified:file.lastModified,serverId:old?.serverId||uuid(),checksum:old?.checksum||null,persisted:old?.persisted||false,missing:old?.missing||false,state:old?.state||'queued',error:old?.error||null,progress:old?.state==='done'?100:0}})};return copy});await save();
   for(const g of groups)for(const item of g.files){const f=all().find(f=>f.id===item.id);if(!(item.file instanceof root.Blob)){f.missing=true;f.persisted=false;f.state='needs_attention';f.error=failure(Error('needs_reselection'));continue}bytes.set(f.id,item.file);let changed=false;if(!f.persisted){try{await store.putFile(f.id,item.file);changed=true;f.persisted=true;f.missing=false}catch{f.persisted=false;session.warning='فضای مرورگر برای نگهداری همهٔ عکس‌ها کافی نیست. این صفحه را باز نگه دارید؛ پس از بازکردن دوباره ممکن است انتخاب همان عکس لازم باشد.'}}if(!f.checksum){try{f.checksum=await checksum(item.file);changed=true}catch{f.state='needs_attention';f.missing=true;f.error=failure(Error('file_read_failed'))}}if(changed)await save();}
   await save();const current=new Set(all().map(f=>f.id));for(const id of previous.keys())if(!current.has(id)){bytes.delete(id);await store.deleteFile(id).catch(()=>{})}
  },
  async restoredGroups(){if(!session||session.state==='submitted')return [];const out=[];for(const g of session.groups){const files=[];for(const f of g.files){let file;try{const blob=await original(f);file=blob instanceof root.File&&blob.name===f.name?blob:new root.File([blob],f.name,{type:f.type,lastModified:f.lastModified});bytes.set(f.id,file)}catch{file={name:f.name,size:f.size,type:f.type,lastModified:f.lastModified}}files.push({...f,file,previewUrl:file instanceof root.Blob?root.URL.createObjectURL(file):'',thumbUrl:'',progress:f.state==='done'?100:0})}out.push({...g,files})}return out},
  async reselect(files){if(!session)return;for(const blob of files){const matches=all().filter(f=>f.missing&&f.name===blob.name&&f.size===blob.size);if(!matches.length)continue;const checksum=await hash(blob);for(const f of matches){if(!f.checksum||f.checksum!==checksum){f.error=failure(Error('identity_mismatch'));continue}bytes.set(f.id,blob);try{await store.putFile(f.id,blob);f.persisted=true}catch{f.persisted=false}f.missing=false;f.error=null;f.state=f.state==='done'?'done':'queued'}}await save();return api.restoredGroups()},
  run(makePayload,{signal,fileIds,onProgress=()=>{}}={}){
   if(busy)return busy;
   const execute=async()=>{
    await selectionTail;if(!session||!all().length)throw Error('no_files');assertActive(signal);
    session.error=null;if(!session.orderId&&all().some(f=>!f.checksum)){session.state='needs_attention';session.error=failure(Error('file_read_failed'));await save();return null}if(!online()){session.state='paused';session.error=failure(Error('network_offline'));for(const f of all())if(f.state!=='done')f.state='paused';await save();return null}const previous=await reconcileOrder();if(session.state==='submitted')return session.result;
    if(!session.orderId){session.orderId=uuid();session.state='uploading';await save()}
    if(!session.orderCreated){const r=await request('/api/customer/recovery-orders',{method:'POST',body:JSON.stringify({mode:'print',...session.settings,recoveryId:session.orderId}),signal});if(r.order?.id!==session.orderId)throw Error('draft_identity_mismatch');session.orderCreated=true;await save()}
    session.state='uploading';await save();const remote=(previous||await reconcileOrder())?.files||[];
    for(const f of all()){const found=remote.find(r=>r.id===f.serverId);if(found?.original_state==='active'){f.state='done';f.progress=100;f.error=null;onProgress(f.id,100)}else if(f.state==='done'){f.state='paused';f.progress=0}}
    await save();let next=0;const jobs=session.groups.flatMap(g=>g.files.map(f=>({g,f}))).filter(({f})=>f.state!=='done'&&(!fileIds||fileIds.includes(f.id)));
    const worker=async()=>{while(next<jobs.length&&!signal?.aborted){const {g,f}=jobs[next++];let attempt=0;while(attempt++<3){try{
      assertActive(signal);if(!online())throw Error('network_offline');
      if(!f.checksum){const blob=await original(f);f.checksum=await checksum(blob);await save()}
      if(!f.payload){f.payload=makePayload(g,f);await save()}
      f.state='uploading';f.error=null;f.attempts=(f.attempts||0)+1;await save();
      f.stage='presign';const registered=await request('/api/customer/uploads/recovery-presign',{method:'POST',body:JSON.stringify({...f.payload,orderId:session.orderId,clientFileId:f.serverId,checksum:f.checksum}),signal});if(registered.fileId!==f.serverId)throw Error('file_identity_mismatch');
      f.registered=true;f.stage='transfer';const probe=await request('/api/customer/uploads/'+f.serverId+'/retry',{method:'POST',signal});
      if(!probe.uploaded){const blob=await original(f);await transfer(probe.uploadUrl,blob,n=>onProgress(f.id,Math.min(94,Math.round(n*.94))),signal)}
      f.stage='complete';f.state='verifying';onProgress(f.id,95);await save();
      const confirmation=verifyTail.catch(()=>{}).then(()=>verify(f.serverId,bytes.get(f.id),signal));verifyTail=confirmation;await confirmation;
      f.state='done';f.progress=100;f.error=null;onProgress(f.id,100);await save();break;
     }catch(error){f.error=failure(error);f.history=[...(f.history||[]),{at:Date.now(),stage:f.stage,code:f.error.code,reference:f.error.reference}].slice(-20);void Promise.resolve().then(()=>recordFailure({eventId:f.error.reference,sessionId:session.id,fileId:f.id,serverFileId:f.registered?f.serverId:null,orderId:session.orderId,stage:f.stage||'presign',state:'failed',errorCode:f.error.code,httpStatus:f.error.status,online:online(),client:'web',totalBytes:f.size})).catch(()=>{});f.state=signal?.aborted||!online()?'paused':'needs_attention';f.progress=0;if(['needs_reselection','file_read_failed'].includes(f.error.code))f.missing=true;onProgress(f.id,0);await save();if(signal?.aborted||!online()||!f.error.retryable||attempt>=3)break;await sleep(Math.min(10000,500*2**attempt)+Math.floor(Math.random()*300))}}
    }};
    const settled=await Promise.allSettled(Array.from({length:Math.min(session.groups.some(g=>g.sizeId==='__custom__')?1:3,jobs.length)},worker));const broken=settled.find(result=>result.status==='rejected');if(broken)throw broken.reason;
    if(signal?.aborted){session.state='paused';await save();return null}
    if(all().some(f=>f.state!=='done')){session.state='needs_attention';await save();return null}
    session.state='verifying';await save();
    let result;try{result=await request('/api/customer/orders/'+session.orderId+'/submit',{method:'POST',headers:{'x-photobridge-upload-count':String(all().length)},signal})}catch(error){const replay=await reconcileOrder();if(session.state!=='submitted'){session.error=failure(error);session.state='needs_attention';await save();throw error}result=session.result}
    session.state='submitted';session.result=result;await save();for(const f of all())await store.deleteFile(f.id).catch(()=>{});return result;
   };
   const locked=()=>locks?.request?locks.request('pb1854:'+session?.id,{mode:'exclusive',ifAvailable:true},lock=>{if(!lock)throw Error('upload_open_in_other_tab');return execute()}):execute();
   busy=Promise.resolve().then(locked).catch(async error=>{if(session){session.error=failure(error);session.state=signal?.aborted?'paused':'needs_attention';try{await save()}catch{}}throw error}).finally(()=>{busy=null;emit()});return busy;
  }
 };
 const select=api.selection;api.selection=(...args)=>{savingSelection++;return selectionTail=selectionTail.catch(()=>{}).then(()=>select(...args)).finally(()=>savingSelection--)};
 return api;
}
function transferFile(url,file,progress,signal,token){return new Promise((resolve,reject)=>{
 const xhr=new root.XMLHttpRequest();let timer,settled=false;
 const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);error?reject(error):resolve()};
 const abort=()=>{xhr.abort();finish(Object.assign(Error('upload_paused'),{name:'AbortError'}))};
 const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>{finish(Object.assign(Error('upload_timeout'),{status:408}));xhr.abort()},120000)};
 xhr.open('PUT',url);xhr.withCredentials=url.startsWith('/');if(url.startsWith('/')&&token)xhr.setRequestHeader('authorization','Bearer '+token);if(file.type)xhr.setRequestHeader('content-type',file.type);
 xhr.upload.onprogress=e=>{arm();if(e.lengthComputable)progress(100*e.loaded/e.total)};
 xhr.onload=()=>{const code=String(xhr.responseText||'').match(/<Code>([A-Za-z0-9_.-]{1,80})<\/Code>/)?.[1]||'',full=xhr.status===507||/^(InsufficientStorage|QuotaExceeded|StorageFull|DiskFull)$/.test(code);finish(xhr.status>=200&&xhr.status<300?null:Object.assign(Error('upload_http_'+xhr.status),{status:xhr.status,data:{error:full?'storage_capacity_exceeded':xhr.status===403?'upload_url_rejected':'upload_http_'+xhr.status,retryable:full?false:xhr.status===403?true:undefined}}))};
 xhr.onerror=()=>finish(Object.assign(Error('upload_network_error'),{status:0}));xhr.onabort=()=>finish(Object.assign(Error('upload_paused'),{name:'AbortError'}));
 if(signal?.aborted)return abort();signal?.addEventListener('abort',abort,{once:true});arm();xhr.send(file);
})}
const exported={createManager,browserStore,failure,digest,transferFile};root.PB1854PrintRecovery=exported;if(typeof module!=='undefined')module.exports=exported;
})(globalThis);
