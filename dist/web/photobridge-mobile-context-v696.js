/* PhotoBridge v696 — persistent mobile context/header synchronizer. */
(()=>{
  'use strict';
  const MOBILE='(max-width: 820px)';
  const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const mobile=()=>{try{return matchMedia(MOBILE).matches}catch{return innerWidth<=820}};
  const main=()=>qs('.photographerMain');
  const header=()=>qs('.photographerMain>.unifiedRoleHeader.photographerHeaderRefined');
  let raf=0,lastRoute='',poll=0;
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
    ['pb693GlobalInviteButton','pb694HeaderInviteButton','pb695HeaderInviteButton','pb694PhotographerContextBar','pb695PhotographerContextBar','pb694PrintBarActions','pb695PrintBarActions','pb695CatalogLoader'].forEach(id=>qs('#'+id)?.remove());
    const app=main();
    if(app)for(const c of [...app.classList])if(/^pb69[345](ContextBarActive|DesignContext|AiContext|GalleryContext)$/.test(c))app.classList.remove(c);
  }

  function ensureHeaderActions(h){
    if(!mobile()||!h)return;
    const row=qs('.photographerMobileHeaderQuickActions',h);if(!row)return;
    qsa('.photographerMobileAiInviteRow').forEach(x=>x.remove());
    let settings=qs('.mobileHeaderSettings',row);
    if(!settings){
      settings=document.createElement('button');settings.id='pb696HeaderSettingsButton';settings.className='mobileHeaderSettings';settings.type='button';settings.innerHTML='<span aria-hidden="true">⚙</span>';settings.title='تنظیمات عکاسی';settings.setAttribute('aria-label','تنظیمات عکاسی');
      settings.onclick=e=>{e.preventDefault();location.href='/photographer/settings'};
      const wallet=qs('.mobileHeaderWallet',row);wallet?row.insertBefore(settings,wallet):row.append(settings);
    }
    let invite=qs('.mobileHeaderInvite',row);
    if(!invite){
      invite=document.createElement('button');invite.id='pb696HeaderInviteButton';invite.className='mobileHeaderInvite';invite.type='button';invite.textContent='دعوت همکار';invite.title='دعوت همکار';invite.setAttribute('aria-label','دعوت همکار');invite.onclick=e=>{e.preventDefault();location.href='/photographer/settings/invites'};
      const wallet=qs('.mobileHeaderWallet',row);wallet?row.insertBefore(invite,wallet):row.append(invite);
    }
  }

  function filterIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke-width="2" stroke-linecap="round"/></svg>'}
  function gridButtons(){const t=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar');const a=t?qsa('.albumDesignMobileGridToggle button',t):[];return a.length>=2?a:qsa('.photographerAlbumDesignCatalog .albumDesignMobilePicker .albumDesignMobileGridToggle button').slice(0,2)}
  function modelCount(){const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar>b');if(b?.textContent?.trim())return b.textContent.trim();const n=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard').length;return n?`${n.toLocaleString('fa-IR')} مدل`:''}
  function filterActive(){const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter, .photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton');return !!b?.classList.contains('pb603FilterActive')}
  function aiState(){return qsa('.photographerAiSectionNav>button').slice(0,2).map(x=>x.classList.contains('active')?1:0).join('')}
  function markup(mode){
    if(mode==='ai'){const a=qsa('.photographerAiSectionNav>button');return `<div class="pb696ContextTitle"><b>هوش مصنوعی</b></div><div class="pb696ContextActions"><button data-pb696-ai="0" class="${a[0]?.classList.contains('active')?'active':''}">روتوش صورت AI</button><button data-pb696-ai="1" class="${a[1]?.classList.contains('active')?'active':''}">سایر ابزار</button></div>`}
    if(mode==='gallery')return '<div class="pb696ContextTitle"><b>گالری مشتریان</b></div><div class="pb696ContextActions"><button data-pb696-gallery-new="1">＋ گالری جدید</button></div>';
    if(mode==='album'||mode==='instagram'){
      const g=gridButtons(),two=g[0]?.classList.contains('active'),one=g[1]?.classList.contains('active'),count=modelCount(),title=mode==='instagram'?'طراحی اینستاگرام':'طراحی آلبوم';
      return `<div class="pb696ContextTitle"><b>${title}</b>${mode==='instagram'?'<span class="pb696FreeBadge">رایگان</span>':''}${count?`<span class="pb696ModelCount">${count}</span>`:''}</div><div class="pb696ContextActions"><button class="pb696Square pb696FilterButton ${filterActive()?'active':''}" data-pb696-filter="1" aria-label="فیلتر">${filterIcon()}</button><button class="pb696Square ${two?'active':''}" data-pb696-grid="0" aria-label="دو ستونه">▦</button><button class="pb696Square ${one?'active':''}" data-pb696-grid="1" aria-label="تک ستونه">▤</button></div>`;
    }
    return '';
  }
  function bind(bar){
    qsa('[data-pb696-ai]',bar).forEach(b=>b.onclick=()=>{qsa('.photographerAiSectionNav>button')[Number(b.dataset.pb696Ai)]?.click();after()});
    qs('[data-pb696-gallery-new]',bar)?.addEventListener('click',()=>{qs('.clientGalleryListHead>button.primary,.clientGalleryEmpty>button.primary')?.click();after()});
    qs('[data-pb696-filter]',bar)?.addEventListener('click',()=>{qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter,.photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton')?.click();after()});
    qsa('[data-pb696-grid]',bar).forEach(b=>b.onclick=()=>{gridButtons()[Number(b.dataset.pb696Grid)]?.click();after()});
  }
  function ensureContext(h){
    const app=main(),mode=route();let bar=qs('#pb696PhotographerContextBar');
    const blocked=!mobile()||!app||!h||app.classList.contains('photographerPrintWorkspace')||!mode;
    if(blocked){bar?.remove();app?.classList.remove('pb696ContextBarActive','pb696DesignContext','pb696AiContext','pb696GalleryContext');return}
    if(!bar){bar=document.createElement('div');bar.id='pb696PhotographerContextBar';bar.setAttribute('role','navigation')}
    if(bar.parentElement!==app||bar.previousElementSibling!==h)h.insertAdjacentElement('afterend',bar);
    const sig=`${mode}|${modelCount()}|${filterActive()?1:0}|${gridButtons().map(x=>x.classList.contains('active')?1:0).join('')}|${aiState()}`;
    if(bar.dataset.sig!==sig){bar.dataset.sig=sig;bar.innerHTML=markup(mode);bind(bar)}
    app.classList.add('pb696ContextBarActive');app.classList.toggle('pb696DesignContext',mode==='album'||mode==='instagram');app.classList.toggle('pb696AiContext',mode==='ai');app.classList.toggle('pb696GalleryContext',mode==='gallery');
  }

  function ensurePrintActions(){
    const app=main(),lab=qs('.photographerMain.photographerPrintWorkspace .photographerPrintModeHeader .photographerPrintTopLab'),archive=qs('.photographerPrintModeUtilityCluster .photographerPrintCommonAction.archive'),finance=qs('.photographerPrintModeUtilityCluster .photographerPrintCommonAction.finance');let w=qs('#pb696PrintBarActions');
    if(!mobile()||!app?.classList.contains('photographerPrintWorkspace')||!lab||!archive||!finance){w?.remove();return}
    if(!w){w=document.createElement('div');w.id='pb696PrintBarActions';w.innerHTML='<button data-pb696-print="archive">آرشیو</button><button data-pb696-print="finance">فاکتور</button>';w.onclick=e=>{const b=e.target.closest?.('[data-pb696-print]');if(!b)return;e.preventDefault();qs(`.photographerPrintModeUtilityCluster .photographerPrintCommonAction.${b.dataset.pb696Print}`)?.click();after()};document.body.appendChild(w)}
    const r=lab.getBoundingClientRect();w.style.top=`${Math.round(r.top+6)}px`;w.style.left='8px';w.style.height=`${Math.max(28,Math.round(r.height-12))}px`;qs('[data-pb696-print="archive"]',w)?.classList.toggle('active',archive.classList.contains('active'));qs('[data-pb696-print="finance"]',w)?.classList.toggle('active',finance.classList.contains('active'));
  }

  function ensureLoader(mode){
    let l=qs('#pb696CatalogLoader');
    if(!mobile()||!(mode==='album'||mode==='instagram')){l?.remove();return}
    const area=qs('.photographerMain>.photographerRolePageScrollArea');if(!area)return;
    const native=qs('.photographerAlbumDesignCatalog .albumDesignSavedLoading'),cards=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard'),empty=qs('.photographerAlbumDesignCatalog .albumDesignNoSavedModels');
    let waiting=!!native||(!cards.length&&!empty),text=mode==='instagram'?'در حال بارگذاری طرح‌های اینستاگرام…':'در حال بارگذاری طرح‌ها…';
    const imgs=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard img').slice(0,4);
    imgs.forEach((img,i)=>{img.loading=i<2?'eager':'lazy';img.decoding='async';try{img.fetchPriority=i<2?'high':'low'}catch{};if(!img.complete){waiting=true;img.addEventListener('load',schedule,{once:true});img.addEventListener('error',schedule,{once:true})}});
    if(!waiting){l?.remove();return}
    if(!l){l=document.createElement('div');l.id='pb696CatalogLoader';l.className='pb696CatalogLoader';l.setAttribute('role','status');area.prepend(l)}l.textContent=text;
  }

  function sync(){
    removeOld();if(!mobile()){qs('#pb696PhotographerContextBar')?.remove();qs('#pb696PrintBarActions')?.remove();return}
    const h=header(),mode=route();ensureHeaderActions(h);ensureContext(h);ensurePrintActions();ensureLoader(mode);lastRoute=mode;
  }

  const mo=new MutationObserver(schedule);
  const start=()=>{if(document.body)mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});schedule();if(!poll)poll=setInterval(schedule,450)};
  const wrap=n=>{const o=history[n];if(o.__pb696)return;const f=function(...a){const r=o.apply(this,a);schedule();setTimeout(schedule,40);return r};f.__pb696=true;history[n]=f};
  try{wrap('pushState');wrap('replaceState')}catch{}
  addEventListener('popstate',schedule,{passive:true});addEventListener('pageshow',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  document.addEventListener('pointerdown',e=>{if(!mobile())return;const b=e.target?.closest?.('.photographerBottomAppNav button');if(!b)return;document.documentElement.classList.add('pb696FastNavigate');setTimeout(()=>document.documentElement.classList.remove('pb696FastNavigate'),220)},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v696 hard mobile chrome active');
})();
