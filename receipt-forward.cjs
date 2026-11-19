'use strict';
// LAB104 only: forward exact verified-file receipt live with an opt-in that
// separates the server receipt transaction from invoice issuance. No offline queue.
async function forwardReceipt({req,res,url,bytes,contentType,store,request,offline,json,enabled=false}){
 if(!enabled||req.method!=='POST'||!/^\/api\/lab\/orders\/[0-9a-f-]+\/download-receipt\/download$/i.test(url.pathname))return false;
 const account=store.get('labId'),device=store.get('deviceId');
 if(!store.get('auth')||!account)return json(res,401,{error:'lab_auth_required'}),true;
 if(offline())return json(res,503,{error:'online_connection_required'}),true;
 try{
  const up=await request(req.url,{method:'POST',body:bytes,headers:{
   'Content-Type':contentType||'application/json',
   'x-photobridge-receipt-only':'1'
  }});
  const data=await up.json().catch(()=>({}));
  if(account!==store.get('labId')||device!==store.get('deviceId')||!store.get('auth'))
   return json(res,401,{error:'account_changed'}),true;
  if(up.status===202||data?.desktopPending||data?.queued||data?.operationId)
   return json(res,503,{error:'receipt_not_server_verified'}),true;
  if(up.ok&&(!data?.order?.downloaded_at||!Number.isSafeInteger(data.verifiedFiles)||data.verifiedFiles<1))
   return json(res,502,{error:'receipt_not_server_verified'}),true;
  return json(res,up.status,data),true;
 }catch(error){
  if(account!==store.get('labId'))return json(res,401,{error:'account_changed'}),true;
  return json(res,503,{error:'receipt_online_required',message:String(error?.message||error)}),true;
 }
}
module.exports={forwardReceipt};
