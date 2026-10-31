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
  const headers=active?[...root.querySelectorAll('.labSingleHeader,.pb1148SecondaryHeader,.pb1151PrintModes,.pb1372ThirdHeader')].filter(node=>node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden'):[];
  /* PB1431 measured finance header */
 const toolbar=active?main.querySelector('.financeWorkspace .pb1176PaymentActions,.financeWorkspace .statementToolbar,.financeWorkspace .pb1423InvoiceToolbar'):null;
 const watched=toolbar?[...headers,toolbar]:headers;
 if(!same(watched,observed)){
   observer?.disconnect();observed=watched;
   if(typeof ResizeObserver!=='undefined'){
    observer||=new ResizeObserver(schedule);
    watched.forEach(node=>observer.observe(node));
   }
  }
  if(!active)return;
  // R1397: notices are normal-flow children of the viewport, never fixed overlays.
  const edge=Math.ceil(Math.max(0,...headers.map(node=>node.getBoundingClientRect().bottom)));
  if(edge<=0||edge>=innerHeight-100)return;
  const toolbarTop=edge+'px';if(main.style.getPropertyValue('--pb1431-toolbar-top')!==toolbarTop)main.style.setProperty('--pb1431-toolbar-top',toolbarTop);
 /* PB1433 settled content edge */
 const value=Math.ceil(toolbar?Math.max(edge,toolbar.getBoundingClientRect().bottom):edge)+'px';
 if(main.style.getPropertyValue('--pb1433-content-top')!==value)main.style.setProperty('--pb1433-content-top',value);
  if(main.style.getPropertyValue('--pb1363-order-top')!==value)main.style.setProperty('--pb1363-order-top',value);
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(measure)}}
 function start(){
  schedule();
  new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','style']});
  addEventListener('resize',schedule);addEventListener('popstate',schedule);
  addEventListener('photobridge-auth-session-changed',schedule);
  media.addEventListener('change',schedule);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

