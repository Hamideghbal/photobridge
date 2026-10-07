/* PhotoBridge v786 — mobile route stability: no scroll reset loops, deterministic Store navigation/state. */
(()=>{
  'use strict';
  if(window.__PB786_ROUTE_STABILITY__)return;
  window.__PB786_ROUTE_STABILITY__=true;
  const ADMIN_MOBILE='09125678720';
  const mobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  const photographer=()=>/^\/photographer(?:\/|$)/.test(location.pathname);
  if(/^\/photographer\/store\/?$/.test(location.pathname)){location.replace('/equipment-rental/book');return}
  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const normalize=v=>{let d=String(v||'').replace(/\D/g,'');if(d.startsWith('0098'))d=d.slice(4);else if(d.startsWith('98')&&d.length>=12)d=d.slice(2);if(d.startsWith('9')&&d.length===10)d='0'+d;return d};
  let adminPromise=null,lastRoute='',lastPrint=false,raf=0;

  function routeMode(){
    const p=location.pathname.replace(/\/+$/,'')||'/';
    const q=new URLSearchParams(location.search);
    if(/^\/photographer\/(orders|upload|album|archive|finance)(?:\/|$)/.test(p)||q.get('workspace')==='print')return 'print';
    if(/^\/photographer\/ai(?:\/|$)/.test(p))return 'ai';
    if(p==='/photographer/gallery')return 'gallery';
    if(/^\/photographer\/album-design(?:\/|$)/.test(p))return q.get('pb_mode')==='instagram'?'instagram':'album';
    if(/^\/photographer\/store(?:\/|$)/.test(p))return 'store';
    if(/^\/photographer\/wallet(?:\/|$)/.test(p))return 'wallet';
    if(/^\/photographer\/settings(?:\/|$)/.test(p))return 'settings';
    if(/^\/photographer\/labs(?:\/|$)/.test(p))return 'labs';
    return '';
  }
  function resolveAdmin(){
    if(adminPromise)return adminPromise;
    adminPromise=fetch('/api/auth/me',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}})
      .then(async r=>{const d=await r.json().catch(()=>null);return normalize(d?.user?.mobile)===ADMIN_MOBILE}).catch(()=>false);
    return adminPromise;
  }
  function cleanupLegacyStore(){
    qs('#pb783StoreComingSoon')?.remove();
    document.documentElement.classList.remove('pb783StoreSoonOpen');
  }
  function cleanupPrintLeak(){
    const main=qs('.photographerMain');if(!(main instanceof HTMLElement))return;
    const area=qs(':scope > .photographerRolePageScrollArea',main);
    for(const name of ['--pb742-content-top','--pb742-nav-bottom','--pb743-album-top','--pb743-album-bottom','--pb761-nav-height','--pb761-scroll-clearance','--pb761-content-top','--pb761-content-bottom'])main.style.removeProperty(name);
    main.classList.remove('pb762Composing','pb737MobilePrintRedesign','pb766PageLeaving','pb766ComposerEnter','pb767ComposerEnter');
    document.body.classList.remove('pb737-mobile-print-active');
    for(const id of ['pb742-print-actions','pb737-mobile-print-dock','pb761-mode-actions','pb762-back','pb762-add','pb753-mobile-order-actions','pb754-album-create-actions','pb755-mode-actions','pb756-mode-actions','pb757-mode-actions'])document.getElementById(id)?.remove();
    document.querySelectorAll('.pb761PhotoStatuses,.pb761AlbumStageStatuses,.pb752OrderStatuses,.pb754AlbumStageRail,.pb755OrderStatuses,.pb756PhotoStatuses,.pb756AlbumStageStatuses,.pb757PhotoStatuses,.pb757AlbumStageStatuses').forEach(n=>n.remove());
    if(area instanceof HTMLElement){
      for(const prop of ['position','top','left','right','bottom','inset','width','height','min-height','max-height','margin','box-sizing','overflow','overflow-y','overflow-x','touch-action','overscroll-behavior','-webkit-overflow-scrolling','scroll-behavior'])area.style.removeProperty(prop);
    }
  }
  function syncRouteClasses(){
    const mode=routeMode(),root=document.documentElement;
    root.classList.toggle('pb786PhotographerNonPrint',photographer()&&mode!=='print');
    root.classList.toggle('pb786StoreRoute',photographer()&&mode==='store');
  }
  function setActive(el,on){if(el instanceof HTMLElement&&el.classList.contains('active')!==!!on)el.classList.toggle('active',!!on)}
  function syncNav(){
    if(!photographer())return;
    const mode=routeMode();
    const labels={print:'چاپ',ai:'هوش مصنوعی',gallery:'گالری',album:'طراحی آلبوم',instagram:'اینستاگرام',store:'فروشگاه'};
    const wanted=labels[mode]||'';
    const bottom=qsa('.photographerBottomAppNav .photographerBottomAppNavGrid>button');
    for(const b of bottom)setActive(b,(b.getAttribute('aria-label')||'').trim()===wanted);
    const top=qsa('.photographerHomeModeNav>.rolePrimaryAction');
    for(const b of top){
      const isStore=b.classList.contains('photographerStoreEntry');
      const isAlbum=b.classList.contains('photographerAlbumDesignEntry');
      const isInstagram=b.classList.contains('photographerInstagramDesignEntry');
      const text=String(b.textContent||'').trim();
      setActive(b,(mode==='store'&&isStore)||(mode==='album'&&isAlbum)||(mode==='instagram'&&isInstagram)||(mode==='ai'&&text==='هوش مصنوعی')||(mode==='gallery'&&text==='گالری'));
    }
  }
  function sync(force=false){
    if(!mobile()||!photographer())return;
    const main=qs('.photographerMain'),isPrint=!!main?.classList?.contains('photographerPrintWorkspace')||routeMode()==='print';
    const key=`${location.pathname}${location.search}`;
    const routeChanged=key!==lastRoute,leftPrint=lastPrint&&!isPrint;
    cleanupLegacyStore();syncRouteClasses();syncNav();
    if(force||leftPrint||(routeChanged&&!isPrint))cleanupPrintLeak();
    lastRoute=key;lastPrint=isPrint;
  }
  function schedule(force=false){if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{raf=0;sync(force)})}

  // v858: Store is live for every authenticated photographer.
  // Historical v786 used to route non-admin photographers back to /photographer/store (Coming Soon).
  // Own the click in capture phase and always enter the real equipment store instead.
  document.addEventListener('click',e=>{
    if(!photographer())return;
    const b=e.target?.closest?.('.photographerStoreEntry,.photographerStoreMobileNav');
    if(!b)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();
    location.assign('/equipment-rental/book');
  },true);

  for(const name of ['pushState','replaceState']){
    const old=history[name];if(typeof old!=='function'||old.__pb786)return;
    const fn=function(...args){const out=old.apply(this,args);schedule(true);return out};fn.__pb786=true;history[name]=fn;
  }
  addEventListener('popstate',()=>schedule(true),{passive:true});
  addEventListener('pageshow',()=>schedule(true),{passive:true});
  const start=()=>{
    void resolveAdmin();schedule(true);
    const root=qs('#root');if(root)new MutationObserver(()=>schedule(false)).observe(root,{subtree:true,childList:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v858 route stability: Store live for all photographers');
})();
