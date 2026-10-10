(()=>{'use strict';
  const path=location.pathname;
  const isAdmin=/^\/admin(?:\/|$)/.test(path);
  const isRental=/^\/rental(?:\/|$)/.test(path);
  if(!isAdmin&&!isRental)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Number(n||0).toLocaleString('fa-IR');
  const api=async(u,o={})=>{const r=await fetch(u,{credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},...o});const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(j.message||j.error||'خطا'),{data:j});return j;};
  const css=document.createElement('style');css.textContent=`
  #pbDiscountLabsBtn{height:32px;border:1px solid #b8c5ff;background:#eef2ff;color:#3531ad;border-radius:9px;padding:0 11px;font:800 11px Tahoma,sans-serif;cursor:pointer}
  #pbDiscountLabsDialog{position:fixed;inset:0;background:#10182878;z-index:2147483600;display:none;place-items:center;padding:14px;direction:rtl}
  #pbDiscountLabsDialog.open{display:grid}#pbDiscountLabsDialog .inner{background:#fff;border-radius:15px;width:min(700px,100%);max-height:calc(100dvh - 28px);overflow:auto;padding:16px;box-shadow:0 12px 60px #0003;color:#1d2939}
  #pbDiscountLabsDialog header{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:10px}
  #pbDiscountLabsDialog h3{margin:0;font-size:15px}#pbDiscountLabsDialog button{cursor:pointer;border:1px solid #d0d5dd;background:#fff;color:#344054;border-radius:8px;padding:8px;font:800 11px Tahoma,sans-serif}
  #pbDiscountLabsDialog .line{display:grid;grid-template-columns:minmax(0,1fr) 90px 75px;gap:9px;align-items:center;border-top:1px solid #eaecf0;padding:9px 0;font-size:12px}
  #pbDiscountLabsDialog .line input{width:100%;padding:8px;border:1px solid #d0d5dd;border-radius:8px;direction:ltr;text-align:center}
  #pbDiscountLabsDialog small{font-size:10px;color:#667085;display:block;margin-top:5px}
  #pbDiscountLabsDialog .line button{background:#eef2ff;color:#3531ad;border-color:#b8c5ff}
  #pbDiscountLabsDialog .hint{font-size:11px;color:#667085;line-height:1.9;margin:0 0 12px}
  #pbRentalActivationBanner{position:fixed;top:86px;right:12px;left:12px;z-index:10005;max-width:780px;margin:auto;border:1px solid #f3c189;background:#fff9e9;color:#8a4a07;padding:11px 14px;border-radius:12px;text-align:center;box-shadow:0 8px 28px #0002;font:800 12px/1.9 Tahoma,Arial,sans-serif;direction:rtl}
  #pbRentalActivationToast{position:fixed;left:12px;right:12px;bottom:22px;z-index:2147483600;max-width:620px;margin:auto;border-radius:12px;background:#842b1b;color:#fff;padding:13px 15px;text-align:center;font:800 12px/1.9 Tahoma,Arial,sans-serif;direction:rtl;box-shadow:0 8px 28px #0004}
  @media(max-width:560px){#pbDiscountLabsDialog .line{grid-template-columns:minmax(0,1fr) 70px;gap:5px}#pbDiscountLabsDialog .line button{grid-column:1/-1}#pbRentalActivationBanner{top:67px}}
  `;document.head.appendChild(css);
  if(isAdmin){
    let labs=[],opening=false;
    const modal=()=>{let m=document.getElementById('pbDiscountLabsDialog');if(!m){m=document.createElement('div');m.id='pbDiscountLabsDialog';m.innerHTML='<div class="inner"><header><h3>تخفیف اختصاصی اشتراک لابراتوارها</h3><button type="button" data-close>بستن ×</button></header><p class="hint">برای هر لابراتوار یک تخفیف مستقل از صفر تا ۱۰۰ درصد تعیین کن. این درصد روی مبلغ اشتراک دوره‌های ماهانه اعمال می‌شود و در پرداخت نهایی نیز محاسبه خواهد شد.</p><div data-list></div></div>';document.body.appendChild(m);m.onclick=e=>{if(e.target===m||e.target.closest('[data-close]'))m.classList.remove('open')};}return m;};
    async function open(){
      if(opening)return;opening=true;const m=modal();m.classList.add('open');const list=m.querySelector('[data-list]');list.innerHTML='در حال دریافت لابراتوارها…';
      try{
        const data=await api('/api/admin/labs');labs=Array.isArray(data.labs)?data.labs:[];
        list.innerHTML=labs.length?labs.map(l=>`<div class="line" data-id="${esc(l.id)}"><div><b>${esc(l.name)}</b><small>${Number(l.subscription_discount_percent||0)>0?fmt(l.subscription_discount_percent)+'٪ تخفیف فعال':Number(l.subscription_discount_amount||0)>0&&l.subscription_discount_enabled?'تخفیف مبلغی فعلی: '+fmt(l.subscription_discount_amount)+' تومان':'بدون تخفیف'}</small></div><input aria-label="درصد تخفیف" type="number" step="0.5" min="0" max="100" value="${esc(l.subscription_discount_percent||0)}"><button type="button" data-save>ذخیره</button></div>`).join(''):'لابراتواری ثبت نشده است.';
        list.querySelectorAll('[data-save]').forEach(b=>b.onclick=async()=>{const row=b.closest('[data-id]'),id=row.dataset.id,field=row.querySelector('input'),num=Number(field.value);if(field.value.trim()===''||!Number.isFinite(num)||num<0||num>100)return alert('درصد تخفیف باید بین صفر تا ۱۰۰ باشد.');b.disabled=true;b.textContent='در حال ذخیره';try{const saved=await api('/api/admin/labs/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({subscriptionDiscountPercent:num,subscriptionDiscountEnabled:num>0,subscriptionDiscountAmount:0})});if(Number(saved.subscription_discount_percent)!==num)throw new Error('تأیید ذخیره درصد از سرور دریافت نشد.');const fresh=await api('/api/admin/labs');const actual=(fresh.labs||[]).find(x=>String(x.id)===String(id));if(!actual||Number(actual.subscription_discount_percent)!==num)throw new Error('درصد تخفیف بعد از بازخوانی با مقدار ذخیره‌شده مطابقت ندارد.');const lab=labs.find(x=>x.id===id);if(lab){lab.subscription_discount_percent=num;lab.subscription_discount_enabled=num>0;lab.subscription_discount_amount=0;}row.querySelector('small').textContent=num?fmt(num)+'٪ تخفیف فعال':'بدون تخفیف';b.textContent='ذخیره شد';setTimeout(()=>{b.textContent='ذخیره';b.disabled=false},900);}catch(e){b.disabled=false;b.textContent='ذخیره';alert('ثبت تخفیف انجام نشد: '+(e.message||'خطا'))}});
      }catch(e){list.textContent='دریافت اطلاعات لابراتوارها انجام نشد: '+(e.message||'خطا')}finally{opening=false;}
    }
    let pending=false;function mount(){pending=false;const tabs=document.querySelector('.adminTabs');if(!tabs)return;const active=[...tabs.querySelectorAll('button.active')].find(x=>String(x.textContent||'').trim()==='لابراتوارها');let b=document.getElementById('pbDiscountLabsBtn');if(!active){b?.remove();return;}if(!b){b=document.createElement('button');b.type='button';b.id='pbDiscountLabsBtn';b.textContent='تخفیف اشتراک لابراتوارها';b.onclick=open;tabs.appendChild(b)}else if(b.parentElement!==tabs)tabs.appendChild(b);}
    const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(mount)};new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
  }
  if(isRental){
    const blockedErrors=new Set(['rental_shop_not_activated','rental_shop_inactive','subscription_inactive','rental_shop_suspended']);
    let toastTimer;
    function showToast(msg){let el=document.getElementById('pbRentalActivationToast');if(!el){el=document.createElement('div');el.id='pbRentalActivationToast';document.body.appendChild(el)}el.textContent=msg;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),6500);}
    const orig=window.fetch.bind(window);
    window.fetch=async(...args)=>{const r=await orig(...args);try{const u=typeof args[0]==='string'?args[0]:args[0]?.url||'';if(!r.ok&&/^\/api\/rental\//.test(new URL(u,location.href).pathname)){const j=await r.clone().json().catch(()=>null);if(j&&blockedErrors.has(j.error)){const message=j.message||(j.error==='rental_shop_not_activated'?'فعال‌سازی این فروشگاه هنوز توسط ادمین سایت فوتوبریج تأیید نشده است. تا زمان تأیید امکان ثبت آفیش یا ارسال پیامک وجود ندارد.':j.error==='subscription_inactive'?'اعتبار اشتراک فروشگاه پایان یافته است.':j.error==='rental_shop_suspended'?'فروشگاه توسط ادمین تعلیق شده است.':'فروشگاه هنوز فعال نیست.');showToast(message)}}}catch{}return r;};
    async function banner(){try{const d=await api('/api/rental/activation-status'),x=d.activation;if(!x)return;let el=document.getElementById('pbRentalActivationBanner');const unapproved=x.activation_status!=='approved'||!x.activation_ever_approved;if(!unapproved){el?.remove();return;}if(!el){el=document.createElement('div');el.id='pbRentalActivationBanner';document.body.appendChild(el)}el.textContent='فعال‌سازی فروشگاه هنوز توسط ادمین سایت فوتوبریج تأیید نشده است. تا زمان تأیید، ثبت آفیش و ارسال پیامک و دعوت‌نامه امکان‌پذیر نیست. ثبت کالا و تنظیم قیمت‌ها همچنان مجاز است.';}catch{document.getElementById('pbRentalActivationBanner')?.remove();}}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(banner,500));else setTimeout(banner,500);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)void banner()});
  }
})();
