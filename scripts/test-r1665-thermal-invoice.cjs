'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('R1665 receipt supports coworker and direct customer, bold print, name and phone',()=>{
 const src=fs.readFileSync('scripts/r1665-thermal-invoice.js.txt','utf8');
 const ctx={_n:v=>String(v).replace(/</g,'&lt;'),V:v=>String(v),vh:o=>o.items||[],ph:r=>r.description,vn:()=> '۱۴۰۵/۰۸/۱۶'};
 vm.createContext(ctx);vm.runInContext(src,ctx);
 const base={number:22,order_number:36,customer_name:'استودیو بهار',customer_mobile:'09120000000',lab_name:'چاپ مثبت',items:[{description:'چاپ ۱۵×۲۱',quantity:2,unitPrice:30000,lineTotal:60000}],subtotal:60000,total:60000,paid_total:10000,balance:50000,customer_total_debt:75000,lab_phone:'02144556677',lab_address:'تهران، خیابان آزادی، پلاک ۱۲'};
 const coworker=ctx.pb1665Thermal({...base,customer_kind:'coworker'},'lab');
 const customer=ctx.pb1665Thermal({...base,customer_kind:'customer',customer_name:'مشتری حضوری'},'lab');
 for(const html of [coworker,customer]){
  assert(html.includes('size:80mm auto'));
  assert(html.includes('font-weight:900'));
  assert(html.includes('09120000000'));
  assert(html.includes('شماره تماس لابراتوار:'));assert(html.includes('02144556677'));assert(html.includes('آدرس لابراتوار:'));assert(html.includes('تهران، خیابان آزادی، پلاک ۱۲'));
  assert(html.includes('شرح'));
  assert(html.includes('60000'));
 }
 assert(coworker.includes('فاکتور همکار'));assert(coworker.includes('جمع بدهی حساب:'));assert(coworker.includes('75000'));
 assert(customer.includes('فاکتور مشتری'));assert(!customer.includes('جمع بدهی حساب:'));assert(!customer.includes('75000'));
});
test('R1665 lab uses thermal; customer A4 remains unchanged; API includes mobile and kind',()=>{
 const api=fs.readFileSync('dist/api/server.js','utf8');
 assert(api.includes('COALESCE(o.walkin_customer_mobile,u.mobile) customer_mobile'));
 assert(api.includes("THEN 'customer' ELSE 'coworker' END customer_kind"));
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(js.includes("a==='lab'?pb1665Thermal(t,a):Vy(t,a)"));
  assert(js.includes('@page{size:A4;margin:10mm}'));
  assert(js.includes('function pb1665Thermal(t,a){'));
 }
});

test('R1672 thermal party fields use the invoice query even when accounting rewrites customer_name',async()=>{
 const {withThermalInvoicePartyFields}=await import('./r1665-finance-party-sql.mjs');
 const tick=String.fromCharCode(96);
 const variants=[
  'COALESCE(o.walkin_customer_name,u.name)',
  '$'+'{labFinanceCustomerNameSql()}',
  'CASE WHEN u.account_deleted_at IS NULL THEN u.name ELSE u.name END'
 ];
 for(const customerExpression of variants){
  const sql='async function financeDocumentsForCustomer(c,labId,customerId){\n'+
   'const invQ = await c.query('+tick+'SELECT i.*,'+customerExpression+' customer_name,o.number order_number,o.status order_status,\n'+
   ' FROM invoices i JOIN users u ON u.id=i.customer_id JOIN orders o ON o.id=i.order_id WHERE i.lab_id=$1'+tick+',params);\n'+
   'const adjQ = await c.query('+tick+'SELECT x.* FROM finance_customer_adjustments x'+tick+');}\n'+
   'function elsewhere(){return "customer_name,o.number order_number"}';
  const patched=withThermalInvoicePartyFields(sql);
  assert(patched.includes(customerExpression+' customer_name'), 'customer display must remain untouched');
  assert.equal(patched.split('COALESCE(o.walkin_customer_mobile,u.mobile) customer_mobile').length-1,1);
  assert.equal(patched.split('END customer_kind').length-1,1);
  assert(patched.includes("CASE WHEN o.source IN ('walkin','manual_invoice')"));
  assert(patched.includes('function elsewhere(){return "customer_name,o.number order_number"}'));
  assert.equal(withThermalInvoicePartyFields(patched),patched);
 }
 assert.throws(()=>withThermalInvoicePartyFields('const invQ=1'),/finance documents function count/);
});

test('R1673 insert fields independently of the rewritten or absent order-number projection',async()=>{
 const {withThermalInvoicePartyFields}=await import('./r1665-finance-party-sql.mjs');
 const tick=String.fromCharCode(96);
 for(const orderColumn of [
   'o.number order_number',
   'COALESCE(o.number,0)::integer AS order_number',
   'o.number AS number_of_order',
   'o.status order_status'
 ]){
  const sql='async function financeDocumentsForCustomer(c,labId,customerId){\n'+
   'const invQ=await c.query('+tick+'SELECT i.*,COALESCE(o.walkin_customer_name,u.name) customer_name,'+
   orderColumn+',l.name lab_name\n'+
   'FROM invoices i JOIN users u ON u.id=i.customer_id JOIN orders o ON o.id=i.order_id JOIN labs l ON l.id=i.lab_id'+tick+');\n}';
  const patched=withThermalInvoicePartyFields(sql);
  assert(patched.includes(orderColumn));
  assert.equal(patched.split('COALESCE(o.walkin_customer_mobile,u.mobile) customer_mobile').length-1,1);
  assert.equal(patched.split('END customer_kind').length-1,1);
  assert.equal(withThermalInvoicePartyFields(patched),patched);
 }
});
