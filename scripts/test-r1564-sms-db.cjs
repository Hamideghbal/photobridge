'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{PGlite}=require(process.env.PB_PGLITE_PATH||'@electric-sql/pglite');
const root=process.env.PB_TEST_ROOT||process.cwd(),id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
test('checked completed order sends before invoice: registered customer pays, preregistration is platform-funded, replay does not resend',async()=>{
 const api=await import(pathToFileURL(path.join(root,'dist/api/lab-intake-invoice-sms.js')).href),db=new PGlite();
 try{
  await db.exec(`CREATE TABLE labs(id uuid PRIMARY KEY,name text,sms_customer_notifications_allowed boolean);CREATE TABLE users(id uuid PRIMARY KEY,mobile text);CREATE TABLE orders(id uuid PRIMARY KEY,lab_id uuid,customer_id uuid,number int,mode text,status text);CREATE TABLE invoices(id uuid PRIMARY KEY,lab_id uuid,customer_id uuid,order_id uuid,number int,total bigint);CREATE TABLE lab_delegated_order_intakes(order_id uuid,lab_id uuid);CREATE TABLE lab_memberships(lab_id uuid,user_id uuid,role text,active boolean);`);await db.exec(fs.readFileSync(path.join(root,'migrations/191_lab_intake_invoice_sms.sql'),'utf8'));
  await db.query("INSERT INTO labs VALUES($1,'آزمایشگاه',true)",[id(1)]);await db.query("INSERT INTO users VALUES($1,'09120000000'),($2,'09120000001'),($3,'09120000002')",[id(2),id(3),id(4)]);await db.query("INSERT INTO lab_memberships VALUES($1,$2,'customer',true),($1,$3,'customer',false)",[id(1),id(2),id(3)]);
  const sent=[],deps={pool:db,normalizeMobile:x=>x,sendSms:async args=>{sent.push(args);return{reference:'sent'}}};
  for(const n of [2,3]){const order=id(10+n);await db.query("INSERT INTO orders VALUES($1,$2,$3,$4,'print','downloaded')",[order,id(1),id(n),n]);await db.query('INSERT INTO lab_delegated_order_intakes VALUES($1,$2)',[order,id(1)]);await api.recordIntakeInvoiceSms(db,{labId:id(1),orderId:order,actorId:id(4),requested:true});assert.equal((await api.dispatchIntakeOrderSms(deps,id(1),order)).status,'sent');await api.dispatchIntakeOrderSms(deps,id(1),order);}
  assert.equal(sent.length,2);assert.equal(sent[0].chargePhotographerId,id(2));assert.equal(sent[1].chargePhotographerId,undefined);assert.equal(sent[1].chargeLabId,undefined);assert.equal(sent[1].metadata.payer,'platform');assert(sent.every(p=>p.message.length<=70));await api.flushIntakeInvoiceSms(deps);assert.equal(sent.length,2);
 }finally{await db.close()}
});
