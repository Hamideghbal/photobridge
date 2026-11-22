'use strict';
// R1911: keep a VERIFIED all-stages-complete note on the durable "new order"
// notification. Do not derive completion from a progress bar reaching 100%,
// a downloaded file, a generated invoice, or an order's mere presence.
// This module is presentation-only: NEVER changes download, receipt, invoice,
// finance, printing, storage, or upstream read/ack behavior.
const {latinDigits}=require('./alert-content.cjs');
const NOTE='✅ دانلود، صدور فاکتور و تمام مراحل این سفارش با موفقیت انجام شد.';
const TTL=14*24*60*60*1000,MAX=120;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const number=value=>{
 const digits=latinDigits(value||'').trim().replace(/^#/,'');
 return /^\d{1,12}$/.test(digits)?digits.replace(/^0+(?=\d)/,''):null;
};
const key=account=>'labAlertVerifiedCompleted:'+String(account);
function entries(store,account,now=Date.now()){
 const data=store.get(key(account));
 const source=Array.isArray(data)?data:[];
 return source.filter(row=>row&&uuid.test(String(row.orderId||''))&&
   Number.isFinite(row.at)&&row.at<=now+60000&&now-row.at<=TTL&&
   (row.number===null||number(row.number)===row.number));
}
function noteStages(store,account,progress,now=Date.now()){
 if(!account||!uuid.test(String(progress?.orderId||''))||!Number.isFinite(now)||
    !(progress.downloadVerified===true||progress.invoiceIssued===true))return false;
 const current=entries(store,account,now),id=String(progress.orderId);
 const found=current.find(row=>row.orderId===id);
 const row={orderId:id,number:number(progress.number)||found?.number||null,at:found?.at||now,
  downloadVerified:progress.downloadVerified===true||found?.downloadVerified===true||Boolean(found&&!('downloadVerified' in found)),
  invoiceIssued:progress.invoiceIssued===true||found?.invoiceIssued===true||Boolean(found&&!('invoiceIssued' in found)),
  complete:(progress.phase==='complete'&&progress.downloadVerified===true&&progress.invoiceIssued===true)||found?.complete===true||Boolean(found&&!('complete' in found))};
 if(found&&JSON.stringify(found)===JSON.stringify(row))return false;
 store.set(key(account),[...current.filter(item=>item.orderId!==id),row].slice(-MAX));
 const pendingKey='nativeAlertsPending:'+String(account),pending=store.get(pendingKey);
 if(Array.isArray(pending)&&pending.length){
  const decorated=decoratePending(store,account,pending,now);
  if(decorated.some((item,i)=>item!==pending[i]))store.set(pendingKey,decorated);
 }
 return true;
}
function noteComplete(store,account,progress,now=Date.now()){
 if(progress?.phase!=='complete'||progress.downloadVerified!==true||progress.invoiceIssued!==true)return false;
 return noteStages(store,account,progress,now);
}
function decoratePending(store,account,items,now=Date.now()){
 if(!account||!Array.isArray(items)||!items.length)return Array.isArray(items)?items:[];
 const records=entries(store,account,now);
 return items.map(item=>{
  if(item?.orderAlert!==true)return item;
  // Already verified and persisted on the local original notification:
  // retain for as long as the unread order itself exists (even after 14 days).
  if(item.completionNote===NOTE&&Number.isFinite(Date.parse(item.completedAt||'')))return item;
  const id=String(item.orderId||'');
  const n=number(item.orderNumber);
  const createdAt=Date.parse(item.created_at||item.createdAt||'');
  const candidate=id&&uuid.test(id)?records.find(row=>row.orderId===id):(()=>{
   if(!n||!Number.isFinite(createdAt))return null;
   const matches=records.filter(row=>row.number===n&&row.at>=createdAt-60000&&row.at-createdAt<=TTL);
   // A number is allowed as a fallback only when it unambiguously refers
   // to one completion inside this account and notification's lifetime.
   return matches.length===1?matches[0]:null;
  })();
  if(!candidate)return item;
  if(Number.isFinite(createdAt)&&(candidate.at<createdAt-60000||candidate.at-createdAt>TTL))return item;
  const downloadVerified=item.downloadVerified===true||candidate.downloadVerified!==false;
  const invoiceIssued=item.invoiceIssued===true||candidate.invoiceIssued!==false;
  const complete=candidate.complete!==false&&downloadVerified&&invoiceIssued;
  if(item.downloadVerified===downloadVerified&&item.invoiceIssued===invoiceIssued&&!complete)return item;
  return {...item,downloadVerified,invoiceIssued,...(complete?{completionNote:NOTE,completedAt:new Date(candidate.at).toISOString()}: {})};
 });
}
module.exports={NOTE,TTL,MAX,noteComplete,noteStages,decoratePending};
