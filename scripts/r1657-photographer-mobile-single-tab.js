/* R1657: center a single visible Photographer mobile Print/Album mode.
   Only data annotation; no React element reordering or click interception. */
(()=>{
 'use strict';
 if(typeof window.matchMedia!=='function')return;
 const phone=window.matchMedia('(max-width:820px)');
 let scheduled=false;
 const visible=button=>button.tagName==='BUTTON'&&!button.hidden&&
   button.getAttribute('aria-hidden')!=='true'&&
   window.getComputedStyle(button).display!=='none'&&
   window.getComputedStyle(button).visibility!=='hidden'&&
   button.getClientRects().length>0;
 function sync(){
  scheduled=false;
  for(const nav of document.querySelectorAll('#root main.photographerMain .photographerPrintModeNav')){
   const count=phone.matches?[...nav.children].filter(visible).length:0;
   const next=count===1?'1':'0';
   if(nav.dataset.pb1657Single!==next)nav.dataset.pb1657Single=next;
  }
 }
 function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(sync);
 }
 function start(){
  new MutationObserver(schedule).observe(document.body,{
   childList:true,subtree:true,attributes:true,
   attributeFilter:['hidden','style','class','aria-hidden']
  });
  window.addEventListener('popstate',schedule);
  window.addEventListener('resize',schedule,{passive:true});
  if(phone.addEventListener)phone.addEventListener('change',schedule);
  else if(phone.addListener)phone.addListener(schedule);
  schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
