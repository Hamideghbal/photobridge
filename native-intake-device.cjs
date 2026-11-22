'use strict';

async function readIntakeDevice({store,nativeStorage,request,isOnline,opening,getReadEpoch}){
 const labId=String(store.get('labId')||'');
 const userId=String(store.get('auth')?.user?.userId||'');
 const device=store.get('deviceId'),epoch=getReadEpoch();
 const fail=(error,status)=>({status,data:{error}});
 if(!labId||!userId)return fail('lab_auth_required',401);
 const sameAccount=()=>String(store.get('labId')||'')===labId&&
  String(store.get('auth')?.user?.userId||'')===userId&&store.get('deviceId')===device&&getReadEpoch()===epoch;
 try{
  let state;
  if(opening&&nativeStorage&&store.get('nativeStorageRoot:'+labId)?.localStandalone){
   state=await nativeStorage.device({offline:true});
  }else{
   if(!isOnline())return fail('online_connection_required',503);
   const upstream=await request('/api/lab/download-device',{signal:AbortSignal.timeout(1100)});
   state=await upstream.json();
   if(!sameAccount())return fail('account_changed',401);
   if(!upstream.ok)return {status:upstream.status,data:state};
   if(state?.offline||state?.localOnly||state?.queued||state?.operationId)return fail('online_connection_required',503);
  }
  if(!sameAccount()||(state?.labId!=null&&String(state.labId)!==labId)||
     (state?.userId!=null&&String(state.userId)!==userId))return fail('account_changed',401);
  if(typeof state?.registered!=='boolean'||typeof state?.isThisDevice!=='boolean')
   return fail('download_device_registration_offline',503);
  return {status:200,data:{...state,labId,userId}};
 }catch{return sameAccount()?fail('download_device_registration_offline',503):fail('account_changed',401);}
}

module.exports={readIntakeDevice};
