/* PhotoBridge v792 — safe customer-gallery layout switching, invoice/select UX, notes modal. */
(()=>{
  'use strict';
  if(window.__PB792_RUNTIME_FIX__)return;
  window.__PB792_RUNTIME_FIX__=true;

  const qs=(s,r=document)=>r&&r.querySelector?r.querySelector(s):null;
  const qsa=(s,r=document)=>r&&r.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const text=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  const isPublicGallery=()=>location.pathname.startsWith('/g/');
  let raf=0;

  function page(){return qs('.publicClientGalleryPage.unlocked')}
  function priced(p=page()){return Boolean(p&&qs('.clientGallerySelectionStatus.priced',p))}
  function selectionOnly(p=page()){return Boolean(p&&qs('.clientGallerySelectionStatus.selectionOnly',p))}
  function grid(p=page()){return p?qs('.clientGalleryPublicGrid',p):null}
  function columnCount(p=page()){
    const g=grid(p);if(!g)return 1;
    for(const n of [1,2,3,4])if(g.classList.contains(`cols-${n}`))return n;
    return 1;
  }

  function orderPanel(article){return qs('.clientGalleryOptionalOrdering',article)}
  function sizeChosen(article){
    const panel=orderPanel(article);if(!panel)return false;
    const row=qsa('.clientGalleryPublicPrint',panel)[0];if(!row)return false;
    const control=qs('.pbSelectButton,.pbSelectTrigger,button,select',row);
    const v=control instanceof HTMLSelectElement?String(control.value||''):text(control);
    return Boolean(v&&!/انتخاب\s*سایز/.test(v));
  }
  function digitalChosen(article){
    const panel=orderPanel(article);if(!panel)return false;
    const label=qsa('label',panel).find(l=>/فایل\s*دیجیتال/.test(text(l)));
    return Boolean(label&&qs('input[type="checkbox"]:checked',label));
  }
  function orderConfigured(article){return digitalChosen(article)||sizeChosen(article)}
  function orderSummary(article){
    const panel=orderPanel(article);if(!panel)return '';
    const bits=[];
    const digital=qsa('label',panel).find(l=>/فایل\s*دیجیتال/.test(text(l))&&qs('input[type="checkbox"]:checked',l));
    if(digital)bits.push('فایل دیجیتال');
    qsa('.clientGalleryPublicPrint',panel).forEach(row=>{
      const label=text(qs('span',row));const control=qs('.pbSelectButton,.pbSelectTrigger,button,select',row);
      const v=control instanceof HTMLSelectElement?String(control.options?.[control.selectedIndex]?.text||control.value||''):text(control);
      if(v&&!/^انتخاب/.test(v))bits.push(label?`${label}: ${v}`:v);
    });
    qsa('.clientGalleryPrintExtras label',panel).forEach(l=>{if(qs('input:checked',l)){const v=text(qs('span',l));if(v)bits.push(v)}});
    const qty=text(qs('.clientGalleryQuantityControl b',panel));if(qty)bits.push(`تعداد ${qty}`);
    return [...new Set(bits)].filter(Boolean).join(' · ');
  }

  function selectedCheckbox(article){return qs('.clientGalleryBaseSelection input[type="checkbox"]',article)}
  function setSelection(article,on){
    const cb=selectedCheckbox(article);if(!cb||cb.checked===on)return;
    article.dataset.pb792Bypass='1';
    try{cb.click()}finally{delete article.dataset.pb792Bypass}
  }

  function removeOrderChrome(){
    qs('#pb792-order-backdrop')?.remove();qs('#pb792-order-close')?.remove();qs('#pb792-order-actions')?.remove();
  }
  function closeOrder({keep=true}={}){
    const article=qs('.clientGalleryPublicMedia.pb792OrderOpen');
    if(article){
      const valid=orderConfigured(article);
      article.classList.remove('pb792OrderOpen');
      if((!keep||!valid)&&!valid)setSelection(article,false);
    }
    removeOrderChrome();schedule();
  }
  function syncOrderFooter(article){
    const add=qs('#pb792-order-add');if(add) add.disabled=!orderConfigured(article);
  }
  function openOrder(article,attempt=0){
    if(!(article instanceof HTMLElement))return;
    const panel=orderPanel(article);
    if(!panel){
      const cb=selectedCheckbox(article);
      if(cb&&!cb.checked)setSelection(article,true);
      if(attempt<20)setTimeout(()=>openOrder(article,attempt+1),40);
      return;
    }
    qsa('.clientGalleryPublicMedia.pb792OrderOpen').forEach(a=>a.classList.remove('pb792OrderOpen'));
    removeOrderChrome();article.classList.add('pb792OrderOpen');
    const backdrop=document.createElement('button');backdrop.type='button';backdrop.id='pb792-order-backdrop';backdrop.className='pb792OrderBackdrop';backdrop.setAttribute('aria-label','بستن سفارش چاپ');backdrop.addEventListener('click',()=>closeOrder({keep:true}));
    const close=document.createElement('button');close.type='button';close.id='pb792-order-close';close.className='pb792OrderClose';close.textContent='×';close.setAttribute('aria-label','بستن');close.addEventListener('click',()=>closeOrder({keep:true}));
    const actions=document.createElement('div');actions.id='pb792-order-actions';actions.className='pb792OrderActions';actions.innerHTML='<button type="button" id="pb792-order-cancel">بستن</button><button type="button" id="pb792-order-add" class="primary">افزودن به سبد خرید</button>';
    qs('#pb792-order-cancel',actions)?.addEventListener('click',()=>closeOrder({keep:true}));
    qs('#pb792-order-add',actions)?.addEventListener('click',()=>{if(!orderConfigured(article))return alert('حداقل فایل دیجیتال یا سایز چاپ را انتخاب کن.');closeOrder({keep:true});setTimeout(openCart,20)});
    document.body.append(backdrop,close,actions);syncOrderFooter(article);
  }

  function orderedArticles(){return qsa('.publicClientGalleryPage.pb792Priced .clientGalleryPublicMedia').filter(orderConfigured)}
  function updateCartButton(){
    if(!isPublicGallery()||!priced()){qs('#pb792-gallery-cart')?.remove();return}
    let btn=qs('#pb792-gallery-cart');
    if(!btn){btn=document.createElement('button');btn.type='button';btn.id='pb792-gallery-cart';btn.className='pb792GalleryCart';btn.innerHTML='<span>🛒</span><b>سبد خرید</b><i>۰</i>';btn.addEventListener('click',openCart);document.body.appendChild(btn)}
    const badge=qs('i',btn);if(badge)badge.textContent=Number(orderedArticles().length).toLocaleString('fa-IR');
  }
  function openCart(){
    qs('#pb792-cart-layer')?.remove();
    const items=orderedArticles();
    const layer=document.createElement('div');layer.id='pb792-cart-layer';layer.className='pb792CartLayer';
    const rows=items.map((a,i)=>{const src=qs('.clientGalleryPublicMediaView img',a)?.getAttribute('src')||'';const detail=orderSummary(a)||'سفارش چاپ';return `<div class="pb792CartRow"><img src="${src.replace(/"/g,'&quot;')}" alt=""><div><b>عکس ${Number(i+1).toLocaleString('fa-IR')}</b><small>${detail.replace(/[<>]/g,'')}</small></div><button type="button" data-edit="${i}">ویرایش</button></div>`}).join('');
    layer.innerHTML=`<section class="pb792CartCard" role="dialog" aria-modal="true"><header><div><b>سبد خرید سفارش چاپ</b><small>${Number(items.length).toLocaleString('fa-IR')} عکس در سبد</small></div><button type="button" class="pb792CartClose">×</button></header><div class="pb792CartRows">${rows||'<div class="pb792CartEmpty">هنوز سفارشی به سبد خرید اضافه نشده است.</div>'}</div><footer><button type="button" class="pb792CartContinue">ادامه انتخاب</button><button type="button" class="primary pb792CartFinalize" ${items.length?'':'disabled'}>ثبت نهایی و مشاهده فاکتور</button></footer></section>`;
    layer.addEventListener('click',e=>{if(e.target===layer)layer.remove()});
    qs('.pb792CartClose',layer)?.addEventListener('click',()=>layer.remove());qs('.pb792CartContinue',layer)?.addEventListener('click',()=>layer.remove());
    qsa('[data-edit]',layer).forEach(b=>b.addEventListener('click',()=>{const a=items[Number(b.dataset.edit)];layer.remove();if(a){a.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>openOrder(a),220)}}));
    qs('.pb792CartFinalize',layer)?.addEventListener('click',()=>{const real=qsa('.clientGallerySelectionStatusActions button.primary').find(b=>/پایان سفارش|پایان انتخاب|ثبت نهایی/.test(text(b)));if(real&&!real.disabled){layer.remove();real.click()}});
    document.body.appendChild(layer);
  }

  function setNativeValue(el,value){
    if(!(el instanceof HTMLTextAreaElement))return;
    const own=Object.getOwnPropertyDescriptor(el,'value')?.set, proto=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;
    const before=el.value;
    if(proto&&own!==proto)proto.call(el,value);else if(own)own.call(el,value);else el.value=value;
    const tracker=el._valueTracker;try{tracker?.setValue?.(before)}catch{}
    el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function closeNote(){qs('#pb792-note-layer')?.remove()}
  function openNote(noteLabel){
    const source=qs('textarea',noteLabel);if(!(source instanceof HTMLTextAreaElement))return;
    closeNote();
    const layer=document.createElement('div');layer.id='pb792-note-layer';layer.className='pb792NoteLayer';
    layer.innerHTML='<section class="pb792NoteCard" role="dialog" aria-modal="true"><header><b>توضیحات عکس</b><button type="button">×</button></header><textarea maxlength="500" placeholder="توضیح این عکس را برای عکاس بنویس…"></textarea><small>توضیحات به‌صورت خودکار ذخیره می‌شود.</small><footer><button type="button" class="primary">ثبت و بستن</button></footer></section>';
    const editor=qs('textarea',layer);editor.value=source.value||'';editor.addEventListener('input',()=>setNativeValue(source,editor.value));
    qs('header button',layer)?.addEventListener('click',closeNote);qs('footer button',layer)?.addEventListener('click',closeNote);layer.addEventListener('click',e=>{if(e.target===layer)closeNote()});
    document.body.appendChild(layer);setTimeout(()=>editor.focus(),20);
  }

  function syncPublicGallery(){
    if(!isPublicGallery()){closeNote();closeOrder({keep:true});qs('#pb792-gallery-cart')?.remove();qs('#pb792-cart-layer')?.remove();return}
    const p=page();if(!p)return;
    p.classList.add('pb792CustomerGallery');
    const isPriced=priced(p),isSelection=selectionOnly(p),cols=columnCount(p);
    p.classList.toggle('pb792Priced',isPriced);p.classList.toggle('pb792SelectionOnly',isSelection);p.classList.toggle('pb792Single',cols===1);p.classList.toggle('pb792Multi',cols>1);
    qsa('.clientGalleryPublicMedia',p).forEach(article=>{
      article.classList.add('pb792PhotoCard');
      article.classList.toggle('pb792HasOrder',isPriced&&orderConfigured(article));
      const base=qs('.clientGalleryBaseSelection',article);if(base){base.classList.toggle('pb792OrderTrigger',isPriced);base.classList.toggle('pb792SelectTrigger',isSelection)}
      const note=qs('.clientGalleryPhotoNote',article);if(note)note.classList.toggle('pb792CompactNote',isSelection&&cols>1);
      if(article.classList.contains('pb792OrderOpen'))syncOrderFooter(article);
    });
    updateCartButton();
  }

  document.addEventListener('click',e=>{
    if(!isPublicGallery())return;
    if(e.target?.closest?.('.clientGalleryGridToggle')){closeNote();closeOrder({keep:true});qs('#pb792-cart-layer')?.remove();setTimeout(schedule,0);return}
    const base=e.target?.closest?.('.publicClientGalleryPage.pb792Priced .clientGalleryBaseSelection');
    if(base){const article=base.closest('.clientGalleryPublicMedia');if(article?.dataset.pb792Bypass==='1')return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openOrder(article);return}
    const note=e.target?.closest?.('.publicClientGalleryPage.pb792SelectionOnly.pb792Multi .clientGalleryPhotoNote');
    if(note){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openNote(note)}
  },true);
  document.addEventListener('change',e=>{if(isPublicGallery()&&e.target?.closest?.('.clientGalleryOptionalOrdering'))setTimeout(schedule,0)},true);

  /* In invoice/order mode the hidden selection checkbox is only an implementation detail. Do not send separate selection rows. */
  const chainedFetch=window.fetch.bind(window);
  window.fetch=async(input,init={})=>{
    try{
      if(isPublicGallery()&&priced()&&String(init?.method||'GET').toUpperCase()==='POST'&&typeof init?.body==='string'){
        const url=typeof input==='string'?input:String(input?.url||'');
        if(/\/api\/public\/client-gallery\/[^/]+\/orders(?:\?|$)/.test(url)){
          const body=JSON.parse(init.body||'{}');if(Array.isArray(body.items))body.items=body.items.filter(x=>String(x?.kind||'')!=='selection');init={...init,body:JSON.stringify(body)};
        }
      }
    }catch{}
    return chainedFetch(input,init);
  };

  function schedule(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;syncPublicGallery()})}
  const root=qs('#root');if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true});
  addEventListener('pageshow',schedule,{passive:true});addEventListener('popstate',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  schedule();
  console.info('[PhotoBridge] v792 safe customer gallery runtime active');
})();
