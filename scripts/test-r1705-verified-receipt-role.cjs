'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('R1705 studio and genuine customer sharing photographer upload channel route to different receipts',()=>{
 const source=fs.readFileSync('scripts/r1674-direct-customer-invoices.js.txt','utf8');
 const render=fs.readFileSync('scripts/r1698-approved-site-thermal.js.txt','utf8');
 const ctx={vh:t=>t.items||[],ph:r=>r.description};vm.createContext(ctx);vm.runInContext(source+'\n'+render,ctx);
 const base={number:123,customer_kind:'customer',order_source:'photographer',customer_name:'عکاسی روشن',customer_mobile:'09125556677',direct_customer_name:'مشتری قبلی',direct_customer_mobile:'09129998888',lab_name:'قصر عکس',total:12000,customer_total_debt:90000,items:[{description:'چاپ',quantity:1,unitPrice:12000,lineTotal:12000}]};
 const cases=[
  {label:'actual photographer despite stale customer flag',data:{...base,party_membership_role:'coworker'},customer:false},
  {label:'unverified studio sending through photographer channel',data:{...base},customer:false},
  {label:'verified free customer using photographer upload channel',data:{...base,party_membership_role:'customer'},customer:true},
  {label:'walkin free customer',data:{...base,order_source:'walkin',party_membership_role:'customer'},customer:true},
 ];
 for(const testCase of cases){
  const actual=ctx.pb1674DirectCustomer(testCase.data);
  assert.equal(actual,testCase.customer,testCase.label);
  const html=ctx.pbR1698ApprovedThermal(testCase.data,actual);
  assert(html.includes(testCase.customer?'رسید مشتری':'رسید همکار'),testCase.label);
  assert(html.includes(testCase.customer?'شماره مشتری':'شماره عکاس'),testCase.label);
  if(!testCase.customer){assert(html.includes('عکاسی روشن'));assert(html.includes('09125556677'));assert(!html.includes('مشتری قبلی'));assert(!html.includes('09129998888'));}
 }
});
test('R1705 invoice queries return account photographer flag despite shared customer membership',async()=>{
 const source=fs.readFileSync('dist/api/server.js','utf8');
 const {withDirectCustomerIdentityFields}=await import('./r1674-invoice-api-parties.mjs');
 assert.equal(withDirectCustomerIdentityFields(source),source,'R1674 transforms are idempotent after deploy');
 assert.equal((source.match(/END party_membership_role/g)||[]).length,3);
 assert(source.includes('party_membership_role: order.party_membership_role'));
 assert(source.includes("WHEN COALESCE(u.photographer_enabled,false) THEN 'coworker'"));
 assert(source.includes("pb_member.role='customer'"));
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.indexOf("await deployStep('./enable-r1674-direct-customer-invoice.mjs')") < build.indexOf("runR1314(process.execPath,['--test','scripts/test-r1705-verified-receipt-role.cjs']"));
});
