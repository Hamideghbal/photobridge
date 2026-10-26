// A pending lab relationship never grants photographer login or activates membership.
export async function ensureLabInviteCustomer(deps,{labId,mobile,previousDebt=null,actorId}){
 const {pool,crypto,passwordHash,ensureFinanceAccounts,postBalancedFinanceTransaction}=deps;
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  // Use the same identity lock/order as verified signup; a simultaneous signup reuses this identity.
  await c.query('LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE');
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[labId,mobile]);
  const users=await c.query('SELECT id,name FROM users WHERE mobile=$1 FOR UPDATE',[mobile]);
  if(users.rowCount>1)throw Error('mobile_ambiguous');
  let customer=users.rows[0];
  if(!customer){const q=await c.query("INSERT INTO users(name,mobile,password_hash,platform_role,active) VALUES($1,$1,$2,'user',true) RETURNING id,name",[mobile,passwordHash(crypto.randomBytes(32).toString('hex'))]);customer=q.rows[0];}
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[labId,String(customer.id)]);
  const mq=await c.query('SELECT role,active FROM lab_memberships WHERE lab_id=$1 AND user_id=$2 FOR UPDATE',[labId,customer.id]);
  if(mq.rowCount&&mq.rows[0].role!=='customer')throw Error('mobile_is_lab_admin');
  const fresh=!mq.rowCount;
  if(fresh)await c.query("INSERT INTO lab_memberships(lab_id,user_id,role,active) VALUES($1,$2,'customer',false)",[labId,customer.id]);
  if(!mq.rows[0]?.active){
   const iq=await c.query('SELECT id FROM invitations WHERE lab_id=$1 AND target_mobile=$2 AND active=true AND uses=0 LIMIT 1',[labId,mobile]);
   if(!iq.rowCount)await c.query("INSERT INTO invitations(lab_id,token,created_by,target_mobile,target_name,max_uses,sms_status) VALUES($1,$2,$3,$4,$5,1,'not_sent')",[labId,crypto.randomBytes(18).toString('base64url'),actorId,mobile,customer.name===mobile?null:customer.name]);
  }
  const invoices=await c.query('SELECT 1 FROM invoices WHERE lab_id=$1 AND customer_id=$2 LIMIT 1',[labId,customer.id]);
  if(!invoices.rowCount){
   // Only the first relationship imports the invitation amount. Resending must never overwrite edits.
   const prior=await c.query("SELECT 1 FROM finance_transactions t JOIN finance_entries e ON e.transaction_id=t.id WHERE t.lab_id=$1 AND e.customer_id=$2 LIMIT 1",[labId,customer.id]);
   if(fresh&&!prior.rowCount&&previousDebt>0){
    await ensureFinanceAccounts(c,labId);
    await postBalancedFinanceTransaction(c,{labId,actorId,referenceType:'lab_delegated_opening_debt',referenceId:customer.id,description:'بدهی اولیه دعوت عکاس',lines:[{accountKey:'receivable',customerId:customer.id,debit:previousDebt},{accountKey:'opening_balance_equity',customerId:customer.id,credit:previousDebt}]});
   }
   // The ledger is now authoritative. Signup must not apply the stale SMS amount again.
   await c.query('UPDATE invitations SET accounting_opening_balance=0 WHERE lab_id=$1 AND target_mobile=$2 AND uses=0',[labId,mobile]);
   await c.query('UPDATE photographer_invite_sms_links SET previous_debt=NULL WHERE lab_id=$1 AND mobile=$2',[labId,mobile]);
  }
  await c.query('COMMIT');return {...customer,mobile,registrationPending:!mq.rows[0]?.active};
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}
}
export async function reconcileLabInviteCustomers(deps,{labId,actorId}){
 // Repair historical successful SMS invitations that predate durable pending relationships.
 const q=await deps.pool.query(`SELECT DISTINCT ON (link.mobile) link.mobile,link.previous_debt FROM (
   SELECT mobile,previous_debt,last_sent_at,created_at FROM photographer_invite_sms_links WHERE lab_id=$1 AND last_sent_at IS NOT NULL
   UNION ALL SELECT target_mobile,accounting_opening_balance,sms_sent_at,created_at FROM invitations WHERE lab_id=$1 AND sms_status='sent' AND target_mobile IS NOT NULL
  ) link WHERE NOT EXISTS(SELECT 1 FROM users u JOIN lab_memberships m ON m.user_id=u.id
   WHERE m.lab_id=$1 AND m.role='customer' AND u.mobile=link.mobile)
  ORDER BY link.mobile,link.last_sent_at DESC NULLS LAST,link.created_at DESC`,[labId]);
 for(const row of q.rows)await ensureLabInviteCustomer(deps,{labId,actorId,mobile:row.mobile,previousDebt:row.previous_debt==null?null:Number(row.previous_debt)});
}
