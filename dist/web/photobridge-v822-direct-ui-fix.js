/* PhotoBridge v822 — robust Print Finance detection + automatic statement refresh. */
(()=>{
  'use strict';
  if(window.__PB822_DIRECT_UI_FIX__)return;
  window.__PB822_DIRECT_UI_FIX__=true;
  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const text=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  let raf=0,lastKey='',timer=0;
  function getContext(){
    const finance=qs('.financeWorkspace');
    const main=finance?.closest?.('.photographerMain');
    if(!finance||!main)return null;
    const print=main.classList.contains('photographerPrintWorkspace') ||
      new URLSearchParams(location.search).get('workspace')==='print' ||
      document.documentElement.classList.contains('pb817PrintContext') ||
      !!qs('.photographerPrintModeNav',main);
    return print?{finance,main}:null;
  }
  function dateKey(filters){
    return qsa('.statementDateLabel .persianDateTrigger,.statementDateLabel .pbSelectTrigger',filters).slice(0,2).map(text).join('|');
  }
  function findDisplay(filters){
    return qsa(':scope>button',filters).find(b=>/نمایش حساب/.test(text(b)))||null;
  }
  function submit(filters){
    clearTimeout(timer);
    timer=setTimeout(()=>{
      if(!filters?.isConnected)return;
      const key=dateKey(filters),btn=findDisplay(filters);
      if(!key||key===lastKey||!btn||btn.disabled)return;
      lastKey=key;
      btn.click();
    },180);
  }
  function sync(){
    raf=0;
    const ctx=getContext();
    qsa('.photographerMain.pb822PrintFinanceDirect').forEach(m=>{if(m!==ctx?.main)m.classList.remove('pb822PrintFinanceDirect')});
    if(!ctx)return;
    const {finance,main}=ctx;
    main.classList.add('pb822PrintFinanceDirect');
    const filters=qs('.statementToolbar .statementFilters',finance);
    if(filters&&!qs('.statementCustomerPicker',filters)){
      filters.classList.add('pb822AutoStatement');
      const btn=findDisplay(filters);if(btn)btn.classList.add('pb822StatementDisplayButton');
      const key=dateKey(filters);
      if(!filters.dataset.pb822Bound){filters.dataset.pb822Bound='1';lastKey=key}
      else if(key&&key!==lastKey)submit(filters);
    }
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(sync)}
  const start=()=>{
    const root=qs('#root');
    if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','aria-current','hidden']});
    setInterval(schedule,300);
    schedule();
  };
  addEventListener('popstate',schedule,{passive:true});
  addEventListener('pageshow',schedule,{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
