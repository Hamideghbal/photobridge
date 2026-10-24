'use strict';
const MESSAGE='اعتبار استفاده از برنامه فعال نیست یا قابل تأیید نیست؛ مشاهده و چاپ سوابق در دسترس است. برای کار جدید اعتبار را بررسی یا تمدید کنید.';
const exempt=(method,url)=>['GET','HEAD','OPTIONS'].includes(method)||!new URL(url,'http://localhost').pathname.startsWith('/api/lab/')||/^\/api\/lab\/subscription(?:\/|$)/.test(new URL(url,'http://localhost').pathname)||['/api/lab/download-device','/api/lab/storage-target','/api/lab/activation-request','/api/lab/print-alert/presence','/api/lab/storage-target/hello','/api/lab/storage-target/activate'].includes(new URL(url,'http://localhost').pathname);
async function checkWriteAccess(store,request){
 const labId=store.get('labId'),now=Date.now();let saved=store.get('writeAccess:'+labId);
 try{
  const r=await request('/api/lab/write-access');
  if(!r.ok){if(r.status===403&&store.get('labId')===labId){store.set('writeAccess:'+labId,{allowed:false,reason:'lab_access_denied',serverTime:now,receivedAt:now,highWater:now});}return {allowed:false,error:r.status===401?'login_required':'subscription_unverified',message:MESSAGE};}
  const d=await r.json(),server=Date.parse(d.serverNow),until=d.activeUntil==null?null:Date.parse(d.activeUntil);
  if(store.get('labId')!==labId||d.labId!==labId||!Number.isFinite(server)||typeof d.allowed!=='boolean'||(until!==null&&!Number.isFinite(until)))return {allowed:false,error:'subscription_unverified',message:MESSAGE};
  saved={...d,receivedAt:now,serverTime:server,highWater:now};store.set('writeAccess:'+labId,saved);
 }catch{}
 if(store.get('labId')!==labId||!saved||now<saved.highWater-1000)return {allowed:false,error:'subscription_unverified',message:MESSAGE};
 const effective=saved.serverTime+Math.max(0,now-saved.receivedAt);saved.highWater=Math.max(now,saved.highWater);store.set('writeAccess:'+labId,saved);
 const until=saved.activeUntil==null?null:Date.parse(saved.activeUntil);
 // A confirmed approval remains valid offline until the subscription deadline.
 if(!saved.allowed||(until!==null&&effective>=until))return {allowed:false,error:saved.reason||'subscription_expired',message:MESSAGE};
 return {allowed:true};
}
module.exports={exempt,checkWriteAccess,MESSAGE};
