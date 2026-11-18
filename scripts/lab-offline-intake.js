/* Native lab walk-in outbox. A completed transaction is the local receipt. */
function labIntakeOutbox() {
 let database;
 async function transact(mode, operation) {
  database ||= new Promise((resolve,reject)=>{
   const request=indexedDB.open('photobridge-lab-walk-in',1);
   request.onupgradeneeded=()=>request.result.createObjectStore('orders',{keyPath:'id'});
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error);
  }).catch(error=>{database=null;throw error;});
  const db=await database;
  return new Promise((resolve,reject)=>{
   const transaction=db.transaction('orders',mode,{durability:'strict'});
   const request=operation(transaction.objectStore('orders'));
   transaction.oncomplete=()=>resolve(request.result);
   transaction.onabort=()=>reject(transaction.error||request.error);
  });
 }
 return {
  async save(record, entries) {
   const photos=[];
   for(const item of entries){
    const {id}=item;
    const file=new File([await item.file.arrayBuffer()],item.file.name,{type:item.file.type,lastModified:item.file.lastModified});
    photos.push({id,file});
   }
   await transact('readwrite',store=>store.add({...record,entries:photos}));
  },
  async list(scope) {
   const keys=await transact('readonly',store=>store.getAllKeys());
   const records=[];
   for(const key of keys){
    if(typeof key==='string'&&key.startsWith(scope+'/'))records.push(key);
   }
   return records;
  },
  put:record=>transact('readwrite',store=>store.put(record)),
  read:id=>transact('readonly',store=>store.get(id)),
  remove:id=>transact('readwrite',store=>store.delete(id))
 };
}

const labOutbox=labIntakeOutbox();
const labOutboxOffline=()=>navigator.onLine===false;
const labOutboxLiveDevice=()=>api('/api/lab/intake-live/download/device?check='+Date.now());

/* Offline-first bootstrap: scoped to the signed-in lab/user/native device.
   Keep customer IDs and price references available when the upstream server
   is unreachable. This cache is not a server invoice or authorization grant. */
async function labOutboxBootstrap(mode='print') {
 const context=await labOutboxContext();
 if(!context)throw Error('برای سفارش آفلاین، ابتدا با همین حساب یک‌بار وارد برنامه شوید.');
 const kind=mode==='album'?'album':'print';
 const key='bootstrap/'+context.key+'/'+kind;
 const row=await labOutbox.read(key).catch(()=>null);
 const cached=row?.labId===context.labId&&row?.userId===context.userId&&row?.data?.lab?.id===context.labId?row.data:null;
 const cachedResult=()=>({...cached,__pbOfflineCached:true,__pbOfflineCachedAt:row.savedAt});
 if(labOutboxOffline()){
  if(cached)return cachedResult();
  throw Error('اطلاعات مشتریان و تعرفه‌ها روی این دستگاه ذخیره نشده است. یک‌بار در حالت آنلاین وارد سفارش دستی شوید.');
 }
 const url='/api/lab/delegated-orders/bootstrap'+(kind==='album'?'':'?mode=print');
 const request=api(url).then(async data=>{
  if(!data||!Array.isArray(data.customers)||!Array.isArray(data.printSizes)||String(data.lab?.id)!==String(context.labId))
   throw Error('اطلاعات اولیه سفارش دستی معتبر نیست.');
  if((await labOutboxContext())?.key!==context.key)throw Error('حساب لابراتوار در زمان دریافت اطلاعات تغییر کرد.');
  await labOutbox.put({id:key,labId:context.labId,userId:context.userId,data,savedAt:new Date().toISOString()});
  return data;
 });
 let timer;
 try{
  return await Promise.race([request,new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(Object.assign(Error('offline_bootstrap_timeout'),{code:'online_connection_required'})),cached?350:2600);
  })]);
 }catch(problem){
  if(cached&&labOutboxConnectionFailed(problem))return cachedResult();
  throw problem;
 }finally{clearTimeout(timer);}
}
function labOutboxWarmBootstrap(){
 if(!window.pbNativeStorage||labOutboxOffline()||!/^\/lab(?:\/|$)/.test(location.pathname))return;
 void labOutboxBootstrap('print').catch(()=>{});
}

let labOutboxSyncing=false;

async function labOutboxContext() {
 const provider=storage();
 if(!window.pbNativeStorage||!provider?.deviceId())return null;
 const session=await api('/api/auth/me');
 const labId=session?.lab?.id||session?.user?.labId;
 const userId=session?.user?.userId;
 if(!labId||!userId)return null;
 return {labId,userId,key:[labId,userId,provider.deviceId()].join('/')};
}

const labOutboxConnectionErrors=new Set(['intake_requires_live_connection','offline','network','network_error',
 'upstream_unavailable','online_connection_required','download_device_registration_offline']);
const labOutboxConnectionFailed=problem=>!problem.data||labOutboxConnectionErrors.has(problem.code);

async function labOutboxPrimary() {
 const context=await labOutboxContext();
 const cacheKey=context?'photobridge:lab-walk-in-primary:'+context.key:null;
 const cached=cacheKey&&localStorage.getItem(cacheKey)==='1';
 const offlinePrimary={registered:true,isThisDevice:true};
 if(cached&&labOutboxOffline())return offlinePrimary;
 let timer;
 try{
  const live=labOutboxLiveDevice();
  const state=cached?await Promise.race([live,new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(Error('offline')),850);
  })]):await live;
  if(!context||state.labId!==context.labId||state.userId!==context.userId)throw Object.assign(Error('حساب دستگاه تأیید نشد.'),{data:{}});
  try{
   if(state.registered&&state.isThisDevice)localStorage.setItem(cacheKey,'1');
   else localStorage.removeItem(cacheKey);
  }catch{/* Live device verification remains valid if local storage is unavailable. */}
  return state;
 }catch(problem){
  if(cached&&labOutboxConnectionFailed(problem))return offlinePrimary;
  throw problem;
 }finally{clearTimeout(timer);}
}

async function labOutboxSave(bootstrap,clientOrderId,order,submit,entries,files) {
 const context=await labOutboxContext();
 if(!context||context.labId!==bootstrap.lab?.id)throw Error('حساب لابراتوار برای ذخیره آفلاین تأیید نشد.');
 const customer=bootstrap.customers.find(row=>String(row.id)===String(order.customerId));
 if(!customer||customer.local_contact||customer.origin_offline&&!customer.remote)throw Error('برای ثبت آفلاین یک مشتری همگام‌شده را انتخاب کنید.');
 if(entries.some(item=>item.sourceAction==='move'||item.sourceActions?.includes('move')))throw Error('برای ثبت آفلاین، حالت «کپی» را برای عکس‌ها انتخاب کنید.');
 await labOutbox.save({
  id:context.key+'/'+clientOrderId,order,submit,files,startedAt:new Date().toISOString()
 },entries);
}

async function labOutboxSync() {
 if(labOutboxSyncing||labOutboxOffline()||!/^\/lab(?:\/|$)/.test(location.pathname))return;
 labOutboxSyncing=true;
 try{
  const context=await labOutboxContext();
  if(!context)return;
  await navigator.locks.request('photobridge-lab-walk-in',{ifAvailable:true},async lock=>{
   if(!lock)return;
   const keys=await labOutbox.list(context.key);
   if(!keys.length)return;
   const device=await labOutboxLiveDevice();
   if(device.labId!==context.labId||device.userId!==context.userId||!device.registered||!device.isThisDevice)return;
   const provider=storage(),directory=await provider.root();
   if(!directory||!await provider.permission(directory))return;
   for(const key of keys){
    if((await labOutboxContext())?.key!==context.key)return;
    const pending=await labOutbox.read(key);
    if(!pending)continue;
    try{
     const orderId=await labOutboxReplay(provider,directory,pending);
     await labOutbox.remove(key);
     window.dispatchEvent(new CustomEvent('photobridge-lab-orders-changed',{detail:{orderId,labId:context.labId,mode:pending.order.mode}}));
     window.dispatchEvent(new Event('photobridge-lab-outbox-changed'));
    }catch(error){
     console.warn('PhotoBridge offline walk-in remains pending',error.code||error.name);
    }
   }
  });
 }catch(error){
  console.warn('PhotoBridge offline walk-in sync paused',error.code||error.name);
 }finally{labOutboxSyncing=false;}
}

async function labOutboxReplay(provider,directory,pending) {
 const order=await api('/api/lab/delegated-orders',pending.order);
 if(!order?.orderId)throw Error('order_not_confirmed');
 if(order.replay&&order.status!=='uploading'){
  if(!order.status||['cancelled','canceled','deleted'].includes(order.status))throw Error('order_not_confirmed');
  return order.orderId;
 }
 for(const file of pending.files){
  const response=await api('/api/lab/delegated-orders/'+order.orderId+'/files/presign',file);
  if(response?.storageMode!=='device-local'||response.uploadUrl||response.fileId!==file.clientFileId)throw Error('file_not_confirmed');
 }
 const detail=await api('/api/lab/orders/'+order.orderId);
 detail.order._local_download_started_at=pending.startedAt;
 const targets=[],names=new Set();
 for(const item of pending.entries){
  const file=detail.files.find(file=>file.id===item.id);
  if(!file)throw Error('file_not_registered');
  const target=await provider.target(directory,detail,file);
  const name=provider.fileName(file.original_name,'file');
  const key=target.dir.name+'/'+name;
  if(names.has(key))throw Error('duplicate_file_name');
  names.add(key);
  targets.push({item,file,target,name});
 }
 for(const {item,file,target,name} of targets){
  let existing;
  try{existing=await target.dir.getFileHandle(name);}
  catch(error){
   if(error.name!=='NotFoundError'&&error.name!=='ENOENT'&&error.code!=='ENOENT'&&!/^ENOENT: no such file or directory, lstat /.test(error.message||''))throw error;
  }
  if(!existing)await provider.write(target.dir,file.original_name,item.file);
  const saved=await (await target.dir.getFileHandle(name)).getFile();
  const same=saved.size===item.file.size&&await labOutboxDigest(saved)===await labOutboxDigest(item.file);
  if(!same)throw Error('local_copy_mismatch');
 }
 const bytes=pending.entries.reduce((total,item)=>total+item.file.size,0);
 provider.saveResume(order.orderId,{startedAt:pending.startedAt,done:pending.entries.length,total:pending.entries.length,
  loadedBytes:bytes,totalBytes:bytes,completedIds:pending.entries.map(item=>item.id),remaining:0,lastError:null,localComplete:true});
 const result=await api('/api/lab/delegated-orders/'+order.orderId+'/submit',pending.submit);
 if(!result?.order?.id&&!result?.ok)throw Error('submit_not_confirmed');
 return order.orderId;
}

async function labOutboxDigest(file) {
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))).join(',');
}

function labOutboxPendingNotice(notice) {
 let generation=0;
 const refresh=async()=>{
  const current=++generation;
  try{
   const context=await labOutboxContext();
   const keys=context?await labOutbox.list(context.key):[];
   if(current!==generation||!notice.isConnected)return;
   notice.hidden=!keys.length;
   notice.textContent=keys.length?keys.length.toLocaleString('fa-IR')+' سفارش آفلاین در انتظار همگام‌سازی': '';
  }catch{notice.hidden=true;}
 };
 const listener=()=>{
  if(notice.isConnected)void refresh();
  else window.removeEventListener('photobridge-lab-outbox-changed',listener);
 };
 window.addEventListener('photobridge-lab-outbox-changed',listener);
 void refresh();
}

window.addEventListener('online',()=>{void labOutboxSync();labOutboxWarmBootstrap();});
window.addEventListener('photobridge-auth-session-changed',labOutboxWarmBootstrap);
setTimeout(labOutboxWarmBootstrap,700);
setInterval(()=>void labOutboxSync(),30000);
