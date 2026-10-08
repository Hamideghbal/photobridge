/* PhotoBridge R100F40 — print action dedupe, modal stacking, animated tabs and unified subheader polish.
   No measured geometry; Print uses fixed top positions to avoid resize/refresh loops. */
(()=>{
  'use strict';
  if(window.PBStorePhotographerHeaderCore?.version==='R100F40') return;

  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const mobile=()=>matchMedia('(max-width:820px)').matches;
  let me=null,avatarData='',walletBalance=null,walletLoading=false,unreadNotificationCount=null,notificationSyncing=false,lastNotificationSync=0,renderTimer=0,lastSig='',sourceMap=new Map(),sourceSeq=0,pendingMode='',pendingUntil=0;

  function visible(el){if(!el||!el.isConnected||el.hidden)return false;const cs=getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)!==0}
  function isPortal(){return !!($('.photographerMain')||$('#storePhotographerWorkspace')||document.body.classList.contains('pbAuthenticatedPhotographerPortal'))}
  function chooserVisible(){const c=$('#pbR99LabChooser');return visible(c)&&c.getBoundingClientRect().height>8}
  function labelMode(t){
    t=String(t||'').replace(/\s+/g,' ').trim();
    if(/اینستاگرام/.test(t))return 'instagram';
    if(/طراحی آلبوم|آلبوم/.test(t))return 'album';
    if(/گالری/.test(t))return 'gallery';
    if(/هوش/.test(t))return 'ai';
    if(/چاپ|لابراتوار/.test(t))return 'print';
    if(/فروشگاه/.test(t))return 'store';
    return '';
  }
  function navMode(){
    const a=$('.photographerBottomAppNav button.active,.photographerBottomAppNavGrid button.active,.pbHomeMobileAccountBar a.active,[aria-current="page"].photographerStoreMobileNav');
    return labelMode(txt(a)||a?.getAttribute?.('aria-label'));
  }
  function mode(){
    if(pendingMode&&Date.now()<pendingUntil)return pendingMode;
    if(pendingMode){pendingMode='';pendingUntil=0}
    const p=location.pathname.replace(/\/+$/,'')||'/',q=new URLSearchParams(location.search);
    // Route and active bottom-nav state are authoritative. Store/Print DOM may remain
    // mounted briefly during SPA transitions and must never own the destination header.
    if(/^\/equipment-rental(?:\/|$)/.test(p))return 'store';
    if(/^\/photographer\/ai(?:\/|$)/.test(p))return 'ai';
    if(p==='/photographer/gallery')return 'gallery';
    if(/^\/photographer\/album-design(?:\/|$)/.test(p))return q.get('pb_mode')==='instagram'?'instagram':'album';
    if(q.get('workspace')==='print'||/^\/photographer\/(?:orders|upload|album|archive|finance)(?:\/|$)/.test(p))return 'print';
    const n=navMode();if(n)return n;
    const main=$('.photographerMain');
    if(main?.classList.contains('photographerPrintWorkspace'))return 'print';
    const store=$('#storePhotographerWorkspace');
    if(store&&visible(store)&&!/^\/photographer(?:\/|$)/.test(p))return 'store';
    return 'home';
  }
  function nativeHeader(){return $('#photographerRoleHeaderV710')||$('.photographerMain>.unifiedRoleHeader.photographerHeaderRefined')||$('#photographerStoreRoleHeader')}
  function studioName(){return String(me?.user?.photographerName||me?.user?.studioName||me?.user?.studio_name||nativeHeader()?.querySelector('.workspaceIdentityCopy>h1')?.textContent||me?.user?.name||'عکاسی').trim()||'عکاسی'}
  function managerName(){return `مدیریت ${String(me?.user?.name||studioName()).trim()}`}
  function pdate(){try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',weekday:'short',year:'numeric',month:'long',day:'numeric'}).format(new Date())}catch{return ''}}
  function ptime(){try{return new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit'}).format(new Date())}catch{return ''}}
  function labName(){for(const s of ['.photographerPrintTopLabStatic','.photographerLockedLabIdentity b','.photographerSelectedLabNameButton b','.photographerMobileSingleLab span','.photographerPrintTopLabSelect .customSelectValue','.photographerPrintTopLabSelect button']){const v=txt($(s));if(v&&v!=='لابراتوار')return v}return 'لابراتوار'}
  function modelCount(){const b=$('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar>b');if(txt(b))return txt(b);const n=$$('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard').length;return n?`${fa(n)} مدل`:''}
  function galleryCount(){const n=$$('.clientGalleryCards>.clientGalleryCard').length;return n?`${fa(n)} پروژه`:''}
  function context(m){
    if(m==='print')return{title:labName(),meta:'لابراتوار'};
    if(m==='instagram')return{title:'طراحی اینستاگرام',meta:modelCount()};
    if(m==='album')return{title:'طراحی آلبوم',meta:modelCount()};
    if(m==='ai')return{title:'هوش مصنوعی',meta:''};
    if(m==='gallery')return{title:'گالری مشتریان',meta:galleryCount()};
    return{title:'PhotoBridge',meta:''};
  }
  function stableId(node){let id=node?.dataset?.pbF37Source;if(!id&&node){id=`f37s${++sourceSeq}`;node.dataset.pbF37Source=id}return id}
  function src(node,label,active){if(!node)return null;const id=stableId(node);sourceMap.set(id,node);return{id,label:label||txt(node),active:active??node.classList.contains('active')}}
  function gridButtons(){const t=$('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar');const a=t?$$('.albumDesignMobileGridToggle button',t):[];return a.length>=2?a:$$('.photographerAlbumDesignCatalog .albumDesignMobilePicker .albumDesignMobileGridToggle button').slice(0,2)}
  function actions(m){
    sourceMap=new Map();sourceSeq=0;const out=[];
    if(m==='print'){
      const photo=$('.photographerPrintModeNav .photographerPrintPhotoTab'),album=$('.photographerPrintModeNav .photographerPrintAlbumTab'),finance=$('.photographerPrintCommonAction.finance');
      if(photo)out.push(src(photo,'چاپ عکس'));if(album)out.push(src(album,'صحافی آلبوم'));if(finance)out.push(src(finance,'مالی و فاکتور'));
    }else if(m==='ai'){
      const a=$$('.photographerAiSectionNav>button').slice(0,2);if(a[0])out.push(src(a[0],'روتوش صورت AI'));if(a[1])out.push(src(a[1],'سایر ابزارهای AI'));
    }else if(m==='gallery'){
      const n=$('.clientGalleryListHead>button.primary,.clientGalleryEmpty>button.primary');if(n)out.push(src(n,'＋ گالری جدید',false));
    }else if(m==='album'||m==='instagram'){
      const filter=$('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter,.photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton');if(filter)out.push(src(filter,'فیلتر',filter.classList.contains('pb603FilterActive')));
      const g=gridButtons();if(g[0])out.push(src(g[0],'▦',g[0].classList.contains('active')));if(g[1])out.push(src(g[1],'▤',g[1].classList.contains('active')));
    }
    return out.filter(Boolean);
  }
  function menuSource(a){
    const h=nativeHeader(),map={notifications:'.mobileNotificationBell',wallet:'.mobileHeaderWallet',settings:'.mobileHeaderSettings',invite:'.mobileHeaderInvite',install:'.mobileHeaderInstall',logout:'.mobileHeaderPower'},fallback={notifications:'#storeNotificationBtn',wallet:'#storeWalletBtn',settings:'#storeSettingsBtn',invite:'#storeInviteBtn',install:'#storeInstallBtn',logout:'#storeLogoutBtn'};
    return h?.querySelector(map[a])||$(fallback[a]||'')||$(map[a]||'');
  }
  function badgeText(){if(unreadNotificationCount!==null)return fa(unreadNotificationCount);const s=$('#storeNotificationBadgeMobile')||$('#storeNotificationBadgeDesktop')||$('#storeNotificationBtn')||menuSource('notifications'),n=s?.matches?.('[class*="badge"],i,em,strong')?s:s?.querySelector('[class*="badge"],i,em,strong');return txt(n)||String(s?.getAttribute('data-count')||'').trim()}
  async function syncNotificationBadge(){if(notificationSyncing||Date.now()-lastNotificationSync<12000)return;lastNotificationSync=Date.now();notificationSyncing=true;try{const r=await fetch('/api/customer/notifications?limit=1',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}});if(!r.ok)return;const d=await r.json(),n=Number(d?.unread);if(!Number.isFinite(n))return;unreadNotificationCount=Math.max(0,Math.floor(n));const bd=$('#pbF37MenuBadge');if(bd){bd.textContent=fa(unreadNotificationCount);bd.hidden=false}}catch{}finally{notificationSyncing=false}}

  function resizeAvatar(file){return new Promise((resolve,reject)=>{if(!file||!/^image\/(jpeg|png|webp)$/i.test(file.type||''))return reject(new Error('invalid'));if(file.size>8*1024*1024)return reject(new Error('large'));const fr=new FileReader();fr.onerror=reject;fr.onload=()=>{const im=new Image();im.onerror=reject;im.onload=()=>{const side=Math.min(im.naturalWidth,im.naturalHeight),sx=(im.naturalWidth-side)/2,sy=(im.naturalHeight-side)/2,c=document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d',{alpha:false});x.fillStyle='#fff';x.fillRect(0,0,192,192);x.drawImage(im,sx,sy,side,side,0,0,192,192);resolve(c.toDataURL('image/jpeg',.84))};im.src=String(fr.result||'')};fr.readAsDataURL(file)})}
  function avatarInput(){let i=$('#pbF37AvatarInput');if(i)return i;i=document.createElement('input');i.id='pbF37AvatarInput';i.type='file';i.accept='image/jpeg,image/png,image/webp';i.hidden=true;document.body.appendChild(i);i.addEventListener('change',async()=>{const f=i.files?.[0];i.value='';if(!f)return;try{const d=await resizeAvatar(f);avatarData=d;paintAvatar();const r=await fetch('/api/photographer/profile/avatar',{method:'PUT',credentials:'include',headers:{'content-type':'application/json','x-photobridge-portal':'photographer'},body:JSON.stringify({imageData:d})});if(!r.ok)throw new Error()}catch{alert('ذخیره عکس پروفایل انجام نشد.')}});return i}
  function paintAvatar(){const b=$('#pbF37AvatarBtn');if(!b)return;b.innerHTML=avatarData?`<img src="${esc(avatarData)}" alt="عکس پروفایل">`:`<span>${esc(studioName().charAt(0)||'ع')}</span>`}
  function ensureMenu(){let p=$('#pbF37MenuPanel');if(p)return p;p=document.createElement('div');p.id='pbF37MenuPanel';p.innerHTML=[['notifications','اعلان‌ها','پیام‌ها و وضعیت‌ها','🔔',''],['wallet','اعتبار خدمات','معادل پولی: در حال دریافت…','◫',''],['settings','تنظیمات عکاسی','پروفایل و موقعیت','⚙',''],['invite','دعوت همکار','مدیریت دعوت‌ها','＋',''],['install','نصب برنامه','نسخه موبایل PhotoBridge','↧',''],['logout','خروج از حساب','','⏻','danger']].map(([a,t,s,i,c])=>`<button type="button" data-f37-menu="${a}" class="${c}"><span class="pbF37MenuIcon">${i}</span><span class="pbF37MenuText"><b>${t}</b>${s?`<small>${s}</small>`:''}</span></button>`).join('');document.body.appendChild(p);p.addEventListener('click',e=>{const b=e.target.closest('[data-f37-menu]');if(!b)return;closeMenu();menuSource(b.dataset.f37Menu)?.click()});return p}
  async function wallet(){if(walletLoading)return;walletLoading=true;const s=$('#pbF37MenuPanel [data-f37-menu="wallet"] small');try{const r=await fetch('/api/customer/services-wallet',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}});if(r.ok){const d=await r.json();walletBalance=Math.max(0,Number(d?.balance||0));if(s)s.textContent=`اعتبار ${fa(walletBalance)} · معادل پولی ${fa(walletBalance)} تومان`}}catch{}finally{walletLoading=false}}
  function closeMenu(){ensureMenu().classList.remove('open');$('#pbF37MenuBtn')?.setAttribute('aria-expanded','false')}
  function ensureHeader(){
    let h=$('#pbF37PhotographerHeader');if(h)return h;
    h=document.createElement('header');h.id='pbF37PhotographerHeader';h.innerHTML='<div class="pbF37Identity"><button id="pbF37AvatarBtn" type="button" aria-label="انتخاب عکس پروفایل"></button><div class="pbF37IdentityCopy"><h1 id="pbF37StudioName"></h1><small id="pbF37Manager" class="pbF37Manager"></small><div class="pbF37DateWrap"><span id="pbF37Date"></span><b id="pbF37Time" class="pbF37Time"></b></div></div></div>';
    document.body.appendChild(h);
    const mb=document.createElement('button');mb.id='pbF37MenuBtn';mb.type='button';mb.setAttribute('aria-label','منو');mb.setAttribute('aria-expanded','false');mb.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg><i id="pbF37MenuBadge" hidden></i>';document.body.appendChild(mb);
    mb.addEventListener('click',e=>{e.stopPropagation();const p=ensureMenu(),o=!p.classList.contains('open');p.classList.toggle('open',o);mb.setAttribute('aria-expanded',o?'true':'false');if(o)void wallet()});
    $('#pbF37AvatarBtn').addEventListener('click',()=>avatarInput().click());
    document.addEventListener('click',e=>{if(!e.target.closest('#pbF37MenuPanel,#pbF37MenuBtn'))closeMenu()},true);
    return h;
  }
  function ensureSub(){let s=$('#pbF37Subheader');if(s)return s;s=document.createElement('section');s.id='pbF37Subheader';s.innerHTML='<div id="pbF37ContextTitle"><b id="pbF37ContextText"></b><span id="pbF37ContextMeta" hidden></span></div><nav id="pbF37Tabs" aria-label="دکمه‌های بخش"></nav>';document.body.appendChild(s);$('#pbF37Tabs').addEventListener('click',e=>{const b=e.target.closest('[data-f37-source]');if(!b)return;sourceMap.get(b.dataset.f37Source)?.click();schedule(60)});return s}
  function clockBadge(){const d=$('#pbF37Date'),t=$('#pbF37Time'),bd=$('#pbF37MenuBadge');if(d)d.textContent=pdate();if(t)t.textContent=ptime();const b=badgeText();if(bd){bd.hidden=!b;if(b)bd.textContent=b}void syncNotificationBadge()}

  function printComposer(){const w=$('.photographerMain.photographerPrintWorkspace');return !!w&&(w.classList.contains('simplePrintPilotWorkspaceMode')||!!w.querySelector('.simplePrintPilot'))}
  function albumComposer(){const w=$('.photographerMain.photographerPrintWorkspace');return !!w&&(w.classList.contains('photographerAlbumCreateWorkspaceMode')||location.pathname.startsWith('/photographer/album/new'))}
  function orderComposer(){return printComposer()||albumComposer()}
  function printAction(index){const w=$('.photographerMain.photographerPrintWorkspace');if(!w)return null;const albumCreate=w.classList.contains('photographerAlbumCreateWorkspaceMode')||location.pathname.startsWith('/photographer/album/new');const album=albumCreate||!!w.querySelector('.photographerPrintModeNav>.photographerPrintAlbumTab.active')||w.classList.contains('photographerAlbumWorkspaceMode');if(album&&albumCreate){return index===0?$('.photographerAlbumCreateWorkspaceMode .albumOrderWorkspace .albumFileActionFile,.albumOrderWorkspace .albumFileActionFile,.photographerAlbumCreateWorkspaceMode .albumQuickActions button:first-child'):$('.photographerAlbumCreateWorkspaceMode .albumOrderWorkspace .albumQuoteCard button.primary,.albumOrderWorkspace .albumQuoteCard button.primary,.photographerAlbumCreateWorkspaceMode .albumQuickActions button:nth-child(2)')}if(!album&&printComposer()){return index===0?$('.simplePrintPilotMobileInlineActions .simplePrintPilotPrimaryAdd,.simplePrintPilot .simplePrintPilotPrimaryAdd'):$('.simplePrintPilot .simplePrintPilotQuoteSubmit,.simplePrintPilotMobileInlineActions .simplePrintPilotHeaderSubmit,.simplePrintPilot .simplePrintPilotHeaderSubmit')}return null}
  function ensureComposerActions(){
    let r=$('#pbF37PrintComposerActions');if(!r){r=document.createElement('div');r.id='pbF37PrintComposerActions';r.innerHTML='<button type="button" class="pbF37Choose">انتخاب فایل / عکس</button><button type="button" class="pbF37Send">ارسال فایل برای چاپ</button>';document.body.appendChild(r);r.querySelector('.pbF37Choose').addEventListener('click',()=>{const s=printAction(0);if(s&&!s.disabled)s.click()});r.querySelector('.pbF37Send').addEventListener('click',()=>{const s=printAction(1);if(s&&!s.disabled)s.click()})}
    const comp=orderComposer();r.hidden=!comp;if(comp){const a=printAction(0),b=printAction(1);r.querySelector('.pbF37Choose').disabled=!a||!!a.disabled;r.querySelector('.pbF37Send').disabled=!b||!!b.disabled;const w=$('.photographerMain.photographerPrintWorkspace'),album=albumComposer()||!!w?.querySelector('.photographerPrintModeNav>.photographerPrintAlbumTab.active')||w?.classList.contains('photographerAlbumWorkspaceMode');r.querySelector('.pbF37Choose').textContent=album?'انتخاب فایل آلبوم':'انتخاب فایل / عکس';r.querySelector('.pbF37Send').textContent=album?'ارسال آلبوم برای چاپ':'ارسال فایل برای چاپ'}
  }
  function fixPrint(){
    const w=$('.photographerMain.photographerPrintWorkspace');if(!w)return;
    const sc=w.querySelector(':scope>.photographerRolePageScrollArea'),comp=orderComposer(),top=comp?241:181;
    document.body.classList.add('pbF37PrintMode');document.body.classList.toggle('pbF37PrintComposer',comp);
    if(comp){$('#pb762-add')?.remove();$('#pb765-add')?.remove();}
    if(sc){const map={position:'fixed',top:`${top}px`,left:'0px',right:'0px',bottom:'78px',height:'auto','min-height':'0px',margin:'0px','padding-top':'10px','box-sizing':'border-box','overflow-y':'auto','overflow-x':'hidden',transition:'none',animation:'none',transform:'none',opacity:'1',visibility:'visible'};for(const [k,v] of Object.entries(map))sc.style.setProperty(k,v,'important')}
    // Legacy top context rail is mirrored into the F37 title/tabs and must never sit below the header.
    const rail=w.querySelector(':scope>.photographerLabContextRail');if(rail){rail.style.setProperty('display','none','important');rail.style.setProperty('visibility','hidden','important');rail.style.setProperty('pointer-events','none','important')}
    ensureComposerActions();
  }
  function clearPrint(){
    document.body.classList.remove('pbF37PrintMode','pbF37PrintComposer');$('#pbF37PrintComposerActions')?.setAttribute('hidden','');
    const w=$('.photographerMain'),sc=w?.querySelector(':scope>.photographerRolePageScrollArea');
    if(sc){for(const p of ['position','top','left','right','bottom','height','min-height','margin','padding-top','box-sizing','overflow-y','overflow-x','transition','animation','transform','opacity','visibility'])sc.style.removeProperty(p)}
    const rail=w?.querySelector(':scope>.photographerLabContextRail');if(rail){for(const p of ['display','visibility','pointer-events'])rail.style.removeProperty(p)}
  }

  function render(){
    if(!mobile()||!isPortal()){document.body.classList.remove('pbF37UnifiedActive','pbF37LabChooserVisible','pbF37HasTabs','pbF37NoTabs','pbF37StoreMode');lastSig='';sourceMap=new Map();$('#pbF37PhotographerHeader')?.remove();$('#pbF37MenuBtn')?.remove();$('#pbF37Subheader')?.remove();$('#pbF37MenuPanel')?.remove();clearPrint();return}
    if(chooserVisible()){
      document.body.classList.add('pbF37LabChooserVisible');document.body.classList.remove('pbF37UnifiedActive','pbF37StoreMode');lastSig='';sourceMap=new Map();
      $('#pbF37PhotographerHeader')?.remove();$('#pbF37MenuBtn')?.remove();$('#pbF37Subheader')?.remove();$('#pbF37MenuPanel')?.remove();$('#pbF37PrintComposerActions')?.remove();return;
    }
    document.body.classList.remove('pbF37LabChooserVisible');document.body.classList.add('pbF37UnifiedActive');
    const m=mode(),storeHeader=$('#photographerStoreRoleHeader');
    document.body.classList.toggle('pbF37StoreMode',m==='store');
    if(m==='store'){ // Store owns its native header only while Store is the authoritative section.
      storeHeader?.classList.add('pbF37CoreHeader');lastSig='';sourceMap=new Map();$('#pbF37PhotographerHeader')?.remove();$('#pbF37MenuBtn')?.remove();$('#pbF37Subheader')?.remove();$('#pbF37MenuPanel')?.remove();clearPrint();return;
    }
    storeHeader?.classList.remove('pbF37CoreHeader');
    ensureHeader();ensureSub();ensureMenu();
    $('#pbF37StudioName').textContent=studioName();$('#pbF37Manager').textContent=managerName();clockBadge();paintAvatar();
    const info=context(m);$('#pbF37ContextText').textContent=info.title;const meta=$('#pbF37ContextMeta');meta.hidden=!info.meta;if(info.meta)meta.textContent=info.meta;
    const aa=actions(m),tabs=$('#pbF37Tabs');document.body.classList.toggle('pbF37HasTabs',!!aa.length);document.body.classList.toggle('pbF37NoTabs',!aa.length);tabs.hidden=!aa.length;tabs.style.setProperty('--pb-f37-tabs',String(Math.max(1,aa.length)));
    const sig=`${m}|${info.title}|${info.meta}|`+aa.map(a=>`${a.id}:${a.label}:${a.active?'1':'0'}`).join('|');if(sig!==lastSig){lastSig=sig;tabs.innerHTML=aa.map(a=>`<button type="button" class="${a.active?'active':''}" data-f37-source="${a.id}">${esc(a.label)}</button>`).join('')}
    if(m==='print')fixPrint();else clearPrint();
    // Last-word physical-left lock, independent from RTL/logical properties.
    const mb=$('#pbF37MenuBtn');if(mb){mb.style.setProperty('position','fixed','important');mb.style.setProperty('inset-inline-start','10px','important');mb.style.setProperty('inset-inline-end','auto','important');mb.style.setProperty('left','10px','important');mb.style.setProperty('right','auto','important');mb.style.setProperty('top','20px','important')}
    settleBoot();
  }
  // Coalesce DOM updates without postponing a pending route render indefinitely.
  // Legacy mobile scripts can mutate the root continuously during tab changes.
  function schedule(ms=40){
    if(renderTimer){if(ms!==0)return;clearTimeout(renderTimer)}
    renderTimer=setTimeout(()=>{renderTimer=0;render()},ms);
  }
  let bootTimer=0;function settleBoot(){if(!document.documentElement.classList.contains('pbR100F37LabEnterBoot'))return;const w=$('.photographerMain.photographerPrintWorkspace'),sc=w?.querySelector(':scope>.photographerRolePageScrollArea');if(!w||!sc||!sc.children.length||chooserVisible()||labName()==='لابراتوار')return;if(bootTimer)return;bootTimer=setTimeout(()=>{bootTimer=0;document.documentElement.classList.remove('pbR100F37LabEnterBoot');try{sessionStorage.removeItem('photobridge:r100f37:lab-enter-pending')}catch{};try{const u=new URL(location.href);if(u.searchParams.get('pbEntryDone')==='lab'){u.searchParams.delete('pbEntryDone');history.replaceState(history.state,'',u.pathname+(u.searchParams.size?'?'+u.searchParams.toString():'')+u.hash)}}catch{}},320)}
  async function loadMe(){try{const r=await fetch('/api/auth/me',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}});if(r.ok){me=await r.json();avatarData=String(me?.user?.photographerAvatarData||'');schedule(0)}}catch{}}
  function start(){
    for(const name of ['pushState','replaceState']){const old=history[name];if(typeof old==='function'&&!old.__pbR100F38){const fn=function(...args){const out=old.apply(this,args);pendingMode='';pendingUntil=0;schedule(0);return out};fn.__pbR100F38=true;history[name]=fn}}
    void loadMe();render();
    const root=$('#root')||document.documentElement;new MutationObserver(()=>schedule(70)).observe(root,{childList:true,subtree:true});
    document.addEventListener('click',e=>{const el=e.target?.closest?.('.photographerBottomAppNav button,.photographerBottomAppNavGrid button,.pbHomeMobileAccountBar a,.photographerStoreEntry,.photographerStoreMobileNav,.pbRental656MobileBtn');const m=labelMode(txt(el)||el?.getAttribute?.('aria-label'));if(m){pendingMode=m;pendingUntil=Date.now()+1000;if(m!=='store')document.body.classList.remove('pbF37StoreMode');schedule(0)}else schedule(70)},true);
    addEventListener('popstate',()=>{pendingMode='';pendingUntil=0;schedule(0)},{passive:true});addEventListener('pageshow',()=>schedule(60),{passive:true});addEventListener('resize',()=>schedule(100),{passive:true});
    setInterval(()=>{clockBadge();settleBoot()},15000);
    setTimeout(()=>{if(document.documentElement.classList.contains('pbR100F37LabEnterBoot'))document.documentElement.classList.remove('pbR100F37LabEnterBoot')},5200);
  }
  window.PBStorePhotographerHeaderCore={version:'R100F40',mount:render,refresh:()=>schedule(0),getMode:mode};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
