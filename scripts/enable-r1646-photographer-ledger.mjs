import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=path=>fs.readFileSync(path,'utf8');
const write=(path,content)=>fs.writeFileSync(path,content);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function replaceOne(value,before,after,label){
 const count=value.split(before).length-1;
 if(count!==1)throw Error('R1646 '+label+' expected once, got '+count);
 return value.replace(before,after);
}
const policy='lab-photographer-ledger.js',file='dist/api/server.js';
fs.copyFileSync('scripts/r1646-photographer-ledger.js','dist/api/'+policy);
let server=read(file);
if(!server.includes('/* PB1646 photographer-wide ledger */')){
 const anchor='        if(await handleLabLedgerOverride({req,url,res,pool,labId,a,bodyJson,sendJson,statusEvent,audit,publishCustomerEvent,publishLabEvent}))return;';
 const loc=server.indexOf(anchor),labStart=server.indexOf("if (url.pathname.startsWith('/api/lab/')) {");
 if(labStart<0||loc<labStart||loc-labStart>12000
    ||server.slice(labStart,loc).indexOf("requireRole(a, 'lab_admin')")<0
    ||server.slice(labStart,loc).indexOf('labAccess.rows[0].suspended')<0)
  throw Error('R1646 expected lab auth and suspended-account guard');
 server=replaceOne(server,anchor,
  `        /* PB1646 photographer-wide ledger */
        if(await handleLabPhotographerLedger({req,url,res,pool,labId,a,bodyJson,sendJson,statusEvent,audit,publishCustomerEvent,publishLabEvent}))return;
`+anchor,'lab scoped handler');
 // Display the ACTUAL photographer settlement default beside each order.
 // The order's own historical settlement_mode may remain prepaid while a
 // pending receipt is being reviewed, even after the member becomes ledger.
 const ledgerColumn="(SELECT m.settlement_mode FROM lab_memberships m WHERE m.lab_id=o.lab_id AND m.user_id=o.customer_id AND m.role='customer' LIMIT 1) AS photographer_settlement_mode";
 const enrich=(startText,endText,label)=>{
  const begin=server.indexOf(startText),end=server.indexOf(endText,begin+startText.length);
  if(begin<0||end<begin)throw Error('R1646 missing '+label+' listing boundary');
  let section=server.slice(begin,end);
  section=replaceOne(section,
   'SELECT o.*,COALESCE(o.walkin_customer_name,u.name) customer_name',
   'SELECT o.*,'+ledgerColumn+',COALESCE(o.walkin_customer_name,u.name) customer_name',
   label+' current account mode');
  server=server.slice(0,begin)+section+server.slice(end);
 };
 enrich("if (req.method === 'GET' && url.pathname === '/api/lab/orders') {",
  "if (req.method === 'GET' && url.pathname === '/api/lab/archive') {",'order list');
 enrich('const labOrder = url.pathname.match(',
  "if (labOrder && req.method === 'DELETE') {",'order detail');
 server=`import {handleLabPhotographerLedger} from './${policy}';\n`+server;
 write(file,server);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['--check','dist/api/'+policy],{stdio:'inherit'});

for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const asset=root+'/assets/index-UIRefine-v655-r84.js';
 let js=read(asset);
 if(!js.includes('/* PB1646 photographer-wide ledger UI */')){
  const start=js.indexOf('function Uf('),end=js.indexOf('function vi(',start);
  if(start<0||end<=start)throw Error('R1646 lab order component missing '+root);
  let component=js.slice(start,end);
  component=replaceOne(component,
   "const result=await Me('/api/lab/orders/'+pb1643LedgerOrder.id+'/settlement-mode',",
   "const result=await Me('/api/lab/orders/'+pb1643LedgerOrder.id+'/photographer-ledger',",
   'account API route');
  component=replaceOne(component,
   "P('سفارش #'+V(result.order?.number||pb1643LedgerOrder.number)+' به حساب دفتری منتقل شد؛ بدهی محفوظ است.');",
   "P(result.message||'حساب این عکاسی در لابراتوار به دفتری تغییر کرد.');",
   'account success message');
  component=replaceOne(component,
   'le.settlement_mode==="prepaid"&&le.payment_status!=="paid"&&le.status==="awaiting_payment"&&',
   'le.settlement_mode==="prepaid"&&le.payment_status!=="paid"&&["awaiting_payment","downloaded"].includes(String(le.status||""))&&String(le.photographer_settlement_mode||"prepaid")!=="ledger"&&',
   'card visibility');
  component=replaceOne(component,
   'disabled:E===le.id||le.payment_status==="receipt_pending"||["uploading","pending","approved"].includes(String(le.receipt_status||"")),',
   'disabled:E===le.id,',
   'allow change even if receipt review pending');
  component=replaceOne(component,
   'title:le.payment_status==="receipt_pending"||["uploading","pending","approved"].includes(String(le.receipt_status||""))?"ابتدا وضعیت رسید پرداخت را مشخص کنید.":"فقط همین سفارش به حساب دفتری تبدیل می‌شود.",',
   'title:"کل حساب عکاسی در همین لابراتوار دفتری می‌شود؛ رسیدهای در انتظار بررسی محفوظ می‌مانند.",',
   'photographer-wide button tooltip');
  component=replaceOne(component,'children:"دفتری کردن سفارش"','children:"دفتری کردن حساب عکاسی"','card label');
  // When membership is ledger but this particular receipt still needs review,
  // show a stable status instead of offering a repeated conversion.
  component=replaceOne(component,
   'children:"دفتری کردن حساب عکاسی"}),',
   'children:"دفتری کردن حساب عکاسی"}),le.settlement_mode==="prepaid"&&le.payment_status==="receipt_pending"&&["awaiting_payment","downloaded"].includes(String(le.status||""))&&String(le.photographer_settlement_mode||"") ==="ledger"&&e.jsx("span",{className:"pb1646AccountAlreadyLedger",children:"حساب عکاسی دفتری شد · رسید در انتظار بررسی"}),',
   'account changed confirmation on card');
  component=replaceOne(component,
   'title:"تبدیل سفارش #"+V(pb1643LedgerOrder.number)+" به حساب دفتری",',
   'title:"دفتری کردن حساب عکاسی · سفارش #"+V(pb1643LedgerOrder.number),',
   'confirmation title');
  component=replaceOne(component,
   'children:"فقط روش تسویهٔ همین سفارش تغییر می‌کند."',
   'children:"حساب این عکاسی در همین لابراتوار دفتری می‌شود."',
   'membership confirmation');
  component=replaceOne(component,
   'children:"الزام تسویه قبل از چاپ برداشته می‌شود و سفارش وارد صف دریافت/چاپ خواهد شد. تنظیمات عکاس و سفارش‌های دیگر ثابت می‌ماند."',
   'children:"روش تسویهٔ این عکاسی برای سفارش‌های بعدی هم حساب دفتری خواهد بود. سفارش‌های فعلی که پرداخت یا رسید معلق ندارند وارد صف چاپ می‌شوند."',
   'scope confirmation');
  component=replaceOne(component,
   'children:"هیچ مبلغی صفر یا تسویه نمی‌شود؛ فاکتور و بدهی مشتری محفوظ می‌ماند. پرداخت یا استردادی ثبت نخواهد شد."',
   'children:"هیچ مبلغی صفر یا تسویه نمی‌شود؛ فاکتور و بدهی مشتری محفوظ می‌ماند. رسیدهای در حال ارسال یا بررسی، تا تعیین تکلیف آزاد نمی‌شوند."',
   'accounting warning');
  component=replaceOne(component,
   'children:pb1643Working?"در حال تغییر روش تسویه…":"تأیید دفتری کردن"',
   'children:pb1643Working?"در حال تغییر حساب عکاسی…":"تأیید دفتری کردن حساب عکاسی"',
   'confirm label');
  // The order DETAILS panel shows financial/prepay controls above the card list.
  const detailAnchor='y.order.payment_status==="receipt_rejected"&&e.jsx("small",{children:"رسید رد شده؛ منتظر ارسال مجدد عکاس"})]})';
  const detailNext='y.order.payment_status==="receipt_rejected"&&e.jsx("small",{children:"رسید رد شده؛ منتظر ارسال مجدد عکاس"}),y.order.settlement_mode==="prepaid"&&y.order.payment_status!=="paid"&&["awaiting_payment","downloaded"].includes(String(y.order.status||""))&&String(y.order.photographer_settlement_mode||"prepaid")!=="ledger"&&e.jsx("button",{type:"button",className:"pb1643LedgerAction",onClick:()=>{pb1643SetLedgerOrder(y.order);pb1643SetError("")},children:"دفتری کردن حساب عکاسی"}),y.order.settlement_mode==="prepaid"&&y.order.payment_status==="receipt_pending"&&["awaiting_payment","downloaded"].includes(String(y.order.status||""))&&y.order.photographer_settlement_mode==="ledger"&&e.jsx("small",{className:"pb1646AccountAlreadyLedger",children:"حساب عکاسی اکنون دفتری است؛ رسید این سفارش هنوز نیاز به بررسی دارد."})]})';
  component=replaceOne(component,detailAnchor,detailNext,'detail financial action');
  // Two view modes each expose a receipt-approval modal. Keep the new choice
  // next to reject/approve, not hidden in a global settings page.
  const receiptApprove='e.jsx("button",{className:"primary",disabled:De,onClick:()=>fa("approve"),children:"تأیید پرداخت و ورود به صف چاپ"})';
  const count=component.split(receiptApprove).length-1;
  if(count!==2)throw Error('R1646 expected two receipt review modal views, got '+count);
  component=component.split(receiptApprove).join(receiptApprove+',Z&&String(Z.photographer_settlement_mode||"prepaid")!=="ledger"&&e.jsx("button",{type:"button",className:"pb1646LedgerFromReceipt",disabled:De,onClick:()=>{Ce(null);Ze("");pb1643SetLedgerOrder(Z);pb1643SetError("")},children:"دفتری کردن حساب عکاسی"}),Z&&Z.photographer_settlement_mode==="ledger"&&e.jsx("small",{className:"pb1646AccountAlreadyLedger",children:"حساب عکاسی دفتری است؛ این رسید هنوز نیاز به بررسی دارد."})');
  js=js.slice(0,start)+component+js.slice(end)+'\n/* PB1646 photographer-wide ledger UI */\n';
  write(asset,js);
 }
 execFileSync(process.execPath,['--check',asset],{stdio:'inherit'});
 const cssName='photobridge-r1643-order-ledger.css',cssPath=root+'/'+cssName;
 let css=read(cssPath);
 if(!css.includes('/* PB1646 photographer account action */')){
 css+=`
/* PB1646 photographer account action */
.labPrepayDetail button.pb1643LedgerAction,.paymentReceiptReview button.pb1646LedgerFromReceipt{
 display:inline-flex!important;align-items:center!important;justify-content:center!important;
 padding:7px 12px!important;min-height:32px!important;border:1px solid #a4bfe6!important;
 border-radius:9px!important;background:#edf4ff!important;color:#204983!important;
 font:750 11px/1.6 Vazirmatn,Tahoma,sans-serif!important;cursor:pointer;
}
.labOrderScrollArea .labOrderMiniActions button.pb1643LedgerAction{
 min-width:160px!important;font-size:10.5px!important;
}
.pb1646AccountAlreadyLedger{
 display:inline-flex;align-items:center;padding:5px 9px;border-radius:8px;
 border:1px solid #b3d9c4;background:#effaf3;color:#25734b;
 font:750 10px/1.65 Vazirmatn,Tahoma,sans-serif;max-width:100%;white-space:normal;
}
`;
 write(cssPath,css);
 }
 const htmlPath=root+'/index.html';
 let html=read(htmlPath);
 if(!html.includes(cssName))throw Error('R1646 missing ledger action CSS link '+root);
 html=html.replace(/photobridge-r1643-order-ledger\.css\?v=r[0-9]+/g,cssName+'?v=r1647');
 html=html.replace(/&orderLedger=r[0-9]+/g,'&orderLedger=r1647');
 if(!html.includes('orderLedger=r1647')||!html.includes(cssName+'?v=r1647'))
  throw Error('R1646 ledger cache markers absent '+root);
 write(htmlPath,html);
 if(root.endsWith('lab-desktop-ui')){
  const mp=root+'/manifest.json',m=JSON.parse(read(mp));
  if(m.protocol!==1||m.channel!=='lab'||!Array.isArray(m.files))throw Error('R1646 native UI manifest invalid');
  for(const name of ['index.html','assets/index-UIRefine-v655-r84.js',cssName]){
   let item=m.files.find(f=>f.name===name);
   if(!item)throw Error('R1646 missing native manifest '+name);
   item.sha256=hash(fs.readFileSync(root+'/'+name));
  }
  m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();
  write(mp,JSON.stringify(m));
 }
}
console.log('[R1647] Lab ledger action visible for unpaid downloaded and awaiting-payment orders; finance preserved');
