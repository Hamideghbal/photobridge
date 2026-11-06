import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function once(s,a,b,label){const count=s.split(a).length-1;if(count!==1)throw Error('R1643 '+label+' anchor count '+count);return s.replace(a,b);}

// Lab admin-only route, placed inside the existing lab-scoped auth boundary.
const serverFile='dist/api/server.js',policyName='lab-order-ledger-override.js';
fs.copyFileSync('scripts/r1643-order-ledger-override.js','dist/api/'+policyName);
let server=read(serverFile);
if(!server.includes('/* PB1643 per-order ledger settlement */')){
 // The large server build is patched by many earlier releases. The declaration
 // "const labOrder" can move or be rewritten; attach to the stable lab-admin
 // device boundary, after role/access/suspension checks instead.
 const adminStart=server.indexOf("if (url.pathname.startsWith('/api/lab/')) {");
 const deviceAnchor='const requestDeviceId =';
 const deviceAt=adminStart<0?-1:server.indexOf(deviceAnchor,adminStart);
 const region=server.slice(adminStart,deviceAt);
 if(adminStart<0||deviceAt<0||deviceAt-adminStart>12000
   ||region.indexOf("requireRole(a, 'lab_admin')")<0
   ||region.indexOf("labAccess.rows[0].suspended")<0
   ||region.indexOf('handleLabSiteManagement')<0
   ||server.indexOf(deviceAnchor,deviceAt+deviceAnchor.length)>=0)
   throw Error('R1644 expected lab-admin authenticated, active-access guarded device boundary');
 server=server.slice(0,deviceAt)+`/* PB1643 per-order ledger settlement */
        if(await handleLabLedgerOverride({req,url,res,pool,labId,a,bodyJson,sendJson,statusEvent,audit,publishCustomerEvent,publishLabEvent}))return;
        `+server.slice(deviceAt);
 server=`import {handleLabLedgerOverride} from './${policyName}';\n`+server;
 write(serverFile,server);
}
execFileSync(process.execPath,['--check',serverFile],{stdio:'inherit'});
execFileSync(process.execPath,['--check','dist/api/'+policyName],{stdio:'inherit'});

// One click on the order card opens a clear two-action confirmation dialog.
// Both site and Windows receive exactly the same behavior in the existing React list.
const stylesheet='photobridge-r1643-order-ledger.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const asset=root+'/assets/index-UIRefine-v655-r84.js';
 let js=read(asset);
 if(!js.includes('/* PB1643 order-ledger action */')){
  const start=js.indexOf('function Uf('),end=js.indexOf('function vi(',start);
  if(start<0||end<=start)throw Error('R1643 Lab order component missing '+root);
  let component=js.slice(start,end);
  const state=`const [pb1643LedgerOrder,pb1643SetLedgerOrder]=x.useState(null),
    [pb1643Working,pb1643SetWorking]=x.useState(false),
    [pb1643Error,pb1643SetError]=x.useState(''),
    pb1643ApplyLedger=async()=>{
      if(!pb1643LedgerOrder||pb1643Working)return;
      pb1643SetWorking(true);pb1643SetError('');
      try{
       const result=await Me('/api/lab/orders/'+pb1643LedgerOrder.id+'/settlement-mode',
        {method:'POST',body:JSON.stringify({settlementMode:'ledger'})});
       pb1643SetLedgerOrder(null);await ye();
       P('سفارش #'+V(result.order?.number||pb1643LedgerOrder.number)+' به حساب دفتری منتقل شد؛ بدهی محفوظ است.');
      }catch(error){pb1643SetError(error?.data?.message||error?.message||'تغییر روش تسویه انجام نشد.');}
      finally{pb1643SetWorking(false);}
    };const[p,f]=x.useState([])`;
  component=once(component,'const[p,f]=x.useState([])',state,'state and action');
  const noticeEnd='le.payment_status==="receipt_rejected"&&e.jsx("small",{children:"رسید رد شده؛ منتظر رسید جدید"})]})';
  // Put the action in the card's PRIMARY action row, where all order types
  // and both desktop/mobile layouts already render buttons. A subsidiary
  // prepaid notice can collapse or be restyled by other releases.
  const footerAnchor='e.jsxs("div",{className:"labOrderMiniActions",children:[';
  const ledgerAction=`e.jsxs("div",{className:"labOrderMiniActions",children:[
    le.settlement_mode==="prepaid"&&le.payment_status!=="paid"&&le.status==="awaiting_payment"&&
    e.jsx("button",{type:"button",className:"miniInvoiceBtn pb1643LedgerAction",
      disabled:E===le.id||le.payment_status==="receipt_pending"||["uploading","pending","approved"].includes(String(le.receipt_status||"")),
      title:le.payment_status==="receipt_pending"||["uploading","pending","approved"].includes(String(le.receipt_status||""))?"ابتدا وضعیت رسید پرداخت را مشخص کنید.":"فقط همین سفارش به حساب دفتری تبدیل می‌شود.",
      onClick:()=>{pb1643SetLedgerOrder(le);pb1643SetError('')},
      children:"دفتری کردن سفارش"}),
    `;
  component=once(component,footerAnchor,ledgerAction,'visible order action row');
  const modalAnchor='Se&&e.jsx($f,{order:Se.order,onClose:()=>Fe(null),onSaved:Nn}),L&&e.jsxs(On,';
  const modal=`pb1643LedgerOrder&&e.jsx(On,{
   title:"تبدیل سفارش #"+V(pb1643LedgerOrder.number)+" به حساب دفتری",
   onClose:()=>{if(!pb1643Working)pb1643SetLedgerOrder(null)},
   children:e.jsxs("div",{className:"pb1643LedgerConfirm",children:[
    e.jsx("strong",{children:"فقط روش تسویهٔ همین سفارش تغییر می‌کند."}),
    e.jsx("p",{children:"الزام تسویه قبل از چاپ برداشته می‌شود و سفارش وارد صف دریافت/چاپ خواهد شد. تنظیمات عکاس و سفارش‌های دیگر ثابت می‌ماند."}),
    e.jsx("p",{className:"pb1643FinanceWarning",children:"هیچ مبلغی صفر یا تسویه نمی‌شود؛ فاکتور و بدهی مشتری محفوظ می‌ماند. پرداخت یا استردادی ثبت نخواهد شد."}),
    pb1643Error&&e.jsx("p",{className:"pb1643LedgerError",role:"alert",children:pb1643Error}),
    e.jsxs("div",{className:"modalActions",children:[
     e.jsx("button",{type:"button",disabled:pb1643Working,onClick:()=>pb1643SetLedgerOrder(null),children:"انصراف"}),
     e.jsx("button",{type:"button",className:"primary pb1643LedgerConfirmButton",
      disabled:pb1643Working,onClick:pb1643ApplyLedger,
      children:pb1643Working?"در حال تغییر روش تسویه…":"تأیید دفتری کردن"})
    ]})
   ]})
  }),`+modalAnchor;
  component=once(component,modalAnchor,modal,'confirmation modal');
  js=js.slice(0,start)+component+js.slice(end)+'\n/* PB1643 order-ledger action */\n';
  write(asset,js);
 }
 execFileSync(process.execPath,['--check',asset],{stdio:'inherit'});
 fs.copyFileSync('scripts/r1643-order-ledger.css',root+'/'+stylesheet);
 const indexPath=root+'/index.html';
 let html=read(indexPath);
 if(!html.includes(stylesheet)){
   if(!html.includes('</head>'))throw Error('R1643 missing document head '+root);
   html=html.replace('</head>',`<link rel="stylesheet" href="/${stylesheet}?v=r1645"></head>`);
 }
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&orderLedger=r1645')?u:u.replace(/&orderLedger=r[0-9]+/g,'')+'&orderLedger=r1645');
 write(indexPath,html);
 if(root.endsWith('/lab-desktop-ui')){
  const manifestPath=root+'/manifest.json',m=JSON.parse(read(manifestPath));
  if(m.channel!=='lab'||m.protocol!==1||!Array.isArray(m.files))throw Error('R1643 native manifest changed');
  for(const name of ['assets/index-UIRefine-v655-r84.js','index.html',stylesheet]){
   let row=m.files.find(f=>f.name===name);
   if(!row){row={name,url:'/lab-desktop-ui/'+name};m.files.push(row)}
   row.sha256=hash(fs.readFileSync(root+'/'+name));
  }
  m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();
  write(manifestPath,JSON.stringify(m));
 }
}
console.log('[R1643] Per-order ledger override; no customer membership, payment or invoice mutation');
