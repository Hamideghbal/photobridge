/* PhotoBridge v818 — Print finance title/label polish + stable composer actions. */
(()=>{
  'use strict';
  /* PB1308: styling must settle and preserve React-owned child order. */
  function pb1308Add(el,...names){if(el)for(const name of names)if(!el.classList.contains(name))el.classList.add(name)}
  function pb1308Remove(el,...names){if(el)for(const name of names)if(el.classList.contains(name))el.classList.remove(name)}
  function pb1308Text(el,value){if(el&&el.textContent!==value)el.textContent=value}
  function pb1308Hidden(el,value){if(el&&el.hidden!==value)el.hidden=value}
  function pb1308Attr(el,name,value){if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
  function pb1308Order(el,value){if(el&&el.style.order!==String(value))el.style.order=String(value)}

  if(window.__PB818_PRINT_COMPOSER_FIX__)return;
  window.__PB818_PRINT_COMPOSER_FIX__=true;

  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const mobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  const financeRoute=()=>/^\/photographer\/finance(?:\/|$)/.test(location.pathname);
  const main=()=>qs('.photographerMain.photographerPrintWorkspace');
  const isComposer=w=>!!w&&(w.classList.contains('photographerUploadWorkspaceMode')||w.classList.contains('simplePrintPilotWorkspaceMode')||w.classList.contains('photographerAlbumCreateWorkspaceMode')||!!qs('.simplePrintPilot,.albumOrderWorkspace',w));
  const isAlbum=w=>!!w&&(w.classList.contains('photographerAlbumCreateWorkspaceMode')||w.classList.contains('photographerAlbumWorkspaceMode')||!!qs('.photographerPrintAlbumTab.active,.albumOrderWorkspace',w));
  const albumHasFiles=()=>!!qs('.albumOrderWorkspace .albumFileToolbar.hasFiles,.albumOrderWorkspace .albumFileQcGrid .albumFileCard,.albumMultiProjectShell .albumPrintFilesBody');
  let raf=0;

  function financeTab(w){
    const nav=qs('.photographerPrintModeNav',w);if(!nav)return null;
    const all=qsa(':scope>.pb818PrintFinanceTab,:scope>.pb817PrintFinanceTab,:scope>.pb816PrintFinanceTab,:scope>.pb815PrintFinanceTab,:scope>.photographerPrintFinanceTab',nav);
    let tab=all[0]||null;
    if(!tab){
      tab=document.createElement('button');
      tab.type='button';
      nav.appendChild(tab);
    }
    for(const extra of all.slice(1))extra.remove();
    pb1308Add(tab,'rolePrimaryAction','pb815PrintFinanceTab','pb816PrintFinanceTab','pb817PrintFinanceTab','pb818PrintFinanceTab','photographerPrintFinanceTab');
    pb1308Text(tab,'مالی');
    pb1308Attr(tab,'aria-label','مالی');
    pb1308Attr(tab,'title','مالی');
    const album=qs(':scope>.photographerPrintAlbumTab',nav),photo=qs(':scope>.photographerPrintPhotoTab',nav);
    if(album&&album.nextElementSibling!==tab)album.insertAdjacentElement('afterend',tab);
    else if(!album&&photo&&photo.nextElementSibling!==tab)photo.insertAdjacentElement('afterend',tab);
    const active=financeRoute();
    tab.classList.toggle('active',active);tab.toggleAttribute('aria-current',active);
    return tab;
  }

  function actionSource(w,album,index){
    if(album){
      if(index===0)return qs('.photographerAlbumCreateWorkspaceMode .albumOrderWorkspace .albumFileActionFile,.albumOrderWorkspace .albumFileActionFile,.photographerAlbumCreateWorkspaceMode .albumQuickActions button:first-child');
      return qs('.photographerAlbumCreateWorkspaceMode .albumOrderWorkspace .albumQuoteCard button.primary,.albumOrderWorkspace .albumQuoteCard button.primary,.photographerAlbumCreateWorkspaceMode .albumQuickActions button:nth-child(2)');
    }
    if(index===0)return qs('.simplePrintPilotMobileInlineActions .simplePrintPilotPrimaryAdd,.simplePrintPilot .simplePrintPilotPrimaryAdd');
    return qs('.simplePrintPilot .simplePrintPilotQuoteSubmit,.simplePrintPilotMobileInlineActions .simplePrintPilotHeaderSubmit,.simplePrintPilot .simplePrintPilotHeaderSubmit');
  }

  function proxyAction(index){
    const w=main();if(!w)return;
    const album=isAlbum(w),source=actionSource(w,album,index);
    if(source&&!source.disabled){source.click();return}
    setTimeout(()=>{const again=actionSource(main(),album,index);if(again&&!again.disabled)again.click()},80);
  }

  function ensureComposerActions(w){
    const nav=qs('.photographerPrintModeNav',w);if(!nav)return;
    let row=qs(':scope>#pb761-mode-actions',nav);
    if(!row){row=document.createElement('div');row.id='pb761-mode-actions';pb1308Attr(row,'aria-label','ارسال سفارش');nav.appendChild(row)}
    let choose=qs(':scope>.pb765Choose,:scope>.pb818Choose',row);
    if(!choose){choose=document.createElement('button');choose.type='button';choose.className='pb765Choose pb818Choose';choose.addEventListener('click',()=>proxyAction(0));row.prepend(choose)}
    else pb1308Add(choose,'pb818Choose');
    let send=qs(':scope>.pb761Send,:scope>.pb818Send',row);
    if(!send){send=document.createElement('button');send.type='button';send.className='pb761Send pb818Send';send.addEventListener('click',()=>proxyAction(1));row.appendChild(send)}
    else pb1308Add(send,'pb818Send');
    // If the old runtime owns the buttons it already wired click handlers; only fallback-created
    // buttons use the proxy listeners above.
    const album=isAlbum(w);
    pb1308Text(choose,album?(albumHasFiles()?'افزودن فایل آلبوم':'انتخاب فایل آلبوم'):'انتخاب عکس');
    pb1308Text(send,album?'ارسال آلبوم برای چاپ':'ارسال برای چاپ');
    const chooseSource=actionSource(w,album,0),sendSource=actionSource(w,album,1);
    choose.disabled=!chooseSource||!!chooseSource.disabled;
    send.disabled=!sendSource||!!sendSource.disabled;
    pb1308Hidden(row,false);row.removeAttribute('aria-hidden');
    for(const prop of ['display','visibility','pointer-events','opacity'])row.style.removeProperty(prop);
  }

  function sync(){
    raf=0;
    const w=main(),active=!!w&&mobile();
    document.documentElement.classList.toggle('pb818PrintContext',active);
    document.documentElement.classList.toggle('pb818PrintFinance',active&&financeRoute());
    if(!active)return;
    financeTab(w);
    const composer=isComposer(w);
    w.classList.toggle('pb818PrintComposer',composer);
    if(composer)ensureComposerActions(w);
    // Finance is a top tab: its old invoice/back shortcuts stay implementation-only.
    if(financeRoute())qsa('.photographerPrintModeBack,.pb805InvoiceBack,#pb783FinanceShortcut',w).forEach(el=>{pb1308Hidden(el,true);pb1308Attr(el,'aria-hidden','true')});
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(sync)}
  function burst(){[0,30,80,180,400,800].forEach(ms=>setTimeout(schedule,ms))}

  document.addEventListener('click',e=>{
    if(!mobile())return;
    if(e.target?.closest?.('.pb818PrintFinanceTab,.pb817PrintFinanceTab,.pb816PrintFinanceTab,.pb815PrintFinanceTab,.photographerPrintFinanceTab'))burst();
    if(e.target?.closest?.('#pb765-add,#pb762-add,.photographerMobileOrderAction,.simplePrintPilotPrimaryAdd,.albumFileActionFile'))burst();
  },true);
  addEventListener('popstate',burst,{passive:true});
  addEventListener('pageshow',burst,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  const start=()=>{
    const root=qs('#root');
    if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-current']});
    burst();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
