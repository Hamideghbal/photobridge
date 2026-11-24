const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const begin=ui.indexOf('function ub({role:t,');
const end=ui.indexOf('}function hb(',begin);
const finance=ui.slice(begin,end+1);
const css=fs.readFileSync('dist/web/photobridge-r2000-photographer-finance.css','utf8');
test('R2000 photographer three tabs label payments; laboratory keeps receipts',()=>{
 assert(finance.includes(':[{value:"invoices",label:"فاکتورها"},{value:"payments",label:"پرداخت‌ها"},{value:"statement",label:"حساب معین"}]'));
 assert(finance.includes('onClick:()=>M("payments"),children:t==="lab"?"دریافت‌ها":"پرداخت‌ها"'));
 // R1420 owns the payment record rows and empty-state copy.
 const desktop=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.js','utf8');
 assert(desktop.includes("['فاکتورها','حساب معین','پرداخت‌ها'].map(label=>"));
 assert(!desktop.includes("['فاکتورها','حساب معین','دریافت‌ها'].map(label=>"));
});
test('R2000 invoice dates use existing applied date filters for photographer',()=>{
 assert(finance.includes('e.jsxs("div",{className:"invoiceRangeToolbar"'));
 assert(!finance.includes('t==="lab"&&e.jsxs("div",{className:"invoiceRangeToolbar"'));
 assert(finance.includes('className:t==="lab"?"pb1423InvoiceToolbar":"pb1423InvoiceToolbar pb2000CustomerInvoiceToolbar"'));
 for(const marker of ['_pbInvAppliedFrom','_pbInvAppliedTo','_setPbInvAppliedFrom(_pbInvFrom)','_setPbInvAppliedTo(_pbInvTo)','_setPbInvAppliedFrom("")'])assert(finance.includes(marker),marker);
});
test('R2000 summary/detailed mode with item rows and corresponding print path',()=>{
 assert.equal(finance.split('e.jsx("button",{type:"button",className:"pb1177ViewMode "').length-1,2);
 assert(finance.includes('_pb1177StmtMode==="detailed"&&Je.reference_type==="invoice"'));
 assert(finance.includes('PB1441StatementDetail,{row:Je,invoices:r}'));
 assert(finance.includes('_pb1177StmtMode==="detailed"?window.pb1176Finance?.detailed(_,r):Jy(_)'));
});
test('R2000 selected date interval totals come from ledger, not all-time summary',()=>{
 assert(finance.includes('className:"pb2000CustomerMetrics"'));
 for(const type of ['reference_type==="invoice"','reference_type==="payment"','_.summary?.closing','children:"جمع فاکتورها"','children:"پرداخت‌شده"','children:"مانده حساب"'])assert(finance.includes(type),type);
 assert(finance.includes('w!=="statement"&&e.jsx("div",{className:"financeSummary accountingSummary financeSummaryCompact"'));
 assert(css.includes('.statementFilters{'));
 assert(css.includes('flex-flow:row nowrap!important'));
 assert(css.includes('position:sticky!important'));
 assert(css.includes('.pb2000CustomerInvoiceToolbar'));
});
test('R2000 final page cache and CSS have photographer-only scope',()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8');
 const external=html.includes('photobridge-r2000-photographer-finance.css?v=r2000');
 const packed=html.match(/photobridge-boot-[a-f0-9]+\.css/)?.[0];
 assert(external||packed,'R2000 stylesheet must be loaded directly or by bundled boot CSS');
 if(packed){const boot=fs.readFileSync('dist/web/assets/'+packed,'utf8');assert(boot.includes('pb2000CustomerMetrics'),'R2000 stylesheet missing from boot CSS');}
 assert(html.includes('photographerFinance=r2000'));
 assert(!css.includes('.labRolePageScrollArea'));
 assert(ui.includes('/* PB2000 photographer finance parity */'));
});

test('R2000 historical invoice line items are read from the customer statement SQL',()=>{
 const server=fs.readFileSync('dist/api/server.js','utf8');
 const from=server.indexOf("url.pathname === '/api/customer/finance/statement'");
 const to=server.indexOf("url.pathname === '/api/customer/chat'",from);
 const route=server.slice(from,to);
 assert(route.includes('i.items invoice_items'));
 assert(route.includes('t.reference_id,i.id,i.number'));
 assert(route.includes("a.system_key='receivable' AND e.customer_id=$2"));
 assert(server.includes('/* PB2000 customer statement invoice items */'));
});
