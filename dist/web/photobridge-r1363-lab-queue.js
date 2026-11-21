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
  // R1956: the Lab queue has THREE headers. The third portal lives in main,
  // whereas the first two fixed headers live in the surrounding workspace.
  const third=main?.querySelector(':scope>.pb1955ThirdHeaderHost');
  const hasThird=Boolean(third&&third.getClientRects().length&&getComputedStyle(third).display!=='none');
  document.documentElement.classList.toggle('pb1363OrderQueue',active);
  document.documentElement.classList.toggle('pb1956LabThirdHeader',hasThird);
  const root=main?.closest('.labRoleWorkspace');
  const headers=(active||hasThird)?[...root.querySelectorAll('.labSingleHeader,.pb1148SecondaryHeader,.pb1151PrintModes,.pb1372ThirdHeader,.pb1955ThirdHeaderHost')].filter(node=>node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden'):[];
  if(!same(headers,observed)){
   observer?.disconnect();observed=headers;
   if(typeof ResizeObserver!=='undefined'){
    observer||=new ResizeObserver(schedule);
    headers.forEach(node=>observer.observe(node));
   }
  }
  if(!active&&!hasThird)return;
  // R1397: notices are normal-flow children of the viewport, never fixed overlays.
  const edge=Math.ceil(Math.max(0,...headers.map(node=>node.getBoundingClientRect().bottom)));
  if(edge<=0||edge>=innerHeight-100)return;
  const value=edge+'px';
  if(main.style.getPropertyValue('--pb1363-order-top')!==value)main.style.setProperty('--pb1363-order-top',value);
  if(hasThird&&document.documentElement.style.getPropertyValue('--pb1956-third-bottom')!==value)
    document.documentElement.style.setProperty('--pb1956-third-bottom',value);
  // Only the queue owns this offset. Measure the real bottom dock on mobile
  // rather than hardcoding a second scrollbar underneath navigation.
  if(hasThird){
    const dock=root?.querySelector('nav.labBottomAppNav');
    const visible=Boolean(dock?.getClientRects().length&&getComputedStyle(dock).display!=='none');
    const bottom=visible?Math.max(0,Math.ceil(innerHeight-dock.getBoundingClientRect().top)):0;
    const dockValue=bottom+'px';
    if(document.documentElement.style.getPropertyValue('--pb1956-lab-dock-bottom')!==dockValue)
      document.documentElement.style.setProperty('--pb1956-lab-dock-bottom',dockValue);
  }
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

