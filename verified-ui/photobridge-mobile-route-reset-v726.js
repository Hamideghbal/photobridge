/* PhotoBridge v784 — reset the reused photographer mobile scroller after every photographer route change.
   Prevents Print from leaking scroll position / measured layout variables into the other mobile tabs. */
(()=>{
  'use strict';
  if(window.__PB726_ROUTE_RESET__)return;
  window.__PB726_ROUTE_RESET__=true;
  const isMobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  const isTargetRoute=()=>/^\/photographer(?:\/|$)/.test(location.pathname);
  let lastKey='';

  function resetNow(){
    if(!isMobile()||!isTargetRoute())return;
    const main=document.querySelector('.photographerMain');
    if(!(main instanceof HTMLElement))return;
    const area=main.querySelector(':scope > .photographerRolePageScrollArea');
    if(area instanceof HTMLElement)area.scrollTop=0;
    try{
      const page=document.scrollingElement;
      if(page)page.scrollTop=0;
    }catch{}
    /* Print/album measurement scripts write CSS custom properties directly on the reused
       React <main>. Clear those values as soon as we leave the Print workspace so AI,
       Gallery, Design and Store tabs recover their normal flow and scroll container. */
    if(!main.classList.contains('photographerPrintWorkspace')){
      for(const name of ['--pb742-content-top','--pb742-nav-bottom','--pb743-album-top','--pb743-album-bottom','--pb761-content-top','--pb761-content-bottom'])main.style.removeProperty(name);
      document.getElementById('pb742-print-actions')?.remove();
      document.getElementById('pb737-mobile-print-dock')?.remove();
      document.body.classList.remove('pb737-mobile-print-active');
      document.querySelectorAll('.pb737MobilePrintRedesign').forEach(node=>node.classList.remove('pb737MobilePrintRedesign'));
    }
    /* Album desktop/mobile rules have used their own configurator scroller in older builds. */
    const albumConfigurator=area?.querySelector?.('.photographerAlbumCreateFlush .albumConfigurator');
    if(albumConfigurator instanceof HTMLElement)albumConfigurator.scrollTop=0;
  }

  function schedule(force=false){
    const main=document.querySelector('.photographerMain');
    const key=`${location.pathname}${location.search}|${main?.className||''}`;
    if(!force&&key===lastKey)return;
    lastKey=key;
    requestAnimationFrame(()=>requestAnimationFrame(resetNow));
    setTimeout(resetNow,80);
    setTimeout(resetNow,220);
  }

  for(const name of ['pushState','replaceState']){
    const original=history[name];
    if(typeof original!=='function')continue;
    history[name]=function(...args){
      const out=original.apply(this,args);
      window.dispatchEvent(new Event('pb726routechange'));
      return out;
    };
  }
  addEventListener('popstate',()=>schedule(true),{passive:true});
  addEventListener('pb726routechange',()=>schedule(true),{passive:true});
  addEventListener('pageshow',()=>schedule(true),{passive:true});

  const start=()=>{
    schedule(true);
    const root=document.getElementById('root')||document.body;
    const observer=new MutationObserver(()=>schedule(false));
    observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
