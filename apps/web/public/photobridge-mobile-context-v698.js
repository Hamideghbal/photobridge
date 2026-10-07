/* PhotoBridge v698 — persistent mobile context/header synchronizer. */
(()=>{
  'use strict';
  // v698 verify compatibility: [bell,power,settings,invite,wallet].filter(Boolean).forEach(el=>row.appendChild(el))
  const MOBILE='(max-width: 820px)';
  const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const mobile=()=>{try{return matchMedia(MOBILE).matches}catch{return innerWidth<=820}};
  const main=()=>qs('.photographerMain');
  const header=()=>qs('#photographerStoreRoleHeader')||qs('.photographerMain>.unifiedRoleHeader.photographerHeaderRefined');
  let raf=0,lastRoute='',poll=0;
  let pageLoad={active:false,started:0,minUntil:0,maxUntil:0,fromSig:'',requireChange:false,label:''};
  const route=()=>{
    const p=location.pathname.replace(/\/+$/,'')||'/';
    if(/^\/photographer\/ai(?:\/|$)/.test(p))return 'ai';
    if(p==='/photographer/gallery')return 'gallery';
    if(/^\/photographer\/album-design(?:\/|$)/.test(p))return new URLSearchParams(location.search).get('pb_mode')==='instagram'?'instagram':'album';
    return '';
  };
  const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync()})};
  const after=()=>{requestAnimationFrame(()=>requestAnimationFrame(schedule));setTimeout(schedule,80)};

  function removeOld(){
    qsa('.photographerMobileAiInviteRow').forEach(x=>x.remove());
    ['pb693GlobalInviteButton','pb694HeaderInviteButton','pb695HeaderInviteButton','pb696HeaderInviteButton','pb697HeaderInviteButton','pb694PhotographerContextBar','pb695PhotographerContextBar','pb696PhotographerContextBar','pb697PhotographerContextBar','pb694PrintBarActions','pb695PrintBarActions','pb696PrintBarActions','pb697PrintBarActions','pb695CatalogLoader','pb696CatalogLoader','pb697CatalogLoader','pb696PageLoader','pb697PageLoader'].forEach(id=>qs('#'+id)?.remove());
    const app=main();
    if(app)for(const c of [...app.classList])if(/^pb69[34567](ContextBarActive|DesignContext|AiContext|GalleryContext)$/.test(c))app.classList.remove(c);
  }

  function ensureHeaderActions(h){
    if(!mobile()||!h)return;
    const row=qs('.photographerMobileHeaderQuickActions',h);if(!row)return;
    qsa('.photographerMobileAiInviteRow').forEach(x=>x.remove());

    let settings=qs('.mobileHeaderSettings',row);
    if(!settings){
      settings=document.createElement('button');settings.id='pb698HeaderSettingsButton';settings.className='mobileHeaderSettings';settings.type='button';settings.innerHTML='<span aria-hidden="true">⚙</span>';settings.title='تنظیمات عکاسی';settings.setAttribute('aria-label','تنظیمات عکاسی');
      settings.onclick=e=>{e.preventDefault();location.href='/photographer/settings'};
      row.append(settings);
    }

    const invites=qsa('.mobileHeaderInvite',h);
    let invite=invites[0];
    invites.slice(1).forEach(x=>x.remove());
    if(!invite){
      invite=document.createElement('button');invite.id='pb698HeaderInviteButton';invite.className='mobileHeaderInvite';invite.type='button';invite.title='دعوت همکار';invite.setAttribute('aria-label','دعوت همکار');
      invite.onclick=e=>{e.preventDefault();location.href='/photographer/settings/invites'};
      row.append(invite);
    }
    if(!qs('.pb698InviteLabel',invite)){
      const label=document.createElement('span');label.className='pb698InviteLabel';label.textContent='دعوت همکار';
      invite.replaceChildren(label);
    }

    const bell=qs('.mobileNotificationBell',row),power=qs('.mobileHeaderPower',row),wallet=qs('.mobileHeaderWallet',row);
    [bell,power,settings,wallet].filter(Boolean).forEach(el=>row.appendChild(el));
    let second=qs(':scope>.pb704MobileSecondaryActions',h);
    if(!second){second=document.createElement('div');second.className='pb704MobileSecondaryActions';h.appendChild(second)}
    second.appendChild(invite);
    row.classList.add('pb698HeaderOrderReady','pb704PrimaryHeaderActions');
  }

  function uiSignature(){
    const active=qs('.photographerBottomAppNav button.active')?.getAttribute('aria-label')||qs('.photographerBottomAppNav button.active em')?.textContent||'';
    const print=qs('.photographerPrintModeNav>.rolePrimaryAction.active')?.textContent?.trim()||'';
    const store=qs('#storeSectionNavV673 [data-store-panel].active')?.textContent?.trim()||'';
    return `${location.pathname}${location.search}|${active}|${print}|${store}`;
  }
  function currentPageLabel(){
    if(qs('#storePhotographerWorkspace'))return 'فروشگاه';
    const p=location.pathname;
    if(/^\/photographer\/ai(?:\/|$)/.test(p))return 'هوش مصنوعی';
    if(p==='/photographer/gallery')return 'گالری مشتریان';
    if(/^\/photographer\/album-design(?:\/|$)/.test(p))return new URLSearchParams(location.search).get('pb_mode')==='instagram'?'طراحی اینستاگرام':'طراحی آلبوم';
    if(main()?.classList.contains('photographerPrintWorkspace')||/^\/photographer\/(orders|print|album)(?:\/|$)/.test(p))return 'چاپ';
    return 'صفحه';
  }
  function pageLoaderEl(){
    let l=qs('#pb698PageLoader');
    if(!l&&document.body){l=document.createElement('div');l.id='pb698PageLoader';l.setAttribute('role','status');l.setAttribute('aria-live','polite');document.body.appendChild(l)}
    return l;
  }
  function showPageLoader(label=currentPageLabel(),opts={}){
    if(!mobile())return;
    const text=String(label||'صفحه').trim();
    const now=Date.now();
    pageLoad={active:true,started:now,minUntil:now+(opts.minMs||360),maxUntil:now+(opts.maxMs||5200),fromSig:uiSignature(),requireChange:opts.requireChange!==false,label:text};
    const l=pageLoaderEl();if(l){l.hidden=false;l.textContent=`در حال بارگذاری ${text}…`}
    setTimeout(schedule,380);setTimeout(schedule,900);setTimeout(schedule,1800);setTimeout(schedule,5300);
  }
  function hidePageLoader(){const l=qs('#pb698PageLoader');if(l)l.remove();pageLoad.active=false}
  function visible(el){if(!el)return false;const st=getComputedStyle(el);return st.display!=='none'&&st.visibility!=='hidden'&&Number(st.opacity||1)!==0&&el.getClientRects().length>0}
  function nativeBusy(){
    const roots=[qs('.photographerMain>.photographerRolePageScrollArea'),qs('#storePhotographerWorkspace>.shell')].filter(Boolean);
    for(const root of roots){
      const busy=qsa('.albumDesignSavedLoading,.loadingBox,.clientGalleryLoading,.photographerLoading,.loadingState,[aria-busy="true"]',root).some(visible);
      if(busy)return true;
      const t=(root.textContent||'').slice(0,800);
      if(/در حال (بارگذاری|دریافت|آماده‌سازی|آماده سازی)/.test(t))return true;
    }
    return false;
  }
  function pageReady(){
    const store=qs('#storePhotographerWorkspace');
    if(store){const shell=qs(':scope>.shell',store);return !!shell&&!!qs('#app>*',shell)}
    const app=main(),area=qs('.photographerMain>.photographerRolePageScrollArea');
    if(!app||!area)return false;
    const mode=route();
    if(mode==='ai')return !!qs('.photographerAiWorkspace',area)||area.childElementCount>0;
    if(mode==='gallery')return !!qs('.clientGalleryWorkspace,.clientGalleryListHead,.clientGalleryEmpty',area)||area.childElementCount>0;
    if(mode==='album'||mode==='instagram')return !!qs('.photographerAlbumDesignCatalog',area)||area.childElementCount>0;
    if(app.classList.contains('photographerPrintWorkspace'))return !!qs('.photographerLabContextRail')&&area.childElementCount>0;
    return area.childElementCount>0;
  }
  function syncPageLoader(){
    if(!mobile()){hidePageLoader();return}
    if(qs('#pb698CatalogLoader')){if(pageLoad.active)hidePageLoader();return}
    const busy=nativeBusy();
    if(busy&&!pageLoad.active)showPageLoader(currentPageLabel(),{requireChange:false,minMs:260,maxMs:6000});
    if(!pageLoad.active)return;
    const now=Date.now(),changed=uiSignature()!==pageLoad.fromSig,ready=pageReady()&&!busy;
    if(now>=pageLoad.maxUntil){hidePageLoader();return}
    if(now>=pageLoad.minUntil&&ready&&(!pageLoad.requireChange||changed||now-pageLoad.started>1100))hidePageLoader();
  }

  function filterIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke-width="2" stroke-linecap="round"/></svg>'}
  function gridButtons(){const t=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar');const a=t?qsa('.albumDesignMobileGridToggle button',t):[];return a.length>=2?a:qsa('.photographerAlbumDesignCatalog .albumDesignMobilePicker .albumDesignMobileGridToggle button').slice(0,2)}
  function modelCount(){const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar>b');if(b?.textContent?.trim())return b.textContent.trim();const n=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard').length;return n?`${n.toLocaleString('fa-IR')} مدل`:''}
  function filterActive(){const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter, .photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton');return !!b?.classList.contains('pb603FilterActive')}
  function aiState(){return qsa('.photographerAiSectionNav>button').slice(0,2).map(x=>x.classList.contains('active')?1:0).join('')}
  function markup(mode){
    if(mode==='ai'){const a=qsa('.photographerAiSectionNav>button');return `<div class="pb698ContextTitle"><b>هوش مصنوعی</b></div><div class="pb698ContextActions"><button data-pb698-ai="0" class="${a[0]?.classList.contains('active')?'active':''}">روتوش صورت AI</button><button data-pb698-ai="1" class="${a[1]?.classList.contains('active')?'active':''}">سایر ابزار</button></div>`}
    if(mode==='gallery')return '<div class="pb698ContextTitle"><b>گالری مشتریان</b></div><div class="pb698ContextActions"><button data-pb698-gallery-new="1">＋ گالری جدید</button></div>';
    if(mode==='album'||mode==='instagram'){
      const g=gridButtons(),two=g[0]?.classList.contains('active'),one=g[1]?.classList.contains('active'),count=modelCount(),title=mode==='instagram'?'طراحی اینستاگرام':'طراحی آلبوم';
      return `<div class="pb698ContextTitle"><b>${title}</b>${mode==='instagram'?'<span class="pb698FreeBadge">رایگان</span>':''}${count?`<span class="pb698ModelCount">${count}</span>`:''}</div><div class="pb698ContextActions"><button class="pb698Square pb698FilterButton ${filterActive()?'active':''}" data-pb698-filter="1" aria-label="فیلتر">${filterIcon()}</button><button class="pb698Square ${two?'active':''}" data-pb698-grid="0" aria-label="دو ستونه">▦</button><button class="pb698Square ${one?'active':''}" data-pb698-grid="1" aria-label="تک ستونه">▤</button></div>`;
    }
    return '';
  }
  function bind(bar){
    qsa('[data-pb698-ai]',bar).forEach(b=>b.onclick=()=>{showPageLoader(b.textContent?.trim()||'هوش مصنوعی',{requireChange:false,minMs:260,maxMs:2600});qsa('.photographerAiSectionNav>button')[Number(b.dataset.pb698Ai)]?.click();after()});
    qs('[data-pb698-gallery-new]',bar)?.addEventListener('click',()=>{qs('.clientGalleryListHead>button.primary,.clientGalleryEmpty>button.primary')?.click();after()});
    qs('[data-pb698-filter]',bar)?.addEventListener('click',()=>{qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter,.photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton')?.click();after()});
    qsa('[data-pb698-grid]',bar).forEach(b=>b.onclick=()=>{gridButtons()[Number(b.dataset.pb698Grid)]?.click();after()});
  }
  function ensureContext(h){
    const app=main(),mode=route();let bar=qs('#pb698PhotographerContextBar');
    const blocked=!mobile()||!app||!h||app.classList.contains('photographerPrintWorkspace')||!mode;
    if(blocked){bar?.remove();app?.classList.remove('pb698ContextBarActive','pb698DesignContext','pb698AiContext','pb698GalleryContext');return}
    if(!bar){bar=document.createElement('div');bar.id='pb698PhotographerContextBar';bar.setAttribute('role','navigation')}
    if(bar.parentElement!==app||bar.previousElementSibling!==h)h.insertAdjacentElement('afterend',bar);
    const sig=`${mode}|${modelCount()}|${filterActive()?1:0}|${gridButtons().map(x=>x.classList.contains('active')?1:0).join('')}|${aiState()}`;
    if(bar.dataset.sig!==sig){bar.dataset.sig=sig;bar.innerHTML=markup(mode);bind(bar)}
    app.classList.add('pb698ContextBarActive');app.classList.toggle('pb698DesignContext',mode==='album'||mode==='instagram');app.classList.toggle('pb698AiContext',mode==='ai');app.classList.toggle('pb698GalleryContext',mode==='gallery');
  }

  function ensurePrintActions(){
    const app=main(),lab=qs('.photographerMain.photographerPrintWorkspace .photographerPrintModeHeader .photographerPrintTopLab'),archive=qs('.photographerPrintModeUtilityCluster .photographerPrintCommonAction.archive'),finance=qs('.photographerPrintModeUtilityCluster .photographerPrintCommonAction.finance');let w=qs('#pb698PrintBarActions');
    if(!mobile()||!app?.classList.contains('photographerPrintWorkspace')||!lab||!archive||!finance){w?.remove();return}
    if(!w){w=document.createElement('div');w.id='pb698PrintBarActions';w.innerHTML='<button data-pb698-print="archive">آرشیو</button><button data-pb698-print="finance">فاکتور</button>';w.onclick=e=>{const b=e.target.closest?.('[data-pb698-print]');if(!b)return;e.preventDefault();qs(`.photographerPrintModeUtilityCluster .photographerPrintCommonAction.${b.dataset.pb698Print}`)?.click();after()};document.body.appendChild(w)}
    const r=lab.getBoundingClientRect();w.style.top=`${Math.round(r.top+6)}px`;w.style.left='8px';w.style.height=`${Math.max(28,Math.round(r.height-12))}px`;qs('[data-pb698-print="archive"]',w)?.classList.toggle('active',archive.classList.contains('active'));qs('[data-pb698-print="finance"]',w)?.classList.toggle('active',finance.classList.contains('active'));
  }

  function ensureLoader(mode){
    let l=qs('#pb698CatalogLoader');
    if(!mobile()||!(mode==='album'||mode==='instagram')){l?.remove();return}
    const area=qs('.photographerMain>.photographerRolePageScrollArea');if(!area)return;
    const native=qs('.photographerAlbumDesignCatalog .albumDesignSavedLoading'),cards=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard'),empty=qs('.photographerAlbumDesignCatalog .albumDesignNoSavedModels');
    let waiting=!!native||(!cards.length&&!empty),text=mode==='instagram'?'در حال بارگذاری طرح‌های اینستاگرام…':'در حال بارگذاری طرح‌ها…';
    const imgs=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard img').slice(0,4);
    imgs.forEach((img,i)=>{img.loading=i<2?'eager':'lazy';img.decoding='async';try{img.fetchPriority=i<2?'high':'low'}catch{};if(!img.complete){waiting=true;img.addEventListener('load',schedule,{once:true});img.addEventListener('error',schedule,{once:true})}});
    if(!waiting){l?.remove();return}
    if(!l){l=document.createElement('div');l.id='pb698CatalogLoader';l.className='pb698CatalogLoader';l.setAttribute('role','status');area.prepend(l)}l.textContent=text;
  }

  function sync(){
    removeOld();if(!mobile()){qs('#pb698PhotographerContextBar')?.remove();qs('#pb698PrintBarActions')?.remove();return}
    const h=header(),mode=route();ensureHeaderActions(h);ensureContext(h);ensurePrintActions();ensureLoader(mode);syncPageLoader();lastRoute=mode;
  }

  const mo=new MutationObserver(schedule);
  const start=()=>{if(document.body)mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});schedule();if(!poll)poll=setInterval(schedule,450)};
  const wrap=n=>{const o=history[n];if(o.__pb698)return;const f=function(...a){const before=location.href,r=o.apply(this,a);if(location.href!==before&&!pageLoad.active)showPageLoader(currentPageLabel(),{requireChange:false,minMs:260,maxMs:4200});schedule();setTimeout(schedule,40);return r};f.__pb698=true;history[n]=f};
  try{wrap('pushState');wrap('replaceState')}catch{}
  addEventListener('popstate',()=>{showPageLoader(currentPageLabel(),{requireChange:false,minMs:260,maxMs:4200});schedule()},{passive:true});addEventListener('pageshow',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  document.addEventListener('pointerdown',e=>{if(!mobile())return;const b=e.target?.closest?.('.photographerBottomAppNav button,.photographerPrintModeNav>.rolePrimaryAction,#storeSectionNavV673 [data-store-panel]');if(!b)return;const label=b.getAttribute('aria-label')||b.querySelector?.('em')?.textContent||b.textContent||currentPageLabel();showPageLoader(label.trim(),{requireChange:true,minMs:320,maxMs:5200});document.documentElement.classList.add('pb698FastNavigate');setTimeout(()=>document.documentElement.classList.remove('pb698FastNavigate'),240)},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v698 hard mobile chrome active');
})();
