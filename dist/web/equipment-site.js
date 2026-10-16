/* Public equipment store: local photographer login and server-bound one-use handoff.
   Never pass a password or PhotoBridge session cookie through navigation URLs. */
(()=>{'use strict';
const header=document.querySelector('.equipment-site > .site-header');
if(header){const measure=()=>document.documentElement.style.setProperty('--equipment-header-height',Math.round(header.getBoundingClientRect().height)+'px');if(typeof ResizeObserver==='function')new ResizeObserver(measure).observe(header);measure();}
const panels=[...document.querySelectorAll('.photographer-panel,.equipment-office-login-card')];
const forms=[...document.querySelectorAll('[data-equipment-login]')];
if(!forms.length)return;
let activeUser=null,transferring=false;
const errors={credentials_invalid:'شماره موبایل یا رمز عبور صحیح نیست.',invalid_credentials:'شماره موبایل یا رمز عبور صحیح نیست.',photographer_auth_required:'برای آفیش، ورود با حساب عکاسی فعال لازم است.',handoff_expired:'مدت اعتبار ورود تمام شد؛ دوباره ورود را بزنید.',invalid_origin:'درخواست ورود از دامنه فروشگاه تأیید نشد.'};
const showMessage=message=>document.querySelectorAll('[data-equipment-login-message]').forEach(el=>{el.textContent=message||'';});
const setBusy=busy=>{for(const button of document.querySelectorAll('[data-equipment-login] button[type=submit],[data-equipment-handoff]'))button.disabled=busy;};
async function request(path,body){
 const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',body:JSON.stringify(body)}:{}),headers:{'content-type':'application/json','x-photobridge-portal':'photographer'}});
 let data=null;try{data=await response.json();}catch{}
 if(!response.ok)throw Error(errors[data?.error]||'ورود انجام نشد. دوباره تلاش کنید.');
 return data;
}
function show(user){
 activeUser=user?.labRole==='customer'?user:null;
 for(const form of forms)form.hidden=Boolean(activeUser);
 for(const card of document.querySelectorAll('[data-equipment-signed-in]'))card.hidden=!activeUser;
 for(const label of document.querySelectorAll('[data-equipment-user]'))label.textContent=activeUser?(activeUser.photographerName||activeUser.name||'عکاس'):'';
}
async function restore(){try{show((await request('/api/auth/me'))?.user);}catch{show(null);}}
async function enterOffice(){
 if(transferring)return;transferring=true;setBusy(true);showMessage('در حال انتقال ایمن به آفیش تجهیزات همین فروشگاه…');
 try{
  const data=await request('/api/auth/equipment-store-handoff',{});
  const destination=new URL(data.redirectUrl);
  if(!/^\/auth\/equipment-store-handoff$/.test(destination.pathname)||!destination.searchParams.has('code')||destination.protocol!=='https:')throw Error('مسیر انتقال تأیید نشد.');
  window.location.assign(destination.href);
 }catch(error){showMessage(error.message||'انتقال انجام نشد. دوباره تلاش کنید.');transferring=false;setBusy(false);}
}
for(const form of forms)form.addEventListener('submit',async event=>{
 event.preventDefault();
 if(transferring)return;
 const button=form.querySelector('button[type=submit]');button.disabled=true;showMessage('در حال ورود…');
 try{
  await request('/api/auth/customer-login',Object.fromEntries(new FormData(form)));
  form.elements.password.value='';
  await restore();
  if(!activeUser){showMessage('ورود با حساب عکاسی تأیید نشد.');return;}
  await enterOffice();
 }catch(error){showMessage(error.message||'ورود انجام نشد.');}
 finally{if(!transferring)button.disabled=false;}
});
document.querySelectorAll('[data-equipment-handoff]').forEach(button=>button.addEventListener('click',enterOffice));
document.querySelectorAll('[data-equipment-logout]').forEach(button=>button.addEventListener('click',async()=>{
 button.disabled=true;try{await request('/api/auth/logout',{});show(null);showMessage('از حساب خارج شدید.');}catch(error){showMessage(error.message);}finally{button.disabled=false;}
}));
const dropdown=document.querySelector('.photographer-dropdown');
if(dropdown){
 dropdown.querySelector('.login-panel-close')?.addEventListener('click',()=>{dropdown.open=false;dropdown.querySelector('summary')?.focus({preventScroll:true});});
 dropdown.addEventListener('toggle',()=>{if(dropdown.open){dropdown.querySelector('form:not([hidden]) input[name=mobile]')?.focus({preventScroll:true});}});
 document.addEventListener('click',event=>{if(!dropdown.contains(event.target))dropdown.open=false;});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&dropdown.open){dropdown.open=false;dropdown.querySelector('summary')?.focus({preventScroll:true});}});
}
void restore();
})();
