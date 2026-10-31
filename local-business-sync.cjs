'use strict';
const {LocalBusiness}=require('./local-business.cjs');
async function syncBusiness(store,request,verifyFiles){
 const engine=new LocalBusiness(store),lab=store.get('labId');if(!store.get('localBusinessActive:'+lab)||!store.get('localBusiness:v1:'+lab))return{sent:0};let sent=0;
 const same=()=>{if(store.get('labId')!==lab)throw Error('account_changed');};
 const update=fn=>{same();return store.transaction(()=>{const s=engine.state(),out=fn(s);store.set(engine.key(),s);return out;});};
 const call=async(method,url,body)=>{same();const r=await request(url,{method,...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();same();if(!r.ok)throw Object.assign(Error(data.message||data.error||'sync_rejected'),{httpStatus:r.status,code:data.error});return data;};
 const mapId=value=>value?.serverId||(value?.remote?value.id:null);
 for(const event of engine.state().events.filter(e=>e.state!=='synced')){
  if(event.state==='conflict')break;
  try{
   const s=engine.state(),o=s.orders[event.target],inv=event.kind==='manual_invoice'&&event.snapshot?event.snapshot:s.invoices[event.target];
   if(event.kind==='customer_create'){
    const c=event.snapshot||s.customers[event.target];if(!/^09[0-9]{9}$/.test(c.mobile||''))throw Object.assign(Error('customer_mobile_required_for_site_sync'),{httpStatus:409});const result=await call('POST','/api/lab/delegated-customers',{name:c.name,mobile:c.mobile,initialDebt:c.initialDebt||0,sendInvitation:event.body.sendInvitation===true});if(!result.customer?.id)throw Error('invalid_server_customer');update(live=>{live.customers[c.id].serverId=result.customer.id;});
   }else if(event.kind==='order_create'){
    if(verifyFiles)await verifyFiles(o.localFiles||[]);const c=s.customers[o.customer_id],customerId=mapId(c);
    const created=await call('POST','/api/lab/delegated-orders',{clientOrderId:o.id,localOnly:true,mode:o.mode,albumData:o.album_data,delivery:o.delivery||'pickup',priority:o.priority||'normal',...(customerId?{customerId}:{studioName:c.name,mobile:c.mobile,sendInvitation:false})});
    if(!created.orderId)throw Error('invalid_server_order');update(live=>{live.orders[o.id].serverId=created.orderId;live.orders[o.id].serverNumber=created.orderNumber;live.customers[c.id].serverId=created.customerId;});
    const oldDrafts=store.get('offlineOrders:'+lab)||[];if(oldDrafts.some(d=>d.id===o.id)){store.set('offlineOrders:'+lab,oldDrafts.map(d=>d.id===o.id?{...d,state:'synced',serverOrderId:created.orderId,serverNumber:created.orderNumber}:d));}
    const detail=await call('GET','/api/lab/orders/'+created.orderId);
    if(detail.order?.status==='uploading'){
     for(const f of o.files)await call('POST',`/api/lab/delegated-orders/${created.orderId}/files/presign`,{...f.localMetadata,clientFileId:f.id,localOnly:true,name:f.name||f.original_name,bytes:f.bytes,printSizeId:f.print_size_id,printType:f.print_type,printCopies:f.print_copies,chassis:f.chassis,frame:f.frame});
     await call('POST',`/api/lab/delegated-orders/${created.orderId}/submit`,{sendInvoiceSms:event.body.sendInvoiceSms===true});
    }
   }else if(event.kind==='order_pricing'){
    const remoteId=mapId(o);if(!remoteId)throw Error('dependency_not_synced');
    const requirements=await call('GET',`/api/lab/orders/${remoteId}/invoice-pricing`);
    if(requirements.requirements?.length){const prices=requirements.requirements.map(r=>{const price=event.body.prices?.find(p=>(p.key||p.sizeId+'|'+p.printType)===r.key);return price||{key:r.key,sizeId:r.sizeId,printType:r.printType,unitPrice:r.unitPrice};});if(prices.some(p=>p.unitPrice==null))throw Object.assign(Error('server_pricing_changed'),{httpStatus:409});await call('PUT',`/api/lab/orders/${remoteId}/invoice-pricing`,{prices,desktopOperationId:event.id});}
   }else if(event.kind==='order_invoice'){
    const remoteId=mapId(o),local=s.invoices[event.body.invoiceId];if(!remoteId)throw Error('dependency_not_synced');const detail=await call('GET',`/api/lab/orders/${remoteId}`);
    let remote=detail.invoice;if(!remote){const result=await call('PATCH',`/api/lab/orders/${remoteId}`,{status:'ready'});remote=result.invoice;}
    if(!remote?.id||Number(remote.total)!==local.total)throw Object.assign(Error('invoice_amount_conflict'),{httpStatus:409});
    update(live=>{live.invoices[local.id].serverId=remote.id;live.invoices[local.id].serverNumber=remote.number;});
   }else if(event.kind==='order_status'){
    const remoteId=mapId(o);if(!remoteId)throw Error('dependency_not_synced');const current=await call('GET',`/api/lab/orders/${remoteId}`);if(event.body.stage){if(current.order?.album_stage!==event.body.stage)await call('PUT',`/api/lab/orders/${remoteId}/album-stage`,{stage:event.body.stage,note:event.body.note});}else if(current.order?.status!==event.body.status)await call('PATCH',`/api/lab/orders/${remoteId}`,{status:event.body.status,note:event.body.note});
   }else if(event.kind==='manual_invoice'){
    const c=s.customers[inv.customer_id],customerId=mapId(c);const result=await call('POST','/api/lab/invoices/manual',{...(customerId?{customerId}:{customerName:c.name,customerMobile:c.mobile}),items:inv.items,note:`سند محلی ${inv.number} · ${inv.note||''}`,issuedAt:inv.issued_at,paidAmount:0,desktopOperationId:event.id});
    if(!result.invoice?.id||Number(result.invoice.total)!==inv.total)throw Object.assign(Error('invoice_amount_conflict'),{httpStatus:409});update(live=>{live.invoices[inv.id].serverId=result.invoice.id;live.invoices[inv.id].serverNumber=result.invoice.number;if(result.customer?.id)live.customers[c.id].serverId=result.customer.id;});
   }else if(event.kind==='payment'){
    const p=event.snapshot||s.payments[event.target],invoice=p.invoice_id?s.invoices[p.invoice_id]:null,customer=s.customers[p.customer_id],invoiceId=mapId(invoice),customerId=mapId(customer);if(invoice&&!invoiceId||!invoice&&!customerId)throw Error('dependency_not_synced');const result=await call('POST','/api/lab/finance/payments',{...(invoiceId?{invoiceId}:{customerId}),amount:p.amount,method:p.method,note:`سند محلی ${p.number} · ${p.note}`,paidAt:p.paid_at,desktopOperationId:event.id});if(!result.payment?.id)throw Error('invalid_server_payment');update(live=>{live.payments[p.id].serverId=result.payment.id;});
   }else if(event.kind==='expense'){
    const expense=event.snapshot||s.expenses[event.target];const result=await call('POST','/api/lab/finance/expenses',{amount:expense.amount,category:expense.category,payee:expense.payee,method:expense.method,note:`سند محلی ${expense.number} · ${expense.note}`,spentAt:expense.spent_at,desktopOperationId:event.id});if(!result.expense?.id)throw Error('invalid_server_expense');update(live=>{live.expenses[expense.id].serverId=result.expense.id;});
   }else if(event.kind==='customer_settings'){
    const customerId=mapId(s.customers[event.target]);if(!customerId)throw Error('dependency_not_synced');await call('PUT','/api/lab/finance/customer-settings',{...event.body,customerId,desktopOperationId:event.id});
   }else if(event.kind==='adjustment'){
    const a=event.snapshot||s.adjustments[event.target],customerId=mapId(s.customers[a.customer_id]);if(!customerId)throw Error('dependency_not_synced');const result=await call('POST','/api/lab/finance/customer-adjustments',{customerId,amount:a.amount,note:a.note,desktopOperationId:event.id});if(!result.adjustment?.id)throw Error('invalid_server_adjustment');update(live=>{live.adjustments[a.id].serverId=result.adjustment.id;});
   }else if(event.kind==='correction'){
    const correction=event.snapshot||s.corrections[event.target],table={invoice:'invoices',payment:'payments',expense:'expenses'}[correction.target_type],targetId=mapId(s[table][correction.target_id]);if(!targetId)throw Error('dependency_not_synced');const result=await call('POST','/api/lab/finance/corrections',{...correction.body,targetId,desktopOperationId:event.id});if(!result.correction?.id)throw Error('invalid_server_correction');update(live=>{live.corrections[correction.id].serverId=result.correction.id;});
   }else throw Object.assign(Error('unsupported_local_event'),{httpStatus:409});
   update(live=>{const e=live.events.find(x=>x.id===event.id);e.state='synced';e.syncedAt=new Date().toISOString();delete e.error;});sent++;
  }catch(error){same();update(live=>{const e=live.events.find(x=>x.id===event.id);e.error={code:error.code||error.message,httpStatus:error.httpStatus||null};if(error.httpStatus&&error.httpStatus<500&&![401,403,408,429].includes(error.httpStatus))e.state='conflict';});break;}
 }
 if(!engine.state().events.some(e=>e.state!=='synced')){
  for(const adjustment of Object.values(engine.state().adjustments).filter(a=>a.auto_discount&&!a.serverId)){
   try{const s=engine.state(),customerId=mapId(s.customers[adjustment.customer_id]);if(!customerId)throw Error('dependency_not_synced');
    const documents=(await call('GET','/api/lab/invoices')).invoices||[],source=(adjustment.sourceInvoiceIds||[]).map(id=>{const i=s.invoices[id],remoteId=mapId(i);return documents.find(d=>d.document_type==='invoice'&&d.id===remoteId);});if(!source.length||source.some(i=>!i))throw Error('discount_invoice_reconciliation_pending');
    const dates=source.map(i=>Date.parse(i.issued_at)).sort((a,b)=>a-b),automatic=documents.filter(d=>d.document_type==='discount'&&d.auto_discount&&d.customer_id===customerId);
    const matching=automatic.find(d=>Number(d.discount||Math.abs(d.total))===adjustment.amount&&Number(d.invoice_count)===adjustment.invoice_count&&Number(d.discount_percent)===adjustment.percent&&Date.parse(d.period_from)===dates[0]&&Date.parse(d.period_to)===dates.at(-1));
    let remoteId=matching?.id;
    if(!remoteId){const statement=await call('GET','/api/lab/finance/customer-statement?customerId='+customerId),cfg=statement.settings||{},start=Date.parse(cfg.discount_started_at||cfg.updated_at||0),overlap=automatic.some(d=>dates.some(date=>date>=Date.parse(d.period_from)&&date<=Date.parse(d.period_to)));
     // Never add a second discount when the server may already have included these invoices.
     if(overlap||cfg.discount_enabled&&dates.some(date=>date>=start))throw Object.assign(Error('automatic_discount_conflict'),{httpStatus:409});
     const result=await call('POST','/api/lab/finance/customer-adjustments',{customerId,amount:adjustment.amount,note:`تخفیف صادرشدهٔ محلی ${adjustment.number} · ${adjustment.note}`,desktopOperationId:adjustment.id});remoteId=result.adjustment?.id;if(!remoteId)throw Error('invalid_server_adjustment');
    }
    update(live=>{live.adjustments[adjustment.id].serverId=remoteId;delete live.adjustments[adjustment.id].syncError;});sent++;
   }catch(error){same();update(live=>{live.adjustments[adjustment.id].syncError={code:error.code||error.message,httpStatus:error.httpStatus||null};});break;}
  }
 }
 return{sent};
}
module.exports={syncBusiness};
