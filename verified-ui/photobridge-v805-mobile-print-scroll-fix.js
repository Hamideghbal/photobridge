/* PhotoBridge v805 — authoritative mobile print controls + non-print scroll recovery. */
(()=>{
  'use strict';
  if(window.__PB805_MOBILE_PRINT_SCROLL__)return;
  window.__PB805_MOBILE_PRINT_SCROLL__=true;
  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const txt=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  const mobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  const print=()=>qs('.photographerMain.photographerPrintWorkspace');
  const finance=x=>!!x&&(location.pathname.startsWith('/photographer/finance')||!!qs('.financeWorkspace',x));
  const composer=x=>!!x&&(x.classList.contains('photographerUploadWorkspaceMode')||x.classList.contains('simplePrintPilotWorkspaceMode')||x.classList.contains('photographerAlbumCreateWorkspaceMode')||!!qs('.simplePrintPilot,.albumOrderWorkspace',x));
  const exactInvoice=t=>{t=String(t||'').replace(/[\s▤←]/g,'');return t==='فاکتور'||t==='فاکتورفاکتور'||t==='بازگشتفاکتور'||t==='فاکتوربازگشت'};
  let raf=0;
  function forceHide(n){if(!(n instanceof HTMLElement))return;n.hidden=true;n.setAttribute('aria-hidden','true');n.style.setProperty('display','none','important');n.style.setProperty('visibility','hidden','important');n.style.setProperty('pointer-events','none','important')}
  function forceShow(n){if(!(n instanceof HTMLElement))return;n.hidden=false;n.removeAttribute('aria-hidden');n.style.removeProperty('display');n.style.removeProperty('visibility');n.style.removeProperty('pointer-events')}
  function removeLegacyFloating(){qsa('#pb698PrintBarActions,#pb697PrintBarActions,#pb696PrintBarActions,#pb694PrintBarActions,#pb693PrintBarActions,#pb801InvoiceShortcut,#pb802InvoiceShortcut,#pb803InvoiceShortcut').forEach(n=>n.remove())}
  function primary(x){
    const lab=qs('.photographerPrintModeHeader .photographerPrintTopLab',x),native=qs('.photographerPrintModeUtilityCluster>.photographerPrintCommonAction.finance',x);
    let b=qs('#pb783FinanceShortcut');if(!lab||!native)return b;
    if(!b){b=document.createElement('button');b.id='pb783FinanceShortcut';b.type='button';document.body.appendChild(b)}
    const r=lab.getBoundingClientRect();if(Number.isFinite(r.top)){b.style.top=`${Math.round(r.top+5)}px`;b.style.left='8px';b.style.height=`${Math.max(30,Math.round(r.height-10))}px`}
    return b;
  }
  function labelPrimary(b,isBack){if(!(b instanceof HTMLElement))return;b.classList.toggle('pb805Back',isBack);b.classList.add('pb805Primary');b.innerHTML=isBack?'<span aria-hidden="true">←</span><b>بازگشت</b>':'<span aria-hidden="true">▤</span><b>فاکتور</b>';b.setAttribute('aria-label',isBack?'بازگشت':'فاکتور');b.title=isBack?'بازگشت':'فاکتور'}
  function purge(x,keep){
    removeLegacyFloating();if(!x)return;
    qsa('.photographerPrintModeUtilityCluster>.photographerPrintCommonAction.finance,.photographerContextAction.financeAction,.photographerLabContextActions .financeAction',x).forEach(forceHide);
    qsa('.pb761PhotoStatuses>button,.pb761AlbumStageStatuses>button,.pb752OrderStatuses>button,.pb754AlbumStageRail>button,.pb755OrderStatuses>button,.pb756PhotoStatuses>button,.pb756AlbumStageStatuses>button,.pb757PhotoStatuses>button,.pb757AlbumStageStatuses>button,.photographerContextStatusesMobile>button,.photographerContextStatusesDesktop>button',x).forEach(b=>{if(exactInvoice(txt(b))||txt(b).includes('فاکتور'))forceHide(b)});
    qsa('button',x).forEach(b=>{if(b!==keep&&exactInvoice(txt(b)))forceHide(b)});
  }
  function syncPrint(){
    if(!mobile())return;const x=print();document.documentElement.classList.remove('pb805PrintNormal','pb805PrintFinance','pb805PrintComposer');
    if(!x){qs('#pb783FinanceShortcut')?.remove();return}
    const f=finance(x),c=composer(x),nativeBack=qs('.photographerPrintModeUtilityCluster>.photographerPrintModeBack',x)||qs('.photographerPrintModeBack',x),plus=qs('#pb765-add'),legacyBack=qs('#pb765-back'),actions=qs('#pb761-mode-actions'),b=primary(x);
    purge(x,b);
    if(f){document.documentElement.classList.add('pb805PrintFinance');labelPrimary(b,true);forceShow(b);forceHide(nativeBack);forceHide(plus);forceHide(legacyBack);forceHide(actions);purge(x,b);return}
    if(c){document.documentElement.classList.add('pb805PrintComposer');forceHide(b);forceShow(nativeBack);forceHide(plus);forceHide(legacyBack);purge(x,b);return}
    document.documentElement.classList.add('pb805PrintNormal');labelPrimary(b,false);forceShow(b);forceHide(nativeBack);forceHide(legacyBack);if(plus){plus.hidden=false;plus.removeAttribute('aria-hidden');plus.style.removeProperty('display');plus.style.removeProperty('visibility');plus.style.removeProperty('pointer-events')}purge(x,b);
  }
  const vars=['--pb742-content-top','--pb742-nav-bottom','--pb743-album-top','--pb743-album-bottom','--pb761-nav-height','--pb761-scroll-clearance','--pb761-content-top','--pb761-content-bottom'];
  const props=['position','top','left','right','bottom','inset','width','height','min-height','max-height','margin','box-sizing','overflow','overflow-y','overflow-x','touch-action','overscroll-behavior','overscroll-behavior-y','-webkit-overflow-scrolling','scroll-behavior'];
  function nonPrintTarget(){
    if(print())return false;const p=location.pathname;
    if(/^\/photographer\/ai(?:\/|$)/.test(p)||/^\/photographer\/album-design(?:\/|$)/.test(p))return true;
    const active=qs('.photographerBottomAppNav button.active'),label=(active?.getAttribute('aria-label')||qs('em',active)?.textContent||txt(active)).trim();
    return /هوش مصنوعی|طراحی آلبوم|اینستاگرام/.test(label)||!!qs('.photographerAiWorkspace,.photographerAiSectionNav,.photographerAlbumDesignCatalog,.photographerInstagramDesignWorkspace');
  }
  function unlock(){
    if(!mobile())return;const root=document.documentElement,body=document.body,main=qs('.photographerMain'),area=main&&qs(':scope>.photographerRolePageScrollArea',main);
    root.classList.add('pb805NonPrintScroll');body.classList.remove('pb737-mobile-print-active');
    for(const el of [root,body])for(const p of ['overflow','overflow-y','height','max-height','position','touch-action'])el.style.removeProperty(p);
    if(main instanceof HTMLElement){for(const v of vars)main.style.removeProperty(v);main.classList.remove('pb762Composing','pb737MobilePrintRedesign','pb765Composing','pb766PageLeaving','pb766ComposerEnter','pb767ComposerEnter');for(const p of props)main.style.removeProperty(p)}
    if(area instanceof HTMLElement)for(const p of props)area.style.removeProperty(p);
    ['pb742-print-actions','pb737-mobile-print-dock','pb761-mode-actions','pb762-back','pb762-add','pb753-mobile-order-actions','pb754-album-create-actions','pb755-mode-actions','pb756-mode-actions','pb757-mode-actions','pb765-add','pb765-back'].forEach(id=>document.getElementById(id)?.remove());
    removeLegacyFloating();qs('#pb783FinanceShortcut')?.remove();
  }
  function sync(){raf=0;syncPrint();if(nonPrintTarget())unlock();else document.documentElement.classList.remove('pb805NonPrintScroll')}
  function schedule(){if(!raf)raf=requestAnimationFrame(sync)}
  function burst(){for(const ms of [0,20,60,120,240,420,700,1100,1700])setTimeout(()=>{if(nonPrintTarget())unlock();schedule()},ms)}
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('#pb783FinanceShortcut');
    if(b&&print()){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();
      if(finance(print())){let target='';try{target=sessionStorage.getItem('photobridge:print:invoice-return')||''}catch{}if(!target||!/^\/photographer\/(orders|album|archive)(?:\/|\?|$)/.test(target))target='/photographer/orders/flow?workspace=print';location.assign(target)}
      else{try{sessionStorage.setItem('photobridge:print:invoice-return',location.pathname+location.search)}catch{}const native=qs('.photographerPrintModeUtilityCluster>.photographerPrintCommonAction.finance',print());if(native){native.hidden=false;native.removeAttribute('aria-hidden');native.style.removeProperty('display');native.click()}}
      return;
    }
    const nav=e.target?.closest?.('.photographerBottomAppNav button');if(nav){const label=(nav.getAttribute('aria-label')||qs('em',nav)?.textContent||txt(nav)).trim();if(/هوش مصنوعی|طراحی آلبوم|اینستاگرام/.test(label))burst()}
  },true);
  for(const name of ['pushState','replaceState']){const old=history[name];if(typeof old!=='function'||old.__pb805)continue;const fn=function(...args){const out=old.apply(this,args);burst();return out};fn.__pb805=true;history[name]=fn}
  addEventListener('popstate',burst,{passive:true});addEventListener('pageshow',burst,{passive:true});addEventListener('resize',schedule,{passive:true});
  const start=()=>{const r=qs('#root');if(r)new MutationObserver(schedule).observe(r,{subtree:true,childList:true,attributes:true,characterData:true,attributeFilter:['class','hidden','aria-current','style']});schedule();for(const ms of [30,100,300,700,1400])setTimeout(schedule,ms)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v805 mobile print controls + scroll recovery active');
})();
