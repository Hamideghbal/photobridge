/* PhotoBridge v821 — Print finance lab centering marker + automatic customer statement refresh. */
(()=>{
  'use strict';
  /* PB1308: styling must settle and preserve React-owned child order. */
  function pb1308Add(el,...names){if(el)for(const name of names)if(!el.classList.contains(name))el.classList.add(name)}
  function pb1308Remove(el,...names){if(el)for(const name of names)if(el.classList.contains(name))el.classList.remove(name)}
  function pb1308Text(el,value){if(el&&el.textContent!==value)el.textContent=value}
  function pb1308Hidden(el,value){if(el&&el.hidden!==value)el.hidden=value}
  function pb1308Attr(el,name,value){if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
  function pb1308Order(el,value){if(el&&el.style.order!==String(value))el.style.order=String(value)}

  if(window.__PB821_STORE_PRINT_FINANCE_FIX__)return;
  window.__PB821_STORE_PRINT_FINANCE_FIX__=true;

  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const txt=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  const printFinance=()=>/^\/photographer\/finance(?:\/|$)/.test(location.pathname)&&new URLSearchParams(location.search).get('workspace')==='print';
  let raf=0,lastSeen='',lastSubmitted='',submitTimer=0;

  function values(filters){
    const triggers=qsa('.statementDateLabel .persianDateTrigger',filters);
    return triggers.slice(0,2).map(x=>txt(x)).join('|');
  }
  function displayButton(filters){
    return qsa(':scope>button',filters).find(b=>/نمایش حساب/.test(txt(b)))||null;
  }
  function scheduleSubmit(filters){
    clearTimeout(submitTimer);
    submitTimer=setTimeout(()=>{
      if(!printFinance()||!filters?.isConnected)return;
      const key=values(filters);
      if(!key||key===lastSubmitted)return;
      const btn=displayButton(filters);
      if(!btn||btn.disabled||/در حال محاسبه/.test(txt(btn)))return;
      lastSubmitted=key;
      btn.click();
    },220);
  }
  function bindStatement(){
    const filters=qs('.financeWorkspace .statementToolbar .statementFilters');
    if(!filters)return;
    pb1308Add(filters,'pb821AutoStatement');
    const btn=displayButton(filters);
    if(btn)pb1308Add(btn,'pb821StatementDisplayButton');
    if(filters.dataset.pb821Bound!=='1'){
      filters.dataset.pb821Bound='1';
      lastSeen=values(filters);lastSubmitted=lastSeen;
      filters.addEventListener('click',e=>{
        if(e.target?.closest?.('.calendarGrid button,.calendarTodayBtn,.dateClearBtn'))setTimeout(()=>scheduleSubmit(filters),30);
      },true);
      filters.addEventListener('change',()=>scheduleSubmit(filters),true);
      filters.addEventListener('input',()=>scheduleSubmit(filters),true);
    }
    const now=values(filters);
    if(lastSeen&&now!==lastSeen){lastSeen=now;scheduleSubmit(filters)}
    else if(!lastSeen)lastSeen=now;
  }
  function sync(){
    raf=0;
    const active=printFinance();
    document.documentElement.classList.toggle('pb821PrintFinance',active);
    if(!active)return;
    pb1308Add(qs('.photographerMain .photographerPrintModeNav>.photographerPrintTopLab'),'pb821CenteredLab');
    bindStatement();
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(sync)}
  function burst(){[0,30,90,180,420,800].forEach(ms=>setTimeout(schedule,ms))}

  for(const name of ['pushState','replaceState']){
    const old=history[name];if(typeof old!=='function'||old.__pb821)continue;
    const fn=function(...args){const out=old.apply(this,args);burst();return out};fn.__pb821=true;history[name]=fn;
  }
  addEventListener('popstate',burst,{passive:true});
  addEventListener('pageshow',burst,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  const start=()=>{
    const root=qs('#root');if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-current','hidden']});
    setInterval(()=>{if(printFinance())schedule()},350);
    burst();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
