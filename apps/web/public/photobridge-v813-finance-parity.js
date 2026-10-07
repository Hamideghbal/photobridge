(()=>{
  'use strict';
  const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
  function fixFinance(root=document){
    const spaces=[];
    if(root instanceof Element && root.matches?.('.financeWorkspace.accountingWorkspace')) spaces.push(root);
    root.querySelectorAll?.('.financeWorkspace.accountingWorkspace').forEach(x=>spaces.push(x));
    for(const w of spaces){
      const title=norm(w.querySelector('.financeTopline h2')?.textContent);
      if(title!=='فاکتورها و حساب مالی') continue;
      w.classList.add('pb813CustomerFinance');
      const nav=w.querySelector('.financeNavDock'),top=w.querySelector('.financeTopline'),tabs=w.querySelector('.financeSectionTabs'),summary=w.querySelector('.financeSummary.accountingSummary');
      if(nav&&top&&nav.nextElementSibling!==top) w.insertBefore(nav,top);
      if(tabs){
        tabs.classList.add('pb813FinanceTabs');
        const desired=['فاکتورها','حساب معین','دریافت‌ها'];
        const buttons=[...tabs.querySelectorAll('button')];
        const current=buttons.map(b=>norm(b.textContent));
        if(desired.some((x,i)=>current[i]!==x)){
          const byText=new Map(buttons.map(b=>[norm(b.textContent),b]));
          for(const label of desired){const b=byText.get(label);if(b)tabs.appendChild(b)}
        }
      }
      if(summary){summary.classList.add('pb813FinanceSummary');}
    }
  }
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;fixFinance(document)})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>fixFinance(document),{once:true});else fixFinance(document);
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
})();
