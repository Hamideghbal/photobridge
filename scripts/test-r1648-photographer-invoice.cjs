'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const roots=['dist/web','dist/web/lab-desktop-ui'];
test('R1648 customer invoice is placed in same-origin desktop parent above its iframe, without affecting Lab',()=>{
 for(const root of roots){
  const js=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  const start=js.indexOf('function pb1648InvoicePortal(');
  const end=js.indexOf('function tj(',start);
  assert(start>=0&&end>start,root+' invoice preview portal not found');
  const component=js.slice(start,end);
  assert.match(component,/role==="customer"&&window\.parent!==window/);
  assert.match(component,/p\.documentElement\.classList\.contains\("pb1126Desktop"\)/);
  assert.match(component,/return document\.body/);
  assert.match(component,/pb1648InvoicePortal\(t\)\)\}/);
  assert.match(component,/ownerDocument\.body/);
  assert.match(component,/ownerDocument\.defaultView/);
  assert.match(component,/t==="customer"&&pb1648InvoicePortal\(t\)!==document\.body/);
  assert.match(component,/labInvoicePreview/);
  assert.match(component,/customerInvoicePreview/);
  assert.match(component,/className:"invoicePrintBtn"/);
  assert.match(component,/className:"invoicePdfFreshBtn"/);
  assert.equal((js.match(/\/\* PB1648 photographer invoice portal \*\//g)||[]).length,1);
 }
});
test('R1648 top tabs do not rebuild on active state and invoice refresh does not collapse finance third header',()=>{
 for(const root of roots){
  const nav=fs.readFileSync(root+'/photobridge-r1126-desktop-navigation.js','utf8');
  assert.match(nav,/\/\* PB1648 stable print header/);
  assert.match(nav,/filter\(c=>!\['active','loading','pending'\]\.includes\(c\)\)/);
  assert.doesNotMatch(nav,/visible\.map\(el=>el\.outerHTML\)/);
  assert.match(nav,/const copies=\[\.\.\.row\.querySelectorAll\('\.pb1127PrintModes>button'\)\]/);
  assert.match(nav,/live\[index\]\?\.click\(\)/);
  assert.match(nav,/financeTabSelected&&financeThird\.children\.length>0/);
  assert.match(nav,/_pb1648HeaderObserver\?\.disconnect\(\)/);
 }
});
test('R1648 cache and desktop-only invoice layout are registered for website and Windows update',()=>{
 for(const root of roots){
  const html=fs.readFileSync(root+'/index.html','utf8');
  const css=fs.readFileSync(root+'/photobridge-r1648-photographer-invoice.css','utf8');
  assert.match(html,/photobridge-r1648-photographer-invoice[.]css[?]v=r1648/);
  assert.match(html,/photoInvoice=r1648/);
  assert.match(html,/invoiceStability=r1648/);
  assert.match(css,/html\.pb1126Desktop body > \.globalInvoicePreviewLayer\.invoicePreviewBack/);
  assert.match(css,/z-index:2147483640!important/);
  assert.match(css,/customerInvoicePreview\.invoiceFitModal/);
  assert.match(css,/min\(940px,calc\(100vw - 28px\)\)/);
  assert.doesNotMatch(css,/labInvoicePreview/);
 }
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 assert.equal(manifest.protocol,1);
 assert.equal(manifest.channel,'lab');
 for(const name of ['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1126-desktop-navigation.js','photobridge-r1648-photographer-invoice.css']){
  const row=manifest.files.find(item=>item.name===name);
  assert(row,'missing signed native update file '+name);
  assert.equal(row.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
});
test('R1648 is applied after the existing ledger and photographer UI stages, with production build regression',()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 const prior=build.indexOf("await deployStep('./enable-r1646-photographer-ledger.mjs')");
 const patch=build.indexOf("await deployStep('./enable-r1648-photographer-invoice-preview.mjs')");
 const verify=build.indexOf('scripts/test-r1648-photographer-invoice.cjs');
 assert(prior>=0&&patch>prior&&verify>patch);
});
