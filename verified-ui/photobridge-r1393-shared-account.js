(()=>{'use strict';
 if(window.pbSharedAccountRecovery)return;window.pbSharedAccountRecovery=true;
 const errors={invalid_mobile:'شماره موبایل معتبر وارد کنید.',mobile_not_found:'حساب فعالی با این شماره پیدا نشد.',invalid_otp:'کد تأیید صحیح نیست.',otp_expired:'مهلت کد تمام شده؛ دوباره کد بگیرید.',otp_attempts_exceeded:'تعداد تلاش ناموفق زیاد شده؛ دوباره کد بگیرید.',otp_rate_limited:'تعداد درخواست زیاد شده؛ چند دقیقه دیگر تلاش کنید.',sms_not_configured:'ارسال پیامک فعلاً در دسترس نیست.',sms_send_failed:'پیامک ارسال نشد؛ دوباره تلاش کنید.',reset_invalid:'این درخواست منقضی یا استفاده شده است؛ دوباره کد بگیرید.',existing_account_invalid:'وضعیت حساب تغییر کرده است؛ دوباره تلاش کنید.'};
 const request=async(action,body)=>{const response=await fetch('/api/auth/password-reset/'+action,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(errors[data.error]||'عملیات انجام نشد؛ دوباره تلاش کنید.');return data};
 function open(source,initialMobile){
  if(window.pbNativeStorage&&location.hostname==='127.0.0.1'){window.open('https://photobridge.ir/account-recovery.html','_blank');return}
  const dialog=document.createElement('dialog');dialog.className='pbSharedAccountDialog';dialog.dir='rtl';
  dialog.innerHTML='<form method="dialog"><button class="pbSharedAccountClose" aria-label="بستن" type="submit">×</button></form><h2>یک رمز برای همهٔ بخش‌ها</h2><p>رمز جدید برای حساب عکاس، لابراتوار و فروشگاه این شماره اعمال می‌شود. اطلاعات و عضویت‌های شما حفظ می‌شوند و ورودهای قبلی بسته خواهند شد.</p><form class="pbSharedAccountForm"><label>شماره موبایل<input name="mobile" type="tel" dir="ltr" autocomplete="tel" required></label><label data-otp hidden>کد پیامکی<input name="code" inputmode="numeric" autocomplete="one-time-code" dir="ltr" maxlength="6"></label><label data-password hidden>رمز مشترک جدید<input name="password" type="password" autocomplete="new-password" dir="ltr"></label><label data-password hidden>تکرار رمز<input name="confirm" type="password" autocomplete="new-password" dir="ltr"></label><p role="alert" class="pbSharedAccountError"></p><p role="status" class="pbSharedAccountStatus" aria-live="polite"></p><button class="pbSharedAccountSubmit" type="submit">دریافت کد تأیید</button><button type="button" data-retry hidden>دریافت کد جدید</button></form>';
  const form=dialog.querySelector('.pbSharedAccountForm'),mobile=form.elements.mobile,code=form.elements.code,password=form.elements.password,confirm=form.elements.confirm,submit=dialog.querySelector('.pbSharedAccountSubmit'),error=dialog.querySelector('[role=alert]'),status=dialog.querySelector('[role=status]'),retry=dialog.querySelector('[data-retry]');
  const from=source.querySelector('input[type=tel],input[name=mobile],input[name*=mobile]');mobile.value=initialMobile||from?.value||'';let challenge=null,resetToken=null,busy=false,stopOtp=()=>{};
  const show=(selector,visible)=>dialog.querySelectorAll(selector).forEach(el=>el.hidden=!visible);
  retry.onclick=()=>{if(busy)return;stopOtp();challenge=null;resetToken=null;mobile.readOnly=false;show('[data-otp]',false);show('[data-password]',false);code.required=password.required=confirm.required=false;retry.hidden=true;submit.textContent='دریافت کد تأیید';error.textContent=status.textContent='';password.value=confirm.value=code.value=''};
  form.onsubmit=async event=>{event.preventDefault();if(busy)return;busy=true;submit.disabled=retry.disabled=true;error.textContent='';try{
   if(!challenge){stopOtp();stopOtp=window.pbSmsOtp?.listen(code)||(()=>{});const result=await request('request',{portal:'account',mobile:mobile.value});if(!result.challengeId)throw Error('درخواست تأیید نشد.');challenge=result.challengeId;mobile.readOnly=true;show('[data-otp]',true);show('[data-password]',true);code.required=password.required=confirm.required=true;password.minLength=confirm.minLength=8;retry.hidden=false;submit.textContent='ثبت رمز مشترک';status.textContent='کد پیامکی و رمز مشترک جدید را وارد کنید.';code.focus()}
   else{if(password.value.length<8)throw Error('رمز جدید باید حداقل ۸ کاراکتر باشد.');if(password.value!==confirm.value)throw Error('تکرار رمز یکسان نیست.');if(!resetToken){stopOtp();const verified=await request('verify',{challengeId:challenge,code:code.value});if(!verified.resetToken)throw Error('کد تأیید نشد.');resetToken=verified.resetToken;}await request('complete',{challengeId:challenge,resetToken,newPassword:password.value,confirmPassword:confirm.value});password.value=confirm.value=code.value='';show('[data-otp]',false);show('[data-password]',false);submit.hidden=retry.hidden=true;status.textContent='رمز مشترک ثبت شد. برای ورود، با رمز جدید وارد شوید.';const returnButton=document.createElement('button');returnButton.type='button';returnButton.textContent='بازگشت به صفحه ورود';returnButton.onclick=()=>{dialog.close();let to='/';try{to=sessionStorage.getItem('pb1537_login_return')||'/';sessionStorage.removeItem('pb1537_login_return')}catch{}location.assign(to.startsWith('/')&&!to.startsWith('//')&&to!=='/account-recovery.html'?to:'/')};form.append(returnButton)}
  }catch(e){stopOtp();error.textContent=e.message||'ارتباط برقرار نشد؛ دوباره تلاش کنید.'}finally{busy=false;submit.disabled=retry.disabled=false}};
  dialog.addEventListener('close',()=>{stopOtp();password.value=confirm.value=code.value='';dialog.remove()},{once:true});document.body.append(dialog);dialog.showModal();mobile.focus();
 }

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
 const launcher=document.querySelector('[data-open-shared-account]');if(launcher){let initialMobile='';try{initialMobile=sessionStorage.getItem('pb1537_legacy_mobile')||'';sessionStorage.removeItem('pb1537_legacy_mobile')}catch{}launcher.onclick=()=>open(document,initialMobile);open(document,initialMobile);}
/* PB1537 conditional unification */
})();

/* PB1535 SMS autofill */
