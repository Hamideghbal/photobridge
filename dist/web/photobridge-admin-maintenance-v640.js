(()=>{
  'use strict';
  if(!/^\/admin(?:\/|$)/.test(location.pathname)) return;
  const ID='pbMaintenanceAdminControlV640';
  const API='/api/admin/maintenance';
  const POS='pbMaintenanceAdminControlV640Position';
  const MINI='pbMaintenanceAdminControlV640Minimized';
  let state=null,busy=false,retries=0,retryTimer=0;
  let minimized=true;
  try{const saved=localStorage.getItem(MINI);minimized=saved===null?true:saved==='1'}catch{}
  async function request(method='GET',body){
    const r=await fetch(API,{method,credentials:'include',cache:'no-store',headers:{'content-type':'application/json','x-photobridge-portal':'admin'},...(body?{body:JSON.stringify(body)}:{})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok){const e=new Error(data.error||'request_failed');e.status=r.status;e.data=data;throw e}
    return data;
  }
  function style(){
    if(document.getElementById(ID+'Style'))return;
    const el=document.createElement('style');el.id=ID+'Style';el.textContent=`
      #${ID}{position:fixed;left:14px;bottom:14px;z-index:2147482000;direction:rtl;font-family:Vazirmatn,Vazir,Tahoma,Arial,sans-serif;color:#172033;touch-action:auto}
      #${ID} *{box-sizing:border-box}
      #${ID}.minimized{width:auto!important;max-width:calc(100vw - 28px)!important;background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;backdrop-filter:none!important}
      #${ID} .pbmMini{display:none;align-items:center;gap:8px;min-height:38px;padding:7px 11px;border:1px solid #dfe5ef;border-radius:999px;background:rgba(255,255,255,.97);box-shadow:0 8px 26px rgba(15,23,42,.16);cursor:pointer;user-select:none;white-space:nowrap}
      #${ID}.minimized .pbmMini{display:flex}#${ID}.minimized .pbmCard{display:none}
      #${ID} .pbmMiniDot{width:9px;height:9px;border-radius:50%;background:#067647;box-shadow:0 0 0 4px rgba(6,118,71,.10)}
      #${ID}.active .pbmMiniDot{background:#c2410c;box-shadow:0 0 0 4px rgba(194,65,12,.12)}
      #${ID} .pbmMini b{font-size:10.5px;font-weight:900}#${ID} .pbmMini small{font-size:9px;color:#667085}
      #${ID} .pbmMiniChevron{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#f2f4f7;color:#475467;font-size:11px}
      #${ID} .pbmCard{width:min(410px,calc(100vw - 28px));background:rgba(255,255,255,.985);border:1px solid #dfe5ef;border-radius:18px;box-shadow:0 18px 50px rgba(15,23,42,.2);padding:14px;backdrop-filter:blur(12px)}
      #${ID}.active .pbmCard{border-color:#fed7aa}
      #${ID} .pbmHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;cursor:grab;user-select:none;touch-action:none}#${ID}.dragging .pbmHead{cursor:grabbing}
      #${ID} .pbmTitle{min-width:0}#${ID} .pbmHead b{display:block;font-size:14px;line-height:1.7}#${ID} .pbmHead small{display:block;color:#667085;font-size:10.5px;line-height:1.8;margin-top:2px}
      #${ID} .pbmHeadSide{display:flex;align-items:center;gap:6px;flex:0 0 auto}#${ID} .pbmDrag,#${ID} .pbmMinimize{display:grid;place-items:center;min-width:31px;height:31px;border:1px solid #e4e7ec;border-radius:10px;background:#f8fafc;color:#667085;font-size:15px;font-weight:900;cursor:pointer}
      #${ID} .pbmBadge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:800;white-space:nowrap}#${ID} .pbmBadge:before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 0 4px color-mix(in srgb,currentColor 12%,transparent)}
      #${ID}.active .pbmBadge{background:#fff7ed;color:#c2410c}#${ID}.open .pbmBadge{background:#ecfdf3;color:#067647}
      #${ID} .pbmMsg{font-size:11px;line-height:1.9;color:#475467;background:#f8fafc;border-radius:11px;padding:9px 10px;margin-bottom:10px;border:1px solid #eef2f6}#${ID} .pbmActions{display:flex;gap:8px;align-items:center}#${ID} button,#${ID} a{font-family:inherit}#${ID} button{appearance:none;border:0;border-radius:11px;padding:9px 12px;font-size:11px;font-weight:800;cursor:pointer;transition:.16s ease}#${ID} button:disabled{opacity:.55;cursor:wait}
      #${ID} .pbmToggle{flex:1;color:#fff;background:#315efb}#${ID}.active .pbmToggle{background:#067647}#${ID}.open .pbmToggle{background:#c2410c}#${ID} .pbmRefresh{width:42px;background:#f2f4f7;color:#344054}
      #${ID} .pbmTest{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}#${ID} .pbmTest a{text-decoration:none;text-align:center;border:1px solid #e4e7ec;border-radius:10px;padding:7px 5px;background:#fff;color:#344054;font-size:10px;font-weight:800}#${ID} .pbmCreate{display:flex;gap:10px;flex-wrap:wrap;margin-top:7px}#${ID} .pbmCreate a{color:#315efb;font-size:9.5px;font-weight:800;text-decoration:none}
      #${ID} .pbmFoot{display:block;color:#98a2b3;font-size:9.5px;line-height:1.7;margin-top:8px}
      @media(max-width:700px){#${ID}{left:10px;right:auto;bottom:82px}#${ID} .pbmCard{width:calc(100vw - 20px);padding:12px;border-radius:15px;max-height:calc(100vh - 100px);overflow:auto}#${ID} .pbmHead b{font-size:13px}#${ID} .pbmMini{max-width:calc(100vw - 20px)}}
    `;document.head.appendChild(el);
  }
  function applySavedPosition(root){
    if(minimized){root.style.left='14px';root.style.bottom=innerWidth<=700?'82px':'14px';root.style.top='auto';root.style.right='auto';return}
    try{const p=JSON.parse(localStorage.getItem(POS)||'null');if(!p||!Number.isFinite(p.left)||!Number.isFinite(p.top))return;const card=root.querySelector('.pbmCard');const w=card?.offsetWidth||410,h=card?.offsetHeight||260;root.style.left=Math.max(6,Math.min(innerWidth-w-6,p.left))+'px';root.style.top=Math.max(6,Math.min(innerHeight-h-6,p.top))+'px';root.style.right='auto';root.style.bottom='auto'}catch{}
  }
  function installDrag(root){
    const head=root.querySelector('.pbmHead');if(!head||head.dataset.dragInstalled==='1')return;head.dataset.dragInstalled='1';let drag=null;
    head.addEventListener('pointerdown',e=>{if(minimized||e.button!==0||e.target.closest('button,a,.pbmMinimize'))return;const r=root.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};root.classList.add('dragging');root.style.left=r.left+'px';root.style.top=r.top+'px';root.style.right='auto';root.style.bottom='auto';head.setPointerCapture?.(e.pointerId);e.preventDefault()});
    head.addEventListener('pointermove',e=>{if(!drag)return;const card=root.querySelector('.pbmCard'),w=card?.offsetWidth||410,h=card?.offsetHeight||260;const left=Math.max(6,Math.min(innerWidth-w-6,drag.left+e.clientX-drag.x)),top=Math.max(6,Math.min(innerHeight-h-6,drag.top+e.clientY-drag.y));root.style.left=left+'px';root.style.top=top+'px'});
    const done=e=>{if(!drag)return;drag=null;root.classList.remove('dragging');const r=root.getBoundingClientRect();try{localStorage.setItem(POS,JSON.stringify({left:r.left,top:r.top}))}catch{};try{head.releasePointerCapture?.(e.pointerId)}catch{}};
    head.addEventListener('pointerup',done);head.addEventListener('pointercancel',done);
  }
  function setMinimized(next){minimized=Boolean(next);try{localStorage.setItem(MINI,minimized?'1':'0')}catch{};render();}
  function render(){
    if(!state)return;style();
    let root=document.getElementById(ID);const fresh=!root;if(!root){root=document.createElement('aside');root.id=ID;document.body.appendChild(root)}
    root.className=(state.enabled?'active':'open')+(minimized?' minimized':'');
    root.innerHTML=`<div class="pbmMini" role="button" tabindex="0" aria-label="باز کردن کنترل به‌روزرسانی"><span class="pbmMiniDot"></span><b>${state.enabled?'به‌روزرسانی فعال':'کنترل به‌روزرسانی'}</b><small>${state.enabled?'پنل‌ها قفل‌اند':'پنل‌ها بازند'}</small><span class="pbmMiniChevron">⌃</span></div><div class="pbmCard"><div class="pbmHead" title="برای جابه‌جایی این کادر را بکش"><div class="pbmTitle"><b>حالت به‌روزرسانی پنل‌ها</b><small>صفحه اصلی و بخش‌های عمومی باز می‌مانند؛ فقط پنل عکاس، لابراتوار و فروشگاه تجهیزات متوقف می‌شوند.</small></div><div class="pbmHeadSide"><button class="pbmMinimize" type="button" title="جمع کردن" aria-label="جمع کردن">—</button><span class="pbmDrag" aria-hidden="true">↕</span><span class="pbmBadge">${state.enabled?'فعال':'پنل‌ها بازند'}</span></div></div><div class="pbmMsg">${state.enabled?'پنل‌های عملیاتی قفل هستند. تب‌های باز کاربران نیز ظرف چند ثانیه خودکار به صفحه به‌روزرسانی منتقل می‌شوند.':'دسترسی عکاس، لابراتوار و فروشگاه تجهیزات فعال است؛ صفحه عمومی در هر دو حالت باز می‌ماند.'}</div><div class="pbmActions"><button class="pbmToggle" type="button">${busy?'در حال اعمال…':state.enabled?'باز کردن پنل‌ها':'فعال کردن حالت به‌روزرسانی'}</button><button class="pbmRefresh" type="button" title="به‌روزرسانی وضعیت">↻</button></div><div class="pbmTest"><a href="/photographer?maintenance_preview=1" target="_blank" rel="noopener">تست عکاس</a><a href="/lab?maintenance_preview=1" target="_blank" rel="noopener">تست لابراتوار</a><a href="/rental?maintenance_preview=1" target="_blank" rel="noopener">تست فروشگاه</a></div><div class="pbmCreate"><a href="/trial" target="_blank" rel="noopener">ساخت لابراتوار تست با شماره ادمین</a><a href="/equipment-rental/register" target="_blank" rel="noopener">ساخت فروشگاه تست با شماره ادمین</a></div><small class="pbmFoot">برای تست، همان شماره و رمز حساب ادمین اصلی قابل استفاده است. این کادر را هر زمان لازم داشتی باز کن.</small></div>`;
    const toggle=root.querySelector('.pbmToggle'),refresh=root.querySelector('.pbmRefresh'),mini=root.querySelector('.pbmMini'),minBtn=root.querySelector('.pbmMinimize');
    if(toggle){toggle.disabled=busy;toggle.onclick=toggleMode}if(refresh){refresh.disabled=busy;refresh.onclick=load}
    if(mini){mini.onclick=()=>setMinimized(false);mini.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setMinimized(false)}}}
    if(minBtn)minBtn.onclick=e=>{e.stopPropagation();setMinimized(true)};
    installDrag(root);setTimeout(()=>applySavedPosition(root),fresh?0:1);
  }
  async function load(){try{const d=await request();state=d.settings||{enabled:false};retries=0;render()}catch(e){if(e.status===401||e.status===403){document.getElementById(ID)?.remove();return}if(retries<30){retries++;clearTimeout(retryTimer);retryTimer=setTimeout(load,2000)}}}
  async function toggleMode(){if(!state||busy)return;const next=!state.enabled;const question=next?'حالت به‌روزرسانی فقط برای پنل عکاس، لابراتوار و فروشگاه فعال شود؟ صفحه اصلی عمومی باز می‌ماند.':'پنل‌های عکاس، لابراتوار و فروشگاه دوباره برای کاربران باز شوند؟';if(!confirm(question))return;busy=true;render();try{const d=await request('PUT',{enabled:next});state=d.settings||{...state,enabled:next}}catch(e){alert(e?.data?.error==='maintenance_primary_admin_required'?'این کنترل فقط با حساب ادمین اصلی قابل تغییر است.':'تغییر حالت پنل‌ها انجام نشد. دوباره تلاش کن.')}finally{busy=false;render()}}
  addEventListener('resize',()=>{const root=document.getElementById(ID);if(root)applySavedPosition(root)},{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,250),{once:true});else setTimeout(load,250);
})();
