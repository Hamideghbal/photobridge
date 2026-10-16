/* R1282 — Photographer mobile bottom destinations always reopen their chooser.
   Capture clicks before React/legacy handlers restore a stale selected shop/lab. */
(()=>{'use strict';
 const mobile=()=>window.matchMedia('(max-width:820px)').matches;
 const allowed=()=>/^\/(?:photographer(?:\/|$)|equipment-rental\/book(?:\/|$))/.test(location.pathname);
 const STORE='/equipment-rental/book?pbStoreChooser=1';
 const PRINT='/photographer/orders/flow?workspace=print&pbLabChooser=1';
 function destination(button){
   const nav=button.closest('nav.photographerBottomAppNav[aria-label="ناوبری اصلی عکاس"],#photographerStoreBottomNav');
   if(!nav||nav.classList.contains('labBottomAppNav')||button.closest('.labBottomAppNavGrid'))return '';
   const label=String(button.getAttribute('aria-label')||button.querySelector('em')?.textContent||button.textContent||'').replace(/\s+/g,' ').trim();
   const target=String(button.getAttribute('data-main-href')||button.getAttribute('href')||'');
   if(button.hasAttribute('data-store-home')||label==='فروشگاه')return STORE;
   if(label==='چاپ'||(target.includes('workspace=print')&&label!=='فروشگاه'))return PRINT;
   return '';
 }
 document.addEventListener('click',event=>{
   if(!mobile()||!allowed()||event.defaultPrevented)return;
   const button=event.target?.closest?.('button,a');if(!button)return;
   const dest=destination(button);if(!dest)return;
   // The store chooser is already open; avoid an unnecessary reload.
   if(dest===STORE&&location.pathname==='/equipment-rental/book'&&document.body.classList.contains('pbR96ChoosingStore'))return;
   // Likewise the print chooser is already open (its overlay owns selections).
   if(dest===PRINT&&document.getElementById('pbR99LabChooser'))return;
   event.preventDefault();event.stopImmediatePropagation();
   location.assign(dest);
 },true);
 if(location.pathname!=='/equipment-rental/book')return;
 let queued=false,observer=null;
 function fit(){
   queued=false;if(!mobile())return;
   const shell=document.querySelector('#storePhotographerWorkspace>.shell');
   const dock=document.getElementById('photographerStoreBottomNav');if(!shell||!dock)return;
   const rect=dock.getBoundingClientRect();
   const visible=rect.height>0&&getComputedStyle(dock).display!=='none'&&getComputedStyle(dock).visibility!=='hidden';
   // Uses the actual dock top; 0 for embedded shops whose local dock is hidden.
   const space=visible?Math.max(0,Math.round(window.innerHeight-rect.top)):0;
   const px=space+'px';
   if(shell.style.getPropertyValue('bottom')!==px||shell.style.getPropertyPriority('bottom')!=='important')
     shell.style.setProperty('bottom',px,'important');
   document.documentElement.style.setProperty('--pb1282-mobile-dock-space',px);
   if(!observer&&window.ResizeObserver){
     observer=new ResizeObserver(schedule);observer.observe(dock);
   }
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(fit)}}
 window.addEventListener('resize',schedule,{passive:true});
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('pageshow',schedule);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
 window.addEventListener('load',schedule,{once:true});
 // Switching shop and chooser changes body class without changing the dock node.
 const watch=()=>{new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
})();
