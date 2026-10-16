/* R1279 – first-party equipment-office sign-in.
   Credentials are posted ONLY to the current PhotoBridge origin. No cross-domain cookie,
   authorization token, password query parameter, or browser-side credential relay. */
(()=>{
 'use strict';
 const params=new URLSearchParams(location.search);
 if(location.pathname!=='/equipment-rental/book'||params.get('pbOfficeLogin')!=='1')return;
 if(location.hostname!=='photobridge.ir'||location.protocol!=='https:'){location.replace('https://photobridge.ir/equipment-rental/book?panel=rental&pbOfficeLogin=1');return;}
 const form=document.getElementById('equipmentOfficeLogin');
 const container=document.getElementById('authNeeded');
 const app=document.getElementById('app');
 const message=document.getElementById('equipmentOfficeLoginMessage');
 if(!form||!container||!message)return;
 const target='/equipment-rental/book?panel=rental';
 const focusLogin=()=>{
  if(app)app.style.display='none';
  container.style.display='block';
  form.hidden=false;
  form.elements.mobile?.focus({preventScroll:true});
 };
 const api=async(path,options={})=>{
  const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,
    headers:{'x-photobridge-portal':'photographer',...options.headers}});
  let data=null;
  try{data=await response.json()}catch{}
  return {ok:response.ok,status:response.status,data};
 };
 const authenticated=async()=>{
  const result=await api('/api/auth/me');
  return result.ok&&result.data?.user?.labRole==='customer';
 };
 const go=()=>location.replace(target);
 async function setup(){
  try{if(await authenticated()){go();return;}}
  catch{/* network failure still allows interactive first-party login */}
  focusLogin();
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(form.dataset.submitting==='1')return;
  const mobile=String(form.elements.mobile.value||'').trim();
  const password=String(form.elements.password.value||'');
  if(!mobile||!password)return;
  const button=form.querySelector('[type=submit]');
  form.dataset.submitting='1';
  button.disabled=true;
  message.textContent='در حال بررسی حساب عکاسی…';
  try{
   const result=await api('/api/auth/customer-login',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({mobile,password})
   });
   if(!result.ok){
    message.textContent=['credentials_invalid','invalid_credentials'].includes(result.data?.error)
     ?'شماره موبایل یا رمز عبور صحیح نیست.'
     :'ورود انجام نشد. دوباره تلاش کنید.';
    return;
   }
   if(!(await authenticated())){message.textContent='ورود با حساب عکاسی تأیید نشد.';return;}
   message.textContent='ورود موفق بود؛ در حال بازکردن آفیش تجهیزات…';
   go();
  }catch{message.textContent='ارتباط با فوتوبریج برقرار نشد. دوباره تلاش کنید.';}
  finally{
   form.elements.password.value='';
   form.dataset.submitting='0';
   button.disabled=false;
  }
 });
 void setup();
})();
