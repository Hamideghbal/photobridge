'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {Client}=require('pg');
test('real SQL separates photographer and free customer sharing customer membership, then renders all three labels',async()=>{
 assert(process.env.RECEIPT_TEST_DATABASE_URL,'use an isolated test database');
 const db=new Client({connectionString:process.env.RECEIPT_TEST_DATABASE_URL});await db.connect();
 try{
  await db.query('BEGIN');
  await db.query("CREATE TEMP TABLE lab_memberships(lab_id text,user_id text,role text CHECK(role IN ('lab_admin','customer')),active boolean)");
  await db.query("INSERT INTO lab_memberships VALUES('lab','person','customer',true)");
  const {invoiceReceiptPartySql}=await import('./r1674-invoice-api-parties.mjs');
  const ctx={vh:t=>t.items||[],ph:r=>r.description};vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('scripts/r1674-direct-customer-invoices.js.txt','utf8')+'\n'+fs.readFileSync('scripts/r1698-approved-site-thermal.js.txt','utf8'),ctx);
  for(const [source,photographer,expected] of [['photographer',true,'coworker'],['photographer',false,'customer'],['walkin',true,'customer'],['walkin',false,'customer'],['manual_invoice',true,'customer']]){
   const result=await db.query(`SELECT ${invoiceReceiptPartySql} party_membership_role FROM (SELECT 'lab'::text lab_id,'person'::text customer_id,$1::text source) o CROSS JOIN (SELECT $2::boolean photographer_enabled) u`,[source,photographer]);
   const role=result.rows[0].party_membership_role;assert.equal(role,expected,source+' '+photographer);
   const direct=ctx.pb1674DirectCustomer({party_membership_role:role,order_source:source});
   assert.equal(direct,expected==='customer');
   const html=ctx.pbR1698ApprovedThermal({customer_name:'نمونه',customer_mobile:'09120000000',items:[]},direct);
   for(const label of direct?['رسید مشتری','<b>مشتری:</b>','شماره مشتری']:['رسید همکار','<b>عکاس:</b>','شماره عکاس'])assert(html.includes(label),label);
   assert(html.includes('padding:2mm 4mm 3mm'));
  }
 }finally{await db.query('ROLLBACK');await db.end();}
});
