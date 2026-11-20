'use strict';
// Manual orders own LOCAL files. They require the signed-in lab, an approved
// subscription and a writable, account-scoped local folder; they are NOT
// the same capability as downloading remote orders onto the primary device.
const {checkWriteAccess}=require('./write-access.cjs');
async function manualIntakePreflight({store,nativeStorage,request}){
 const labId=store.get('labId'),deviceId=store.get('deviceId');
 const same=()=>store.get('auth')&&store.get('labId')===labId&&store.get('deviceId')===deviceId;
 if(!labId||!same())return{allowed:false,status:401,error:'login_required',message:'ابتدا وارد حساب لابراتوار شوید.'};
 if(!nativeStorage)return{allowed:false,status:503,error:'native_storage_unavailable',message:'ارتباط ذخیره‌سازی با برنامه برقرار نیست.'};
 const access=await checkWriteAccess(store,(path,options={})=>request(path,{...options,signal:AbortSignal.timeout(1100)}));
 if(!same())return{allowed:false,status:401,error:'account_changed',message:'حساب تغییر کرده است؛ دوباره وارد شوید.'};
 if(!access.allowed)return{allowed:false,status:403,error:access.error||'subscription_unverified',message:access.message};
 const root=await nativeStorage.status();
 if(!same())return{allowed:false,status:401,error:'account_changed',message:'حساب تغییر کرده است؛ دوباره وارد شوید.'};
 if(!root?.root||root.permission!=='granted')return{allowed:false,status:409,error:'local_storage_unavailable',message:root?.message||'مسیر ذخیرهٔ عکس‌ها قابل نوشتن نیست؛ مسیر ذخیره را از تنظیمات لابراتوار انتخاب یا بررسی کنید.'};
 // Keep the working ONLINE server registration flow when this computer is
 // really the primary. Fall back to LOCAL manual creation only if that primary
 // confirmation is missing, rejected or unavailable (never fake it for downloads).
 let remotePrimary=false;
 try{
  const response=await request('/api/lab/download-device',{signal:AbortSignal.timeout(1100)});
  if(response.status===401)return{allowed:false,status:401,error:'login_required',message:'نشست ورود تأیید نشد؛ دوباره وارد شوید.'};
  if(response.ok){const device=await response.json();remotePrimary=device?.registered===true&&device?.isThisDevice===true;}
 }catch{/* Network loss must not prevent a previously authorized LOCAL order. */}
 if(!same())return{allowed:false,status:401,error:'account_changed',message:'حساب تغییر کرده است؛ دوباره وارد شوید.'};
 const localFallback=!remotePrimary;
 store.set('manualIntakeFallback:'+labId+':'+deviceId,localFallback);
 store.set('localBusinessActive:'+labId,true);
 return{allowed:true,scope:'manual-local-only',localOnly:localFallback,remotePrimary};
}
module.exports={manualIntakePreflight};
