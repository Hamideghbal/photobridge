'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const id='11111111-1111-4111-8111-111111111111',lab='22222222-2222-4222-8222-222222222222',customer='33333333-3333-4333-8333-333333333333';
const policy=()=>import('../dist/api/lab-photographer-ledger.js');
const order=(suffix='1',o={})=>({id:suffix==='1'?id:'44444444-4444-4444-8444-44444444444'+suffix,
 lab_id:lab,customer_id:customer,number:Number(suffix)+320,settlement_mode:'prepaid',payment_status:'awaiting_receipt',
 status:'awaiting_payment',downloaded_at:null,printed_at:null,...o});

function fixture({source=order(),membership={settlement_mode:'prepaid'},orders=[source],
 receipts=[],paidIds=[],body={settlementMode:'ledger'}}={}){
 const calls=[],history=[],events=[];let response=null;
 const pool={connect:async()=>({release(){},async query(sql,params=[]){
  calls.push({sql,params});
  if(['BEGIN','COMMIT','ROLLBACK'].includes(sql))return{rowCount:0,rows:[]};
  if(sql.startsWith('SELECT id,customer_id,number FROM orders'))return {rowCount:1,rows:[source]};
  if(sql.includes('FROM lab_memberships')&&sql.includes('FOR UPDATE'))return {rowCount:1,rows:[membership]};
  if(sql.includes("UPDATE lab_memberships SET settlement_mode='ledger'"))
   return {rowCount:1,rows:[{...membership,settlement_mode:'ledger'}]};
  if(sql.includes('FROM orders')&&sql.includes('ORDER BY id FOR UPDATE'))return{rowCount:orders.length,rows:orders};
  if(sql.includes('UPDATE orders SET')){
   const source=orders.find(o=>o.id===params[0]);
   const protectedReceipt=receipts.some(r=>r.order_id===params[0]&&['uploading','pending','approved'].includes(r.status));
   const paid=paidIds.includes(params[0]);
   return protectedReceipt||paid?{rowCount:0,rows:[]}:{rowCount:1,rows:[{...source,settlement_mode:'ledger',payment_status:'not_required',
     status:source.status==='downloaded'?'downloaded':'sent'}]};
  }
  if(sql.includes('FROM order_payment_receipts'))return {rowCount:receipts.length,rows:receipts};
  if(sql.includes('JOIN finance_payments')&&!sql.includes('UPDATE orders'))return{rowCount:paidIds.length,rows:paidIds.map(order_id=>({order_id}))};
  throw Error('unexpected SQL '+sql.slice(0,110));
 }})};
 const a={req:{method:'POST'},url:{pathname:'/api/lab/orders/'+id+'/photographer-ledger'},res:{},pool,labId:lab,a:{userId:'lab-admin'},bodyJson:async()=>body,
 sendJson:(_res,status,data)=>{response={status,data}},
 statusEvent:async(db,o,s,actor,note)=>history.push({order:o.id,status:s,note}),
 audit:async(...args)=>events.push({type:'audit',args}),
 publishCustomerEvent:(...args)=>events.push({type:'customer',args}),
 publishLabEvent:(...args)=>events.push({type:'lab',args})};
 return{args:a,calls,history,events,response:()=>response};
}

test('account mode is photographer-wide, but no payment, invoice or finance rows are mutated',async()=>{
 const {handleLabPhotographerLedger:run}=await policy();
 const second=order('2'),third=order('3'),t=fixture({
  orders:[order(),second,third],
  receipts:[{order_id:id,status:'pending'}],
  paidIds:[third.id]
 });
 assert.equal(await run(t.args),true);
 assert.equal(t.response().status,200);
 assert.equal(t.response().data.settlementMode,'ledger');
 assert.equal(t.response().data.releasedCount,1);
 assert.equal(t.response().data.pendingReceiptCount,1);
 assert.deepEqual(t.response().data.releasedOrderIds,[second.id]);
 assert.equal(t.history.length,1);
 const writes=t.calls.filter(c=>/^UPDATE\s/.test(c.sql)).map(c=>c.sql);
 assert.equal(writes.filter(x=>x.includes('lab_memberships')).length,1);
 assert.equal(writes.filter(x=>x.includes('UPDATE orders')).length,1);
 assert(writes.every(x=>/UPDATE (lab_memberships|orders)/.test(x)));
 assert(t.events.some(x=>x.type==='audit'));
 assert(t.calls.some(x=>x.sql==='COMMIT'));
 // Every membership update is scoped by BOTH the lab and the customer.
 const mem=t.calls.find(x=>x.sql.includes('UPDATE lab_memberships'));
 assert.deepEqual(mem.params,[lab,customer]);
});

test('pending receipt does not block changing the account, but keeps its order pending review',async()=>{
 const {handleLabPhotographerLedger:run}=await policy();
 const t=fixture({receipts:[{order_id:id,status:'pending'}]});
 await run(t.args);
 assert.equal(t.response().status,200);
 assert.equal(t.response().data.releasedCount,0);
 assert.equal(t.response().data.pendingReceiptCount,1);
 assert.equal(t.history.length,0);
 assert(t.calls.some(x=>x.sql.includes('UPDATE lab_memberships')));
 assert(!t.calls.some(x=>x.sql.includes('UPDATE orders SET')));
});

test('without financial receipt, the clicked waiting order is released, and later repeats do not duplicate status events',async()=>{
 const {handleLabPhotographerLedger:run}=await policy();
 const t=fixture();await run(t.args);
 assert.equal(t.response().status,200);
 assert.equal(t.response().data.releasedCount,1);
 assert.equal(t.history.length,1);
 const repeat=fixture({membership:{settlement_mode:'ledger'},orders:[]});await run(repeat.args);
 assert.equal(repeat.response().status,200);
 assert.equal(repeat.response().data.unchanged,true);
 assert.equal(repeat.history.length,0);
});

test('R1647: unpaid downloaded proforma can change to ledger without rewinding file status',async()=>{
 const {handleLabPhotographerLedger:run,photographerLedgerOrderEligibility:eligible}=await policy();
 const downloaded=order('1',{status:'downloaded',downloaded_at:'2026-11-06T16:00:00Z'});
 assert.equal(eligible(downloaded,'',false).eligible,true);
 assert.equal(eligible({...downloaded,status:'printing'},'',false).eligible,false);
 assert.equal(eligible({...downloaded,printed_at:'2026-11-06T16:05:00Z'},'',false).eligible,false);
 const t=fixture({source:downloaded,orders:[downloaded]});
 await run(t.args);
 assert.equal(t.response().status,200);
 assert.equal(t.response().data.releasedCount,1);
 assert.deepEqual(t.response().data.releasedOrderIds,[downloaded.id]);
 assert.equal(t.history.length,1);
 assert.equal(t.history[0].status,'downloaded');
 const sql=t.calls.find(c=>c.sql.startsWith('UPDATE orders SET')).sql;
 assert.match(sql,/status=CASE WHEN status='awaiting_payment' THEN 'sent' ELSE status END/);
 assert.match(sql,/status='downloaded'/);
 assert(!t.calls.some(c=>/UPDATE (invoices|finance_payments)/.test(c.sql)));
});

test('R1647: a pending receipt on a downloaded order remains pending while member becomes ledger',async()=>{
 const {handleLabPhotographerLedger:run}=await policy();
 const downloaded=order('1',{status:'downloaded',downloaded_at:'2026-11-06T16:00:00Z',payment_status:'receipt_pending'});
 const t=fixture({source:downloaded,orders:[downloaded],receipts:[{order_id:id,status:'pending'}]});
 await run(t.args);
 assert.equal(t.response().status,200);
 assert.equal(t.response().data.releasedCount,0);
 assert.equal(t.response().data.pendingReceiptCount,1);
 assert(!t.calls.some(c=>c.sql.startsWith('UPDATE orders SET')));
 assert(t.calls.some(c=>c.sql.includes('UPDATE lab_memberships')));
});

test('account action validates POST, correct body, scoped member before changing settlement',async()=>{
 const {handleLabPhotographerLedger:run}=await policy();
 for(const body of [{settlementMode:'prepaid'},{},null]){
  const t=fixture({body});await run(t.args);
  assert.equal(t.response().status,400);
  assert.equal(t.calls.length,0);
 }
 assert.equal((await policy()).photographerLedgerOrderEligibility(order(), 'pending',false).reason,'receipt_needs_review');
 assert.equal((await policy()).photographerLedgerOrderEligibility(order(), 'approved',false).reason,'payment_recorded');
});

test('new API route follows lab-admin permission checks; cards, detail, receipt dialog and native update are aligned',()=>{
 const server=fs.readFileSync('dist/api/server.js','utf8');
 const auth=server.indexOf("if (url.pathname.startsWith('/api/lab/'))");
 const suspended=server.indexOf('labAccess.rows[0].suspended',auth);
 const route=server.indexOf('if(await handleLabPhotographerLedger(',suspended);
 const old=server.indexOf('if(await handleLabLedgerOverride(',route);
 assert(auth>=0&&suspended>auth&&route>suspended&&old>route);
 assert(server.includes("import {handleLabPhotographerLedger} from './lab-photographer-ledger.js'"));
 assert.equal((server.match(/AS photographer_settlement_mode/g)||[]).length,2,
   'lab order list and detail must both reflect the current photographer account mode');
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(js.includes("'/photographer-ledger'"));
  assert(js.includes('دفتری کردن حساب عکاسی'));
  assert(js.includes('حساب این عکاسی در همین لابراتوار دفتری می‌شود.'));
  assert(js.includes('pb1646LedgerFromReceipt'));
  assert(js.includes('رسیدهای در حال ارسال یا بررسی'));
  assert(js.includes('photographer_settlement_mode'));
  assert(js.includes('["awaiting_payment","downloaded"].includes(String(le.status||""))'));
  assert(js.includes('["awaiting_payment","downloaded"].includes(String(y.order.status||""))'));
  assert(js.includes('حساب عکاسی دفتری شد · رسید در انتظار بررسی'));
  assert(js.includes('حساب عکاسی اکنون دفتری است'));
  const html=fs.readFileSync(root+'/index.html','utf8');
  assert(html.includes('orderLedger=r1647'));
  assert(html.includes('photobridge-r1643-order-ledger.css?v=r1647'));
 }
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-r1643-order-ledger.css']){
  const row=manifest.files.find(x=>x.name===name);
  assert(row,'missing native asset: '+name);
  const bytes=fs.readFileSync(root+'/'+name);
  assert.equal(row.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));
 }
});
