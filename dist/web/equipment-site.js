/* Equipment storefront – preserve login dialog, then a one-use POST handoff. */
(()=>{
'use strict';
const header=document.querySelector('.equipment-site > .site-header');
if(header){
 const measure=()=>document.documentElement.style.setProperty('--equipment-header-height',Math.round(header.getBoundingClientRect().height)+'px');
 if(typeof ResizeObserver==='function')new ResizeObserver(measure).observe(header);measure();
}
const dialog=document.querySelector('.photographer-dropdown'),form=document.querySelector('#equipmentHeaderLogin'),message=document.querySelector('#equipmentHeaderMessage');
if(!dialog||!form)return;
dialog.querySelector('.photographer-close')?.addEventListener('click',()=>{dialog.open=false;});
document.querySelectorAll('[data-open-equipment-login]').forEach(button=>button.addEventListener('click',event=>{
 event.preventDefault();dialog.open=true;dialog.querySelector('input[name=mobile]')?.focus({preventScroll:true});
}));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&dialog.open)dialog.open=false;});
async function json(path,body){
 const r=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-photobridge-portal':'photographer'},body:JSON.stringify(body)});
 let data={};try{data=await r.json()}catch{}
 if(!r.ok)throw new Error(r.status===401?'شماره موبایل یا رمز عبور اشتباه است.':r.status===429?'تعداد تلاش‌های ورود زیاد است. کمی بعد دوباره امتحان کنید.':'ورود یا انتقال انجام نشد. دوباره تلاش کنید.');
 return data;
}
form.addEventListener('submit',async event=>{
 event.preventDefault();
 const button=form.querySelector('button[type=submit]');if(button.disabled)return;
 button.disabled=true;message.textContent='در حال بررسی اطلاعات…';
 const mobile=String(form.elements.mobile.value||'').trim(),password=String(form.elements.password.value||'');
 try{
  await json('/api/auth/customer-login',{mobile,password});
  form.elements.password.value='';
  message.textContent='ورود تأیید شد؛ در حال انتقال به آفیش همین فروشگاه…';
  const {ticket,origin,destination}=await json('/api/storefront/office-handoff',{});
  if(!/^[A-Za-z0-9_-]{43}$/.test(String(ticket||''))||origin!==location.origin||destination!=='https://photobridge.ir/api/auth/equipment-site-handoff')throw Error('انتقال امن انجام نشد.');
  const handoff=document.createElement('form');
  handoff.method='POST';handoff.action=destination;handoff.style.display='none';
  for(const [name,value] of Object.entries({ticket,origin})){
   const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;handoff.appendChild(input);
  }
  document.body.appendChild(handoff);
  handoff.submit();
 }catch(e){message.textContent=e.message||'ورود انجام نشد.';}
 finally{form.elements.password.value='';button.disabled=false;}
});
})();
