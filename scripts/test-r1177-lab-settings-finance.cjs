const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const header=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.js','utf8');
const finance=fs.readFileSync('dist/web/photobridge-r1176-lab-finance.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1177-lab-finance-layout.css','utf8');
const page=fs.readFileSync('dist/web/index.html','utf8');
const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');

test('settings general owns SMS, Snapp and Windows alert; local path is sole fourth category',()=>{
 assert(header.includes("['عمومی','/lab/settings',['general','hours','sms','windowsAlert','snappbox']]"));
 assert(header.includes("['مسیر ذخیره روی هارد','/lab/settings/local',['local']]"));
 assert(!header.includes("['سیستم و ارسال'"));
 assert(!header.includes("['اعلان و ارتباط'"));
 assert(bundle.includes('items:[["general","عمومی و اعلان‌ها"],["hours","ساعت کاری"],["sms","پیامک مشتریان"],["windowsAlert","هشدار ویندوز"],["snappbox","اسنپ و ارسال"]]'));
 assert(bundle.includes('{key:"local",label:"مسیر ذخیره روی هارد",hint:"ذخیره فایل",items:[["local","مسیر ذخیره روی هارد"]]}'));
 assert(!bundle.includes('{key:"notifications",label:"اعلان و ارتباط"'));
 assert(!bundle.includes('{key:"system",label:"سیستم و ارسال"'));
});
test('financial scorecard is only rendered in dashboard, not invoice, payments or statement',()=>{
 assert(bundle.includes('p&&(t!=="lab"||w==="overview")&&e.jsx("div",{className:"financeSummary'));
 assert(css.includes('.financeWorkspace:has(.financeDashboardWrap)>.financeSummary.accountingSummary{display:grid!important}'));
});
test('today, all and apply custom range are compact in the opposite group of date fields',()=>{
 assert(bundle.includes('className:"pb1176Today "'));
 assert(bundle.includes('className:"invoiceRangeAll"'));
 assert(bundle.includes('className:"invoiceRangeApply"'));
 assert(css.includes('.invoiceRangeToolbar>.invoiceRangeApply'));
 assert(css.includes('margin-inline-start:auto!important'));
 assert(css.includes('.invoiceRangeToolbar>.invoiceRangeAll'));
 assert(css.includes('.invoiceRangeToolbar>.pb1176Today'));
 assert(css.includes('flex-flow:row nowrap!important'));
});
test('payment selector reveals four grounded financial totals for the chosen photographer',()=>{
 assert(bundle.includes('z&&_pb1177Customer&&e.jsxs("div",{className:"pb1177PaymentMetrics"'));
 assert(bundle.includes('children:"جمع حساب"'));
 assert(bundle.includes('children:"بدهی پس از تخفیف"'));
 assert(bundle.includes('children:"پرداختی"'));
 assert(bundle.includes('children:"مانده بدهی"'));
 assert(bundle.includes('Number(_pb1177Customer.discounts||0)'));
 assert(bundle.includes('Xe(_pb1177Customer.balance)'));
 assert(css.includes('.pb1177PaymentMetrics'));
});
test('statement switches displayed summary/detailed records in-page, then prints selected mode',()=>{
 assert(bundle.includes('[_pb1177StmtMode,_setPb1177StmtMode]=x.useState("summary")'));
 assert(bundle.includes('children:"خلاصه"'));
 assert(bundle.includes('children:"جزئیات"'));
 assert(bundle.includes('className:"card pb1177LedgerDetails"'));
 assert(bundle.includes('Je.reference_type==="invoice"'));
 assert(bundle.includes('String(Ot.id)===String(Je.reference_id)'));
 assert(bundle.includes('window.pb1176Finance?.items(item)'));
 assert(bundle.includes('_pb1177StmtMode==="detailed"?window.pb1176Finance?.detailed(_,r):Jy(_)'));
 assert(bundle.includes('children:"چاپ"'));
 assert(bundle.includes('onClick:tt,children:"PDF"'));
 assert(css.includes('.statementCustomerPicker>.statementCustomerSearchWrap'));
 assert(css.includes('.statementActions>.pb1177ViewMode.active'));
});
test('modal close is iconized; normal manual invoices do not scroll the whole panel',()=>{
 assert(finance.includes("close.innerHTML='<svg"));
 assert(finance.includes('function items(invoice)'));
 assert(finance.includes('window.pb1176Finance={manual,detailed,items}'));
 assert(css.includes('.pb1176Close svg'));
 assert(css.includes('width:min(880px,calc(100vw - 28px))'));
 assert(css.includes('max-height:calc(100dvh - 30px)!important'));
 assert(css.includes('overflow:visible!important'));
 assert(css.includes('.pb1176ManualRows'));
 assert(finance.includes("api('/api/lab/invoices/manual'"));
 new Function(finance);
});
test('production link and build integration are correctly ordered',()=>{
 assert(build.indexOf("enable-r1177-lab-settings-finance.mjs")>build.indexOf("enable-r1176-lab-finance.mjs"));
 assert(page.includes('photobridge-r1177-lab-finance-layout.css?v=r1177'));
 assert(page.includes('photobridge-r1176-lab-finance.css?v=r1177'));
 assert(page.includes('photobridge-r1176-lab-finance.js?v=r1177'));
 assert(page.includes('photobridge-r1147-lab-admin-header.js?v=r1177'));
 assert(page.includes('&finance=r1177'));
 new Function(header);
});
