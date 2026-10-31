/* Equipment storefront r1281 – two native local photographer forms; one safe handoff. */
(()=>{
'use strict';
const header=document.querySelector('.equipment-site > .site-header');
if(header){
 const measure=()=>document.documentElement.style.setProperty('--equipment-header-height',Math.round(header.getBoundingClientRect().height)+'px');
 if(typeof ResizeObserver==='function')new ResizeObserver(measure).observe(header);measure();
}
// Mobile section links stay on the home page, and dismiss the menu on selection.
document.querySelectorAll('.mobile-menu-links a').forEach(link=>link.addEventListener('click',()=>{const menu=link.closest('details');if(menu)menu.open=false;}));
const homeSections=matchMedia('(max-width:760px)');
const sectionLinks=[...document.querySelectorAll('.mobile-menu-links a')].filter(a=>['/#equipment-services','/#equipment-guides'].includes(a.getAttribute('href'))).map(a=>({a,home:a.getAttribute('href'),page:a.hash==='#equipment-services'?'/equipment':'/guides'}));
const syncSections=()=>sectionLinks.forEach(({a,home,page})=>{a.href=homeSections.matches?home:page;});syncSections();homeSections.addEventListener('change',syncSections);
const guideLink=document.querySelector('.hero .actions .secondary');
if(guideLink){const media=matchMedia('(max-width:760px)');const sync=()=>{guideLink.href=media.matches?'/#equipment-guides':'/guides';};sync();media.addEventListener('change',sync);}
const dialog=document.querySelector('.photographer-dropdown');
const forms=[...document.querySelectorAll('#equipmentHeaderLogin,#equipmentOfficePageLogin')];
if(!forms.length)return;
dialog?.querySelector('.photographer-close')?.addEventListener('click',()=>{dialog.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&dialog?.open)dialog.open=false;});
async function json(path,body){
 const r=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-photobridge-portal':'photographer'},body:JSON.stringify(body)});
 let data={};try{data=await r.json()}catch{}
 if(!r.ok)throw new Error(r.status===401?'شماره موبایل یا رمز عبور اشتباه است.':r.status===403?'دسترسی به آفیش این فروشگاه برای حساب شما فعال نیست.':r.status===429?'تعداد تلاش‌های ورود زیاد است. کمی بعد دوباره امتحان کنید.':'ورود یا انتقال انجام نشد. دوباره تلاش کنید.');
 return data;
}
let busy=false;
for(const form of forms)form.addEventListener('submit',async event=>{
 event.preventDefault();
 const button=form.querySelector('button[type=submit]');
 const message=document.getElementById(form.id==='equipmentHeaderLogin'?'equipmentHeaderMessage':'equipmentOfficePageMessage');
 if(busy)return;
 busy=true;for(const f of forms)f.querySelector('button[type=submit]').disabled=true;
 message.textContent='در حال بررسی اطلاعات…';
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
 finally{
  form.elements.password.value='';
  busy=false;for(const f of forms)f.querySelector('button[type=submit]').disabled=false;
 }
});
})();
