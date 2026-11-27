// Small, fail-closed transformations on the final generated Lab bundles.
const marker='/* PB2080 archive reprint */';
function one(s,a,b){if(s.split(a).length!==2)throw Error('R2080 anchor: '+a.slice(0,120));return s.replace(a,b)}
function section(s,a,b,fn){const i=s.indexOf(a),j=s.indexOf(b,i+a.length);if(i<0||j<=i)throw Error('R2080 section: '+a);return s.slice(0,i)+fn(s.slice(i,j))+s.slice(j)}
export function patchInvoicePolicy(s){
 if(s.includes(marker))return s;
 if(s.includes('export async function invoiceAfterVerifiedDownload')){
  s=one(s,' if(order.invoice_required===false&&!r1682DirectCustomerOrder(order))return {};',' if(order.invoice_required===false&&(order.recovered_from_order_id||!r1682DirectCustomerOrder(order)))return {};');
 }else{
  s=one(s,'if(!order||(order.invoice_required===false&&!direct)||','if(!order||(order.invoice_required===false&&(order.recovered_from_order_id||!direct))||');
 }
 return s+'\n'+marker+'\n';
}
export function patchServer(s){
 if(s.includes(marker))return s;
 s=one(s,"publishCustomerEvent(labId, String(newOrder.customer_id), 'archive_order_recovered', recoveryEvent);","if(invoiceRequired)publishCustomerEvent(labId, String(newOrder.customer_id), 'archive_order_recovered', recoveryEvent);");
 s=one(s,"publishCustomerEvent(labId, String(ready.customer_id), 'archive_order_recovered', recoveryEvent);","if(order.invoice_required!==false)publishCustomerEvent(labId, String(ready.customer_id), 'archive_order_recovered', recoveryEvent);");
 s=one(s,'async function notifyLabCustomerForStatus(labId, customerId, status, order, invoice) {','async function notifyLabCustomerForStatus(labId, customerId, status, order, invoice) {\n    if(order?.recovered_from_order_id&&order.invoice_required===false)return;');
 // Lab notification remains independent of the customer notice.
 s=section(s,'function labEventNotificationCopy(','function customerEventNotificationCopy(',part=>{
  const target="return { title: 'چاپ مجدد از آرشیو', message: "+String.fromCharCode(96)+"برای سفارش"+String.fromCharCode(36)+"{notificationOrderNo(data)} یک چاپ مجدد از آرشیو ساخته شد."+String.fromCharCode(96)+" };";
  const copy="return { title: data?.invoiceRequired===false?'چاپ مجدد بدون فاکتور':'چاپ مجدد از آرشیو', message: 'سفارش'+notificationOrderNo(data)+(data?.localRecovery?' به چرخه چاپ برگشت.':' از آرشیو بازیابی شد؛ دریافت فایل‌ها هنوز باید تأیید شود.') };";
  return one(part,target,copy);
 });
 // Pass the explicit flag only from existing committed Lab status routes.
 s=section(s,"if (labOrder && req.method === 'PATCH')","const labAlbumStage",part=>{
  return one(part,"publishCustomerEvent(labId, order.customer_id, 'order_status', { orderId: order.id,","if(!(order.recovered_from_order_id&&order.invoice_required===false))publishCustomerEvent(labId, order.customer_id, 'order_status', { orderId: order.id,");
 });
 for(const [a,b] of [['const labAlbumDownloadComplete','const labArchiveRecover'],['const labAlbumStage','/api/lab/walkin']]){
  const i=s.indexOf(a),j=s.indexOf(b,i+1);
  if(i<0||j<i)throw Error('R2080 album section '+a);
  const p=s.slice(i,j),next=p.replace(/publishCustomerEvent\(labId, String\(order\.customer_id\), '(?:album_stage_updated|order_status)',/g,m=>'if(!(order.recovered_from_order_id&&order.invoice_required===false))'+m);
  if(p===next)throw Error('R2080 album status notification '+a);
  s=s.slice(0,i)+next+s.slice(j);
 }
 return s+'\n'+marker+'\n';
}
export function patchUi(s,native){
 if(s.includes(marker))return s;
 const button='e.jsx("button",{className:"primary compactArchiveDownload",disabled:p===m.order.id,onClick:()=>X(m),children:p===m.order.id?"در حال دریافت…":"دریافت مجدد فایل‌ها"})';
 s=one(s,button,'null');
 s=section(s,'async function pb1451RestoreLocal(','async function pb1451RecoverOrder(',part=>{
  // The native branch used to skip acknowledgement after local recovery.
  // Always use the verified receipt and its current document revision.
  part=part.replace(/(?:if\(!window\.pbNativeStorage\)\s*|const receipt=)?await pb1451AcknowledgeDownload\(prepared\);/g,'');
  part=one(part,"const downloaded=await pb1451LiveRecovery('/api/lab/orders/'+draft.id,","const receipt=await pb1451AcknowledgeDownload(prepared);\n    const downloaded=await pb1451LiveRecovery('/api/lab/orders/'+draft.id,");
  if(!part.includes('expectedRevision:receipt.order.document_revision'))part=one(part,"draft.id,{status:'downloaded',","draft.id,{status:'downloaded',expectedRevision:receipt.order.document_revision,");
  part=one(part,'return {...finalized,order:downloaded.order,','return {...finalized,receipt,order:downloaded.order,');
  // Avoid scanning the whole manifest once for every file.
  part=one(part,'for(const entry of mapped){\n      const meta=prepared.files.find(f=>String(f.id)===entry.id);','const manifestById=new Map(prepared.files.map(f=>[String(f.id),f]));\n    for(const entry of mapped){\n      const meta=manifestById.get(entry.id);');
  return part;
 });
 // Avoid a full React render for every fast local-file progress callback.
 s=section(s,'async function pb1451RecoverOrder(','function pb1451RecoveryMessage(',part=>{
  const start="async function pb1451RecoverOrder(detail,invoiceRequired,note,progress) {";
  return one(part,start,start+"\n  const notify=progress;let lastProgress=0;progress=value=>{const now=Date.now();if(value?.done===value?.total||now-lastProgress>=100){lastProgress=now;notify?.(value)}};");
 });
 const start=s.indexOf('function pb1451RecoveryMessage('),end=s.indexOf('function pb1451RecoveryError(',start);
 if(start<0||end<0)throw Error('R2080 recovery message');
 // Preserve async modifier of the following function.
 const boundary=s.slice(end-6,end)==='async '?end-6:end;
 s=s.slice(0,start)+recoveryMessage+'\n'+s.slice(boundary);
 if(native){
  s=section(s,'async function pb1568ProcessOrder(','async function pb1568AutoTick(',part=>{
   const a="   pb1586Stage='invoice';";
   return one(part,a,"   if(order.recovered_from_order_id&&order.invoice_required===false){pb1568Save(lab,id,{phase:'complete',attempts:0});pb1581Report({...order,lab_id:lab},{phase:'verified',stage:'download',downloadVerified:true,networkError:false,queued:false});return;}\n"+a);
  });
 }
 return s+'\n'+client+'\n'+marker+'\n';
}
const recoveryMessage=String.raw`function pb1451RecoveryMessage(result){
 const order=result.order,receipt=result.receipt||pb2080Receipts.get(String(order.id)),confirmed=Boolean(result.localPrepared||receipt?.order?.downloaded_at);
 const ref='#'+V(order.number),area=order.mode==='album'?'آلبوم':'چاپ';
 if(!confirmed)return 'سفارش '+ref+' از سرور بازیابی شد؛ فایل‌ها هنوز روی هارد تأیید نشده‌اند. دانلود سفارش جدید را انجام دهید.';
 if(order.invoice_required===false)return 'سفارش '+ref+' بدون فاکتور به صف '+area+' برگشت.';
 if(receipt?.invoice?.id)return 'سفارش '+ref+' به صف '+area+' برگشت؛ فاکتور #'+V(receipt.invoice.number)+' صادر شد.';
 if(receipt?.invoiceError==='invoice_pricing_required')return 'فایل‌های سفارش '+ref+' کامل است؛ فاکتور به علت تعرفه ناقص صادر نشد. قیمت سفارش را تکمیل کنید.';
 if(order.invoice_id||receipt?.order?.invoice_id)return 'سفارش '+ref+' به صف '+area+' برگشت؛ فاکتور صادر شده است.';
 return 'فایل‌های سفارش '+ref+' کامل است؛ صدور فاکتور تأیید نشد. از همین سفارش برای بررسی و صدور فاکتور استفاده کنید.';
}`;
const client=String.raw`const pb2080Receipts=new Map();
const pb2080BaseReceipt=pb1451AcknowledgeDownload;
pb1451AcknowledgeDownload=async function(detail){
 const result=await pb2080BaseReceipt(detail);
 const order={...detail.order,...result.order};
 if(!order.recovered_from_order_id)return result;
 pb2080Receipts.set(String(order.id),result);
 while(pb2080Receipts.size>50)pb2080Receipts.delete(pb2080Receipts.keys().next().value);
 const verified={phase:'verified',stage:'download',downloadVerified:true,networkError:false,queued:false};
 if(typeof pb1581Report==='function'){
  if(order.invoice_required===false||result.invoice?.id||order.invoice_id)pb1581Report(order,verified);
  else pb1581Report(order,{...verified,phase:'failed',stage:'invoice',error:result.invoiceError||'invoice_issuance_failed',reason:result.invoiceError==='invoice_pricing_required'?'دانلود کامل است؛ قیمت سفارش باید تکمیل شود.':'دانلود کامل است؛ صدور فاکتور تأیید نشد.'});
 }
 return result;
};
addEventListener('photobridge-auth-session-changed',()=>pb2080Receipts.clear());`;
