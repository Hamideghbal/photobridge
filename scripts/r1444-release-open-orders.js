async function pb1444ReleaseOpenOrders(c,labId,customerId,actorId){
 const eligible=await c.query(`SELECT o.* FROM orders o WHERE o.lab_id=$1 AND o.customer_id=$2 AND o.settlement_mode='prepaid'
   AND o.status=ANY($3::text[]) AND COALESCE(o.payment_status,'not_required') NOT IN ('paid','receipt_pending')
   AND NOT EXISTS(SELECT 1 FROM order_payment_receipts r WHERE r.order_id=o.id AND r.status IN ('uploading','pending','approved'))
   ORDER BY o.id FOR UPDATE OF o`,[labId,customerId,['draft','awaiting_payment','sent','received','downloaded','printing','reviewing','needs_fix','ready_print','printed','ready']]);
 const released=[];
 for(const previous of eligible.rows){
  const result=await c.query(`UPDATE orders SET settlement_mode='ledger',payment_status='not_required',status=CASE WHEN status='awaiting_payment' THEN 'sent' ELSE status END,updated_at=now() WHERE id=$1 AND lab_id=$2 AND customer_id=$3 AND settlement_mode='prepaid' AND COALESCE(payment_status,'not_required') NOT IN ('paid','receipt_pending') RETURNING *`,[previous.id,labId,customerId]);
  const order=result.rows[0];if(!order)continue;
  if(previous.status==='awaiting_payment')await statusEvent(c,order,'sent',actorId,'الزام پرداخت قبل از چاپ با تغییر روش تسویه عکاسی به حساب دفتری برداشته شد.');
  released.push(order);
 }
 return released;
}
