/* R2037: no full-screen entry gate. Native authenticated UI owns first paint.
   Optional lab controls and bounded selection requests remain in R2035. */
(()=>{
 'use strict';
 if(!matchMedia('(min-width:821px)').matches||!/^\/photographer(?:\/|$)/.test(location.pathname)||/^\/photographer\/(?:signup|register|invite)(?:\/|$)/.test(location.pathname))return;
 const html=document.documentElement;
 const printPath=p=>/^\/photographer\/(?:orders|upload|album|archive|finance)(?:\/|$)/.test(p);
 function releaseEntry(){
  html.classList.remove('pb2035EntryPending');
  document.getElementById('pb2035EntryOverlay')?.remove();
 }
 releaseEntry();
 // A cached flag is not proof of a pending navigation. Once the native
 // destination exists, retire only its legacy loading cover.
 function clearLegacy(){
  if(!printPath(location.pathname)||new URLSearchParams(location.search).get('pbLabChooser')==='1')return;
  if(document.querySelector('#pbR99LabChooser:not([hidden])'))return;
  const native=document.querySelector('#photographerRoleHeaderV710 .photographerPrintModeNav');
  const area=document.querySelector('main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea');
  if(!native||!area)return;
  html.classList.remove('pbR100F37LabEnterBoot','pbR100F14LabChooserBoot');
  try{sessionStorage.removeItem('photobridge:r100f37:lab-enter-pending')}catch{}
 }
 // No features event, cloned header, network response or animation frame
 // is allowed to hold the whole app behind an additional loading layer.
 // Keep the legacy cleanup limited to a real, already-mounted Print page.
 let queued=false;
 function schedule(){
  if(queued)return;
  queued=true;requestAnimationFrame(()=>{queued=false;releaseEntry();clearLegacy()});
 }
 function boot(){
  releaseEntry();clearLegacy();
  if(document.body)new MutationObserver(records=>{
   if(html.classList.contains('pb2035EntryPending')||html.classList.contains('pbR100F37LabEnterBoot')||html.classList.contains('pbR100F14LabChooserBoot'))schedule();
  }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  // Also cover initial legacy prepaint flags, which can be installed later in head.
  for(const ms of [0,100,350,1000,3000,6000])setTimeout(schedule,ms);
 }
 addEventListener('popstate',schedule);
 addEventListener('pageshow',schedule);
 addEventListener('photobridge-auth-session-changed',schedule);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
