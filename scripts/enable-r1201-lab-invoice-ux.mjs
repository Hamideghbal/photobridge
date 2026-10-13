// R1201: apply tightly scoped lab invoice UX changes to the prebuilt React bundle.
// This project intentionally ships prebuilt dist, so Docker/build must regenerate
// the same safe React changes after the preceding R1197 transforms.
import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(file,'utf8');
function once(from,to,label){
 const n=ui.split(from).length-1;
 if(n!==1)throw Error('[R1201] '+label+' expected exactly once, found '+n);
 ui=ui.replace(from,to);
}
const oldDB='function db({role:t,invoice:a}){const[s,r]=x.useState(!1),[o,l]=x.useState(!1),c=async()=>{if(a.pdf_ready){r(!0);try{const g=await Me(`${t==="lab"?"/api/lab/invoices/":"/api/customer/invoices/"}${a.id}/download`);window.open(g.url,"_blank","noopener,noreferrer")}catch{alert("نسخه PDF فاکتور آماده نیست.")}finally{r(!1)}}};return e.jsxs("div",{className:"invoiceActionMini",children:[e.jsx("button",{onClick:()=>l(!0),children:"مشاهده"}),e.jsx("button",{disabled:!a.pdf_ready||s,onClick:c,children:a.pdf_ready?s?"…":"دانلود PDF":"PDF در حال ساخت"}),o&&e.jsx(Oc,{role:t,invoice:a,onClose:()=>l(!1)})]})}';
once(oldDB,'function db({role:t,invoice:a}){const[o,l]=x.useState(!1);return e.jsxs("div",{className:"invoiceActionMini",children:[e.jsx("button",{onClick:()=>l(!0),children:"مشاهده"}),o&&e.jsx(Oc,{role:t,invoice:a,onClose:()=>l(!1)})]})}','remove invoice duplicate PDF download');
once(',y.invoice.pdf_ready&&e.jsx("button",{onClick:()=>Wn(y.invoice.id),children:"PDF"})','','remove duplicate order-detail PDF');
once(',le.invoice_id&&le.invoice_pdf_ready&&e.jsx("button",{className:"miniInvoiceBtn",onClick:()=>Wn(le.invoice_id),children:"PDF"})','','remove duplicate ready/delivered PDF');
once('," ",t==="lab"&&!Ot&&!At&&Je.order_id&&e.jsx("button",{className:"miniOrderFilesBtn",onClick:()=>ie(Je),children:"فایل‌های سفارش"})','','remove accounting invoice order-file shortcut');
const accounting='," ",t==="lab"&&!Ot&&!At&&e.jsx("button",{className:"externalAccountingBtn "+(_pbRecorded?"recorded":""),onClick:()=>_setPbAccountingMark(Je),children:_pbRecorded?"ثبت‌شده در حسابداری":"ثبت در حسابداری"})," ",t==="lab"&&!Ot&&!At&&e.jsx("button",{className:"miniCorrectionBtn",onClick:()=>ge("invoice",Je),children:"اصلاحیه"})';
once(accounting,'," ",t==="lab"&&!Ot&&!At&&e.jsx("button",{className:"miniCorrectionBtn",onClick:()=>ge("invoice",Je),children:"اصلاحیه"})," ",t==="lab"&&!Ot&&!At&&e.jsx("button",{className:"externalAccountingBtn "+(_pbRecorded?"recorded":""),onClick:()=>_setPbAccountingMark(Je),children:_pbRecorded?"ثبت‌شده در حسابداری":"ثبت در حسابداری"})','move accounting registration to last action');
const customer='e.jsxs("label",{children:["عکاسی",e.jsx(wn,{searchable:!0,searchPlaceholder:"جستجوی نام عکاسی…",className:"pb891SearchableCustomerSelect"';
const p=ui.indexOf(customer),end=p<0?-1:ui.indexOf(',e.jsxs("label",{children:["فاکتور (اختیاری)"',p);
if(p<0||end-p>950||end<0)throw Error('[R1201] payment duplicate photographer selector boundaries changed');
ui=ui.slice(0,p)+ui.slice(end+1);
const stats=',e.jsxs("div",{className:"pb1201InvoiceFilterStats",role:"status",children:[e.jsxs("span",{children:["نمایش ",V(Ve.filter(Je=>Je.document_type!=="discount"&&Je.document_type!=="correction").length)," فاکتور"]}),e.jsxs("span",{children:["ثبت‌شده در حسابداری: ",V(Ve.filter(Je=>Je.document_type!=="discount"&&Je.document_type!=="correction"&&Je.external_accounting_recorded).length)]}),e.jsxs("span",{children:["ثبت‌نشده: ",V(Ve.filter(Je=>Je.document_type!=="discount"&&Je.document_type!=="correction"&&!Je.external_accounting_recorded).length)]})]})';
once('children:"نمایش همه"})]}),Ve.length?','children:"نمایش همه"}),e.jsx("button",{type:"button",className:"invoiceRangeToday",onClick:()=>{const PBtoday=nl(new Date());_setPbInvFrom(PBtoday),_setPbInvTo(PBtoday),_setPbInvAppliedFrom(PBtoday),_setPbInvAppliedTo(PBtoday),Ie(1)},children:"امروز"})'+stats+']}),Ve.length?','filtered invoice statistics and today');
const print='function PB1201PrintLive(paper){if(!paper)return alert("پیش‌نمایش فاکتور آماده نیست.");const zoom=paper.style.zoom;let done=false;const clean=()=>{if(done)return;done=true;paper.style.zoom=zoom;document.body.classList.remove("pb1201PrintInvoice");window.removeEventListener("afterprint",clean)};document.body.classList.add("pb1201PrintInvoice");paper.style.zoom="1";window.addEventListener("afterprint",clean);try{window.print()}catch{clean();alert("چاپ فاکتور انجام نشد.")}setTimeout(clean,60000)}';
once('function Oc({role:t,invoice:a,onClose:s})',print+'function Oc({role:t,invoice:a,onClose:s})','print same preview DOM');
once('className:"invoicePrintBtn",onClick:()=>Wy(a,t),children:"چاپ فاکتور"','className:"invoicePrintBtn",onClick:()=>PB1201PrintLive(g.current),children:"چاپ فاکتور"','preview print action');
once('className:"invoicePdfFreshBtn",onClick:()=>Gy(a),children:"PDF"','className:"invoicePdfFreshBtn",onClick:()=>PB1201PrintLive(g.current),title:"در پنجره چاپ، ذخیره به‌صورت PDF را انتخاب کنید",children:"PDF"','PDF must use preview print layout');
fs.writeFileSync(file,ui);
console.log('[R1201] invoice and receipts UI transformed');
