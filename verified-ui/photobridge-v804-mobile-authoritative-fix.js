/* PhotoBridge v804 — authoritative mobile print controls, status cleanup, scroll unlock. */
(()=>{
  'use strict';
  if(window.__PB804_MOBILE_AUTHORITATIVE_FIX__)return;
  window.__PB804_MOBILE_AUTHORITATIVE_FIX__=true;

  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const txt=n=>(n?.textContent||'').replace(/\s+/g,' ').trim();
  const mobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  const w=()=>qs('.photographerMain.photographerPrintWorkspace');
  const financeMode=x=>!!x&&(location.pathname.startsWith('/photographer/finance')||!!qs('.financeWorkspace',x));
  const composerMode=x=>!!x&&(x.classList.contains('photographerUploadWorkspaceMode')||x.classList.contains('simplePrintPilotWorkspaceMode')||x.classList.contains('photographerAlbumCreateWorkspaceMode')||!!qs('.simplePrintPilot,.albumOrderWorkspace',x));
  let raf=0;

  function hide(n){if(!n)return;n.hidden=true;n.setAttribute('aria-hidden','true');n.classList.add('pb804Hidden')}
  function show(n){if(!n)return;n.hidden=false;n.removeAttribute('aria-hidden');n.classList.remove('pb804Hidden')}

  function primaryShortcut(x){
    let b=qs('#pb783FinanceShortcut');
    const native=qs('.photographerPrintModeUtilityCluster>.photographerPrintCommonAction.finance',x);
    const lab=qs('.photographerPrintModeHeader .photographerPrintTopLab',x);
    if(!native||!lab)return b;
    if(!b){
      b=document.createElement('button');b.id='pb783FinanceShortcut';b.type='button';document.body.appendChild(b);
      b.addEventListener('click',()=>native.click());
    }
    b.classList.add('pb804PrimaryInvoice');
    const r=lab.getBoundingClientRect();
    if(Number.isFinite(r.top)){b.style.top=`${Math.round(r.top+5)}px`;b.style.left='8px';b.style.height=`${Math.max(30,Math.round(r.height-10))}px`}
    return b;
  }
  function labelPrimary(b,back){
    if(!b)return;
    b.classList.toggle('pb804Back',back);
    b.setAttribute('aria-label',back?'بازگشت':'فاکتور');b.setAttribute('title',back?'بازگشت':'فاکتور');
    b.innerHTML=back?'<span aria-hidden="true">←</span><b>بازگشت</b>':'<span aria-hidden="true">▤</span><b>فاکتور</b>';
  }

  function purgeDuplicateStatusButtons(x){
    if(!x)return;
    // v765 copied the native finance/back control into the status rail. Remove it from both source and clones.
    const selectors=[
      '.pb761PhotoStatuses>button','.pb761AlbumStageStatuses>button',
      '.pb752OrderStatuses>button','.pb754AlbumStageRail>button',
      '.pb755OrderStatuses>button','.pb756PhotoStatuses>button','.pb756AlbumStageStatuses>button',
      '.pb757PhotoStatuses>button','.pb757AlbumStageStatuses>button',
      '.photographerContextStatusesMobile>button','.photographerContextStatusesDesktop>button',
      '.photographerAlbumHeaderStatusMobile .albumHeaderStatuses>button','.photographerAlbumHeaderStatusDesktop .albumHeaderStatuses>button'
    ];
    qsa(selectors.join(','),x).forEach(b=>{
      const t=txt(b).replace(/\s/g,'');
      if(t.includes('فاکتور')||t.includes('بازگشتفاکتور')||t.includes('فاکتوربازگشت'))hide(b);
    });
    // Catch malformed duplicated labels visible in the screenshots without touching finance page tabs such as «فاکتورها».
    qsa('button',x).forEach(b=>{
      if(b.id==='pb783FinanceShortcut')return;
      const t=txt(b).replace(/\s/g,'');
      if(t==='فاکتور'||t==='فاکتورفاکتور'||t==='بازگشتفاکتور'||t==='فاکتوربازگشت')hide(b);
    });
  }

  function syncPrint(){
    const root=document.documentElement,x=w();
    root.classList.remove('pb804PrintNormal','pb804PrintFinance','pb804PrintComposer');
    if(!mobile()||!x)return;
    const finance=financeMode(x),composer=composerMode(x);
    purgeDuplicateStatusButtons(x);

    // Hide every legacy invoice/back clone. The only top action is #pb783FinanceShortcut.
    qsa('.photographerPrintModeUtilityCluster>.photographerPrintCommonAction.finance,.photographerContextAction.financeAction,.photographerLabContextActions .financeAction',x).forEach(hide);
    const primary=primaryShortcut(x);
    const nativeBack=qs('.photographerPrintModeUtilityCluster>.photographerPrintModeBack',x)||qs('.photographerPrintModeBack',x);
    const plus=qs('#pb765-add');
    const composerBack=qs('#pb765-back');
    const modeActions=qs('#pb761-mode-actions');

    if(finance){
      root.classList.add('pb804PrintFinance');
      labelPrimary(primary,true);show(primary);
      hide(nativeBack);hide(plus);hide(composerBack);hide(modeActions);
      purgeDuplicateStatusButtons(x);
      return;
    }
    if(composer){
      root.classList.add('pb804PrintComposer');
      hide(primary);show(nativeBack);hide(plus);
      if(composerBack&&composerBack!==nativeBack)hide(composerBack);
      purgeDuplicateStatusButtons(x);
      return;
    }
    root.classList.add('pb804PrintNormal');
    labelPrimary(primary,false);show(primary);
    if(plus){plus.hidden=false;plus.removeAttribute('aria-hidden');plus.classList.remove('pb804Hidden','pb803Hidden','pb802PlusHidden','pb801PlusHidden')}
    if(composerBack)hide(composerBack);
    purgeDuplicateStatusButtons(x);
  }

  function releaseScrollLocks(){
    if(!mobile())return;
    const main=qs('.photographerMain');
    document.documentElement.classList.add('pb804ScrollUnlocked');
    document.body.classList.remove('pb737-mobile-print-active');
    document.documentElement.style.removeProperty('overflow');document.documentElement.style.removeProperty('height');
    document.body.style.removeProperty('overflow');document.body.style.removeProperty('height');document.body.style.removeProperty('position');document.body.style.removeProperty('touch-action');
    if(main){
      for(const name of ['--pb742-content-top','--pb742-nav-bottom','--pb743-album-top','--pb743-album-bottom','--pb761-nav-height','--pb761-scroll-clearance','--pb761-content-top','--pb761-content-bottom'])main.style.removeProperty(name);
      main.classList.remove('pb762Composing','pb737MobilePrintRedesign','pb765Composing','pb766PageLeaving','pb766ComposerEnter','pb767ComposerEnter');
      qsa(':scope>.photographerRolePageScrollArea',main).forEach(area=>{
        for(const p of ['position','top','left','right','bottom','inset','width','height','min-height','max-height','margin','box-sizing','overflow','overflow-y','overflow-x','touch-action','overscroll-behavior','overscroll-behavior-y','-webkit-overflow-scrolling','scroll-behavior'])area.style.removeProperty(p);
      });
    }
    ['pb742-print-actions','pb737-mobile-print-dock','pb761-mode-actions','pb762-back','pb762-add','pb753-mobile-order-actions','pb754-album-create-actions','pb755-mode-actions','pb756-mode-actions','pb757-mode-actions','pb765-add','pb765-back'].forEach(id=>document.getElementById(id)?.remove());
  }

  function isNonPrintMobileSection(){
    if(w())return false;
    const active=qs('.photographerBottomAppNav button.active');
    const label=(active?.getAttribute('aria-label')||qs('em',active)?.textContent||txt(active)).trim();
    if(/هوش مصنوعی|طراحی آلبوم|اینستاگرام/.test(label))return true;
    return !!qs('.photographerAiSectionNav,.photographerAiWorkspace,.photographerAlbumDesignCatalog,.photographerInstagramDesignWorkspace');
  }
  function syncScroll(){
    if(isNonPrintMobileSection())releaseScrollLocks();
    else document.documentElement.classList.remove('pb804ScrollUnlocked');
  }
  function sync(){raf=0;syncPrint();syncScroll()}
  function schedule(){if(!raf)raf=requestAnimationFrame(sync)}
  function burstUnlock(){for(const ms of [0,30,100,240,500,900,1600])setTimeout(()=>{releaseScrollLocks();schedule()},ms)}

  document.addEventListener('click',e=>{
    const back=e.target?.closest?.('#pb783FinanceShortcut.pb804Back');
    if(back&&financeMode(w())){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();
      const real=qs('.photographerPrintModeBack',w());
      if(real){real.hidden=false;real.removeAttribute('aria-hidden');real.click()}else if(history.length>1)history.back();else location.assign('/photographer/orders/flow?workspace=print');
      return;
    }
    const nav=e.target?.closest?.('.photographerBottomAppNav button');
    if(nav){
      const label=(nav.getAttribute('aria-label')||qs('em',nav)?.textContent||txt(nav)).trim();
      if(/هوش مصنوعی|طراحی آلبوم|اینستاگرام/.test(label))burstUnlock();
    }
  },true);

  for(const name of ['pushState','replaceState']){
    const old=history[name];if(typeof old!=='function'||old.__pb804)continue;
    const fn=function(...args){const out=old.apply(this,args);setTimeout(schedule,0);setTimeout(()=>{if(isNonPrintMobileSection())releaseScrollLocks()},80);return out};fn.__pb804=true;history[name]=fn;
  }
  addEventListener('popstate',()=>{schedule();setTimeout(schedule,120)},{passive:true});
  addEventListener('pageshow',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  const start=()=>{
    const root=qs('#root');if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,characterData:true,attributeFilter:['class','hidden','aria-current']});
    schedule();for(const ms of [40,120,320,700,1400])setTimeout(schedule,ms);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v804 authoritative mobile print + scroll fix active');
})();
