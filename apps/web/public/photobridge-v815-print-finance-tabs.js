/* PhotoBridge v815 — mobile Print top tabs: Photo / Album / Finance. */
(()=>{
  'use strict';
  if(window.__PB815_PRINT_FINANCE_TABS__)return;
  window.__PB815_PRINT_FINANCE_TABS__=true;
  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const mobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  const workspace=()=>qs('.photographerMain.photographerPrintWorkspace');
  const isFinance=w=>!!w&&(!!qs('.financeWorkspace',w)||/^\/photographer\/finance(?:\/|$)/.test(location.pathname));
  let raf=0;

  function nativeFinance(w){return qs('.photographerPrintModeUtilityCluster>.photographerPrintCommonAction.finance',w)}
  function ensureFinanceTab(w){
    const nav=qs('.photographerPrintModeNav',w);if(!nav)return null;
    let tab=qs('.pb815PrintFinanceTab,.pb816PrintFinanceTab,.pb817PrintFinanceTab,.photographerPrintFinanceTab',nav);
    if(!tab){
      tab=document.createElement('button');
      tab.type='button';
      tab.className='rolePrimaryAction pb815PrintFinanceTab';
      tab.setAttribute('aria-label','مالی و فاکتور');
      tab.textContent='مالی و فاکتور';
      tab.addEventListener('click',ev=>{
        ev.preventDefault();ev.stopPropagation();
        const current=workspace();if(!current||isFinance(current))return;
        const native=nativeFinance(current);
        if(native){
          native.hidden=false;native.removeAttribute('aria-hidden');
          native.style.removeProperty('display');native.style.removeProperty('visibility');native.style.removeProperty('pointer-events');
          try{sessionStorage.setItem('photobridge:print:invoice-return',location.pathname+location.search)}catch{}
          native.click();
        }else location.assign('/photographer/finance');
        setTimeout(schedule,0);setTimeout(schedule,120);setTimeout(schedule,500);
      });
      nav.appendChild(tab);
    }else if(tab.parentElement!==nav)nav.appendChild(tab);
    tab.classList.add('pb815PrintFinanceTab');
    tab.textContent='مالی و فاکتور';
    tab.setAttribute('aria-label','مالی و فاکتور');
    tab.setAttribute('title','مالی و فاکتور');
    return tab;
  }
  function sync(){
    raf=0;
    const w=workspace();
    document.documentElement.classList.toggle('pb815PrintFinanceActive',!!w&&mobile()&&isFinance(w));
    if(!w||!mobile())return;
    const nav=qs('.photographerPrintModeNav',w),tab=ensureFinanceTab(w);if(!nav||!tab)return;
    const active=isFinance(w);
    tab.classList.toggle('active',active);
    tab.toggleAttribute('aria-current',active);
    if(active){
      qsa(':scope>.photographerPrintPhotoTab,:scope>.photographerPrintAlbumTab',nav).forEach(b=>{b.classList.remove('active');b.removeAttribute('aria-current')});
    }
    // Old floating invoice/back controls remain implementation details and must not be user-visible.
    qsa('#pb783FinanceShortcut,#pb698PrintBarActions [data-pb698-print="finance"],#pb697PrintBarActions [data-pb697-print="finance"],#pb696PrintBarActions [data-pb696-print="finance"],#pb694PrintBarActions [data-pb694-print="finance"]').forEach(el=>{el.setAttribute('aria-hidden','true')});
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(sync)}
  function burst(){for(const ms of [0,40,120,300,700])setTimeout(schedule,ms)}
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('.photographerPrintModeNav>.photographerPrintPhotoTab,.photographerPrintModeNav>.photographerPrintAlbumTab'))burst();
  },true);
  for(const n of ['pushState','replaceState']){const old=history[n];if(typeof old!=='function'||old.__pb815)return;const fn=function(...a){const out=old.apply(this,a);burst();return out};fn.__pb815=true;history[n]=fn}
  addEventListener('popstate',burst,{passive:true});addEventListener('pageshow',burst,{passive:true});addEventListener('resize',schedule,{passive:true});
  const start=()=>{const root=qs('#root');if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-current']});burst()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
