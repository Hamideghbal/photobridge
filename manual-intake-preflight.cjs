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
 // Turn on the local-only business router for this lab, even when WAN is up.
 // This does not register a primary device, grant remote download or create an order.
 store.set('localBusinessActive:'+labId,true);
 return{allowed:true,scope:'manual-local-only',localOnly:true};
}
module.exports={manualIntakePreflight};
