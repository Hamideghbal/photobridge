'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const server=fs.readFileSync('dist/api/server.js','utf8');
const begin=server.indexOf('/* PB_R1774_THERMAL_ITEM_DESCRIPTION */');
const end=server.indexOf('async function financeDocumentsForCustomer(',begin);
assert(begin>=0&&end>begin&&end-begin<4000,'R1774 invoice label formatter should be installed');
const ctx={invoicePrintTypeLabel:t=>({luster:'لاستر',silk:'سیلک',metallic:'متالیک'}[t]||t)};
vm.createContext(ctx);vm.runInContext(server.slice(begin,end),ctx);
const decorate=value=>ctx.pb1774ThermalInvoiceItems(value);
test('R1774: old invoice for chassis photo includes the addon in both native label fields',()=>{
 const old=[{sizeLabel:'۲۰×۳۰',printType:'luster',printTypeLabel:'لاستر',
  chassis:true,frame:false,quantity:3,unitPrice:260000,lineTotal:780000}];
 const decorated=decorate(old);
 assert.equal(decorated[0].description,'۲۰×۳۰ - لاستر · شاسی');
 assert.equal(decorated[0].printTypeLabel,'لاستر · شاسی');
 for(const key of ['chassis','frame','quantity','unitPrice','lineTotal','sizeLabel','printType'])
  assert.equal(decorated[0][key],old[0][key]);
 assert.equal(old[0].description,undefined,'invoice JSONB must not be mutated');
});
test('R1774: ordinary print item does not acquire chassis, label is idempotent',()=>{
 const raw=[{sizeLabel:'۱۰×۱۵',printTypeLabel:'سیلک',chassis:false,frame:false,quantity:2,unitPrice:1000,lineTotal:2000},
 {sizeLabel:'۳۰×۴۰',printTypeLabel:'لاستر',frame:true,quantity:1,unitPrice:1200,lineTotal:1200},
 {description:'20x30 - luster · شاسی',printTypeLabel:'لاستر · شاسی',chassis:true,quantity:2,unitPrice:10000,lineTotal:20000}];
 const once=decorate(raw),twice=decorate(once);
 assert.equal(once[0].description,undefined);
 assert.equal(once[0].printTypeLabel,'سیلک');
 assert.equal(once[1].description,'۳۰×۴۰ - لاستر · قاب');
 assert.equal(once[2].description,'20x30 - luster · شاسی');
 assert.equal(once[2].printTypeLabel,'لاستر · شاسی');
 assert.deepEqual(JSON.parse(JSON.stringify(twice)),JSON.parse(JSON.stringify(once)));
});
test('R1774: both JSONB and legacy JSON string invoice item sets are supported',()=>{
 const input=[{sizeLabel:'۲۰×۳۰',printTypeLabel:'لاستر',chassis:true,quantity:1,unitPrice:5000,lineTotal:5000}];
 assert.equal(decorate(JSON.stringify(input))[0].description,'۲۰×۳۰ - لاستر · شاسی');
 assert.equal(decorate('{invalid json'),'{invalid json');
 assert.equal(decorate(null),null);
});
test('R1774: previously issued lab finance documents and order detail decorate at read time',()=>{
 assert.match(server,/const docs = \[\.\.\.invQ\.rows\.map\(\(row\) => \(\{ \.\.\.row, items:pb1774ThermalInvoiceItems\(row\.items\), order_id:/);
 assert.match(server,/invoice: iq\.rows\[0\] \? \{\.\.\.iq\.rows\[0\],items:pb1774ThermalInvoiceItems\(iq\.rows\[0\]\.items\)\} : null/);
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.includes("await deployStep('./enable-r1774-thermal-native-chassis-description.mjs')"));
 assert(build.includes("'scripts/test-r1774-native-thermal-chassis.cjs'"));
});
test('R1774: web receipt still prints chassis only for selected items',()=>{
 const source=fs.readFileSync('scripts/r1698-approved-site-thermal.js.txt','utf8');
 const ctx={vh:t=>t.items||[],ph:x=>x.description||x.sizeLabel||'چاپ'};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const items=decorate([{sizeLabel:'۲۰×۳۰',printType:'luster',printTypeLabel:'لاستر',chassis:true,quantity:3,unitPrice:260000,lineTotal:780000},
 {sizeLabel:'۱۰×۱۵',printTypeLabel:'سیلک',chassis:false,quantity:1,unitPrice:40000,lineTotal:40000}]);
 const html=ctx.pbR1698ApprovedThermal({number:364,lab_name:'لابراتوار',customer_name:'عکاس',items,subtotal:820000,total:820000},false);
 assert(html.includes('۲۰×۳۰ - لاستر · شاسی'));
 assert(!html.includes('شاسی · شاسی'));
 assert(html.includes('۱۰×۱۵'));
 assert(html.includes('سیلک'));
});
