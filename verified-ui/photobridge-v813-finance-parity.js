(()=>{
  'use strict';
  /* PB1308: styling must settle and preserve React-owned child order. */
  function pb1308Add(el,...names){if(el)for(const name of names)if(!el.classList.contains(name))el.classList.add(name)}
  function pb1308Remove(el,...names){if(el)for(const name of names)if(el.classList.contains(name))el.classList.remove(name)}
  function pb1308Text(el,value){if(el&&el.textContent!==value)el.textContent=value}
  function pb1308Hidden(el,value){if(el&&el.hidden!==value)el.hidden=value}
  function pb1308Attr(el,name,value){if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
  function pb1308Order(el,value){if(el&&el.style.order!==String(value))el.style.order=String(value)}

  const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
  function fixFinance(root=document){
    const spaces=[];
    if(root instanceof Element && root.matches?.('.financeWorkspace.accountingWorkspace')) spaces.push(root);
    root.querySelectorAll?.('.financeWorkspace.accountingWorkspace').forEach(x=>spaces.push(x));
    for(const w of spaces){
      const title=norm(w.querySelector('.financeTopline h2')?.textContent);
      if(title!=='فاکتورها و حساب مالی') continue;
      pb1308Add(w,'pb813CustomerFinance');
      const nav=w.querySelector('.financeNavDock'),top=w.querySelector('.financeTopline'),tabs=w.querySelector('.financeSectionTabs'),summary=w.querySelector('.financeSummary.accountingSummary');
      if(nav&&top&&nav.nextElementSibling!==top) pb1308Order(nav,0),pb1308Order(top,1);
      if(tabs){
        pb1308Add(tabs,'pb813FinanceTabs');
        const desired=['فاکتورها','حساب معین','دریافت‌ها'];
        const buttons=[...tabs.querySelectorAll('button')];
        const current=buttons.map(b=>norm(b.textContent));
        if(desired.some((x,i)=>current[i]!==x)){
          const byText=new Map(buttons.map(b=>[norm(b.textContent),b]));
          for(const label of desired){const b=byText.get(label);if(b)pb1308Order(b,(typeof desired!=="undefined"?desired:typeof order!=="undefined"?order:wanted).indexOf(label))}
        }
      }
      if(summary){pb1308Add(summary,'pb813FinanceSummary');}
    }
  }
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;fixFinance(document)})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>fixFinance(document),{once:true});else fixFinance(document);
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
})();
