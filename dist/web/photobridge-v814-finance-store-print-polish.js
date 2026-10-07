(()=>{
  'use strict';
  const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
  const byLabel=(box,label)=>[...box.children].find(el=>norm(el.querySelector('small')?.textContent)===label);
  function renamePrintFinanceAction(root=document){
    const buttons=[];
    if(root instanceof Element && root.matches?.('.photographerPrintCommonAction.finance')) buttons.push(root);
    root.querySelectorAll?.('.photographerPrintCommonAction.finance').forEach(b=>buttons.push(b));
    for(const b of buttons){
      b.setAttribute('aria-label','مالی');b.setAttribute('title','مالی');
      const em=b.querySelector('em');if(em&&norm(em.textContent)!=='مالی')em.textContent='مالی';
    }
  }
  function fixCustomerFinance(root=document){
    const spaces=[];
    if(root instanceof Element && root.matches?.('.financeWorkspace.accountingWorkspace'))spaces.push(root);
    root.querySelectorAll?.('.financeWorkspace.accountingWorkspace').forEach(w=>spaces.push(w));
    for(const w of spaces){
      const summary=w.querySelector('.financeSummary.accountingSummary');
      if(!summary)continue;
      const labels=[...summary.children].map(el=>norm(el.querySelector('small')?.textContent));
      if(!labels.includes('جمع فاکتورها')||!labels.includes('پرداخت ثبت‌شده')||!labels.includes('مانده حساب'))continue;
      w.classList.add('pb814CustomerFinance');
      const top=w.querySelector('.financeTopline'),nav=w.querySelector('.financeNavDock'),tabs=w.querySelector('.financeSectionTabs');
      if(nav&&top&&nav.nextElementSibling!==top)w.insertBefore(nav,top);
      if(top){
        const h=top.querySelector('h2'),p=top.querySelector('p');
        if(h)h.textContent='امور مالی و فاکتورها';
        if(p)p.textContent='وضعیت حساب، فاکتورها، دریافت‌ها و حساب معین';
      }
      if(tabs){
        tabs.classList.add('pb814FinanceTabs');
        const desired=['فاکتورها','حساب معین','دریافت‌ها'];
        const btns=[...tabs.querySelectorAll('button')];
        const map=new Map(btns.map(b=>[norm(b.textContent),b]));
        for(const label of desired){const b=map.get(label);if(b)tabs.appendChild(b)}
        for(const b of [...tabs.querySelectorAll('button')])if(!desired.includes(norm(b.textContent)))b.style.display='none';
      }
      const wanted=['جمع فاکتورها','پرداخت ثبت‌شده','مانده حساب'];
      for(const label of wanted){const el=byLabel(summary,label);if(el)summary.appendChild(el)}
      for(const el of [...summary.children]){const label=norm(el.querySelector('small')?.textContent);if(!wanted.includes(label))el.remove()}
      summary.classList.add('pb814FinanceSummary');
    }
  }
  let queued=false;
  const run=()=>{queued=false;renamePrintFinanceAction(document);fixCustomerFinance(document)};
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(run)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
})();
