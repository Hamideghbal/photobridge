'use strict';
// Read-only invoice proof for the same authenticated order, independent of
// download/PDF/print. Never promote a generic 100% or "complete" signal.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function createInvoiceProof({request,getAccount,timeoutMs=2500}){
 return async ({account,orderId})=>{
  if(!account||getAccount()!==account||!UUID.test(String(orderId||'')))return false;
  // Electron 22 embeds Node 16; avoid relying on AbortSignal.timeout from
  // the host build Node. Use a bounded AbortController for server proof.
  let timer;
  try{
   const controller=new AbortController();
   timer=setTimeout(()=>controller.abort(),Math.max(1,Number(timeoutMs)||2500));
   const res=await request('/api/lab/orders/'+encodeURIComponent(orderId),{signal:controller.signal});
   if(!res.ok||getAccount()!==account)return false;
   const data=await res.json();
   if(getAccount()!==account)return false;
   const order=data?.order;
   // Invoice ID and issue time are real server proofs for the exact order.
   return String(order?.id||'')===String(orderId)&&Boolean(order?.invoice_id)&&
     Boolean(order?.invoice_issued_at);
  }catch{return false}
  finally{if(timer)clearTimeout(timer)}
 };
}
module.exports={createInvoiceProof};
