/* PhotoBridge v790 — mobile finance chrome + gallery order modal/back + Iran network hint. */
(()=>{
  'use strict';
  if(window.__PB790_RUNTIME_FIX__)return;
  window.__PB790_RUNTIME_FIX__=true;

  const mq=window.matchMedia('(max-width:820px)');
  const qs=(s,r=document)=>r&&r.querySelector?r.querySelector(s):null;
  const qsa=(s,r=document)=>r&&r.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const text=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  const mobile=()=>mq.matches;
  const isPublicGallery=()=>location.pathname.startsWith('/g/');
  const isPhotographerGallery=()=>location.pathname.startsWith('/photographer/gallery');
  let raf=0;

  function clearScrollLocks(el){
    if(!(el instanceof HTMLElement))return;
    ['height','min-height','max-height','overflow','overflow-y','overflow-x','touch-action','overscroll-behavior','overscroll-behavior-y','scroll-behavior','position','top','right','bottom','left','inset'].forEach(p=>el.style.removeProperty(p));
  }

  /* -------- Photographer finance opened from Print -------- */
  function originalFinanceButton(label){
    return qsa('.financeWorkspace .financeSectionTabs button').find(b=>text(b)===label)||null;
  }
  function ensureFinanceChrome(main,finance){
    const nav=qs('.photographerPrintModeNav',main);
    if(!nav)return;
    let chrome=qs('#pb790-finance-chrome',nav);
    if(!chrome){
      chrome=document.createElement('section');
      chrome.id='pb790-finance-chrome';
      chrome.className='pb790FinanceChrome';
      chrome.innerHTML='<div class="pb790FinanceTitle">فاکتورها و حساب مالی</div><div class="pb790FinanceTabs"><button type="button" data-fin="فاکتورها">فاکتورها</button><button type="button" data-fin="دریافت‌ها">دریافت‌ها</button><button type="button" data-fin="حساب معین">حساب معین</button></div>';
      chrome.addEventListener('click',e=>{
        const btn=e.target?.closest?.('[data-fin]');
        if(!btn)return;
        const real=originalFinanceButton(String(btn.dataset.fin||''));
        if(real){real.click();setTimeout(schedule,0);setTimeout(schedule,80)}
      });
      nav.appendChild(chrome);
    }
    qsa('[data-fin]',chrome).forEach(btn=>{
      const real=originalFinanceButton(String(btn.dataset.fin||''));
      btn.classList.toggle('active',Boolean(real?.classList.contains('active')));
      btn.disabled=Boolean(real?.disabled);
    });
    nav.classList.add('pb790FinanceNav');
    finance.classList.add('pb790FinanceWorkspace');
  }
  function normalizeFinance(){
    if(!mobile())return;
    const finance=qs('.financeWorkspace');
    if(!finance)return;
    const main=finance.closest('.photographerMain');
    const area=finance.closest('.photographerRolePageScrollArea');
    if(!(main instanceof HTMLElement)||!(area instanceof HTMLElement))return;

    document.body.classList.remove('pb737-mobile-print-active');
    main.dataset.pb790Finance='1';
    area.dataset.pb790Finance='1';
    finance.dataset.pb790Finance='1';
    main.classList.remove('pb762Composing','pb737MobilePrintRedesign','pb766PageLeaving','pb766ComposerEnter','pb767ComposerEnter','pb768ComposerEnter');
    clearScrollLocks(area);clearScrollLocks(finance);
    ensureFinanceChrome(main,finance);

    requestAnimationFrame(()=>{
      const header=qs('.photographerPrintModeHeader',main);
      const nav=qs('.photographerPrintModeNav',main);
      const bottomBar=qs('.photographerMobileUtilityRail,.mobileRoleUtilityRail');
      const hr=header?.getBoundingClientRect?.();
      const nr=nav?.getBoundingClientRect?.();
      const br=bottomBar?.getBoundingClientRect?.();
      const top=Math.max(0,Math.ceil(Math.max(Number(hr?.bottom||0),Number(nr?.bottom||0))));
      const bottom=Math.max(0,Math.ceil(br&&br.top<innerHeight?innerHeight-br.top:76));
      main.style.setProperty('--pb790-finance-top',`${top}px`);
      main.style.setProperty('--pb790-finance-bottom',`${bottom}px`);
    });
  }
  function clearFinanceMarker(){
    qsa('.photographerMain[data-pb790-finance]').forEach(main=>{
      if(qs('.financeWorkspace',main))return;
      delete main.dataset.pb790Finance;
      main.style.removeProperty('--pb790-finance-top');main.style.removeProperty('--pb790-finance-bottom');
      qs('#pb790-finance-chrome',main)?.remove();
      qs('.photographerPrintModeNav',main)?.classList.remove('pb790FinanceNav');
    });
  }

  /* -------- Gallery manager -------- */
  function normalizeGalleryManager(){
    if(!isPhotographerGallery())return;
    const area=qs('.photographerRolePageScrollArea');
    if(area instanceof HTMLElement){area.dataset.pb790Gallery='1';clearScrollLocks(area)}
    const manager=qs('.clientGalleryManager');
    if(manager instanceof HTMLElement&&!manager.dataset.pb790History){
      manager.dataset.pb790History='1';
      try{
        if(!history.state?.pb790GalleryManager)history.pushState({...history.state,pb790GalleryManager:true},'',location.href);
      }catch{}
    }
    const tariff=qs('.clientGalleryTariffTableModal');
    if(tariff){
      tariff.dataset.pb790Tariff='1';
      const modal=tariff.closest('.modal');if(modal instanceof HTMLElement)modal.dataset.pb790Tariff='1';
      const content=tariff.closest('.modalContent');if(content instanceof HTMLElement)content.dataset.pb790Tariff='1';
    }
  }
  addEventListener('popstate',()=>{
    const manager=qs('.clientGalleryManager');
    if(manager&&isPhotographerGallery()){
      const back=qsa('button',manager).find(b=>/بازگشت به گالری/.test(text(b)));
      if(back){setTimeout(()=>back.click(),0);return}
    }
    schedule();
  });

  /* -------- Public customer gallery -------- */
  function closePrintModal(){
    qsa('.clientGalleryPublicMedia.pb790OrderOpen').forEach(a=>a.classList.remove('pb790OrderOpen'));
    qs('#pb790-order-backdrop')?.remove();
    qs('#pb790-order-close')?.remove();
  }
  function openPrintModal(article){
    if(!(article instanceof HTMLElement))return;
    const panel=qs('.clientGalleryOptionalOrdering',article);
    if(!panel)return;
    closePrintModal();
    article.classList.add('pb790OrderOpen');
    const backdrop=document.createElement('button');
    backdrop.id='pb790-order-backdrop';backdrop.type='button';backdrop.className='pb790OrderBackdrop';backdrop.setAttribute('aria-label','بستن سفارش چاپ');
    backdrop.addEventListener('click',closePrintModal);
    const close=document.createElement('button');
    close.id='pb790-order-close';close.type='button';close.className='pb790OrderClose';close.textContent='×';close.setAttribute('aria-label','بستن');
    close.addEventListener('click',closePrintModal);
    document.body.append(backdrop,close);
  }
  function waitAndOpenPrint(article,attempt=0){
    const panel=qs('.clientGalleryOptionalOrdering',article);
    if(panel){openPrintModal(article);return}
    if(attempt<16)setTimeout(()=>waitAndOpenPrint(article,attempt+1),50);
  }
  function selectedArticles(){return qsa('.clientGalleryPublicMedia').filter(a=>qs('.clientGalleryBaseSelection input[type="checkbox"]:checked',a))}
  function orderSummary(article){
    const panel=qs('.clientGalleryOptionalOrdering',article);if(!panel)return '';
    const bits=[];
    qsa('label.picked span',panel).forEach(n=>{const v=text(n);if(v)bits.push(v)});
    qsa('.clientGalleryPublicPrint',panel).forEach(row=>{const n=text(qs('span',row));const v=text(qs('.pbSelectButton,.pbSelectTrigger,button',row));if(v&&!/^انتخاب/.test(v))bits.push(n?`${n}: ${v}`:v)});
    const qty=text(qs('.clientGalleryQuantityControl b',panel));if(qty)bits.push(`تعداد ${qty}`);
    return [...new Set(bits)].filter(Boolean).join(' · ');
  }
  function orderedArticles(){
    return selectedArticles().filter(a=>{
      const p=qs('.clientGalleryOptionalOrdering',a);if(!p)return false;
      if(qs('input[type="checkbox"]:checked',p))return true;
      return qsa('.pbSelectButton,.pbSelectTrigger,select',p).some(x=>{const v=text(x);return v&&!/^انتخاب/.test(v)});
    });
  }
  function updateCart(){
    const page=qs('.publicClientGalleryPage.unlocked');if(!page)return;
    const btn=qs('#pb790-gallery-cart',page);if(!btn)return;
    const n=orderedArticles().length||selectedArticles().length;
    const badge=qs('.pb790CartCount',btn);if(badge)badge.textContent=Number(n).toLocaleString('fa-IR');
  }
  function openCart(){
    qs('#pb790-cart-layer')?.remove();
    const ordered=orderedArticles(), selected=selectedArticles(), items=ordered.length?ordered:selected;
    const status=qs('.clientGallerySelectionStatus.priced');
    const summary=text(qs('.clientGallerySelectionStatusMain small',status))||'انتخاب‌ها و سفارش‌های شما';
    const layer=document.createElement('div');layer.id='pb790-cart-layer';layer.className='pb790CartLayer';
    const rows=items.map((a,i)=>{
      const src=qs('.clientGalleryPublicMediaView img',a)?.getAttribute('src')||'';
      const detail=orderSummary(a)||'عکس انتخاب‌شده';
      return `<div class="pb790CartRow"><img src="${src.replace(/"/g,'&quot;')}" alt=""><div><b>عکس ${Number(i+1).toLocaleString('fa-IR')}</b><small>${detail.replace(/[<>]/g,'')}</small></div><button type="button" data-edit="${i}">ویرایش</button></div>`;
    }).join('');
    layer.innerHTML=`<section class="pb790CartCard" role="dialog" aria-modal="true"><header><div><b>سبد خرید سفارش چاپ</b><small>${summary.replace(/[<>]/g,'')}</small></div><button class="pb790CartClose" type="button">×</button></header><div class="pb790CartRows">${rows||'<div class="pb790CartEmpty">هنوز سفارشی به سبد خرید اضافه نشده است.</div>'}</div><footer><button class="pb790CartContinue" type="button">ادامه انتخاب</button><button class="primary pb790CartFinalize" type="button" ${items.length?'':'disabled'}>ثبت نهایی و مشاهده فاکتور</button></footer></section>`;
    layer.addEventListener('click',e=>{if(e.target===layer)layer.remove()});
    qs('.pb790CartClose',layer)?.addEventListener('click',()=>layer.remove());
    qs('.pb790CartContinue',layer)?.addEventListener('click',()=>layer.remove());
    qsa('[data-edit]',layer).forEach(btn=>btn.addEventListener('click',()=>{const a=items[Number(btn.dataset.edit)];layer.remove();if(a){a.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>waitAndOpenPrint(a),260)}}));
    qs('.pb790CartFinalize',layer)?.addEventListener('click',()=>{const real=qsa('.clientGallerySelectionStatusActions button.primary').find(b=>/پایان سفارش|پایان انتخاب/.test(text(b)));if(real&&!real.disabled){layer.remove();real.click()}});
    document.body.appendChild(layer);
  }
  function enhancePublicGallery(){
    if(isPublicGallery())return; /* v792 owns public-gallery DOM safely; do not append children inside React-managed nodes. */
    if(!isPublicGallery())return;
    const page=qs('.publicClientGalleryPage.unlocked');if(!page)return;
    page.classList.add('pb790CustomerGallery');
    qs('.clientGalleryMobileSingleViewHint',page)?.remove();
    const header=qs('.clientGalleryPublicHeader',page);if(header)header.classList.add('pb790Header');
    const hr=qs('.clientGalleryPublicHeaderRight',page);
    const priced=!!qs('.clientGallerySelectionStatus.priced',page);
    if(priced&&hr&&!qs('#pb790-gallery-cart',page)){
      qs('#pb789-gallery-cart',page)?.remove();
      const cart=document.createElement('button');cart.id='pb790-gallery-cart';cart.type='button';cart.className='pb790GalleryCart';cart.innerHTML='<span aria-hidden="true">🛒</span><b>سبد خرید</b><i class="pb790CartCount">۰</i>';cart.addEventListener('click',openCart);hr.prepend(cart);
    }
    qsa('.clientGalleryPublicMedia',page).forEach(article=>{
      article.classList.add('pb790PhotoCard');
      const interaction=qs('.clientGalleryPhotoInteraction',article);if(!interaction)return;
      interaction.classList.add('pb790PhotoActions');
      const base=qs('.clientGalleryBaseSelection',interaction);if(base)base.classList.add('pb790SelectionOverlay');
      if(priced&&!qs('.pb790PrintOrderButton',interaction)){
        qs('.pb789PrintOrderButton',interaction)?.remove();
        const b=document.createElement('button');b.type='button';b.className='pb790PrintOrderButton';b.textContent='سفارش چاپ';
        b.addEventListener('click',e=>{
          e.preventDefault();e.stopPropagation();
          const cb=qs('.clientGalleryBaseSelection input[type="checkbox"]',article);
          if(cb&&!cb.checked){cb.click();setTimeout(()=>waitAndOpenPrint(article),30)}else waitAndOpenPrint(article);
        });
        interaction.appendChild(b);
      }
    });
    updateCart();
  }

  document.addEventListener('click',e=>{
    if(isPublicGallery())return; /* v792 exclusively owns public gallery events. */
    if(e.target?.closest?.('.clientGalleryBaseSelection')){
      /* Legacy branch retained only for non-public compatibility. */
      closePrintModal();setTimeout(schedule,0);return;
    }
    if(e.target?.closest?.('.clientGalleryGridToggle'))setTimeout(schedule,0);
  },true);
  document.addEventListener('change',e=>{if(isPublicGallery())return;if(e.target?.closest?.('.clientGalleryPhotoInteraction'))setTimeout(schedule,0)},true);

  /* -------- Iran-only app network hint -------- */
  async function maybeWarnForeignIp(){
    if(!mobile())return;
    if(!/^\/(photographer|lab|rental|g\/)/.test(location.pathname))return;
    try{if(sessionStorage.getItem('pb790-network-checked')==='1')return;sessionStorage.setItem('pb790-network-checked','1')}catch{}
    try{
      const r=await fetch('/api/network/country',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return;
      const d=await r.json();
      if(!d||!d.country||String(d.country).toUpperCase()==='IR'||qs('#pb790-vpn-hint'))return;
      const sheet=document.createElement('aside');sheet.id='pb790-vpn-hint';sheet.className='pb790VpnHint';sheet.innerHTML='<div class="pb790VpnGrip"></div><div class="pb790VpnIcon">!</div><div class="pb790VpnCopy"><b>آی‌پی خارج از ایران تشخیص داده شد</b><p>اگر فیلترشکن روشن است، برای سرعت و پایداری بهتر PhotoBridge آن را خاموش کن و دوباره ادامه بده.</p></div><button type="button" class="pb790VpnOk">متوجه شدم</button><button type="button" class="pb790VpnClose" aria-label="بستن">×</button>';
      const close=()=>{sheet.classList.add('closing');setTimeout(()=>sheet.remove(),230)};
      qs('.pb790VpnOk',sheet)?.addEventListener('click',close);qs('.pb790VpnClose',sheet)?.addEventListener('click',close);
      document.body.appendChild(sheet);requestAnimationFrame(()=>sheet.classList.add('open'));
    }catch{}
  }

  function sync(){
    raf=0;clearFinanceMarker();normalizeFinance();normalizeGalleryManager();enhancePublicGallery();
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(sync)}
  const root=qs('#root');if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true});
  addEventListener('pageshow',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  mq.addEventListener?.('change',schedule);
  schedule();setTimeout(maybeWarnForeignIp,900);
  console.info('[PhotoBridge] v790 finance/gallery/network runtime active');
})();
