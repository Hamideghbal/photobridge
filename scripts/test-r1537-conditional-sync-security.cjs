'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=x=>fs.readFileSync(x,'utf8');
test('conditional migration client handles ONLY a verified legacy login conflict, never all accounts',()=>{
 const js=read('dist/web/photobridge-r1393-shared-account.js');
 assert.doesNotThrow(()=>new vm.Script(js));
 assert(js.includes("response.status!==409"));
 assert(js.includes("data?.error==='account_password_unification_required'"));
 assert(js.includes("method!=='POST'"));
 assert(js.includes("target.origin!==location.origin"));
 assert(js.includes("target.pathname.startsWith('/api/auth/')"));
 assert(js.includes('promptAfterLegacyLogin(mobile)'));
 assert(!js.includes('let scheduled=false;'));
 assert(!js.includes('holder.className='));
 assert(js.includes("returnButton.textContent='بازگشت به صفحه ورود'"));
 assert(js.includes("stopOtp=window.pbSmsOtp?.listen(code)"));
 assert(!js.includes('/api/auth/unification-status'));
});
test('one-password-only security page removes the second form and endpoint',()=>{
 const html=read('dist/web/lab-login-security.html'),js=read('dist/web/photobridge-r1534-lab-login-security.js');
 const server=read('dist/api/server.js'),security=read('dist/api/lab-login-security.js');
 assert(html.includes('id="changeForm"'));
 assert(html.includes('id="password"')&&html.includes('id="confirmPassword"'));
 assert(html.includes('id="verifyForm"')&&html.includes('id="code"'));
 assert(!html.includes('id="disableForm"'));
 assert(!html.includes('id="disableConfirmation"'));
 assert(!html.includes('غیرفعال‌کردن رمز'));
 assert(!js.includes("$('disableForm')"));
 assert(!js.includes("$('disableConfirmation')"));
 assert(js.includes("'/api/auth/password-reset/complete'"));
 assert(!server.includes("if(req.method==='POST'&&url.pathname==='/api/auth/lab-login-security/disable-password')"));
 assert(server.includes('PB1537 password-disable endpoint retired'));
 assert(!security.includes('export async function disableLabPassword'));
 assert(!security.includes('غیرفعال‌کردن رمز'));
 assert(security.includes('نشست‌های قبلی بسته شوند'));
 assert(server.includes('setSharedPassword(c,locked.user_id,nextPasswordHash'));
});
test('browser assets use new cache busting and security reset keeps OTP',()=>{
 for(const f of ['dist/web/index.html','dist/api/equipment-rental-portal.html']){
  assert(read(f).includes('photobridge-r1393-shared-account.js?v=r1537'),f);
 }
 assert(read('dist/web/lab-login-security.html').includes('photobridge-r1535-sms-otp.js'));
 assert(read('dist/web/photobridge-r1534-lab-login-security.js').includes('PB1535 SMS autofill'));
 assert(!read('dist/web/assets/index-UIRefine-v655-r84.js').includes('دکمهٔ یکسان‌سازی یا بازیابی رمز را بزنید'));
});
