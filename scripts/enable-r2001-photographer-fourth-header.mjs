/* R2001 — consistent fourth finance header and working photographer ledger modes. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/web/assets/index-UIRefine-v655-r84.js';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
function once(s,a,b,label){
 const count=s.split(a).length-1;
 if(count!==1)throw Error('[R2001] '+label+' expected once; found '+count);
 return s.replace(a,b);
}
let ui=read(file);
if(!ui.includes('/* PB2001 fourth finance header */')){
 const begin=ui.indexOf('function ub({role:t,'),end=ui.indexOf('}function hb(',begin);
 if(begin<0||end<begin)throw Error('[R2001] finance component boundaries missing');
 let part=ui.slice(begin,end+1);
 // On photographers, z is always empty. It is a laboratory customer picker,
 // so never disable the photographer's ledger modes because of it.
 part=once(part,
  'disabled:D||!z,onClick:()=>{_setPb1177StmtMode("summary");b()},children:"نمایش خلاصه"',
  'disabled:D||t==="lab"&&!z,onClick:()=>{_setPb1177StmtMode("summary");t==="lab"&&b()},children:"نمایش خلاصه"',
  'photographer summary toggle');
 part=once(part,
  'disabled:D||!z,onClick:()=>{_setPb1177StmtMode("detailed");b()},children:"نمایش با جزئیات"',
  'disabled:D||t==="lab"&&!z,onClick:()=>{_setPb1177StmtMode("detailed");t==="lab"&&b()},children:"نمایش با جزئیات"',
  'photographer detailed toggle');
 // The photographer portal must not display laboratory bookkeeping labels or flags.
 part=once(part,'e.jsx("span",{children:"بخش حسابداری"})','e.jsx("span",{children:t==="lab"?"بخش حسابداری":"بخش مالی"})','finance picker label');
 // Later invoice builders can modify the recorded-status expression; scope
 // the existing computed flag without assuming an obsolete right-hand side.
 if(part.includes('_pbRecorded=')&&!part.includes('_pbRecorded=t==="lab"&&')){
  part=once(part,'_pbRecorded=','_pbRecorded=t==="lab"&&','lab-only accounting badge guard');
 }
 if(part.includes('Je.accounting_exported&&e.jsx("small",{className:"accountingTransferredBadge"')){
  part=once(part,'Je.accounting_exported&&e.jsx("small",{className:"accountingTransferredBadge"','t==="lab"&&Je.accounting_exported&&e.jsx("small",{className:"accountingTransferredBadge"','lab-only accounting-export guard');
 }
 // Keep the complete invoice records, but remove the irrelevant financial
 // document count/title from the photographer's displayed invoice controls.
 part=once(part,
  't!=="lab"&&e.jsxs("div",{children:[e.jsx("b",{children:"فاکتورها و اسناد مالی"})',
  'false&&e.jsxs("div",{children:[e.jsx("b",{children:"فاکتورها و اسناد مالی"})',
  'photographer invoice counter/title');
 // One quick Today preset remains in the toolbar; calendar popovers no longer
 // produce duplicate Today controls for the same photographer range.
 part=once(part,
  'compact:!0,value:_pbInvFrom,onChange:_setPbInvFrom,placeholder:"از تاریخ"',
  'compact:!0,value:_pbInvFrom,onChange:_setPbInvFrom,placeholder:"از تاریخ",showToday:t==="lab"',
  'photographer invoice from-date picker');
 part=once(part,
  'compact:!0,value:_pbInvTo,onChange:_setPbInvTo,placeholder:"تا تاریخ"',
  'compact:!0,value:_pbInvTo,onChange:_setPbInvTo,placeholder:"تا تاریخ",showToday:t==="lab"',
  'photographer invoice to-date picker');
 const metrics='t==="customer"&&e.jsxs("div",{className:"pb2000CustomerMetrics pb2001InvoiceMetrics",role:"status","aria-live":"polite",children:[e.jsxs("span",{children:[e.jsx("small",{children:"جمع فاکتورها"}),e.jsx("b",{children:Xe(Ve.filter(Je=>(Je.document_type||"invoice")==="invoice").reduce((sum,Je)=>sum+Number(Je.total||0),0))})]}),e.jsxs("span",{children:[e.jsx("small",{children:"پرداخت‌ها"}),e.jsx("b",{children:Xe(Ve.filter(Je=>(Je.document_type||"invoice")==="invoice").reduce((sum,Je)=>sum+Number(Je.paid_total||0),0))})]}),e.jsxs("span",{className:"pb2000Balance",children:[e.jsx("small",{children:"مانده حساب"}),e.jsx("b",{children:Xe(Ve.filter(Je=>(Je.document_type||"invoice")==="invoice").reduce((sum,Je)=>sum+Number(Je.balance??(Number(Je.total||0)-Number(Je.paid_total||0))),0))})]})]})';
 part=once(part,
  'e.jsxs("div",{className:"invoiceRangeToolbar",children:[',
  'e.jsxs("div",{className:"invoiceRangeToolbar",children:['+metrics+',',
  'invoice period totals inserted as toolbar child');
 // Only the rendered view mode changes for a photographer; the loaded ledger
 // and its read-only line items stay available without a redundant network trip.
 ui=ui.slice(0,begin)+part+ui.slice(end+1);
 // The quick Today action is kept; the two invoice date calendars are the
 // only place where the new showToday option is disabled.
 ui=once(ui,'function Hs({value:t,onChange:a,placeholder:s="انتخاب تاریخ",compact:r=!1})',
  'function Hs({value:t,onChange:a,placeholder:s="انتخاب تاریخ",compact:r=!1,showToday:_pb2001ShowToday=!0})',
  'Persian picker optional Today preset');
 const dateStart=ui.indexOf('function Hs('),dateEnd=ui.indexOf('}function ',dateStart+12);
 if(dateStart<0||dateEnd<dateStart)throw Error('[R2001] date picker missing');
 let picker=ui.slice(dateStart,dateEnd+1);
 picker=once(picker,'e.jsxs("button",{type:"button",className:"calendarTodayBtn"',
  '_pb2001ShowToday&&e.jsxs("button",{type:"button",className:"calendarTodayBtn"',
  'one Today control in picker');
 ui=ui.slice(0,dateStart)+picker+ui.slice(dateEnd+1);
 ui+='\n/* PB2001 fourth finance header */\n';
 write(file,ui);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
const cssName='photobridge-r2001-photographer-fourth-header.css';
fs.copyFileSync('scripts/r2001-photographer-fourth-header.css','dist/web/'+cssName);
let html=read('dist/web/index.html');
if(!html.includes(cssName))
 html=once(html,'</head>','<link rel="stylesheet" href="/'+cssName+'?v=r2001"></head>','fourth header CSS link');
const versionKey='&photographerFinanceFourth=r2001';
const asset='index-UIRefine-v655-r84.js';
if(!html.includes(versionKey)){
 if(!html.includes(asset+'?'))throw Error('[R2001] UI module URL not found');
 const pattern=new RegExp(asset.replace(/\./g,'\\.')+'[^"\\s<>]*','g');
 let hits=0;
 html=html.replace(pattern,url=>{hits++;return url+versionKey});
 if(hits!==1)throw Error('[R2001] expected one UI module URL, found '+hits);
}
write('dist/web/index.html',html);
console.log('[R2001] photographer fourth headers and invoice/statement modes ready');
