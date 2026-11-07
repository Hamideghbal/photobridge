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
