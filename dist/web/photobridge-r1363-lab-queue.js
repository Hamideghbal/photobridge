(()=>{
 'use strict';
 if(window.__PB1363_LAB_QUEUE__)return;
 window.__PB1363_LAB_QUEUE__=true;
 // The working native storage bridge identifies the installed Lab app (1.0.21+).
 // That app already owns a persistent alarm window; the page must not open one too.
 window.__PB_NATIVE_ORDER_ALERTS__=typeof window.pbNativeStorage?.invoke==='function';
 const media=matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)');
 let scheduled=false,observer=null,observed=[];
 function same(a,b){return a.length===b.length&&a.every((value,i)=>value===b[i])}
 function measure(){
  scheduled=false;
  const main=document.querySelector('.labRoleWorkspace main.appWorkspacePage.pbFixedRoleHeader');
  const active=Boolean(media.matches&&main?.querySelector(':scope>.labRolePageScrollArea'));
  document.documentElement.classList.toggle('pb1363OrderQueue',active);
  const root=main?.closest('.labRoleWorkspace');
  const visible=node=>node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden';
  const headers=active?[...root.querySelectorAll('.labSingleHeader,.pb1148SecondaryHeader,.pb1151PrintModes,.pb1372ThirdHeader')].filter(visible):[];
  const alert=active?root.querySelector('.labCollaborationAlert'):null;
  const watched=alert&&visible(alert)?[...headers,alert]:headers;
  if(!same(watched,observed)){
   observer?.disconnect();observed=watched;
   if(typeof ResizeObserver!=='undefined'){
    observer||=new ResizeObserver(schedule);
    watched.forEach(node=>observer.observe(node));
   }
  }
  if(!active)return;
  let edge=Math.ceil(Math.max(0,...headers.map(node=>node.getBoundingClientRect().bottom)));
  // R1396: reserve the notice's actual wrapped height below every visible header.
  const alertTop=edge+8+'px';
  if(root.style.getPropertyValue('--pb1396-alert-top')!==alertTop)root.style.setProperty('--pb1396-alert-top',alertTop);
  if(alert&&visible(alert))edge+=8+Math.ceil(alert.getBoundingClientRect().height)+8;
  if(edge<=0||edge>=innerHeight-100)return;
  const value=edge+'px';
  if(main.style.getPropertyValue('--pb1363-order-top')!==value)main.style.setProperty('--pb1363-order-top',value);
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(measure)}}
 function start(){
  schedule();
  new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  addEventListener('resize',schedule);addEventListener('popstate',schedule);
  addEventListener('photobridge-auth-session-changed',schedule);
  media.addEventListener('change',schedule);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

