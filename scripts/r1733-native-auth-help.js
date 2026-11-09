/* R1733 — Windows Lab: public password recovery in the system browser only.
   Do not send credentials, tokens or the typed password to any extra script. */
(()=>{'use strict';
 if(location.hostname!=='127.0.0.1')return;
 if(window.pbR1733NativeAuthHelp)return;
 window.pbR1733NativeAuthHelp=true;
 const recovery='https://photobridge.ir/account-recovery.html';
 // Some Windows keyboards paste Persian/Arabic digits into the mobile field.
 // Normalize only the submitted mobile; do not trim or change the password.
 const normalizeMobile=value=>String(value)
  .replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
  .replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
  .replace(/[\s\u200c\u200e\u200f\u2066-\u2069]/g,'');
 const previousFetch=window.fetch.bind(window);
 window.fetch=function(input,init){
  try{
   const url=new URL(typeof input==='string'?input:input?.url||'',location.href);
   if(url.origin===location.origin&&url.pathname==='/api/auth/lab-login'
      &&String(init?.method||input?.method||'GET').toUpperCase()==='POST'
      &&typeof init?.body==='string'){
    const body=JSON.parse(init.body);
    if(body&&typeof body.mobile==='string'){
     const mobile=normalizeMobile(body.mobile);
     if(mobile!==body.mobile)init={...init,body:JSON.stringify({...body,mobile})};
    }
   }
  }catch{/* Retain original request exactly if it cannot be parsed. */}
  return previousFetch(input,init);
 };

 const isRecovery=el=>{
  if(!el||!el.matches?.('a,button,[role="button"]'))return false;
  const label=String(el.textContent||el.getAttribute('aria-label')||'').trim();
  return el.classList.contains('forgotPasswordLink') ||
    /فراموش.{0,15}رمز|بازیابی.{0,15}رمز|یکسان.{0,15}سازی.{0,15}رمز/.test(label);
 };
 const inLogin=el=>!!(el.closest('.unifiedLoginPage,.authShell,form.labLogin,form.unifiedLoginCard,.rentalUnifiedLogin')||[...document.querySelectorAll('form')].some(form=>form.contains(el)&&form.querySelector('input[type="password"]')&&form.querySelector('input[type="tel"],input[name="mobile"]')));
 function openRecovery(){
  // Electron's external-navigation handler opens HTTPS links in the default
  // system browser, where the existing OTP recovery flow is already supported.
  window.open(recovery,'_blank','noopener,noreferrer');
 }
 document.addEventListener('click',event=>{
  const control=event.target?.closest?.('a,button,[role="button"]');
  if(!isRecovery(control)||!inLogin(control))return;
  event.preventDefault();event.stopImmediatePropagation();
  openRecovery();
 },true);
 function mount(){
  const form=document.querySelector('.unifiedLoginPage form,.authShell form,form.labLogin')||[...document.querySelectorAll('form')].find(f=>!f.closest('dialog')&&f.querySelector('input[type="password"]')&&f.querySelector('input[type="tel"],input[name="mobile"]'));
  if(!form||!form.querySelector('input[type="password"],.passwordField input'))return;
  if(form.querySelector('.pbR1733RecoveryLink'))return;
  // Keep the original recovery link whenever present; do not render a duplicate.
  if([...form.querySelectorAll('a,button,[role="button"]')].some(isRecovery))return;
  const link=document.createElement('a');
  link.className='pbR1733RecoveryLink';
  link.href=recovery;link.target='_blank';link.rel='noopener noreferrer';
  link.textContent='فراموشی رمز عبور';
  link.style.cssText='display:inline-flex;align-items:center;justify-content:center;align-self:flex-start;margin:6px 0;color:#315efb;font:700 12px Vazirmatn,Tahoma,sans-serif;';
  form.append(link);
 }
 let scheduled=false;
 const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount()})};
 new MutationObserver(records=>{if(records.some(record=>!record.target?.closest?.('.pbR1733RecoveryLink')))schedule()})
  .observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
 else schedule();
})();
