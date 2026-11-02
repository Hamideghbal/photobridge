/* R1536: Password visibility for every browser authentication/password form,
   plus a PhotoBridge-only fallback for unavailable generated startup art. */
(()=>{'use strict';
 if(window.pbR1536PasswordEye)return;
 window.pbR1536PasswordEye=true;
 const fallback='/photobridge-brand-script-r1285.png';
 const css=`
 .pb1536PasswordHost{position:relative!important}
 .pb1536PasswordHost input[data-pb1536-password]{padding-inline-end:66px!important}
 .pb1536PasswordEye{position:absolute;z-index:5;display:inline-flex;align-items:center;justify-content:center;
  gap:3px;height:30px;min-width:53px;padding:0 5px;border:0;border-radius:7px;transform:translateY(-50%);
  background:rgba(247,250,255,.97);color:#34538e;font:600 11px Vazirmatn,Tahoma,sans-serif;
  cursor:pointer;white-space:nowrap;box-sizing:border-box;box-shadow:0 0 0 1px rgba(130,153,190,.15)}
 .pb1536PasswordEye svg{width:16px;height:16px;flex:none}
 .pb1536PasswordEye:focus-visible{outline:2px solid #315efb;outline-offset:2px}
 .pb1536PasswordEye:disabled{opacity:.5;cursor:default}
 `;
 const style=document.createElement('style');style.id='pb1536PasswordEyeStyle';style.textContent=css;
 (document.head||document.documentElement).appendChild(style);
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
 function attach(input){
  const parent=input.parentElement;
  if(!parent||parent.closest('[data-pb-no-password-eye]'))return;
  if(parent.querySelector('.pb1536PasswordEye[data-eye-for="'+input.dataset.pb1536Password+'"]'))return;
  if(!input.dataset.pb1536Password)input.dataset.pb1536Password=String(++attach.sequence);
  parent.classList.add('pb1536PasswordHost');
  const button=document.createElement('button');button.type='button';button.className='pb1536PasswordEye';
  button.dataset.eyeFor=input.dataset.pb1536Password;
  button.setAttribute('aria-label','نمایش رمز');
  button.setAttribute('aria-pressed','false');
  button.innerHTML=icon+'<span>نمایش</span>';
  if(input.id)button.setAttribute('aria-controls',input.id);
  button.addEventListener('click',()=>{
   const visible=input.type==='password';
   input.type=visible?'text':'password';
   button.setAttribute('aria-label',visible?'پنهان‌کردن رمز':'نمایش رمز');
   button.setAttribute('aria-pressed',String(visible));
   button.querySelector('span').textContent=visible?'پنهان':'نمایش';
   position(input,button);
   try{input.focus({preventScroll:true})}catch{input.focus()}
  });
  input.insertAdjacentElement('afterend',button);
  tracked.add(input);
  position(input,button);
 }
 attach.sequence=0;
 function repairBrand(img){
  if(!img||img.dataset.pb1536BrandFallback==='1')return;
  img.dataset.pb1536BrandFallback='1';
  img.src=fallback;
 }
 function mount(){
  document.querySelectorAll('input[type="password"],input[data-pb1536-password]').forEach(input=>{
   if(input.tagName==='INPUT')attach(input);
  });
  document.querySelectorAll('#pbR1361MobileSplash img').forEach(img=>{
   if(img.complete&&!img.naturalWidth)repairBrand(img);
  });
  for(const input of tracked){
   if(!input.isConnected){tracked.delete(input);continue}
   const button=input.parentElement?.querySelector('.pb1536PasswordEye[data-eye-for="'+input.dataset.pb1536Password+'"]');
   if(button)position(input,button);
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
  if(img?.tagName==='IMG'&&img.closest('#pbR1361MobileSplash'))repairBrand(img);
 },true);
 new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
 addEventListener('resize',schedule,{passive:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
 schedule();
})();