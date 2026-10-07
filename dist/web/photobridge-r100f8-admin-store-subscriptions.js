(()=>{
  if(!location.pathname.startsWith('/admin'))return;
  if(window.__PB_R100F8_ADMIN_STORE_SUBS__)return;window.__PB_R100F8_ADMIN_STORE_SUBS__=true;
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api=async(path,opt={})=>{const r=await fetch(path,{credentials:'include',headers:{'content-type':'application/json',...(opt.headers||{})},...opt});const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(j.error||'request_failed'),j);return j};
  const moneyText=v=>String(Math.max(0,Number(v||0))).replace(/\B(?=(\d{3})+(?!\d))/g,',');
  async function load(panel){
    const body=panel.querySelector('[data-store-sub-body]');if(!body)return;
    body.innerHTML='<div class="loadingBox">در حال دریافت تعرفه فروشگاه‌ها…</div>';
    try{
      const out=await api('/api/admin/equipment-rental/subscription-plans'),plans=Array.isArray(out.plans)?out.plans:[];
      body.innerHTML=plans.length?`<div class="subscriptionPlanGrid"><div class="subscriptionPlanHead"><span>دوره فروشگاه</span><span>مبلغ اشتراک</span><span>فعال</span><span></span></div>${plans.map(p=>`<div class="subscriptionPlanRow pbR100F8StorePlan" data-store-plan="${esc(p.id)}"><div><b>${esc(p.name||`${fa(p.months)} ماهه`)}</b><small>${fa(p.months)} ماه اعتبار فروشگاه</small></div><label class="pbR100F8StorePrice"><input type="text" inputmode="numeric" value="${moneyText(p.price)}" data-price><small>تومان</small></label><label class="switch"><input type="checkbox" data-active ${p.active!==false?'checked':''}><span></span></label><button type="button" data-save>ذخیره</button></div>`).join('')}</div>`:'<div class="empty">تعرفه فروشگاه ثبت نشده است.</div>';
      body.querySelectorAll('[data-save]').forEach(btn=>btn.onclick=async()=>{const row=btn.closest('[data-store-plan]'),id=row.dataset.storePlan,price=Number(String(row.querySelector('[data-price]').value||'').replace(/[^0-9]/g,'')),active=row.querySelector('[data-active]').checked;btn.disabled=true;btn.textContent='در حال ذخیره…';try{await api('/api/admin/equipment-rental/subscription-plans/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({price,active})});btn.textContent='ذخیره شد';setTimeout(()=>btn.textContent='ذخیره',1100)}catch{btn.textContent='خطا';setTimeout(()=>btn.textContent='ذخیره',1400)}finally{btn.disabled=false}});
    }catch(e){body.innerHTML='<div class="empty">دریافت تعرفه اشتراک فروشگاه انجام نشد.</div>'}
  }
  function plansTabActive(){
    const active=[...document.querySelectorAll('.adminTabs button.active')].find(Boolean);
    return Boolean(active&&/^اشتراک$/.test(String(active.textContent||'').trim()));
  }
  function mount(){
    let panel=document.querySelector('#pbR100F8StoreSubscriptionPanel');
    const lab=document.querySelector('.subscriptionPlansPanel:not(#pbR100F8StoreSubscriptionPanel)');
    if(!plansTabActive()||!lab){if(panel)panel.remove();return;}
    if(!panel){panel=document.createElement('section');panel.id='pbR100F8StoreSubscriptionPanel';panel.className='card panel subscriptionPlansPanel pbR100F8StoreSubscriptionPanel';panel.innerHTML='<div class="panelHead"><div><h2>تعرفه اشتراک فروشگاه تجهیزات</h2><p>مبلغ دوره‌های اشتراک فروشگاه را مانند اشتراک لابراتوار از همین بخش مدیریت کن.</p></div><button type="button" data-reload>به‌روزرسانی</button></div><div data-store-sub-body></div>';lab.insertAdjacentElement('afterend',panel);panel.querySelector('[data-reload]').onclick=()=>load(panel);load(panel)}
    else if(panel.previousElementSibling!==lab)lab.insertAdjacentElement('afterend',panel);
  }
  let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(mount,80)};
  addEventListener('DOMContentLoaded',schedule,{once:true});
  const root=document.getElementById('root');if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  const style=document.createElement('style');style.textContent='.pbR100F8StoreSubscriptionPanel{margin-top:12px}.pbR100F8StoreSubscriptionPanel .subscriptionPlanHead,.pbR100F8StoreSubscriptionPanel .subscriptionPlanRow{grid-template-columns:minmax(150px,1fr) minmax(170px,.55fr) 70px auto}.pbR100F8StorePrice{display:flex;align-items:center;gap:6px;min-width:0}.pbR100F8StorePrice input{width:100%;min-width:0;border:1px solid #dfe3ea;border-radius:8px;padding:8px;background:#fff}.pbR100F8StorePrice small{white-space:nowrap;color:#98a2b3}.pbR100F8StorePlan>button{border:1px solid #c7d2fe;background:#eef2ff;color:#3730a3;border-radius:8px;padding:7px 10px;font-weight:850}@media(max-width:760px){.pbR100F8StoreSubscriptionPanel .subscriptionPlanHead{display:none}.pbR100F8StoreSubscriptionPanel .subscriptionPlanRow{grid-template-columns:1fr auto;gap:8px}.pbR100F8StorePrice{grid-column:1/-1}.pbR100F8StorePlan>button{width:100%}}';document.head.append(style);
})();
