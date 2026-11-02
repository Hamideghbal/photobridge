'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url'),{PGlite}=require(process.env.PB_PGLITE_PATH||'@electric-sql/pglite');
const lab='10000000-0000-4000-8000-000000000001',customer='20000000-0000-4000-8000-000000000001',manager='30000000-0000-4000-8000-000000000001',receivable='40000000-0000-4000-8000-000000000001',equity='40000000-0000-4000-8000-000000000002';
async function fixture(){
 const db=new PGlite();await db.exec(`CREATE TABLE labs(id uuid PRIMARY KEY,sms_customer_notifications_allowed boolean);CREATE TABLE lab_memberships(lab_id uuid,user_id uuid,role text,active boolean);CREATE TABLE finance_accounts(id uuid PRIMARY KEY,lab_id uuid,system_key text);CREATE TABLE finance_transactions(id uuid PRIMARY KEY,lab_id uuid,reference_type text,reference_id uuid,created_at timestamptz DEFAULT now());CREATE TABLE finance_entries(transaction_id uuid,account_id uuid,customer_id uuid,debit bigint DEFAULT 0,credit bigint DEFAULT 0);CREATE TABLE invoices(id uuid PRIMARY KEY,lab_id uuid,customer_id uuid,number integer,total bigint,issued_at timestamptz DEFAULT now());`);
 await db.query('INSERT INTO labs VALUES($1,true)',[lab]);await db.query("INSERT INTO lab_memberships VALUES($1,$2,'customer',false)",[lab,customer]);await db.query("INSERT INTO finance_accounts VALUES($1,$2,'receivable'),($3,$2,'opening_balance_equity')",[receivable,lab,equity]);
 const initial=crypto.randomUUID();await db.query("INSERT INTO finance_transactions(id,lab_id,reference_type,reference_id) VALUES($1,$2,'lab_delegated_opening_debt',$3)",[initial,lab,customer]);await db.query('INSERT INTO finance_entries VALUES($1,$2,$3,25000,0),($1,$4,$3,0,25000)',[initial,receivable,customer,equity]);
 const pool={query:(...a)=>db.query(...a),connect:async()=>({query:(...a)=>db.query(...a),release(){}})}, {handleLabManualCustomerAccounts}=await import(pathToFileURL(path.resolve('dist/api/lab-manual-customer-controls.js')));let failPosting=false;
 const request=async({alias=true,method='GET',body={},actor={labRole:'lab_admin',labId:lab,userId:manager},id=customer}={})=>{
  let response;const action=method==='POST'?'adjust-initial-debt':'account-summary',url=new URL('http://test'+(alias?'/api/lab/finance/customer-initial-debt/':'/api/lab/delegated-customers/')+id+'/'+action);
  const ctx={req:{method},url,res:{},pool,labId:lab,a:actor,bodyJson:async()=>body,sendJson:(_,status,data)=>response={status,data},crypto,ensureFinanceAccounts:async()=>{},audit:async()=>{},requireLocalIntakePrimary:async()=>true,postBalancedFinanceTransaction:async(client,payload)=>{const id=crypto.randomUUID();await client.query('INSERT INTO finance_transactions(id,lab_id,reference_type,reference_id) VALUES($1,$2,$3,$4)',[id,payload.labId,payload.referenceType,payload.referenceId]);for(const line of payload.lines){await client.query('INSERT INTO finance_entries VALUES($1,$2,$3,$4,$5)',[id,line.accountKey==='receivable'?receivable:equity,line.customerId,line.debit||0,line.credit||0]);if(failPosting)throw Error('forced_journal_failure');}}};
  assert.equal(await handleLabManualCustomerAccounts(ctx),true);return response;
 };
 const snapshot=async()=>({transactions:(await db.query('SELECT * FROM finance_transactions ORDER BY id')).rows,entries:(await db.query('SELECT * FROM finance_entries ORDER BY transaction_id,account_id')).rows});
 return{db,request,snapshot,failPosting:()=>failPosting=true};
}
test('authoritative alias and original route share eligibility and balanced correction for pending and joined customers',async()=>{
 const f=await fixture();try{for(const active of [false,true]){await f.db.query('UPDATE lab_memberships SET active=$1',[active]);for(const alias of [false,true]){const r=await f.request({alias});assert.equal(r.status,200);assert.equal(r.data.canEditInitialDebt,true);assert.equal(r.data.hasInvoice,false);assert.equal(r.data.initialDebt,25000);}}
 const saved=await f.request({method:'POST',body:{initialDebt:35000,expectedInitialDebt:25000}});assert.equal(saved.status,200);assert.equal(saved.data.initialDebt,35000);assert.equal((await f.request({alias:false})).data.initialDebt,35000);
 const sums=(await f.db.query('SELECT transaction_id,SUM(debit-credit)::int net FROM finance_entries GROUP BY transaction_id')).rows;assert(sums.every(row=>row.net===0));
 }finally{await f.db.close()}
});
test('first invoice and stale expected amount reject corrections without any ledger mutation',async()=>{
 const f=await fixture();try{let before=await f.snapshot();const stale=await f.request({method:'POST',body:{initialDebt:35000,expectedInitialDebt:0}});assert.equal(stale.status,409);assert.equal(stale.data.error,'initial_debt_changed');assert.deepEqual(await f.snapshot(),before);
 await f.db.query('INSERT INTO invoices(id,lab_id,customer_id,number,total) VALUES($1,$2,$3,1,9000)',[crypto.randomUUID(),lab,customer]);assert.equal((await f.request()).data.canEditInitialDebt,false);before=await f.snapshot();const blocked=await f.request({method:'POST',body:{initialDebt:35000,expectedInitialDebt:25000}});assert.equal(blocked.status,409);assert.equal(blocked.data.error,'initial_debt_locked_after_invoice');assert.deepEqual(await f.snapshot(),before);
 }finally{await f.db.close()}
});
test('alias retains role, lab and customer membership checks; failed posting rolls back the whole correction',async()=>{
 const f=await fixture();try{const before=await f.snapshot();for(const actor of [{labRole:'customer',labId:lab,userId:customer},{labRole:'lab_admin',labId:crypto.randomUUID(),userId:manager},null])for(const method of ['GET','POST']){const denied=await f.request({actor,method,body:{initialDebt:35000,expectedInitialDebt:25000}});assert.equal(denied.status,403);}assert.equal((await f.request({id:crypto.randomUUID()})).status,404);assert.deepEqual(await f.snapshot(),before);
 f.failPosting();await assert.rejects(()=>f.request({method:'POST',body:{initialDebt:35000,expectedInitialDebt:25000}}),/forced_journal_failure/);assert.deepEqual(await f.snapshot(),before);
 }finally{await f.db.close()}
});
