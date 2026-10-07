/* PhotoBridge v802 — correct mobile invoice shortcut + non-print scroll recovery. */
(()=>{
  'use strict';
  if(window.__PB802_MOBILE_STABILITY__)return;
  window.__PB802_MOBILE_STABILITY__=true;

  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const mobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  let raf=0,lastRoute='';

  function routeMode(){
    const p=location.pathname.replace(/\/+$/,'')||'/',q=new URLSearchParams(location.search);
    if(/^\/photographer\/(orders|upload|album|archive|finance)(?:\/|$)/.test(p)||q.get('workspace')==='print')return 'print';
    if(/^\/photographer\/ai(?:\/|$)/.test(p))return 'ai';
    if(/^\/photographer\/album-design(?:\/|$)/.test(p))return q.get('pb_mode')==='instagram'?'instagram':'album';
    if(p==='/photographer/gallery')return 'gallery';
    return '';
  }
  function workspace(){return qs('.photographerMain.photographerPrintWorkspace')}
  function uploadMode(w){return !!w&&(w.classList.contains('photographerUploadWorkspaceMode')||w.classList.contains('simplePrintPilotWorkspaceMode')||!!qs('.simplePrintPilot',w))}
  function financeMode(w){return !!w&&(!!qs('.financeWorkspace',w)||/\/photographer\/finance(?:\/|$)/.test(location.pathname))}

  function ensureShortcut(w){
    if(!mobile()||!w)return null;
    const native=qs('.photographerPrintModeUtilityCluster > .photographerPrintCommonAction.finance',w);
    const lab=qs('.photographerPrintModeHeader .photographerPrintTopLab',w);
    let b=qs('#pb783FinanceShortcut');
    if(!native||!lab)return b;
    if(!b){
      b=document.createElement('button');b.id='pb783FinanceShortcut';b.type='button';
      b.innerHTML='<span aria-hidden="true">▤</span><b>فاکتور</b>';
      b.addEventListener('click',()=>native.click());document.body.appendChild(b);
    }
    b.classList.add('pb802InvoiceShortcut');
    b.classList.remove('pb801LegacyInvoiceHidden');b.hidden=false;b.removeAttribute('aria-hidden');
    const r=lab.getBoundingClientRect();
    if(Number.isFinite(r.top)){b.style.top=`${Math.round(r.top+5)}px`;b.style.left='8px';b.style.height=`${Math.max(30,Math.round(r.height-10))}px`}
    return b;
  }
  function labelShortcut(b,kind){
    if(!b)return;
    const back=kind==='back';
    b.classList.toggle('pb802ShortcutBack',back);
    b.setAttribute('aria-label',back?'بازگشت':'فاکتور');b.setAttribute('title',back?'بازگشت':'فاکتور');
    b.innerHTML=back?'<span aria-hidden="true">←</span><b>بازگشت</b>':'<span aria-hidden="true">▤</span><b>فاکتور</b>';
  }
  function syncInvoice(){
    const w=workspace();
    document.documentElement.classList.remove('pb802PrintNormal','pb802PrintFinance','pb802PrintUpload');
    if(!mobile()||!w){qs('#pb783FinanceShortcut')?.classList.remove('pb802InvoiceShortcut','pb802ShortcutBack');return}
    const finance=financeMode(w),upload=uploadMode(w),cluster=qs('.photographerPrintModeUtilityCluster',w);
    if(!cluster)return;
    const nativeInvoices=qsa(':scope > .photographerPrintCommonAction.finance',cluster),nativeBack=qs(':scope > .photographerPrintModeBack',cluster);
    // The floating v783 shortcut is the intended primary mobile Invoice control.
    // Every native/lower finance action is a duplicate and stays hidden.
    nativeInvoices.forEach(el=>{el.hidden=true;el.classList.add('pb802NativeInvoiceHidden');el.classList.remove('pb801InvoiceAsBack')});
    qsa('.photographerContextAction.financeAction,.photographerLabContextActions .financeAction',w).forEach(el=>{el.hidden=true;el.classList.add('pb802NativeInvoiceHidden')});
    const shortcut=ensureShortcut(w);
    const plus=qs('#pb765-add'),composerBack=qs('#pb765-back');
    if(upload){
      document.documentElement.classList.add('pb802PrintUpload');
      if(shortcut){shortcut.hidden=true;shortcut.setAttribute('aria-hidden','true')}
      if(nativeBack){nativeBack.hidden=false;nativeBack.classList.remove('pb802BackHidden','pb801NativeBackHidden')}
      if(composerBack)composerBack.classList.remove('pb801ComposerBackHidden');
      return;
    }
    if(finance){
      document.documentElement.classList.add('pb802PrintFinance');
      labelShortcut(shortcut,'back');
      if(shortcut){shortcut.hidden=false;shortcut.removeAttribute('aria-hidden')}
      if(nativeBack){nativeBack.hidden=true;nativeBack.classList.add('pb802BackHidden')}
      if(plus){plus.hidden=true;plus.classList.add('pb802PlusHidden')}
      if(composerBack){composerBack.hidden=true;composerBack.classList.add('pb802BackHidden')}
      return;
    }
    document.documentElement.classList.add('pb802PrintNormal');
    labelShortcut(shortcut,'invoice');
    if(shortcut){shortcut.hidden=false;shortcut.removeAttribute('aria-hidden')}
    if(nativeBack){nativeBack.classList.remove('pb802BackHidden','pb801NativeBackHidden')}
    if(plus){plus.hidden=false;plus.classList.remove('pb802PlusHidden','pb801PlusHidden')}
    if(composerBack)composerBack.classList.remove('pb802BackHidden','pb801ComposerBackHidden');
  }

  function cleanupPrintLocks(routeChanged){
    const mode=routeMode(),recover=['ai','album','instagram'].includes(mode),root=document.documentElement;
    root.classList.toggle('pb802ScrollRecovery',mobile()&&recover);
    if(!mobile()||!recover)return;
    const main=qs('.photographerMain');if(!(main instanceof HTMLElement))return;
    const area=qs(':scope > .photographerRolePageScrollArea',main);
    for(const name of ['--pb742-content-top','--pb742-nav-bottom','--pb743-album-top','--pb743-album-bottom','--pb761-nav-height','--pb761-scroll-clearance','--pb761-content-top','--pb761-content-bottom'])main.style.removeProperty(name);
    main.classList.remove('pb762Composing','pb737MobilePrintRedesign','pb766PageLeaving','pb766ComposerEnter','pb767ComposerEnter');
    document.body.classList.remove('pb737-mobile-print-active');
    for(const id of ['pb742-print-actions','pb737-mobile-print-dock','pb761-mode-actions','pb762-back','pb762-add','pb753-mobile-order-actions','pb754-album-create-actions','pb755-mode-actions','pb756-mode-actions','pb757-mode-actions','pb765-add','pb765-back'])document.getElementById(id)?.remove();
    qsa('.pb761PhotoStatuses,.pb761AlbumStageStatuses,.pb752OrderStatuses,.pb754AlbumStageRail,.pb755OrderStatuses,.pb756PhotoStatuses,.pb756AlbumStageStatuses,.pb757PhotoStatuses,.pb757AlbumStageStatuses').forEach(n=>n.remove());
    if(area instanceof HTMLElement){
      for(const prop of ['position','top','left','right','bottom','inset','width','height','min-height','max-height','margin','box-sizing','overflow','overflow-y','overflow-x','touch-action','overscroll-behavior','overscroll-behavior-y','-webkit-overflow-scrolling','scroll-behavior'])area.style.removeProperty(prop);
      if(routeChanged)requestAnimationFrame(()=>{try{area.scrollTop=0}catch{}});
    }
  }
  function sync(){
    raf=0;const key=location.pathname+location.search,changed=key!==lastRoute;
    syncInvoice();cleanupPrintLocks(changed);lastRoute=key;
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(sync)}

  // In Invoice view the intended floating control becomes Back; intercept its old Invoice click.
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('#pb783FinanceShortcut.pb802ShortcutBack');if(!b)return;
    const w=workspace();if(!financeMode(w))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();
    const realBack=qs('.photographerPrintModeUtilityCluster > .photographerPrintModeBack',w);
    if(realBack){realBack.hidden=false;realBack.click();return}
    if(history.length>1)history.back();else location.assign('/photographer/orders/flow?workspace=print');
  },true);

  for(const name of ['pushState','replaceState']){
    const old=history[name];if(typeof old!=='function'||old.__pb802)continue;
    const fn=function(...args){const out=old.apply(this,args);setTimeout(schedule,0);return out};fn.__pb802=true;history[name]=fn;
  }
  addEventListener('popstate',schedule,{passive:true});addEventListener('pageshow',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  const start=()=>{const root=qs('#root');if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true});schedule();setTimeout(schedule,80);setTimeout(schedule,320);setTimeout(schedule,900)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v802 mobile invoice + scroll stability active');
})();
