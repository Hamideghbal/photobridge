/* PhotoBridge v858 compatibility — photographer identity + finance shortcut; equipment Store is live. */
(()=>{
  'use strict';
  if(window.__PB783_POLISH__)return;
  window.__PB783_POLISH__=true;

  const ADMIN_MOBILE='09125678720';
  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const mobile=()=>{try{return matchMedia('(max-width:820px)').matches}catch{return innerWidth<=820}};
  const normalizeMobile=v=>{let d=String(v||'').replace(/\D/g,'');if(d.startsWith('0098'))d=d.slice(4);else if(d.startsWith('98')&&d.length>=12)d=d.slice(2);if(d.startsWith('9')&&d.length===10)d='0'+d;return d};
  const cleanStudio=v=>String(v||'').trim().replace(/^عکاسی\s+/,'').trim();
  const studioTitle=v=>{const n=cleanStudio(v);return n?`عکاسی ${n}`:'عکاسی'};

  let mePromise=null,meCache=null,raf=0,lastHref=location.href;
  function photographerMe(force=false){
    if(meCache&&!force)return Promise.resolve(meCache);
    if(mePromise&&!force)return mePromise;
    mePromise=fetch('/api/auth/me',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}})
      .then(async r=>{const d=await r.json().catch(()=>null);if(r.ok&&d?.user)meCache=d;else meCache=null;return meCache})
      .catch(()=>null).finally(()=>{mePromise=null});
    return mePromise;
  }
  const isAdmin=async()=>normalizeMobile((await photographerMe())?.user?.mobile)===ADMIN_MOBILE;

  function syncPhotographerIdentity(){
    if(!location.pathname.startsWith('/photographer'))return;
    const copy=qs('#photographerRoleHeaderV710 .workspaceIdentityCopy');if(!copy)return;
    photographerMe().then(me=>{
      if(!me?.user||!copy.isConnected)return;
      const h=qs('h1',copy),sub=qs(':scope > small',copy);
      const studio=String(me.user.photographerName||h?.textContent||me.user.name||'').trim();
      const owner=String(me.user.name||'').trim();
      if(h&&h.textContent!==studioTitle(studio))h.textContent=studioTitle(studio);
      const manager=owner?`مدیریت ${owner}`:'مدیریت عکاسی';if(sub&&sub.textContent!==manager)sub.textContent=manager;
    });
  }

  function syncDesignComingSoon(){
    const p=location.pathname,coming=qs('.photographerAlbumDesignComingSoon');
    if(!coming||!p.startsWith('/photographer/album-design'))return;
    const instagram=new URLSearchParams(location.search).get('pb_mode')==='instagram';
    const eye=qs('.eyebrow',coming),h=qs('h2',coming),text=qs('p',coming);
    if(eye)eye.textContent=instagram?'طراحی اینستاگرام':'طراحی آلبوم';
    if(h)h.textContent='Coming Soon';
    if(text)text.textContent=instagram?'طراحی پست اینستاگرام برای حساب‌های عکاسی به‌زودی فعال می‌شود.':'طراحی آلبوم برای حساب‌های عکاسی به‌زودی فعال می‌شود.';
  }

  function hideStoreSoon(){qs('#pb783StoreComingSoon')?.remove();document.documentElement.classList.remove('pb783StoreSoonOpen')}
  function showStoreSoon(){location.assign('/equipment-rental/book')}

  const STORE_ENTRY_SELECTOR='.photographerStoreEntry,.photographerStoreMobileNav';
  document.addEventListener('click',e=>{
    // v785: Store navigation is owned by React. Never overlay the previous tab or stop the tab click.
    if(e.target?.closest?.('.photographerBottomAppNav button,.photographerHeaderNav button,'+STORE_ENTRY_SELECTOR))hideStoreSoon();
  },true);

  function syncFinanceShortcut(){
    let b=qs('#pb783FinanceShortcut');
    const app=qs('.photographerMain.photographerPrintWorkspace'),lab=qs('.photographerPrintModeHeader .photographerPrintTopLab'),native=qs('.photographerPrintModeUtilityCluster .photographerPrintCommonAction.finance');
    const finance=!!app&&(location.pathname.startsWith('/photographer/finance')||!!qs('.financeWorkspace',app));
    const composer=!!app&&(app.classList.contains('photographerUploadWorkspaceMode')||app.classList.contains('simplePrintPilotWorkspaceMode')||app.classList.contains('photographerAlbumCreateWorkspaceMode')||!!qs('.simplePrintPilot,.albumOrderWorkspace',app));
    if(!mobile()||!app||!lab||!native||composer){b?.remove();return}
    if(!b){b=document.createElement('button');b.id='pb783FinanceShortcut';b.type='button';document.body.appendChild(b)}
    b.onclick=e=>{
      e.preventDefault();e.stopPropagation();
      if(finance){
        let target='';try{target=sessionStorage.getItem('photobridge:print:invoice-return')||''}catch{}
        if(!target||!/^\/photographer\/(orders|album|archive)(?:\/|\?|$)/.test(target))target='/photographer/orders/flow?workspace=print';
        location.assign(target);return;
      }
      try{sessionStorage.setItem('photobridge:print:invoice-return',location.pathname+location.search)}catch{}
      native.click();
    };
    b.innerHTML=finance?'<span aria-hidden="true">←</span><b>بازگشت</b>':'<span aria-hidden="true">▤</span><b>فاکتور</b>';
    b.setAttribute('aria-label',finance?'بازگشت':'فاکتور');b.title=finance?'بازگشت':'فاکتور';b.classList.toggle('active',finance||native.classList.contains('active'));b.classList.toggle('pb805Back',finance);
    const r=lab.getBoundingClientRect();
    b.style.top=`${Math.round(r.top+5)}px`;b.style.left='8px';b.style.height=`${Math.max(30,Math.round(r.height-10))}px`;
  }

  async function focusInvoice(){
    if(location.pathname!=='/photographer/finance/invoices')return;
    const id=new URLSearchParams(location.search).get('invoice')||sessionStorage.getItem('photobridge:finance:focus-invoice');
    if(!id)return;
    try{
      const r=await fetch('/api/customer/invoices',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}}),d=await r.json().catch(()=>({}));
      const rows=Array.isArray(d?.invoices)?d.invoices:Array.isArray(d)?d:[];
      const inv=rows.find(x=>String(x?.id)===String(id));if(!inv)return;
      const number=String(inv.invoice_number||inv.number||'').replace(/\D/g,'');if(!number)return;
      const fa=Number(number||0).toLocaleString('fa-IR');
      let tries=0;const find=()=>{
        const row=qsa('.accountingInvoiceRows .invoiceRow').find(x=>String(x.textContent||'').includes(`#${fa}`)||String(x.textContent||'').includes(`#${number}`));
        if(row){row.classList.add('pb783InvoiceFocus');row.scrollIntoView({block:'center',behavior:'smooth'});try{sessionStorage.removeItem('photobridge:finance:focus-invoice')}catch{};return}
        if(++tries<20)setTimeout(find,160);
      };find();
    }catch{}
  }

  function syncAll(){hideStoreSoon();syncPhotographerIdentity();syncDesignComingSoon();syncFinanceShortcut();void focusInvoice()}
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;syncAll()})}
  const mo=new MutationObserver(schedule);
  function start(){const root=qs('#root');if(root)mo.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});schedule();setTimeout(schedule,250);setTimeout(schedule,900)}
  const wrap=n=>{const old=history[n];if(!old||old.__pb783)return;const fn=function(...args){const out=old.apply(this,args);if(location.href!==lastHref){lastHref=location.href;hideStoreSoon();schedule()}return out};fn.__pb783=true;history[n]=fn};
  try{wrap('pushState');wrap('replaceState')}catch{}
  addEventListener('popstate',()=>{lastHref=location.href;hideStoreSoon();schedule()},{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('photobridge-finance-focus-invoice',()=>setTimeout(()=>void focusInvoice(),100));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v858 compatibility: photographer identity + finance shortcut + live Store');
})();

/* PhotoBridge v845-hotfix — fast store tab response: keep active panel switch out of heavy render queue. */
(()=>{
  if(window.__PB845_FAST_TAB_FIX__) return;
  window.__PB845_FAST_TAB_FIX__=true;
  const mark=()=>document.documentElement.classList.add('pb845-fast-tab-switch');
  document.addEventListener('pointerdown',e=>{
    const b=e.target?.closest?.('[data-store-panel],.storeTab,.storeSubTab,.photographerPrintModeNav button,.financeWorkspace button,.photographerHeaderNav button');
    if(b) mark();
  },true);
  document.addEventListener('click',()=>{
    requestAnimationFrame(()=>document.documentElement.classList.remove('pb845-fast-tab-switch'));
  },true);
})();
