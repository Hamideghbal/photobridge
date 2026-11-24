/* R2000 — photographer finance presentation parity, no accounting writes. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=path=>fs.readFileSync(path,'utf8');
const write=(path,value)=>fs.writeFileSync(path,value);
function once(text,from,to,label){const n=text.split(from).length-1;if(n!==1)throw Error('[R2000] '+label+': '+n);return text.replace(from,to)}
const bundlePath='dist/web/assets/index-UIRefine-v655-r84.js';
let bundle=read(bundlePath);
if(!bundle.includes('/* PB2000 photographer finance parity */')){
 const begin=bundle.indexOf('function ub({role:t,'),end=bundle.indexOf('}function hb(',begin);
 if(begin<0||end<begin)throw Error('[R2000] finance component not found');
 let part=bundle.slice(begin,end+1);
 part=once(part,':[{value:"invoices",label:"فاکتورها"},{value:"payments",label:"دریافت‌ها"},{value:"statement",label:"حساب معین"}]',':[{value:"invoices",label:"فاکتورها"},{value:"payments",label:"پرداخت‌ها"},{value:"statement",label:"حساب معین"}]','picker payments label');
 part=once(part,'onClick:()=>M("payments"),children:"دریافت‌ها"','onClick:()=>M("payments"),children:t==="lab"?"دریافت‌ها":"پرداخت‌ها"','tab payments label');
// R1420 replaces the original payment-empty markup with its own payment list; keep that rendered copy unchanged.
 part=once(part,'t==="lab"&&e.jsxs("div",{className:"invoiceRangeToolbar"','e.jsxs("div",{className:"invoiceRangeToolbar"','invoice date range enable');
 part=once(part,'className:t==="lab"?"pb1423InvoiceToolbar":"pb1423OtherInvoiceToolbar"','className:t==="lab"?"pb1423InvoiceToolbar":"pb1423InvoiceToolbar pb2000CustomerInvoiceToolbar"','invoice header match');
 const modes='t==="lab"&&e.jsx("button",{type:"button",className:"pb1177ViewMode "';
 if(part.split(modes).length!==3)throw Error('[R2000] two statement view buttons missing');
 part=part.split(modes).join('e.jsx("button",{type:"button",className:"pb1177ViewMode "');
 part=once(part,'t==="lab"&&_pb1177StmtMode==="detailed"&&Je.reference_type==="invoice"','_pb1177StmtMode==="detailed"&&Je.reference_type==="invoice"','invoice item detail');
 if(!part.includes('_pb1177StmtMode==="detailed"?window.pb1176Finance?.detailed(_,r):Jy(_)'))throw Error('[R2000] print mode must be respected');
 part=once(part,'p&&(t!=="lab"||w==="overview")&&e.jsx("div",{className:"financeSummary accountingSummary financeSummaryCompact"','p&&(t!=="lab"||w==="overview")&&w!=="statement"&&e.jsx("div",{className:"financeSummary accountingSummary financeSummaryCompact"','hide duplicate all-time summary only for statement');
 const old='e.jsx("button",{className:"primary",disabled:D||t==="lab"&&!z,onClick:()=>b(),children:D?"در حال محاسبه…":"نمایش حساب"})]})';
 const next='e.jsx("button",{className:"primary",disabled:D||t==="lab"&&!z,onClick:()=>b(),children:D?"در حال محاسبه…":"نمایش حساب"}),t==="customer"&&e.jsxs("div",{className:"pb2000CustomerMetrics",role:"status","aria-live":"polite",children:[e.jsxs("span",{children:[e.jsx("small",{children:"جمع فاکتورها"}),e.jsx("b",{children:_?Xe(st.filter(Je=>Je.reference_type==="invoice").reduce((sum,Je)=>sum+Number(Je.debit||0)-Number(Je.credit||0),0)):"—"})]}),e.jsxs("span",{children:[e.jsx("small",{children:"پرداخت‌شده"}),e.jsx("b",{children:_?Xe(st.filter(Je=>Je.reference_type==="payment").reduce((sum,Je)=>sum+Number(Je.credit||0)-Number(Je.debit||0),0)):"—"})]}),e.jsxs("span",{className:"pb2000Balance",children:[e.jsx("small",{children:"مانده حساب"}),e.jsx("b",{children:_?Xe(_.summary?.closing):"—"})]})]})]})';
 part=once(part,old,next,'range totals same row');
 bundle=bundle.slice(0,begin)+part+bundle.slice(end+1)+'\n/* PB2000 photographer finance parity */\n';
 write(bundlePath,bundle);
}
execFileSync(process.execPath,['--check',bundlePath],{stdio:'inherit'});
const desktopPath='dist/web/photobridge-r1126-desktop-navigation.js';
let desktop=read(desktopPath);
if(!desktop.includes('/* PB2000 photographer payments header */')){
 desktop=once(desktop,"['فاکتورها','حساب معین','دریافت‌ها'].map(label=>","['فاکتورها','حساب معین','پرداخت‌ها'].map(label=>",'desktop photographer tab proxy');
 desktop+='\n/* PB2000 photographer payments header */\n';
 write(desktopPath,desktop);
}
execFileSync(process.execPath,['--check',desktopPath],{stdio:'inherit'});

// The laboratory detailed ledger already returns historical invoice line items
// directly with statement rows. Do the same read-only enrichment for the
// photographer: the separate invoices list is limited to recent documents.
const serverPath='dist/api/server.js';
let server=read(serverPath);
if(!server.includes('/* PB2000 customer statement invoice items */')){
 const start=server.indexOf("if (req.method === 'GET' && url.pathname === '/api/customer/finance/statement') {");
 const end=server.indexOf("if (req.method === 'GET' && url.pathname === '/api/customer/chat') {",start);
 if(start<0||end<start)throw Error('[R2000] customer statement SQL route missing');
 let part=server.slice(start,end);
 part=once(part,'i.number invoice_number,p.method payment_method','i.items invoice_items,i.number invoice_number,p.method payment_method','customer invoice detail select');
 const oldGroup=part.includes('t.reference_id,i.number,i.offline_reference,p.method')?
   't.reference_id,i.number,i.offline_reference,p.method':'t.reference_id,i.number,p.method';
 part=once(part,oldGroup,oldGroup.replace('i.number','i.id,i.number'),'customer detail grouping by primary key');
 server=server.slice(0,start)+part+server.slice(end)+'\n/* PB2000 customer statement invoice items */\n';
 write(serverPath,server);
}
execFileSync(process.execPath,['--check',serverPath],{stdio:'inherit'});

const cssName='photobridge-r2000-photographer-finance.css';
fs.copyFileSync('scripts/r2000-photographer-finance.css','dist/web/'+cssName);
const htmlPath='dist/web/index.html';
let html=read(htmlPath);
if(!html.includes(cssName))html=once(html,'</head>','<link rel="stylesheet" href="/'+cssName+'?v=r2000"></head>','finance CSS link');
function cacheBump(name){
 const needle=name+'?';
 if(!html.includes(needle))throw Error('[R2000] missing cached URL for '+name);
 html=html.replace(needle,name+'?photographerFinance=r2000&');
}
cacheBump('index-UIRefine-v655-r84.js');
cacheBump('photobridge-r1126-desktop-navigation.js');
write(htmlPath,html);
console.log('[R2000] customer statement presentation and dates enabled');
