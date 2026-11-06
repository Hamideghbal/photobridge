'use strict';
function createManualInvoiceFlow({request,pdf,print,queuePrice,changed}){
 const flights=new Map();
 async function work(orderId,labId){
  let detail=await request('/api/lab/orders/'+encodeURIComponent(orderId));
  const order=detail.order;
  if(!order?.downloaded_at)throw Error('download_not_verified');
  labId ||= order.lab_id;
  let invoice=detail.invoice;
  if(!invoice){
   if(order.document_authority!=='offline'&&!order.origin_offline){
    await request('/api/lab/orders/'+encodeURIComponent(orderId)+'/download-receipt',{method:'POST',body:JSON.stringify({files:(detail.files||[]).map(f=>({id:f.id,name:f.original_name,bytes:Number(f.bytes)}))})});
   }
   try{const result=await request('/api/lab/orders/'+encodeURIComponent(orderId)+'/automation-invoice',{method:'POST',body:'{}'});invoice=result.invoice;}
   catch(error){if((error.data?.error||error.code)==='invoice_pricing_required'){queuePrice(labId,orderId);return{pricingRequired:true};}throw error;}
  }
  if(!invoice?.id)throw Error('invoice_missing');
  const warnings=[];
  try{await pdf(invoice,orderId);}catch{warnings.push('فاکتور صادر شد؛ ذخیرهٔ PDF نیاز به بررسی دارد.');}
  try{await print(orderId,invoice.id);}catch(error){warnings.push('فاکتور صادر شد؛ چاپ انجام نشد. '+String(error.message||'چاپگر را بررسی کنید.'));}
  changed(orderId);
  return{completed:true,invoice,warning:warnings.join(' ')};
 }
 return{complete(orderId,labId){if(flights.has(orderId))return flights.get(orderId);const flight=work(orderId,labId).finally(()=>flights.delete(orderId));flights.set(orderId,flight);return flight;}};
}
function installManualInvoiceFlow(){
 const flow=pbCreateManualInvoiceFlow({
  request:Me,pdf:(invoice,id)=>pb1547CompletePdf(invoice,id,ai()),
  queuePrice:(lab,id)=>pb1576QueuePrice(lab,id),
  print:async(orderId,invoiceId)=>{const response=await fetch('/desktop/thermal/print',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'invoice',orderId,invoiceId})});const data=await response.json();if(!response.ok||data.state!=='spool_accepted')throw Error(data.error||'وضعیت چاپگر را بررسی کنید.');},
  changed:()=>{window.dispatchEvent(new CustomEvent('photobridge-lab-orders-changed'));window.dispatchEvent(new CustomEvent('photobridge-finance-changed'));}
 });
 window.pbManualInvoiceFlow=flow;
 const previous=typeof pb1568AfterManualDownload==='function'?pb1568AfterManualDownload:null;
 if(previous)pb1568AfterManualDownload=async function(id,lab){const detail=await Me('/api/lab/orders/'+encodeURIComponent(id));if(detail.order?.source==='lab_delegated'||detail.order?.origin_offline)return flow.complete(id,lab);return previous(id,lab);};
}
function patchManualInvoiceUI(source){
 if(source.includes('/* PB1641 native manual invoice */'))return source;
 const pricing='on=(le,nt="none")=>{Fe({order:le,resume:nt})}';
 if(!source.includes(pricing))throw Error('manual_invoice_pricing_ui_incompatible');
 source=source.replace(pricing,`on=async(le,nt="none")=>{try{const pricing=await Me('/api/lab/orders/'+le.id+'/invoice-pricing');if((pricing.requirements||[]).some(row=>!row.resolved)){Fe({order:le,resume:nt});return;}const outcome=await window.pbManualInvoiceFlow.complete(le.id,le.lab_id||t?.id);if(outcome?.pricingRequired){Fe({order:le,resume:nt});return;}await ye();if(outcome?.warning)P(outcome.warning);if(nt!=='none'&&outcome?.invoice)await aa({...le,invoice_id:outcome.invoice.id},nt);}catch(error){P(error.data?.message||error.message||'صدور فاکتور انجام نشد.');}}`);
 const network='function pb1586ShowNetworkProblem(order,stage){';
 source=source.replace(network,network+"if(order?.origin_offline||order?.document_authority==='offline')return;");
 return source+'\n/* PB1641 native manual invoice */\n'+createManualInvoiceFlow.toString().replace('function createManualInvoiceFlow','function pbCreateManualInvoiceFlow')+'\n'+installManualInvoiceFlow.toString()+'\nif(typeof window!=="undefined"&&window.pbNativeStorage)installManualInvoiceFlow();\n';
}
module.exports={createManualInvoiceFlow,patchManualInvoiceUI};
