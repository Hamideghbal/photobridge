import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const replaceOne=(s,a,b,label)=>{if(s.split(a).length!==2)throw Error('R1537 missing unique '+label);return s.replace(a,b);};
// Browser-only: the server has already verified a legacy password when it returns
// account_password_unification_required. Do not expose mobile lookup/enumeration APIs.
let path='dist/web/photobridge-r1393-shared-account.js',s=read(path);
if(!s.includes('/* PB1537 conditional unification */')){
 s=replaceOne(s,' function open(source){',' function open(source,initialMobile){','dialog entry');
 s=replaceOne(s,"mobile.value=from?.value||'';","mobile.value=initialMobile||from?.value||'';","verified mobile prefill");
 const a=s.indexOf(' let scheduled=false;'),b=s.indexOf(' const launcher=',a);
 if(a<0||b<=a)throw Error('R1537 legacy universal hint block changed');
 s=s.slice(0,a)+`
 // Only an actual verified legacy-credential conflict may launch recovery.
 const originalFetch=window.fetch.bind(window);
 function promptAfterLegacyLogin(mobile){
  if(document.querySelector('.pbSharedAccountDialog'))return;
  const source=document.activeElement?.closest('form')||document.querySelector('.unifiedLoginPage form,#loginForm,.trialForm form,form.photographerSignupForm')||document;
  if(window.pbNativeStorage&&location.hostname==='127.0.0.1'){
   if(document.querySelector('[data-pb1537-native-recovery]'))return;
   const button=document.createElement('button');button.type='button';
   button.dataset.pb1537NativeRecovery='1';
   button.textContent='برای یکسان‌سازی رمز قدیمی، تأیید پیامکی را باز کنید';
   button.onclick=()=>open(source,mobile);
   (source===document?document.body:source).appendChild(button);return;
  }
  open(source,mobile);
 }
 window.fetch=function(input,init){
  return Promise.resolve(originalFetch(input,init)).then(response=>{
   try{
    const target=new URL(typeof input==='string'?input:input?.url||'',location.href);
    const method=String(init?.method||input?.method||'GET').toUpperCase();
    if(method!=='POST'||target.origin!==location.origin||!target.pathname.startsWith('/api/auth/')||!target.pathname.includes('login')||response.status!==409)return response;
    let mobile='';
    try{const raw=typeof init?.body==='string'?JSON.parse(init.body):{};mobile=String(raw.mobile||raw.phone||raw.phoneNumber||'');}catch{}
    response.clone().json().then(data=>{
     if(data?.error==='account_password_unification_required')promptAfterLegacyLogin(mobile);
    }).catch(()=>{});
   }catch{}
   return response;
  });
 };
`+s.slice(b);
 s=replaceOne(s,"status.textContent='رمز مشترک ثبت شد. اکنون با همین شماره و رمز وارد شوید یا عضویت جدید را ادامه دهید.'","status.textContent='رمز مشترک ثبت شد. برای ورود، با رمز جدید وارد شوید.';const returnButton=document.createElement('button');returnButton.type='button';returnButton.textContent='بازگشت به صفحه ورود';returnButton.onclick=()=>{dialog.close();const field=source.querySelector('input[type=password]');field?.focus()};form.append(returnButton)","return to login");
 s=s.replace('})();','/* PB1537 conditional unification */\n})();');
 write(path,s);
}
// Replace obsolete hints in the main login UI; no global password dialog/link
// should appear for accounts which log in normally.
path='dist/web/assets/index-UIRefine-v655-r84.js';s=read(path);
s=s.replaceAll('دکمهٔ یکسان‌سازی یا بازیابی رمز را بزنید و با کد پیامکی یک رمز مشترک تعیین کنید.','مرحله تأیید پیامکی برای اصلاح رمزهای قدیمی به‌صورت خودکار باز می‌شود.');
s=s.replaceAll('با دکمهٔ یکسان‌سازی یا بازیابی رمز، برای این شماره یک رمز مشترک تعیین کنید.','مرحله تأیید پیامکی به‌صورت خودکار باز می‌شود.');
write(path,s);
path='dist/api/equipment-rental-portal.html';if(fs.existsSync(path)){s=read(path);s=s.replaceAll('گزینهٔ یکسان‌سازی یا بازیابی رمز را انتخاب کنید.','مرحله تأیید پیامکی به‌صورت خودکار باز می‌شود.');write(path,s);}
// Invalidate cached legacy recovery UI after the conditional-login change.
for(const htmlPath of ['dist/web/index.html','dist/web/account-recovery.html','dist/api/equipment-rental-register.html','dist/api/equipment-rental-portal.html']){
 if(!fs.existsSync(htmlPath))continue;
 let html=read(htmlPath);
 html=html.replaceAll('photobridge-r1393-shared-account.js?v=r1535','photobridge-r1393-shared-account.js?v=r1537');
 html=html.replaceAll('photobridge-r1393-shared-account.js?v=r1393','photobridge-r1393-shared-account.js?v=r1537');
 write(htmlPath,html);
}
// Retire the second, password-disabling action from the SMS security page.
path='dist/web/lab-login-security.html';s=read(path);
const from=s.indexOf('<form id="disableForm"'),to=s.indexOf('</form>',from);
if(from<0||to<from)throw Error('R1537 second security action not found');
s=s.slice(0,from)+s.slice(to+7);
s=s.replace('برای تغییر رمز یا قطع دسترسی، ابتدا شمارهٔ مدیر را با کد پیامکی تأیید کنید.','برای تغییر رمز، ابتدا شمارهٔ مدیر را با کد پیامکی تأیید کنید.')
 .replace('تغییر یا غیرفعال‌کردن آن، همهٔ نشست‌های حساب‌های این شماره را در تمام نقش‌ها می‌بندد.','تغییر آن، همهٔ نشست‌های قبلی حساب‌های این شماره را در تمام نقش‌ها می‌بندد.');
write(path,s);
path='dist/web/photobridge-r1534-lab-login-security.js';s=read(path);
s=replaceOne(s,"$('disableConfirmation').checked=false;",'','disable reset');
const disableStart=s.indexOf(" $('disableForm').onsubmit="),disableEnd=s.indexOf('\n if(!validLab){',disableStart);
if(disableStart<0||disableEnd<disableStart)throw Error('R1537 second JS action not found');
s=s.slice(0,disableStart)+s.slice(disableEnd);
s=replaceOne(s,"if(!validLab){$('disableForm').hidden=true;","if(!validLab){",'disabled action invalid lab branch');
s+='\n/* PB1537 change-password only */\n';write(path,s);
// The retired endpoint must not remain callable after removing its UI.
path='dist/api/server.js';s=read(path);
const routeStart=s.indexOf("    if(req.method==='POST'&&url.pathname==='/api/auth/lab-login-security/disable-password'){");
const routeEnd=s.indexOf("    if (req.method === 'POST' && url.pathname === '/api/auth/password-reset/request')",routeStart);
if(routeStart<0||routeEnd<=routeStart)throw Error('R1537 disable-password route boundary changed');
s=s.slice(0,routeStart)+'    /* PB1537 password-disable endpoint retired: OTP-verified password change only. */\n'+s.slice(routeEnd);
s=replaceOne(s,"import {sendLabLoginAlert,disableLabPassword} from './lab-login-security.js';","import {sendLabLoginAlert} from './lab-login-security.js';",'retired route import');
write(path,s);
// Change SMS alert wording, remove the unreachable password-disabling function.
path='dist/api/lab-login-security.js';s=read(path);
s=replaceOne(s,'اگر این ورود را نمی‌شناسید، تغییر رمز یا غیرفعال‌کردن رمز و خروج از نشست‌ها:','اگر این ورود را نمی‌شناسید، رمز را با تأیید پیامکی تغییر دهید تا نشست‌های قبلی بسته شوند:','SMS instructions');
s=replaceOne(s,"import crypto from 'node:crypto';\nimport {setSharedPassword,sharedMobile} from './shared-credentials.js';","import {sharedMobile} from './shared-credentials.js';",'unused disable imports');
const unused=s.indexOf('// The SMS URL is only a navigation link.');
if(unused<0)throw Error('R1537 retired helper missing');
s=s.slice(0,unused)+'// Password changes use the existing OTP-verified password-reset endpoint.\n';
s=s.replace(/^const uuid=.*\n/m,'');
write(path,s);
