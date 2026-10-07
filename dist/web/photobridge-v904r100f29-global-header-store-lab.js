/* PhotoBridge R100F29 — shared photographer header/menu/avatar + Store/Lab chooser behavior refinements. */
(()=>{
  'use strict';
  if(window.__PB_R100F29_GLOBAL_HEADER__)return;
  window.__PB_R100F29_GLOBAL_HEADER__=true;

  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let me=null,walletBalance=null,walletLoading=false,scheduled=false;

  const isVisible=el=>!!el&&el.isConnected&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
  function photographerHeaders(){
    return $$('header.unifiedRoleHeader.photographerHeaderRefined, .photographerMain>.unifiedRoleHeader.photographerHeaderRefined, #photographerRoleHeaderV710, #photographerStoreRoleHeader')
      .filter((x,i,a)=>a.indexOf(x)===i);
  }
  function currentHeader(){
    const all=photographerHeaders();
    return all.find(isVisible)||all[0]||null;
  }
  function identityOf(header){return header?.querySelector('.photographerHeaderIdentity,.workspaceIdentity')||null}
  function suppressLegacy(header){
    if(!header)return;
    if(!header.classList.contains('pbR100F29UnifiedHeader'))header.classList.add('pbR100F29UnifiedHeader');
    header.querySelectorAll('.photographerMobileHeaderQuickActions,.mobileHeaderQuickActions,.photographerHeaderTools,.roleHeaderTools').forEach(row=>{
      if(!row.hidden)row.hidden=true;if(row.getAttribute('aria-hidden')!=='true')row.setAttribute('aria-hidden','true');
      row.style.setProperty('display','none','important');row.style.setProperty('visibility','hidden','important');row.style.setProperty('pointer-events','none','important');
    });
  }
  function profileName(){
    const h=currentHeader();
    return String(me?.user?.photographerName||me?.user?.name||h?.querySelector('.workspaceIdentityCopy>h1')?.textContent||'ع').replace(/^عکاسی\s*/,'').trim()||'ع';
  }
  function renderAvatar(data){
    const b=$('#pbR100F25AvatarBtn');if(!b)return;
    const sig=data?`img:${String(data).slice(0,96)}`:`fallback:${profileName().slice(0,1)}`;if(b.dataset.pbF29AvatarSig===sig)return;b.dataset.pbF29AvatarSig=sig;
    if(data)b.innerHTML=`<img src="${esc(data)}" alt="عکس پروفایل عکاس">`;
    else b.innerHTML=`<span class="pbF25AvatarFallback">${esc(profileName().slice(0,1))}</span>`;
  }
  function resizeAvatar(file){
    return new Promise((resolve,reject)=>{
      if(!file||!/^image\/(jpeg|png|webp)$/i.test(file.type||''))return reject(new Error('invalid_image'));
      if(file.size>8*1024*1024)return reject(new Error('too_large'));
      const reader=new FileReader();reader.onerror=()=>reject(new Error('read_failed'));
      reader.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('decode_failed'));img.onload=()=>{
        const side=Math.max(1,Math.min(img.naturalWidth,img.naturalHeight)),sx=Math.max(0,(img.naturalWidth-side)/2),sy=Math.max(0,(img.naturalHeight-side)/2);
        const c=document.createElement('canvas');c.width=192;c.height=192;const x=c.getContext('2d',{alpha:false});x.fillStyle='#fff';x.fillRect(0,0,192,192);x.drawImage(img,sx,sy,side,side,0,0,192,192);resolve(c.toDataURL('image/jpeg',.84));
      };img.src=String(reader.result||'')};reader.readAsDataURL(file);
    });
  }
  async function saveAvatar(data){
    const r=await fetch('/api/photographer/profile/avatar',{method:'PUT',credentials:'include',headers:{'content-type':'application/json','x-photobridge-portal':'photographer'},body:JSON.stringify({imageData:data})});
    const out=await r.json().catch(()=>({}));if(!r.ok)throw new Error(out.error||'avatar_save_failed');return out;
  }
  function ensureAvatarInput(){
    let input=$('#pbR100F25AvatarInput');if(input)return input;
    input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;input.id='pbR100F25AvatarInput';document.body.appendChild(input);
    input.addEventListener('change',async()=>{const file=input.files?.[0];input.value='';if(!file)return;const avatar=$('#pbR100F25AvatarBtn');if(avatar)avatar.disabled=true;try{const data=await resizeAvatar(file);renderAvatar(data);await saveAvatar(data);if(me?.user)me.user.photographerAvatarData=data}catch(e){alert(e.message==='too_large'?'حجم عکس زیاد است.':'ذخیره عکس پروفایل انجام نشد.')}finally{if(avatar)avatar.disabled=false}});
    return input;
  }
  function ensureAvatar(header){
    const identity=identityOf(header);if(!identity)return null;
    let avatar=$('#pbR100F25AvatarBtn');
    if(!avatar){avatar=document.createElement('button');avatar.id='pbR100F25AvatarBtn';avatar.type='button';avatar.title='انتخاب عکس پروفایل';avatar.setAttribute('aria-label','انتخاب عکس پروفایل');avatar.addEventListener('click',()=>ensureAvatarInput().click())}
    if(avatar.parentElement!==identity)identity.prepend(avatar);
    renderAvatar(me?.user?.photographerAvatarData||'');
    return avatar;
  }
  function closeMenu(){const p=$('#pbR100F25MenuPanel'),b=$('#pbR100F25MenuBtn');p?.classList.remove('open');b?.setAttribute('aria-expanded','false')}
  function toggleMenu(){const p=$('#pbR100F25MenuPanel'),b=$('#pbR100F25MenuBtn');if(!p||!b)return;const open=!p.classList.contains('open');p.classList.toggle('open',open);b.setAttribute('aria-expanded',open?'true':'false');if(open)void refreshWallet()}
  function oldAction(action,header=currentHeader()){
    const map={notifications:'.mobileNotificationBell',wallet:'.mobileHeaderWallet',settings:'.mobileHeaderSettings',invite:'.mobileHeaderInvite',install:'.mobileHeaderInstall',logout:'.mobileHeaderPower'};
    const storeFallback={notifications:'#storeNotificationBtn',wallet:'#storeWalletBtn',settings:'#storeSettingsBtn',invite:'#storeInviteBtn',install:'#storeInstallBtn',logout:'#storeLogoutBtn'};
    return (header&&header.querySelector(map[action]))||$(storeFallback[action]||'')||$(map[action]||'');
  }
  function triggerAction(action){const el=oldAction(action);if(el){el.click();return true}return false}
  function ensureMenuPanel(){
    let p=$('#pbR100F25MenuPanel');if(!p){p=document.createElement('div');p.id='pbR100F25MenuPanel';p.setAttribute('role','menu');document.body.appendChild(p)}
    if(p.dataset.pbR100F29!=='1'){
      p.dataset.pbR100F29='1';
      const items=[
        ['notifications','اعلان‌ها','پیام‌ها و وضعیت‌ها','🔔',''],
        ['wallet','اعتبار خدمات','معادل پولی: در حال دریافت…','◫',''],
        ['settings','تنظیمات عکاسی','پروفایل و موقعیت','⚙',''],
        ['invite','دعوت همکار','مدیریت دعوت‌ها','＋',''],
        ['install','نصب برنامه','نسخه موبایل PhotoBridge','↧',''],
        ['logout','خروج از حساب','','⏻','danger']
      ];
      p.innerHTML=items.map(([a,t,s,i,c])=>`<button type="button" role="menuitem" data-pbf29-action="${a}" class="${c}"><span class="pbF25MenuIcon">${i}</span><span class="pbF25MenuText"><b>${t}</b>${s?`<small>${s}</small>`:''}</span></button>`).join('');
      p.addEventListener('click',e=>{const b=e.target.closest('[data-pbf29-action]');if(!b)return;const action=b.dataset.pbf29Action;closeMenu();triggerAction(action)});
    }
    return p;
  }
  function ensureMenu(header){
    let btn=$('#pbR100F25MenuBtn');
    if(!btn){btn=document.createElement('button');btn.id='pbR100F25MenuBtn';btn.type='button';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','pbR100F25MenuPanel');btn.setAttribute('aria-label','منو');btn.title='منو';btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg><i id="pbR100F25MenuBadge" class="pbF25MenuBadge" hidden></i>';btn.addEventListener('click',e=>{e.stopPropagation();toggleMenu()})}
    else{
      btn.querySelectorAll(':scope>span').forEach(x=>x.remove());btn.setAttribute('aria-label','منو');btn.title='منو';
      if(!btn.querySelector('svg'))btn.insertAdjacentHTML('afterbegin','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg>');
    }
    if(btn.parentElement!==header)header.appendChild(btn);ensureMenuPanel();return btn;
  }
  function syncBadge(){
    const dst=$('#pbR100F25MenuBadge');if(!dst)return;
    const src=oldAction('notifications');const n=src?.querySelector('[class*="badge"],i,em,strong');const txt=String(n?.textContent||src?.getAttribute('data-count')||'').trim(),hide=!txt;
    if(dst.hidden!==hide)dst.hidden=hide;if(!hide&&dst.textContent!==txt)dst.textContent=txt;
  }
  async function refreshWallet(){
    if(walletLoading)return;walletLoading=true;const small=$('#pbR100F25MenuPanel [data-pbf29-action="wallet"] small');if(small&&walletBalance==null)small.textContent='معادل پولی: در حال دریافت…';
    try{const r=await fetch('/api/customer/services-wallet',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}});if(r.ok){const d=await r.json();walletBalance=Math.max(0,Number(d?.balance||0));if(small)small.textContent=`اعتبار ${new Intl.NumberFormat('fa-IR').format(walletBalance)} · معادل پولی ${new Intl.NumberFormat('fa-IR').format(walletBalance)} تومان`}}catch{}finally{walletLoading=false}
  }
  function syncHeader(){
    const headers=photographerHeaders();headers.forEach(suppressLegacy);const h=currentHeader();if(!h)return false;ensureAvatar(h);ensureMenu(h);syncBadge();return true;
  }

  function syncChangeStore(){
    const btn=$('[data-change-store-r96]');if(!btn)return;
    const cards=$$('#storeChooserListR96 .pbR96StoreCard');
    if(cards.length){const hide=cards.length<=1;if(btn.hidden!==hide)btn.hidden=hide;const a=hide?'true':'false';if(btn.getAttribute('aria-hidden')!==a)btn.setAttribute('aria-hidden',a)}
  }
  function clearStoreInternalSelection(){
    const home=$('#storePanel');if(!home?.classList.contains('mobileActive'))return;
    $$('#storeSectionNavV673 [data-store-panel]').forEach(b=>{if(b.classList.contains('active'))b.classList.remove('active');if(b.getAttribute('aria-selected')!=='false')b.setAttribute('aria-selected','false');if(b.hasAttribute('aria-current'))b.removeAttribute('aria-current')});
    const nav=$('#storeSectionNavV673');if(nav&&('pb706Active' in nav.dataset))delete nav.dataset.pb706Active;
  }
  function storeRefinements(){syncChangeStore();clearStoreInternalSelection()}

  function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;syncHeader();storeRefinements()})}
  async function loadMe(){try{const r=await fetch('/api/auth/me',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}});if(r.ok){me=await r.json();renderAvatar(me?.user?.photographerAvatarData||'')}}catch{}}
  function init(){
    syncHeader();storeRefinements();void loadMe().then(()=>syncHeader());
    const mo=new MutationObserver(queue);mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','aria-current','aria-selected']});
    document.addEventListener('click',e=>{
      if(!e.target.closest('#pbR100F25MenuPanel,#pbR100F25MenuBtn'))closeMenu();
      if(e.target.closest('[data-store-home]'))requestAnimationFrame(()=>requestAnimationFrame(clearStoreInternalSelection));
    },true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
    addEventListener('pageshow',queue,{passive:true});addEventListener('popstate',queue,{passive:true});
    setInterval(()=>{syncBadge();syncChangeStore()},3000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
