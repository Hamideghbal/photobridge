'use strict';
// These screens reload their balances immediately after a confirmed write.
// A queued acknowledgement must never masquerade as that confirmation.
const liveFinance=url=>/^\/api\/lab\/(?:finance(?:\/|$)|invoices(?:\/|$)|delegated-customers\/[0-9a-f-]+\/adjust-initial-debt(?:\/|$))/.test(new URL(url,'http://localhost').pathname);
async function forwardLiveFinance({req,res,bytes,contentType,store,request,json}){
 if(['GET','HEAD','OPTIONS'].includes(req.method)||!liveFinance(req.url))return false;
 if(store.rows().some(row=>['pending','conflict'].includes(row.state)&&liveFinance(row.url))){json(res,409,{error:'financial_sync_pending',message:'یک تغییر مالی قبلی هنوز همگام نشده است؛ ابتدا همگام‌سازی یا تعارض آن را برطرف کنید. ثبت جدید انجام نشد.'});return true;}
 try{const response=await request(req.url,{method:req.method,body:bytes,headers:{'Content-Type':contentType||'application/json'}});const body=Buffer.from(await response.arrayBuffer());res.writeHead(response.status,{'Content-Type':response.headers.get('content-type')||'application/json','Cache-Control':'no-store'});res.end(body);}catch{if(!/\/adjust-initial-debt(?:\/|$)/.test(new URL(req.url,'http://localhost').pathname))return false;json(res,503,{error:'finance_live_connection_required',message:'ثبت مالی تأیید نشد. اتصال اینترنت را بررسی کنید و پیش از تکرار، وضعیت ثبت را بازخوانی کنید.'});}return true;
}
module.exports={liveFinance,forwardLiveFinance};
