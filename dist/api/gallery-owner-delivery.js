// Gallery owner delivery is persisted in the existing notification metadata.
export const GALLERY_OWNER_EVENTS = ['client_gallery_finalized','client_gallery_approved'];
export async function acknowledgeGalleryDelivery(pool,userId,notificationId){
 const q=await pool.query(`UPDATE system_notifications SET metadata=jsonb_set(COALESCE(metadata,'{}'::jsonb),'{galleryDelivery}',COALESCE(metadata->'galleryDelivery','{}'::jsonb)||jsonb_build_object('state','delivered','deliveredAt',now())) WHERE id=$1 AND recipient_user_id=$2 AND event_key=ANY($3::text[]) AND metadata#>>'{galleryDelivery,state}'='waiting' RETURNING id`,[notificationId,userId,GALLERY_OWNER_EVENTS]);
 return Boolean(q.rows.length);
}
export async function queueGalleryOwnerNotification({pool,ownerId,event,copy,data,labId,push}){
 if(!GALLERY_OWNER_EVENTS.includes(event))throw Error('invalid_gallery_owner_event');
 const metadata={...data,labId:labId||undefined,galleryDelivery:{state:'waiting',dueAt:new Date(Date.now()+60000).toISOString()}};
 const q=await pool.query(`INSERT INTO system_notifications(recipient_user_id,event_key,title,message,metadata) VALUES($1,$2,$3,$4,$5::jsonb) RETURNING *`,[ownerId,event,copy.title,copy.message,JSON.stringify(metadata)]);
 const row=q.rows[0];if(!row)throw Error('gallery_notification_not_saved');
 const result=await push('customer',ownerId,row,event,metadata);
 if(!result?.accepted)await pool.query(`UPDATE system_notifications SET metadata=jsonb_set(metadata,'{galleryDelivery,dueAt}',to_jsonb(now())) WHERE id=$1 AND metadata#>>'{galleryDelivery,state}'='waiting'`,[row.id]);
 return row;
}
export async function deliverGallerySmsFallbacks({pool,sendSms}){
 // Claim one durable job atomically across server instances. A send with an
 // ambiguous provider result is not retried automatically (avoid duplicate SMS).
 for(let i=0;i<20;i++){
  const q=await pool.query(`UPDATE system_notifications SET metadata=jsonb_set(metadata,'{galleryDelivery,state}','"sms_sending"'::jsonb) WHERE id=(SELECT id FROM system_notifications WHERE event_key=ANY($1::text[]) AND read_at IS NULL AND metadata#>>'{galleryDelivery,state}'='waiting' AND (metadata#>>'{galleryDelivery,dueAt}')::timestamptz<=now() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`,[GALLERY_OWNER_EVENTS]);
  const row=q.rows[0];if(!row)return;
  try{
   const user=await pool.query('SELECT mobile FROM users WHERE id=$1 LIMIT 1',[row.recipient_user_id]);
   const result=await sendSms({mobile:user.rows[0]?.mobile,message:`PhotoBridge\n${row.message}\nگالری: https://photobridge.ir/photographer/gallery`,purpose:'gallery_owner_notification',eventKey:row.event_key,userId:row.recipient_user_id,referenceId:row.id,metadata:{galleryId:row.metadata?.galleryId,notificationId:row.id,fallback:true}});
   await pool.query(`UPDATE system_notifications SET metadata=jsonb_set(metadata,'{galleryDelivery,state}',$2::jsonb) WHERE id=$1`,[row.id,JSON.stringify(result?.skipped?'sms_disabled':'sms_sent')]);
  }catch(error){
   await pool.query(`UPDATE system_notifications SET metadata=jsonb_set(metadata,'{galleryDelivery}',COALESCE(metadata->'galleryDelivery','{}'::jsonb)||$2::jsonb) WHERE id=$1`,[row.id,JSON.stringify({state:'sms_failed',error:String(error?.message||error).slice(0,180)})]);
   console.warn('[gallery-owner-sms]',row.id,String(error?.message||error));
  }
 }
}
