// R1752: edit ONLY the current lab's pending invitation display name.
// Never modify global users / photographer profiles or the receivables ledger.
export async function updatePendingLabCustomerName({pool,crypto,labId,userId,actorId,name}){
  const clean=String(name??'').trim().replace(/\s+/g,' ');
  if(!clean||clean.length>140)return {ok:false,status:400,error:'invalid_temporary_name'};
  const c=await pool.connect();
  try{
    await c.query('BEGIN');
    // A suspended registered photographer is NOT a preregistered customer.
    const member=await c.query(`SELECT u.mobile FROM lab_memberships m
      JOIN users u ON u.id=m.user_id
      LEFT JOIN photographer_profiles pp ON pp.user_id=u.id
      WHERE m.lab_id=$1 AND m.user_id=$2 AND m.role='customer'
      AND m.active=false AND COALESCE(u.photographer_enabled,false)=false
      AND u.mobile_verified_at IS NULL AND pp.user_id IS NULL
      FOR UPDATE OF m`,[labId,userId]);
    if(!member.rowCount){
      await c.query('ROLLBACK');
      return {ok:false,status:409,error:'customer_not_preregistered'};
    }
    const mobile=String(member.rows[0].mobile||'').trim();
    if(!/^09\d{9}$/.test(mobile)){
      await c.query('ROLLBACK');
      return {ok:false,status:409,error:'preregistered_mobile_invalid'};
    }
    const changed=await c.query(`UPDATE invitations SET target_name=$3
      WHERE id=(SELECT i.id FROM invitations i
        WHERE i.lab_id=$1 AND i.target_mobile IS NOT NULL
        AND right(regexp_replace(i.target_mobile,'[^0-9]','','g'),10)=right(regexp_replace($2,'[^0-9]','','g'),10)
        AND i.active=true AND i.uses=0
        ORDER BY i.created_at DESC LIMIT 1)
      RETURNING id`,[labId,mobile,clean]);
    if(!changed.rowCount){
      // Do not dispatch an SMS: this is only a durable local pending name.
      await c.query(`INSERT INTO invitations
        (lab_id,token,created_by,target_mobile,target_name,max_uses,sms_status)
        VALUES($1,$2,$3,$4,$5,1,'not_sent')`,
        [labId,crypto.randomBytes(18).toString('base64url'),actorId,mobile,clean]);
    }
    await c.query('COMMIT');
    return {ok:true,name:clean};
  }catch(error){
    await c.query('ROLLBACK').catch(()=>{});
    throw error;
  }finally{c.release();}
}
