/* R1538: One password visibility control per field (native control wins).\n   R1536: Password visibility for every browser authentication/password form,
   plus a PhotoBridge-only fallback for unavailable generated startup art. */
(()=>{'use strict';
 if(window.pbR1536PasswordEye)return;
 window.pbR1536PasswordEye=true;
 const fallback='/photobridge-brand-script-r1285.png';
 const icon='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
 const tracked=new Set();
 const position=(input,button)=>{
  if(!input.isConnected||!button.isConnected)return;
  const host=input.parentElement;
  if(!host)return;
  const a=input.getBoundingClientRect(),b=host.getBoundingClientRect();
  if(!a.width||!a.height)return;
  button.style.top=(a.top-b.top+a.height/2)+'px';
  const direction=getComputedStyle(input).direction;
  if(direction==='ltr'){
   button.style.right=(b.right-a.right+7)+'px';
   button.style.left='auto';
  }else{
   button.style.left=(a.left-b.left+7)+'px';
   button.style.right='auto';
  }
 };
 function nativeToggle(input){
  // Prefer a control already provided by the site's React/native form.
  // Match by both label and location so other password fields and submit
  // actions cannot suppress the correct control.
  const a=input.getBoundingClientRect();
  if(!a.width||!a.height)return null;
  const parent=input.parentElement;
  for(const host of [parent,parent?.parentElement]){
   if(!host)continue;
   for(const btn of host.querySelectorAll('button,[role="button"]')){
    if(btn.classList.contains('pb1536PasswordEye'))continue;
    const label=[btn.textContent,btn.getAttribute('aria-label'),btn.getAttribute('title')].join(' ').trim();
    if(!/(?:نمایش|مخفی|پنهان|چشم|show|hide|visibility|password|رمز)/i.test(label))continue;
    const b=btn.getBoundingClientRect();
    if(!b.width||!b.height)continue;
    const nearY=Math.abs((b.top+b.bottom)/2-(a.top+a.bottom)/2)<Math.max(30,a.height*.6);
    const withinX=b.left>=a.left-14&&b.right<=a.right+14;
    if(nearY&&withinX)return btn;
   }
  }
  return null;
 }
 function attach(input){
  const parent=input.parentElement;
  if(!parent||parent.closest('[data-pb-no-password-eye]'))return;
  // If the form already has its own left-hand "نمایش" control, use it.
  if(nativeToggle(input)){
   const existing=parent.querySelector('.pb1536PasswordEye[data-eye-for="'+input.dataset.pb1536Password+'"]');
   existing?.remove();tracked.delete(input);return;
  }
  if(parent.querySelector('.pb1536PasswordEye[data-eye-for="'+input.dataset.pb1536Password+'"]'))return;
  if(!input.dataset.pb1536Password)input.dataset.pb1536Password=String(++attach.sequence);
  parent.classList.add('pb1536PasswordHost');
  const button=document.createElement('button');button.type='button';button.className='pb1536PasswordEye';
  button.dataset.eyeFor=input.dataset.pb1536Password;
  button.setAttribute('aria-label','نمایش رمز');
  button.setAttribute('aria-pressed','false');
  button.innerHTML='<span>نمایش</span>'+icon;
  if(input.id)button.setAttribute('aria-controls',input.id);
  button.addEventListener('click',()=>{
   const visible=input.type==='password';
   input.type=visible?'text':'password';
   button.setAttribute('aria-label',visible?'پنهان‌کردن رمز':'نمایش رمز');
   button.setAttribute('aria-pressed',String(visible));
   button.querySelector('span').textContent=visible?'مخفی‌کردن':'نمایش';
   position(input,button);
   try{input.focus({preventScroll:true})}catch{input.focus()}
  });
  input.insertAdjacentElement('afterend',button);
  tracked.add(input);
  position(input,button);
 }
 attach.sequence=0;
 function isOwnBrand(img){
  const src=img?.getAttribute('src')||'';
  return img?.closest('#pbR1361MobileSplash')||/^\/photobridge-(?:launch|mobile-launch|app|icon|brand|favicon)[a-z0-9.-]*\.(?:png|svg|webp)(?:\?.*)?$/i.test(src);
 }
 function repairBrand(img){
  if(!img||img.dataset.pb1536BrandFallback==='1')return;
  img.dataset.pb1536BrandFallback='1';
  img.src=fallback;
 }
 function mount(){
  document.querySelectorAll('input[type="password"],input[data-pb1536-password]').forEach(input=>{
   if(input.tagName==='INPUT')attach(input);
  });
  document.querySelectorAll('#pbR1361MobileSplash img,img[src^="/photobridge-"]').forEach(img=>{
   if(isOwnBrand(img)&&img.complete&&!img.naturalWidth)repairBrand(img);
  });
  for(const input of tracked){
   if(!input.isConnected){tracked.delete(input);continue}
   const button=input.parentElement?.querySelector('.pb1536PasswordEye[data-eye-for="'+input.dataset.pb1536Password+'"]');
   if(button){if(nativeToggle(input)){button.remove();tracked.delete(input)}else position(input,button)}
  }
 }
 let pending=false;
 function schedule(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(()=>{pending=false;mount()});
 }
 document.addEventListener('error',event=>{
  const img=event.target;
  // Never replace uploaded studio, photographer, store, or lab branding.
  if(img?.tagName==='IMG'&&isOwnBrand(img))repairBrand(img);
 },true);
 new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
 addEventListener('resize',schedule,{passive:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
 schedule();
})();