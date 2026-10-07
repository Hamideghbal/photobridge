/* PhotoBridge v0.17.689 / mobile shell v693 — non-blocking mobile context strip runtime.
   No polling. Route hooks + header ResizeObserver only. */
(()=>{
  'use strict';
  const VERSION='v693';
  const MOBILE='(max-width: 820px)';
  let resizeObserver=null;
  let observedHeader=null;
  let transientObserver=null;
  let transientTimer=0;
  let scheduled=false;

  const mobile=()=>{try{return window.matchMedia(MOBILE).matches}catch{return innerWidth<=820}};
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const route=()=>{
    const path=location.pathname.replace(/\/+$/,'')||'/';
    if(/^\/photographer\/ai(?:\/|$)/.test(path))return 'ai';
    if(path==='/photographer/gallery')return 'gallery';
    if(/^\/photographer\/album-design(?:\/|$)/.test(path))return new URLSearchParams(location.search).get('pb_mode')==='instagram'?'instagram':'album';
    return '';
  };
  const header=()=>qs('.photographerMain>.unifiedRoleHeader.photographerHeaderRefined, #photographerStoreRoleHeader');
  const main=()=>qs('.photographerMain');

  function contextSourceReady(mode){
    if(!mode)return true;
    if(mode==='ai')return qsa('.photographerAiSectionNav>button').length>=2;
    if(mode==='gallery')return !!qs('.clientGalleryListHead, .clientGalleryWorkspace');
    if(mode==='album'||mode==='instagram')return !!qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar, .photographerAlbumDesignCatalog .albumDesignModelGrid');
    return true;
  }
  function ensureTransientObserver(){
    if(transientObserver||!document.body)return;
    transientObserver=new MutationObserver(()=>{
      const h=header(),mode=route();
      scheduleSync();
      if(h&&contextSourceReady(mode)){transientObserver?.disconnect();transientObserver=null;if(transientTimer)clearTimeout(transientTimer);transientTimer=0}
    });
    transientObserver.observe(qs('#root')||document.body,{childList:true,subtree:true});
    transientTimer=setTimeout(()=>{transientObserver?.disconnect();transientObserver=null;transientTimer=0;scheduleSync()},2200);
  }

  function scheduleSync(){
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;sync()});
  }
  function afterReact(){requestAnimationFrame(()=>requestAnimationFrame(scheduleSync));setTimeout(scheduleSync,70)}

  function ensureInvite(h){
    let btn=qs('#pb693GlobalInviteButton');
    if(!mobile()||!h){btn&&btn.remove();return}
    if(!btn){
      btn=document.createElement('button');
      btn.id='pb693GlobalInviteButton';btn.type='button';btn.textContent='دعوت همکار';btn.setAttribute('aria-label','دعوت همکار');
      btn.addEventListener('click',ev=>{
        ev.preventDefault();ev.stopPropagation();
        const native=qs('.photographerInviteHeaderBtn');
        if(native){native.click();return}
        location.href='/photographer/settings/invites';
      });
      document.body.appendChild(btn);
    }
    const r=h.getBoundingClientRect();
    const y=Math.max(2,Math.round(r.bottom-22));
    btn.style.top=`${y}px`;
  }

  function filterIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke-width="2" stroke-linecap="round"/></svg>'}
  function clickAlbumFilter(){
    const source=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter, .photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton');
    source&&source.click();afterReact();
  }
  function albumGridButtons(){
    const toolbar=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar');
    const fromToolbar=toolbar?qsa('.albumDesignMobileGridToggle button',toolbar):[];
    if(fromToolbar.length>=2)return fromToolbar;
    return qsa('.photographerAlbumDesignCatalog .albumDesignMobilePicker .albumDesignMobileGridToggle button').slice(0,2);
  }
  function clickAlbumGrid(index){const b=albumGridButtons()[index];b&&b.click();afterReact()}
  function albumCount(){
    const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar>b');
    if(b&&b.textContent?.trim())return b.textContent.trim();
    const n=qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid>.albumDesignModelCard').length;
    return n?`${n.toLocaleString('fa-IR')} مدل`:'';
  }
  function albumFilterActive(){const b=qs('.photographerAlbumDesignCatalog .albumDesignModelViewToolbar .albumDesignMobileTopFilter, .photographerAlbumDesignCatalog .albumDesignCatalogFilters .pb599AlbumFilterButton');return !!b?.classList.contains('pb603FilterActive')}

  function contextMarkup(mode){
    if(mode==='ai'){
      const src=qsa('.photographerAiSectionNav>button');
      const retouch=src[0]?.classList.contains('active'),tools=src[1]?.classList.contains('active');
      return `<div class="pb693ContextTitle"><small>هوش مصنوعی</small><b>ابزارهای AI</b></div><div class="pb693ContextActions"><button data-pb693-ai="0" class="${retouch?'active':''}">روتوش صورت AI</button><button data-pb693-ai="1" class="${tools?'active':''}">سایر ابزار</button></div>`;
    }
    if(mode==='gallery')return `<div class="pb693ContextTitle"><small>PhotoBridge</small><b>گالری مشتریان</b></div><div class="pb693ContextActions"><button data-pb693-gallery-new="1">＋ گالری جدید</button></div>`;
    if(mode==='album'||mode==='instagram'){
      const buttons=albumGridButtons(),two=buttons[0]?.classList.contains('active'),one=buttons[1]?.classList.contains('active'),count=albumCount();
      return `<div class="pb693ContextTitle"><small>${mode==='instagram'?'اینستاگرام':'طراحی'}</small><b>${mode==='instagram'?'طراحی اینستاگرام':'طراحی آلبوم'}</b>${count?`<span class="pb693ModelCount">${count}</span>`:''}</div><div class="pb693ContextActions"><button class="pb693Square pb693FilterButton ${albumFilterActive()?'active':''}" data-pb693-filter="1" aria-label="فیلتر مدل‌ها">${filterIcon()}</button><button class="pb693Square ${two?'active':''}" data-pb693-grid="0" aria-label="نمای دو ستونه">▦</button><button class="pb693Square ${one?'active':''}" data-pb693-grid="1" aria-label="نمای تک ستونه">▤</button></div>`;
    }
    return '';
  }

  function bindContext(bar,mode){
    qsa('[data-pb693-ai]',bar).forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.getAttribute('data-pb693-ai'));qsa('.photographerAiSectionNav>button')[i]?.click();afterReact()}));
    qs('[data-pb693-gallery-new]',bar)?.addEventListener('click',()=>{qs('.clientGalleryListHead>button.primary, .clientGalleryEmpty>button.primary')?.click();afterReact()});
    qs('[data-pb693-filter]',bar)?.addEventListener('click',clickAlbumFilter);
    qsa('[data-pb693-grid]',bar).forEach(btn=>btn.addEventListener('click',()=>clickAlbumGrid(Number(btn.getAttribute('data-pb693-grid')))));
  }

  function ensureContext(h,m){
    let bar=qs('#pb693PhotographerContextBar');
    const app=main();
    const mode=route();
    const blocked=!mobile()||!h||!app||app.classList.contains('photographerPrintWorkspace')||!mode;
    if(blocked){bar&&bar.remove();app?.classList.remove('pb693ContextBarActive','pb693DesignContext','pb693AiContext','pb693GalleryContext');return}
    if(!bar){bar=document.createElement('div');bar.id='pb693PhotographerContextBar';bar.setAttribute('role','navigation');document.body.appendChild(bar)}
    const r=h.getBoundingClientRect();bar.style.top=`${Math.round(r.bottom)}px`;
    const signature=`${mode}|${albumCount()}|${albumFilterActive()?1:0}|${albumGridButtons().map(x=>x.classList.contains('active')?1:0).join('')}`;
    if(bar.dataset.signature!==signature){bar.dataset.signature=signature;bar.dataset.mode=mode;bar.innerHTML=contextMarkup(mode);bindContext(bar,mode)}
    app.classList.add('pb693ContextBarActive');
    app.classList.toggle('pb693DesignContext',mode==='album'||mode==='instagram');
    app.classList.toggle('pb693AiContext',mode==='ai');
    app.classList.toggle('pb693GalleryContext',mode==='gallery');
  }

  function tuneCatalog(){
    if(!mobile()||!/^\/photographer\/album-design(?:\/|$)/.test(location.pathname))return;
    const run=()=>qsa('.photographerAlbumDesignCatalog .albumDesignModelGrid img').forEach(img=>{img.loading='lazy';img.decoding='async';try{img.fetchPriority='low'}catch{}});
    if('requestIdleCallback'in window)window.requestIdleCallback(run,{timeout:180});else setTimeout(run,40);
  }

  function observeHeader(h){
    if(observedHeader===h)return;
    resizeObserver?.disconnect();observedHeader=h;
    if(h&&'ResizeObserver'in window){resizeObserver=new ResizeObserver(scheduleSync);resizeObserver.observe(h)}
  }

  function sync(){
    const h=header(),mode=route();if(!h||!contextSourceReady(mode))ensureTransientObserver();observeHeader(h);ensureInvite(h);ensureContext(h,main());tuneCatalog();
    if(!/^\/photographer\/album-design(?:\/|$)/.test(location.pathname))document.documentElement.classList.remove('pb693FastNavigate');
  }

  /* Hide a heavy catalog on pointer-down before React handles the navigation click.
     This releases paint/layout work immediately; route changes themselves stay synchronous. */
  document.addEventListener('pointerdown',ev=>{
    if(!mobile())return;
    const target=ev.target?.closest?.('.photographerBottomAppNav button');
    if(!target||!qs('.photographerAlbumDesignCatalog'))return;
    document.documentElement.classList.add('pb693FastNavigate');
  },true);

  const wrapHistory=name=>{const original=history[name];if(original.__pb693)return;const wrapped=function(...args){const out=original.apply(this,args);scheduleSync();return out};wrapped.__pb693=true;history[name]=wrapped};
  try{wrapHistory('pushState');wrapHistory('replaceState')}catch{}
  window.addEventListener('popstate',scheduleSync,{passive:true});
  window.addEventListener('pageshow',scheduleSync,{passive:true});
  window.addEventListener('resize',scheduleSync,{passive:true});
  document.addEventListener('DOMContentLoaded',scheduleSync,{once:true});
  if(document.readyState!=='loading')scheduleSync();
  console.info('[PhotoBridge] mobile context bars + nonblocking design catalog',VERSION);
})();
