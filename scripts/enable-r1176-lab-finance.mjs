import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
(function enableLabFinance(fs){
const sourceFile='dist/web/assets/index-UIRefine-v655-r84.js';
let source=fs.readFileSync(sourceFile,'utf8');
if(!source.includes('pb1176ManualOpen')){
 function one(before,after){
  const n=source.split(before).length-1;
  if(n!==1)throw new Error('R1176 lab finance build anchor mismatch ('+n+'): '+before.slice(0,110));
  source=source.replace(before,after);
 }
 const day='x.useState(()=>t==="lab"?$s(new Date()):"")';
 one('[_pbInvFrom,_setPbInvFrom]=x.useState(""),[_pbInvTo,_setPbInvTo]=x.useState(""),[_pbInvAppliedFrom,_setPbInvAppliedFrom]=x.useState(""),[_pbInvAppliedTo,_setPbInvAppliedTo]=x.useState("")',
 `[_pbInvFrom,_setPbInvFrom]=${day},[_pbInvTo,_setPbInvTo]=${day},[_pbInvAppliedFrom,_setPbInvAppliedFrom]=${day},[_pbInvAppliedTo,_setPbInvAppliedTo]=${day}`);
 one('p&&e.jsx("div",{className:"financeSummary accountingSummary financeSummaryCompact"',
 'p&&(t!=="lab"||w!=="invoices")&&e.jsx("div",{className:"financeSummary accountingSummary financeSummaryCompact"');
 one('placeholder:"جستجوی فاکتور، عکاسی یا سند…"})})]}),t==="lab"&&e.jsxs("div",{className:"invoiceRangeToolbar"',
 'placeholder:"جستجوی فاکتور، عکاسی یا سند…"})}),t==="lab"&&e.jsx("button",{type:"button",className:"pb1176ManualOpen",onClick:()=>window.pb1176Finance?.manual({api:Me,customers:E,refresh:ce}),children:"＋ ثبت فاکتور دستی"})]}),t==="lab"&&e.jsxs("div",{className:"invoiceRangeToolbar"');
 one('e.jsx("button",{type:"button",className:"invoiceRangeAll",onClick:',
 'e.jsx("button",{type:"button",className:"pb1176Today "+(_pbInvAppliedFrom===$s(new Date())&&_pbInvAppliedTo===$s(new Date())?"active":""),onClick:()=>{const day=$s(new Date());_setPbInvFrom(day);_setPbInvTo(day);_setPbInvAppliedFrom(day);_setPbInvAppliedTo(day);Ie(1)},children:"امروز"}),e.jsx("button",{type:"button",className:"invoiceRangeAll",onClick:');
 one('w==="payments"&&e.jsx("div",{className:"card financeListCard"',
 't==="lab"&&w==="payments"&&e.jsxs("div",{className:"pb1176PaymentActions",children:[e.jsx("select",{value:z,onChange:Je=>q(Je.target.value),children:[e.jsx("option",{value:"",children:"انتخاب عکاسی"}),...E.map(Je=>e.jsx("option",{value:String(Je.id),children:String(Je.name||"عکاسی")},Je.id))]}),e.jsx("button",{disabled:!z,onClick:Ye,children:"＋ ثبت پرداخت"}),e.jsx("button",{disabled:!z,onClick:()=>v(!0),children:"＋ ثبت تخفیف"})]}),w==="payments"&&e.jsx("div",{className:"card financeListCard"');
 one('t==="lab"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{disabled:!z,onClick:Ye,children:"＋ ثبت پرداخت"}),e.jsx("button",{disabled:!z,onClick:()=>v(!0),children:"＋ ثبت تخفیف"})]}),e.jsx("button",{disabled:!_,onClick:()=>_&&Jy(_),children:"چاپ"})',
 'e.jsx("button",{disabled:!_,onClick:()=>_&&Jy(_),children:"چاپ خلاصه"}),t==="lab"&&e.jsx("button",{disabled:!_,onClick:()=>_&&window.pb1176Finance?.detailed(_,r),children:"چاپ با جزئیات"})');
 fs.writeFileSync(sourceFile,source);
}
const indexFile='dist/web/index.html';
let html=fs.readFileSync(indexFile,'utf8');
const tag='<link rel="stylesheet" href="/photobridge-r1176-lab-finance.css?v=r1176"><script defer src="/photobridge-r1176-lab-finance.js?v=r1176"></script>';
if(!html.includes('/photobridge-r1176-lab-finance.css'))html=html.replace('</head>',tag+'\n</head>');
if(!html.includes('finance=r1176'))html=html.replace(/(index-UIRefine-v655-r84\.js\?v=[^"']+)/,'$1&finance=r1176');
fs.writeFileSync(indexFile,html);
})(fs);
execFileSync(process.execPath,['--check','dist/web/assets/index-UIRefine-v655-r84.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1176-lab-finance.cjs'],{stdio:'inherit'});
