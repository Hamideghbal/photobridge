'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const web='dist/web';
test('R1661 customer app mounts the existing invoice preview outside finance tab',()=>{
 const js=fs.readFileSync(web+'/assets/index-UIRefine-v655-r84.js','utf8');
 const start=js.indexOf('function Hf({me:t,onLogout:a,testMode:s}){');
 const h=js.slice(start,js.indexOf('function ',start+12));
 assert(h.includes('/* PB1661 customer invoice overlay */'));
 assert(h.includes('window.addEventListener("pb1661-invoice-open",open)'));
 assert(h.includes('Me("/api/customer/invoices")'));
 assert(h.includes('pb1661Invoice&&e.jsx(Oc,{role:"customer",invoice:pb1661Invoice'));
 assert(js.includes('pb1661NotificationInvoiceButton'));
});
test('R1661 foreground push and SW click never navigate an open photographer invoice tab',()=>{
 const push=fs.readFileSync(web+'/photobridge-push-v728.js','utf8');
 const sw=fs.readFileSync(web+'/photobridge-sw-v710.js','utf8');
 assert(push.includes('if(pb1661OpenInvoice(payload))el.remove();else location.assign'));
 assert(push.includes("data?.type!=='PB1661_OPEN_INVOICE'"));
 assert(sw.includes("type:'PB1661_OPEN_INVOICE',invoiceId,notificationId"));
 const invoiceCase=sw.slice(sw.indexOf('if(isInvoice){'),sw.indexOf('for(const client of windows)',sw.indexOf('if(isInvoice){')));
 assert(!invoiceCase.includes('client.navigate('));
 assert(invoiceCase.includes("'/photographer/gallery?'"));
});
test('R1661 cache busts both JS assets and runs after R1660',()=>{
 const html=fs.readFileSync(web+'/index.html','utf8');
 assert.equal(html.split('invoiceOverlay=r1661').length-1,2);
 assert.equal(html.split('/photobridge-r1661-invoice-notification.css?v=r1661').length-1,1);
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.indexOf("await deployStep('./enable-r1661-photographer-invoice-overlay.mjs')")>
        build.indexOf("await deployStep('./enable-r1660-mobile-lab-order-number.mjs')"));
});

test('R1663: service worker VERSION is optional when installer cache busts the worker URL',()=>{
 const installer=fs.readFileSync('scripts/enable-r1661-photographer-invoice-overlay.mjs','utf8');
 assert(installer.includes("if(versions.length===1)worker=worker.replace(swVersion"));
 assert(installer.includes("keeping generated worker version (URL cache-busted)"));
 assert(!installer.includes("throw Error('R1661 SW version"));
 assert(installer.includes("withInvoiceServiceWorkerRevision(push)"));
});

test('R1667: SW invoice cache key preserves existing revisions and is idempotent',async()=>{
 const {withInvoiceServiceWorkerRevision:fix}=await import('./r1661-sw-registration.mjs');
 const samples=[
  ["const SW='/photobridge-sw-v710.js?gallery=r1318';","gallery=r1318&invoiceModal=r1661"],
  ["const SW='/photobridge-sw-v710.js?gallery=r1318&other=r888';","gallery=r1318&other=r888&invoiceModal=r1661"],
  ['const SW="/photobridge-sw-v710.js?invoiceModal=old&other=r7";',"other=r7&invoiceModal=r1661"],
  ["const SW='/photobridge-sw-v710.js';","?invoiceModal=r1661"]
 ];
 for(const [before,expected] of samples){
  const after=fix(before);
  assert(after.includes(expected),before);
  assert.equal(fix(after),after,'SW revision must be idempotent');
  assert.equal(after.split('invoiceModal=r1661').length-1,1);
 }
 assert.throws(()=>fix("const SW='/unrelated.js';"),/R1661 SW registration count 0/);
 const registered=fs.readFileSync(web+'/photobridge-push-v728.js','utf8');
 const revised=fix(registered);
 assert(revised.includes('invoiceModal=r1661'));
 assert.equal(fix(revised),revised);
});
