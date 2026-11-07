'use strict';
// Mirror authoritative invoice identifiers into queue rows only. Do not create
// local invoices, accounting entries or customer balance adjustments here.
function rememberRemoteInvoice(store,invoice,fallbackOrderId){
 if(!invoice?.id)return;
 const key='localBusiness:v1:'+store.get('labId'),state=store.get(key);if(!state)return;
 const id=invoice.order_id||fallbackOrderId;
 const order=Object.values(state.orders||{}).find(row=>row.id===id||row.serverId===id);if(!order)return;
 Object.assign(order,{invoice_id:invoice.id,invoice_number:invoice.number??order.invoice_number,invoice_total:invoice.total??order.invoice_total,invoice_issued_at:invoice.issued_at||order.invoice_issued_at,invoice_pdf_ready:typeof invoice.pdf_ready==='boolean'?invoice.pdf_ready:order.invoice_pdf_ready});
 store.set(key,state);
}
module.exports={rememberRemoteInvoice};
