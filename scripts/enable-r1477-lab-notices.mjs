import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1477 anchor '+a.slice(0,90));return s.replace(a,b)};
let server=fs.readFileSync('dist/api/server.js','utf8');
if(!server.includes('/* PB1477 lab notices */')){
 server="import {startLabSubscriptionNotices} from './lab-subscription-notices.js';\n/* PB1477 lab notices */\n"+server;
 server=once(server,'startIntakeInvoiceSmsWorker({pool,sendSms,normalizeMobile});','startIntakeInvoiceSmsWorker({pool,sendSms,normalizeMobile});startLabSubscriptionNotices({pool,sendSms,normalizeMobile,publicUrl:PUBLIC_APP_URL});');
 server=once(server,'readIds:read.rows.map(n=>n.id),notifications: items.rows,','nativeOrderAlertsActive:nativeInfoOwnerActive(labId),readIds:read.rows.map(n=>n.id),notifications: items.rows,');
 server=once(server,"['collaboration_request','photographer_invite_accepted','photographer_removed_by_admin','photographer_removed_by_lab'].includes(event)&&nativeInfoOwnerActive(recipientId)",'nativeInfoOwnerActive(recipientId)');
 fs.writeFileSync('dist/api/server.js',server);
}
const p='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(p,'utf8');
if(!ui.includes('/* PB1477 lab status */')){
 ui=once(ui,'Ng=()=>localStorage.getItem(Sg)!=="off"','Ng=()=>window.__PB_NATIVE_ORDER_ALERTS__!==true&&localStorage.getItem(Sg)!=="off"');
 ui=once(ui,'function _g(){try{','function _g(){if(window.__PB_NATIVE_ORDER_ALERTS__===true)return;try{');
 ui=once(ui,'e.jsx(E0,{','e.jsx(PB1477LabStatus,{account:String(t.user.id)+":"+String(l?.lab?.id||"")}),e.jsx(E0,{');
 ui=once(ui,'E.flatMap(ae=>ae.items);const C=',`E.flatMap(ae=>ae.items);const[pb1477Owner,pb1477SetOwner]=x.useState(()=>window.__PB_NATIVE_ORDER_ALERTS__===true);x.useEffect(()=>{const update=()=>{const active=window.__PB_NATIVE_ORDER_ALERTS__===true;pb1477SetOwner(active);if(active)T(false)};update();window.addEventListener('pb1477-alarm-owner',update);return()=>window.removeEventListener('pb1477-alarm-owner',update)},[]);const C=`);
 ui=once(ui,'checked:h,onChange:ae=>T(ae.target.checked)','checked:h&&!pb1477Owner,disabled:pb1477Owner,onChange:ae=>T(ae.target.checked)');
 ui=once(ui,'children:"تا زمانی که سفارش چاپ جدید را تأیید نکنی، هشدار صوتی تکرار می‌شود."','children:pb1477Owner?"آلارم برنامهٔ ویندوز فعال است؛ برای جلوگیری از هشدار تکراری، آلارم مرورگر غیرفعال شد.":"تا زمانی که سفارش چاپ جدید را تأیید نکنی، هشدار صوتی تکرار می‌شود."');
 ui=once(ui,'disabled:y==="granted"||y==="unsupported",onClick:k','disabled:pb1477Owner||y==="granted"||y==="unsupported",onClick:k');
 ui+='\n/* PB1477 lab status */\n'+fs.readFileSync('scripts/r1477-lab-status.js','utf8');fs.writeFileSync(p,ui);
}
const css='.pb1477NativeAlarm .labOrderAlarmLayer{display:none!important}.pb1477Subscription{position:fixed;bottom:18px;left:18px;z-index:1500;display:flex;align-items:center;gap:16px;max-width:min(620px,calc(100vw - 36px));padding:12px 16px;border:1px solid #e8c989;border-radius:12px;background:#fff8e8;color:#714709;box-shadow:0 4px 20px #28344b18;direction:rtl;font-family:Vazirmatn,Tahoma,sans-serif}.pb1477Subscription div{display:grid;gap:4px}.pb1477Subscription strong{font-size:13px}.pb1477Subscription span{font-size:12px;line-height:1.8}.pb1477Subscription a{flex-shrink:0;background:#245fd3;color:#fff;padding:8px 12px;border-radius:8px;text-decoration:none;font-size:12px}.pb1477Subscription.expired{background:#fff1f1;border-color:#e7b5b5;color:#8b2727}@media(max-width:700px){.pb1477Subscription{bottom:80px;left:10px;right:10px;max-width:none;gap:8px;padding:10px;flex-wrap:wrap}.pb1477Subscription a{margin-right:auto}}';fs.writeFileSync('dist/web/photobridge-r1477-lab-status.css',css);
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let s=fs.readFileSync(p,'utf8');if(!s.includes('/photobridge-r1477-lab-status.css'))s=s.replace('</head>','<link rel="stylesheet" href="/photobridge-r1477-lab-status.css?v=r1477"></head>');s=s.replace(/(index-UIRefine-v655-r84\.js\?[^"'\s]*)/g,u=>u.includes('labNotices=r1477')?u:u+'&labNotices=r1477');fs.writeFileSync(p,s);}
