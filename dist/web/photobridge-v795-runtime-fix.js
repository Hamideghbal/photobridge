/* PhotoBridge v795 — print invoice/back cleanup, installed-PWA detection, clearer AI tabs and Instagram mobile controls. */
(()=>{
  'use strict';
  if(window.__PB795_RUNTIME_FIX__)return;
  window.__PB795_RUNTIME_FIX__=true;

  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const root=document.documentElement;
  const PRINT_LAST_KEY='photobridge:v795:last-print-route';
  const INSTALLED_KEYS=['photobridge:pwa-installed','photobridge:pwa-installed-v713'];
  let raf=0,relatedBusy=false;

  const currentUrl=()=>`${location.pathname}${location.search}`;
  const inPrint=()=>Boolean(qs('.photographerMain.photographerPrintWorkspace'))||(/^\/photographer\/(?:orders|upload|album|archive|finance)/.test(location.pathname)&&new URLSearchParams(location.search).get('workspace')==='print');
  const uploadMode=()=>/\/photographer\/upload(?:\/|$)/.test(location.pathname)||Boolean(qs('.photographerMain.photographerUploadWorkspaceMode,.photographerMain.simplePrintPilotWorkspaceMode'));
  const financeMode=()=>/\/photographer\/finance(?:\/|$)/.test(location.pathname)||Boolean(qs('.photographerMain[data-pb791-finance="1"] .financeWorkspace,.photographerMain.photographerPrintWorkspace .financeWorkspace'));

  function rememberPrintRoute(){
    if(!inPrint()||financeMode())return;
    const url=currentUrl();
    if(/^\/photographer\/(?:orders|upload|album|archive)/.test(location.pathname))try{sessionStorage.setItem(PRINT_LAST_KEY,url)}catch{}
  }
  function previousPrintRoute(){
    let url='';try{url=sessionStorage.getItem(PRINT_LAST_KEY)||''}catch{}
    if(!url||url===currentUrl()||!/^(?:\/photographer\/)/.test(url)||/\/photographer\/finance/.test(url))return '/photographer/orders/flow?workspace=print';
    return url;
  }
  function restoreInvoiceButton(btn){
    if(!btn)return;
    btn.classList.remove('pb795FinanceBack','pb795InvoiceHidden');
    btn.setAttribute('aria-label','فاکتور');btn.setAttribute('title','فاکتور');
    if(btn.dataset.pb795Converted==='1'){btn.innerHTML='<span aria-hidden="true">▤</span><em>فاکتور</em>';btn.dataset.pb795Converted='0'}
  }
  function normalizePrintInvoice(){
    const main=qs('.photographerMain.photographerPrintWorkspace');
    if(!main)return;
    rememberPrintRoute();
    const cluster=qs('.photographerPrintModeUtilityCluster',main);if(!cluster)return;
    const invoices=qsa(':scope>.photographerPrintCommonAction.finance',cluster);
    const invoice=invoices[0]||null;invoices.slice(1).forEach(x=>x.remove());
    const back=qs(':scope>.photographerPrintModeBack',cluster);

    // Old context-level finance controls caused the second invoice action in mobile print.
    qsa('.photographerContextAction.financeAction,.photographerLabContextActions .financeAction',main).forEach(el=>el.classList.add('pb795LowerFinanceHidden'));

    if(uploadMode()){
      restoreInvoiceButton(invoice);invoice?.classList.add('pb795InvoiceHidden');back?.classList.remove('pb795DuplicateBackHidden');
      return;
    }
    if(financeMode()){
      if(invoice){
        invoice.classList.remove('pb795InvoiceHidden');invoice.classList.add('pb795FinanceBack');invoice.dataset.pb795Converted='1';
        invoice.setAttribute('aria-label','بازگشت به صفحه قبل');invoice.setAttribute('title','بازگشت');
        invoice.innerHTML='<span aria-hidden="true">←</span><em>بازگشت</em>';
      }
      // Exactly one Back action is shown in the invoice view, at the same slot where Invoice was.
      back?.classList.add('pb795DuplicateBackHidden');
      return;
    }
    restoreInvoiceButton(invoice);back?.classList.remove('pb795DuplicateBackHidden');
  }

  function localInstalled(){
    try{return INSTALLED_KEYS.some(k=>k==='photobridge:pwa-installed'?localStorage.getItem(k)==='1':Boolean(localStorage.getItem(k)))}catch{return false}
  }
  function standalone(){
    try{
      return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: window-controls-overlay)').matches||navigator.standalone===true||String(document.referrer||'').startsWith('android-app://');
    }catch{return navigator.standalone===true}
  }
  function strongInstalled(){return standalone()||localInstalled()||root.classList.contains('pb710Installed')||root.classList.contains('pb711Installed')}
  function markInstalled(){
    root.classList.add('pb795Installed','pb710Installed','pb711Installed');
    root.classList.remove('pb710InstallReady','pb711InstallReady','pb771InstallChecking');
    try{localStorage.setItem('photobridge:pwa-installed','1');localStorage.setItem('photobridge:pwa-installed-v713',String(Date.now()))}catch{}
    qsa('.mobileHeaderInstall,.pb710InstallButton').forEach(el=>{el.hidden=true;el.setAttribute('aria-hidden','true')});
  }
  function paintInstall(){
    const installed=strongInstalled();root.classList.toggle('pb795Installed',installed);
    qsa('.mobileHeaderInstall,.pb710InstallButton').forEach(el=>{
      if(installed){el.hidden=true;el.setAttribute('aria-hidden','true')}
      else if(el.hasAttribute('data-pb795-hidden')){el.hidden=false;el.removeAttribute('aria-hidden');el.removeAttribute('data-pb795-hidden')}
    });
    if(installed)qsa('.mobileHeaderInstall,.pb710InstallButton').forEach(el=>el.setAttribute('data-pb795-hidden','1'));
  }
  async function detectRelatedApp(){
    if(relatedBusy||strongInstalled()||typeof navigator.getInstalledRelatedApps!=='function')return;
    relatedBusy=true;
    try{
      const apps=await navigator.getInstalledRelatedApps();
      if(Array.isArray(apps)&&apps.some(app=>/photobridge/i.test(`${app?.id||''} ${app?.url||''}`)))markInstalled();
    }catch{}finally{relatedBusy=false;paintInstall()}
  }

  function normalizeAiTabs(){
    qsa('.photographerAiSectionNav>button').forEach(btn=>{
      const active=btn.classList.contains('active');btn.setAttribute('aria-selected',active?'true':'false');btn.setAttribute('aria-pressed',active?'true':'false');
      if(active)btn.setAttribute('data-pb795-active','1');else btn.removeAttribute('data-pb795-active');
    });
  }
  function markInstagramToolbar(){
    const instagram=document.body.classList.contains('pbPublicDesignMode-instagram')||document.body.classList.contains('pb647InstagramOnly')||new URLSearchParams(location.search).get('pb_mode')==='instagram';
    qsa('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar').forEach(el=>el.classList.toggle('pb795InstagramToolbar',instagram));
  }

  function sync(){normalizePrintInvoice();paintInstall();normalizeAiTabs();markInstagramToolbar();void detectRelatedApp()}
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync()})}

  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('.photographerPrintCommonAction.finance.pb795FinanceBack');
    if(btn&&financeMode()){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();location.assign(previousPrintRoute());
    }
  },true);

  addEventListener('appinstalled',()=>{markInstalled();schedule()});
  addEventListener('pageshow',schedule,{passive:true});addEventListener('focus',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  try{matchMedia('(display-mode: standalone)').addEventListener?.('change',schedule)}catch{}
  const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  for(const name of ['pushState','replaceState']){
    const old=history[name];if(typeof old!=='function'||old.__pb795)continue;const fn=function(...args){const out=old.apply(this,args);setTimeout(schedule,0);return out};fn.__pb795=true;history[name]=fn;
  }
  addEventListener('popstate',schedule,{passive:true});
  sync();setTimeout(sync,150);setTimeout(sync,800);
  console.info('[PhotoBridge] v795 runtime active');
})();
