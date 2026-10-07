/* PhotoBridge v807 — preserve v806 print controls, restore canonical internal scrolling, sync Store appearance. */
(()=>{
  'use strict';
  if(window.__PB807_MOBILE_FIX__)return;
  window.__PB807_MOBILE_FIX__=true;
  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const txt=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  const mobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  const print=()=>qs('.photographerMain.photographerPrintWorkspace');
  const finance=x=>!!x&&(location.pathname.startsWith('/photographer/finance')||!!qs('.financeWorkspace',x));
  const composer=x=>!!x&&(x.classList.contains('photographerUploadWorkspaceMode')||x.classList.contains('simplePrintPilotWorkspaceMode')||x.classList.contains('photographerAlbumCreateWorkspaceMode')||!!qs('.simplePrintPilot,.albumOrderWorkspace',x));
  const exactInvoice=t=>{t=String(t||'').replace(/[\s▤←]/g,'');return t==='فاکتور'||t==='فاکتورفاکتور'||t==='بازگشتفاکتور'||t==='فاکتوربازگشت'};
  const validHex=x=>/^#[0-9a-f]{6}$/i.test(String(x||''));
  let raf=0,appearancePromise=null,lastAppearance=null;

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
  function labelPrimary(b,isBack){if(!(b instanceof HTMLElement))return;b.classList.toggle('pb807Back',isBack);b.classList.add('pb807Primary');b.innerHTML=isBack?'<span aria-hidden="true">←</span><b>بازگشت</b>':'<span aria-hidden="true">▤</span><b>فاکتور</b>';b.setAttribute('aria-label',isBack?'بازگشت':'فاکتور');b.title=isBack?'بازگشت':'فاکتور'}
  function purge(x,keep){
    removeLegacyFloating();if(!x)return;
    qsa('.photographerPrintModeUtilityCluster>.photographerPrintCommonAction.finance,.photographerContextAction.financeAction,.photographerLabContextActions .financeAction',x).forEach(forceHide);
    qsa('.pb761PhotoStatuses>button,.pb761AlbumStageStatuses>button,.pb752OrderStatuses>button,.pb754AlbumStageRail>button,.pb755OrderStatuses>button,.pb756PhotoStatuses>button,.pb756AlbumStageStatuses>button,.pb757PhotoStatuses>button,.pb757AlbumStageStatuses>button,.photographerContextStatusesMobile>button,.photographerContextStatusesDesktop>button',x).forEach(b=>{if(exactInvoice(txt(b))||txt(b).includes('فاکتور'))forceHide(b)});
    qsa('button',x).forEach(b=>{if(b!==keep&&exactInvoice(txt(b)))forceHide(b)});
  }
  function syncPrint(){
    if(!mobile())return;
    const root=document.documentElement,x=print();
    root.classList.remove('pb807PrintNormal','pb807PrintFinance','pb807PrintComposer');
    if(!x){qs('#pb783FinanceShortcut')?.remove();return}
    const f=finance(x),c=composer(x),nativeBack=qs('.photographerPrintModeUtilityCluster>.photographerPrintModeBack',x)||qs('.photographerPrintModeBack',x),plus=qs('#pb765-add'),legacyBack=qs('#pb765-back'),actions=qs('#pb761-mode-actions'),b=primary(x);
    purge(x,b);
    if(f){root.classList.add('pb807PrintFinance');labelPrimary(b,true);forceShow(b);forceHide(nativeBack);forceHide(plus);forceHide(legacyBack);forceHide(actions);purge(x,b);return}
    if(c){root.classList.add('pb807PrintComposer');forceHide(b);forceHide(nativeBack);forceHide(plus);forceShow(legacyBack);forceShow(actions);purge(x,b);return}
    root.classList.add('pb807PrintNormal');labelPrimary(b,false);forceShow(b);forceHide(nativeBack);forceHide(legacyBack);
    if(plus){plus.hidden=false;plus.removeAttribute('aria-hidden');plus.style.removeProperty('display');plus.style.removeProperty('visibility');plus.style.removeProperty('pointer-events')}
    purge(x,b);
  }

  // v786 already owns route cleanup. v807 only restores the app's canonical single internal scroller;
  // it never converts normal pages to body scrolling and never resets scrollTop during DOM mutations.
  function syncScrollerClass(){
    const root=document.documentElement;
    const on=mobile()&&/^\/photographer(?:\/|$)/.test(location.pathname)&&!print()&&!/^\/photographer\/(orders|upload|album|archive|finance)(?:\/|$)/.test(location.pathname)&&new URLSearchParams(location.search).get('workspace')!=='print';
    root.classList.toggle('pb807InternalScroll',on);
    root.classList.remove('pb806NonPrintScroll');
  }

  function contrast(hex){
    const n=parseInt(String(hex).slice(1),16),c=x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4};
    return .2126*c(n>>16&255)+.7152*c(n>>8&255)+.0722*c(n&255)<.18?'#fff':'#101828';
  }
  function applyStoreAppearance(d){
    lastAppearance=d||lastAppearance;
    const header=validHex(d?.headerColor)?String(d.headerColor).toLowerCase():'#dff2f6';
    const subbar=validHex(d?.subbarColor)?String(d.subbarColor).toLowerCase():'#dff2f6';
    const top=validHex(d?.topColor)?String(d.topColor).toLowerCase():header;
    const selected=validHex(d?.selectedColor)?String(d.selectedColor).toLowerCase():'#ffffff';
    const root=document.documentElement;
    root.style.setProperty('--pb771-top',top,'important');
    root.style.setProperty('--pb718-header',header,'important');
    root.style.setProperty('--pb718-subbar',subbar,'important');
    root.style.setProperty('--pb718-subbar-text',contrast(subbar),'important');
    root.style.setProperty('--pb769-header-ink',contrast(header),'important');
    root.style.setProperty('--pb769-subbar-ink',contrast(subbar),'important');
    root.style.setProperty('--pb876-selected',selected,'important');
    root.style.setProperty('--pb876-selected-ink',contrast(selected),'important');
    const meta=qs('meta[name="theme-color"]');if(meta)meta.content=top;
    const h=qs('#photographerStoreRoleHeader');if(h instanceof HTMLElement){h.style.setProperty('background',header,'important');h.style.setProperty('background-color',header,'important');h.style.setProperty('color',contrast(header),'important')}
    const bar=qs('#photographerStoreIdentityBar');if(bar instanceof HTMLElement){bar.style.setProperty('background','#ffffff','important');bar.style.setProperty('background-color','#ffffff','important');bar.style.setProperty('color','#182230','important')}
    const nav=qs('#storeSectionNavV673');if(nav instanceof HTMLElement){nav.style.setProperty('background',subbar,'important');nav.style.setProperty('background-color',subbar,'important');nav.style.setProperty('color',contrast(subbar),'important')}
    try{localStorage.setItem('photobridge:appearance:all',JSON.stringify({topColor:top,headerColor:header,subbarColor:subbar,selectedColor:selected}));localStorage.setItem('photobridge:appearance:top',top)}catch{}
  }
  function syncStoreAppearance(){
    if(!qs('#photographerStoreRoleHeader'))return Promise.resolve();
    if(lastAppearance){applyStoreAppearance(lastAppearance);return Promise.resolve()}
    try{const cached=JSON.parse(localStorage.getItem('photobridge:appearance:all')||'null');if(cached)applyStoreAppearance(cached)}catch{}
    if(appearancePromise)return appearancePromise;
    appearancePromise=fetch('/api/public/appearance',{credentials:'same-origin',cache:'no-store'})
      .then(async r=>{if(!r.ok)throw new Error('appearance');return r.json()})
      .then(d=>applyStoreAppearance(d)).catch(()=>{}).finally(()=>{appearancePromise=null});
    return appearancePromise;
  }

  function sync(){raf=0;syncScrollerClass();syncPrint();void syncStoreAppearance()}
  function schedule(){if(!raf)raf=requestAnimationFrame(sync)}
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('#pb783FinanceShortcut');
    if(b&&print()){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();
      if(finance(print())){let target='';try{target=sessionStorage.getItem('photobridge:print:invoice-return')||''}catch{}if(!target||!/^\/photographer\/(orders|album|archive)(?:\/|\?|$)/.test(target))target='/photographer/orders/flow?workspace=print';location.assign(target)}
      else{try{sessionStorage.setItem('photobridge:print:invoice-return',location.pathname+location.search)}catch{}const native=qs('.photographerPrintModeUtilityCluster>.photographerPrintCommonAction.finance',print());if(native){native.hidden=false;native.removeAttribute('aria-hidden');native.style.removeProperty('display');native.click()}}
      return;
    }
  },true);
  for(const name of ['pushState','replaceState']){const old=history[name];if(typeof old!=='function'||old.__pb807)continue;const fn=function(...args){const out=old.apply(this,args);schedule();return out};fn.__pb807=true;history[name]=fn}
  addEventListener('popstate',schedule,{passive:true});addEventListener('pageshow',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  const start=()=>{const r=qs('#root');if(r)new MutationObserver(schedule).observe(r,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-current']});schedule();for(const ms of [40,120,320,800])setTimeout(schedule,ms)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v807 internal scroll + Store appearance sync active');
})();
