// Lab-scoped shared read cursors. Existing settings storage; no schema changes.
export async function labChatRead(pool,labId,userId,body=null){
 const key='lab-chat-read:'+labId;
 if(body){
  const thread=String(body.thread||'');
  if(thread!=='platform'&&!/^[0-9a-f-]{36}$/i.test(thread))return {error:'invalid_thread'};
  const ids=(Array.isArray(body.ids)?body.ids:[]).filter(id=>/^[0-9a-f-]{36}$/i.test(String(id))).slice(0,500);
  if(ids.length){
   const q=thread==='platform'?await pool.query(`SELECT max(created_at) stamp FROM platform_chat_messages WHERE lab_id=$1 AND id=ANY($2::uuid[]) AND sender_id<>$3`,[labId,ids,userId]):await pool.query(`SELECT max(created_at) stamp FROM chat_messages WHERE lab_id=$1 AND id=ANY($2::uuid[]) AND sender_id<>$3 AND customer_id=$4`,[labId,ids,userId,thread]);
   const stamp=Date.parse(q.rows[0]?.stamp);if(Number.isFinite(stamp))await pool.query(`INSERT INTO platform_settings(key,value,updated_at) VALUES($1,jsonb_build_object($2::text,$3::bigint),now()) ON CONFLICT(key) DO UPDATE SET value=jsonb_set(platform_settings.value,ARRAY[$2::text],to_jsonb(GREATEST(COALESCE((platform_settings.value->>$2::text)::bigint,0),$3::bigint))),updated_at=now()`,[key,thread,stamp]);
  }
 }
 const q=await pool.query('SELECT value FROM platform_settings WHERE key=$1',[key]);return {ok:true,seen:q.rows[0]?.value||{}};
}
