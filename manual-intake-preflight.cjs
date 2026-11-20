'use strict';
// Separate local manual order capability from remote download-primary authorization.
// The three independent checks run concurrently; slow WAN cannot serially delay
// filesystem validation, and no failed/revoked approval is ever bypassed.
const {checkWriteAccess}=require('./write-access.cjs');
async function manualIntakePreflight({store,nativeStorage,request}){
 const labId=store.get('labId'),deviceId=store.get('deviceId');
 const same=()=>Boolean(store.get('auth'))&&store.get('labId')===labId&&store.get('deviceId')===deviceId;
 if(!labId||!same())return{allowed:false,status:401,error:'login_required',message:'ابتدا وارد حساب لابراتوار شوید.'};
 if(!nativeStorage)return{allowed:false,status:503,error:'native_storage_unavailable',message:'ارتباط ذخیره‌سازی با برنامه برقرار نیست.'};
 const timeout=(ms)=>typeof AbortSignal.timeout==='function'?AbortSignal.timeout(ms):undefined;
 const approval=checkWriteAccess(store,(path,options={})=>request(path,{...options,...(timeout(1100)?{signal:timeout(1100)}:{})}));
 const storage=Promise.resolve().then(()=>nativeStorage.status());
 // This probe does NOT approve remote downloads. It only determines if a
 // previously working, server-authorized ONLINE walk-in route can be preserved.
 const primary=Promise.resolve().then(async()=>{
  try{
   const response=await request('/api/lab/download-device',{...(timeout(1100)?{signal:timeout(1100)}:{})});
   if(response.status===401)return{loginRequired:true,remotePrimary:false};
   if(!response.ok)return{remotePrimary:false};
   const device=await response.json();
   return{remotePrimary:device?.registered===true&&device?.isThisDevice===true};
  }catch{return{remotePrimary:false};}
 });
 const [accessResult,rootResult,primaryResult]=await Promise.allSettled([approval,storage,primary]);
 if(!same())return{allowed:false,status:401,error:'account_changed',message:'حساب تغییر کرده است؛ دوباره وارد شوید.'};
 const access=accessResult.status==='fulfilled'?accessResult.value:{allowed:false,error:'subscription_unverified',message:'مجوز ثبت سفارش قابل تأیید نیست.'};
 if(!access.allowed)return{allowed:false,status:403,error:access.error||'subscription_unverified',message:access.message};
 const root=rootResult.status==='fulfilled'?rootResult.value:null;
 if(!root?.root||root.permission!=='granted')return{allowed:false,status:409,error:'local_storage_unavailable',message:root?.message||'مسیر ذخیرهٔ عکس‌ها قابل نوشتن نیست؛ مسیر ذخیره را از تنظیمات لابراتوار انتخاب یا بررسی کنید.'};
 const device=primaryResult.status==='fulfilled'?primaryResult.value:{remotePrimary:false};
 if(device.loginRequired)return{allowed:false,status:401,error:'login_required',message:'نشست ورود تأیید نشد؛ دوباره وارد شوید.'};
 const localFallback=!device.remotePrimary;
 if(!same())return{allowed:false,status:401,error:'account_changed',message:'حساب تغییر کرده است؛ دوباره وارد شوید.'};
 store.set('manualIntakeFallback:'+labId+':'+deviceId,localFallback);
 store.set('localBusinessActive:'+labId,true);
 return{allowed:true,scope:'manual-local-only',localOnly:localFallback,remotePrimary:device.remotePrimary};
}
module.exports={manualIntakePreflight};
