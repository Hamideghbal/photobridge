'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('R1665 receipt supports coworker and direct customer, bold print, name and phone',()=>{
 const src=fs.readFileSync('scripts/r1665-thermal-invoice.js.txt','utf8');
 const ctx={_n:v=>String(v).replace(/</g,'&lt;'),V:v=>String(v),vh:o=>o.items||[],ph:r=>r.description,vn:()=> '۱۴۰۵/۰۸/۱۶'};
 vm.createContext(ctx);vm.runInContext(src,ctx);
 const base={number:22,order_number:36,customer_name:'استودیو بهار',customer_mobile:'09120000000',lab_name:'چاپ مثبت',items:[{description:'چاپ ۱۵×۲۱',quantity:2,unitPrice:30000,lineTotal:60000}],subtotal:60000,total:60000,paid_total:10000,balance:50000,customer_total_debt:75000};
 const coworker=ctx.pb1665Thermal({...base,customer_kind:'coworker'},'lab');
 const customer=ctx.pb1665Thermal({...base,customer_kind:'customer',customer_name:'مشتری حضوری'},'lab');
 for(const html of [coworker,customer]){
  assert(html.includes('size:80mm auto'));
  assert(html.includes('font-weight:900'));
  assert(html.includes('09120000000'));
  assert(html.includes('جمع بدهی حساب:'));
  assert(html.includes('75000'));
  assert(html.includes('شرح'));
  assert(html.includes('60000'));
 }
 assert(coworker.includes('فاکتور همکار'));
 assert(customer.includes('فاکتور مشتری'));
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
