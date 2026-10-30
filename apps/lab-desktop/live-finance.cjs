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
async function forwardLiveFinance({req,res,bytes,contentType,store,request,json}){
 if(['GET','HEAD','OPTIONS'].includes(req.method))return false;
 let payload={};try{payload=bytes?.length?JSON.parse(bytes.toString()):{}}catch{}
 const invoice=invoiceAction(req.method,req.url,payload),financial=liveFinance(req.url);
 if(!financial&&!invoice)return false;
 if(store.rows().some(row=>['pending','conflict'].includes(row.state)&&(liveFinance(row.url)||(invoice&&orderMutation(row.url))))){json(res,409,{error:invoice?'order_sync_pending':'financial_sync_pending',message:invoice?'یک تغییر مالی یا تغییری در سفارش هنوز همگام نشده است؛ ابتدا همگام‌سازی یا تعارض آن را برطرف کنید. آماده‌تحویل/صدور فاکتور انجام نشد.':'یک تغییر مالی قبلی هنوز همگام نشده است؛ ابتدا همگام‌سازی یا تعارض آن را برطرف کنید. ثبت جدید انجام نشد.'});return true;}
 try{const response=await request(req.url,{method:req.method,body:bytes,headers:{'Content-Type':contentType||'application/json'}});const body=Buffer.from(await response.arrayBuffer());res.writeHead(response.status,{'Content-Type':response.headers.get('content-type')||'application/json','Cache-Control':'no-store'});res.end(body);}catch{if(invoice){json(res,503,{error:'invoice_live_connection_required',message:'آماده‌تحویل و صدور فاکتور به اتصال اینترنت نیاز دارد. وضعیت سفارش تغییر نکرده و عملیات آفلاین صف نشده است.'});return true;}if(!/\/adjust-initial-debt(?:\/|$)/.test(new URL(req.url,'http://localhost').pathname))return false;json(res,503,{error:'finance_live_connection_required',message:'ثبت مالی تأیید نشد. اتصال اینترنت را بررسی کنید و پیش از تکرار، وضعیت ثبت را بازخوانی کنید.'});}return true;
}
module.exports={liveFinance,orderMutation,invoiceAction,forwardLiveFinance};
