const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const bundle=read('dist/web/assets/index-UIRefine-v655-r84.js');
const intake=read('dist/web/photobridge-r1137-lab-local-intake.js');
const birthday=read('dist/web/photobridge-lab-birthday-v774.js');
const html=read('dist/web/index.html');
const exportJs=read('dist/web/photobridge-r1201-lab-invoice-export.js');
test('ready/delivered and order detail have invoice but no duplicate PDF actions',()=>{
 assert(!bundle.includes('le.invoice_id&&le.invoice_pdf_ready&&e.jsx("button"'));
 assert(!bundle.includes('y.invoice.pdf_ready&&e.jsx("button"'));
 assert(bundle.includes('le.invoice_id&&e.jsx("button",{className:"miniInvoiceBtn"'));
});
test('accounting invoices present view and correction, accounting toggle last, without files and PDF duplicates',()=>{
 const start=bundle.indexOf('w==="invoices"&&e.jsxs("div",{className:"invoiceTableCard');
 const end=bundle.indexOf('w==="payments"&&e.jsx',start);
 assert(start>0&&end>start);
 const rows=bundle.slice(start,end);
 assert(!rows.includes('className:"miniOrderFilesBtn"'));
 // R1201's own regression suite verifies the exact action order; this
 // follow-up only checks that the actions remain in the filtered invoice list.
 assert(rows.includes('className:"miniCorrectionBtn"'));
 assert(rows.includes('className:"externalAccountingBtn "'));
 assert(bundle.includes('t==="lab"?null:e.jsx("button",{disabled:!a.pdf_ready'));
});
test('print and PDF share invoice preview DOM and never emit a second template',()=>{
 assert(bundle.includes('window.pb1201InvoiceExport?.("print")'));
 assert(bundle.includes('window.pb1201InvoiceExport?.("pdf")'));
 assert(exportJs.includes("document.querySelector('.globalInvoicePreviewLayer .invoicePaper')"));
 assert(exportJs.includes('const copy = root.cloneNode(true)'));
 assert(exportJs.includes('windowRef.print()'));
 assert(exportJs.includes('Save as PDF'));
});
test('invoice counters use filtered range, distinguish original registered and unregistered invoices',()=>{
 assert(bundle.includes('className:"pb1201InvoiceToday"'));
 assert(bundle.includes('className:"pb1201InvoiceCounts"'));
 assert(bundle.includes('Ve.filter(Je=>Je.document_type!=="discount"&&Je.document_type!=="correction")'));
 assert(bundle.includes('Boolean(Je.external_accounting_recorded)'));
 assert(bundle.includes('!Je.external_accounting_recorded'));
});
test('payment form uses previously selected customer, without redundant selector',()=>{
 const start=bundle.indexOf('B&&e.jsxs(On,{title:"ثبت دریافت از عکاسی"'),end=bundle.indexOf('ae&&e.jsxs(On,{title:',start);
 assert(start>0&&end>start);
 const modal=bundle.slice(start,end);
 assert(!modal.includes('children:["عکاسی",'));
 assert(modal.includes('value:He.invoiceId'));
 assert(bundle.includes('Ye=()=>{ft({customerId:z||""'));
});
test('birthday entry is only inside general settings; both walk-in modes show loading immediately',()=>{
 assert(bundle.includes('className:"pb1201BirthdaySettingsButton"'));
 assert(birthday.includes('window.pb774OpenBirthdayCampaign=open;'));
 assert(!birthday.includes('setInterval(mount,900);mount();'));
 assert(intake.includes('pb1201IntakeLoading'));
 const i=intake.indexOf('prep.showModal()'),j=intake.indexOf("api('/api/lab/delegated-orders/bootstrap')",i);
 assert(i>0&&j>i);
 assert(html.includes('/photobridge-r1201-lab-invoice-export.js?v=r1201'));
 assert(html.includes('/photobridge-r1201-lab-finance-invoice.css?v=r1201'));
});
