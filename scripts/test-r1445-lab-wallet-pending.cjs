const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1445-lab-wallet-pending.css','utf8');

test('wallet removes duplicate tariffs and rate box, keeps balance and payment controls',()=>{
  const a=ui.indexOf('className:"serviceWalletLab"'),b=ui.indexOf('className:"card panel walletOnlineTopup"',a);
  const between=ui.slice(a,b);
  assert(b>a&&between.includes('pb1445WalletBalanceCard'));
  assert(between.includes('walletRateBadge'),'service wallet keeps its current rate indicator');
  assert(!between.includes('تعرفه و جزئیات خدمات'));
  assert(between.includes('t.balance||0'));
  assert(ui.includes('className:"card panel walletOnlineTopup"'));
  assert(ui.includes('className:"card tableCard walletHistoryCard"'));
});
test('wallet cards align at desktop width and history spans every column',()=>{
  assert(css.includes('align-items:stretch!important'));
  assert(css.includes('.serviceWalletLab>.walletHistoryCard{grid-column:1/-1!important'));
  assert(css.includes('.serviceWalletLab>.walletOnlineTopup{grid-column:2!important;grid-row:1!important'));
  assert(css.includes('.serviceWalletLab:has(>.alert)>.walletOnlineTopup{grid-row:2!important'));
});
test('preregistration is explicit; resend retained, activation blocked while pending',()=>{
  assert(ui.includes('className:"pb1446PendingTag"')&&ui.includes('children:"پیش‌ثبت‌نام"'));
  assert(ui.includes('children:h.registrationPending?"در انتظار تأیید عضویت"'));
  assert(ui.includes('e.jsx(PB1443PendingInvite,{customer:h})'));
  assert(ui.includes('disabled:!!h.registrationPending,title:h.registrationPending?'));
  const server=fs.readFileSync('dist/api/server.js','utf8');
  assert(fs.readFileSync('dist/api/lab-invite-preregistration.js','utf8').includes("VALUES($1,$2,'customer',false)"));
  assert(server.includes('AS "registrationPending"'));
  assert(server.includes("resend-invitation"));
});
test('output parses and cache barrier references new version',()=>{
  new vm.Script(ui.replace(/^import[^;]+;/gm,''));
  assert(html.includes('photobridge-r1445-lab-wallet-pending.css?v=r1445'));
  assert(html.includes('labWalletPending=r1445'));
  assert(ui.includes('/* PB1445 lab wallet and pending registration */'));
});
