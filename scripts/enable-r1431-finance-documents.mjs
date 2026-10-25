import fs from 'node:fs';
function replaceOnce(text,a,b,label){if(text.split(a).length!==2)throw Error('R1431 changed anchor '+label);return text.replace(a,b)}
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1431 finance document views */')){
 const once=(a,b)=>ui=replaceOnce(ui,a,b,a.slice(0,90));
 once('const pb1420Payments=t==="lab"?PB1420PaymentRows(h,pb1420PaymentCustomer):h;','const pb1420Payments=t==="lab"?PB1420PaymentRows(PB1431ReceiptRows(h,r),pb1420PaymentCustomer):h;');
 once('const Ve=r.filter(Je=>{','const Ve=r.filter(Je=>{if(t==="lab"&&!(Number(Je.total)>0&&["invoice","correction"].includes(Je.document_type||"invoice")))return!1;');
 once('_pbSaveAccounting=async()=>{const Je=_pbAccountingMark;','_pbSaveAccounting=async()=>{'+"const Je=_pbAccountingMark;if(Je?._pb1431ReceiptKind){const kind=Je._pb1431ReceiptKind;H(!0);try{const result=await Me(\"/api/lab/finance/receipt-marks/\"+kind+\"/\"+Je.id,{method:\"PATCH\",body:JSON.stringify({recorded:!Boolean(Je.external_accounting_recorded)})});const update=rows=>rows.map(row=>String(row.id)===String(Je.id)?{...row,...result.receipt}:row);if(kind===\"payment\")S(update);else o(update);_setPbAccountingMark(null)}catch{alert(\"تغییر علامت ثبت در حسابداری انجام نشد؛ دوباره تلاش کنید.\")}finally{H(!1)}return;}");
 const a=ui.indexOf('w==="payments"&&e.jsx("div",{className:"card financeListCard pb1420Payments"'),b=ui.indexOf(',w==="statement"',a);if(a<0||b<a)throw Error('R1431 receipt list missing');
 let part=ui.slice(a,b);
 const sub=(old,next)=>part=replaceOnce(part,old,next,'receipt list');
 sub('e.jsx("span",{children:""})','e.jsx("span",{children:"عملیات"})');
 sub('pb1420Payments.map(Je=>e.jsxs("div",{children:','pb1420Payments.map(Je=>e.jsxs("div",{className:Je.external_accounting_recorded?"pb1431ReceiptRow pb1431RecordedReceipt":"pb1431ReceiptRow",children:');

 sub('children:t==="lab"?Je.customer_name||"دریافت":Je.invoice_number?','children:t==="lab"?Je.customer_name||"دریافت":Je.invoice_number?');
 sub('children:[Je.invoice_number?','children:[Je.pb1431ReceiptKind==="discount"?"تخفیف":Je.invoice_number?');
 sub('e.jsx("span",{children:R(Je.method)})','e.jsx("span",{children:Je.pb1431ReceiptKind==="discount"?"تخفیف":R(Je.method)})');
 sub('t==="lab"&&e.jsx("button",{className:"miniCorrectionBtn",onClick:()=>ge("payment",Je),children:"اصلاحیه"})',"t===\"lab\"&&e.jsxs(\"div\",{className:\"pb1431ReceiptActions\",children:[Je.pb1431ReceiptKind!==\"discount\"&&e.jsx(\"button\",{className:\"miniCorrectionBtn\",onClick:()=>ge(\"payment\",Je),children:\"اصلاحیه\"}),e.jsx(\"button\",{className:\"pb1431ReceiptMark\",\"aria-pressed\":Boolean(Je.external_accounting_recorded),onClick:()=>_setPbAccountingMark({...Je,_pb1431ReceiptKind:Je.pb1431ReceiptKind||\"payment\"}),children:Je.external_accounting_recorded?\"✓ ثبت‌شده در حسابداری\":\"ثبت در حسابداری\"})]})");
 sub(']},Je.id))',']},String(Je.pb1431ReceiptKind||"payment")+":"+Je.id))');
 ui=ui.slice(0,a)+part+ui.slice(b);
 once('e.jsx("button",{className:"primary",disabled:D||t==="lab"&&!z,onClick:()=>b(),children:D?"در حال محاسبه…":"نمایش حساب"})','t!=="lab"&&e.jsx("button",{className:"primary",disabled:D,onClick:()=>b(),children:D?"در حال محاسبه…":"نمایش حساب"})');
 once('onClick:()=>_setPb1177StmtMode("summary"),children:"خلاصه"','disabled:D||!z,onClick:()=>{_setPb1177StmtMode("summary");b()},children:"نمایش خلاصه"');
 once('onClick:()=>_setPb1177StmtMode("detailed"),children:"جزئیات"','disabled:D||!z,onClick:()=>{_setPb1177StmtMode("detailed");b()},children:"نمایش با جزئیات"');
 once('e.jsx("button",{disabled:!_,onClick:tt,children:"PDF"})','t!=="lab"&&e.jsx("button",{disabled:!_,onClick:tt,children:"PDF"})');
 const modalStart=ui.indexOf('_pbAccountingMark&&t==="lab"'),modalEnd=ui.indexOf(',O&&t==="lab"',modalStart);if(modalStart<0||modalEnd<modalStart)throw Error('R1431 tracking modal missing');
 const modal=ui.slice(modalStart,modalEnd).replaceAll('فاکتور','سند');ui=ui.slice(0,modalStart)+modal+ui.slice(modalEnd);
 ui+='\n/* PB1431 finance document views */\nfunction PB1431ReceiptRows(payments,documents){return [...payments,...documents.filter(row=>row.document_type==="discount").map(row=>({...row,pb1431ReceiptKind:"discount",paid_at:row.issued_at,amount:Math.abs(Number(row.total||0)),method:"discount",note:row.adjustment_note||"",invoice_number:null,order_number:null,correction_count:0}))]}\n';
 fs.writeFileSync(file,ui);
}
const serverFile='dist/api/server.js';let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes('/* PB1431 receipt tracking marks')){
 server=replaceOnce(server,'async function equipmentRentalHandoverInvoice(',fs.readFileSync('scripts/r1431-receipt-marks.js','utf8')+'\nasync function equipmentRentalHandoverInvoice(','receipt helpers');
 server=replaceOnce(server,"const marked = await externalAccountingAttachMarks(c, 'lab', labId, decorated);","const marked = await pb1431AttachReceiptMarks(c,labId,await externalAccountingAttachMarks(c, 'lab', labId, decorated),'discount');",'discount tracking marks');
 const start=server.indexOf("if (req.method === 'GET' && url.pathname === '/api/lab/finance/payments')");if(start<0)throw Error('R1431 receipt endpoint missing');
 const end=server.indexOf("if (req.method === 'POST' && url.pathname === '/api/lab/finance/payments')",start);if(end<start)throw Error('R1431 receipt endpoint boundary missing');
 let part=server.slice(start,end);part=replaceOnce(part,'return sendJson(res, 200, { payments: q.rows });',"return sendJson(res, 200, { payments: await pb1431AttachReceiptMarks(pool,labId,q.rows,'payment') });",'payment tracking marks');
 server=server.slice(0,start)+fs.readFileSync('scripts/r1431-receipt-route.js','utf8')+part+server.slice(end);fs.writeFileSync(serverFile,server);
}
const queueFile='dist/web/photobridge-r1363-lab-queue.js';let queue=fs.readFileSync(queueFile,'utf8');
if(!queue.includes('/* PB1431 measured finance header */')){
 queue=replaceOnce(queue,'if(!same(headers,observed)){',"/* PB1431 measured finance header */\n const toolbar=active?main.querySelector('.financeWorkspace .pb1176PaymentActions,.financeWorkspace .statementToolbar,.financeWorkspace .pb1423InvoiceToolbar'):null;\n const watched=toolbar?[...headers,toolbar]:headers;\n if(!same(watched,observed)){",'queue observer');
 queue=replaceOnce(queue,'observed=headers;','observed=watched;','queue observed headers');
 queue=replaceOnce(queue,'headers.forEach(node=>observer.observe(node));','watched.forEach(node=>observer.observe(node));','queue resize observers');
 queue=replaceOnce(queue,"const value=edge+'px';","const toolbarTop=edge+'px';if(main.style.getPropertyValue('--pb1431-toolbar-top')!==toolbarTop)main.style.setProperty('--pb1431-toolbar-top',toolbarTop);\n const value=(edge+(toolbar?Math.ceil(toolbar.getBoundingClientRect().height):0))+'px';",'queue viewport edge');fs.writeFileSync(queueFile,queue);
}
const cssFile='dist/web/photobridge-r1423-finance-bars.css';
if(!fs.readFileSync(cssFile,'utf8').includes('/* PB1431 finance document views */'))fs.appendFileSync(cssFile,"\n/* PB1431 finance document views */\n@media(min-width:821px) and (hover:hover) and (pointer:fine){\n html.pb1363OrderQueue body #root .labRoleWorkspace main.appWorkspacePage.pbFixedRoleHeader>.labRolePageScrollArea:has(.financeWorkspace :is(.pb1176PaymentActions,.statementToolbar,.pb1423InvoiceToolbar)){top:var(--pb1363-order-top,172px)!important}\n html.pb1363OrderQueue body #root .labRoleWorkspace main.appWorkspacePage.pbFixedRoleHeader>.labRolePageScrollArea .financeWorkspace :is(.pb1176PaymentActions,.customerStatementWorkspace>.statementToolbar,.pb1423InvoiceToolbar){top:var(--pb1431-toolbar-top,120px)!important}\n html.pb1363OrderQueue body #root .labRoleWorkspace main.appWorkspacePage.pbFixedRoleHeader>.labRolePageScrollArea:has(.financeWorkspace):not(:has(.financeWorkspace :is(.pb1176PaymentActions,.statementToolbar,.pb1423InvoiceToolbar))){padding-top:20px!important}\n html body #root .labRoleWorkspace .labRolePageScrollArea .financeWorkspace .customerStatementWorkspace>.statementToolbar>.statementActions>button.pb1177Print{margin-inline-start:auto!important}\n}\nhtml body #root .labRoleWorkspace .labRolePageScrollArea .financeWorkspace .pb1420Payments .financeRecordRows{min-width:790px!important}\nhtml body #root .labRoleWorkspace .labRolePageScrollArea .financeWorkspace .pb1420Payments .financeRecordRows>div{grid-template-columns:minmax(160px,1fr) minmax(110px,.45fr) minmax(90px,.35fr) minmax(100px,.4fr) 200px!important}\nhtml body #root .labRoleWorkspace .labRolePageScrollArea .financeWorkspace .pb1431ReceiptActions{display:flex!important;gap:6px!important;align-items:center!important;justify-content:flex-end!important}\nhtml body #root .labRoleWorkspace .labRolePageScrollArea .financeWorkspace .pb1431ReceiptActions button{font:inherit;font-size:10px!important;white-space:nowrap!important;padding:5px 8px!important}\nhtml body #root .labRoleWorkspace .labRolePageScrollArea .financeWorkspace .financeRecordRows>.pb1431RecordedReceipt{background:#ecfdf3!important;border-color:#95d5ad!important}\nhtml body #root .labRoleWorkspace .pb1431RecordedReceipt .pb1431ReceiptMark{background:#d1fadf!important;border-color:#95d5ad!important;color:#166534!important}\n");
let html=fs.readFileSync('dist/web/index.html','utf8');
for(const name of ['photobridge-r1423-finance-bars.css','photobridge-r1363-lab-queue.js']){const pattern=new RegExp('('+name.replaceAll('.','\\.')+')(?:\\?[^"\'<>\\s]*)?','g');html=html.replace(pattern,'$1?v=r1431')}
html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&financeDocuments=')?url:url+'&financeDocuments=r1431');fs.writeFileSync('dist/web/index.html',html);
