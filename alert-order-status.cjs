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
function noteComplete(store,account,progress,now=Date.now()){
 if(!account||progress?.phase!=='complete'||progress.downloadVerified!==true||
    !uuid.test(String(progress.orderId||''))||!Number.isFinite(now))return false;
 const current=entries(store,account,now),id=String(progress.orderId);
 const found=current.find(row=>row.orderId===id);
 const row={orderId:id,number:number(progress.number)||found?.number||null,at:now};
 const next=[...current.filter(item=>item.orderId!==id),row].slice(-MAX);
 store.set(key(account),next);
 return true;
}
function decoratePending(store,account,items,now=Date.now()){
 if(!account||!Array.isArray(items)||!items.length)return Array.isArray(items)?items:[];
 const records=entries(store,account,now);
 return items.map(item=>{
  if(item?.orderAlert!==true)return item;
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
  return {...item,completionNote:NOTE,completedAt:new Date(candidate.at).toISOString()};
 });
}
module.exports={NOTE,TTL,MAX,noteComplete,decoratePending};
