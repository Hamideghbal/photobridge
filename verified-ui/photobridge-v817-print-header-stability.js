/* PhotoBridge v817 — stable mobile Print header, native Finance tab flow, composer header repair. */
(()=>{
  'use strict';
  /* PB1308: styling must settle and preserve React-owned child order. */
  function pb1308Add(el,...names){if(el)for(const name of names)if(!el.classList.contains(name))el.classList.add(name)}
  function pb1308Remove(el,...names){if(el)for(const name of names)if(el.classList.contains(name))el.classList.remove(name)}
  function pb1308Text(el,value){if(el&&el.textContent!==value)el.textContent=value}
  function pb1308Hidden(el,value){if(el&&el.hidden!==value)el.hidden=value}
  function pb1308Attr(el,name,value){if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
  function pb1308Order(el,value){if(el&&el.style.order!==String(value))el.style.order=String(value)}

  if(window.__PB817_PRINT_HEADER_STABILITY__)return;
  window.__PB817_PRINT_HEADER_STABILITY__=true;

  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const text=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  const mobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  const printQuery=()=>new URLSearchParams(location.search).get('workspace')==='print';
  const financeRoute=()=>/^\/photographer\/finance(?:\/|$)/.test(location.pathname);
  const printMain=()=>qs('.photographerMain.photographerPrintWorkspace')||((financeRoute()&&printQuery())?qs('.photographerMain'):null);
  let raf=0;

  function printContextActive(){
    return printQuery()||!!qs('.photographerMain.photographerPrintWorkspace')||document.documentElement.classList.contains('pb817PrintContext');
  }

  function withPrintWorkspace(url){
    if(url==null)return url;
    let u;
    try{u=new URL(url instanceof URL?url.href:String(url),location.href)}catch{return url}
    if(u.origin!==location.origin||!/^\/photographer\/finance(?:\/|$)/.test(u.pathname)||!printContextActive())return url;
    u.searchParams.set('workspace','print');
    const local=`${u.pathname}${u.search}${u.hash}`;
    return url instanceof URL?new URL(local,location.origin):local;
  }

  // Finance section navigation must never drop ?workspace=print. Dropping it makes React
  // leave the Print workspace and was the root cause of the collapsing header.
  for(const name of ['pushState','replaceState']){
    const old=history[name];
    if(typeof old!=='function'||old.__pb817)continue;
    const fn=function(state,title,url){
      return old.call(this,state,title,withPrintWorkspace(url));
    };
    fn.__pb817=true;
    history[name]=fn;
  }

  function ensureFinanceTab(main){
    const nav=qs('.photographerPrintModeNav',main);if(!nav)return null;
    let tab=qs(':scope>.photographerPrintFinanceTab,:scope>.pb817PrintFinanceTab,:scope>.pb816PrintFinanceTab,:scope>.pb815PrintFinanceTab',nav);
    if(!tab){
      tab=document.createElement('button');
      tab.type='button';
      tab.className='rolePrimaryAction pb817PrintFinanceTab';
    }
    pb1308Add(tab,'rolePrimaryAction','pb817PrintFinanceTab');
    pb1308Add(tab,'pb815PrintFinanceTab');
    // Keep pb816 class if it already exists so older selectors cannot create a duplicate.
    if(!tab.classList.contains('photographerPrintFinanceTab'))pb1308Add(tab,'pb816PrintFinanceTab');
    pb1308Text(tab,'مالی');
    pb1308Attr(tab,'aria-label','مالی');pb1308Attr(tab,'title','مالی');
    const album=qs(':scope>.photographerPrintAlbumTab',nav),photo=qs(':scope>.photographerPrintPhotoTab',nav);
    if(album){if(album.nextElementSibling!==tab)album.insertAdjacentElement('afterend',tab)}
    else if(photo){if(photo.nextElementSibling!==tab)photo.insertAdjacentElement('afterend',tab)}
    else if(tab.parentElement!==nav)nav.appendChild(tab);
    return tab;
  }

  function fixGuide(nav,kind,targetSelector){
    const target=qs(targetSelector,nav);if(!target)return;
    let guide=qs(`:scope>.pb569WorkflowGuideButton.${kind}`,target)||qs(`:scope>.pb569WorkflowGuideButton.${kind}`,nav);
    if(!guide)return;
    if(guide.parentElement!==target)target.appendChild(guide);
    pb1308Remove(guide,'pb699DesktopGuide');
    let label=qs(':scope>.pb569GuideLabel',guide);
    if(!label){guide.innerHTML='<em class="pb569GuideLabel" aria-hidden="true">؟</em>';label=qs('.pb569GuideLabel',guide)}
    if(label)pb1308Text(label,'؟');
  }

  function normalizeFinance(main){
    const finance=qs('.financeWorkspace.accountingWorkspace,.financeWorkspace',main);if(!finance)return;
    pb1308Add(finance,'pb817StableFinance');
    const tabs=qs('.financeSectionTabs',finance);
    if(tabs){
      pb1308Add(tabs,'pb817FinanceTabs');
      const wanted=['فاکتورها','حساب معین','دریافت‌ها'];
      const map=new Map(qsa(':scope>button',tabs).map(b=>[text(b),b]));
      wanted.forEach(label=>{const b=map.get(label);if(b)pb1308Order(b,(typeof desired!=="undefined"?desired:typeof order!=="undefined"?order:wanted).indexOf(label))});
    }
    pb1308Add(qs('.financeSummary.accountingSummary',finance),'pb817FinanceSummary');
  }

  function hideLegacy(main,financeActive,composer){
    const shortcut=qs('#pb783FinanceShortcut');
    if(shortcut){pb1308Hidden(shortcut,true);pb1308Attr(shortcut,'aria-hidden','true');pb1308Add(shortcut,'pb817LegacyFinanceHidden')}
    qsa('.photographerPrintModeUtilityCluster>.photographerPrintCommonAction.finance,.photographerContextAction.financeAction,.photographerLabContextActions .financeAction',main).forEach(el=>{
      pb1308Hidden(el,true);pb1308Attr(el,'aria-hidden','true');pb1308Add(el,'pb817LegacyFinanceHidden');
    });
    // Finance is now a tab. A finance-only Back button is no longer useful.
    if(financeActive){
      qsa('.photographerPrintModeBack,.pb805InvoiceBack',main).forEach(el=>{pb1308Hidden(el,true);pb1308Attr(el,'aria-hidden','true');pb1308Add(el,'pb817FinanceBackHidden')});
    }else if(composer){
      // File/album composer still needs one compact Back control.
      const back=qs('.photographerPrintModeUtilityCluster>.photographerPrintModeBack',main);
      if(back){pb1308Hidden(back,false);back.removeAttribute('aria-hidden');pb1308Remove(back,'pb817FinanceBackHidden')}
    }
  }

  function sync(){
    raf=0;
    const root=document.documentElement;
    const main=printMain();
    const active=Boolean(main&&mobile());
    root.classList.toggle('pb817PrintContext',active);
    root.classList.toggle('pb817PrintFinance',active&&financeRoute());
    if(!active)return;

    const composer=main.classList.contains('photographerUploadWorkspaceMode')||main.classList.contains('simplePrintPilotWorkspaceMode')||main.classList.contains('photographerAlbumCreateWorkspaceMode')||!!qs('.simplePrintPilot,.albumOrderWorkspace',main);
    main.classList.toggle('pb817PrintComposer',composer);
    main.classList.toggle('pb817PrintFinanceMain',financeRoute());

    const tab=ensureFinanceTab(main);
    const nav=qs('.photographerPrintModeNav',main);
    if(nav){
      pb1308Add(nav,'pb817StablePrintNav');
      fixGuide(nav,'print',':scope>.photographerPrintPhotoTab');
      fixGuide(nav,'album',':scope>.photographerPrintAlbumTab');
    }
    if(tab){
      const financeActive=financeRoute();
      tab.classList.toggle('active',financeActive);tab.toggleAttribute('aria-current',financeActive);
      if(financeActive)qsa('.photographerPrintPhotoTab,.photographerPrintAlbumTab',nav).forEach(b=>{pb1308Remove(b,'active');b.removeAttribute('aria-current')});
    }
    if(financeRoute())normalizeFinance(main);
    hideLegacy(main,financeRoute(),composer);
  }

  function schedule(){if(!raf)raf=requestAnimationFrame(sync)}
  function burst(){[0,25,70,160,360,700].forEach(ms=>setTimeout(schedule,ms))}

  // Authoritative Finance-tab navigation. Never proxy through the legacy invoice button.
  document.addEventListener('click',e=>{
    if(!mobile())return;
    const financeTab=e.target?.closest?.('.pb817PrintFinanceTab,.pb816PrintFinanceTab,.pb815PrintFinanceTab,.photographerPrintFinanceTab');
    if(financeTab&&printMain()){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();
      if(!financeRoute()||!printQuery())location.assign('/photographer/finance/invoices?workspace=print');
      return;
    }
    // The real finance subtabs may rerender immediately. History wrappers above preserve
    // the workspace query; the burst keeps the shared header stable during that rerender.
    if(e.target?.closest?.('.financeWorkspace .financeSectionTabs>button'))burst();
  },true);

  addEventListener('popstate',burst,{passive:true});
  addEventListener('pageshow',burst,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  const start=()=>{
    const root=qs('#root');
    if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-current','data-pb790-finance','data-pb791-finance']});
    burst();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
