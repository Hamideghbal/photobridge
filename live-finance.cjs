'use strict';
// These screens reload their balances immediately after a confirmed write.
// A queued acknowledgement must never masquerade as that confirmation.
const liveFinance=url=>/^\/api\/lab\/(?:finance(?:\/|$)|invoices(?:\/|$)|delegated-customers\/[0-9a-f-]+\/adjust-initial-debt(?:\/|$))/.test(new URL(url,'http://localhost').pathname);
const orderMutation=url=>/^\/api\/lab\/(?:orders(?:\/|$)|order-files(?:\/|$))/.test(new URL(url,'http://localhost').pathname);
function invoiceAction(method,url,body={}){
 const pathname=new URL(url,'http://localhost').pathname;
 if(method==='PUT'&&/^\/api\/lab\/orders\/[0-9a-f-]{36}\/invoice-pricing$/i.test(pathname))return true;
 if(method==='PATCH'&&body?.status==='ready'&&/^\/api\/lab\/orders\/[0-9a-f-]{36}$/i.test(pathname))return true;
 return method==='PUT'&&body?.stage==='ready'&&/^\/api\/lab\/orders\/[0-9a-f-]{36}\/album-stage$/i.test(pathname);
}
function invoiceOrderId(method,url,body={}){
 const pathname=new URL(url,'http://localhost').pathname;
 const match=method==='PATCH'&&body?.status==='ready'
  ?pathname.match(/^\/api\/lab\/orders\/([0-9a-f-]{36})$/i)
  :method==='PUT'&&body?.stage==='ready'
   ?pathname.match(/^\/api\/lab\/orders\/([0-9a-f-]{36})\/album-stage$/i)
   :method==='PUT'
    ?pathname.match(/^\/api\/lab\/orders\/([0-9a-f-]{36})\/invoice-pricing$/i)
    :null;
 return match?match[1].toLowerCase():null;
}
function orderMutationTargets(row,orderId){
 if(!orderId||!orderMutation(row.url))return false;
 const pathname=new URL(row.url,'http://localhost').pathname;
 const direct=pathname.match(/^\/api\/lab\/orders\/([0-9a-f-]{36})(?:\/|$)/i);
 if(direct)return direct[1].toLowerCase()===orderId;
 const body=row.body||{},related=String(body.orderId||body.order_id||body.order?.id||'').toLowerCase();
 // If an order-file mutation cannot be tied to an order, preserve the safety block.
 return !related||related===orderId;
}
async function forwardLiveFinance({req,res,bytes,contentType,store,request,json,sync}){
 if(['GET','HEAD','OPTIONS'].includes(req.method))return false;
 let payload={};try{payload=bytes?.length?JSON.parse(bytes.toString()):{}}catch{}
 const invoice=invoiceAction(req.method,req.url,payload),financial=liveFinance(req.url);
 if(!financial&&!invoice)return false;
 const targetOrder=invoiceOrderId(req.method,req.url,payload);
 const blocks=row=>['pending','conflict'].includes(row.state)&&(liveFinance(row.url)||(invoice&&orderMutationTargets(row,targetOrder)));
 // Drain work immediately instead of making the lab wait for the next timer tick.
 if(store.rows().some(blocks)&&sync)try{await sync.run()}catch{}
 if(store.rows().some(blocks)){
  json(res,409,{error:invoice?'order_sync_pending':'financial_sync_pending',message:invoice?'PhotoBridge در حال همگام‌سازی خودکار تغییرات همین سفارش است؛ پس از تأیید سرور، آماده‌سازی ادامه پیدا می‌کند.':'PhotoBridge در حال همگام‌سازی خودکار تغییر مالی قبلی است؛ پس از تأیید سرور، ثبت ادامه پیدا می‌کند.'});
  return true;
 }
 try{const response=await request(req.url,{method:req.method,body:bytes,headers:{'Content-Type':contentType||'application/json'}});const body=Buffer.from(await response.arrayBuffer());res.writeHead(response.status,{'Content-Type':response.headers.get('content-type')||'application/json','Cache-Control':'no-store'});res.end(body);}catch{if(invoice){json(res,503,{error:'invoice_live_connection_required',message:'آماده‌تحویل و صدور فاکتور به اتصال اینترنت نیاز دارد. وضعیت سفارش تغییر نکرده و عملیات آفلاین صف نشده است.'});return true;}if(!/\/adjust-initial-debt(?:\/|$)/.test(new URL(req.url,'http://localhost').pathname))return false;json(res,503,{error:'finance_live_connection_required',message:'ثبت مالی تأیید نشد. اتصال اینترنت را بررسی کنید و پیش از تکرار، وضعیت ثبت را بازخوانی کنید.'});}return true;
}
module.exports={liveFinance,orderMutation,invoiceAction,invoiceOrderId,orderMutationTargets,forwardLiveFinance};
