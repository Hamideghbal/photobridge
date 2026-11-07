'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
test('R1674 direct customers have their own thermal/A4 templates without photographer debt',()=>{
 const source=fs.readFileSync('scripts/r1674-direct-customer-invoices.js.txt','utf8');
 const ctx={_n:v=>String(v??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])),
   V:v=>String(v??''),vh:o=>o.items||[],ph:r=>r.description,vn:()=> '۱۴۰۵/۰۸/۱۶'};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const base={number:90,order_number:123,order_source:'walkin',customer_kind:'customer',
  customer_name:'نام عمومی',direct_customer_name:'مشتری رضا',customer_mobile:'09120000000',
  lab_name:'لابراتوار مثبت',items:[{description:'چاپ ۲۰×۳۰',quantity:2,unitPrice:45000,lineTotal:90000}],
  subtotal:90000,total:90000,customer_total_debt:3000000,account_balance_at_issue:3000000};
 for(const html of [ctx.pb1674CustomerA4(base),ctx.pb1674CustomerThermal(base)]){
  assert(html.includes('مشتری رضا'));assert(html.includes('09120000000'));
  assert(html.includes('چاپ ۲۰×۳۰'));assert(html.includes('90000'));
  assert(html.includes('مبلغ کل فاکتور'));assert(html.includes('مشتری آزاد'));
  assert(!html.includes('جمع بدهی'));assert(!html.includes('عکاسی'));
  assert(!html.includes('3000000'));assert(!html.includes('نام عمومی'));
 }
 assert(ctx.pb1674CustomerA4(base).includes('size:A4'));
 assert(ctx.pb1674CustomerThermal(base).includes('size:80mm auto'));
 assert(ctx.pb1674DirectCustomer({order_source:'manual_invoice'}));
 assert(ctx.pb1674DirectCustomer({customer_kind:'customer'}));
 assert(!ctx.pb1674DirectCustomer({customer_kind:'coworker',order_source:'walkin'}));
 assert(!ctx.pb1674DirectCustomer({order_source:'photographer'}));
});
test('R1674 PDF renderer uses direct name/mobile/total and never uses customer account debt',async()=>{
 const source=fs.readFileSync('scripts/r1674-direct-customer-invoices.js.txt','utf8');
 const drawn=[],canvas={width:0,height:0,getContext(){return {
  fillRect(){},strokeRect(){},fillText(v){drawn.push(String(v))},
  set fillStyle(v){},set font(v){},set direction(v){},set textAlign(v){},set strokeStyle(v){}
 }}};
 const ctx={document:{createElement:()=>canvas},_n:x=>String(x),V:x=>String(x),
  vh:o=>o.items||[],ph:r=>r.description,vn:()=> '۱۴۰۵/۰۸/۱۶',mh:async()=>new Uint8Array([1]),
  hh:()=>new Uint8Array([2]),Blob};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const pdf=await ctx.pb1674CustomerPdf({number:9,customer_kind:'customer',direct_customer_name:'مریم',
  direct_customer_mobile:'09123456789',total:65000,customer_total_debt:9999999,
  items:[{description:'چاپ',quantity:1,unitPrice:65000,lineTotal:65000}]});
 assert.equal(pdf.type,'application/pdf');
 assert(drawn.some(x=>x.includes('مریم')));
 assert(drawn.some(x=>x.includes('09123456789')));
 assert(drawn.some(x=>x.includes('65000')));
 assert(!drawn.some(x=>x.includes('بدهی')||x.includes('9999999')||x.includes('عکاسی')));
});
test('R1674 server includes direct customer identity in both invoice listing and immediate issue',async()=>{
 const api=fs.readFileSync('dist/api/server.js','utf8');
 const {withDirectCustomerIdentityFields}=await import('./r1674-invoice-api-parties.mjs');
 assert.equal(withDirectCustomerIdentityFields(api),api);
 assert(api.includes("NULLIF(BTRIM(o.walkin_customer_name),'') direct_customer_name"));
 assert(api.includes("COALESCE(NULLIF(BTRIM(o.walkin_customer_mobile),''),u.mobile) direct_customer_mobile"));
 assert(api.includes("customer_kind: order.customer_kind"));
 assert(api.includes("order_source: order.order_source"));
 assert.equal(api.split('direct_customer_mobile: order.direct_customer_mobile').length-1,2);
});
test('R1674 web/native preview/print/PDF route by customer type while preserving coworker templates',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(js.includes('if(pb1674DirectCustomer(t))return pb1674CustomerA4(t);'),root);
  assert(js.includes('if(pb1674DirectCustomer(t))return pb1674CustomerPdf(t);'),root);
  assert(js.includes('pb1674DirectCustomer(t)?pb1674CustomerThermal(t):pb1665Thermal(t,a)'),root);
  assert(js.includes('!pb1674DirectCustomer(a)&&e.jsxs("div",{className:"invoiceAccountDebt"'),root);
  assert(js.includes('(pb1674DirectCustomer(a)?o>0:o>0||l>0)&&e.jsxs("div",{className:"invoicePaymentMini"'),root);
  assert(js.includes('!pb1674DirectCustomer(a)&&e.jsxs("span",{children:["مانده این فاکتور: "'),root);
  assert(js.includes('Wy(a,"customer-a4")'),root);
  assert(js.includes('children:"شماره موبایل مشتری"'),root);
  assert(js.includes('function Vy(t,a){if(pb1674DirectCustomer(t))return pb1674CustomerA4(t);'),root);
  assert(js.includes('className:"accountDebt"')||js.includes('جمع بدهی عکاسی'),root);
  assert.equal(fs.readFileSync(root+'/index.html','utf8').split('directCustomerInvoice=r1674').length-1,1);
 }
 const root='dist/web/lab-desktop-ui',m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 for(const name of ['index.html','assets/index-UIRefine-v655-r84.js']){
  const entry=m.files.find(f=>f.name===name);assert(entry);
  assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.indexOf("await deployStep('./enable-r1674-direct-customer-invoice.mjs');")>
  build.indexOf("await deployStep('./enable-r1665-thermal-invoice.mjs');"));
 assert(build.indexOf("await deployStep('./enable-r1666-iphone-heic-upload.mjs');")>
  build.indexOf("await deployStep('./enable-r1674-direct-customer-invoice.mjs');"));
});

test('R1676 preview JSX patch survives renamed minified invoice component without rewriting coworker behavior',async()=>{
 const {patchDirectCustomerPreview}=await import('./r1674-preview-patch.mjs');
 const fixture=[
  'function RenamedInvoicePreview({role:t,invoice:a,onClose:s}){',
  'className:"invoicePreviewHeadActions"',
  'className:"invoicePaperInfo"',
  'e.jsx("h2",{children:"فاکتور فروش و خدمات چاپ"})',
  'e.jsx("small",{children:t==="lab"?"مشتری / عکاسی":"صادرکننده / لابراتوار"})',
  'e.jsx("b",{children:t==="lab"?a.customer_name||"—":a.lab_name||"—"})]})',
  'e.jsx("button",{className:"invoicePrintBtn",onClick:()=>Wy(a,t),children:"چاپ فاکتور"})',
  '(o>0||l>0)&&e.jsxs("div",{className:"invoicePaymentMini",children:[e.jsxs("span",{children:["پرداخت‌شده: ",e.jsx("b",{children:V(o)})]}),e.jsxs("span",{children:["مانده این فاکتور: ",e.jsx("b",{children:V(l)})]})]})',
  'e.jsxs("div",{className:"invoiceAccountDebt"',
  '}'
 ].join(';');
 const patched=patchDirectCustomerPreview(fixture,'renamed preview');
 assert(patched.startsWith('function RenamedInvoicePreview('));
 assert(patched.includes('pb1674DirectCustomer(a)?"فاکتور خدمات مشتری آزاد"'));
 assert(patched.includes('pb1674CustomerName(a)'));
 assert(patched.includes('pb1674CustomerMobile(a)'));
 assert(patched.includes('Wy(a,"customer-a4")'));
 assert(patched.includes('!pb1674DirectCustomer(a)&&e.jsxs("div",{className:"invoiceAccountDebt"'));
 assert(patched.includes('!pb1674DirectCustomer(a)&&e.jsxs("span",{children:["مانده این فاکتور: "'));
 assert.throws(()=>patchDirectCustomerPreview('function RenamedInvoicePreview(){}','missing'),/preview landmark missing/);
});
