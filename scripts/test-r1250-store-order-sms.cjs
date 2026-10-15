const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('dist/api/server.js','utf8');
function functionSource(name){const start=source.indexOf('async function '+name+'('),next=source.indexOf('\nasync function ',start+1);return source.slice(start,next);}
test('production notifications use order wording and independent approval, cancellation and ready settings',async()=>{
 const {productionOrderSms}=await import('../dist/api/store-order-sms.js');
 for(const [action,setting] of [['confirm','booking_approved'],['cancel','booking_status'],['ready','order_ready']]){
  const out=productionOrderSms({name:'قاب آزمایشی'},{id:'12345678-abcd',delivery_method:'courier'},action);
  assert.equal(out.setting,setting);assert(out.message.includes('سفارش'));assert(!/آفیش|رزرو/.test(out.message));assert(out.message.includes('12345678'));
 }
 assert.equal(productionOrderSms({}, {}, 'schedule'),null);assert.equal(productionOrderSms({}, {}, 'deliver'),null);
});
test('invitations ignore auto-SMS switches; ready is opt-in and honours the master switch',async()=>{
 let settings={enabled:false,invite_enabled:false},ready=false,queries=0;
 const ctx={pool:{query:async sql=>{queries++;return {rows:sql.includes('platform_settings')?[{value:{orderReadyEnabled:ready}}]:[settings]}}},equipmentRentalSmsWalletEnsure:async()=>{}};
 vm.createContext(ctx);vm.runInContext(functionSource('equipmentRentalSmsAutoAllowed')+'\nthis.allowed=equipmentRentalSmsAutoAllowed;',ctx);
 assert.equal(await ctx.allowed('shop','invite'),true);assert.equal(queries,0);
 assert.equal(await ctx.allowed('shop','order_ready'),false);
 settings.enabled=true;assert.equal(await ctx.allowed('shop','order_ready'),false);
 ready=true;assert.equal(await ctx.allowed('shop','order_ready'),true);
 settings.booking_approved_enabled=false;assert.equal(await ctx.allowed('shop','booking_approved'),false);
});
test('zero-credit sponsorship is limited to a server-identified admin test shop and admin recipient',async()=>{
 const {shopSmsTestRecipient}=await import('../dist/api/store-order-sms.js');
 let adminRows=[];let sql='';
 const db={query:async(q,args)=>{sql=q;assert.deepEqual(args,['shop']);return {rows:adminRows}}};
 assert.equal(await shopSmsTestRecipient(db,'shop','09120000000'),false);
 assert(sql.includes("admin.platform_role='platform_admin'"));assert(sql.includes('admin.active=true'));assert(sql.includes('test_shop.id=$1'));assert(sql.includes('manager_mobile'));
 adminRows=[{mobile:'+989120000000'}];
 assert.equal(await shopSmsTestRecipient(db,'shop','۰۹۱۲۰۰۰۰۰۰۰'),true);
 assert.equal(await shopSmsTestRecipient(db,'shop','09120000001'),false);
 assert.equal(await shopSmsTestRecipient(db,'shop',''),false);
});
test('insufficient ordinary wallets fail; matching admin test SMS does not debit or refund',async()=>{
 const fn=functionSource('reserveEquipmentRentalSmsCharge');
 for(const sponsored of [false,true]){
  const calls=[];const db={query:async(sql)=>{calls.push(sql);if(sql.includes('platform_services'))return {rows:[{enabled:true,unit_price:100}]};if(sql.includes('SELECT balance'))return {rows:[{balance:0}]};return {rows:[]}},release:()=>{}};
  const ctx={pool:{connect:async()=>db},equipmentRentalSmsWalletEnsure:async()=>{},shopSmsTestRecipient:async(c,shop,mobile)=>{assert.equal(c,db);assert.equal(shop,'shop');assert.equal(mobile,'09120000000');return sponsored;}};
  vm.createContext(ctx);vm.runInContext(fn+'\nthis.reserve=reserveEquipmentRentalSmsCharge;',ctx);
  const pending=ctx.reserve({shopId:'shop',metadata:{mobile:'09120000000'}});
  if(sponsored){const out=await pending;assert.equal(out.amount,0);assert.equal(out.sponsoredAdminTest,true);assert(calls.includes('COMMIT'));}
  else{await assert.rejects(pending,/service_wallet_insufficient/);assert(calls.includes('ROLLBACK'));}
  assert(!calls.some(sql=>sql.includes('UPDATE equipment_rental_sms_wallets')||sql.includes('INSERT INTO equipment_rental_sms_wallet_transactions')));
 }
});
test('SMS settings render without an invitation checkbox and restore the ready switch',()=>{
 const html=fs.readFileSync('dist/api/equipment-rental-portal.html','utf8');
 assert(!html.includes('id="smsInviteEnabled"'));assert(!html.includes("$('#smsInviteEnabled')"));
 assert(html.includes('id="smsOrderReady"'));assert(html.includes('پیامک تأیید سفارش'));assert(html.includes('پیامک رد یا لغو سفارش'));
 const nodes=new Map(),ctx={smsData:{balance:0,smsPrice:100,gatewayConfigured:true,settings:{enabled:true,orderReadyEnabled:true},transactions:[],payments:[]},$:selector=>{if(!nodes.has(selector))nodes.set(selector,{});return nodes.get(selector)},money:String,esc:String,dateFa:String};
 const line=html.split('\n').find(line=>line.startsWith('function renderSmsSettings()'));
 vm.createContext(ctx);vm.runInContext(line+';renderSmsSettings();',ctx);
 assert.equal(nodes.get('#smsOrderReady').checked,true);assert.equal(nodes.get('#smsBookingApproved').checked,true);
 ctx.smsData.settings.orderReadyEnabled=false;vm.runInContext('renderSmsSettings()',ctx);assert.equal(nodes.get('#smsOrderReady').checked,false);
});
test('PostgreSQL enforces sponsorship boundaries for real test-shop ownership and active admin mobiles',async()=>{
 const {PGlite}=require(process.env.PB_PGLITE_PATH||'@electric-sql/pglite');
 const {shopSmsTestRecipient}=await import('../dist/api/store-order-sms.js');
 const db=new PGlite();
 try{
  await db.exec(`CREATE TABLE users(id text,mobile text,active boolean,platform_role text);CREATE TABLE equipment_rental_shops(id text,manager_mobile text);CREATE TABLE equipment_rental_shop_memberships(shop_id text,user_id text,role text,active boolean);
  INSERT INTO users VALUES('admin','09120000000',true,'platform_admin'),('owner','09120000000',true,NULL),('ordinary','09120000001',true,NULL);
  INSERT INTO equipment_rental_shops VALUES('test','09120000000'),('ordinary','09120000001'),('member-owned',NULL);
  INSERT INTO equipment_rental_shop_memberships VALUES('member-owned','owner','shop_admin',true);`);
  assert.equal(await shopSmsTestRecipient(db,'test','09120000000'),true);
  assert.equal(await shopSmsTestRecipient(db,'member-owned','09120000000'),true);
  assert.equal(await shopSmsTestRecipient(db,'ordinary','09120000000'),false);
  assert.equal(await shopSmsTestRecipient(db,'test','09120000001'),false);
  await db.exec("UPDATE users SET active=false WHERE id='admin'");
  assert.equal(await shopSmsTestRecipient(db,'test','09120000000'),false);
 }finally{await db.close()}
});
