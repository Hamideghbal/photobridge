'use strict';
const {createManualInvoiceDialog}=require('./manual-invoice-dialog.cjs');
function createManualInvoiceFlow({request,pdf,print,queuePrice,changed}){
 const flights=new Map();
 async function work(orderId,labId){
  let detail=await request('/api/lab/orders/'+encodeURIComponent(orderId));
  const order=detail.order;
  if(!order?.downloaded_at)throw Error('download_not_verified');
  labId ||= order.lab_id;
  let invoice=detail.invoice;
  if(!invoice){
   const independent=order.document_authority==='offline'||order.origin_offline&&!order.remote&&!order.serverId&&!order.sharedAt;
   if(!independent){
    const receipt=await request('/api/lab/orders/'+encodeURIComponent(orderId)+'/download-receipt/download',{method:'POST',body:JSON.stringify({files:(detail.files||[]).map(f=>({id:f.id,name:f.original_name,bytes:Number(f.bytes)}))})});
    invoice=receipt?.invoice||null;
   }
   try{if(!invoice){const result=await request('/api/lab/orders/'+encodeURIComponent(orderId)+'/automation-invoice',{method:'POST',body:'{}'});invoice=result.invoice;}}
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
  queuePrice:()=>{},
  print:async(orderId,invoiceId)=>{const response=await fetch('/desktop/thermal/print',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'invoice',orderId,invoiceId})});const data=await response.json();if(!response.ok||data.state!=='spool_accepted'){const messages={printer_not_configured:'چاپگر فاکتور در تنظیمات برنامه انتخاب نشده است.',printer_offline_or_missing:'چاپگر انتخاب‌شده در دسترس نیست؛ اتصال و صف چاپ را بررسی کنید.',printer_submission_uncertain:'نتیجهٔ چاپ نامشخص است؛ قبل از تکرار، صف چاپ را بررسی کنید.'};throw Object.assign(Error(messages[data.error]||'چاپ نیاز به بررسی دارد؛ وضعیت و صف چاپگر را بررسی کنید.'),{code:data.error||data.state});}},
  changed:()=>{window.dispatchEvent(new CustomEvent('photobridge-lab-orders-changed'));window.dispatchEvent(new CustomEvent('photobridge-finance-changed'));}
 });
 flow.open=pbCreateManualInvoiceDialog({document,request:Me,complete:flow.complete});
 flow.isIndependent=async id=>{try{const {order}=await Me('/api/lab/orders/'+encodeURIComponent(id));return order?.document_authority==='offline'||!!(order?.origin_offline&&!order.remote&&!order.serverId&&!order.sharedAt);}catch{return false;}};
 flow.isHostOffline=async()=>{try{const response=await fetch('/desktop/status',{cache:'no-store'});if(!response.ok)return false;return(await response.json()).internetConnected===false;}catch{return false;}};
 window.pbManualInvoiceFlow=flow;
 const previous=typeof pb1568AfterManualDownload==='function'?pb1568AfterManualDownload:null;
 if(previous)pb1568AfterManualDownload=async function(id,lab){const detail=await Me('/api/lab/orders/'+encodeURIComponent(id));if(detail.order?.source==='lab_delegated'||detail.order?.origin_offline){const outcome=await flow.open({orderId:id,labId:lab});return outcome?.cancelled?{...outcome,pricingRequired:true}:outcome;}return previous(id,lab);};
}
function patchManualInvoiceUI(source){
 if(source.includes('/* PB1642 native manual invoice */'))return source;
 const pricing='on=(le,nt="none")=>{Fe({order:le,resume:nt})}';
 if(!source.includes(pricing))throw Error('manual_invoice_pricing_ui_incompatible');
 source=source.replace(pricing,`on=(le,nt="none")=>window.pbManualInvoiceFlow.open({orderId:le.id,labId:le.lab_id||t?.id,onIssued:async outcome=>{await ye();if(outcome?.warning)P(outcome.warning);if(nt!=='none'&&outcome?.invoice)await aa({...le,invoice_id:outcome.invoice.id},nt);}})`);
 const network='function pb1586ShowNetworkProblem(order,stage){';
 const hasNetwork=source.includes(network);
 if(hasNetwork)source=source.replace(network,'function pb1642CloudNetworkProblem(order,stage){');
 const networkWrapper=hasNetwork?`function pb1586ShowNetworkProblem(order,stage){if(order?.document_authority==='offline'||order?.origin_offline&&!order.remote&&!order.serverId&&!order.sharedAt)return;if(window.pbManualInvoiceFlow?.isIndependent){void(async()=>{const local=await window.pbManualInvoiceFlow.isIndependent(order?.id);if(local)return;if(await window.pbManualInvoiceFlow.isHostOffline?.())return;if(document.querySelector('dialog.pbManualInvoiceDialog,dialog.pb1137Intake'))return;pb1642CloudNetworkProblem(order,stage);})();return;}pb1642CloudNetworkProblem(order,stage);}`:'';
 const stageOverride=`if(typeof pb1603StageInvoicePending==='function')pb1603StageInvoicePending=function(order,stage){return order.invoice_required!==false&&!order.invoice_id&&!order.invoiceId&&!order.local_invoice_id&&(['print','printing','reviewing','needs_fix','designing','ready_print','printed','binding','ready','completed'].includes(stage)||stage==='download_print'&&!!order.downloaded_at);};`;
 source+='\n'+networkWrapper+'\n'+stageOverride;

 return source+'\n/* PB1642 native manual invoice */\n'+createManualInvoiceDialog.toString().replace('function createManualInvoiceDialog','function pbCreateManualInvoiceDialog')+'\n'+createManualInvoiceFlow.toString().replace('function createManualInvoiceFlow','function pbCreateManualInvoiceFlow')+'\n'+installManualInvoiceFlow.toString()+'\nif(typeof window!=="undefined"&&window.pbNativeStorage)installManualInvoiceFlow();\n';
}
module.exports={createManualInvoiceFlow,patchManualInvoiceUI};
