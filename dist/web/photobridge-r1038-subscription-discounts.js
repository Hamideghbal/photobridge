(()=>{
  'use strict';
  if(!/^\/lab(?:\/|$)/.test(location.pathname)||window.__PB_R1038_SUBSCRIPTION_DISCOUNTS__)return;
  window.__PB_R1038_SUBSCRIPTION_DISCOUNTS__=true;
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const money=n=>fa(Math.max(0,Math.round(Number(n||0))))+' تومان';
  const css=document.createElement('style');
  css.textContent=`
    .labPlanChoices>button.pbR1038DiscountedPlan{position:relative;border-color:#75e0a7!important;background:linear-gradient(180deg,#fff 0,#f0fdf4 100%)!important}
    .pbR1038LabDiscountDetails{display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap;margin-top:5px}
    .pbR1038LabDiscountDetails em{font-style:normal;font-size:10px;font-weight:900;color:#067647;background:#dcfae6;border:1px solid #abefc6;border-radius:999px;padding:3px 8px}
    .pbR1038LabDiscountDetails del{font-size:10.5px;color:#98a2b3;text-decoration-thickness:1.5px}
    .pbR1038LabDiscountDetails strong{font-size:12px;color:#175cd3}
  `;
  document.head.appendChild(css);
  let plans=null,busy=false,queued=false;
  async function load(){
    if(plans||busy)return;busy=true;
    try{const r=await fetch('/api/lab/subscription',{credentials:'same-origin',cache:'no-store'});if(r.ok){const j=await r.json();plans=Array.isArray(j.plans)?j.plans:[]}}
    catch{}finally{busy=false;schedule()}
  }
  function paint(){
    queued=false;
    const buttons=[...document.querySelectorAll('.labSubscriptionPanel .labPlanChoices>button')];
    if(!buttons.length)return;
    if(!plans){void load();return}
    buttons.forEach((button,index)=>{
      const plan=plans[index],pct=Number(plan?.special_discount_percent||0),before=Number(plan?.plan_price||plan?.price||0),after=Number(plan?.price||0);
      const signature=pct>0&&before>after?`${pct}:${before}:${after}`:'none';
      if(button.dataset.pbR1038Discount===signature)return;
      button.dataset.pbR1038Discount=signature;
      button.querySelector('.pbR1038LabDiscountDetails')?.remove();button.classList.remove('pbR1038DiscountedPlan');
      if(signature==='none')return;
      button.classList.add('pbR1038DiscountedPlan');
      const detail=document.createElement('span');detail.className='pbR1038LabDiscountDetails';
      detail.innerHTML=`<em>${fa(pct)}٪ تخفیف اختصاصی شما</em><del>${money(before)}</del><strong>${money(after)}</strong>`;
      button.appendChild(detail);
    });
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(paint)}
  new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
