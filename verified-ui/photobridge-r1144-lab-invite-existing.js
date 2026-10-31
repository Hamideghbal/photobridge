/* Lab invitation: existing PhotoBridge photographers verify by SMS, not by signing up again. */
(()=>{
 'use strict';
 const match=location.pathname.match(/^\/invite\/([^/]+)\/?$/);
 if(!match)return;
 const token=decodeURIComponent(match[1]);
 const endpoint='/api/invitations/public/'+encodeURIComponent(token);
 let challengeId='',busy=false;
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=text;if(cls)e.className=cls;return e;};
 const normalDigits=s=>String(s||'').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
 const messages={invalid_invite:'دعوت‌نامه معتبر نیست یا منقضی شده است.',invite_mobile_mismatch:'شماره موبایل با دعوت‌نامه مطابقت ندارد.',sms_not_configured:'سامانه ارسال پیامک فعال نیست.',sms_send_failed:'ارسال کد تأیید انجام نشد.',invalid_otp:'کد تأیید معتبر نیست.',otp_expired:'زمان اعتبار کد تمام شده است. دوباره درخواست کد بدهید.',otp_too_many_attempts:'تعداد تلاش‌های ناموفق زیاد است.',invitation_confirmed_login_failed:'عضویت تأیید شد اما ورود خودکار انجام نشد؛ از بخش ورود عکاس استفاده کنید.'};
 async function send(path,payload){
  let response;
  try{response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(payload)});}
  catch{throw Error('اتصال به سرور برقرار نشد. دوباره تلاش کنید.');}
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.message||messages[data.error]||'درخواست انجام نشد. دوباره تلاش کنید.');
  return data;
 }
 function page(inv){
  if(document.getElementById('pb1144ExistingInvite'))return;
  document.documentElement.classList.add('pb1144ExistingInvite');
  const sheet=el('main',null,'pb1144InvitePage');sheet.id='pb1144ExistingInvite';sheet.dir='rtl';
  const card=el('section',null,'pb1144InviteCard');sheet.append(card);
  card.append(el('span','PhotoBridge','pb1144Brand'),el('h1','تأیید دعوت‌نامه همکاری'));
  card.append(el('p','این شماره قبلاً در فوتوبریج عضو شده است؛ نیازی به تکمیل دوباره اطلاعات ثبت‌نام نیست.'));
  const account=el('div',null,'pb1144Account');
  account.append(el('strong',String(inv.existingAccount?.name||'حساب عکاس')),
    el('span',String(inv.invite?.targetMobile||'')));
  card.append(account);
  const message=el('p','کد تأیید به شماره موبایل حساب شما ارسال می‌شود.','pb1144Help');card.append(message);
  const form=el('form');form.noValidate=true;card.append(form);
  const sendBtn=el('button','ارسال کد تأیید','pb1144Primary');sendBtn.type='submit';form.append(sendBtn);
  const codeLabel=el('label','کد تأیید شش‌رقمی','pb1144CodeLabel');codeLabel.hidden=true;
  const input=el('input');input.type='text';input.inputMode='numeric';input.autocomplete='one-time-code';
  input.maxLength=6;input.placeholder='------';input.dir='ltr';input.setAttribute('aria-label','کد تأیید شش‌رقمی');
  codeLabel.append(input);form.insertBefore(codeLabel,sendBtn);
  const repeat=el('button','ارسال دوباره کد','pb1144Repeat');repeat.type='button';repeat.hidden=true;form.append(repeat);
  const status=el('div','','pb1144Message');status.setAttribute('role','status');status.setAttribute('aria-live','polite');card.append(status);
  form.onsubmit=async ev=>{
    ev.preventDefault();if(busy)return;
    busy=true;sendBtn.disabled=true;repeat.disabled=true;status.textContent='';
    try{
      if(!challengeId){
        const result=await send(endpoint+'/register',{mobile:inv.invite?.targetMobile||''});
        if(!result.verificationRequired||!result.challengeId)throw Error('ارسال کد تأیید کامل نشد.');
        challengeId=result.challengeId;codeLabel.hidden=false;repeat.hidden=false;sendBtn.textContent='تأیید کد و ورود';
        message.textContent='کد ارسال شد. پس از تأیید، حساب شما به لابراتوار متصل می‌شود.';
        input.focus();
      }else{
        const code=normalDigits(input.value).replace(/\D/g,'');
        if(!/^\d{6}$/.test(code))throw Error('کد شش‌رقمی را کامل وارد کنید.');
        const result=await send(endpoint+'/register/verify',{challengeId,code});
        if(!result.ok||!result.verified)throw Error('تأیید عضویت تکمیل نشد.');
        if(result.loggedIn===true){location.replace(result.redirect||'/photographer');return;}
        status.textContent='عضویت تأیید شد. برای ورود به حساب از صفحه ورود عکاس استفاده کنید.';
        sendBtn.hidden=true;repeat.hidden=true;
      }
    }catch(e){status.textContent=e.message;}
    finally{busy=false;sendBtn.disabled=false;repeat.disabled=false;}
  };
  repeat.onclick=async()=>{
    if(busy)return;busy=true;repeat.disabled=true;sendBtn.disabled=true;status.textContent='';
    try{
      const data=await send(endpoint+'/register',{mobile:inv.invite?.targetMobile||''});
      if(!data.challengeId)throw Error('ارسال دوباره کد انجام نشد.');
      challengeId=data.challengeId;input.value='';status.textContent='کد جدید ارسال شد.';input.focus();
    }catch(e){status.textContent=e.message;}finally{busy=false;repeat.disabled=false;sendBtn.disabled=false;}
  };
  document.body.append(sheet);
 }
 async function init(){
  try{
   const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store'});
   if(!response.ok)return;
   const data=await response.json();
   if(data.valid===true&&data.existingAccount?.exists===true)page(data);
  }catch{}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
