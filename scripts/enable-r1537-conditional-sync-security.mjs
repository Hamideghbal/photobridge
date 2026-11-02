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
 // Remove old universal sync affordances, even if client hydration restores them.
 function removeLegacyHints(){
  for(const el of document.querySelectorAll('[data-shared-account],.pbSharedAccountHint'))el.remove();
 }
 let hintScheduled=false;
 const hintObserver=new MutationObserver(()=>{if(hintScheduled)return;hintScheduled=true;requestAnimationFrame(()=>{hintScheduled=false;removeLegacyHints()})});
 hintObserver.observe(document.documentElement,{childList:true,subtree:true});
 removeLegacyHints();
 // Only an actual verified legacy-credential conflict may launch recovery.
 const originalFetch=window.fetch.bind(window);
 function promptAfterLegacyLogin(mobile){
  if(location.pathname==='/account-recovery.html')return;
  if(document.documentElement.dataset.pb1537Navigating==='1')return;
  document.documentElement.dataset.pb1537Navigating='1';
  try{
   sessionStorage.setItem('pb1537_legacy_mobile',mobile||'');
   sessionStorage.setItem('pb1537_login_return',location.pathname+location.search+location.hash);
  }catch{}
  // Only a verified legacy login conflict can trigger navigation.
  if(window.pbNativeStorage&&location.hostname==='127.0.0.1'){
   window.open('https://photobridge.ir/account-recovery.html','_blank');
   document.documentElement.dataset.pb1537Navigating='0';
   return;
  }
  location.assign('/account-recovery.html');
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
 s=replaceOne(s,"status.textContent='رمز مشترک ثبت شد. اکنون با همین شماره و رمز وارد شوید یا عضویت جدید را ادامه دهید.'","status.textContent='رمز مشترک ثبت شد. برای ورود، با رمز جدید وارد شوید.';const returnButton=document.createElement('button');returnButton.type='button';returnButton.textContent='بازگشت به صفحه ورود';returnButton.onclick=()=>{dialog.close();let to='/';try{to=sessionStorage.getItem('pb1537_login_return')||'/';sessionStorage.removeItem('pb1537_login_return')}catch{}location.assign(to.startsWith('/')&&!to.startsWith('//')&&to!=='/account-recovery.html'?to:'/')};form.append(returnButton)","return to login");
 s=replaceOne(s," const launcher=document.querySelector('[data-open-shared-account]');if(launcher){launcher.onclick=()=>open(document);open(document);}"," const launcher=document.querySelector('[data-open-shared-account]');if(launcher){let initialMobile='';try{initialMobile=sessionStorage.getItem('pb1537_legacy_mobile')||'';sessionStorage.removeItem('pb1537_legacy_mobile')}catch{}launcher.onclick=()=>open(document,initialMobile);open(document,initialMobile);}",'recovery page boot');
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
// Force fresh small eye-icon CSS/JS on every browser login/registration page.
for(const htmlPath of [
 'dist/web/index.html','dist/web/account-recovery.html','dist/web/lab-login-security.html',
 'dist/api/equipment-rental-register.html','dist/api/equipment-rental-portal.html',
 'dist/api/equipment-rental-book.html','dist/api/admin-equipment-rental.html'
]){
 if(!fs.existsSync(htmlPath))continue;
 let html=read(htmlPath);
 html=html.replaceAll('photobridge-r1536-password-eye-brand.css?v=r1536','photobridge-r1536-password-eye-brand.css?v=r1537');
 html=html.replaceAll('photobridge-r1536-password-eye-brand.js?v=r1536','photobridge-r1536-password-eye-brand.js?v=r1537');
 write(htmlPath,html);
}
// A historical photographer-only identity can have two old hashes without any
// additional business role. Accept the already valid photographer password in
// that one special case; never permit lab/store sign-in to bypass unification.
path='dist/api/server.js';s=read(path);
{
 const sectionStart=s.indexOf('    const loginWithMobile = async (expected) => {');
 const sectionEnd=s.indexOf("    if (req.method === 'POST' && url.pathname === '/api/auth/lab-login')",sectionStart);
 if(sectionStart<0||sectionEnd<=sectionStart)throw Error('R1537 login route boundary changed');
 let body=s.slice(sectionStart,sectionEnd);
 const guardStart=body.indexOf('if(!wantsAdmin){const state=businessLoginState(mobileMatches,password,passwordVerify);');
 const guardEnd=body.indexOf('        let user = null, selectedMembership',guardStart);
 if(guardStart<0||guardEnd<=guardStart)throw Error('R1537 shared-account login guard missing');
 const previous=body.slice(guardStart,guardEnd);
 if(!previous.includes("error:'account_password_unification_required'"))throw Error('R1537 cannot identify old guard');
 const replacement=`let pb1537SoloPhotographer=false;
        if(!wantsAdmin){
          const state=businessLoginState(mobileMatches,password,passwordVerify);
          if(state.needsUnification){
            const only=mobileMatches.length===1?mobileMatches[0]:null;
            if(expected==='customer'&&only?.active===true&&only.photographer_enabled===true
               &&(passwordVerify(password,only.password_hash)||passwordVerify(password,only.photographer_password_hash))){
              try{
                const check=await pool.query(\`SELECT (
                  EXISTS(SELECT 1 FROM lab_memberships WHERE user_id=$1 AND active=true AND role NOT IN ('customer','photographer'))
                  OR EXISTS(SELECT 1 FROM equipment_rental_shop_memberships WHERE user_id=$1 AND active=true AND role NOT IN ('customer','photographer'))
                ) AS has_other_business_role /* PB1537 solo photographer roles */\`,[only.id]);
                pb1537SoloPhotographer=check.rows[0]?.has_other_business_role===false;
              }catch{pb1537SoloPhotographer=false;}
            }
            if(!pb1537SoloPhotographer)return sendJson(res,409,{error:'account_password_unification_required',message:'رمزهای قدیمی این شماره متفاوت‌اند؛ با تأیید پیامکی یک رمز مشترک برای عکاس، لابراتوار و فروشگاه تعیین کنید.'});
          }
        }
        `;
 body=body.slice(0,guardStart)+replacement+body.slice(guardEnd);
 const key='passwordVerify(password, r.password_hash)';
 if(body.split(key).length!==3)throw Error('R1537 photographer password candidate count changed');
 body=body.replaceAll(key,"(passwordVerify(password,r.password_hash)||(pb1537SoloPhotographer&&passwordVerify(password,r.photographer_password_hash)))");
 s=s.slice(0,sectionStart)+body+s.slice(sectionEnd);
}
write(path,s);
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
