const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const api=fs.readFileSync('dist/api/server.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1410-invite.css','utf8');
const a=ui.indexOf('function Xl('),b=ui.indexOf('function ',a+15),inv=ui.slice(a,b);

test('first laboratory SMS may create its permanent invite automatically',()=>{
 assert.ok(a>=0&&b>a);
 assert.match(inv,/inviteId:de\?\.id\|\|""/);
 assert.doesNotMatch(inv,/if\(!de\)return \$\("error"\)/);
 assert.doesNotMatch(inv,/disabled:L\|\|!je\|\|/);
 assert.match(inv,/disabled:L\|\|!!pbBusy\|\|/);
 assert.match(inv,/هنوز کد دعوت نساخته‌ای؛ با اولین ارسال پیامک/);
 assert.match(inv,/ساخت خودکار کد دعوت انجام نشد/);
 assert.match(inv,/"\/api\/photographer-invites\/send-sms"/);
 const smsRoute=api.slice(api.indexOf("if (req.method === 'POST' && url.pathname === '/api/photographer-invites/send-sms')"));
 assert.match(smsRoute,/if \(!inv\) \{/);
 assert.match(smsRoute,/createdFrom: 'lab_sms_invite_repair'/);
 assert.match(smsRoute,/mobileAlreadyMemberOfLab\(scope\.labId, mobile\)/);
});

test('lab only SMS history shows destination and honest status plus resend',()=>{
 assert.match(inv,/pbSetHistory\(Array\.isArray\(A\.smsHistory\)\?A\.smsHistory:\[\]\)/);
 assert.match(inv,/className:"pb1410SmsHistory"/);
 assert.match(inv,/children:item\.mobile/);
 assert.match(inv,/item\.joined\?"عضو لابراتوار شده"/);
 assert.match(inv,/item\.lastSentAt\?"پذیرفته‌شده توسط سامانه پیامک"/);
 assert.match(inv,/children:pbBusy===item\.mobile\?"در حال ارسال…":"ارسال مجدد"/);
 assert.match(inv,/previousDebt:item\.previousDebt\?\?null/);
 assert.match(inv,/if\(pbBusy\|\|L\|\|item\.joined\)return/);
 assert.match(inv,/await Le\(\)/);
 assert.match(inv,/تحویل قطعی هنوز تأیید نشده است/);
});

test('SMS history API cannot return other labs invite links',()=>{
 const a=api.indexOf("if (req.method === 'GET' && url.pathname === '/api/photographer-invites')");
 const b=api.indexOf("if (req.method === 'PUT' && url.pathname === '/api/admin/photographer-invites/commission')",a);
 const route=api.slice(a,b);
 assert.ok(a>=0&&b>a);
 assert.match(route,/const scope = inviteIssuerScope\(a,requestPortal\(req\)\)/);
 assert.match(route,/if \(!scope\)/);
 assert.match(route,/smsHistory=scope\.type==="lab"\?/);
 assert.match(route,/FROM photographer_invite_sms_links link WHERE link\.lab_id=\$1/);
 assert.match(route,/\[scope\.labId\]/);
 assert.match(route,/WHERE m\.lab_id=\$1 AND m\.role='customer' AND m\.active=true/);
 assert.match(route,/LIMIT 20/);
 assert.match(route,/joined:Boolean\(r\.joined\)/);
 assert.match(route,/commissionSettings, smsHistory/);
 assert.match(route,/sms-history-unavailable/);
});

test('photographer list no longer has obsolete accounting link badge',()=>{
 assert.doesNotMatch(ui,/accountingConnectionBadge/);
 assert.match(ui,/className:"labPhotographerIdentityCopy"/);
 assert.match(ui,/children:h\.mobile\|\|"بدون شماره موبایل"/);
 assert.match(ui,/ok:h\.active,children:h\.active\?"فعال":"غیرفعال"/);
});

test('only missing birthday field and calendar become compact in invite signup',()=>{
 assert.match(css,/#pbR94InviteRequired:has\(\.pbR95BirthInput\)/);
 assert.match(css,/max-width: 450px !important/);
 assert.match(css,/#pbR94InviteRequired \.pbR95BirthInput/);
 assert.match(css,/max-width: 340px !important/);
 assert.match(css,/#pbR95JalaliPopover/);
 assert.match(css,/overflow-y: auto !important/);
 assert.match(css,/@media \(max-width: 500px\)/);
 assert.match(html,/photobridge-r1410-invite\.css\?v=r1410/);
 assert.match(html,/inviteFlow=r1410/);
});

test('release builds both R1409 lab chat and R1410 invite UI once',()=>{
 assert.equal(ui.split('/* PB1409 lab context and chat startup */').length-1,1);
 assert.equal(ui.split('/* PB1410 invite flow and status */').length-1,1);
 assert.equal(api.split('/* PB1410 scoped SMS history */').length-1,1);
 assert.match(ui,/function PB1405Contacts/);
});
