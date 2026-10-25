const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const server=fs.readFileSync('dist/api/server.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1446-lab-wallet-prereg-subscription.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');

test('green per-SMS price derives from actual customer SMS service, without duplicated catalog',()=>{
  const a=ui.indexOf('className:"serviceWalletLab"'),b=ui.indexOf('className:"card panel walletOnlineTopup"',a);
  const card=ui.slice(a,b);
  assert(card.includes('pb1445WalletBalanceCard'));
  assert(card.includes('walletRateBadge pb1446SmsRate'));
  assert(card.includes('V((k==null?void 0:k.effective_price)||0)'));
  assert(card.includes('برای هر پیامک موفق'));
  assert(!card.includes('تعرفه و جزئیات خدمات'));
  assert(css.includes('background:#e9fbf0!important'));
  assert(css.includes('color:#14532d!important'));
  assert(ui.includes('walletHistoryCard'));
});

test('pre-registration tag is in identity column, only for pending memberships',()=>{
  const a=ui.indexOf('className:"labPhotographerList"');
  const b=ui.indexOf('function wb(',a);
  const part=ui.slice(a,b);
  assert(a>0&&b>a);
  assert(part.includes('className:"pb1446PhotographerName"'));
  assert(part.includes('h.registrationPending&&e.jsx("span",{className:"pb1446PendingTag"'));
  assert(part.includes('children:"پیش‌ثبت‌نام"'));
  assert(part.includes('PB1443PendingInvite,{customer:h}'));
  assert(part.includes('disabled:!!h.registrationPending'));
  assert(css.includes('labPhotographerCard .pb1446PendingTag'));
});

test('pending detection normalizes SMS numbers, accounts for expired invitations but excludes accepted ones',()=>{
  assert(server.includes('/* PB1446 pending lab invitation detection */'));
  const a=server.indexOf('AS "registrationPending"');
  assert(a>0);
  const fragment=server.slice(a-1100,a);
  assert(fragment.includes('pending_invite.uses=0'));
  assert(fragment.includes('accepted_invite.uses>0'));
  assert(fragment.includes("regexp_replace(COALESCE(u.mobile,''),'[^0-9]','','g')"));
  assert(!fragment.includes('pending_invite.active=true'));
  assert(server.includes('/resend-invitation'));
});

test('only archive calendar arrow glyphs are swapped while month offsets stay bound',()=>{
  const a=ui.indexOf('className:"card persianCalendarCard"');
  const segment=ui.slice(a,a+570);
  assert(a>0);
  assert(segment.includes('"aria-label":"ماه قبل",onClick:()=>v(-1),children:"‹"'));
  assert(segment.includes('"aria-label":"ماه بعد",onClick:()=>v(1),children:"›"'));
  assert(!segment.includes('onClick:()=>v(-1),children:"›"'));
});

test('subscription compact layout does not clip history or block receipt actions',()=>{
  assert(css.includes('.labSubscriptionPanel .labPlanChoices>button'));
  assert(css.includes('.labSubscriptionPanel .subscriptionCurrent'));
  assert(css.includes('.labSubscriptionPanel .pb1443Disclosure>summary'));
  assert(!css.includes('overflow:hidden!important'));
  assert(ui.includes('PB1443Disclosure,{title:"سابقه تمدید"'));
  assert(ui.includes('PB1443Disclosure,{title:"پرداخت دستی و ارسال رسید"'));
});
test('CSS cache and JavaScript bundle parse after patch',()=>{
  assert(html.includes('photobridge-r1446-lab-wallet-prereg-subscription.css?v=r1446'));
  assert(html.includes('labCorrections=r1446'));
  assert(ui.includes('/* PB1446 lab wallet and registration corrections */'));
  new vm.Script(ui.replace(/^import[^;]+;/gm,''));
  // The API server is an ES module (top-level module syntax). Its syntax is already
  // verified separately by `node --check dist/api/server.js` in the release workflow.
});
