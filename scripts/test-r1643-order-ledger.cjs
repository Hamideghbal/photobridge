'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const urlId='11111111-1111-4111-8111-111111111111';
const labId='22222222-2222-4222-8222-222222222222';
const memberId='33333333-3333-4333-8333-333333333333';
const policy=()=>import('../dist/api/lab-order-ledger-override.js');
const order=overrides=>({id:urlId,lab_id:labId,customer_id:memberId,number:1625,settlement_mode:'prepaid',
 status:'awaiting_payment',payment_status:'awaiting_receipt',downloaded_at:null,printed_at:null,...overrides});

test('only unpaid, unprinted prepaid orders may be switched to ledger',async()=>{
 const {ledgerOverrideEligibility:allowed}=await policy();
 assert.equal(allowed(order()).ok,true);
 assert.equal(allowed(order({payment_status:'pricing_required'})).ok,true);
 assert.equal(allowed(order({payment_status:'receipt_rejected'})).ok,true);
 assert.equal(allowed(order({payment_status:'receipt_pending'})).error,'receipt_review_required');
 assert.equal(allowed(order({payment_status:'paid'})).error,'payment_already_recorded');
 assert.equal(allowed(order({status:'printing'})).error,'order_not_awaiting_payment');
 assert.equal(allowed(order({downloaded_at:new Date()})).error,'order_not_awaiting_payment');
 assert.equal(allowed(order({settlement_mode:'ledger'})).alreadyLedger,true);
});

function setup({current=order(),receipt=[],paymentCount=0,customerBody={settlementMode:'ledger'}}={}){
 let response=null,releaseCount=0,events=[],messages=[],logs=[];
 const db={query:async(sql,params)=>{
  logs.push({sql,params});
  if(sql==='BEGIN'||sql==='COMMIT'||sql==='ROLLBACK')return {rows:[],rowCount:0};
  if(sql.includes('SELECT * FROM orders WHERE id='))return {rows:[current],rowCount:1};
  if(sql.includes('FROM order_payment_receipts'))return {rows:receipt,rowCount:receipt.length};
  if(sql.includes('FROM finance_payments'))return {rows:[{count:paymentCount}],rowCount:1};
  if(sql.includes('UPDATE orders'))return {rows:[{...current,settlement_mode:'ledger',payment_status:'not_required',status:'sent'}],rowCount:1};
  throw Error('unexpected sql '+sql);
 },release:()=>{releaseCount++;}};
 const args={req:{method:'POST'},url:new URL('https://example.invalid/api/lab/orders/'+urlId+'/settlement-mode'),
  res:{},pool:{connect:async()=>db},labId,a:{userId:memberId},bodyJson:async()=>customerBody,
  sendJson:(_res,code,value)=>{response={code,value}},statusEvent:async(_db,o,st,actor,note)=>{events.push({order:o,status:st,note})},
  audit:async(...parts)=>{messages.push(['audit',parts])},
  publishLabEvent:(...parts)=>messages.push(['lab',parts]),
  publishCustomerEvent:(...parts)=>messages.push(['customer',parts])};
 return{args,response:()=>response,events,messages,logs,releaseCount:()=>releaseCount};
}

test('per-order conversion unlocks just this order; financial rows remain untouched',async()=>{
 const t=setup(),{handleLabLedgerOverride:handle}=await policy();
 assert.equal(await handle(t.args),true);
 assert.equal(t.response().code,200);
 assert.equal(t.response().value.order.settlement_mode,'ledger');
 assert.equal(t.response().value.order.payment_status,'not_required');
 assert.equal(t.response().value.order.status,'sent');
 assert.equal(t.events.length,1);
 assert(t.events[0].note.includes('هیچ پرداخت'));
 assert(t.logs.some(e=>e.sql==='COMMIT'));
 assert.equal(t.logs.filter(e=>String(e.sql).includes('UPDATE orders')).length,1);
 assert(!t.logs.some(e=>/UPDATE (?:lab_memberships|invoices|finance_payments)|DELETE FROM (?:invoices|finance_payments)/.test(e.sql)));
 assert(t.messages.some(x=>x[0]==='audit'));
 assert.equal(t.releaseCount(),1);
});

test('pending receipt, existing payment, and already-paid orders cannot be turned into false ledger settlement',async()=>{
 const {handleLabLedgerOverride:handle}=await policy();
 for(const item of [
  {receipt:[{id:'r',status:'uploading'}],expected:'receipt_upload_in_progress'},
  {receipt:[{id:'r',status:'pending'}],expected:'receipt_review_required'},
  {receipt:[{id:'r',status:'approved'}],expected:'payment_already_recorded'},
  {paymentCount:1,expected:'order_has_payment'},
  {current:order({payment_status:'paid'}),expected:'payment_already_recorded'},
 ]){
  const t=setup(item);
  await handle(t.args);
  assert.equal(t.response().code,409);
  assert.equal(t.response().value.error,item.expected);
  assert.equal(t.events.length,0);
  assert(!t.logs.some(e=>String(e.sql).includes('UPDATE orders')));
  assert(t.logs.some(e=>e.sql==='ROLLBACK'));
 }
});
test('repeat request is idempotent and cannot produce duplicate history or payment',async()=>{
 const {handleLabLedgerOverride:handle}=await policy(),t=setup({current:order({settlement_mode:'ledger',payment_status:'not_required',status:'sent'})});
 await handle(t.args);
 assert.equal(t.response().code,200);
 assert.equal(t.response().value.unchanged,true);
 assert.equal(t.events.length,0);
 assert(!t.logs.some(e=>String(e.sql).includes('UPDATE orders')));
});
test('invalid targets or method are rejected before opening a database transaction',async()=>{
 const {handleLabLedgerOverride:handle}=await policy(),t=setup({customerBody:{settlementMode:'prepaid'}});
 await handle(t.args);assert.equal(t.response().code,400);
 assert.equal(t.logs.length,0);
});

test('website, Windows and lab-only API include settlement action with valid manifest integrity',()=>{
 const server=fs.readFileSync('dist/api/server.js','utf8');
 const outer=server.indexOf("if (url.pathname.startsWith('/api/lab/'))");
 const call=server.indexOf('handleLabLedgerOverride({req,url,res,pool,labId,a,bodyJson');
 const orderGet=server.indexOf('const labOrder = url.pathname.match(',call);
 assert(outer>=0&&call>outer&&orderGet>call);
 assert.match(server,/import \{handleLabLedgerOverride\} from '.\/lab-order-ledger-override\.js'/);
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const code=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert.match(code,/PB1643 order-ledger action/);
  assert.match(code,/دفتری کردن این سفارش/);
  assert.match(code,/هیچ مبلغی صفر یا تسویه نمی‌شود/);
  assert.match(fs.readFileSync(root+'/index.html','utf8'),/photobridge-r1643-order-ledger\.css/);
 }
 const root='dist/web/lab-desktop-ui',m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-r1643-order-ledger.css']){
  const row=m.files.find(x=>x.name===name);
  assert(row,'missing Windows manifest '+name);
  assert.equal(row.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
});
