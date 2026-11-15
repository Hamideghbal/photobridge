// Administrator error follow-up. Existing telemetry and SMS log only; no migrations.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail=(code,status=400)=>Object.assign(new Error(code),{status});
export const resolutionDefault='همکار گرامی، بابت اختلال پیش‌آمده در ارسال عکس‌ها پوزش می‌خواهیم. مشکل برطرف شده است؛ لطفاً ارسال را دوباره امتحان کنید. با سپاس، پشتیبانی PhotoBridge';
// Group by order when known; a browser telemetry session may contain several orders.
export const dailyBatchesSql=`
WITH failed AS (
 SELECT s.lab_id,s.photographer_id,COALESCE(orig.order_id::text,s.order_id::text,'session:'||s.id::text) AS batch_key,
 min(e.received_at) AS first_at,max(e.received_at) AS last_at,count(*)::int AS error_events,
 count(DISTINCT e.file_id)::int AS affected_files,array_agg(DISTINCT e.category) AS categories,
 array_agg(DISTINCT s.id) AS session_ids,max(COALESCE(orig.order_id::text,s.order_id::text)) AS order_id
 FROM upload_health_timeline_events e JOIN upload_health_sessions s ON s.id=e.session_id
 LEFT JOIN upload_health_files hf ON hf.id=e.file_id AND hf.session_id=s.id
 LEFT JOIN order_files orig ON orig.id=hf.server_file_id AND orig.lab_id=s.lab_id AND orig.customer_id=s.photographer_id
 WHERE e.state='failed' AND e.received_at>=($1::date::timestamp AT TIME ZONE 'Asia/Tehran')
 AND e.received_at<(($1::date+1)::timestamp AT TIME ZONE 'Asia/Tehran')
 AND ($2::text IS NULL OR s.lab_id::text=$2) AND ($3::text IS NULL OR s.photographer_id::text=$3)
 GROUP BY s.lab_id,s.photographer_id,COALESCE(orig.order_id::text,s.order_id::text,'session:'||s.id::text)
)
SELECT b.batch_key,b.first_at,b.last_at,b.error_events,b.affected_files,b.categories,
 b.lab_id::text AS lab_id,l.name AS lab_name,b.photographer_id::text AS photographer_id,
 COALESCE(NULLIF(pp.studio_name,''),u.name,'نامشخص') AS photographer_name,
 b.order_id,o.number AS order_number,o.status AS order_status,
 stats.recorded_files,stats.verified_files,count(*) OVER()::int AS total_rows
FROM failed b LEFT JOIN labs l ON l.id=b.lab_id LEFT JOIN users u ON u.id=b.photographer_id
LEFT JOIN photographer_profiles pp ON pp.user_id=u.id
LEFT JOIN orders o ON o.id::text=b.order_id AND o.lab_id=b.lab_id AND o.customer_id=b.photographer_id
LEFT JOIN LATERAL (
 SELECT count(*)::int AS recorded_files,count(*) FILTER(WHERE originals.verified)::int AS verified_files FROM (
 SELECT orig.id::text AS id,orig.original_state='active' AS verified FROM order_files orig
 WHERE orig.order_id::text=b.order_id AND orig.lab_id=b.lab_id AND orig.customer_id=b.photographer_id
 AND orig.original_state<>'deleted'
 UNION
 SELECT COALESCE(f.server_file_id::text,f.id::text) AS id,false AS verified
 FROM upload_health_files f WHERE f.session_id=ANY(b.session_ids)
 AND NOT EXISTS(SELECT 1 FROM order_files orig WHERE orig.id=f.server_file_id)
 ) originals
) stats ON true
ORDER BY b.last_at DESC,b.batch_key LIMIT $4 OFFSET $5`;
export const labContactSql=`SELECT u.id,u.name,u.mobile FROM lab_memberships m JOIN users u ON u.id=m.user_id
WHERE m.lab_id=$1 AND m.role='lab_admin' AND m.active=true AND u.active=true
AND u.mobile IS NOT NULL AND u.mobile<>'' ORDER BY m.created_at,u.id LIMIT 1`;
export async function errorContact(pool,{labId,photographerId,target}){
 if(!UUID.test(labId||'')||!['lab','photographer'].includes(target)||target==='photographer'&&!UUID.test(photographerId||''))throw fail('invalid_recipient');
 const q=target==='lab'?await pool.query(labContactSql,[labId]):await pool.query(`SELECT u.id,u.name,u.mobile FROM users u
 WHERE u.id=$1 AND u.active=true AND EXISTS(SELECT 1 FROM upload_health_sessions s WHERE s.lab_id=$2 AND s.photographer_id=u.id)
 OR u.id=$1 AND u.active=true AND EXISTS(SELECT 1 FROM application_error_incidents i
 LEFT JOIN order_files f ON f.id::text=i.payload->>'fileId'
 AND (NULLIF(i.payload->>'labId','') IS NULL OR f.lab_id::text=i.payload->>'labId')
 WHERE COALESCE(NULLIF(i.payload->>'photographerId',''),f.customer_id::text)=u.id::text
 AND COALESCE(NULLIF(i.payload->>'labId',''),f.lab_id::text)=$2::text)`,[photographerId,labId]);
 const r=q.rows[0];if(!r)throw fail('recipient_unavailable',404);return r;
}
export async function sendErrorResolution({pool,sendSms,normalizeMobile,actorId,input}){
 const {labId,photographerId,target,requestId}=input;
 if(!UUID.test(requestId||''))throw fail('invalid_request_id');
 const message=typeof input.message==='string'?input.message.trim():'';
 if(!message||message.length>700)throw fail('invalid_message');
 const contact=await errorContact(pool,{labId,photographerId,target}),mobile=normalizeMobile(contact.mobile||'');
 if(!/^09\d{9}$/.test(mobile))throw fail('recipient_mobile_unavailable');
 const client=await pool.connect();let claim;
 try{
  await client.query('BEGIN');
  // Cross-process serialization; reservation commits BEFORE contacting the provider.
  await client.query("SELECT pg_advisory_xact_lock(hashtext('error-resolution-sms'))");
  const old=await client.query("SELECT id,status,error_code,provider_reference,metadata FROM sms_delivery_log WHERE purpose='error_resolution_claim' AND metadata->>'requestId'=$1 LIMIT 1",[requestId]);
  if(old.rowCount){const r=old.rows[0];if(r.metadata.recipientId!==contact.id||r.metadata.message!==message||r.metadata.labId!==labId||r.metadata.actorId!==actorId)throw fail('request_conflict',409);await client.query('COMMIT');return {ok:r.status==='sent',state:r.status==='sent'?'accepted':'needs_attention',replay:true,reference:r.provider_reference||null};}
  const recent=await client.query("SELECT 1 FROM sms_delivery_log WHERE purpose='error_resolution_claim' AND target_mobile=$1 AND created_at>now()-interval '5 minutes' LIMIT 1",[mobile]);
  if(recent.rowCount)throw fail('recipient_rate_limited',429);
  const budget=await client.query("SELECT count(*)::int AS n FROM sms_delivery_log WHERE purpose='error_resolution_claim' AND user_id=$1 AND created_at>now()-interval '1 hour'",[actorId]);
  if(budget.rows[0].n>=20)throw fail('followup_rate_limited',429);
  claim=(await client.query(`INSERT INTO sms_delivery_log(provider,purpose,event_key,target_mobile,user_id,lab_id,status,error_code,metadata)
 VALUES('pending','error_resolution_claim','error_resolution',$1,$2,$3,'skipped','pending',$4::jsonb) RETURNING id`,[mobile,actorId,labId,JSON.stringify({requestId,recipientId:contact.id,actorId,labId,message})])).rows[0].id;
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
 try{
  // Same existing administrator send pipeline; no customer/laboratory wallet charge.
  const out=await sendSms({mobile,message,purpose:'error_resolution',eventKey:'manual_followup',userId:actorId,labId,referenceId:requestId,metadata:{requestId,recipientId:contact.id}});
  await pool.query("UPDATE sms_delivery_log SET status='sent',error_code=NULL,provider_reference=$2 WHERE id=$1",[claim,out?.reference||null]);
  return {ok:true,state:'accepted',reference:out?.reference||null};
 }catch(e){
  // A timeout may have occurred AFTER acceptance. Never automatically send twice.
  await pool.query("UPDATE sms_delivery_log SET status='failed',error_code='delivery_unconfirmed' WHERE id=$1",[claim]).catch(()=>{});
  throw fail('delivery_unconfirmed',502);
 }
}
