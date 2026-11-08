'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
test('R1698 approved customer and photographer thermal samples use the same framed layout',()=>{
 const source=fs.readFileSync('scripts/r1698-approved-site-thermal.js.txt','utf8');
 const context={vh:t=>t.items||[],ph:r=>r.description};vm.createContext(context);vm.runInContext(source,context);
 const obj={number:123,issued_at:'2026-11-07T15:00:00Z',lab_name:'لابراتوار نمونه',lab_phone:'0261234567',lab_address:'کرج، فردیس',customer_name:'آتلیه نگار',direct_customer_name:'مریم',direct_customer_mobile:'09121111111',customer_mobile:'09120000000',total:90000,paid_total:10000,customer_total_debt:450000,items:[{description:'چاپ ۱۵×۲۱',quantity:2,unitPrice:45000,lineTotal:90000}]};
 for(const direct of [true,false]){
  const html=context.pbR1698ApprovedThermal(obj,direct);
  for(const match of ['size:80mm auto','padding:2mm 4mm 3mm','class="frame"','class="contact"','کالا / خدمات','لابراتوار عکاسی','تلفن لابراتوار','0261234567','کرج، فردیس','۹۰٬۰۰۰','هزار','مانده همین فاکتور'])assert(html.includes(match),match);
  assert(!html.includes('مشخصات مشتری آزاد'));assert(!html.includes('رسید خدمات چاپ و آلبوم'));
 }
 const free=context.pbR1698ApprovedThermal(obj,true);
 assert(free.includes('مشتری:'));assert(free.includes('شماره مشتری'));assert(free.includes('09121111111'));assert(!free.includes('عکاس:'));assert(free.includes('لابراتوار عکاسی'));assert(free.includes('رسید مشتری'));assert(!free.includes('شماره عکاس'));assert(!free.includes('مانده کل حساب شما'));assert(!free.includes('۴۵۰٬۰۰۰'));
 const studio=context.pbR1698ApprovedThermal(obj,false);
 assert(studio.includes('عکاس:'));assert(!studio.includes('رسید مشتری'));assert(!studio.includes('شماره مشتری:'));;assert(studio.includes('رسید همکار'));assert(studio.includes('شماره عکاس'));assert(studio.includes('شماره عکاس'));assert(studio.includes('09120000000'));assert(studio.includes('مانده حساب از قبل'));assert(studio.includes('مانده کل حساب شما'));assert(studio.includes('۴۵۰٬۰۰۰'));
 const escaped=context.pbR1698ApprovedThermal({...obj,direct_customer_name:'<img src=x>'},true);
 assert(escaped.includes('&lt;img src=x&gt;'));assert(!escaped.includes('<img src=x>'));
 assert.equal(context.pbR1698Words(600000),'ششصد هزار');
});
test('R1698 printed routes and native manifest are updated after the previous invoice steps',()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.indexOf("await deployStep('./enable-r1698-approved-receipts.mjs')")>build.indexOf("await deployStep('./enable-r1687-direct-customer-thermal.mjs')"));
 const stage=fs.readFileSync('scripts/enable-r1698-approved-receipts.mjs','utf8');
 assert(stage.includes("['dist/web','dist/web/lab-desktop-ui']"));
 assert(stage.includes("pbR1698ApprovedThermal(t,pb1674DirectCustomer(t))"));
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(js.includes('function pbR1698ApprovedThermal('),root);
  assert(js.includes('padding:2mm 4mm 3mm'),root+' paper margins');
  const partySource=fs.readFileSync('scripts/r1674-direct-customer-invoices.js.txt','utf8');
  const partyFunction=partySource.slice(0,partySource.indexOf('function pb1674CustomerName'));
  assert(js.includes(partyFunction),root+' latest party detection');
  assert(js.includes('pbR1698ApprovedThermal(t,pb1674DirectCustomer(t))'),root);
  assert(!js.includes('pb1674DirectCustomer(t)?pb1674CustomerThermal(t):pb1665Thermal(t,a)'),root);
  assert(fs.readFileSync(root+'/index.html','utf8').includes('approvedThermal=r1708'));
 }
 const root='dist/web/lab-desktop-ui',m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 for(const name of ['index.html','assets/index-UIRefine-v655-r84.js']){
  const row=m.files.find(x=>x.name===name);assert(row);
  assert.equal(row.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
});
