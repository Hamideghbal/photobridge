'use strict';
// Read-only invoice proof for the same authenticated order, independent of
// download/PDF/print. Never promote a generic 100% or "complete" signal.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function createInvoiceProof({request,getAccount,timeoutMs=2500}){
 return async ({account,orderId})=>{
  if(!account||getAccount()!==account||!UUID.test(String(orderId||'')))return false;
  try{
   const res=await request('/api/lab/orders/'+encodeURIComponent(orderId),{signal:AbortSignal.timeout(timeoutMs)});
   if(!res.ok||getAccount()!==account)return false;
   const data=await res.json();
   if(getAccount()!==account)return false;
   const order=data?.order;
   // Invoice ID is created only by the real invoice API, not by downloading
   // photos or acknowledging receipt. Never trust a different order's record.
   return String(order?.id||'')===String(orderId)&&Boolean(order?.invoice_id)&&
     Boolean(order?.invoice_issued_at);
  }catch{return false}
 };
}
module.exports={createInvoiceProof};
