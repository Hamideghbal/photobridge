/* Public equipment storefront – two compact login surfaces, one verified SSO handoff. */
(()=>{
'use strict';
const header=document.querySelector('.equipment-site > .site-header');
if(header){
 const measure=()=>document.documentElement.style.setProperty('--equipment-header-height',Math.round(header.getBoundingClientRect().height)+'px');
 if(typeof ResizeObserver==='function')new ResizeObserver(measure).observe(header);
 measure();
}
const dialog=document.querySelector('.photographer-dropdown');
const headerForm=document.querySelector('#equipmentHeaderLogin');
const pageForm=document.querySelector('#equipmentOfficePageLogin');
dialog?.querySelector('.photographer-close')?.addEventListener('click',()=>{dialog.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&dialog?.open)dialog.open=false;});

async function postJson(path,body){
 const res=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-photobridge-portal':'photographer'},body:JSON.stringify(body)});
 let result={};try{result=await res.json()}catch{}
 if(!res.ok){
  const error=result?.error;
  if(res.status===401)throw new Error('شماره موبایل یا رمز عبور صحیح نیست.');
  if(res.status===429)throw new Error('تعداد تلاش‌های ورود زیاد است. کمی بعد دوباره امتحان کنید.');
  if(error==='account_suspended')throw new Error('حساب عکاسی شما غیرفعال شده است.');
  throw new Error('ورود یا انتقال به آفیش انجام نشد. دوباره تلاش کنید.');
 }
 return result;
}
async function loginAndHandoff(form,message){
 const button=form.querySelector('button[type=submit]');
 if(button?.disabled)return;
 button.disabled=true;
 message.textContent='در حال بررسی شماره موبایل و رمز عبور…';
 const mobile=String(form.elements.mobile?.value||'').trim();
 const password=String(form.elements.password?.value||'');
 try{
  await postJson('/api/auth/customer-login',{mobile,password});
  form.elements.password.value='';
  message.textContent='ورود موفق بود؛ انتقال به آفیش همین فروشگاه…';
  const {ticket,origin,destination}=await postJson('/api/storefront/office-handoff',{});
  if(!/^[A-Za-z0-9_-]{43}$/.test(String(ticket||''))||origin!==location.origin||destination!=='https://photobridge.ir/api/auth/equipment-site-handoff'){
   throw new Error('تأیید انتقال انجام نشد. لطفاً دوباره تلاش کنید.');
  }
  // Browser navigates by POST; ticket never enters the URL or sessionStorage,
  // and mobile/password are deliberately excluded from the first-party form.
  const handoff=document.createElement('form');
  handoff.method='POST';
  handoff.action=destination;
  handoff.style.display='none';
  for(const [name,value] of Object.entries({ticket,origin})){
   const input=document.createElement('input');
   input.type='hidden';input.name=name;input.value=value;
   handoff.appendChild(input);
  }
  document.body.appendChild(handoff);
  handoff.submit();
 }catch(error){
  message.textContent=error?.message||'ورود انجام نشد؛ دوباره تلاش کنید.';
 }finally{
  form.elements.password.value='';
  button.disabled=false;
 }
}
for(const [form,message] of [
 [headerForm,document.querySelector('#equipmentHeaderMessage')],
 [pageForm,document.querySelector('#equipmentOfficePageMessage')]
]){
 if(!form||!message)continue;
 form.addEventListener('submit',event=>{event.preventDefault();void loginAndHandoff(form,message);});
}
})();
