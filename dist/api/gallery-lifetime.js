// One expiry controls access, renewal and cleanup, including already-paid legacy renewals.
export function galleryExpirySql(alias='g') {
 const phone=value=>`right(regexp_replace(translate(coalesce(${value},''),'۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩','01234567890123456789'),'[^0-9]','','g'),10)`;
 const exempt=`EXISTS(SELECT 1 FROM users owner JOIN users admin ON ${phone('owner.mobile')}=${phone('admin.mobile')} WHERE owner.id=${alias}.owner_id AND owner.active=true AND admin.active=true AND admin.platform_role='platform_admin' AND length(${phone('admin.mobile')})=10)`;
 return `CASE WHEN ${exempt} THEN NULL::timestamptz ELSE GREATEST(COALESCE(${alias}.expires_at,${alias}.created_at+(COALESCE(${alias}.lifetime_days_snapshot,30)::int||' days')::interval),(SELECT max(gr.deadline_after) FROM photographer_gallery_renewals gr WHERE gr.gallery_id=${alias}.id)) END`;
}
export async function maintainGalleryLifetime(pool, deleteObject, push = async()=>{}) {
 const expiry=galleryExpirySql('g');
 const expired=await pool.query(`SELECT g.id FROM photographer_client_galleries g WHERE ${expiry}<=now() ORDER BY ${expiry} LIMIT 50`);
 for(const candidate of expired.rows){
  const db=await pool.connect();let keys=[];
  try{
   await db.query('BEGIN');
   // Renewal locks this same row. Recheck after locking, never delete a renewed gallery.
   const locked=await db.query(`SELECT g.id FROM photographer_client_galleries g WHERE g.id=$1 AND ${expiry}<=now() FOR UPDATE`,[candidate.id]);
   if(!locked.rowCount){await db.query('ROLLBACK');continue}
   const media=await db.query('SELECT object_key FROM photographer_gallery_media WHERE gallery_id=$1 UNION SELECT object_key FROM photographer_gallery_retouch_proofs WHERE gallery_id=$1',[candidate.id]);
   keys=media.rows.map(row=>row.object_key).filter(Boolean);
   await db.query('DELETE FROM photographer_gallery_order_items WHERE order_id IN (SELECT id FROM photographer_gallery_orders WHERE gallery_id=$1)',[candidate.id]);
   await db.query('DELETE FROM photographer_gallery_orders WHERE gallery_id=$1',[candidate.id]);
   await db.query('DELETE FROM photographer_client_galleries WHERE id=$1',[candidate.id]);
   await db.query('COMMIT');
  }catch(error){await db.query('ROLLBACK').catch(()=>{});throw error}finally{db.release()}
  await Promise.all(keys.map(key=>deleteObject(key).catch(()=>false)));
 }
 // A reminder per remaining-day bucket, starting seven days before expiry.
 const days=`ceil(extract(epoch FROM (${expiry}-now()))/86400)::int`;
 const pending=await pool.query(`SELECT g.id FROM photographer_client_galleries g WHERE ${expiry}>now() AND ${expiry}<=now()+interval '7 days' AND NOT EXISTS(SELECT 1 FROM system_notifications n WHERE n.recipient_user_id=g.owner_id AND n.event_key='gallery.expiring' AND n.metadata->>'galleryId'=g.id::text AND n.metadata->>'expiresAt'=(${expiry})::text AND n.metadata->>'days'=(${days})::text) ORDER BY ${expiry} LIMIT 50`);
 for(const candidate of pending.rows){
  const db=await pool.connect();let notice=null,owner;
  try{
   await db.query('BEGIN');
   const q=await db.query(`SELECT g.owner_id,g.title,${expiry}::text AS expiry_text,${days} AS days FROM photographer_client_galleries g WHERE g.id=$1 AND ${expiry}>now() AND ${expiry}<=now()+interval '7 days' FOR UPDATE`,[candidate.id]);
   const g=q.rows[0];if(!g){await db.query('ROLLBACK');continue}owner=g.owner_id;
   const metadata={galleryId:candidate.id,expiresAt:g.expiry_text,days:g.days,url:'/photographer/gallery'};
   const inserted=await db.query(`INSERT INTO system_notifications(recipient_user_id,event_key,title,message,metadata) SELECT $1,'gallery.expiring',$2,$3,$4::jsonb WHERE NOT EXISTS(SELECT 1 FROM system_notifications WHERE recipient_user_id=$1 AND event_key='gallery.expiring' AND metadata->>'galleryId'=$5 AND metadata->>'expiresAt'=$6 AND metadata->>'days'=$7) RETURNING *`,[owner,'مهلت گالری رو به پایان است',`از مهلت گالری «${g.title}» ${Number(g.days).toLocaleString('fa-IR')} روز باقی مانده است. برای نگهداری عکس‌ها، پیش از پایان مهلت گالری را تمدید کن.`,JSON.stringify(metadata),candidate.id,g.expiry_text,String(g.days)]);
   notice=inserted.rows[0]||null;await db.query('COMMIT');
  }catch(error){await db.query('ROLLBACK').catch(()=>{});throw error}finally{db.release()}
  if(notice)await push(owner,notice);
 }
}
