// R1643: A lab administrator may waive the pre-print payment requirement for
// ONE submitted order. Never alter the photographer's membership or finances.
export function ledgerOverrideEligibility(order){
 if(!order)return {ok:false,error:'not_found'};
 if(String(order.settlement_mode||'ledger')==='ledger')
  return {ok:true,alreadyLedger:true};
 if(String(order.settlement_mode)!=='prepaid')return {ok:false,error:'invalid_settlement_mode'};
 if(order.status!=='awaiting_payment'||order.downloaded_at||order.printed_at)
  return {ok:false,error:'order_not_awaiting_payment'};
 const payment=String(order.payment_status||'');
 if(payment==='paid')return {ok:false,error:'payment_already_recorded'};
 if(payment==='receipt_pending')return {ok:false,error:'receipt_review_required'};
 if(!['pricing_required','awaiting_receipt','receipt_rejected'].includes(payment))
  return {ok:false,error:'order_payment_state_changed'};
 return {ok:true};
}

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const messages={
 order_not_awaiting_payment:'فقط سفارش‌هایی که هنوز در انتظار تسویه و قبل از دانلود یا چاپ هستند قابل دفتری‌کردن‌اند.',
 payment_already_recorded:'برای این سفارش پرداخت ثبت شده است؛ ابتدا گردش مالی را بررسی کنید.',
 receipt_review_required:'رسید پرداخت در انتظار بررسی است؛ ابتدا رسید را تأیید یا رد کنید.',
 receipt_upload_in_progress:'ارسال رسید پرداخت در حال انجام است؛ ابتدا تکلیف رسید را مشخص کنید.',
 order_payment_state_changed:'وضعیت پرداخت سفارش تغییر کرده است؛ فهرست سفارش‌ها را به‌روز کنید.',
 order_has_payment:'این فاکتور قبلاً دریافت مالی دارد؛ تبدیل خودکار آن به حساب دفتری مجاز نیست.'
};

export async function handleLabLedgerOverride({req,url,res,pool,labId,a,bodyJson,sendJson,statusEvent,audit,publishCustomerEvent,publishLabEvent}){
 const match=url.pathname.match(/^\/api\/lab\/orders\/([0-9a-f-]+)\/settlement-mode$/);
 if(!match)return false;
 if(req.method!=='POST'){sendJson(res,405,{error:'method_not_allowed'});return true;}
 if(!uuid.test(match[1])){sendJson(res,400,{error:'invalid_order_id'});return true;}
 const body=await bodyJson(req);
 if(body?.settlementMode!=='ledger'){sendJson(res,400,{error:'invalid_settlement_mode'});return true;}
 const db=await pool.connect();
 let order=null,changed=false,priorPaymentStatus='';
 try{
  await db.query('BEGIN');
  const oq=await db.query('SELECT * FROM orders WHERE id=$1 AND lab_id=$2 FOR UPDATE',[match[1],labId]);
  if(!oq.rowCount){await db.query('ROLLBACK');sendJson(res,404,{error:'not_found'});return true;}
  const old=oq.rows[0],check=ledgerOverrideEligibility(old);
  if(!check.ok){
   await db.query('ROLLBACK');sendJson(res,409,{error:check.error,message:messages[check.error]||'این سفارش قابل تبدیل به حساب دفتری نیست.'});return true;
  }
  if(check.alreadyLedger){await db.query('COMMIT');sendJson(res,200,{ok:true,order:old,unchanged:true});return true;}
  // Even a stale payment_status cannot override a receipt or a financial payment.
  const receipts=await db.query('SELECT id,status FROM order_payment_receipts WHERE order_id=$1 AND lab_id=$2 FOR UPDATE',[old.id,labId]);
  if(receipts.rows.some(r=>['uploading','pending','approved'].includes(String(r.status)))){
   await db.query('ROLLBACK');
   const error=receipts.rows.some(r=>r.status==='approved')?'payment_already_recorded':receipts.rows.some(r=>r.status==='uploading')?'receipt_upload_in_progress':'receipt_review_required';
   sendJson(res,409,{error,message:messages[error]});return true;
  }
  const paid=await db.query(`SELECT count(*)::int count FROM finance_payments p
    JOIN invoices i ON i.id=p.invoice_id WHERE i.order_id=$1 AND i.lab_id=$2`,[old.id,labId]);
  if(Number(paid.rows[0]?.count||0)>0){
   await db.query('ROLLBACK');sendJson(res,409,{error:'order_has_payment',message:messages.order_has_payment});return true;
  }
  const changedRows=await db.query(`UPDATE orders
    SET settlement_mode='ledger',payment_status='not_required',status='sent',updated_at=now()
    WHERE id=$1 AND lab_id=$2 AND status='awaiting_payment' AND settlement_mode='prepaid'
      AND payment_status IN ('pricing_required','awaiting_receipt','receipt_rejected')
    RETURNING *`,[old.id,labId]);
  if(!changedRows.rowCount){await db.query('ROLLBACK');sendJson(res,409,{error:'order_payment_state_changed',message:messages.order_payment_state_changed});return true;}
  order=changedRows.rows[0];priorPaymentStatus=String(old.payment_status||'');changed=true;
  await statusEvent(db,order,'sent',a.userId,
    'روش تسویه این سفارش به حساب دفتری تغییر کرد؛ هیچ پرداخت، تخفیف یا تسویه‌ای ثبت نشده است.');
  await db.query('COMMIT');
 }catch(error){
  await db.query('ROLLBACK').catch(()=>{});
  throw error;
 }finally{db.release();}
 if(changed){
  await audit(a.userId,labId,'order.settlement_override_ledger','order',order.id,
    {from:'prepaid',to:'ledger',previousPaymentStatus:priorPaymentStatus,customerId:order.customer_id}).catch(()=>{});
  try{
   publishCustomerEvent(labId,String(order.customer_id),'order_status',
    {orderId:order.id,number:order.number,status:'sent',settlementMode:'ledger',note:'لابراتوار روش تسویه این سفارش را به حساب دفتری تغییر داد.',updatedAt:order.updated_at});
   publishLabEvent(labId,'order_settlement_changed',
    {orderId:order.id,number:order.number,customerId:order.customer_id,mode:order.mode,settlementMode:'ledger',status:'sent'});
  }catch{}
 }
 sendJson(res,200,{ok:true,order,unchanged:false,
  message:'سفارش به حساب دفتری تغییر کرد. مانده حساب و فاکتور بدون تغییر باقی ماند.'});
 return true;
}
