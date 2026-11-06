/* R1646: change a photographer's settlement DEFAULT in this lab and release
 * only eligible unpaid waiting orders. Accounting entries are NEVER zeroed,
 * refunded, deleted or rewritten. In-flight/pending receipts stay reviewable.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const refundableStatuses=new Set(['uploading','pending','approved']);
const cancellablePayments=new Set(['pricing_required','awaiting_receipt','receipt_rejected']);
export function photographerLedgerOrderEligibility(order,receiptStatus,hasPayments){
 if(!order||order.settlement_mode!=='prepaid'||order.status!=='awaiting_payment'
   ||order.downloaded_at||order.printed_at)return {eligible:false,reason:'not_pending'};
 if(order.payment_status==='paid'||hasPayments||receiptStatus==='approved')return {eligible:false,reason:'payment_recorded'};
 if(receiptStatus==='pending'||receiptStatus==='uploading'||order.payment_status==='receipt_pending')
  return {eligible:false,reason:'receipt_needs_review'};
 if(!cancellablePayments.has(String(order.payment_status||'')))return {eligible:false,reason:'payment_state'};
 return {eligible:true};
}
export async function handleLabPhotographerLedger({req,url,res,pool,labId,a,bodyJson,sendJson,statusEvent,audit,publishCustomerEvent,publishLabEvent}){
 const route=url.pathname.match(/^\/api\/lab\/orders\/([0-9a-f-]+)\/photographer-ledger$/);
 if(!route)return false;
 if(req.method!=='POST'){sendJson(res,405,{error:'method_not_allowed'});return true;}
 if(!UUID.test(route[1])){sendJson(res,400,{error:'invalid_order_id'});return true;}
 const body=await bodyJson(req);
 if(body?.settlementMode!=='ledger'){sendJson(res,400,{error:'invalid_settlement_mode'});return true;}
 let account=null,wasLedger=false,released=[],skipped=[],customerId=null,reference=null;
 const db=await pool.connect();
 try{
  await db.query('BEGIN');
  // First resolve the customer without locking an order; lock the membership
  // before ALL related orders to serialize concurrent account conversions.
  const selected=await db.query('SELECT id,customer_id,number FROM orders WHERE id=$1 AND lab_id=$2',[route[1],labId]);
  if(!selected.rowCount){
   await db.query('ROLLBACK');sendJson(res,404,{error:'order_not_found'});return true;
  }
  reference=selected.rows[0];customerId=reference.customer_id;
  const member=await db.query(`SELECT * FROM lab_memberships
    WHERE lab_id=$1 AND user_id=$2 AND role='customer' FOR UPDATE`,[labId,customerId]);
  if(!member.rowCount){
   await db.query('ROLLBACK');sendJson(res,409,{error:'photographer_not_linked',
    message:'حساب این عکاسی در لابراتوار پیدا نشد.'});return true;
  }
  wasLedger=String(member.rows[0].settlement_mode||'ledger')==='ledger';
  // Do not change the photographer's terms in any other laboratory.
  const mq=await db.query(`UPDATE lab_memberships SET settlement_mode='ledger'
    WHERE lab_id=$1 AND user_id=$2 AND role='customer' RETURNING *`,[labId,customerId]);
  account=mq.rows[0];
  const candidates=await db.query(`SELECT * FROM orders
    WHERE lab_id=$1 AND customer_id=$2 AND settlement_mode='prepaid'
      AND status='awaiting_payment' AND downloaded_at IS NULL AND printed_at IS NULL
    ORDER BY id FOR UPDATE`,[labId,customerId]);
  const ids=candidates.rows.map(row=>row.id);
  let receiptMap=new Map(),hasPayment=new Set();
  if(ids.length){
   const receipts=await db.query(`SELECT order_id,status FROM order_payment_receipts
     WHERE lab_id=$1 AND order_id=ANY($2::uuid[]) FOR UPDATE`,[labId,ids]);
   receiptMap=new Map(receipts.rows.map(r=>[String(r.order_id),String(r.status||'')]));
   const paid=await db.query(`SELECT i.order_id FROM invoices i
     JOIN finance_payments p ON p.invoice_id=i.id
     WHERE i.lab_id=$1 AND i.order_id=ANY($2::uuid[])
     GROUP BY i.order_id`,[labId,ids]);
   hasPayment=new Set(paid.rows.map(r=>String(r.order_id)));
  }
  for(const old of candidates.rows){
   const receipt=receiptMap.get(String(old.id))||'';
   const decision=photographerLedgerOrderEligibility(old,receipt,hasPayment.has(String(old.id)));
   if(!decision.eligible){skipped.push({id:old.id,number:old.number,reason:decision.reason});continue;}
   // Repeat the financial checks inside UPDATE to protect against stale state.
   const changed=await db.query(`UPDATE orders SET
     settlement_mode='ledger',payment_status='not_required',status='sent',updated_at=now()
     WHERE id=$1 AND lab_id=$2 AND customer_id=$3 AND settlement_mode='prepaid'
       AND status='awaiting_payment' AND downloaded_at IS NULL AND printed_at IS NULL
       AND payment_status IN ('pricing_required','awaiting_receipt','receipt_rejected')
       AND NOT EXISTS (SELECT 1 FROM order_payment_receipts r
         WHERE r.order_id=orders.id AND r.lab_id=orders.lab_id
           AND r.status IN ('uploading','pending','approved'))
       AND NOT EXISTS (SELECT 1 FROM invoices i JOIN finance_payments p ON p.invoice_id=i.id
         WHERE i.order_id=orders.id AND i.lab_id=orders.lab_id)
     RETURNING *`,[old.id,labId,customerId]);
   if(!changed.rowCount){skipped.push({id:old.id,number:old.number,reason:'state_changed'});continue;}
   const fresh=changed.rows[0];released.push(fresh);
   await statusEvent(db,fresh,'sent',a.userId,
    'حساب عکاسی در این لابراتوار دفتری شد؛ سفارش بدون ثبت پرداخت جدید آزاد شد.');
  }
  await db.query('COMMIT');
 }catch(error){await db.query('ROLLBACK').catch(()=>{});throw error}
 finally{db.release()}
 const pendingReceipt=skipped.filter(row=>row.reason==='receipt_needs_review').length;
 await audit(a.userId,labId,'customer.settlement_mode_ledger_from_order','user',customerId,
  {sourceOrderId:reference.id,wasLedger,releasedOrderIds:released.map(o=>o.id),
   skippedOrders:skipped,scope:'one_lab_membership',invoiceOrPaymentMutations:false}).catch(()=>{});
 try{
  publishCustomerEvent(labId,String(customerId),'settlement_mode_changed',
   {customerId,settlementMode:'ledger',labId,releasedOrderIds:released.map(o=>o.id)});
  for(const item of released)
   publishCustomerEvent(labId,String(customerId),'order_status',
    {orderId:item.id,number:item.number,status:'sent',settlementMode:'ledger',updatedAt:item.updated_at,
     note:'حساب عکاسی به دفتری تغییر کرد؛ سفارش در صف دریافت لابراتوار قرار گرفت.'});
  publishLabEvent(labId,'photographer_settlement_changed',
   {customerId,sourceOrderId:reference.id,settlementMode:'ledger',releasedCount:released.length,pendingReceipt});
 }catch{}
 sendJson(res,200,{ok:true,customerId,settlementMode:'ledger',membership:account,
  releasedCount:released.length,releasedOrderIds:released.map(o=>o.id),
  pendingReceiptCount:pendingReceipt,skippedCount:skipped.length,
  unchanged:wasLedger&&released.length===0,
  message:pendingReceipt
   ?'حساب عکاسی دفتری شد. سفارش‌های دارای رسید در انتظار بررسی، تا تعیین تکلیف رسید آزاد نمی‌شوند.'
   :'حساب عکاسی در این لابراتوار دفتری شد. سفارش‌های بدون پرداخت معلق آزاد شدند.'});
 return true;
}
