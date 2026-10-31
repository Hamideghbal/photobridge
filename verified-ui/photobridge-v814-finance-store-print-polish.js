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
  const byLabel=(box,label)=>[...box.children].find(el=>norm(el.querySelector('small')?.textContent)===label);
  function renamePrintFinanceAction(root=document){
    const buttons=[];
    if(root instanceof Element && root.matches?.('.photographerPrintCommonAction.finance')) buttons.push(root);
    root.querySelectorAll?.('.photographerPrintCommonAction.finance').forEach(b=>buttons.push(b));
    for(const b of buttons){
      pb1308Attr(b,'aria-label','مالی');pb1308Attr(b,'title','مالی');
      const em=b.querySelector('em');if(em&&norm(em.textContent)!=='مالی')pb1308Text(em,'مالی');
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
      pb1308Add(w,'pb814CustomerFinance');
      const top=w.querySelector('.financeTopline'),nav=w.querySelector('.financeNavDock'),tabs=w.querySelector('.financeSectionTabs');
      if(nav&&top&&nav.nextElementSibling!==top)pb1308Order(nav,0),pb1308Order(top,1);
      if(top){
        const h=top.querySelector('h2'),p=top.querySelector('p');
        if(h)pb1308Text(h,'امور مالی و فاکتورها');
        if(p)pb1308Text(p,'وضعیت حساب، فاکتورها، دریافت‌ها و حساب معین');
      }
      if(tabs){
        pb1308Add(tabs,'pb814FinanceTabs');
        const desired=['فاکتورها','حساب معین','دریافت‌ها'];
        const btns=[...tabs.querySelectorAll('button')];
        const map=new Map(btns.map(b=>[norm(b.textContent),b]));
        for(const label of desired){const b=map.get(label);if(b)pb1308Order(b,(typeof desired!=="undefined"?desired:typeof order!=="undefined"?order:wanted).indexOf(label))}
        for(const b of [...tabs.querySelectorAll('button')])if(!desired.includes(norm(b.textContent)))b.style.display='none';
      }
      const wanted=['جمع فاکتورها','پرداخت ثبت‌شده','مانده حساب'];
      for(const label of wanted){const el=byLabel(summary,label);if(el)pb1308Order(el,wanted.indexOf(label))}
      for(const el of [...summary.children]){const label=norm(el.querySelector('small')?.textContent);if(!wanted.includes(label))pb1308Hidden(el,true)}
      pb1308Add(summary,'pb814FinanceSummary');
    }
  }
  let queued=false;
  const run=()=>{queued=false;renamePrintFinanceAction(document);fixCustomerFinance(document)};
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(run)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
})();
