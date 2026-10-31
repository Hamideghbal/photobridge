(()=>{
  'use strict';
  const state={prepare:null,order:null,adminLoaded:false,customerJobs:new Map(),activeCustomerExpiry:null,activeCustomerJobId:''};
  const nativeValue=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
  const setInput=(el,v)=>{try{nativeValue?.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}catch{}};
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(...args)=>{
    const r=await originalFetch(...args);
    try{
      const u=typeof args[0]==='string'?args[0]:args[0]?.url||'';
      if(String(u).includes('/api/public/ai/skin-retouch/prepare')&&r.ok){const j=await r.clone().json();state.prepare=j?.order||j||null;queueMicrotask(enhance)}
      if(/\/api\/public\/ai\/orders\/[A-Za-z0-9_-]+$/.test(String(u))&&r.ok){const j=await r.clone().json();state.order=j?.order||null;queueMicrotask(enhance)}
      if((String(u).includes('/api/customer/ai-studio/skin-retouch')||String(u).endsWith('/api/customer/ai-studio'))&&r.ok){const j=await r.clone().json();for(const x of (j?.jobs||[])){if(String(x?.service_key||'')==='ai_skin_retouch'){state.customerJobs.set(String(x.id||''),x);if(x?.status==='completed'&&x?.outputExpiresAt&&!state.activeCustomerExpiry){state.activeCustomerExpiry=x.outputExpiresAt;state.activeCustomerJobId=String(x.id||'')}}}queueMicrotask(enhance)}
      const dm=String(u).match(/\/api\/customer\/ai-studio\/jobs\/([0-9a-f-]+)\/download$/);if(dm&&r.ok){const j=await r.clone().json();const known=state.customerJobs.get(String(dm[1]));state.activeCustomerJobId=String(dm[1]);state.activeCustomerExpiry=j?.outputExpiresAt||known?.outputExpiresAt||known?.output_expires_at||null;queueMicrotask(enhance)}
    }catch{}
    return r;
  };
  const repl=[
    ['لینک نتیجه با SMS و ایمیل','لینک نتیجه با پیامک'],['دانلود + SMS و ایمیل','دانلود + پیامک'],
    ['اگر بعد از آماده‌شدن فایل آن را دانلود نکنی، لینک امن نتیجه برای همین موبایل و ایمیل ارسال می‌شود.','شماره موبایل الزامی است. لینک نتیجه و زمان حذف فایل با پیامک ارسال می‌شود. اگر اولین سفارش شما باشد، حساب روتوش سریع نیز خودکار ساخته می‌شود.'],
    ['لینک امن سفارش با SMS و ایمیل ارسال می‌شود.','لینک امن سفارش با پیامک ارسال می‌شود.'],
    ['لینک نتیجه با SMS و ایمیل ارسال می‌شود.','لینک نتیجه با پیامک ارسال می‌شود.']
  ];
  function replaceText(root=document.body){
    if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){let t=n.nodeValue||'',x=t;for(const [a,b] of repl)x=x.replaceAll(a,b);if(x!==t)n.nodeValue=x}
  }
  function emailOff(){
    if(location.pathname!=='/ai')return;
    document.querySelectorAll('label').forEach(l=>{const i=l.querySelector('input[type=email]');if(!i)return;if(i.value!=='sms-only@photobridge.ir')setInput(i,'sms-only@photobridge.ir');l.style.display='none';l.dataset.pb583EmailDisabled='1'});
    const contacts=document.querySelector('.publicAiContacts');if(contacts)contacts.style.gridTemplateColumns='1fr';
    const header=document.querySelector('.publicAiHeader');if(header&&!header.querySelector('.pb583OrdersLink')){const a=document.createElement('a');a.href='/retouch-account';a.className='pb583OrdersLink';a.textContent='سفارش‌های من';(header.lastElementChild||header).appendChild(a)}
  }
  function faceSummary(){
    if(location.pathname!=='/ai'||!state.prepare?.faceBoxes?.length)return;
    const quote=document.querySelector('.publicAiQuote'),preview=document.querySelector('.publicAiPreview');if(!quote||!preview||quote.querySelector('.pb583FaceSummary'))return;
    const b=document.createElement('div');b.className='pb583FaceSummary';const boxes=state.prepare.faceBoxes||[];b.innerHTML=`<b>${new Intl.NumberFormat('fa-IR').format(boxes.length)} چهره توسط همان موتور تشخیص چهره عکاسان شناسایی شد</b><small>کادرهای سبز، چهره‌هایی هستند که وارد همان مسیر مشترک روتوش حرفه‌ای می‌شوند.</small><div class="pb583FaceImage"><img alt="چهره‌های شناسایی‌شده"></div>`;b.querySelector('img').src=preview.src;const v=b.querySelector('.pb583FaceImage');for(const x of boxes){const m=document.createElement('i');m.style.cssText=`left:${Number(x.x||0)/10}%;top:${Number(x.y||0)/10}%;width:${Number(x.w||0)/10}%;height:${Number(x.h||0)/10}%`;v.appendChild(m)}quote.prepend(b)
  }
  let timerId=null,customerTimerId=null;
  function fmtRemain(iso){const ms=new Date(iso).getTime()-Date.now();if(ms<=0)return'۰';let s=Math.floor(ms/1000),d=Math.floor(s/86400);s%=86400;let h=Math.floor(s/3600);s%=3600;let m=Math.floor(s/60),z=s%60;return `${new Intl.NumberFormat('fa-IR').format(d)} روز، ${new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2,useGrouping:false}).format(h)}:${new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2,useGrouping:false}).format(m)}:${new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2,useGrouping:false}).format(z)}`}
  async function loadOrder(){const m=location.pathname.match(/^\/ai\/order\/([^/]+)$/);if(!m)return;try{const r=await originalFetch(`/api/public/ai/orders/${encodeURIComponent(m[1])}`,{credentials:'same-origin'});if(r.ok){state.order=(await r.json()).order;renderExpiry()}}catch{}}
  function renderExpiry(){
    const o=state.order;if(!o)return;document.querySelectorAll('.publicAiOrderFacts>div').forEach(x=>{if((x.textContent||'').includes('ایمیل تحویل'))x.remove()});const card=document.querySelector('.publicAiOrderCard');if(!card)return;let box=card.querySelector('.pb583Expiry');if(!box){box=document.createElement('div');box.className='pb583Expiry';const facts=card.querySelector('.publicAiOrderFacts');(facts||card.firstElementChild||card).after(box)}
    if(o.fileExpired){box.className='pb583Expiry expired';box.innerHTML='<b>مهلت دانلود تمام شده است</b><span>فایل روتوش‌شده طبق سیاست نگهداری PhotoBridge از سرور حذف شده؛ اطلاعات سفارش برای سابقه شما باقی مانده است.</span>';card.querySelectorAll('.publicAiCompleted button.primary').forEach(x=>{x.disabled=true;x.textContent='فایل از سرور حذف شده'})}
    else if(o.expiresAt){box.className='pb583Expiry';box.innerHTML=`<b>مهلت نگهداری فایل</b><span>حذف خودکار: ${new Date(o.expiresAt).toLocaleString('fa-IR')}</span><strong>زمان باقی‌مانده: ${fmtRemain(o.expiresAt)}</strong><small>قبل از صفرشدن تایمر فایل را دانلود کنید؛ پس از آن فایل واقعاً از فضای سرور حذف می‌شود.</small>`;clearInterval(timerId);timerId=setInterval(()=>{const st=box.querySelector('strong');if(st)st.textContent='زمان باقی‌مانده: '+fmtRemain(o.expiresAt);if(new Date(o.expiresAt).getTime()<=Date.now()){clearInterval(timerId);loadOrder()}},1000)}
    if(!card.querySelector('.pb583AccountLink')){const a=document.createElement('a');a.href='/retouch-account';a.className='pb583AccountLink';a.textContent='مشاهده همه سفارش‌های من';card.appendChild(a)}
  }
  function renderCustomerExpiry(){
    const boxRoot=document.querySelector('.skinRetouchFinalBox');if(!boxRoot)return;let expiresAt=state.activeCustomerExpiry;
    if(!expiresAt){const latest=[...state.customerJobs.values()].find(x=>String(x?.status||'')==='completed'&&(x?.outputExpiresAt||x?.output_expires_at));expiresAt=latest?.outputExpiresAt||latest?.output_expires_at||null;if(latest){state.activeCustomerJobId=String(latest.id||'');state.activeCustomerExpiry=expiresAt}}
    if(!expiresAt)return;const expired=new Date(expiresAt).getTime()<=Date.now();let box=boxRoot.querySelector('.pb583CustomerExpiry');if(!box){box=document.createElement('div');box.className='pb583CustomerExpiry';boxRoot.appendChild(box)}
    if(expired){box.className='pb583CustomerExpiry expired';box.innerHTML='<b>مهلت نگهداری این خروجی تمام شده است</b><span>فایل طبق زمان تعیین‌شده در پنل ادمین از سرور حذف می‌شود/شده است.</span>';document.querySelectorAll('.skinRetouchFlowActions button.primary').forEach(x=>{x.disabled=true;x.textContent='مهلت دانلود تمام شده'})}
    else{box.className='pb583CustomerExpiry';box.innerHTML=`<b>مهلت دانلود و نگهداری فایل</b><span>حذف خودکار: ${new Date(expiresAt).toLocaleString('fa-IR')}</span><strong>زمان باقی‌مانده: ${fmtRemain(expiresAt)}</strong><small>این زمان برای روتوش عکاس و روتوش آزاد از یک تنظیم مشترک ادمین می‌آید. قبل از پایان زمان فایل را دانلود کنید.</small>`;clearInterval(customerTimerId);customerTimerId=setInterval(()=>{const st=box.querySelector('strong');if(st)st.textContent='زمان باقی‌مانده: '+fmtRemain(expiresAt);if(new Date(expiresAt).getTime()<=Date.now()){clearInterval(customerTimerId);renderCustomerExpiry()}},1000)}
  }
  async function adminRetention(){
    const panel=document.querySelector('.storageSettingsPanel');if(!panel||panel.querySelector('.pb583RetouchRetention'))return;let d;try{const r=await originalFetch('/api/admin/storage-settings',{credentials:'same-origin'});if(!r.ok)return;d=await r.json()}catch{return}
    const row=document.createElement('div');row.className='storageRetentionRow pb583RetouchRetention';row.innerHTML=`<label>نگهداری خروجی روتوش<input type="number" min="0" max="365" inputmode="numeric" value="${Number(d.settings?.retouchRetentionDays??3)}"><span>روز</span></label><div><small>این زمان برای روتوش عکاسان و روتوش آزاد یکسان است. پس از پایان زمان، فایل واقعی از Object Storage/سرور حذف می‌شود.</small><b>${d.retouchPending?.count?new Intl.NumberFormat('fa-IR').format(d.retouchPending.count)+' خروجی فعال در چرخه نگهداری':'خروجی موعددار فعالی وجود ندارد'}</b><button type="button" class="primary pb583RetouchSave">ذخیره زمان روتوش</button></div>`;
    const note=panel.querySelector('.storageSettingsNote');(note||panel.querySelector('.modalActions')||panel).before(row);row.querySelector('button').onclick=async()=>{const btn=row.querySelector('button'),days=Math.max(0,Math.min(365,Math.round(Number(row.querySelector('input').value)||0)));btn.disabled=true;try{const r=await originalFetch('/api/admin/storage-settings',{method:'PUT',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({retouchRetentionDays:days})});if(!r.ok)throw 0;alert(`مدت نگهداری خروجی روتوش روی ${new Intl.NumberFormat('fa-IR').format(days)} روز تنظیم شد.`)}catch{alert('ذخیره زمان نگهداری روتوش انجام نشد.')}finally{btn.disabled=false}}
  }
  function enhance(){emailOff();replaceText();faceSummary();renderExpiry();renderCustomerExpiry();adminRetention()}
  const style=document.createElement('style');style.textContent=`.pb583FaceSummary{margin:0 0 14px;padding:12px;border:1px solid #b9d8f8;border-radius:14px;background:#f4f9ff;display:grid;gap:5px}.pb583FaceSummary small{color:#61758b}.pb583FaceImage{position:relative;max-width:360px;margin-top:7px;border-radius:12px;overflow:hidden}.pb583FaceImage img{width:100%;display:block}.pb583FaceImage i{position:absolute;border:2px solid #16a34a;border-radius:5px;box-shadow:0 0 0 1px rgba(255,255,255,.8) inset;pointer-events:none}.pb583Expiry{margin:14px 0;padding:14px;border-radius:14px;background:#edf7ff;border:1px solid #b9d8f8;display:grid;gap:6px}.pb583Expiry strong{color:#b54708}.pb583Expiry.expired{background:#fff2f2;border-color:#f2b8b5}.pb583Expiry.expired b{color:#b42318}.pb583AccountLink{display:inline-flex;margin-top:14px;color:#1358a5;font-weight:800;text-decoration:none}.pb583RetouchRetention{margin-top:14px}.pb583RetouchSave{margin-top:8px}.pb583CustomerExpiry{margin:12px 0 0;padding:12px 14px;border-radius:13px;background:#edf7ff;border:1px solid #b9d8f8;display:grid;gap:5px}.pb583CustomerExpiry strong{color:#b54708}.pb583CustomerExpiry small{color:#61758b}.pb583CustomerExpiry.expired{background:#fff2f2;border-color:#f2b8b5}.pb583CustomerExpiry.expired b{color:#b42318}.publicAiContacts:has([data-pb583-email-disabled]){grid-template-columns:1fr!important}`;document.head.appendChild(style);
  new MutationObserver(()=>enhance()).observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('DOMContentLoaded',()=>{enhance();loadOrder()});setTimeout(()=>{enhance();loadOrder()},300);
})();
