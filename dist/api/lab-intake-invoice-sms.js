// A checked box records consent for this order; it never sends an older invoice or invitation.
export async function recordIntakeInvoiceSms(db,{labId,orderId,actorId,requested}){
 const q=await db.query(`INSERT INTO lab_intake_invoice_sms(order_id,lab_id,customer_id,requested_by,requested,status)
  SELECT o.id,o.lab_id,o.customer_id,$3,$4,CASE WHEN $4 THEN 'pending' ELSE 'not_requested' END
  FROM orders o JOIN lab_delegated_order_intakes d ON d.order_id=o.id AND d.lab_id=o.lab_id
  WHERE o.id=$1 AND o.lab_id=$2
  ON CONFLICT(order_id) DO NOTHING RETURNING order_id`,[orderId,labId,actorId,requested===true]);
 return q.rowCount>0;
}
export async function intakeInvoiceSmsState(pool,labId,orderId){
 const q=await pool.query('SELECT requested,status,invoice_id,error FROM lab_intake_invoice_sms WHERE order_id=$1 AND lab_id=$2',[orderId,labId]);
 const row=q.rows[0];return row?{requested:row.requested,status:row.status,invoiceId:row.invoice_id||null,error:row.error||null}:{requested:false,status:'not_requested'};
}
export async function dispatchIntakeInvoiceSms({pool,sendSms,normalizeMobile},labId,orderId){
 // The atomic claim is shared by request handlers and all server workers.
 // A crash/unknown provider outcome stays dispatching/failed, never silently resends.
 const q=await pool.query(`UPDATE lab_intake_invoice_sms AS pending SET status='dispatching',invoice_id=i.id,updated_at=now(),error=NULL
  FROM invoices i,orders o,users u,labs l
  WHERE pending.order_id=$1 AND pending.lab_id=$2 AND pending.requested=true AND pending.status='pending'
   AND o.id=pending.order_id AND o.lab_id=pending.lab_id AND o.customer_id=pending.customer_id AND o.status NOT IN ('uploading','cancelled')
   AND i.order_id=o.id AND i.lab_id=o.lab_id AND i.customer_id=o.customer_id
   AND u.id=o.customer_id AND l.id=o.lab_id
  RETURNING pending.order_id,pending.customer_id,i.id AS invoice_id,i.number AS invoice_number,i.total,
   o.number AS order_number,o.mode,u.mobile,l.name AS lab_name,l.sms_customer_notifications_allowed`,[orderId,labId]);
 const row=q.rows[0];if(!row)return intakeInvoiceSmsState(pool,labId,orderId);
 try{
  if(row.sms_customer_notifications_allowed!==true)throw Error('lab_sms_disabled');
  const mobile=normalizeMobile(row.mobile);if(!/^09\d{9}$/.test(mobile))throw Error('invalid_sms_mobile');
  const money=Number(row.total||0).toLocaleString('fa-IR');
  const message=`PhotoBridge\nلابراتوار ${row.lab_name}\nفاکتور شماره ${row.invoice_number}\nسفارش ${row.mode==='album'?'آلبوم':'چاپ'} #${row.order_number}\nمبلغ: ${money} تومان`;
  const result=await sendSms({mobile,message,purpose:'lab_intake_invoice',eventKey:'intake_invoice',userId:row.customer_id,labId,chargeLabId:labId,serviceKey:'sms_customer_notification',metadata:{orderId,invoiceId:row.invoice_id,orderNumber:row.order_number}});
  await pool.query("UPDATE lab_intake_invoice_sms SET status='sent',sms_reference=$3,sent_at=now(),updated_at=now() WHERE order_id=$1 AND lab_id=$2 AND status='dispatching'",[orderId,labId,String(result?.reference||'')||null]);
 }catch(e){await pool.query("UPDATE lab_intake_invoice_sms SET status='failed',error=$3,updated_at=now() WHERE order_id=$1 AND lab_id=$2 AND status='dispatching'",[orderId,labId,String(e?.message||'sms_send_failed').slice(0,500)]);}
 return intakeInvoiceSmsState(pool,labId,orderId);
}
export async function flushIntakeInvoiceSms(deps){
 const q=await deps.pool.query(`SELECT s.lab_id,s.order_id FROM lab_intake_invoice_sms s JOIN orders o ON o.id=s.order_id AND o.lab_id=s.lab_id AND o.customer_id=s.customer_id
  WHERE o.status NOT IN ('uploading','cancelled') AND s.requested=true AND s.status='pending' AND EXISTS(SELECT 1 FROM invoices i WHERE i.order_id=s.order_id AND i.lab_id=s.lab_id AND i.customer_id=s.customer_id)
  ORDER BY s.created_at LIMIT 20`);
 for(const row of q.rows)await dispatchIntakeInvoiceSms(deps,row.lab_id,row.order_id);
}
export function startIntakeInvoiceSmsWorker(deps){
 let running=false;const tick=async()=>{if(running)return;running=true;try{await flushIntakeInvoiceSms(deps)}catch(e){console.error('[intake-invoice-sms]',String(e?.message||e))}finally{running=false}};
 void tick();const timer=setInterval(()=>void tick(),30000);timer.unref?.();return ()=>clearInterval(timer);
}
