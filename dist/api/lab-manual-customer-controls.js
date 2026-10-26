// R1291: authenticated, lab-scoped customer ledger and manually requested invoice SMS.
const digits = s => String(s ?? '').replace(/[۰-۹]/g, x => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[٠-٩]/g, x => String('٠١٢٣٤٥٦٧٨٩'.indexOf(x)));
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const integer = x => { const n=Number(digits(x)); return Number.isSafeInteger(n) && Math.abs(n)<=1_000_000_000_000 ? n : null; };
const money = n => Number(n||0).toLocaleString('fa-IR');
async function readBalance(db, labId, customerId) {
  const r = await db.query(`SELECT COALESCE(SUM(e.debit-e.credit),0)::bigint AS balance,
    MAX(t.created_at) AS updated_at
    FROM finance_entries e
    JOIN finance_transactions t ON t.id=e.transaction_id AND t.lab_id=$1
    JOIN finance_accounts fa ON fa.id=e.account_id AND fa.lab_id=t.lab_id AND fa.system_key='receivable'
    WHERE e.customer_id=$2`,[labId,customerId]);
  return {balance:Number(r.rows[0]?.balance||0),balanceUpdatedAt:r.rows[0]?.updated_at||null};
}
async function readInitialDebt(db,labId,customerId){
 const result=await db.query(`SELECT COALESCE(SUM(e.debit-e.credit),0)::bigint AS initial_debt
    FROM finance_entries e
    JOIN finance_transactions t ON t.id=e.transaction_id AND t.lab_id=$1
    JOIN finance_accounts fa ON fa.id=e.account_id AND fa.lab_id=$1 AND fa.system_key='receivable'
    WHERE e.customer_id=$2 AND (
      (t.reference_type='lab_delegated_opening_debt' AND t.reference_id=$2)
      OR t.reference_type IN ('lab_manual_customer_initial_debt_adjustment','accounting_opening_balance_change')
    )`,[labId,customerId]);
 return Number(result.rows[0]?.initial_debt||0);
}

async function handleSelectedCustomerAccount(ctx){
 const {req,url,res,pool,labId,a,bodyJson,sendJson,crypto,requireLocalIntakePrimary,
  ensureFinanceAccounts,postBalancedFinanceTransaction,audit}=ctx;
 const match=url.pathname.match(/^\/api\/lab\/delegated-customers\/([0-9a-f-]{36})\/(account-summary|adjust-initial-debt)$/i);
 if(!match||!['GET','POST'].includes(req.method))return false;
 const customerId=match[1],action=match[2];
 if(!idPattern.test(customerId)||action==='account-summary'&&req.method!=='GET'||action==='adjust-initial-debt'&&req.method!=='POST'){
  sendJson(res,400,{error:'invalid_customer_account_request'});return true;
 }
 if(a?.labRole!=='lab_admin'||a.labId!==labId){sendJson(res,403,{error:'forbidden'});return true;}
 const member=await pool.query("SELECT active FROM lab_memberships WHERE lab_id=$1 AND user_id=$2 AND role='customer'",[labId,customerId]);
 if(!member.rowCount){sendJson(res,404,{error:'lab_customer_not_found'});return true;}
 if(action==='account-summary'){
  const [balance,initialDebt,invoiceQ,settings]=await Promise.all([
   readBalance(pool,labId,customerId),readInitialDebt(pool,labId,customerId),
   pool.query(`SELECT id,number,total,issued_at FROM invoices
      WHERE lab_id=$1 AND customer_id=$2 ORDER BY issued_at DESC,id DESC LIMIT 5`,[labId,customerId]),
   pool.query(`SELECT sms_customer_notifications_allowed AS sms_enabled
      FROM labs WHERE id=$1`,[labId])
  ]);
  const invoices=invoiceQ.rows.map(r=>({id:r.id,number:r.number,total:Number(r.total),issuedAt:r.issued_at}));
  sendJson(res,200,{ok:true,...balance,initialDebt,
   invoices,hasInvoice:invoices.length>0,
   canEditInitialDebt:invoices.length===0,
   smsEnabled:Boolean(settings.rows[0]?.sms_enabled)});
  return true;
 }
 const body=await bodyJson(req),target=integer(body.initialDebt),expected=integer(body.expectedInitialDebt);
 const note=String(body.note||'').trim()||'اصلاح بدهی اولیه';
 if(target===null||target<0||expected===null||expected<0||note.length>500){
  sendJson(res,400,{error:'invalid_initial_debt_correction'});return true;
 }
 const client=await pool.connect();let result;
 try{
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[labId,customerId]);
  const membership=await client.query("SELECT active FROM lab_memberships WHERE lab_id=$1 AND user_id=$2 AND role='customer' FOR UPDATE",[labId,customerId]);
  if(!membership.rowCount){
   await client.query('ROLLBACK');sendJson(res,404,{error:'lab_customer_not_found'});return true;
  }
  // Never change the opening amount once even one invoice has been issued.
  const invoiced=await client.query('SELECT 1 FROM invoices WHERE lab_id=$1 AND customer_id=$2 LIMIT 1',[labId,customerId]);
  if(invoiced.rowCount){
   await client.query('ROLLBACK');sendJson(res,409,{error:'initial_debt_locked_after_invoice'});return true;
  }
  const current=await readInitialDebt(client,labId,customerId);
  if(current!==expected){
   await client.query('ROLLBACK');sendJson(res,409,{error:'initial_debt_changed',initialDebt:current});return true;
  }
  const delta=target-current;
  if(delta){
   await ensureFinanceAccounts(client,labId);
   const lines=delta>0
    ? [{accountKey:'receivable',customerId,debit:delta,note},{accountKey:'opening_balance_equity',customerId,credit:delta,note}]
    : [{accountKey:'receivable',customerId,credit:-delta,note},{accountKey:'opening_balance_equity',customerId,debit:-delta,note}];
   await postBalancedFinanceTransaction(client,{labId,actorId:a.userId,
    referenceType:'lab_manual_customer_initial_debt_adjustment',referenceId:crypto.randomUUID(),
    description:'اصلاح بدهی اولیه مشتری حضوری: '+note,lines});
  }
  const balance=await readBalance(client,labId,customerId);
  result={ok:true,initialDebt:target,...balance};
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}
 finally{client.release();}
 await audit(a.userId,labId,'lab_customer.initial_debt_correction','user',customerId,
  {from:expected,to:target,note}).catch(()=>{});
 sendJson(res,200,result);return true;
}

export async function handleLabManualCustomerAccounts(ctx) {
  const {req,url,res,pool,labId,a,bodyJson,sendJson,crypto,sendSms,
    ensureFinanceAccounts,postBalancedFinanceTransaction,requireLocalIntakePrimary,audit}=ctx;
  if(await handleSelectedCustomerAccount(ctx))return true;
  if (url.pathname === '/api/lab/delegated-customers/balances' && req.method === 'GET') {
    if(!await requireLocalIntakePrimary()) return true;
    const [amounts,invoices,owner] = await Promise.all([
      pool.query(`SELECT e.customer_id id, COALESCE(SUM(e.debit-e.credit),0)::bigint balance,
        MAX(t.created_at) balance_updated_at
        FROM finance_entries e JOIN finance_transactions t ON t.id=e.transaction_id
        JOIN finance_accounts fa ON fa.id=e.account_id AND fa.lab_id=t.lab_id AND fa.system_key='receivable'
        WHERE t.lab_id=$1 AND e.customer_id IS NOT NULL GROUP BY e.customer_id`,[labId]),
      pool.query(`SELECT id,customer_id,number,total,issued_at FROM (
        SELECT i.id,i.customer_id,i.number,i.total,i.issued_at,
        row_number() OVER(PARTITION BY i.customer_id ORDER BY i.issued_at DESC,i.id DESC) rn
        FROM invoices i WHERE i.lab_id=$1
      ) x WHERE rn<=5 ORDER BY issued_at DESC`,[labId]),
      pool.query('SELECT 1 FROM labs WHERE id=$1 AND created_by=$2',[labId,a.userId])
    ]);
    sendJson(res,200,{ok:true,canEdit:owner.rowCount>0,
      balances:amounts.rows.map(r=>({id:r.id,balance:Number(r.balance),balanceUpdatedAt:r.balance_updated_at})),
      invoices:invoices.rows.map(r=>({id:r.id,customerId:r.customer_id,number:r.number,total:Number(r.total),issuedAt:r.issued_at}))});
    return true;
  }
  const m=url.pathname.match(/^\/api\/lab\/delegated-customers\/([0-9a-f-]{36})\/(adjust-balance|send-invoice-sms)$/i);
  if(!m || req.method !== 'POST')return false;
  if(!idPattern.test(m[1])){sendJson(res,400,{error:'invalid_customer_id'});return true;}
  if(!await requireLocalIntakePrimary())return true;
  const customerId=m[1],action=m[2],body=await bodyJson(req);
  const owner=await pool.query('SELECT 1 FROM labs WHERE id=$1 AND created_by=$2',[labId,a.userId]);
  if(!owner.rowCount){sendJson(res,403,{error:'lab_owner_only'});return true;}
  const member=await pool.query("SELECT 1 FROM lab_memberships WHERE lab_id=$1 AND user_id=$2 AND role='customer'",[labId,customerId]);
  if(!member.rowCount){sendJson(res,404,{error:'lab_customer_not_found'});return true;}
  if(action==='adjust-balance') {
    const target=integer(body.balance),expected=integer(body.expectedBalance),note=String(body.note||'').trim();
    if(target===null||target<0||expected===null||note.length>500) {
      sendJson(res,400,{error:'invalid_balance_correction'});return true;
    }
    const client=await pool.connect();let outcome;
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[labId,customerId]);
      const current=await readBalance(client,labId,customerId);
      if(current.balance!==expected){
        await client.query('ROLLBACK');sendJson(res,409,{error:'balance_changed',...current});return true;
      }
      const delta=target-current.balance;
      if(delta){
        await ensureFinanceAccounts(client,labId);
        const lines=delta>0
          ? [{accountKey:'receivable',customerId,debit:delta,note},{accountKey:'opening_balance_equity',customerId,credit:delta,note}]
          : [{accountKey:'receivable',customerId,credit:-delta,note},{accountKey:'opening_balance_equity',customerId,debit:-delta,note}];
        await postBalancedFinanceTransaction(client,{labId,actorId:a.userId,
          referenceType:'lab_manual_customer_balance_correction',referenceId:crypto.randomUUID(),
          description:'اصلاح مانده حساب مشتری حضوری: '+note,lines});
      }
      outcome=await readBalance(client,labId,customerId);
      await client.query('COMMIT');
    }catch(err){await client.query('ROLLBACK').catch(()=>{});throw err;}
    finally{client.release();}
    await audit(a.userId,labId,'lab_customer.manual_balance_correction','user',customerId,
      {from:expected,to:target,note}).catch(()=>{});
    sendJson(res,200,{ok:true,...outcome});return true;
  }
  const invoiceId=String(body.invoiceId||'');
  if(!idPattern.test(invoiceId)){sendJson(res,400,{error:'invoice_required'});return true;}
  const invoiceQ=await pool.query(`SELECT i.id,i.number,i.total,i.issued_at,u.mobile,u.name,
      l.name lab_name,l.sms_customer_notifications_allowed
      FROM invoices i JOIN users u ON u.id=i.customer_id
      JOIN labs l ON l.id=i.lab_id
      WHERE i.id=$1 AND i.lab_id=$2 AND i.customer_id=$3`,[invoiceId,labId,customerId]);
  if(!invoiceQ.rowCount){sendJson(res,404,{error:'invoice_not_found'});return true;}
  const invoice=invoiceQ.rows[0];
  const mobile=digits(invoice.mobile).replace(/\D/g,'');
  if(!/^09\d{9}$/.test(mobile)){sendJson(res,409,{error:'customer_mobile_invalid'});return true;}
  if(!invoice.sms_customer_notifications_allowed){sendJson(res,403,{error:'lab_sms_disabled'});return true;}
  const client=await pool.connect();let sendId;
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[labId,mobile]);
    const recent=await client.query(`SELECT 1 FROM lab_manual_invoice_sms_sends
      WHERE lab_id=$1 AND customer_id=$2 AND created_at>now()-interval '60 seconds'
      AND status IN ('dispatching','sent') LIMIT 1`,[labId,customerId]);
    if(recent.rowCount){await client.query('ROLLBACK');sendJson(res,429,{error:'invoice_sms_rate_limited'});return true;}
    const reserved=await client.query(`INSERT INTO lab_manual_invoice_sms_sends(lab_id,customer_id,invoice_id,sent_by,status)
      VALUES($1,$2,$3,$4,'dispatching') RETURNING id`,[labId,customerId,invoiceId,a.userId]);
    sendId=reserved.rows[0].id;
    await client.query('COMMIT');
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
  try{
    const balance=await readBalance(pool,labId,customerId);
    const message=`PhotoBridge\nلابراتوار ${invoice.lab_name}\nفاکتور شماره ${invoice.number}\nمبلغ: ${money(invoice.total)} تومان\nمانده حساب: ${money(balance.balance)} تومان`;
    const sms=await sendSms({mobile,message,purpose:'lab_manual_invoice',eventKey:'manual_invoice',
      labId,metadata:{customerId,invoiceId}});
    await pool.query(`UPDATE lab_manual_invoice_sms_sends SET status='sent',sms_reference=$2,sent_at=now()
      WHERE id=$1`,[sendId,String(sms?.reference||'')||null]);
    sendJson(res,200,{ok:true,smsSent:true,invoiceNumber:invoice.number});return true;
  }catch(e){
    await pool.query("UPDATE lab_manual_invoice_sms_sends SET status='failed',error=$2 WHERE id=$1",
      [sendId,String(e?.message||'sms_send_failed').slice(0,500)]).catch(()=>{});
    sendJson(res,502,{error:'invoice_sms_failed'});return true;
  }
}

