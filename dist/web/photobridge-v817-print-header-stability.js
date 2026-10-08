/* PhotoBridge v817 — stable mobile Print header, native Finance tab flow, composer header repair. */
(()=>{
  'use strict';
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
    tab.classList.add('rolePrimaryAction','pb817PrintFinanceTab');
    tab.classList.add('pb815PrintFinanceTab');
    // Keep pb816 class if it already exists so older selectors cannot create a duplicate.
    if(!tab.classList.contains('photographerPrintFinanceTab'))tab.classList.add('pb816PrintFinanceTab');
    tab.textContent='مالی';
    tab.setAttribute('aria-label','مالی');tab.setAttribute('title','مالی');
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
    guide.classList.remove('pb699DesktopGuide');
    let label=qs(':scope>.pb569GuideLabel',guide);
    if(!label){guide.innerHTML='<em class="pb569GuideLabel" aria-hidden="true">؟</em>';label=qs('.pb569GuideLabel',guide)}
    if(label)label.textContent='؟';
  }

  function normalizeFinance(main){
    const finance=qs('.financeWorkspace.accountingWorkspace,.financeWorkspace',main);if(!finance)return;
    finance.classList.add('pb817StableFinance');
    const tabs=qs('.financeSectionTabs',finance);
    if(tabs){
      tabs.classList.add('pb817FinanceTabs');
      const wanted=['فاکتورها','حساب معین','دریافت‌ها'];
      const map=new Map(qsa(':scope>button',tabs).map(b=>[text(b),b]));
      wanted.forEach(label=>{const b=map.get(label);if(b)tabs.appendChild(b)});
    }
    qs('.financeSummary.accountingSummary',finance)?.classList.add('pb817FinanceSummary');
  }

  function hideLegacy(main,financeActive,composer){
    const shortcut=qs('#pb783FinanceShortcut');
    if(shortcut){shortcut.hidden=true;shortcut.setAttribute('aria-hidden','true');shortcut.classList.add('pb817LegacyFinanceHidden')}
    qsa('.photographerPrintModeUtilityCluster>.photographerPrintCommonAction.finance,.photographerContextAction.financeAction,.photographerLabContextActions .financeAction',main).forEach(el=>{
      el.hidden=true;el.setAttribute('aria-hidden','true');el.classList.add('pb817LegacyFinanceHidden');
    });
    // Finance is now a tab. A finance-only Back button is no longer useful.
    if(financeActive){
      qsa('.photographerPrintModeBack,.pb805InvoiceBack',main).forEach(el=>{el.hidden=true;el.setAttribute('aria-hidden','true');el.classList.add('pb817FinanceBackHidden')});
    }else if(composer){
      // File/album composer still needs one compact Back control.
      const back=qs('.photographerPrintModeUtilityCluster>.photographerPrintModeBack',main);
      if(back){back.hidden=false;back.removeAttribute('aria-hidden');back.classList.remove('pb817FinanceBackHidden')}
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
      nav.classList.add('pb817StablePrintNav');
      fixGuide(nav,'print',':scope>.photographerPrintPhotoTab');
      fixGuide(nav,'album',':scope>.photographerPrintAlbumTab');
    }
    if(tab){
      const financeActive=financeRoute();
      tab.classList.toggle('active',financeActive);tab.toggleAttribute('aria-current',financeActive);
      if(financeActive)qsa('.photographerPrintPhotoTab,.photographerPrintAlbumTab',nav).forEach(b=>{b.classList.remove('active');b.removeAttribute('aria-current')});
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
