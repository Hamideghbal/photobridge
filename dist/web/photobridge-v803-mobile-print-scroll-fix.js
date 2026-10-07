/* PhotoBridge v803 — authoritative mobile print controls + body-scroll recovery. */
(()=>{
  'use strict';
  if(window.__PB803_MOBILE_PRINT_SCROLL_FIX__)return;
  window.__PB803_MOBILE_PRINT_SCROLL_FIX__=true;

  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const mobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  const workspace=()=>qs('.photographerMain.photographerPrintWorkspace');
  const financeMode=w=>!!w&&(location.pathname.startsWith('/photographer/finance')||!!qs('.financeWorkspace',w));
  const uploadMode=w=>!!w&&(w.classList.contains('photographerUploadWorkspaceMode')||w.classList.contains('simplePrintPilotWorkspaceMode')||!!qs('.simplePrintPilot',w));
  const bodyScrollRoute=()=>/^\/photographer\/ai(?:\/|$)/.test(location.pathname)||/^\/photographer\/album-design(?:\/|$)/.test(location.pathname);
  let raf=0;

  function hide(el,cls='pb803Hidden'){
    if(!el)return;
    el.hidden=true;el.setAttribute('aria-hidden','true');el.classList.add(cls);
  }
  function show(el){
    if(!el)return;
    el.hidden=false;el.removeAttribute('aria-hidden');el.classList.remove('pb803Hidden');
  }
  function labelShortcut(btn,back){
    if(!btn)return;
    btn.classList.toggle('pb803ShortcutBack',back);
    btn.setAttribute('aria-label',back?'بازگشت':'فاکتور');
    btn.setAttribute('title',back?'بازگشت':'فاکتور');
    btn.innerHTML=back?'<span aria-hidden="true">←</span><b>بازگشت</b>':'<span aria-hidden="true">▤</span><b>فاکتور</b>';
  }
  function ensureShortcut(w){
    const native=qs('.photographerPrintModeUtilityCluster>.photographerPrintCommonAction.finance',w);
    const lab=qs('.photographerPrintModeHeader .photographerPrintTopLab',w);
    let btn=qs('#pb783FinanceShortcut');
    if(!native||!lab)return btn;
    if(!btn){
      btn=document.createElement('button');btn.id='pb783FinanceShortcut';btn.type='button';
      btn.addEventListener('click',()=>native.click());document.body.appendChild(btn);
    }
    btn.classList.add('pb803PrimaryInvoice');
    const r=lab.getBoundingClientRect();
    if(Number.isFinite(r.top)){
      btn.style.top=`${Math.round(r.top+5)}px`;btn.style.left='8px';btn.style.height=`${Math.max(30,Math.round(r.height-10))}px`;
    }
    return btn;
  }
  function removeLowerPrintControls(w){
    qsa('.photographerContextAction.financeAction,.photographerLabContextActions .financeAction',w).forEach(hide);
    qsa('.photographerPrintModeUtilityCluster>.photographerPrintCommonAction.finance',w).forEach(hide);
  }
  function syncPrint(){
    const root=document.documentElement,w=workspace();
    root.classList.remove('pb803PrintNormal','pb803PrintUpload','pb803PrintFinance');
    if(!mobile()||!w)return;

    const finance=financeMode(w),upload=uploadMode(w);
    removeLowerPrintControls(w);
    const shortcut=ensureShortcut(w);
    const nativeBack=qs('.photographerPrintModeUtilityCluster>.photographerPrintModeBack',w);
    const plus=qs('#pb765-add');
    const lowerBack=qs('#pb765-back');
    const modeActions=qs('#pb761-mode-actions');

    if(finance){
      root.classList.add('pb803PrintFinance');
      labelShortcut(shortcut,true);show(shortcut);
      hide(nativeBack);hide(plus);hide(lowerBack);hide(modeActions);
      return;
    }
    if(upload){
      root.classList.add('pb803PrintUpload');
      hide(shortcut);show(nativeBack);hide(lowerBack);hide(plus);
      return;
    }
    root.classList.add('pb803PrintNormal');
    labelShortcut(shortcut,false);show(shortcut);show(nativeBack);
    if(plus){plus.hidden=false;plus.removeAttribute('aria-hidden');plus.classList.remove('pb803Hidden','pb802PlusHidden','pb801PlusHidden')}
    hide(lowerBack);
  }
  function clearPrintLeaks(){
    const main=qs('.photographerMain');
    if(!main)return;
    for(const name of ['--pb742-content-top','--pb742-nav-bottom','--pb743-album-top','--pb743-album-bottom','--pb761-nav-height','--pb761-scroll-clearance','--pb761-content-top','--pb761-content-bottom'])main.style.removeProperty(name);
    main.classList.remove('pb762Composing','pb737MobilePrintRedesign','pb765Composing','pb766PageLeaving','pb766ComposerEnter','pb767ComposerEnter');
    document.body.classList.remove('pb737-mobile-print-active');
    for(const id of ['pb742-print-actions','pb737-mobile-print-dock','pb761-mode-actions','pb762-back','pb762-add','pb753-mobile-order-actions','pb754-album-create-actions','pb755-mode-actions','pb756-mode-actions','pb757-mode-actions','pb765-add','pb765-back'])document.getElementById(id)?.remove();
    qsa('.pb761PhotoStatuses,.pb761AlbumStageStatuses,.pb752OrderStatuses,.pb754AlbumStageRail,.pb755OrderStatuses,.pb756PhotoStatuses,.pb756AlbumStageStatuses,.pb757PhotoStatuses,.pb757AlbumStageStatuses').forEach(n=>n.remove());
    qsa('.photographerRolePageScrollArea').forEach(area=>{
      for(const prop of ['position','top','left','right','bottom','inset','width','height','min-height','max-height','margin','box-sizing','overflow','overflow-y','overflow-x','touch-action','overscroll-behavior','overscroll-behavior-y','-webkit-overflow-scrolling','scroll-behavior'])area.style.removeProperty(prop);
    });
  }
  function syncNonPrintScroll(){
    const root=document.documentElement,w=workspace(),recover=mobile()&&!w&&bodyScrollRoute();
    root.classList.toggle('pb803BodyScrollRecovery',recover);
    if(recover)clearPrintLeaks();
  }
  function sync(){raf=0;syncPrint();syncNonPrintScroll()}
  function schedule(){if(!raf)raf=requestAnimationFrame(sync)}

  document.addEventListener('click',e=>{
    const back=e.target?.closest?.('#pb783FinanceShortcut.pb803ShortcutBack');
    if(!back)return;
    const w=workspace();if(!financeMode(w))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();
    const nativeBack=qs('.photographerPrintModeUtilityCluster>.photographerPrintModeBack',w);
    if(nativeBack){nativeBack.hidden=false;nativeBack.removeAttribute('aria-hidden');nativeBack.click();return}
    history.length>1?history.back():location.assign('/photographer/orders/flow?workspace=print');
  },true);

  for(const name of ['pushState','replaceState']){
    const old=history[name];if(typeof old!=='function'||old.__pb803)continue;
    const fn=function(...args){const out=old.apply(this,args);setTimeout(schedule,0);return out};fn.__pb803=true;history[name]=fn;
  }
  addEventListener('popstate',schedule,{passive:true});addEventListener('pageshow',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  const start=()=>{
    const root=qs('#root');if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
    schedule();setTimeout(schedule,50);setTimeout(schedule,180);setTimeout(schedule,500);setTimeout(schedule,1100);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v803 mobile print controls + scroll recovery active');
})();
