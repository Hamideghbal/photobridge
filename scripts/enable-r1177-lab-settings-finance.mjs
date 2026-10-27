import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/web/assets/index-UIRefine-v655-r84.js';
let source=fs.readFileSync(path,'utf8');
const modernFinance=source.includes('pb1437PickAction')&&source.includes('PB1441StatementDetail');
if(!source.includes('pb1177LedgerDetails')&&!modernFinance){
 // R1303: R1301 prebuilt bundles already include Site under General. The
 // legacy stage needs its original shape; R1301 restores Site after grouping.
 source=source.replace('items:[["general","عمومی و اعلان‌ها"],["hours","ساعت کاری"],["site","سایت اختصاصی"]]',
  'items:[["general","عمومی و اعلان‌ها"],["hours","ساعت کاری"]]');
 const replace=(old,next)=>{
  const n=source.split(old).length-1;
  if(n!==1)throw Error('R1177 expected one match, found '+n+' for '+old.slice(0,110));
  source=source.replace(old,next);
 };
 replace('items:[["general","عمومی و اعلان‌ها"],["hours","ساعت کاری"]]',
  'items:[["general","عمومی و اعلان‌ها"],["hours","ساعت کاری"],["sms","پیامک مشتریان"],["windowsAlert","هشدار ویندوز"],["snappbox","اسنپ و ارسال"]]');
 replace('{key:"notifications",label:"اعلان و ارتباط",hint:"پیام و هشدار",items:[["sms","پیامک مشتریان"]]},{key:"system",label:"سیستم و ارسال",hint:"فایل و تحویل",items:[["windowsAlert","هشدار ویندوز"],["local","مسیر ذخیره روی هارد"],["snappbox","اسنپ و ارسال"]]}',
  '{key:"local",label:"مسیر ذخیره روی هارد",hint:"ذخیره فایل",items:[["local","مسیر ذخیره روی هارد"]]}');
 replace('p&&(t!=="lab"||w!=="invoices")&&e.jsx("div",{className:"financeSummary accountingSummary financeSummaryCompact"',
  'p&&(t!=="lab"||w==="overview")&&e.jsx("div",{className:"financeSummary accountingSummary financeSummaryCompact"');
 replace('[_pbAccountingMark,_setPbAccountingMark]=x.useState(null)',
  '[_pbAccountingMark,_setPbAccountingMark]=x.useState(null),[_pb1177StmtMode,_setPb1177StmtMode]=x.useState("summary")');
 replace('const Xe=Je=>V(Math.round(Number(Je||0)))',
  'const _pb1177Customer=E.find(Je=>String(Je.id)===String(z)),Xe=Je=>V(Math.round(Number(Je||0)))');
 replace(']}),e.jsx("button",{disabled:!z,onClick:Ye,children:"＋ ثبت پرداخت"})',
  ']}),z&&_pb1177Customer&&e.jsxs("div",{className:"pb1177PaymentMetrics",children:[e.jsxs("span",{children:[e.jsx("small",{children:"جمع حساب"}),e.jsx("b",{children:Xe(_pb1177Customer.invoiced)})]}),e.jsxs("span",{children:[e.jsx("small",{children:"بدهی پس از تخفیف"}),e.jsx("b",{children:Xe(Math.max(0,Number(_pb1177Customer.invoiced||0)-Number(_pb1177Customer.discounts||0)))})]}),e.jsxs("span",{children:[e.jsx("small",{children:"پرداختی"}),e.jsx("b",{children:Xe(_pb1177Customer.paid)})]}),e.jsxs("span",{className:"pb1177Debt",children:[e.jsx("small",{children:"مانده بدهی"}),e.jsx("b",{children:Xe(_pb1177Customer.balance)})]})]}),e.jsx("button",{disabled:!z,onClick:Ye,children:"＋ ثبت پرداخت"})');
 replace('e.jsx("button",{disabled:!_,onClick:()=>_&&Jy(_),children:"چاپ خلاصه"}),t==="lab"&&e.jsx("button",{disabled:!_,onClick:()=>_&&window.pb1176Finance?.detailed(_,r),children:"چاپ با جزئیات"})',
  't==="lab"&&e.jsx("button",{type:"button",className:"pb1177ViewMode "+(_pb1177StmtMode==="summary"?"active":""),onClick:()=>_setPb1177StmtMode("summary"),children:"خلاصه"}),t==="lab"&&e.jsx("button",{type:"button",className:"pb1177ViewMode "+(_pb1177StmtMode==="detailed"?"active":""),onClick:()=>_setPb1177StmtMode("detailed"),children:"جزئیات"}),e.jsx("button",{disabled:!_,className:"pb1177Print",onClick:()=>_&&(_pb1177StmtMode==="detailed"?window.pb1176Finance?.detailed(_,r):Jy(_)),children:"چاپ"})');
 const point='e.jsx(cg,{page:Y,pages:dt,total:st.length,pageSize:N,onPage:Re})]}),t==="lab"&&e.jsxs("section",{className:"card customerDiscountSettings"';
 const detail='e.jsx(cg,{page:Y,pages:dt,total:st.length,pageSize:N,onPage:Re})]}),t==="lab"&&_pb1177StmtMode==="detailed"&&e.jsxs("section",{className:"card pb1177LedgerDetails",children:[e.jsx("h3",{children:"جزئیات فاکتورهای این صفحه"}),Pt.filter(Je=>Je.reference_type==="invoice").map(Je=>{const item=r.find(Ot=>Ot.document_type==="invoice"&&String(Ot.id)===String(Je.reference_id));const rows=window.pb1176Finance?.items(item)||[];return e.jsxs("div",{className:"pb1177LedgerInvoice",children:[e.jsxs("header",{children:[e.jsx("b",{children:"فاکتور #"+V(item?.number||Je.invoice_number||"")}),e.jsx("small",{children:Je.description||""}),e.jsx("strong",{children:Xe(item?.total||Je.debit)})]}),e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"شرح / سایز"}),e.jsx("th",{children:"تعداد"}),e.jsx("th",{children:"فی واحد"}),e.jsx("th",{children:"جمع"})]})}),e.jsx("tbody",{children:rows.length?rows.map((Ot,At)=>e.jsxs("tr",{children:[e.jsx("td",{children:Ot.description||Ot.sizeLabel||Ot.printSize||"خدمت"}),e.jsx("td",{children:V(Ot.quantity||Ot.copies||1)}),e.jsx("td",{children:Xe(Ot.unitPrice)}),e.jsx("td",{children:Xe(Ot.lineTotal||Ot.total)})]},At)):e.jsx("tr",{children:e.jsx("td",{colSpan:4,children:"ریز اقلام این فاکتور موجود نیست."})})})]})]},Je.id)}),!Pt.some(Je=>Je.reference_type==="invoice")&&e.jsx("p",{children:"در این صفحه فاکتوری برای نمایش جزئیات وجود ندارد."})]}),t==="lab"&&e.jsxs("section",{className:"card customerDiscountSettings"';
 replace(point,detail);
 fs.writeFileSync(path,source);
}
const htmlFile='dist/web/index.html';let html=fs.readFileSync(htmlFile,'utf8');
const lastCss='<link rel="stylesheet" href="/photobridge-r1177-lab-finance-layout.css?v=r1177">';
html=html.replace(lastCss,'').replace('</head>',lastCss+'\n</head>');
html=html.replace(/(photobridge-r1147-lab-admin-header\.js\?v=)[^"']+/g,'$1r1177');
html=html.replace(/(photobridge-r1176-lab-finance\.(?:js|css)\?v=)[^"']+/g,'$1r1177');
html=html.replace(/(&finance=)r\d+/,'$1r1177');
fs.writeFileSync(htmlFile,html);
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1177-lab-settings-finance.cjs'],{stdio:'inherit'});

