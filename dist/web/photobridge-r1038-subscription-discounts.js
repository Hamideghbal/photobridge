(()=>{
  'use strict';
  if(!/^\/lab(?:\/|$)/.test(location.pathname)||window.__PB_R1038_SUBSCRIPTION_DISCOUNTS__)return;
  window.__PB_R1038_SUBSCRIPTION_DISCOUNTS__=true;
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const money=n=>fa(Math.max(0,Math.round(Number(n||0))))+' تومان';
  const css=document.createElement('style');
  css.id='pbR1558GoldenSubscriptionDiscount';
  css.textContent=`
    html body #root .labRoleWorkspace .labSubscriptionPanel .labPlanChoices>button.pbR1038DiscountedPlan{
      position:relative!important;display:flex!important;flex-direction:column!important;
      align-items:flex-start!important;justify-content:center!important;text-align:right!important;
      padding:12px 15px 12px 119px!important;min-height:114px!important;overflow:hidden!important;
      border-color:#eed48d!important;border-radius:12px!important;
      background:linear-gradient(155deg,#fff 2%,#fffaf0 100%)!important;
      box-shadow:0 4px 14px rgba(158,111,27,.06)!important;
    }
    html body #root .labRoleWorkspace .labSubscriptionPanel .labPlanChoices>button.pbR1038DiscountedPlan.selected{
      border-color:#70b5f8!important;box-shadow:0 0 0 2px rgba(63,142,240,.12),0 7px 20px rgba(158,111,27,.08)!important;
    }
    html body #root .labRoleWorkspace .labSubscriptionPanel .labPlanChoices>button.pbR1038DiscountedPlan>span:first-child{
      color:#626f87!important;font-size:11px!important;font-weight:700!important;
      line-height:1.7!important;margin:0 0 5px!important;
    }
    html body #root .labRoleWorkspace .labSubscriptionPanel .labPlanChoices>button.pbR1038DiscountedPlan>b{
      font-size:clamp(15px,1.15vw,21px)!important;font-weight:900!important;
      color:#1b293e!important;line-height:1.5!important;margin:0!important;
    }
    html body #root .labRoleWorkspace .labSubscriptionPanel .labPlanChoices>button.pbR1038DiscountedPlan>small,
    html body #root .labRoleWorkspace .labSubscriptionPanel .labPlanChoices>button.pbR1038DiscountedPlan>del:not(.pbR1038BeforePrice){display:none!important}
    html body #root .labRoleWorkspace .labSubscriptionPanel .labPlanChoices>button.pbR1038DiscountedPlan>del.pbR1038BeforePrice{
      display:block!important;font-size:11px!important;color:#98a2b3!important;
      text-decoration:line-through!important;text-decoration-thickness:1.2px!important;
      margin:3px 0 0!important;line-height:1.5!important;white-space:nowrap;
    }
    html body #root .labRoleWorkspace .labSubscriptionPanel .labPlanChoices>button.pbR1038DiscountedPlan .pbR1038LabDiscountDetails{
      position:absolute!important;top:50%;left:13px;transform:translateY(-50%);direction:rtl;
      display:grid!important;place-items:center!important;gap:3px;
      width:91px;height:84px;box-sizing:border-box;pointer-events:none;
      border:1px solid #e9bb61;border-radius:26px 31px 24px 32px;
      background:radial-gradient(circle at 30% 12%,#fff8de 0%,#ffe8a5 38%,#f2c66e 78%,#e6ad4a 100%);
      box-shadow:inset 0 2px 3px rgba(255,255,255,.85),inset 0 -3px 5px rgba(173,107,18,.1),0 5px 15px rgba(174,119,25,.13);
      color:#825113!important;text-align:center!important;
    }
    .pbR1038LabDiscountDetails::before{content:'✦';position:absolute;top:-9px;right:5px;font-size:18px;color:#dbac49;text-shadow:0 2px 2px #fff}
    .pbR1038LabDiscountDetails::after{content:'✧';position:absolute;top:3px;right:-10px;font-size:14px;color:#e8bd64}
    .pbR1038LabDiscountDetails strong{display:block!important;font-size:22px!important;font-weight:950!important;line-height:1!important;color:#84510c!important;white-space:nowrap}
    .pbR1038LabDiscountDetails small{display:block!important;font-size:10px!important;font-weight:850!important;line-height:1.4!important;color:#865719!important;white-space:nowrap}
    @media(max-width:780px){
      html body #root .labRoleWorkspace .labSubscriptionPanel .labPlanChoices>button.pbR1038DiscountedPlan{flex:1 1 225px!important;min-width:195px!important}

      html body #root .labRoleWorkspace .labSubscriptionPanel .labPlanChoices>button.pbR1038DiscountedPlan{padding-left:93px!important;min-height:104px!important}
      html body #root .labRoleWorkspace .labSubscriptionPanel .labPlanChoices>button.pbR1038DiscountedPlan .pbR1038LabDiscountDetails{left:8px;width:74px;height:74px;border-radius:24px}
      .pbR1038LabDiscountDetails strong{font-size:19px!important}.pbR1038LabDiscountDetails small{font-size:9px!important}
    }
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
    const buttons=[...document.querySelectorAll('html body #root .labRoleWorkspace .labSubscriptionPanel .labPlanChoices>button')];
    if(!buttons.length)return;
    if(!plans){void load();return}
    buttons.forEach((button,index)=>{
      const plan=plans[index],pct=Number(plan?.special_discount_percent||0),before=Number(plan?.plan_price||plan?.price||0),after=Number(plan?.price||0);
      const signature=pct>0&&before>after?`${pct}:${before}:${after}`:'none';
      if(button.dataset.pbR1038Discount===signature&&(signature==='none'||button.querySelector('.pbR1038LabDiscountDetails')))return;
      button.dataset.pbR1038Discount=signature;
      button.querySelector('.pbR1038LabDiscountDetails')?.remove();
      button.querySelector('.pbR1038BeforePrice')?.remove();
      button.classList.remove('pbR1038DiscountedPlan');
      if(signature==='none')return;
      button.classList.add('pbR1038DiscountedPlan');
      // The original React <b> already contains the final payable price. Never repeat it.
      const old=document.createElement('del');old.className='pbR1038BeforePrice';old.textContent=money(before);
      const price=button.querySelector(':scope>b');
      if(price)price.after(old);else button.appendChild(old);
      const badge=document.createElement('span');badge.className='pbR1038LabDiscountDetails';
      const percent=document.createElement('strong');percent.textContent=fa(pct)+'٪';
      const subtitle=document.createElement('small');subtitle.textContent='اختصاصی شما';
      badge.append(percent,subtitle);button.appendChild(badge);
    });
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(paint)}
  new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
