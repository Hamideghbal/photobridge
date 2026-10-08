/* PhotoBridge R100F16 — strict header/route isolation between Print/Lab, Store and other photographer tabs. */
(()=>{
  'use strict';
  if(window.__PB_R100F16_HEADER_ROUTE_ISOLATION__)return;
  window.__PB_R100F16_HEADER_ROUTE_ISOLATION__=true;

  const q=(s,r=document)=>r?.querySelector?.(s)||null;
  const qa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const onPhotographer=()=>/^\/photographer(?:\/|$)/.test(location.pathname)&&!/^\/photographer\/(?:signup|invite|register)(?:\/|$)/.test(location.pathname);
  const printRoute=()=>{
    if(!onPhotographer())return false;
    const p=location.pathname,qry=new URLSearchParams(location.search);
    return qry.get('workspace')==='print'||/^\/photographer\/(?:orders|upload|album|archive|finance)(?:\/|$)/.test(p);
  };
  const printDomActive=()=>!!q('.photographerMain.photographerPrintWorkspace,.photographerMain.photographerLabWorkspaceMode')||document.documentElement.classList.contains('pb817PrintContext');

  const printVars=['--pb742-content-top','--pb742-nav-bottom','--pb743-album-top','--pb743-album-bottom','--pb761-nav-height','--pb761-scroll-clearance','--pb761-content-top','--pb761-content-bottom'];
  const printIds=['pb742-print-actions','pb737-mobile-print-dock','pb761-mode-actions','pb762-back','pb762-add','pb765-add','pb753-mobile-order-actions','pb754-album-create-actions','pb755-mode-actions','pb756-mode-actions','pb757-mode-actions','pb673PhotographerLabIdentityBar','pbR99LabChooser','pb696PrintBarActions','pb697PrintBarActions','pb698PrintBarActions'];
  const storeIds=['photographerStoreRoleHeader','photographerStoreIdentityBar','storeSectionNavV673','photographerStoreBottomNav','storePhotographerWorkspace'];
  let raf=0,guarding=false;

  function clearPrintResidue(force=false){
    if(!onPhotographer()||(!force&&printRoute()))return;
    for(const main of qa('.photographerMain')){
      main.classList.remove('photographerPrintWorkspace','photographerLabWorkspaceMode','pb673HasLabIdentityBar','pb762Composing','pb737MobilePrintRedesign','pb766PageLeaving','pb766ComposerEnter','pb767ComposerEnter','pb817PrintComposer','pb817PrintFinanceMain');
      for(const name of printVars)main.style.removeProperty(name);
      main.removeAttribute('data-pb790-finance');
      main.removeAttribute('data-pb791-finance');
      const area=q(':scope > .photographerRolePageScrollArea',main);
      if(area instanceof HTMLElement){
        for(const prop of ['position','top','left','right','bottom','inset','width','height','min-height','max-height','margin','box-sizing','overflow','overflow-y','overflow-x','touch-action','overscroll-behavior','-webkit-overflow-scrolling','scroll-behavior'])area.style.removeProperty(prop);
      }
    }
    for(const id of printIds)document.getElementById(id)?.remove();
    document.documentElement.classList.remove('pb817PrintContext','pb817PrintFinance','pb818PrintContext','pb818PrintFinance','pb821PrintFinance','pbR100F14LabChooserBoot');
    document.body.classList.remove('pb737-mobile-print-active','pbR100F14ChoosingLab');
    document.documentElement.style.removeProperty('overflow');
    document.body.style.removeProperty('overflow');
  }

  function clearStoreResidue(){
    if(!onPhotographer())return;
    document.body.classList.remove('rentalPhotographerMode','pbR96ChoosingStore');
    document.documentElement.classList.remove('pb786StoreRoute','pbR67SheetOpen');
    for(const id of storeIds)document.getElementById(id)?.remove();
    document.getElementById('pbR67Sheet')?.remove();
  }

  function guard(){
    raf=0;
    if(guarding||!onPhotographer())return;
    guarding=true;
    try{
      clearStoreResidue();
      if(!printRoute())clearPrintResidue(true);
    }finally{guarding=false}
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(guard)}

  function cleanDestination(raw){
    const u=new URL(raw,location.href);
    if(u.origin!==location.origin)return u.href;
    if(/^\/photographer\/(?:ai|gallery|album-design|wallet|settings|labs)(?:\/|$)/.test(u.pathname)||u.pathname==='/photographer'){
      u.searchParams.delete('workspace');
      u.searchParams.delete('pbLabChooser');
      u.searchParams.delete('pbEntryDone');
    }
    return u.href;
  }
  function targetHref(el){
    const explicit=String(el?.dataset?.mainHref||el?.getAttribute?.('href')||'').trim();
    if(explicit)return explicit;
    const label=String(el?.getAttribute?.('aria-label')||el?.querySelector?.('em')?.textContent||el?.textContent||'').replace(/\s+/g,' ').trim();
    if(label==='هوش مصنوعی')return '/photographer/ai/retouch';
    if(label==='گالری'||label==='گالری مشتریان')return '/photographer/gallery';
    if(label==='طراحی آلبوم')return '/photographer/album-design';
    if(label==='اینستاگرام'||label==='طراحی اینستاگرام')return '/photographer/album-design?pb_mode=instagram';
    if(label==='فروشگاه'||label==='فروشگاه تجهیزات'||el?.classList?.contains('photographerStoreEntry')||el?.classList?.contains('photographerStoreMobileNav')||el?.classList?.contains('pbRental656MobileBtn'))return '/equipment-rental/book';
    return '';
  }

  // R100F48: clear legacy workspace residue, then let the existing router navigate
  // without forcing another full document load.
  document.addEventListener('click',e=>{
    if(!onPhotographer()||!(printRoute()||printDomActive()))return;
    const el=e.target?.closest?.('.photographerHomeModeNav>button,.photographerBottomAppNavGrid>button,.photographerStoreEntry,.photographerStoreMobileNav,.pbRental656MobileBtn,[data-main-href]');
    if(!el)return;
    const raw=targetHref(el);if(!raw)return;
    const dest=new URL(raw,location.href);
    const destIsPrint=dest.origin===location.origin&&(new URLSearchParams(dest.search).get('workspace')==='print'||/^\/photographer\/(?:orders|upload|album|archive|finance)(?:\/|$)/.test(dest.pathname));
    if(destIsPrint)return;
    clearPrintResidue(true);
    clearStoreResidue();
  },true);

  for(const name of ['pushState','replaceState']){
    const old=history[name];
    if(typeof old!=='function'||old.__pbR100F16)continue;
    const fn=function(state,title,url){
      const out=old.call(this,state,title,url);
      queueMicrotask(schedule);
      return out;
    };
    fn.__pbR100F16=true;history[name]=fn;
  }
  addEventListener('popstate',schedule,{passive:true});
  addEventListener('pageshow',schedule,{passive:true});
  const start=()=>{
    guard();
    const root=document.getElementById('root')||document.body;
    new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','id','data-pb790-finance','data-pb791-finance']});
    setTimeout(guard,60);setTimeout(guard,220);setTimeout(guard,700);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
