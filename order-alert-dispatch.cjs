'use strict';
const {orderNotice,latinDigits}=require('./alert-content.cjs');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const number=value=>{
 const text=latinDigits(value).trim().replace(/^#/,'');
 return /^\d{1,12}$/.test(text)?text.replace(/^0+(?=\d)/,''):null;
};
// UUID notifications wake the worker synchronously. Number-only notices
// resolve independently so another order's slow lookup cannot hold up delivery.
function createOrderAlertDispatch({getAccount,request,deliver,now=()=>Date.now(),log=()=>{}}){
 const pending=new Map(),recent=new Map();
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
   if(pending.has(p)||pending.size>=12){recent.delete(key);continue;}
   const lookup=new AbortController();
   pending.set(p,lookup);
   log('number_detected',{account,number:n});
   void resolveNumber(account,n,lookup,observedAt).catch(()=>{
    log('number_resolve_error',{account,number:n,elapsedMs:now()-observedAt});
   }).finally(()=>{
    if(pending.get(p)===lookup)pending.delete(p);
   });
  }
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
 async function findCandidate(account,n,sessionSignal){
  const attempt=new AbortController();
  async function readOrders(url){
   const res=await request(url,{signal:attempt.signal});
   if(!res.ok)throw Error('order_list_http_'+res.status);
   const {orders}=await res.json();
   if(!Array.isArray(orders))throw Error('invalid_order_list');
   return orders;
  }
  const match=orders=>{
   const row=candidate(orders,account,n);
   if(!row)throw Error('order_not_visible');
   return row;
  };
  let legacyTimer,deadlineTimer,cancel;
  const deadline=new Promise(resolve=>{
   cancel=()=>resolve(null);
   deadlineTimer=setTimeout(cancel,1800);
  });
  sessionSignal.addEventListener('abort',cancel,{once:true});
  try{
   if(sessionSignal.aborted)return null;
   const filtered=Promise.all(['print','album'].map(mode=>
    readOrders('/api/lab/orders?paged=1&mode='+mode+'&stage=flow&page=1&q='+n)))
    .then(pages=>match([...new Map(pages.flat().map(row=>[row.id,row])).values()]));
   // The legacy list is a fallback, never a barrier to a usable paged response.
   const legacy=new Promise(resolve=>{legacyTimer=setTimeout(resolve,300);})
    .then(()=>readOrders('/api/lab/orders')).then(match);
   return await Promise.race([Promise.any([filtered,legacy]).catch(()=>null),deadline]);
  }finally{
   clearTimeout(legacyTimer);
   clearTimeout(deadlineTimer);
   sessionSignal.removeEventListener('abort',cancel);
   attempt.abort();
  }
 }
 async function resolveNumber(account,n,lookup,observedAt){
  for(const delay of [0,250,500]){
   if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
   if(lookup.signal.aborted||!valid(account))return;
   const row=await findCandidate(account,n,lookup.signal);
   if(lookup.signal.aborted||!valid(account))return;
   if(row){
    deliver(account,row.id);
    log('number_resolved',{account,number:n,orderId:row.id,elapsedMs:now()-observedAt});
    return;
   }
  }
  log('number_unresolved',{account,number:n,elapsedMs:now()-observedAt});
 }

 return {accept,reset(){for(const lookup of pending.values())lookup.abort();pending.clear();recent.clear()},pending:()=>pending.size};
}
module.exports={createOrderAlertDispatch};
