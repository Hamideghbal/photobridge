const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ui=fs.readFileSync('dist/web/photobridge-v904r98-invite-stable.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1411-existing-invite.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');

test('the exact rental-store name is shown and not overwritten by empty generic context data',()=>{
 const helper=ui.match(/function PB1411RentalShopName\(invite\)\{[^\n]*\}/);
 assert.ok(helper,'shared rental issuer resolver');
 const name=vm.runInNewContext('('+helper[0]+')');
 assert.equal(name({issuerRentalShopName:'لوازم نور جهان',issuerName:'فروشگاه'}),'لوازم نور جهان');
 assert.equal(name({issuerRentalShopName:null,issuerName:'نور جهان'}),'نور جهان');
 assert.equal(name({issuerRentalShopName:null,issuerName:'فروشگاه'}),'');
 assert.match(ui,/const previousInvite=old\.invite\|\|\{\},incomingInvite=x\.invite\|\|\{\}/);
 assert.match(ui,/previousInvite\[field\]/);
 assert.match(ui,/if\(h\)h\.textContent=shopName\?'به فروشگاه «'\+shopName\+'» خوش آمدید'/);
 assert.match(ui,/:'به فروشگاه تجهیزات خوش آمدید'/);
 assert.match(ui,/title\.textContent=shopName\?'اطلاعات درخواستی فروشگاه «'\+shopName\+'»'/);
 assert.doesNotMatch(ui,/به فروشگاه «\$\{shopName\}» خوش آمدید/);
});

test('existing rental user only gets side-by-side controls on Windows desktop',()=>{
 assert.match(ui,/classList\.toggle\('pbR1411ExistingRentalInvite',isExisting\(\)&&/);
 assert.match(css,/@media \(min-width: 901px\)/);
 assert.match(css,/html\.pbR1411ExistingRentalInvite body #root \.photographerSignupShell/);
 assert.match(css,/\.photographerSignupShell > \.photographerSignupIntro \{/);
 assert.match(css,/grid-column: 1 !important/);
 assert.match(css,/\.photographerSignupShell > #pbR94InviteRequired \{/);
 assert.match(css,/grid-column: 2 !important/);
 assert.match(css,/\.photographerSignupShell > \.photographerSignupForm \{/);
 assert.match(css,/grid-row: 2 !important/);
 assert.match(css,/@media \(max-width: 900px\)/);
 assert.match(css,/grid-template-columns: minmax\(0,1fr\) !important/);
});

test('birthday/verification logic and accessibility controls remain intact',()=>{
 assert.match(ui,/const choose=d=>\{/);
 assert.match(ui,/setInputValue\(input,v\);close\(\)/);
 assert.match(ui,/function tweakButton\(form\)/);
 assert.match(ui,/if\(req\.birthDate&&!String\(state\.values\.birthJalali\|\|''\)\.trim\(\)\)/);
 assert.match(ui,/if\(typeof form\.requestSubmit==='function'\)form\.requestSubmit\(\)/);
 assert.match(ui,/function placeRequiredBox\(form,box\)/);
 assert.match(ui,/form\.before\(box\)/);
 assert.match(ui,/aria-label','انتخاب تاریخ تولد با تقویم شمسی/);
});

test('invite and account data fetch concurrently when number is known',()=>{
 const start=ui.indexOf('  async function bootstrap(){'),end=ui.indexOf('  window.fetch=async function(',start);
 assert.ok(start>=0&&end>start);
 const boot=ui.slice(start,end);
 assert.match(boot,/Promise\.allSettled\(\[/);
 assert.match(boot,/getInvite\(\),initialMobile\?checkAccount\(initialMobile\):Promise\.resolve\(false\)/);
 assert.match(boot,/\/api\/public\/photographer-signup\/context-fast/);
 assert.equal((boot.match(/\/api\/public\/photographer-signup\/context-fast/g)||[]).length,1);
 assert.doesNotMatch(boot,/for\(const endpoint of \[/);
 assert.match(boot,/normalizeMobile\(state\.ctx\?\.invite\?\.targetMobile/);
 assert.match(boot,/validInvite&&!initialMobile/);
 assert.match(boot,/if\(!accepted&&!state\.contextReady\)showContextRetry\(\)/);
});

test('CSS and JS cache revisions load on the real signup page',()=>{
 assert.match(html,/photobridge-r1411-existing-invite\.css\?v=r1417/);
 assert.match(html,/photobridge-v904r98-invite-stable\.js\?v=r1417/);
 assert.equal(ui.split('/* PB1411 existing rental invitation */').length-1,1);
 assert.match(html,/photobridge-r1144-lab-invite-existing\.css/);
});
