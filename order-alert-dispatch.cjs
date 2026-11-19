'use strict';
const {orderNotice,latinDigits}=require('./alert-content.cjs');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const number=value=>{
 const text=latinDigits(value).trim().replace(/^#/,'');
 return /^\d{1,12}$/.test(text)?text.replace(/^0+(?=\d)/,''):null;
};
// Existing production notification payloads sometimes contain "#894" but no
// order UUID. Resolve such notices immediately from the authenticated order
// list, before rendering the alert, instead of waiting for the 45s web tick.
function createOrderAlertDispatch({getAccount,request,deliver,now=()=>Date.now(),log=()=>{}}){
 const pending=new Map(),recent=new Map();
 let flight=null,epoch=0;
 const valid=account=>account&&getAccount()===account;
 function prune(){
  for(const [key,at] of recent)if(now()-at>300000)recent.delete(key);
  while(recent.size>500)recent.delete(recent.keys().next().value);
 }
 function accept(account,items){
  if(!valid(account)||!Array.isArray(items))return;
  const observedAt=now();
  prune();
  for(const item of items){
   const notice=orderNotice(item)||item?.orderAlert&&{orderId:item.orderId,orderNumber:item.orderNumber,createdAt:item.createdAt||item.created_at};
   if(!notice)continue;
   const at=Date.parse(notice.createdAt||'');
   // Old unread notification history must never backfill old orders automatically.
   if(Number.isFinite(at)&&at>0&&(observedAt-at>10*60000||at-observedAt>120000))continue;
   const key=String(account)+':'+String(notice.orderId||'#'+notice.orderNumber);
   if(recent.has(key))continue;
   recent.set(key,observedAt);
   if(notice.orderId&&UUID.test(String(notice.orderId))){
    deliver(account,notice.orderId);
    log('uuid_dispatch',{account,orderId:notice.orderId});
    continue;
   }
   const n=number(notice.orderNumber);
   if(!n)continue;
   const p=String(account)+':'+n;
   if(!pending.has(p))pending.set(p,{account,number:n,observedAt});
   log('number_detected',{account,number:n});
  }
  if(pending.size&&!flight)void drain(account);
 }
 function candidate(orders,account,n){
  if(!Array.isArray(orders))return null;
  const list=orders.filter(row=>{
   if(!UUID.test(String(row?.id||''))||row.lab_id&&String(row.lab_id)!==String(account))return false;
   if(number(row.number??row.order_number)!==n)return false;
   if(row.downloaded_at||['downloaded','printed','completed','cancelled'].includes(String(row.status||'')))return false;
   return ['sent','received'].includes(String(row.status||''));
  });
  return list.length===1?list[0]:null; // Never infer when ambiguous.
 }
 async function drain(account){
  if(flight||!valid(account))return;
  const generation=epoch;
  flight=(async()=>{
   // A just-created order can briefly be absent from the list. The retry
   // windows are short and keyed to the exact announced order number.
   for(const delay of [0,500,1400,3000,5500]){
    if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
    if(epoch!==generation||!valid(account))break;
    const awaiting=[...pending.values()].filter(x=>x.account===account);
    if(!awaiting.length)break;
    try{
     const res=await request('/api/lab/orders',{signal:AbortSignal.timeout(9000)});
     if(!res.ok)throw Error('order_list_http_'+res.status);
     const data=await res.json();
     if(epoch!==generation||!valid(account))break;
     for(const item of awaiting){
      const row=candidate(data?.orders,account,item.number);
      if(!row)continue;
      pending.delete(account+':'+item.number);
      deliver(account,row.id);
      log('number_resolved',{account,number:item.number,orderId:row.id,elapsedMs:now()-item.observedAt});
     }
     if(![...pending.values()].some(x=>x.account===account))break;
    }catch(error){log('number_resolve_error',{account,error:String(error?.message||error).slice(0,100)});}
   }
   for(const [key,item] of pending)if(item.account===account){
    log('number_unresolved',{account,number:item.number,elapsedMs:now()-item.observedAt});
    pending.delete(key);
   }
  })().finally(()=>{flight=null});
  return flight;
 }
 return {accept,reset(){epoch++;pending.clear();recent.clear()},pending:()=>pending.size};
}
module.exports={createOrderAlertDispatch};
