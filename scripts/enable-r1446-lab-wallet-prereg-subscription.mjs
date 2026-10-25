import fs from 'node:fs';
const bundleFile='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(bundleFile,'utf8');
if(!ui.includes('/* PB1446 lab wallet and registration corrections */')){
  const once=(from,to)=>{const count=ui.split(from).length-1;if(count!==1)throw Error('R1446 UI anchor count '+count+': '+from.slice(0,100));ui=ui.replace(from,to)};
  const walletStart=ui.indexOf('className:"serviceWalletLab"'),walletEnd=ui.indexOf('className:"card panel walletOnlineTopup"',walletStart);
  if(walletStart<0||walletEnd<=walletStart||!ui.slice(walletStart,walletEnd).includes('pb1445WalletBalanceCard'))throw Error('R1446 wallet requires R1445');
  // Restore the live green per-SMS price without restoring duplicated service catalog.
  once(' و از این کیف پول کم نمی‌شوند."]})]})})]}),e.jsxs("section",{className:"card panel walletOnlineTopup"',
       ' و از این کیف پول کم نمی‌شوند."]})]})}),e.jsxs("div",{className:"walletRateBadge pb1446SmsRate",children:[e.jsx("small",{children:"تعرفه فعلی پیامک مشتری"}),e.jsxs("b",{children:[V((k==null?void 0:k.effective_price)||0)," تومان"]}),e.jsx("span",{children:"برای هر پیامک موفق"})]})]}),e.jsxs("section",{className:"card panel walletOnlineTopup"');
  // Show a conspicuous badge WITH the photographer's name; it should not require horizontal scrolling.
  once('e.jsx("b",{children:h.name}),e.jsx("small",{dir:"ltr",children:h.mobile||"بدون شماره موبایل"})',
       'e.jsxs("b",{className:"pb1446PhotographerName",children:[h.name,h.registrationPending&&e.jsx("span",{className:"pb1446PendingTag",title:"عکاس هنوز دعوت‌نامه را نپذیرفته است",children:"پیش‌ثبت‌نام"})]}),e.jsx("small",{dir:"ltr",children:h.mobile||"بدون شماره موبایل"})');
  // Leave explicit state text and the existing resend component; drop only the redundant second badge.
  once('h.registrationPending&&e.jsx("small",{className:"pb1443Preregistered",children:"پیش‌ثبت‌نام · تأیید نشده"})',
       'h.registrationPending&&e.jsx("small",{className:"pb1443Preregistered pb1446AwaitingApproval",children:"تأیید عضویت انجام نشده"})');
  if(!ui.includes('e.jsx(PB1443PendingInvite,{customer:h})'))throw Error('R1446 resend action missing');
  // Swap only visual arrow symbols in the Archive calendar: the actions stay connected to their actual month offsets.
  once('className:"card persianCalendarCard",children:[e.jsxs("div",{className:"calendarHead",children:[e.jsx("button",{onClick:()=>v(-1),children:"›"}),e.jsxs("b",{children:[jg[E.month-1]," ",V(E.year)]}),e.jsx("button",{onClick:()=>v(1),children:"‹"})',
       'className:"card persianCalendarCard",children:[e.jsxs("div",{className:"calendarHead",children:[e.jsx("button",{type:"button","aria-label":"ماه قبل",onClick:()=>v(-1),children:"‹"}),e.jsxs("b",{children:[jg[E.month-1]," ",V(E.year)]}),e.jsx("button",{type:"button","aria-label":"ماه بعد",onClick:()=>v(1),children:"›"})');
  ui+='\n/* PB1446 lab wallet and registration corrections */\n';
  fs.writeFileSync(bundleFile,ui);
}
const serverFile='dist/api/server.js';
let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes('/* PB1446 pending lab invitation detection */')){
  const old='m.active=false AND EXISTS(SELECT 1 FROM invitations pending_invite WHERE pending_invite.lab_id=m.lab_id AND pending_invite.target_mobile=u.mobile AND pending_invite.active=true AND pending_invite.uses=0)';
  const count=server.split(old).length-1;
  if(count!==1)throw Error('R1446 pending SQL anchor count '+count);
  // Exact-string mobile matching missed older normalized/+98 invites. Unredeemed invitations remain
  // pending even after expiration; a redeemed invitation excludes an inactive/suspended old account.
  const mobileMatches=alias=>"right(regexp_replace(COALESCE("+alias+".target_mobile,''),'[^0-9]','','g'),10)=right(regexp_replace(COALESCE(u.mobile,''),'[^0-9]','','g'),10)";
  const replacement="m.active=false AND EXISTS(SELECT 1 FROM invitations pending_invite WHERE pending_invite.lab_id=m.lab_id AND "+mobileMatches('pending_invite')+" AND pending_invite.uses=0 AND pending_invite.target_mobile IS NOT NULL) AND NOT EXISTS(SELECT 1 FROM invitations accepted_invite WHERE accepted_invite.lab_id=m.lab_id AND "+mobileMatches('accepted_invite')+" AND accepted_invite.uses>0)";
  server=server.replace(old,replacement);
  server+='\n/* PB1446 pending lab invitation detection */\n';
  fs.writeFileSync(serverFile,server);
}
let html=fs.readFileSync('dist/web/index.html','utf8');
if(!html.includes('/photobridge-r1446-lab-wallet-prereg-subscription.css')){
  html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1446-lab-wallet-prereg-subscription.css?v=r1446" /></head>');
}
html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&labCorrections=')?url:url+'&labCorrections=r1446');
fs.writeFileSync('dist/web/index.html',html);
