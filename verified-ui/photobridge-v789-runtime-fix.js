/* PhotoBridge v789 — runtime fixes that must exist in the shipped dist bundle.
   This patch intentionally works with the currently deployed compiled UI (v655 bundle)
   so gallery/finance fixes are not source-only. */
(()=>{
  'use strict';
  if(window.__PB789_RUNTIME_FIX__) return;
  window.__PB789_RUNTIME_FIX__=true;
  const mq=window.matchMedia('(max-width:820px)');
  let raf=0;

  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const qsa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const txt=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  const galleryPublic=()=>location.pathname.startsWith('/g/');
  const photographerGallery=()=>location.pathname.startsWith('/photographer/gallery');
  const mobile=()=>mq.matches;

  function clearInlineScrollLocks(el){
    if(!(el instanceof HTMLElement))return;
    for(const p of ['height','min-height','max-height','overflow','overflow-y','overflow-x','touch-action','overscroll-behavior','overscroll-behavior-y','scroll-behavior'])el.style.removeProperty(p);
  }

  function normalizeFinanceScroll(){
    if(!mobile())return;
    const finance=qs('.financeWorkspace');
    if(!finance)return;
    const area=finance.closest('.photographerRolePageScrollArea');
    const main=finance.closest('.photographerMain');
    document.body.classList.remove('pb737-mobile-print-active');
    if(main instanceof HTMLElement){
      main.classList.remove('pb762Composing','pb737MobilePrintRedesign','pb766PageLeaving','pb766ComposerEnter','pb767ComposerEnter');
      main.dataset.pb789Finance='1';
    }
    if(area instanceof HTMLElement){
      area.dataset.pb789Finance='1';
      clearInlineScrollLocks(area);
    }
    finance.dataset.pb789Finance='1';
    clearInlineScrollLocks(finance);
    const dock=qs('.financeNavDock',finance); if(dock instanceof HTMLElement)clearInlineScrollLocks(dock);
    const tabs=qs('.financeSectionTabs',finance); if(tabs instanceof HTMLElement)clearInlineScrollLocks(tabs);
  }

  function normalizeGalleryManager(){
    if(!photographerGallery())return;
    const area=qs('.photographerRolePageScrollArea');
    if(area instanceof HTMLElement){
      area.dataset.pb789Gallery='1';
      clearInlineScrollLocks(area);
    }
    qsa('.clientGalleryCreateForm,.clientGallerySettings').forEach(scope=>{
      qsa('label',scope).forEach(label=>{
        const t=txt(label);
        if(t.includes('سفارش چاپ و فاکتور')){
          const b=qs('b',label); if(b)b.textContent='فاکتور و سفارش چاپ';
        }
      });
    });
    const tariff=qs('.clientGalleryTariffTableModal');
    if(tariff){
      tariff.dataset.pb789Tariff='1';
      const modal=tariff.closest('.modal'); if(modal instanceof HTMLElement)modal.dataset.pb789Tariff='1';
      const content=tariff.closest('.modalContent'); if(content instanceof HTMLElement)content.dataset.pb789Tariff='1';
    }
  }

  function closeOrderModal(){
    qsa('.clientGalleryPublicMedia.pb789OrderOpen').forEach(n=>n.classList.remove('pb789OrderOpen'));
    document.getElementById('pb789-order-backdrop')?.remove();
    document.getElementById('pb789-order-close')?.remove();
  }

  function openOrderModal(article){
    if(!(article instanceof HTMLElement))return;
    closeOrderModal();
    article.classList.add('pb789OrderOpen');
    const backdrop=document.createElement('button');
    backdrop.type='button';backdrop.id='pb789-order-backdrop';backdrop.className='pb789OrderBackdrop';backdrop.setAttribute('aria-label','بستن سفارش چاپ');
    backdrop.addEventListener('click',closeOrderModal);
    const close=document.createElement('button');
    close.type='button';close.id='pb789-order-close';close.className='pb789OrderClose';close.textContent='×';close.setAttribute('aria-label','بستن');
    close.addEventListener('click',closeOrderModal);
    document.body.append(backdrop,close);
  }

  function orderSummary(article){
    const optional=qs('.clientGalleryOptionalOrdering',article);
    if(!optional)return '';
    const bits=[];
    qsa('label.picked span',optional).forEach(n=>{const v=txt(n);if(v)bits.push(v)});
    qsa('.clientGalleryPublicPrint',optional).forEach(row=>{
      const name=txt(qs('span',row));
      const val=txt(qs('.pbSelectButton,.pbSelectTrigger,button',row));
      if(val&&!/انتخاب/.test(val))bits.push(name?`${name}: ${val}`:val);
    });
    const qty=txt(qs('.clientGalleryQuantityControl b',optional)); if(qty)bits.push(`تعداد ${qty}`);
    return [...new Set(bits)].filter(Boolean).join(' · ');
  }

  function selectedArticles(){
    return qsa('.clientGalleryPublicMedia').filter(a=>qs('.clientGalleryBaseSelection input[type="checkbox"]:checked',a));
  }

  function orderedArticles(){
    return selectedArticles().filter(a=>{
      const optional=qs('.clientGalleryOptionalOrdering',a);
      if(!optional)return false;
      if(qs('input[type="checkbox"]:checked',optional))return true;
      const selects=qsa('.pbSelectButton,.pbSelectTrigger,select',optional).map(txt).join(' ');
      return Boolean(selects && !/^انتخاب/.test(selects));
    });
  }

  function updateCartButton(){
    const page=qs('.publicClientGalleryPage.unlocked'); if(!page)return;
    const priced=qs('.clientGallerySelectionStatus.priced',page);
    const btn=qs('#pb789-gallery-cart',page);
    if(!priced){btn?.remove();return}
    const count=orderedArticles().length||selectedArticles().length;
    if(btn){
      const badge=qs('.pb789CartCount',btn); if(badge)badge.textContent=Number(count).toLocaleString('fa-IR');
    }
  }

  function openCart(){
    document.getElementById('pb789-cart-layer')?.remove();
    const rows=orderedArticles();
    const selected=selectedArticles();
    const items=rows.length?rows:selected;
    const status=qs('.clientGallerySelectionStatus.priced');
    const statusText=txt(qs('.clientGallerySelectionStatusMain small',status));
    const layer=document.createElement('div');
    layer.id='pb789-cart-layer';layer.className='pb789CartLayer';
    const list=items.map((a,i)=>{
      const img=qs('.clientGalleryPublicMediaView img',a)?.getAttribute('src')||'';
      const detail=orderSummary(a)||'عکس انتخاب‌شده';
      return `<div class="pb789CartRow"><img src="${img.replace(/"/g,'&quot;')}" alt=""><div><b>عکس ${Number(i+1).toLocaleString('fa-IR')}</b><small>${detail.replace(/[<>]/g,'')}</small></div><button type="button" data-edit-index="${i}">ویرایش</button></div>`;
    }).join('');
    layer.innerHTML=`<section class="pb789CartCard" role="dialog" aria-modal="true" aria-label="سبد خرید سفارش چاپ"><header><div><b>سبد خرید سفارش چاپ</b><small>${statusText||'انتخاب‌ها و سفارش‌های شما'}</small></div><button type="button" class="pb789CartClose" aria-label="بستن">×</button></header><div class="pb789CartRows">${list||'<div class="pb789CartEmpty">هنوز سفارشی به سبد خرید اضافه نشده است.</div>'}</div><footer><button type="button" class="pb789CartContinue">ادامه انتخاب</button><button type="button" class="primary pb789CartFinalize" ${items.length?'':'disabled'}>ثبت نهایی و مشاهده فاکتور</button></footer></section>`;
    layer.addEventListener('click',e=>{if(e.target===layer)layer.remove()});
    qs('.pb789CartClose',layer)?.addEventListener('click',()=>layer.remove());
    qs('.pb789CartContinue',layer)?.addEventListener('click',()=>layer.remove());
    qsa('[data-edit-index]',layer).forEach(b=>b.addEventListener('click',()=>{
      const idx=Number(b.getAttribute('data-edit-index'));
      const article=items[idx]; layer.remove(); if(article){article.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>openOrderModal(article),280)}
    }));
    qs('.pb789CartFinalize',layer)?.addEventListener('click',()=>{
      const real=qsa('.clientGallerySelectionStatusActions button.primary').find(b=>/پایان سفارش|پایان انتخاب/.test(txt(b)));
      if(real&&!real.disabled){layer.remove();real.click()}
    });
    document.body.appendChild(layer);
  }

  function enhanceCustomerGallery(){
    if(galleryPublic())return; /* v792 owns public-gallery DOM safely; do not mutate React-owned child lists. */
    if(!galleryPublic())return;
    const page=qs('.publicClientGalleryPage.unlocked'); if(!page)return;
    page.classList.add('pb789CustomerGallery');
    qs('.clientGalleryMobileSingleViewHint',page)?.remove();

    const header=qs('.clientGalleryPublicHeader',page);
    const headerRight=qs('.clientGalleryPublicHeaderRight',page);
    if(header)header.classList.add('pb789Header');
    if(headerRight&&qs('.clientGallerySelectionStatus.priced',page)&&!qs('#pb789-gallery-cart',page)){
      const cart=document.createElement('button');cart.type='button';cart.id='pb789-gallery-cart';cart.className='pb789GalleryCart';
      cart.innerHTML='<span aria-hidden="true">🛒</span><b>سبد خرید</b><i class="pb789CartCount">۰</i>';
      cart.addEventListener('click',openCart);headerRight.prepend(cart);
    }

    qsa('.clientGalleryPublicMedia',page).forEach(article=>{
      const interaction=qs('.clientGalleryPhotoInteraction',article); if(!interaction)return;
      article.classList.add('pb789PhotoCard'); interaction.classList.add('pb789PhotoActionsUnder');
      const base=qs('.clientGalleryBaseSelection',interaction); if(base)base.classList.add('pb789SelectionAction');
      const pricedPage=!!qs('.clientGallerySelectionStatus.priced',page);
      const optional=qs('.clientGalleryOptionalOrdering',interaction);
      if(optional)optional.classList.add('pb789PrintPanel');
      if(pricedPage&&!qs('.pb789PrintOrderButton',interaction)){
        const b=document.createElement('button');b.type='button';b.className='pb789PrintOrderButton';b.textContent='سفارش چاپ';
        b.addEventListener('click',()=>{
          const current=qs('.clientGalleryOptionalOrdering',article);
          if(current){current.classList.add('pb789PrintPanel');openOrderModal(article);return}
          const select=qs('.clientGalleryBaseSelection input[type="checkbox"]',article);
          if(select&&!select.checked){select.click()}
          let tries=0;const wait=()=>{const panel=qs('.clientGalleryOptionalOrdering',article);if(panel){panel.classList.add('pb789PrintPanel');openOrderModal(article);schedule();return}if(++tries<8)setTimeout(wait,60)};setTimeout(wait,40);
        });
        interaction.appendChild(b);
      }
    });
    updateCartButton();
  }

  function sync(){
    raf=0;
    normalizeFinanceScroll();
    normalizeGalleryManager();
    enhanceCustomerGallery();
  }
  function schedule(){if(raf)return;raf=requestAnimationFrame(sync)}

  document.addEventListener('change',e=>{
    if(galleryPublic())return; /* v792 exclusively owns public gallery events. */
    if(e.target?.closest?.('.clientGalleryPhotoInteraction'))setTimeout(schedule,0);
  },true);
  document.addEventListener('click',e=>{
    if(galleryPublic())return; /* v792 exclusively owns public gallery events. */
    if(e.target?.closest?.('.clientGalleryGridToggle'))setTimeout(schedule,0);
  },true);
  addEventListener('popstate',schedule,{passive:true});
  addEventListener('pageshow',schedule,{passive:true});
  const root=qs('#root'); if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true});
  mq.addEventListener?.('change',schedule);
  schedule();
  console.info('[PhotoBridge] v789 shipped-runtime finance/gallery fix active');
})();
