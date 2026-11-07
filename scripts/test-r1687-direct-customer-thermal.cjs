'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('customer membership is checked in generated finance SQL',()=>{
 const a=fs.readFileSync('scripts/r1665-finance-party-sql.mjs','utf8');
 const b=fs.readFileSync('scripts/r1674-invoice-api-parties.mjs','utf8');
 for(const s of [a,b])assert(s.includes("pb_member.role='customer' AND pb_member.active=true"));
});
test('direct customers print their own receipt even on legacy manual orders',()=>{
 const src=fs.readFileSync('scripts/r1674-direct-customer-invoices.js.txt','utf8');
 const ctx={_n:x=>String(x??''),V:x=>String(x??''),vh:t=>t.items||[],ph:r=>r.description,vn:()=> '1405/08/16'};
 vm.createContext(ctx);vm.runInContext(src,ctx);
 for(const sample of [{customer_kind:'customer',order_source:'manual'},{customer_kind:'coworker',order_source:'walkin',walkin_customer_name:'مریم'},{order_source:'walkin'},{order_source:'manual_invoice'},{customer_kind:'customer',order_source:'photographer'}])assert(ctx.pb1674DirectCustomer(sample));
 for(const sample of [{customer_kind:'coworker',order_source:'manual',customer_name:'آتلیه'},{customer_kind:'coworker',order_source:'photographer'},{customer_kind:'coworker',walkin_customer_name:'مریم'},{order_source:'photographer',walkin_customer_name:'old direct name'},{order_source:'photographer',photographer_id:'studio-uuid',customer_kind:'customer'},{order_source:'manual_invoice',studio_name:'آتلیه'},{}])assert(!ctx.pb1674DirectCustomer(sample));
 const t={number:7,customer_kind:'customer',direct_customer_name:'مریم',direct_customer_mobile:'09120000000',lab_phone:'02144440000',lab_address:'نشانی لابراتوار',total:45000,customer_total_debt:800000,items:[{description:'چاپ 10x15',quantity:1,unitPrice:45000,lineTotal:45000}]};
 const html=ctx.pb1674CustomerThermal(t);for(const str of ['فاکتور مشتری آزاد','مریم','09120000000','02144440000','نشانی لابراتوار'])assert(html.includes(str));
 for(const str of ['عکاسی','جمع بدهی','800000'])assert(!html.includes(str));
});
test('final build patches both site and native snapshot',()=>{
 const script=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');assert(script.indexOf("await deployStep('./enable-r1687-direct-customer-thermal.mjs')")>script.indexOf("await deployStep('./enable-r1682-direct-customer-order-flow.mjs')"));
 const patch=fs.readFileSync('scripts/enable-r1687-direct-customer-thermal.mjs','utf8');assert(patch.includes("['dist/web','dist/web/lab-desktop-ui']"));assert(patch.includes('row.sha256=sha('));assert(patch.includes('if(live===1)return s'));
});
