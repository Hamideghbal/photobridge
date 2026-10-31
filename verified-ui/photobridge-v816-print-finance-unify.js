/* PhotoBridge v816 — authoritative Print/Finance tabs parity with Equipment Store. */
(()=>{
  'use strict';
  /* PB1308: styling must settle and preserve React-owned child order. */
  function pb1308Add(el,...names){if(el)for(const name of names)if(!el.classList.contains(name))el.classList.add(name)}
  function pb1308Remove(el,...names){if(el)for(const name of names)if(el.classList.contains(name))el.classList.remove(name)}
  function pb1308Text(el,value){if(el&&el.textContent!==value)el.textContent=value}
  function pb1308Hidden(el,value){if(el&&el.hidden!==value)el.hidden=value}
  function pb1308Attr(el,name,value){if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
  function pb1308Order(el,value){if(el&&el.style.order!==String(value))el.style.order=String(value)}

  if(window.__PB816_PRINT_FINANCE_UNIFY__)return;
  window.__PB816_PRINT_FINANCE_UNIFY__=true;
  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const text=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  const mobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  let raf=0;

  function ensureMainFinanceTab(main){
    const nav=qs('.photographerPrintModeNav',main);if(!nav)return null;
    let tab=qs('.pb816PrintFinanceTab',nav)||qs('.pb815PrintFinanceTab',nav);
    if(!tab){
      tab=document.createElement('button');
      tab.type='button';
      tab.className='rolePrimaryAction pb816PrintFinanceTab';
      tab.addEventListener('click',ev=>{
        ev.preventDefault();ev.stopPropagation();
        const current=qs('.photographerMain.photographerPrintWorkspace');if(!current)return;
        if(qs('.financeWorkspace',current)||/^\/photographer\/finance(?:\/|$)/.test(location.pathname))return;
        const native=qs('.photographerPrintModeUtilityCluster>.photographerPrintCommonAction.finance',current);
        if(native){
          pb1308Hidden(native,false);native.removeAttribute('aria-hidden');
          native.style.removeProperty('display');native.style.removeProperty('visibility');native.style.removeProperty('pointer-events');
          native.click();
        }else{
          location.assign('/photographer/finance/invoices?workspace=print');
        }
      });
    }
    pb1308Add(tab,'rolePrimaryAction','pb816PrintFinanceTab');
    pb1308Add(tab,'pb815PrintFinanceTab');
    pb1308Text(tab,'مالی');
    pb1308Attr(tab,'aria-label','مالی');pb1308Attr(tab,'title','مالی');
    const album=qs(':scope>.photographerPrintAlbumTab',nav),photo=qs(':scope>.photographerPrintPhotoTab',nav);
    if(album){if(album.nextElementSibling!==tab)album.insertAdjacentElement('afterend',tab)}
    else if(photo){if(photo.nextElementSibling!==tab)photo.insertAdjacentElement('afterend',tab)}
    else if(tab.parentElement!==nav)nav.appendChild(tab);
    return tab;
  }

  function normalizeFinanceSubtabs(main){
    const finance=qs('.financeWorkspace.accountingWorkspace',main);if(!finance)return;
    const title=text(qs('.financeTopline h2',finance));
    if(title&&title!=='فاکتورها و حساب مالی')return;
    pb1308Add(finance,'pb816StoreLikeFinance');
    const dock=qs('.financeNavDock',finance),tabs=qs('.financeSectionTabs',finance),summary=qs('.financeSummary.accountingSummary',finance);
    pb1308Add(dock,'pb816FinanceDock');
    if(tabs){
      pb1308Add(tabs,'pb816StoreFinanceTabs');
      const buttons=qsa(':scope>button',tabs);
      const order=['فاکتورها','حساب معین','دریافت‌ها'];
      const map=new Map(buttons.map(b=>[text(b),b]));
      for(const label of order){const b=map.get(label);if(b)pb1308Order(b,(typeof desired!=="undefined"?desired:typeof order!=="undefined"?order:wanted).indexOf(label))}
    }
    pb1308Add(summary,'pb816FinanceSummary');
  }

  function sync(){
    raf=0;
    const main=qs('.photographerMain.photographerPrintWorkspace');
    document.documentElement.classList.toggle('pb816PrintFinanceActive',Boolean(main&&qs('.financeWorkspace',main)));
    if(!main||!mobile())return;
    const tab=ensureMainFinanceTab(main);
    const active=Boolean(qs('.financeWorkspace',main)||/^\/photographer\/finance(?:\/|$)/.test(location.pathname));
    if(tab){tab.classList.toggle('active',active);tab.toggleAttribute('aria-current',active)}
    if(active){
      qsa('.photographerPrintModeNav>.photographerPrintPhotoTab,.photographerPrintModeNav>.photographerPrintAlbumTab',main).forEach(b=>{pb1308Remove(b,'active');b.removeAttribute('aria-current')});
      normalizeFinanceSubtabs(main);
    }
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(sync)}
  function burst(){[0,30,90,220,520].forEach(ms=>setTimeout(schedule,ms))}
  for(const name of ['pushState','replaceState']){
    const old=history[name];if(typeof old!=='function'||old.__pb816)continue;
    const fn=function(...args){const out=old.apply(this,args);burst();return out};fn.__pb816=true;history[name]=fn;
  }
  addEventListener('popstate',burst,{passive:true});addEventListener('pageshow',burst,{passive:true});addEventListener('resize',schedule,{passive:true});
  const start=()=>{const root=qs('#root');if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-current']});burst()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
