(()=>{
  'use strict';
  const BUILD='904r100f36';
  const ROOT_ID='pbR99LabChooser';
  const SESSION_KEY='photobridge:r99:selected-lab';
  const CACHE_KEY='photobridge:r100f14:lab-chooser';
  let running=false,lastPath='',runEpoch=0,currentData=null,refreshQueued=false;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isPhotographerRoute=()=>/^\/photographer(?:\/|$)/.test(location.pathname)&&!/^\/photographer\/(?:signup|invite|register)(?:\/|$)/.test(location.pathname);
  const isPrintRoute=()=>{if(!isPhotographerRoute())return false;const q=new URLSearchParams(location.search);return q.get('workspace')==='print'||/^\/photographer\/(?:orders|upload|album|archive|finance)(?:\/|$)/.test(location.pathname)};
  async function api(path,opt={}){
    const r=await fetch(path,{credentials:'include',headers:{'Content-Type':'application/json',...(opt.headers||{})},...opt});
    let j={};try{j=await r.json()}catch{}
    if(!r.ok){const e=new Error(j?.error||`HTTP ${r.status}`);e.status=r.status;e.data=j;throw e}return j;
  }
  function style(){
    if(document.getElementById('pbR99LabChooserStyle'))return;
    const s=document.createElement('style');s.id='pbR99LabChooserStyle';s.textContent=`
      #${ROOT_ID}{position:fixed;inset:0;z-index:2147483500;background:linear-gradient(180deg,#e7f3ff 0,#eef7ff 150px,#f7f9fc 360px,#f7f9fc 100%);overflow:auto;-webkit-overflow-scrolling:touch;direction:rtl;font-family:Vazirmatn,Tahoma,Arial,sans-serif;color:#101828}
      #${ROOT_ID} *{box-sizing:border-box}
      .pbR99LabWrap{width:min(840px,100%);margin:0 auto;padding:28px 16px 42px}.pbR99LabIntro{position:relative;overflow:hidden;text-align:center;margin:0 auto 15px;max-width:760px;padding:22px 18px;border:1px solid rgba(49,94,251,.16);border-radius:24px;background:linear-gradient(145deg,#f5faff 0%,#deefff 100%);box-shadow:0 18px 48px rgba(37,99,235,.18)}.pbR99LabIntro:before{content:"";position:absolute;width:180px;height:180px;border-radius:50%;top:-115px;right:-55px;background:rgba(49,94,251,.13)}.pbR99LabIntro:after{content:"";position:absolute;width:130px;height:130px;border-radius:50%;bottom:-88px;left:-35px;background:rgba(22,119,255,.10)}.pbR99LabIntro>*{position:relative;z-index:1}.pbR99LabIntroIcon{width:48px;height:48px;margin:0 auto 10px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,#1677ff,#315efb);box-shadow:0 10px 24px rgba(49,94,251,.28);color:#fff;font-size:24px;font-weight:950}.pbR99LabIntro h1{margin:0 0 7px;font-size:21px;color:#173b6c}.pbR99LabIntro p{margin:0 auto;color:#55708f;font-size:10.5px;line-height:2;max-width:560px}
      .pbR99LabBoard{padding:13px;border:1px solid #cfe3fb;border-radius:22px;background:rgba(232,243,255,.82);box-shadow:0 12px 34px rgba(37,99,235,.10);min-height:54px}.pbR99LabList{display:grid;gap:10px}.pbR99LabCard{background:rgba(255,255,255,.96);border:1px solid #d7e6f7;border-radius:17px;padding:14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;box-shadow:0 4px 14px rgba(30,64,175,.045)}.pbR99LabCard.current{border-color:#78a8f5;background:#f5f9ff;box-shadow:0 0 0 2px rgba(49,94,251,.07)}.pbR99LabInfo{min-width:0}.pbR99LabInfo h3{margin:0 0 4px;font-size:14px}.pbR99LabMeta{color:#667085;font-size:9.5px;line-height:1.8}.pbR99LabBadge{display:inline-flex;margin-top:7px;padding:4px 8px;border-radius:999px;font-size:8.5px;font-weight:900;background:#eef4fb;color:#475467}.pbR99LabBadge.ok{background:#ecfdf3;color:#027a48}.pbR99LabBadge.pending{background:#fff7ed;color:#b54708}.pbR99LabBadge.rejected{background:#fef3f2;color:#b42318}.pbR99LabActions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.pbR99LabBtn{min-height:39px;padding:0 14px;border-radius:11px;border:1px solid #315efb;background:linear-gradient(135deg,#1677ff,#315efb);color:#fff;font:900 9.5px Vazirmatn;cursor:pointer;white-space:nowrap;box-shadow:0 6px 16px rgba(49,94,251,.16)}.pbR99LabBtn.secondary{background:#fff;color:#315efb;border-color:#a8c8f5;box-shadow:none}.pbR99LabBtn:disabled{opacity:.55;cursor:default}.pbR99LabSectionTitle{margin:16px 2px 9px;font-size:11px;color:#475467}.pbR99LabEmpty{padding:25px;text-align:center;background:rgba(255,255,255,.88);border:1px dashed #a9c8ea;border-radius:16px;color:#667085;font-size:10px;line-height:2}.pbR99LabMsg{position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:2147483600;min-width:min(420px,calc(100vw - 28px));padding:11px 14px;border-radius:12px;background:#101828;color:#fff;text-align:center;font-size:9.5px;box-shadow:0 14px 35px rgba(16,24,40,.24)}
      @media(max-width:820px){body.pbR100F14ChoosingLab #root .photographerMain.photographerPrintWorkspace>:not(.photographerBottomAppNav),body.pbR100F14ChoosingLab #root .aiAssistantLauncher{visibility:hidden!important;pointer-events:none!important}body.pbR100F14ChoosingLab #pb762-add,body.pbR100F14ChoosingLab #pb765-add,body.pbR100F14ChoosingLab #pb742-print-actions,body.pbR100F14ChoosingLab #pb737-mobile-print-dock,body.pbR100F14ChoosingLab #pb761-mode-actions{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}#${ROOT_ID}{bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:350}.pbR99LabWrap{padding:14px 12px max(22px,env(safe-area-inset-bottom))}.pbR99LabIntro{padding:18px 13px 16px;border-radius:20px;margin-bottom:12px}.pbR99LabIntroIcon{width:43px;height:43px;border-radius:14px;font-size:21px}.pbR99LabIntro h1{font-size:17px}.pbR99LabIntro p{font-size:9.5px;line-height:1.9}.pbR99LabBoard{padding:9px;border-radius:18px}.pbR99LabCard{grid-template-columns:1fr;padding:12px;border-radius:14px}.pbR99LabActions{justify-content:stretch}.pbR99LabBtn{flex:1;min-height:41px}.pbR99LabSectionTitle{margin-top:13px}.pbR99LabMsg{bottom:calc(88px + env(safe-area-inset-bottom,0px));z-index:510}}
      /* R1329: keep underlying payment and print layers out of the chooser. */
      @media(max-width:820px){
        html body.pbR100F14ChoosingLab #root{visibility:hidden!important;pointer-events:none!important}
        html body.pbR100F14ChoosingLab #root .photographerBottomAppNav,
        html body.pbR100F14ChoosingLab #root .photographerBottomAppNav *{visibility:visible!important;pointer-events:auto!important}
        html body.pbR100F14ChoosingLab :is(.prepayOrderCard,.prepayUploadBox,.prepayUploadRow){visibility:hidden!important;pointer-events:none!important}
      }
    `;document.head.appendChild(s);
  }
  function toast(text){document.querySelector('.pbR99LabMsg')?.remove();const x=document.createElement('div');x.className='pbR99LabMsg';x.textContent=text;document.body.appendChild(x);setTimeout(()=>x.remove(),3200)}
  const loc=x=>[x?.city,x?.province].filter(Boolean).join('، ')||'موقعیت ثبت نشده';
  function card(x,{connected=false,current=false,discover=false}={}){
    const status=String(x.request_status||'');
    let badge=connected?(current?'لابراتوار فعال':'متصل'):(status==='pending'?'درخواست در انتظار تأیید':status==='rejected'?'درخواست قبلی رد شده':'امکان درخواست همکاری');
    let cls=connected?'ok':status==='pending'?'pending':status==='rejected'?'rejected':'';
    const discount=Number(x.collaboration_discount_percent||x.photographer_join_discount_percent||0);
    const discountText=discount>0?` · تخفیف همکاری ${discount.toLocaleString('fa-IR')}٪`:'';
    const action=connected
      ? `<button class="pbR99LabBtn" data-select="${esc(x.id)}">${current?'ورود به لابراتوار':'انتخاب و ورود'}</button>`
      : status==='pending'
        ? `<button class="pbR99LabBtn secondary" disabled>در انتظار تأیید</button>`
        : discover?`<button class="pbR99LabBtn secondary" data-request="${esc(x.id)}">درخواست همکاری</button>`:'';
    return `<article class="pbR99LabCard${current?' current':''}" data-id="${esc(x.id)}"><div class="pbR99LabInfo"><h3>${esc(x.name||'لابراتوار')}</h3><div class="pbR99LabMeta">${esc(loc(x))}${esc(discountText)}</div><span class="pbR99LabBadge ${cls}">${esc(String(x.id)===String(window.__pbR100F5PrimaryLab||'')?'لابراتوار اصلی · '+badge:badge)}</span></div><div class="pbR99LabActions">${action}</div></article>`;
  }
  function ensureRoot(){
    style();
    let root=document.getElementById(ROOT_ID);
    if(!root){
      root=document.createElement('div');root.id=ROOT_ID;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
      root.innerHTML=`<main class="pbR99LabWrap"><section class="pbR99LabIntro"><div class="pbR99LabIntroIcon" aria-hidden="true">▦</div><h1>انتخاب لابراتوار</h1><p>لابراتواری را که می‌خواهی برای چاپ استفاده کنی انتخاب کن. دکمه‌های اصلی پایین صفحه در دسترس می‌مانند.</p></section><section class="pbR99LabBoard"><div class="pbR99LabList"></div></section></main>`;
      document.body.appendChild(root);
      root.addEventListener('click',handleClick);
    }
    document.body.classList.add('pbR100F14ChoosingLab');
    document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';
    document.documentElement.classList.remove('pbR100F14LabChooserBoot');
    document.getElementById('pbAppSplashV780')?.remove();
    return root;
  }
  function cleanup(){
    runEpoch++;
    document.getElementById(ROOT_ID)?.remove();
    document.body.classList.remove('pbR100F14ChoosingLab');
    document.documentElement.classList.remove('pbR100F14LabChooserBoot');
    document.documentElement.style.overflow='';document.body.style.overflow='';
  }
  function paint(data){
    currentData=data;
    const root=ensureRoot();window.__pbR100F5PrimaryLab=String(data.primaryLabId||'');
    const memberships=(Array.isArray(data.memberships)?data.memberships:[]).filter(x=>x&&x.active!==false&&!x.service_only);
    const membershipIds=new Set(memberships.map(x=>String(x.id)));
    const byId=new Map();
    for(const m of memberships)byId.set(String(m.id),{...m,connected:true});
    for(const l of (Array.isArray(data.labs)?data.labs:[])){const id=String(l?.id||'');if(!id)continue;byId.set(id,{...(byId.get(id)||{}),...l,connected:Boolean(l.connected||membershipIds.has(id))})}
    const all=[...byId.values()];const primary=String(data.primaryLabId||'');const byPrimary=(a,b)=>Number(String(b?.id||'')===primary)-Number(String(a?.id||'')===primary);const connected=all.filter(x=>x.connected).sort(byPrimary);const available=all.filter(x=>!x.connected).sort(byPrimary);
    const active=String(data.activeLabId||connected.find(x=>x.selected)?.id||'');
    const board=root.querySelector('.pbR99LabBoard');
    board.innerHTML=`<div class="pbR99LabList">${connected.length?connected.map(x=>card(x,{connected:true,current:String(x.id)===active})).join(''):'<div class="pbR99LabEmpty">هنوز به لابراتواری متصل نیستی.</div>'}</div>${available.length?`<h2 class="pbR99LabSectionTitle">لابراتوارهای قابل درخواست</h2><div class="pbR99LabList">${available.map(x=>card(x,{discover:Boolean(data.canDiscoverLabs)})).join('')}</div>`:''}`;
    try{sessionStorage.setItem(CACHE_KEY,JSON.stringify({data,at:Date.now()}))}catch{}
    return true;
  }
  function paintError(text){const root=ensureRoot();const board=root.querySelector('.pbR99LabBoard');if(board)board.innerHTML=`<div class="pbR99LabEmpty">${esc(text)}</div>`}
  async function handleClick(e){
    const root=document.getElementById(ROOT_ID);if(!root)return;
    const sel=e.target.closest('[data-select]');if(sel){const id=sel.dataset.select;sel.disabled=true;try{try{sessionStorage.setItem('photobridge:r100f37:lab-enter-pending',String(Date.now()))}catch{}document.documentElement.classList.add('pbR100F37LabEnterBoot');await api('/api/customer/labs/'+encodeURIComponent(id)+'/select',{method:'POST',body:'{}'});sessionStorage.setItem(SESSION_KEY,id);cleanup();const u=new URL(location.href);u.searchParams.delete('pbLabChooser');u.searchParams.set('pbEntryDone','lab');location.replace(u.pathname+'?'+u.searchParams.toString())}catch(err){try{sessionStorage.removeItem('photobridge:r100f37:lab-enter-pending')}catch{}document.documentElement.classList.remove('pbR100F37LabEnterBoot');sel.disabled=false;toast(err.status===403?'دسترسی این لابراتوار برای حساب شما فعال نیست.':'انتخاب لابراتوار انجام نشد؛ دوباره تلاش کن.')}return}
    const req=e.target.closest('[data-request]');if(req){const id=req.dataset.request;req.disabled=true;try{await api('/api/customer/labs/'+encodeURIComponent(id)+'/request',{method:'POST',body:'{}'});req.textContent='در انتظار تأیید';toast('درخواست همکاری برای لابراتوار ارسال شد.')}catch(err){req.disabled=false;toast(err.status===409?'قبلاً به این لابراتوار متصل هستی.':'ارسال درخواست همکاری انجام نشد.')}}
  }
  async function run(force=false,refresh=false){
    force=force||new URLSearchParams(location.search).get('pbLabChooser')==='1';
    if(!isPrintRoute()){cleanup();return}
    if(running){if(refresh)refreshQueued=true;return;}
    const path=location.pathname+location.search;if(!force&&!refresh&&path===lastPath&&document.getElementById(ROOT_ID))return;lastPath=path;running=true;
    const epoch=runEpoch;
    if(force&&!refresh){
      ensureRoot();
      try{const c=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');if(c?.data&&epoch===runEpoch&&isPrintRoute())paint(c.data)}catch{}
    }
    try{
      const data=await api('/api/customer/labs');
      if(epoch!==runEpoch||!isPrintRoute())return;
      const real=(data.memberships||[]).filter(x=>x&&x.active!==false&&!x.service_only),available=(data.labs||[]).filter(x=>!x.connected);
      if(!force&&real.length<=1&&available.length===0){cleanup();return}
      const session=String(sessionStorage.getItem(SESSION_KEY)||''),active=String(data.activeLabId||real.find(x=>x.selected)?.id||'');
      if(!force&&session&&session===active&&real.length>0){cleanup();return}
      if(epoch!==runEpoch||!isPrintRoute())return;
      paint(data);
    }catch(e){
      if(epoch!==runEpoch||!isPrintRoute())return;
      if(e.status===401||e.status===403){cleanup();return}
      console.warn('[PhotoBridge R100F20 lab chooser]',e);paintError('دریافت فهرست لابراتوارها انجام نشد. دوباره تلاش کن.');
    }finally{running=false;if(refreshQueued){refreshQueued=false;queueMicrotask(()=>run(false,true))}}
  }
  function onRoute(){
    if(!isPrintRoute()){cleanup();return}
    queueMicrotask(()=>run(false));
  }
  function routeCover(){
    if(document.getElementById('pbR100F18RouteCover'))return;
    const c=document.createElement('div');c.id='pbR100F18RouteCover';
    c.style.cssText='position:fixed;inset:0;z-index:2147483646;background:linear-gradient(180deg,#eef7ff 0%,#f7f9fc 42%,#f8fbff 100%);pointer-events:none';
    document.body.appendChild(c);setTimeout(()=>c.remove(),1800);
  }
  function isPrintPrimaryNav(el){
    if(!el||!isPhotographerRoute()||el.closest?.('.labBottomAppNav,.labBottomAppNavGrid,.labMain'))return false;
    const href=String(el.dataset?.mainHref||el.getAttribute?.('href')||'');
    const text=String(el.textContent||el.getAttribute?.('aria-label')||'').replace(/\s+/g,' ').trim();
    const inPrimary=Boolean(el.closest?.('.photographerHomeModeNav,.photographerBottomAppNavGrid,.photographerBottomAppNav'));
    return inPrimary&&(href.includes('workspace=print')||text==='چاپ');
  }
  document.addEventListener('click',e=>{
    if(!isPhotographerRoute())return;
    const el=e.target?.closest?.('button,a,[data-main-href]');if(!el)return;
    const chooser=document.getElementById(ROOT_ID),primary=Boolean(el.closest?.('.photographerHomeModeNav,.photographerBottomAppNavGrid,.photographerBottomAppNav'));
    /* R100F20: every exit from Print/Lab gets a zero-frame cover. Some bottom-nav buttons navigate through JS and have no href, so href cannot be the gate. */
    if(primary&&!isPrintPrimaryNav(el)&&(chooser||isPrintRoute())){
      routeCover();
      if(chooser)cleanup();
      return;
    }
    if(!isPrintPrimaryNav(el)||chooser)return;
    e.preventDefault();e.stopImmediatePropagation();
    const u=new URL('/photographer/orders/flow',location.origin);u.searchParams.set('workspace','print');u.searchParams.set('pbLabChooser','1');
    location.assign(u.pathname+'?'+u.searchParams.toString());
  },true);
  for(const k of ['pushState','replaceState']){const old=history[k];history[k]=function(...a){const r=old.apply(this,a);queueMicrotask(onRoute);return r}}
  /* R1400: this chooser owns separate DOM/cache from the React lab directory. */
  addEventListener('photobridge-collaboration-review',event=>{
    if(!isPrintRoute()||!document.getElementById(ROOT_ID))return;
    const review=event.detail||{},id=String(review.labId||review.lab_id||'');
    if(!id||!['approved','rejected','cancelled'].includes(review.status))return;
    runEpoch++;if(currentData)paint({...currentData,labs:(currentData.labs||[]).map(lab=>String(lab.id)===id?({...lab,request_status:review.status,connected:review.status==='approved'}):lab)});
    void run(false,true);
  });
  addEventListener('focus',()=>{if(isPrintRoute()&&document.getElementById(ROOT_ID))void run(false,true)});
  setInterval(()=>{if(!document.hidden&&isPrintRoute()&&document.getElementById(ROOT_ID))void run(false,true)},8000);
  addEventListener('popstate',onRoute);addEventListener('pageshow',onRoute);document.addEventListener('DOMContentLoaded',onRoute,{once:true});if(document.readyState!=='loading')onRoute();
})();

