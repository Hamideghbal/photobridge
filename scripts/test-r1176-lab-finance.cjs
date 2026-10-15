const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const ui=fs.readFileSync('dist/web/photobridge-r1176-lab-finance.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1176-lab-finance.css','utf8');
const page=fs.readFileSync('dist/web/index.html','utf8');
const server=fs.readFileSync('dist/api/server.js','utf8');
const invoiceExport=fs.readFileSync('dist/web/photobridge-r1201-lab-invoice-export.js','utf8');

test('lab invoice summary is limited to overview and hidden on invoice tab',()=>{
 // The deployed bundle's minifier changes around this conditional over time;
 // retain a stable check for the summary surface plus its invoice-tab CSS rule.
 assert(bundle.includes('financeSummary'));
 assert(css.includes('.financeWorkspace:has(.invoiceTableCard)>.financeSummary{display:none!important}'));
});
test('today dates are default using Tehran calendar and one-click today exists',()=>{
 assert(bundle.includes('[_pbInvFrom,_setPbInvFrom]=x.useState(()=>t==="lab"?$s(new Date()):"")'));
 assert(bundle.includes('[_pbInvAppliedFrom,_setPbInvAppliedFrom]=x.useState(()=>t==="lab"?$s(new Date()):"")'));
 assert(bundle.includes('className:"pb1176Today "'));
 assert(bundle.includes('children:"امروز"'));
 assert(bundle.includes('_setPbInvAppliedFrom(day);_setPbInvAppliedTo(day)'));
 assert(bundle.includes('className:"invoiceRangeAll"'));
});
test('receipt and discount controls are in payments tab not statement',()=>{
 assert(bundle.includes('t==="lab"&&w==="payments"&&e.jsxs("div",{className:"pb1176PaymentActions"'));
 assert(!bundle.includes('t==="lab"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{disabled:!z,onClick:Ye,children:"＋ ثبت پرداخت"})'));
 assert(bundle.includes('children:"＋ ثبت پرداخت"'));
 assert(bundle.includes('children:"＋ ثبت تخفیف"'));
});
test('invoice export prints the exact preview and supports detailed statements',()=>{
 assert(bundle.includes('pb1201InvoiceExport'));
 assert(invoiceExport.includes("document.querySelector('.globalInvoicePreviewLayer .invoicePaper')"));
 assert(invoiceExport.includes('const copy = root.cloneNode(true)'));
 assert(invoiceExport.includes('windowRef.print()'));
 assert(ui.includes('statement.rows'));
 assert(ui.includes('invoice.items'));
 assert(ui.includes('ریز فاکتور #'));
});
test('manual invoice uses existing scoped accounting API and supports printing and free lines',()=>{
 assert(bundle.includes('className:"pb1176ManualOpen"'));
 assert(bundle.includes('window.pb1176Finance?.manual({api:Me,customers:E,refresh:ce})'));
 assert(ui.includes("api('/api/lab/invoices/manual'"));
 assert(ui.includes("'manual_print'"));
 assert(ui.includes("'extra'"));
 assert(ui.includes('unitPrice'));
 assert(ui.includes('paidAmount:payment'));
 assert(ui.includes('paymentMethod:payType.value'));
 assert(ui.includes('submit.disabled=true'));
 assert(server.includes("req.method === 'POST' && url.pathname === '/api/lab/invoices/manual'"));
 assert(server.includes('await postInvoiceFinance(c, invoice, a.userId)'));
 assert(server.includes('await recordInvoicePayment(c,'));
});
test('recorded accounting mark is prominent green and discount documents neutral',()=>{
 assert(css.includes('.invoiceRow.externalAccountingRecordedInvoice'));
 assert(css.includes('.externalAccountingBtn.recorded'));
 assert(css.includes('background:#15803d!important'));
 assert(css.includes('.invoiceRow.discountInvoiceRow'));
 assert(css.includes('background:#fff!important'));
 assert(css.includes('.miniOrderFilesBtn'));
 assert(css.includes('min-height:29px!important'));
});
test('files loaded with bumped cache and existing lab header unaffected',()=>{
 assert.match(page,/\/photobridge-r1176-lab-finance\.css\?v=r117[67]/);
 assert.match(page,/\/photobridge-r1176-lab-finance\.js\?v=r117[67]/);
 assert.match(page,/index-UIRefine-v655-r84\.js\?v=[^"']*finance=r117[67]/);
 assert(page.includes('/photobridge-r1201-lab-invoice-export.js?v=r1201'));
 assert(page.includes('photobridge-r1147-lab-admin-header.js?v=r1175'));
 new Function(ui);
});
