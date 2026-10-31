/* PhotoBridge v815 — mobile Print top tabs: Photo / Album / Finance. */
(()=>{
  'use strict';
  /* PB1308: styling must settle and preserve React-owned child order. */
  function pb1308Add(el,...names){if(el)for(const name of names)if(!el.classList.contains(name))el.classList.add(name)}
  function pb1308Remove(el,...names){if(el)for(const name of names)if(el.classList.contains(name))el.classList.remove(name)}
  function pb1308Text(el,value){if(el&&el.textContent!==value)el.textContent=value}
  function pb1308Hidden(el,value){if(el&&el.hidden!==value)el.hidden=value}
  function pb1308Attr(el,name,value){if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
  function pb1308Order(el,value){if(el&&el.style.order!==String(value))el.style.order=String(value)}

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
      pb1308Attr(tab,'aria-label','مالی');
      pb1308Text(tab,'مالی');
      tab.addEventListener('click',ev=>{
        ev.preventDefault();ev.stopPropagation();
        const current=workspace();if(!current||isFinance(current))return;
        const native=nativeFinance(current);
        if(native){
          pb1308Hidden(native,false);native.removeAttribute('aria-hidden');
          native.style.removeProperty('display');native.style.removeProperty('visibility');native.style.removeProperty('pointer-events');
          try{sessionStorage.setItem('photobridge:print:invoice-return',location.pathname+location.search)}catch{}
          native.click();
        }else location.assign('/photographer/finance');
        setTimeout(schedule,0);setTimeout(schedule,120);setTimeout(schedule,500);
      });
      nav.appendChild(tab);
    }else if(tab.parentElement!==nav)nav.appendChild(tab);
    pb1308Add(tab,'pb815PrintFinanceTab');
    pb1308Text(tab,'مالی');
    pb1308Attr(tab,'aria-label','مالی');
    pb1308Attr(tab,'title','مالی');
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
      qsa(':scope>.photographerPrintPhotoTab,:scope>.photographerPrintAlbumTab',nav).forEach(b=>{pb1308Remove(b,'active');b.removeAttribute('aria-current')});
    }
    // Old floating invoice/back controls remain implementation details and must not be user-visible.
    qsa('#pb783FinanceShortcut,#pb698PrintBarActions [data-pb698-print="finance"],#pb697PrintBarActions [data-pb697-print="finance"],#pb696PrintBarActions [data-pb696-print="finance"],#pb694PrintBarActions [data-pb694-print="finance"]').forEach(el=>{pb1308Attr(el,'aria-hidden','true')});
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
