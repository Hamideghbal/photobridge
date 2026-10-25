import fs from 'node:fs';

const bundleFile='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(bundleFile,'utf8');
if(!ui.includes('/* PB1445 lab wallet and pending registration */')){
  const once=(before,after)=>{
    if(ui.split(before).length!==2)throw Error('R1445 UI anchor not unique: '+before.slice(0,100));
    ui=ui.replace(before,after);
  };
  const startAnchor='e.jsxs("section",{className:"card panel",children:[e.jsxs("div",{className:"walletBalanceHero"';
  const nextAnchor='e.jsxs("section",{className:"card panel walletOnlineTopup"';
  const start=ui.indexOf(startAnchor),end=ui.indexOf(nextAnchor,start);
  if(start<0||end<=start||ui.indexOf(startAnchor,start+1)>=0)throw Error('R1445 wallet panel boundaries');
  const oldPanel=ui.slice(start,end);
  if(!oldPanel.includes('className:"walletRateBadge"')||
     !oldPanel.includes('PB1443Disclosure,{title:"تعرفه و جزئیات خدمات"'))
     throw Error('R1445 expected duplicated tariff/rate panel');
  const balancePanel='e.jsxs("section",{className:"card panel pb1445WalletBalanceCard",children:[e.jsx("div",{className:"walletBalanceHero",children:e.jsxs("div",{children:[e.jsx("span",{className:"eyebrow",children:"اعتبار خدمات"}),e.jsxs("h2",{children:[V(t.balance||0)," ",e.jsx("small",{children:"تومان"})]}),e.jsxs("p",{children:["پیامک‌های عملیاتی و سرویس‌های هوش مصنوعی از این موجودی کم می‌شوند. ",e.jsx("b",{children:"OTP فراموشی رمز، پیامک تست و اعلان‌های مدیریتی رایگان‌اند"})," و از این کیف پول کم نمی‌شوند."]})]})})]}),';
  ui=ui.slice(0,start)+balancePanel+ui.slice(end);

  // Pending is a server-derived unredeemed lab invitation, not a generic inactive account.
  once('e.jsxs("div",{className:"pb1443PhotographerStatus",children:[e.jsx(Sb,{ok:h.active,children:h.active?"فعال":"غیرفعال"}),h.registrationPending&&e.jsx("small",{className:"pb1443Preregistered",children:"پیش‌ثبت‌نام"})]})',
       'e.jsxs("div",{className:"pb1443PhotographerStatus",children:[e.jsx(Sb,{ok:h.active,children:h.registrationPending?"در انتظار تأیید عضویت":h.active?"فعال":"غیرفعال"}),h.registrationPending&&e.jsx("small",{className:"pb1443Preregistered",children:"پیش‌ثبت‌نام · تأیید نشده"})]})');
  // The resend component from R1443 remains an actual button calling the scoped API.
  if(!ui.includes('e.jsx(PB1443PendingInvite,{customer:h})'))
    throw Error('R1445 pending invite action missing');
  // Never offer one-click activation as a substitute for the photographer accepting the invitation.
  once('className:"pbActionButton compact customerActionButton "+(h.active?"warning":"success"),title:h.active?',
       'className:"pbActionButton compact customerActionButton "+(h.active?"warning":"success"),disabled:!!h.registrationPending,title:h.registrationPending?"در انتظار تأیید عکاس":h.active?');
  ui+='\n/* PB1445 lab wallet and pending registration */\n';
  fs.writeFileSync(bundleFile,ui);
}
let html=fs.readFileSync('dist/web/index.html','utf8');
if(!html.includes('photobridge-r1445-lab-wallet-pending.css'))
  html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1445-lab-wallet-pending.css?v=r1445" /></head>');
html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&labWalletPending=')?url:url+'&labWalletPending=r1445');
fs.writeFileSync('dist/web/index.html',html);
