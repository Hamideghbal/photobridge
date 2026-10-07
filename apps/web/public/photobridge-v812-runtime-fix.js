(()=>{
  'use strict';
  const LABELS={invoice:'جمع فاکتورها',paid:'پرداخت ثبت‌شده',discount:'تخفیف‌ها',balance:'مانده حساب'};
  function normalize(v){return String(v||'').replace(/\s+/g,' ').trim()}
  function fixSummary(root){
    if(!(root instanceof Element)) return;
    const candidates=[];
    if(root.matches?.('.financeSummary.accountingSummary')) candidates.push(root);
    root.querySelectorAll?.('.financeSummary.accountingSummary').forEach(x=>candidates.push(x));
    for(const box of candidates){
      const children=[...box.children];
      const labels=children.map(el=>normalize(el.querySelector('small')?.textContent));
      if(!labels.includes(LABELS.invoice)||!labels.includes(LABELS.paid)||!labels.includes(LABELS.balance)) continue;
      const discount=children.find(el=>normalize(el.querySelector('small')?.textContent)===LABELS.discount);
      if(discount) discount.remove();
      box.classList.add('pb812FinanceThree');
    }
  }
  let queued=false;
  const run=()=>{queued=false;fixSummary(document.body)};
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(run)};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
