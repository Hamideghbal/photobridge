/* PhotoBridge R100F33 — one shared photographer header for every mobile section.
   This is now the single owner of the photographer top chrome. Native/legacy headers
   stay in the DOM only as action/state sources and are never rendered visually. */
(()=>{
  'use strict';
  if(window.PBSharedPhotographerHeader?.version==='R100F33') return;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const MOBILE='(max-width:820px)';
  let me=null, avatarData='', walletBalance=null, walletLoading=false, renderQueued=false, timer=null, sourceMap=new Map(), sourceSeq=0;

  const STYLE=`
  @media(max-width:820px){
    :root{--pb-shared-account-h:92px;--pb-shared-title-h:61px;--pb-shared-tabs-h:61px;--pb-shared-subheader-h:122px;--pb-shared-top-h:214px}
    body.pbSharedPhotographerHeaderActive{--pb-role-header-h:var(--pb-shared-top-h)!important;--pb-store-role-header-h:var(--pb-shared-top-h)!important}

    /* Native headers/context bars remain mounted only as state/action sources. */
    body.pbSharedPhotographerHeaderActive #photographerRoleHeaderV710,
    body.pbSharedPhotographerHeaderActive #photographerStoreRoleHeader,
    body.pbSharedPhotographerHeaderActive #photographerStoreIdentityBar,
    body.pbSharedPhotographerHeaderActive #storeSectionNavV673,
    body.pbSharedPhotographerHeaderActive #pb711PhotographerContextBar,
    body.pbSharedPhotographerHeaderActive #pb698PhotographerContextBar,
    body.pbSharedPhotographerHeaderActive #pb697PhotographerContextBar,
    body.pbSharedPhotographerHeaderActive #pb696PhotographerContextBar,
    body.pbSharedPhotographerHeaderActive #pb695PhotographerContextBar,
    body.pbSharedPhotographerHeaderActive #pb698PrintBarActions,
    body.pbSharedPhotographerHeaderActive #pb697PrintBarActions,
    body.pbSharedPhotographerHeaderActive #pb696PrintBarActions,
    body.pbSharedPhotographerHeaderActive #pb695PrintBarActions,
    body.pbSharedPhotographerHeaderActive .photographerMain>.unifiedRoleHeader.photographerHeaderRefined,
    body.pbSharedPhotographerHeaderActive .photographerMain>.photographerPrintModeHeader,
    body.pbSharedPhotographerHeaderActive .photographerMain .photographerHeaderRefined.photographerPrintModeHeader{
      display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;overflow:hidden!important
    }

    #pbSharedPhotographerHeader{position:fixed;inset:0 0 auto 0;z-index:2147481500;width:100%;height:auto;background:#fff;direction:rtl;font-family:Vazirmatn,Tahoma,Arial,sans-serif;box-shadow:none;isolation:isolate}
    #pbSharedPhotographerSubheader{position:fixed;left:0;right:0;top:var(--pb-shared-account-h);z-index:2147481499;width:100%;height:auto;background:#fff;direction:rtl;font-family:Vazirmatn,Tahoma,Arial,sans-serif;box-shadow:none;isolation:isolate}
    #pbSharedPhotographerSubheader *{box-sizing:border-box}
    #pbSharedPhotographerHeader *{box-sizing:border-box}
    #pbSharedPhotographerHeader .pbSharedAccountRow{position:relative;height:var(--pb-shared-account-h);min-height:var(--pb-shared-account-h);display:block;padding:8px 82px;background:#fff;border-bottom:0;color:#101828;overflow:visible}
    #pbSharedPhotographerHeader .pbSharedAvatar{position:absolute;right:14px;top:18px;width:56px;height:56px;min-width:56px;min-height:56px;border:1px solid #dce3ee;border-radius:16px;background:#f8fafc;display:grid;place-items:center;padding:0;overflow:visible;box-shadow:0 2px 7px rgba(15,23,42,.06);cursor:pointer;color:#315efb;font:950 20px/1 Vazirmatn}
    #pbSharedPhotographerHeader .pbSharedAvatar img{width:100%;height:100%;display:block;object-fit:cover;border-radius:15px}
    #pbSharedPhotographerHeader .pbSharedAvatar::after{content:'+';position:absolute;left:-4px;bottom:-4px;width:20px;height:20px;border-radius:7px;background:#315efb;color:#fff;border:2px solid #fff;display:grid;place-items:center;font:950 14px/1 Arial;box-shadow:0 2px 7px rgba(49,94,251,.28)}
    #pbSharedPhotographerHeader .pbSharedIdentity{width:100%;height:76px;min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto auto;column-gap:8px;row-gap:2px;align-items:center;text-align:right;overflow:visible}
    #pbSharedPhotographerHeader .pbSharedIdentity h1{grid-column:1/-1;margin:0;min-width:0;color:#101828;font:950 15px/1.32 Vazirmatn,Tahoma,sans-serif;white-space:normal;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
    #pbSharedPhotographerHeader .pbSharedIdentity .pbSharedRole{grid-column:1;grid-row:2;margin:0;color:#667085;font:750 9px/1.3 Vazirmatn;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #pbSharedPhotographerHeader .pbSharedIdentity .pbSharedDate{grid-column:2;grid-row:2;color:#667085;font:800 8.8px/1.3 Vazirmatn;white-space:nowrap}
    #pbSharedPhotographerHeader .pbSharedIdentity .pbSharedTime{grid-column:2;grid-row:3;color:#344054;font:900 8.6px/1.25 Vazirmatn;white-space:nowrap}
    #pbSharedPhotographerHeader .pbSharedMenuButton{position:absolute;left:14px;right:auto;top:19px;width:54px;height:54px;min-width:54px;min-height:54px;border:1px solid #dce3ee;border-radius:15px;background:#fff;color:#344054;display:grid;place-items:center;padding:0;box-shadow:0 2px 7px rgba(15,23,42,.05);cursor:pointer}
    #pbSharedPhotographerHeader .pbSharedMenuButton svg{width:27px;height:27px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round}
    #pbSharedPhotographerHeader .pbSharedMenuButton:active{transform:scale(.96)}
    #pbSharedPhotographerHeader .pbSharedMenuBadge{position:absolute;min-width:18px;height:18px;padding:0 4px;display:grid;place-items:center;border-radius:999px;background:#ef4444;color:#fff;border:2px solid #fff;font:900 8px/1 Vazirmatn;transform:translate(-20px,-20px)}

    #pbSharedPhotographerSubheader .pbSharedContextTitle{height:var(--pb-shared-title-h);min-height:var(--pb-shared-title-h);display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 18px;background:#fff;border-top:1px solid #f1f4f8;border-bottom:1px solid #e8edf4;text-align:center;color:#101828}
    #pbSharedPhotographerSubheader .pbSharedContextTitle b{min-width:0;max-width:86vw;font:950 15px/1.35 Vazirmatn;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #pbSharedPhotographerSubheader .pbSharedContextMeta{display:inline-flex;align-items:center;justify-content:center;min-height:25px;padding:0 9px;border:1px solid #d7deea;border-radius:999px;background:#fff;color:#667085;font:850 8.5px/1 Vazirmatn;white-space:nowrap}

    #pbSharedPhotographerSubheader .pbSharedTabs{height:var(--pb-shared-tabs-h);min-height:var(--pb-shared-tabs-h);display:grid;grid-template-columns:repeat(var(--pb-shared-tab-count,4),minmax(0,1fr));align-items:center;gap:6px;padding:8px 14px;background:#eef7ff;border-bottom:1px solid #e1e9f3;overflow:hidden}
    #pbSharedPhotographerSubheader .pbSharedTabs[hidden]{display:grid!important;visibility:hidden!important;pointer-events:none!important}
    #pbSharedPhotographerSubheader .pbSharedTabs button{height:43px;min-height:43px;min-width:0;padding:0 6px;border:1px solid #d7deea;border-radius:11px;background:#fff;color:#667085;box-shadow:none;display:flex;align-items:center;justify-content:center;gap:5px;font:950 12.7px/1.2 Vazirmatn,Tahoma,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;transition:background .16s ease,color .16s ease,border-color .16s ease,transform .13s ease}
    #pbSharedPhotographerSubheader .pbSharedTabs button.active{background:#1677ff;color:#fff;border-color:#1677ff;box-shadow:0 5px 14px rgba(22,119,255,.18)}
    #pbSharedPhotographerSubheader .pbSharedTabs button:active{transform:scale(.97)}
    #pbSharedPhotographerSubheader .pbSharedTabs button svg{width:18px;height:18px;stroke:currentColor;fill:none}

    #pbSharedPhotographerMenu{position:fixed;z-index:2147481600;top:78px;left:10px;right:auto;width:min(310px,calc(100vw - 20px));padding:9px;border:1px solid #dce3ee;border-radius:18px;background:rgba(255,255,255,.98);box-shadow:0 18px 50px rgba(15,23,42,.20);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);direction:rtl;font-family:Vazirmatn,Tahoma,Arial,sans-serif;opacity:0;transform:translateY(-8px) scale(.98);pointer-events:none;transition:opacity .18s ease,transform .18s ease}
    #pbSharedPhotographerMenu.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
    #pbSharedPhotographerMenu button{width:100%;min-height:52px;margin:0 0 5px;padding:9px 11px;border:0;border-radius:12px;background:#fff;color:#344054;display:grid;grid-template-columns:36px minmax(0,1fr);gap:9px;align-items:center;text-align:right;font-family:inherit;cursor:pointer}
    #pbSharedPhotographerMenu button:last-child{margin-bottom:0}
    #pbSharedPhotographerMenu button:hover,#pbSharedPhotographerMenu button:active{background:#f4f7fb}
    #pbSharedPhotographerMenu button.danger{color:#b42318}
    #pbSharedPhotographerMenu .pbSharedMenuIcon{width:34px;height:34px;border-radius:10px;background:#f3f6fb;display:grid;place-items:center;font-size:16px}
    #pbSharedPhotographerMenu .pbSharedMenuText{min-width:0;display:grid;gap:2px}
    #pbSharedPhotographerMenu .pbSharedMenuText b{font:900 12.8px/1.3 Vazirmatn}
    #pbSharedPhotographerMenu .pbSharedMenuText small{font:750 9.4px/1.45 Vazirmatn;color:#667085;white-space:normal}

    /* The shared header owns the top space. */
    body.pbSharedPhotographerHeaderActive .photographerMain{padding-top:var(--pb-shared-top-h)!important;box-sizing:border-box!important}
    body.pbSharedPhotographerHeaderActive .photographerMain>.photographerRolePageScrollArea{padding-top:12px!important;scroll-padding-top:12px!important}
    body.pbSharedPhotographerHeaderActive #storePhotographerWorkspace>.shell{top:var(--pb-shared-top-h)!important;padding-top:12px!important;box-sizing:border-box!important}
    body.pbSharedPhotographerHeaderActive #storePhotographerWorkspace>.shell::-webkit-scrollbar,
    body.pbSharedPhotographerHeaderActive .photographerMain>.photographerRolePageScrollArea::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}
    body.pbSharedPhotographerHeaderActive #storePhotographerWorkspace>.shell,
    body.pbSharedPhotographerHeaderActive .photographerMain>.photographerRolePageScrollArea{scrollbar-width:none!important;-ms-overflow-style:none!important}

    /* Native top controls that are mirrored into the shared tabs. */
    body.pbSharedPhotographerHeaderActive .photographerAiSectionNav{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important}
    body.pbSharedPhotographerHeaderActive .clientGalleryListHead>button.primary{display:none!important}
    body.pbSharedPhotographerHeaderActive .photographerAlbumDesignCatalog .albumDesignModelViewToolbar{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important}
  }
  @media(max-width:390px){
    #pbSharedPhotographerHeader .pbSharedAccountRow{padding:8px 72px}
    #pbSharedPhotographerHeader .pbSharedAvatar{right:10px;top:20px;width:52px;height:52px;min-width:52px;min-height:52px}
    #pbSharedPhotographerHeader .pbSharedMenuButton{left:10px;right:auto;top:21px;width:50px;height:50px;min-width:50px;min-height:50px}
    #pbSharedPhotographerHeader .pbSharedIdentity h1{font-size:13.8px}
    #pbSharedPhotographerSubheader .pbSharedTabs{padding-inline:9px;gap:5px}
    #pbSharedPhotographerSubheader .pbSharedTabs button{font-size:12px;padding-inline:3px}
  }`;

  function ensureStyle(){
    let s=$('#pbSharedPhotographerHeaderStyle');
    if(!s){s=document.createElement('style');s.id='pbSharedPhotographerHeaderStyle';document.head.appendChild(s)}
    if(s.textContent!==STYLE)s.textContent=STYLE;
  }
  function isVisible(el){if(!el||!el.isConnected)return false;const cs=getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)!==0}
  function isPhotographerPortal(){return !!($('#storePhotographerWorkspace')||$('.photographerMain')||document.body.classList.contains('pbAuthenticatedPhotographerPortal'))}
  function mode(){
    if($('#storePhotographerWorkspace')&&isVisible($('#storePhotographerWorkspace')))return 'store';
    const main=$('.photographerMain');
    if(main?.classList.contains('photographerPrintWorkspace'))return 'print';
    const p=location.pathname.replace(/\/+$/,'')||'/';
    if(/^\/photographer\/ai(?:\/|$)/.test(p))return 'ai';
    if(p==='/photographer/gallery')return 'gallery';
    if(/^\/photographer\/album-design(?:\/|$)/.test(p))return new URLSearchParams(location.search).get('pb_mode')==='instagram'?'instagram':'album';
    if(/^\/photographer\/store(?:\/|$)/.test(p)||/^\/equipment-rental\/book/.test(p))return 'store';
    const active=$('.photographerBottomAppNav button.active,.pbHomeMobileAccountBar a.active');
    const t=String(active?.textContent||'').trim();
    if(/اینستاگرام/.test(t))return 'instagram';if(/طراحی آلبوم/.test(t))return 'album';if(/گالری/.test(t))return 'gallery';if(/هوش/.test(t))return 'ai';if(/فروشگاه/.test(t))return 'store';if(/چاپ/.test(t))return 'print';
    return 'home';
  }
  function nativeHeader(){return $('#photographerRoleHeaderV710')||$('#photographerStoreRoleHeader')||$('.photographerMain>.unifiedRoleHeader.photographerHeaderRefined')}
  function studioName(){
    const h=nativeHeader();
    const fromApi=String(me?.user?.photographerName||me?.user?.studioName||me?.user?.studio_name||'').trim();
    const fromHeader=String(h?.querySelector('.workspaceIdentityCopy>h1')?.textContent||'').trim();
    return fromApi||fromHeader||String(me?.user?.name||'عکاسی').trim()||'عکاسی';
  }
  function managerName(){
    const n=String(me?.user?.name||'').trim();
    if(n&&n!==studioName())return `مدیریت ${n}`;
    return 'مدیریت عکاسی';
  }
  function persianDate(){
    try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'short',year:'numeric',month:'long',day:'numeric'}).format(new Date())}catch{return ''}
  }
  function persianTime(){try{return new Intl.DateTimeFormat('fa-IR',{hour:'2-digit',minute:'2-digit'}).format(new Date())}catch{return ''}}
  function shopName(){return String($('#photographerStoreHeaderName')?.textContent||'').trim()||'فروشگاه تجهیزات'}
  function labName(){
    const choices=['.photographerPrintTopLabStatic','.photographerLockedLabIdentity b','.photographerSelectedLabNameButton b','.photographerMobileSingleLab span','.photographerPrintTopLabSelect .customSelectValue','.photographerPrintTopLabSelect button'];
    for(const s of choices){const v=String($(s)?.textContent||'').replace(/\s+/g,' ').trim();if(v&&v!=='لابراتوار')return v}
    return 'لابراتوار';
  }
  function modelCount(){const b=$('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar>b');if(b?.textContent?.trim())return b.textContent.trim();const n=$$('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard').length;return n?`${fa(n)} مدل`:''}
  function galleryCount(){const n=$$('.clientGalleryCards>.clientGalleryCard').length;return n?`${fa(n)} پروژه`:''}
  function contextInfo(m){
    if(m==='store')return{title:`فروشگاه تجهیزات تصویربرداری ${shopName()}`,meta:''};
    if(m==='print')return{title:labName(),meta:'لابراتوار'};
    if(m==='instagram')return{title:'طراحی اینستاگرام',meta:modelCount()};
    if(m==='album')return{title:'طراحی آلبوم',meta:modelCount()};
    if(m==='ai')return{title:'هوش مصنوعی',meta:''};
    if(m==='gallery')return{title:'گالری مشتریان',meta:galleryCount()};
    return{title:'PhotoBridge',meta:''};
  }
  function sourceButton(node,label,activeOverride){
    if(!node)return null;
    const id=`s${++sourceSeq}`;sourceMap.set(id,node);
    return{id,label:label||String(node.textContent||'').replace(/\s+/g,' ').trim(),active:activeOverride??node.classList.contains('active')};
  }
  function gridButtons(){
    const t=$('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar');
    const a=t?$$('.albumDesignMobileGridToggle button',t):[];
    return a.length>=2?a:$$('.photographerAlbumDesignCatalog .albumDesignMobilePicker .albumDesignMobileGridToggle button').slice(0,2);
  }
  function actionSources(m){
    sourceMap=new Map();sourceSeq=0;const out=[];
    if(m==='store'){
      $$('#storeSectionNavV673>button').slice(0,4).forEach(b=>out.push(sourceButton(b,String(b.textContent||'').trim())));
    }else if(m==='print'){
      const photo=$('.photographerPrintModeNav .photographerPrintPhotoTab');
      const album=$('.photographerPrintModeNav .photographerPrintAlbumTab');
      const finance=$('.photographerPrintCommonAction.finance');
      if(photo)out.push(sourceButton(photo,'چاپ عکس'));
      if(album)out.push(sourceButton(album,'صحافی آلبوم'));
      if(finance)out.push(sourceButton(finance,'مالی و فاکتور'));
    }else if(m==='ai'){
      const a=$$('.photographerAiSectionNav>button').slice(0,2);
      if(a[0])out.push(sourceButton(a[0],'روتوش صورت AI'));
      if(a[1])out.push(sourceButton(a[1],'سایر ابزارهای AI'));
    }else if(m==='gallery'){
      const n=$('.clientGalleryListHead>button.primary,.clientGalleryEmpty>button.primary');
      if(n)out.push(sourceButton(n,'＋ گالری جدید',false));
    }else if(m==='album'||m==='instagram'){
      const filter=$('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter,.photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton');
      if(filter)out.push(sourceButton(filter,'فیلتر',filter.classList.contains('pb603FilterActive')));
      const g=gridButtons();
      if(g[0])out.push(sourceButton(g[0],'▦',g[0].classList.contains('active')));
      if(g[1])out.push(sourceButton(g[1],'▤',g[1].classList.contains('active')));
    }
    return out.filter(Boolean);
  }
  function menuSource(action){
    const h=nativeHeader();
    const selectors={notifications:'.mobileNotificationBell',wallet:'.mobileHeaderWallet',settings:'.mobileHeaderSettings',invite:'.mobileHeaderInvite',install:'.mobileHeaderInstall',logout:'.mobileHeaderPower'};
    const store={notifications:'#storeNotificationBtn',wallet:'#storeWalletBtn',settings:'#storeSettingsBtn',invite:'#storeInviteBtn',install:'#storeInstallBtn',logout:'#storeLogoutBtn'};
    return h?.querySelector(selectors[action])||$(store[action]||'')||$(selectors[action]||'');
  }
  function ensureAvatarInput(){
    let input=$('#pbSharedAvatarInput');if(input)return input;
    input=document.createElement('input');input.id='pbSharedAvatarInput';input.type='file';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;document.body.appendChild(input);
    input.addEventListener('change',async()=>{const file=input.files?.[0];input.value='';if(!file)return;try{const data=await resizeAvatar(file);avatarData=data;renderAvatar();const r=await fetch('/api/photographer/profile/avatar',{method:'PUT',credentials:'include',headers:{'content-type':'application/json','x-photobridge-portal':'photographer'},body:JSON.stringify({imageData:data})});if(!r.ok)throw new Error('save_failed');if(me?.user)me.user.photographerAvatarData=data}catch(e){alert('ذخیره عکس پروفایل انجام نشد.')}});
    return input;
  }
  function resizeAvatar(file){return new Promise((resolve,reject)=>{if(!file||!/^image\/(jpeg|png|webp)$/i.test(file.type||''))return reject(new Error('invalid'));if(file.size>8*1024*1024)return reject(new Error('large'));const fr=new FileReader();fr.onerror=reject;fr.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{const side=Math.min(img.naturalWidth,img.naturalHeight),sx=(img.naturalWidth-side)/2,sy=(img.naturalHeight-side)/2,c=document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d',{alpha:false});x.fillStyle='#fff';x.fillRect(0,0,192,192);x.drawImage(img,sx,sy,side,side,0,0,192,192);resolve(c.toDataURL('image/jpeg',.84))};img.src=String(fr.result||'')};fr.readAsDataURL(file)})}
  function renderAvatar(){const b=$('#pbSharedAvatar');if(!b)return;if(avatarData)b.innerHTML=`<img src="${esc(avatarData)}" alt="عکس پروفایل">`;else b.textContent=(studioName().trim().charAt(0)||'ع')}
  function ensureMenu(){
    let m=$('#pbSharedPhotographerMenu');if(m)return m;
    m=document.createElement('div');m.id='pbSharedPhotographerMenu';m.setAttribute('role','menu');m.innerHTML=[
      ['notifications','اعلان‌ها','پیام‌ها و وضعیت‌ها','🔔',''],['wallet','اعتبار خدمات','معادل پولی: در حال دریافت…','◫',''],['settings','تنظیمات عکاسی','پروفایل و موقعیت','⚙',''],['invite','دعوت همکار','مدیریت دعوت‌ها','＋',''],['install','نصب برنامه','نسخه موبایل PhotoBridge','↧',''],['logout','خروج از حساب','','⏻','danger']
    ].map(([a,t,s,i,c])=>`<button type="button" role="menuitem" data-pb-shared-menu="${a}" class="${c}"><span class="pbSharedMenuIcon">${i}</span><span class="pbSharedMenuText"><b>${t}</b>${s?`<small>${s}</small>`:''}</span></button>`).join('');document.body.appendChild(m);return m;
  }
  async function refreshWallet(){if(walletLoading)return;walletLoading=true;const small=$('#pbSharedPhotographerMenu [data-pb-shared-menu="wallet"] small');if(small&&walletBalance==null)small.textContent='معادل پولی: در حال دریافت…';try{const r=await fetch('/api/customer/services-wallet',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}});if(r.ok){const d=await r.json();walletBalance=Math.max(0,Number(d?.balance||0));if(small)small.textContent=`اعتبار ${fa(walletBalance)} · معادل پولی ${fa(walletBalance)} تومان`}}catch{}finally{walletLoading=false}}
  function ensureShell(){
    let h=$('#pbSharedPhotographerHeader');if(h)return h;
    h=document.createElement('header');h.id='pbSharedPhotographerHeader';h.innerHTML=`<div class="pbSharedAccountRow"><button id="pbSharedAvatar" class="pbSharedAvatar" type="button" aria-label="انتخاب عکس پروفایل"></button><div class="pbSharedIdentity"><h1 id="pbSharedStudioName"></h1><small class="pbSharedRole" id="pbSharedRole"></small><span class="pbSharedDate" id="pbSharedDate"></span><span class="pbSharedTime" id="pbSharedTime"></span></div><button id="pbSharedMenuButton" class="pbSharedMenuButton" type="button" aria-label="منو" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg><i id="pbSharedMenuBadge" class="pbSharedMenuBadge" hidden></i></button></div>`;
    document.body.appendChild(h);ensureMenu();
    $('#pbSharedAvatar').addEventListener('click',()=>ensureAvatarInput().click());
    $('#pbSharedMenuButton').addEventListener('click',e=>{e.stopPropagation();const menu=ensureMenu(),open=!menu.classList.contains('open');menu.classList.toggle('open',open);$('#pbSharedMenuButton').setAttribute('aria-expanded',open?'true':'false');if(open)void refreshWallet()});
    ensureMenu().addEventListener('click',e=>{const b=e.target.closest('[data-pb-shared-menu]');if(!b)return;ensureMenu().classList.remove('open');$('#pbSharedMenuButton')?.setAttribute('aria-expanded','false');menuSource(b.dataset.pbSharedMenu)?.click()});
    document.addEventListener('click',e=>{if(!e.target.closest('#pbSharedPhotographerMenu,#pbSharedMenuButton')){ensureMenu().classList.remove('open');$('#pbSharedMenuButton')?.setAttribute('aria-expanded','false')}},true);
    return h;
  }
  function ensureSubheader(){
    let sh=$('#pbSharedPhotographerSubheader');if(sh)return sh;
    sh=document.createElement('section');sh.id='pbSharedPhotographerSubheader';sh.innerHTML=`<div class="pbSharedContextTitle"><b id="pbSharedContextTitleText"></b><span id="pbSharedContextMeta" class="pbSharedContextMeta" hidden></span></div><nav id="pbSharedTabs" class="pbSharedTabs" aria-label="دکمه‌های بخش"></nav>`;
    document.body.appendChild(sh);
    $('#pbSharedTabs',sh).addEventListener('click',e=>{const b=e.target.closest('[data-pb-shared-source]');if(!b)return;const src=sourceMap.get(b.dataset.pbSharedSource);if(src){src.click();setTimeout(refresh,20);setTimeout(refresh,120)}});
    return sh;
  }
  function notificationBadge(){const src=menuSource('notifications');const n=src?.querySelector('[class*="badge"],i,em,strong');return String(n?.textContent||src?.getAttribute('data-count')||'').trim()}
  function refresh(){
    if(!matchMedia(MOBILE).matches||!isPhotographerPortal()){document.body.classList.remove('pbSharedPhotographerHeaderActive');$('#pbSharedPhotographerHeader')?.remove();$('#pbSharedPhotographerSubheader')?.remove();$('#pbSharedPhotographerMenu')?.remove();return}
    ensureStyle();const h=ensureShell(),sh=ensureSubheader();document.body.classList.add('pbSharedPhotographerHeaderActive');
    $('#pbSharedStudioName').textContent=studioName();$('#pbSharedRole').textContent=managerName();$('#pbSharedDate').textContent=persianDate();$('#pbSharedTime').textContent=persianTime();renderAvatar();
    const m=mode(),info=contextInfo(m);$('#pbSharedContextTitleText').textContent=info.title;const meta=$('#pbSharedContextMeta');meta.hidden=!info.meta;if(info.meta)meta.textContent=info.meta;
    const actions=actionSources(m),tabs=$('#pbSharedTabs');tabs.hidden=!actions.length;tabs.style.setProperty('--pb-shared-tab-count',String(Math.max(1,actions.length)));tabs.innerHTML=actions.map(a=>`<button type="button" class="${a.active?'active':''}" data-pb-shared-source="${a.id}">${esc(a.label)}</button>`).join('');
    const badge=notificationBadge(),bd=$('#pbSharedMenuBadge');bd.hidden=!badge;if(badge)bd.textContent=badge;
  }
  function queue(delay=0){if(delay){clearTimeout(timer);timer=setTimeout(()=>queue(),delay);return}if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;refresh()})}
  async function loadMe(){try{const r=await fetch('/api/auth/me',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}});if(r.ok){me=await r.json();avatarData=String(me?.user?.photographerAvatarData||'');queue()}}catch{}}
  function wrapHistory(name){const old=history[name];if(!old||old.__pbSharedHeader)return;const fn=function(...args){const out=old.apply(this,args);queue(20);queue(130);return out};fn.__pbSharedHeader=true;history[name]=fn}
  function start(){
    ensureStyle();void loadMe();refresh();try{wrapHistory('pushState');wrapHistory('replaceState')}catch{}
    const root=$('#root')||document.documentElement,mo=new MutationObserver(()=>queue(30));mo.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','aria-current','aria-selected','style']});
    addEventListener('popstate',()=>queue(20),{passive:true});addEventListener('pageshow',()=>queue(20),{passive:true});addEventListener('resize',()=>queue(70),{passive:true});addEventListener('orientationchange',()=>queue(120),{passive:true});
    setInterval(()=>queue(),1500);
  }

  window.PBSharedPhotographerHeader={version:'R100F33',refresh,render:refresh,getMode:mode,getContext:()=>contextInfo(mode())};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
