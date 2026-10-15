const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require(process.env.PB_PGLITE_PATH||'@electric-sql/pglite');
const sharp=require('sharp');
const shopId='10000000-0000-4000-8000-000000000001',userId='20000000-0000-4000-8000-000000000001',adminId='20000000-0000-4000-8000-000000000002',otherId='20000000-0000-4000-8000-000000000003';
const itemId='30000000-0000-4000-8000-000000000001',secondId='30000000-0000-4000-8000-000000000002';
async function fixture(){
 const db=new PGlite();await db.exec(`
 CREATE TABLE users(id uuid PRIMARY KEY,name text,mobile text,active boolean,location_address text,location_lat double precision,location_lng double precision);
 CREATE TABLE photographer_profiles(user_id uuid,studio_name text,location_address text,location_lat double precision,location_lng double precision);
 CREATE TABLE equipment_rental_shops(id uuid PRIMARY KEY,business_category text,sales_wallet_checkout_enabled boolean DEFAULT true,updated_at timestamptz);
 CREATE TABLE equipment_sale_items(id uuid PRIMARY KEY,shop_id uuid,title text,active boolean,deleted_at timestamptz,sale_price bigint,stock_total int,variant_specs jsonb);
 CREATE TABLE equipment_sale_orders(id uuid PRIMARY KEY,shop_id uuid,sale_item_id uuid,buyer_user_id uuid,buyer_name text,buyer_mobile text,quantity int,unit_price bigint,total_amount bigint,status text,payment_status text,buyer_wallet_transaction_id uuid,shop_wallet_transaction_id uuid,paid_at timestamptz,notes text,created_by uuid,gross_amount bigint,discount_percent numeric,discount_amount bigint,discount_reason text,refunded_at timestamptz,updated_at timestamptz);
 CREATE TABLE equipment_rental_accounting_entries(shop_id uuid,photographer_id uuid,entry_type text,direction text,amount bigint,description text,created_by uuid);
 CREATE TABLE equipment_rental_shop_memberships(shop_id uuid,user_id uuid,role text,active boolean,settlement_mode text DEFAULT 'prepaid',updated_at timestamptz,UNIQUE(shop_id,user_id,role));`);
 await db.exec(fs.readFileSync('migrations/180_frame_chassis_production.sql','utf8'));await db.exec(fs.readFileSync('migrations/181_frame_bank_transfer_payments.sql','utf8'));
 await db.query("INSERT INTO equipment_rental_shops(id,business_category) VALUES($1,'frame_chassis')",[shopId]);
 for(const id of [userId,adminId,otherId])await db.query("INSERT INTO users VALUES($1,'عکاس','09120000000',true,NULL,NULL,NULL)",[id]);
 for(const id of [itemId,secondId])await db.query("INSERT INTO equipment_sale_items VALUES($1,$2,'قاب',true,NULL,25000,0,'{}')",[id,shopId]);
 const production=await import('../dist/api/frame-production.js'),payments=await import('../dist/api/frame-payments.js');
 let payCalls=0;const make=()=>production.createProductionOrders(db,{shop:{id:shopId,business_category:'frame_chassis',sales_wallet_checkout_enabled:true},userId,items:[{itemId,quantity:2},{itemId:secondId,quantity:1}],body:{deliveryMethod:'pickup'},price:async(_db,_shop,_user,n)=>({totalAmount:n,grossAmount:n,discountPercent:0,discountAmount:0}),pay:async()=>{payCalls++;throw Error('service wallet called');}});
 const objects=new Map(),pool={query:(...args)=>db.query(...args),connect:async()=>({query:(...args)=>db.query(...args),release(){}})};
 const d={pool,sharp,bodyJson:async req=>req.body,sendJson:(res,status,body)=>Object.assign(res,{status,body}),currentShop:async a=>a?.userId===adminId?(await db.query('SELECT * FROM equipment_rental_shops WHERE id=$1',[shopId])).rows[0]:null,audit:async()=>{},notifyCustomer:async()=>{},notifyShop:async()=>{},storeReceipt:async(_s,_p,id,buffer)=>{objects.set(id,buffer);return id;},readObject:async key=>objects.get(key),deleteObject:async key=>objects.delete(key)};
 const run=async(method,path,actor,body)=>{const res={writeHead(status,headers){this.status=status;this.headers=headers;},end(buffer){this.buffer=buffer;}};await payments.handleFramePayments({method,body},res,new URL('https://photobridge.test'+path),actor,d);return res;};
 return {db,make,production,payments,run,objects,payCalls:()=>payCalls,customer:{userId,labRole:'customer'},owner:{userId:adminId,rentalRole:'shop_admin'}};
}
const image=async()=> 'data:image/png;base64,'+(await sharp({create:{width:80,height:100,channels:3,background:'#fff'}}).png().toBuffer()).toString('base64');

test('bank details normalize Persian digits and reject malformed card, IBAN and missing holder',async()=>{
 const {normalizeFrameBank}=await import('../dist/api/frame-payments.js');
 assert.deepEqual(normalizeFrameBank({cardNumber:'۶۰۳۷-۹۹۱۲-۳۴۵۶-۷۸۹۰',iban:'IR820540102680020817909002',accountHolder:' فروشگاه '}),{cardNumber:'6037991234567890',iban:'IR820540102680020817909002',accountHolder:'فروشگاه'});
 for(const [input,error] of [[{cardNumber:'123'},'invalid_card_number'],[{iban:'IR000540102680020817909002'},'invalid_iban'],[{cardNumber:'6037991234567890'},'account_holder_required']])assert.throws(()=>normalizeFrameBank(input),{message:error});
});

test('one receipt covers the entire cart; submission never pays, rejection permits resubmission, approval records each line once',async()=>{
 const f=await fixture();try{
  const out=await f.make(),id=out.paymentId,url='/api/customer/equipment-rental/frame-payments/'+id,review='/api/rental/frame-payments/'+id+'/review';
  assert.equal(f.payCalls(),0);assert.equal(out.checkoutMode,'bank_transfer');assert.equal(out.totalAmount,75000);
  let r=await f.run('POST',url+'/receipt',f.customer,{image:await image()});assert.equal(r.body.error,'bank_details_unavailable');assert.equal(f.objects.size,0);
  r=await f.run('PUT','/api/rental/frame-payment-settings',f.owner,{cardNumber:'6037991234567890',accountHolder:'فروشگاه قاب'});assert.equal(r.status,200);
  assert.equal((await f.run('GET',url,f.customer)).body.payment.totalAmount,75000);
  r=await f.run('POST',url+'/receipt',f.customer,{image:await image(),name:'receipt.png'});assert.equal(r.status,201);
  assert.deepEqual((await f.db.query('SELECT DISTINCT payment_status FROM equipment_sale_orders')).rows,[{payment_status:'unpaid'}]);
  assert.equal((await f.run('POST',url+'/receipt',f.customer,{image:await image()})).body.error,'receipt_not_replaceable');
  assert.equal((await f.run('POST',review,f.owner,{action:'reject',note:'تصویر خوانا نیست'})).status,200);
  assert.equal((await f.run('GET',url,f.customer)).body.payment.reviewNote,'تصویر خوانا نیست');
  assert.equal((await f.run('POST',url+'/receipt',f.customer,{image:await image()})).status,201);
  assert.equal(f.objects.size,1,'replaced receipt is cleaned up');
  for(const order of (await f.db.query('SELECT * FROM equipment_sale_orders')).rows){await f.production.frameLedger(f.db,order);await f.db.query("UPDATE equipment_sale_orders SET production_confirmed_at=now(),status='confirmed',production_stage='in_production' WHERE id=$1",[order.id]);}
  assert.equal((await f.run('POST',review,f.owner,{action:'approve'})).status,200);
  assert.equal((await f.run('POST',review,f.owner,{action:'approve'})).status,200);
  assert.deepEqual((await f.db.query('SELECT DISTINCT payment_status FROM equipment_sale_orders')).rows,[{payment_status:'paid'}]);
  const ledger=(await f.db.query("SELECT entry_type,count(*)::int n,sum(amount)::int total FROM equipment_rental_accounting_entries GROUP BY entry_type ORDER BY entry_type")).rows;
  assert.deepEqual(ledger,[{entry_type:'payment',n:2,total:75000},{entry_type:'sale_charge',n:2,total:75000}]);assert.equal(f.payCalls(),0);
  const receipt=await f.run('GET',url+'/receipt',f.customer);assert.equal(receipt.headers['Content-Type'],'image/jpeg');assert.equal((await sharp(receipt.buffer).metadata()).format,'jpeg');
 }finally{await f.db.close();}
});

test('customer and shop boundaries protect receipt viewing, uploads, settings and review',async()=>{
 const f=await fixture();try{const out=await f.make(),url='/api/customer/equipment-rental/frame-payments/'+out.paymentId;
  for(const method of ['GET','POST'])assert.equal((await f.run(method,url+(method==='POST'?'/receipt':''),{userId:otherId,labRole:'customer'},{image:await image()})).status,404);
  assert.equal((await f.run('GET',url+'/receipt',{userId:otherId,labRole:'customer'})).status,404);
  assert.equal((await f.run('GET',url,null)).status,401);
  assert.equal((await f.run('PUT','/api/rental/frame-payment-settings',f.customer,{})).status,401);
  assert.equal((await f.run('POST','/api/rental/frame-payments/'+out.paymentId+'/review',f.customer,{action:'approve'})).status,401);
  assert.equal((await f.run('POST','/api/rental/frame-payments/'+out.paymentId+'/review',f.owner,{action:'approve'})).body.error,'receipt_not_pending');
 }finally{await f.db.close();}
});

test('cancelled orders and invalid image data cannot become paid; migration is repeatable',async()=>{
 const f=await fixture();try{const out=await f.make(),url='/api/customer/equipment-rental/frame-payments/'+out.paymentId;
  assert.equal((await f.run('POST',url+'/receipt',f.customer,{image:'data:image/png;base64,ZmFrZQ=='})).body.error,'invalid_receipt_image');
  await f.run('PUT','/api/rental/frame-payment-settings',f.owner,{cardNumber:'6037991234567890',accountHolder:'قاب'});await f.run('POST',url+'/receipt',f.customer,{image:await image()});
  await f.db.query("UPDATE equipment_sale_orders SET status='cancelled',production_stage='cancelled' WHERE id=$1",[out.orderIds[0]]);
  assert.equal((await f.run('POST','/api/rental/frame-payments/'+out.paymentId+'/review',f.owner,{action:'approve'})).body.error,'payment_group_changed');
  assert.deepEqual((await f.db.query('SELECT DISTINCT payment_status FROM equipment_sale_orders')).rows,[{payment_status:'unpaid'}]);
  await f.db.exec(fs.readFileSync('migrations/181_frame_bank_transfer_payments.sql','utf8'));assert.equal((await f.db.query('SELECT count(*)::int n FROM equipment_frame_payments')).rows[0].n,1);
 }finally{await f.db.close();}
});

test('existing unpaid production orders are backfilled without changing previously paid orders',async()=>{
 const f=await fixture();try{const out=await f.make();await f.db.query('UPDATE equipment_sale_orders SET frame_payment_id=NULL');await f.db.query('DELETE FROM equipment_frame_payments');await f.db.query("UPDATE equipment_sale_orders SET payment_status='paid' WHERE id=$1",[out.orderIds[1]]);
  await f.db.exec(fs.readFileSync('migrations/181_frame_bank_transfer_payments.sql','utf8'));await f.db.exec(fs.readFileSync('migrations/181_frame_bank_transfer_payments.sql','utf8'));
  const unpaid=(await f.db.query('SELECT frame_payment_id,payment_status FROM equipment_sale_orders WHERE id=$1',[out.orderIds[0]])).rows[0];assert.equal(unpaid.frame_payment_id,out.orderIds[0]);assert.equal(unpaid.payment_status,'unpaid');
  assert.deepEqual((await f.db.query('SELECT frame_payment_id,payment_status FROM equipment_sale_orders WHERE id=$1',[out.orderIds[1]])).rows[0],{frame_payment_id:null,payment_status:'paid'});assert.equal((await f.db.query('SELECT count(*)::int n FROM equipment_frame_payments')).rows[0].n,1);
 }finally{await f.db.close();}
});

test('bank approval before production confirmation is accounted for; cancellation never invents a wallet refund',async()=>{
 const f=await fixture();try{const out=await f.make(),url='/api/customer/equipment-rental/frame-payments/'+out.paymentId;
  await f.run('PUT','/api/rental/frame-payment-settings',f.owner,{cardNumber:'6037991234567890',accountHolder:'قاب'});await f.run('POST',url+'/receipt',f.customer,{image:await image()});await f.run('POST','/api/rental/frame-payments/'+out.paymentId+'/review',f.owner,{action:'approve'});
  assert.equal((await f.db.query("SELECT sum(amount)::int total FROM equipment_rental_accounting_entries WHERE entry_type='payment'")).rows[0].total,75000);
  let order=(await f.db.query('SELECT * FROM equipment_sale_orders WHERE id=$1',[out.orderIds[0]])).rows[0];await f.production.frameLedger(f.db,order);await f.production.frameLedger(f.db,order,true);
  assert.equal((await f.db.query("SELECT count(*)::int n FROM equipment_rental_accounting_entries WHERE entry_type='sale_refund'")).rows[0].n,0);
  assert.equal((await f.db.query("SELECT count(*)::int n FROM equipment_rental_accounting_entries WHERE entry_type='payment'")).rows[0].n,2,'confirmation does not duplicate already received money');assert.equal(f.payCalls(),0);
 }finally{await f.db.close();}
});

test('owner activity feed reports new frame orders and submitted receipts and stays scoped to shop',async()=>{
 const f=await fixture();try{
  const order=await f.make();
  const endpoint='/api/rental/frame-activity';
  let response=await f.run('GET',endpoint,f.owner);
  assert.equal(response.status,200);
  assert.equal(response.body.orders.length,2);
  assert(response.body.orders.every(o=>o.paymentId===order.paymentId));
  assert(response.body.orders.every(o=>o.receiptStatus==='awaiting_receipt'));
  assert.equal((await f.run('GET',endpoint,f.customer)).status,401);
  assert.equal((await f.run('POST',endpoint,f.owner,{})).status,405);
  await f.run('PUT','/api/rental/frame-payment-settings',f.owner,{cardNumber:'6037991234567890',accountHolder:'قاب'});
  const sent=await f.run('POST','/api/customer/equipment-rental/frame-payments/'+order.paymentId+'/receipt',f.customer,{image:await image(),name:'receipt.png'});
  assert.equal(sent.status,201);
  response=await f.run('GET',endpoint,f.owner);
  assert(response.body.orders.every(o=>o.receiptStatus==='pending'&&o.receiptSubmittedAt));
  assert(!JSON.stringify(response.body).includes('receipt_object_key'),'never expose receipt object key in activity feed');
 }finally{await f.db.close();}
});
