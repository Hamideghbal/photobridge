/* R1598: keep the Photographer phone dock single and behind its invoice preview.
   React owns the actual navigation and invoice. Never remove React-managed nodes. */
(()=>{
 'use strict';
 if(window.PB1598PhotographerDock)return;
 window.PB1598PhotographerDock=true;
 if(typeof matchMedia!=='function')return;
 const phone=matchMedia('(max-width:820px)');
 const isPhone=()=>phone.matches&&!window.pbNativeStorage;
 let frame=0;
 function sync(){
   frame=0;
   const root=document.documentElement;
   if(!isPhone()||!/^\/photographer(?:\/|$)/.test(location.pathname)){
     root.classList.remove('pb1598CustomerInvoiceOpen');
     document.querySelectorAll('nav[data-pb1598-duplicate="1"]').forEach(n=>n.removeAttribute('data-pb1598-duplicate'));
     return;
   }
   const modal=document.querySelector('.globalInvoicePreviewLayer .customerInvoicePreview');
   root.classList.toggle('pb1598CustomerInvoiceOpen',Boolean(modal));
   const docks=[...document.querySelectorAll('nav.photographerMobileUtilityRail.photographerBottomAppNav:not(.labBottomAppNav)')];
   // Some legacy mobile layouts leave the previous dock mounted during
   // a preview transition. Keep the active visible dock and hide extras.
   const preferred=docks.find(n=>n.closest('.photographerMain'))||docks[0];
   docks.forEach(n=>{
     if(n!==preferred)n.setAttribute('data-pb1598-duplicate','1');
     else n.removeAttribute('data-pb1598-duplicate');
   });
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(sync)}
 function start(){
   new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
   window.addEventListener('popstate',schedule);
   window.addEventListener('pageshow',schedule);
   window.addEventListener('resize',schedule,{passive:true});
   if(phone.addEventListener)phone.addEventListener('change',schedule);
   else if(phone.addListener)phone.addListener(schedule);
   schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();