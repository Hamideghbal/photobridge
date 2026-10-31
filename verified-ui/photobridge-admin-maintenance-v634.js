(()=>{
  'use strict';
  if(!/^\/admin(?:\/|$)/.test(location.pathname)) return;
  const ID='pbMaintenanceAdminControlV634';
  const API='/api/admin/maintenance';
  let state=null,busy=false,retries=0,retryTimer=0;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function request(method='GET',body){
    const r=await fetch(API,{method,credentials:'include',cache:'no-store',headers:{'content-type':'application/json','x-photobridge-portal':'admin'},...(body?{body:JSON.stringify(body)}:{})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok){const e=new Error(data.error||'request_failed');e.status=r.status;e.data=data;throw e}
    return data;
  }
  function style(){
    if(document.getElementById(ID+'Style'))return;
    const el=document.createElement('style');el.id=ID+'Style';el.textContent=`
      #${ID}{position:fixed;left:18px;bottom:18px;z-index:2147482000;width:min(390px,calc(100vw - 36px));direction:rtl;font-family:Vazirmatn,Tahoma,Arial,sans-serif;background:rgba(255,255,255,.98);border:1px solid #dfe5ef;border-radius:18px;box-shadow:0 18px 50px rgba(15,23,42,.2);padding:14px;color:#172033;backdrop-filter:blur(12px)}
      #${ID} .pbmHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}#${ID} .pbmHead b{display:block;font-size:14px;line-height:1.7}#${ID} .pbmHead small{display:block;color:#667085;font-size:10.5px;line-height:1.8;margin-top:2px}
      #${ID} .pbmBadge{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:800}#${ID} .pbmBadge:before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 0 4px color-mix(in srgb,currentColor 12%,transparent)}
      #${ID}.active{border-color:#fed7aa}#${ID}.active .pbmBadge{background:#fff7ed;color:#c2410c}#${ID}.open .pbmBadge{background:#ecfdf3;color:#067647}
      #${ID} .pbmMsg{font-size:11px;line-height:1.9;color:#475467;background:#f8fafc;border-radius:11px;padding:9px 10px;margin-bottom:10px;border:1px solid #eef2f6}#${ID} .pbmActions{display:flex;gap:8px;align-items:center}#${ID} button{appearance:none;border:0;border-radius:11px;padding:9px 12px;font:inherit;font-size:11px;font-weight:800;cursor:pointer;transition:.16s ease}#${ID} button:disabled{opacity:.55;cursor:wait}
      #${ID} .pbmToggle{flex:1;color:#fff;background:#315efb}#${ID}.active .pbmToggle{background:#067647}#${ID}.open .pbmToggle{background:#c2410c}#${ID} .pbmRefresh{width:42px;background:#f2f4f7;color:#344054}#${ID} .pbmFoot{display:block;color:#98a2b3;font-size:9.5px;line-height:1.7;margin-top:8px}
      @media(max-width:700px){#${ID}{left:10px;right:10px;bottom:82px;width:auto;padding:12px;border-radius:15px}#${ID} .pbmHead b{font-size:13px}}
    `;document.head.appendChild(el);
  }
  function render(){
    if(!state)return;
    style();
    let root=document.getElementById(ID);
    if(!root){root=document.createElement('aside');root.id=ID;document.body.appendChild(root)}
    root.className=state.enabled?'active':'open';
    root.innerHTML=`<div class="pbmHead"><div><b>حالت به‌روزرسانی کل سایت</b><small>فقط مرورگر ادمین اصلی از محدودیت عبور می‌کند.</small></div><span class="pbmBadge">${state.enabled?'فعال':'سایت باز است'}</span></div><div class="pbmMsg">${state.enabled?'کاربران عادی اکنون فقط صفحه «در حال به‌روزرسانی» را می‌بینند.':'دسترسی کاربران به سایت فعال است.'}</div><div class="pbmActions"><button class="pbmToggle" type="button">${busy?'در حال اعمال…':state.enabled?'باز کردن سایت برای کاربران':'فعال کردن حالت به‌روزرسانی'}</button><button class="pbmRefresh" type="button" title="به‌روزرسانی وضعیت">↻</button></div><small class="pbmFoot">این کنترل فقط برای ادمین اصلی PhotoBridge نمایش داده می‌شود.</small>`;
    const toggle=root.querySelector('.pbmToggle'),refresh=root.querySelector('.pbmRefresh');
    toggle.disabled=busy;refresh.disabled=busy;
    toggle.onclick=toggleMode;refresh.onclick=load;
  }
  async function load(){
    try{const d=await request();state=d.settings||{enabled:false};retries=0;render()}
    catch(e){
      if(e.status===401||e.status===403){document.getElementById(ID)?.remove();return}
      if(retries<30){retries++;clearTimeout(retryTimer);retryTimer=setTimeout(load,2000)}
    }
  }
  async function toggleMode(){
    if(!state||busy)return;
    const next=!state.enabled;
    const question=next?'حالت به‌روزرسانی برای کل سایت فعال شود؟ کاربران عادی بلافاصله مسدود می‌شوند.':'سایت برای همه کاربران باز شود؟ فقط وقتی تست‌ها کامل شده‌اند این کار را انجام بده.';
    if(!confirm(question))return;
    busy=true;render();
    try{const d=await request('PUT',{enabled:next});state=d.settings||{...state,enabled:next}}
    catch(e){alert(e?.data?.error==='maintenance_primary_admin_required'?'این کنترل فقط با حساب ادمین اصلی قابل تغییر است.':'تغییر حالت سایت انجام نشد. دوباره تلاش کن.')}
    finally{busy=false;render()}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,250),{once:true});else setTimeout(load,250);
})();
