// Derive the workflow from actual file metadata, never from a client-supplied flag or price.
export function noPrintOrderSql(alias='o'){
 if(!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(alias))throw Error('invalid_order_alias');
 const where=`f.order_id=${alias}.id AND f.lab_id=${alias}.lab_id AND f.original_state<>'deleted'`;
 return `(${alias}.mode='print' AND EXISTS(SELECT 1 FROM order_files f WHERE ${where}) AND NOT EXISTS(SELECT 1 FROM order_files f WHERE ${where} AND (COALESCE(f.print_type,'')<>'none' OR NOT (COALESCE(f.chassis,false) OR COALESCE(f.frame,false)))))`;
}
export async function isNoPrintOrder(db,labId,orderId){
 const q=await db.query(`SELECT ${noPrintOrderSql('o')} no_print_order FROM orders o WHERE o.id=$1 AND o.lab_id=$2`,[orderId,labId]);
 return q.rows[0]?.no_print_order===true;
}
export function noPrintStage(status){
 if(status==='downloaded')return {status:'received'}; // A legacy job-card download is receipt of goods, not a print stage.
 if(['printing','reviewing','needs_fix','ready_print','printed','ready'].includes(status))return {error:'no_print_order_stage',message:'این سفارش فقط شاسی یا قاب است و مرحله چاپ ندارد؛ از بسته‌بندی و تحویل استفاده کنید.'};
 return {status};
}
export function productInvoiceRequired(order={}){
 if(order.invoice_required!==false)return true;
 const kind=String(order.customer_kind||'').toLowerCase();
 if(kind==='customer')return true;if(kind==='coworker')return false;
 return ['walkin','manual_invoice'].includes(String(order.source||order.order_source||''))||Boolean(String(order.walkin_customer_name||'').trim());
}
