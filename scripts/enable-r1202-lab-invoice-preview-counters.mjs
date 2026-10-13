// R1202: invoice preview is the source for print/PDF; counts follow the active date filter.
// Runs after R1201 so previous lab intake, settings and finance controls stay authoritative.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(path,'utf8');
function exactly(before,after,name){
 const n=ui.split(before).length-1;
 if(n===0&&ui.includes(after))return;
 if(n!==1)throw Error('[R1202] '+name+': expected 1 anchor, got '+n);
 ui=ui.replace(before,after);
}
if(!ui.includes('className:"pb1201InvoiceCounts"')){
 exactly('y.invoice.pdf_ready&&e.jsx("button",{onClick:()=>Wn(y.invoice.id),children:"PDF"})',
         'null','duplicate detail PDF');
 exactly('le.invoice_id&&le.invoice_pdf_ready&&e.jsx("button",{className:"miniInvoiceBtn",onClick:()=>Wn(le.invoice_id),children:"PDF"})',
         'null','duplicate ready/delivered card PDF');
 exactly('className:"invoicePrintBtn",onClick:()=>Wy(a,t)',
         'className:"invoicePrintBtn",onClick:()=>window.pb1201InvoiceExport?.("print")||Wy(a,t)','print actual preview');
 exactly('className:"invoicePdfFreshBtn",onClick:()=>Gy(a)',
         'className:"invoicePdfFreshBtn",onClick:()=>window.pb1201InvoiceExport?.("pdf")||Gy(a)','PDF actual preview');
 const all='e.jsx("button",{type:"button",className:"invoiceRangeAll",onClick:()=>{_setPbInvFrom(""),_setPbInvTo(""),_setPbInvAppliedFrom(""),_setPbInvAppliedTo(""),Ie(1)},children:"نمایش همه"})';
 const today='e.jsx("button",{type:"button",className:"pb1201InvoiceToday",onClick:()=>{const td=new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Tehran",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date);_setPbInvFrom(td),_setPbInvTo(td),_setPbInvAppliedFrom(td),_setPbInvAppliedTo(td),Ie(1)},children:"امروز"})';
 const orig='Ve.filter(Je=>Je.document_type!=="discount"&&Je.document_type!=="correction")';
 const stats='e.jsxs("div",{className:"pb1201InvoiceCounts",role:"status","aria-live":"polite",children:['+
   'e.jsxs("span",{children:["فاکتورهای نمایش‌داده‌شده: ",e.jsx("b",{children:V('+orig+'.length)})]}),'+
   'e.jsxs("span",{children:["ثبت‌شده در حسابداری: ",e.jsx("b",{children:V('+orig+'.filter(Je=>Boolean(Je.external_accounting_recorded)).length)})]}),'+
   'e.jsxs("span",{children:["ثبت‌نشده در حسابداری: ",e.jsx("b",{children:V('+orig+'.filter(Je=>!Je.external_accounting_recorded).length)})]})]})';
 exactly(all,all+','+today+','+stats,'invoice date-scope counts');
 fs.writeFileSync(path,ui);
}
const page='dist/web/index.html';let html=fs.readFileSync(page,'utf8');
if(!html.includes('/photobridge-r1201-lab-finance-invoice.css')){
 html=html.replace('</body>','<link rel="stylesheet" href="/photobridge-r1201-lab-finance-invoice.css?v=r1202">\n<script defer src="/photobridge-r1201-lab-invoice-export.js?v=r1202"></script>\n</body>');
}
const r=/(index-UIRefine-v655-r84\.js\?v=[^"']+)/g;
if([...html.matchAll(r)].length!==1)throw Error('[R1202] main bundle marker changed');
html=html.replace(r,t=>t.includes('&invoice=r1202')?t:t+'&invoice=r1202');
fs.writeFileSync(page,html);
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
execFileSync(process.execPath,['--check','dist/web/photobridge-r1201-lab-invoice-export.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1201-lab-invoice-controls.cjs'],{stdio:'inherit'});
