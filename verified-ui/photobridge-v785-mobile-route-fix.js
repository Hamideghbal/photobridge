/* PhotoBridge v785 — hard mobile route isolation after Print and finance/store scroll recovery. */
(()=>{
  'use strict';
  if(window.__PB785_MOBILE_ROUTE_FIX__)return;
  window.__PB785_MOBILE_ROUTE_FIX__=true;
  const mobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  const onPhotographer=()=>/^\/photographer(?:\/|$)/.test(location.pathname);
  let lastRoute='',wasPrint=false,raf=0;
  const vars=['--pb742-content-top','--pb742-nav-bottom','--pb743-album-top','--pb743-album-bottom','--pb761-nav-height','--pb761-scroll-clearance','--pb761-content-top','--pb761-content-bottom'];
  const props=['position','top','left','right','bottom','inset','width','height','min-height','max-height','margin','box-sizing','overflow','overflow-y','overflow-x','touch-action','overscroll-behavior','-webkit-overflow-scrolling','scroll-behavior'];
  const staleIds=['pb742-print-actions','pb737-mobile-print-dock','pb761-mode-actions','pb762-back','pb762-add','pb753-mobile-order-actions','pb754-album-create-actions','pb755-mode-actions','pb756-mode-actions','pb757-mode-actions'];
  const staleSelectors=['.pb761PhotoStatuses','.pb761AlbumStageStatuses','.pb752OrderStatuses','.pb754AlbumStageRail','.pb755OrderStatuses','.pb756PhotoStatuses','.pb756AlbumStageStatuses','.pb757PhotoStatuses','.pb757AlbumStageStatuses'];
  function cleanup(resetTop=false){
    if(!mobile()||!onPhotographer())return;
    const main=document.querySelector('.photographerMain');
    if(!(main instanceof HTMLElement))return;
    const inPrint=main.classList.contains('photographerPrintWorkspace');
    const area=main.querySelector(':scope > .photographerRolePageScrollArea');
    if(!inPrint){
      for(const name of vars)main.style.removeProperty(name);
      main.classList.remove('pb762Composing','pb737MobilePrintRedesign');
      document.body.classList.remove('pb737-mobile-print-active');
      for(const id of staleIds)document.getElementById(id)?.remove();
      document.querySelectorAll(staleSelectors.join(',')).forEach(n=>n.remove());
      if(area instanceof HTMLElement){
        for(const prop of props)area.style.removeProperty(prop);
        if(resetTop)area.scrollTop=0;
      }
      document.getElementById('pb783StoreComingSoon')?.remove();
      document.documentElement.classList.remove('pb783StoreSoonOpen');
    }
    wasPrint=inPrint;
  }
  function check(force=false){
    const main=document.querySelector('.photographerMain');
    const nowPrint=!!main?.classList?.contains('photographerPrintWorkspace');
    const key=`${location.pathname}${location.search}`;
    const routeChanged=key!==lastRoute;
    const leftPrint=wasPrint&&!nowPrint;
    if(!force&&!routeChanged&&!leftPrint){cleanup(false);return}
    lastRoute=key;
    if(raf)cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{raf=0;cleanup(routeChanged||leftPrint)});
    setTimeout(()=>cleanup(false),60);
    setTimeout(()=>cleanup(false),180);
  }
  for(const method of ['pushState','replaceState']){
    const original=history[method];
    if(typeof original!=='function')continue;
    history[method]=function(...args){const out=original.apply(this,args);queueMicrotask(()=>check(true));return out};
  }
  addEventListener('popstate',()=>check(true),{passive:true});
  addEventListener('pageshow',()=>check(true),{passive:true});
  const start=()=>{
    check(true);
    const root=document.getElementById('root')||document.body;
    new MutationObserver(()=>check(false)).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
