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
const stageKey=account=>'labAlertVerifiedStages:'+String(account);
// R1915: Independent stage proofs persist while the ORIGINAL order remains unread.
// A verified download is not an issued invoice. Do not claim the whole order is
// finished before the genuine complete event.
function verifiedEntries(store,account,now=Date.now()){
 const data=store.get(stageKey(account));
 return (Array.isArray(data)?data:[]).filter(row=>row&&uuid.test(String(row.orderId||''))&&
   Number.isFinite(row.at)&&row.at<=now+60000&&now-row.at<=TTL&&
   (row.number===null||number(row.number)===row.number));
}
function recordVerifiedStages(store,account,progress,now=Date.now()){
 if(!account||!progress||!uuid.test(String(progress.orderId||''))||!Number.isFinite(now)||
   progress.downloadVerified!==true)return false;
 const current=verifiedEntries(store,account,now),id=String(progress.orderId);
 const previous=current.find(row=>row.orderId===id);
 const downloadVerified=true,invoiceIssued=previous?.invoiceIssued===true||progress.invoiceIssued===true;
 if(previous&&previous.downloadVerified===downloadVerified&&previous.invoiceIssued===invoiceIssued)return false;
 const row={orderId:id,number:number(progress.number)||previous?.number||null,at:now,downloadVerified,invoiceIssued};
 store.set(stageKey(account),[...current.filter(item=>item.orderId!==id),row].slice(-MAX));
 const pendingKey='nativeAlertsPending:'+String(account),pending=store.get(pendingKey);
 if(Array.isArray(pending)&&pending.length){
  const decorated=decoratePending(store,account,pending,now);
  if(decorated.some((item,i)=>item!==pending[i]))store.set(pendingKey,decorated);
 }
 return true;
}
function matchRecord(rows,item,now){
 const id=String(item.orderId||''),n=number(item.orderNumber);
 const createdAt=Date.parse(item.created_at||item.createdAt||'');
 let row=id&&uuid.test(id)?rows.find(entry=>entry.orderId===id):null;
 if(!row&&!uuid.test(id)&&n&&Number.isFinite(createdAt)){
  const matches=rows.filter(entry=>entry.number===n&&entry.at>=createdAt-60000&&entry.at-createdAt<=TTL);
  if(matches.length===1)row=matches[0];
 }
 if(!row)return null;
 if(Number.isFinite(createdAt)&&(row.at<createdAt-60000||row.at-createdAt>TTL))return null;
 return row;
}

function entries(store,account,now=Date.now()){
 const data=store.get(key(account));
 const source=Array.isArray(data)?data:[];
 return source.filter(row=>row&&uuid.test(String(row.orderId||''))&&
   Number.isFinite(row.at)&&row.at<=now+60000&&now-row.at<=TTL&&
   (row.number===null||number(row.number)===row.number));
}
function noteComplete(store,account,progress,now=Date.now()){
 if(!account||progress?.phase!=='complete'||progress.downloadVerified!==true||progress.invoiceIssued!==true||
    !uuid.test(String(progress.orderId||''))||!Number.isFinite(now))return false;
 const current=entries(store,account,now),id=String(progress.orderId);
 const found=current.find(row=>row.orderId===id);
 const row={orderId:id,number:number(progress.number)||found?.number||null,at:now};
 const next=[...current.filter(item=>item.orderId!==id),row].slice(-MAX);
 store.set(key(account),next);
 // Persist the verified note into the ORIGINAL unread notification itself.
 // Its lifetime is controlled only by operator acknowledgement, not the
 // short-lived progress card nor the bounded order-ID correlation cache.
 const pendingKey='nativeAlertsPending:'+String(account),pending=store.get(pendingKey);
 if(Array.isArray(pending)&&pending.length){
  const decorated=decoratePending(store,account,pending,now);
  if(decorated.some((item,i)=>item!==pending[i]))store.set(pendingKey,decorated);
 }
 return true;
}
function decoratePending(store,account,items,now=Date.now()){
 if(!account||!Array.isArray(items)||!items.length)return Array.isArray(items)?items:[];
 const completed=entries(store,account,now),stages=verifiedEntries(store,account,now);
 return items.map(item=>{
  if(item?.orderAlert!==true)return item;
  const stage=matchRecord(stages,item,now);
  let next=item;
  if(stage&&(item.downloadVerified!==true||stage.invoiceIssued===true&&item.invoiceIssued!==true)){
   next={...item,downloadVerified:stage.downloadVerified===true||item.downloadVerified===true,
     invoiceIssued:stage.invoiceIssued===true||item.invoiceIssued===true};
  }
  if(next.completionNote===NOTE&&Number.isFinite(Date.parse(next.completedAt||'')))return next;
  const finished=matchRecord(completed,next,now);
  return finished?{...next,completionNote:NOTE,completedAt:new Date(finished.at).toISOString(),
    downloadVerified:true,invoiceIssued:true}:next;
 });
}
module.exports={NOTE,TTL,MAX,noteComplete,decoratePending,recordVerifiedStages,verifiedEntries};
