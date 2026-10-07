(()=>{
  'use strict';
  if(!/^\/admin(?:\/|$)/.test(location.pathname)) return;
  const VERSION='644';
  const VARIANT_KEY='pb644AdminAlbumVariant';
  const ENHANCED='pb644Enhanced';
  let albumVariant='normal';
  let activeTypographyArticle=null;
  let enhanceTimer=0;
  let observer=null;
  let lastSandbox=null;
  const nativeFetch=window.fetch.bind(window);
  try{albumVariant=sessionStorage.getItem(VARIANT_KEY)==='stretched'?'stretched':'normal'}catch{}

  // v641: no current PhotoBridge build ships a service worker. Remove any stale
  // worker left by an older deployment because it can reject design-page fetches
  // (the browser reports this as sw.js: Failed to fetch).
  async function clearStaleServiceWorker(){
    if(!('serviceWorker' in navigator)) return;
    try{
      const regs=await navigator.serviceWorker.getRegistrations();
      if(!regs.length) return;
      await Promise.allSettled(regs.map(r=>r.unregister()));
      const key='pb644AdminStaleSwReloaded';
      if(navigator.serviceWorker.controller && sessionStorage.getItem(key)!=='1'){
        sessionStorage.setItem(key,'1');
        location.reload();
      }
    }catch{}
  }

  function setVariant(v){
    albumVariant=v==='stretched'?'stretched':'normal';
    try{sessionStorage.setItem(VARIANT_KEY,albumVariant)}catch{}
    syncDesignKindUi();
  }

  function toast(message,tone='ok'){
    let root=document.getElementById('pb644AdminAlbumToast');
    if(!root){root=document.createElement('div');root.id='pb644AdminAlbumToast';document.body.appendChild(root)}
    root.className=tone==='error'?'error':'ok';root.textContent=message;root.hidden=false;
    clearTimeout(toast._t);toast._t=setTimeout(()=>{root.hidden=true},2800);
  }
  toast._t=0;

  // Keep the narrow request decoration used for normal/stretched album saving,
  // but do not touch unrelated requests and never recurse into our wrapper.
  if(!window.__pb644AdminAlbumFetchWrapped){
    window.__pb644AdminAlbumFetchWrapped=true;
    window.fetch=async function(input,init){
      let nextInit=init;
      try{
        const url=typeof input==='string'?input:(input&&input.url)||'';
        const method=String(init?.method||(input&&input.method)||'GET').toUpperCase();
        if((method==='POST'||method==='PUT')&&/\/api\/admin\/test-album-design\/templates(?:\?|$)/.test(url)&&typeof init?.body==='string'){
          const data=JSON.parse(init.body);
          const kind=String(data?.designKind||'album').toLowerCase();
          if(kind==='album'){
            data.category=albumVariant==='stretched'?'آلبوم کشیده':'آلبوم معمولی';
            data.pbAlbumVariant=albumVariant;
            nextInit={...init,body:JSON.stringify(data)};
          }
        }
      }catch{}
      return nativeFetch(input,nextInit);
    };
  }

  function installStyle(){
    if(document.getElementById('pb644AdminAlbumStyle'))return;
    const s=document.createElement('style');s.id='pb644AdminAlbumStyle';s.textContent=`
      #pb644AdminAlbumToast{position:fixed;top:72px;left:50%;transform:translateX(-50%);z-index:2147483500;direction:rtl;font-family:Vazirmatn,Vazir,Tahoma,sans-serif;padding:10px 14px;border-radius:12px;background:#ecfdf3;color:#067647;border:1px solid #a6f4c5;box-shadow:0 10px 35px #0f172a22;font-size:11px;font-weight:850}#pb644AdminAlbumToast.error{background:#fff1f2;color:#b42318;border-color:#fecdd3}#pb644AdminAlbumToast[hidden]{display:none!important}
      .adminAlbumDesignSandbox .albumPsdTypographyCount{min-width:210px!important;justify-content:space-between!important;padding:7px 9px!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>span{font-size:10px!important;font-weight:800!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>input{width:96px!important;min-width:96px!important;height:38px!important;padding:4px 10px!important;font-size:15px!important;font-weight:900!important;line-height:1!important;direction:ltr!important;text-align:center!important;color:#111827!important;background:#fff!important}
      .adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>span{align-self:center!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb644NativeKindHolder{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;flex:1!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb644NativeKindHolder>button{display:grid!important;place-content:center!important;gap:2px!important;min-height:54px!important;padding:8px 10px!important;border:1px solid #d7dee8!important;border-radius:11px!important;background:#fff!important;color:#344054!important;text-align:center!important;font-weight:850!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb644NativeKindHolder>button.active{border-color:#315efb!important;background:#eef2ff!important;color:#2447c5!important;box-shadow:0 0 0 2px #315efb16!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb644NativeKindHolder>button.pb644NativeAlbum.pb644ProxyInactive.active{border-color:#d7dee8!important;background:#fff!important;color:#344054!important;box-shadow:none!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb644NativeKindHolder>button.pb644StretchedChoice.active{border-color:#315efb!important;background:#eef2ff!important;color:#2447c5!important;box-shadow:0 0 0 2px #315efb16!important}.pb644StretchedChoice b{font-size:11px!important}.pb644StretchedChoice small{font-size:8.5px!important;color:#667085!important}.pb644AlbumVariantHint{margin-top:7px;padding:7px 10px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;color:#475569;font-size:9.5px;line-height:1.8}.pb644AlbumVariantHint b{color:#111827}
      .pb644OpenTypographyBank{min-height:36px!important;padding:7px 10px!important;border:1px solid #c7d2fe!important;border-radius:9px!important;background:#eef2ff!important;color:#3730a3!important;font-weight:900!important;cursor:pointer!important}.albumTemplateDetectedText.pb644TypographyTarget{outline:2px solid #6366f1!important;outline-offset:2px!important}
      #pb644TypographyPicker{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:16px;background:#0f172a77;backdrop-filter:blur(3px);direction:rtl;font-family:Vazirmatn,Vazir,Tahoma,sans-serif}#pb644TypographyPicker[hidden]{display:none!important}#pb644TypographyPicker .pb644PickerCard{width:min(980px,calc(100vw - 24px));height:min(760px,calc(100dvh - 24px));display:flex;flex-direction:column;overflow:hidden;border-radius:18px;background:#fff;box-shadow:0 30px 90px #0f172a55}#pb644TypographyPicker header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border-bottom:1px solid #e5e7eb}#pb644TypographyPicker header div{display:grid;gap:2px}#pb644TypographyPicker header b{font-size:14px}#pb644TypographyPicker header small{font-size:9.5px;color:#667085}#pb644TypographyPicker header button{width:34px;height:34px;border:0;border-radius:10px;background:#f2f4f7;font-size:20px;cursor:pointer}#pb644TypographyPicker .pb644PickerTools{padding:10px 14px;border-bottom:1px solid #eef2f6;background:#fafbfc}#pb644TypographyPicker .pb644PickerTools input{width:100%;height:40px;padding:7px 11px;border:1px solid #d7dee8;border-radius:10px;font:inherit;font-size:11px}#pb644TypographyPicker .pb644PickerGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;padding:12px;overflow:auto;align-content:start}#pb644TypographyPicker .pb644TypographyChoice{position:relative;display:grid;grid-template-rows:120px auto;gap:6px;min-width:0;padding:7px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;cursor:pointer}#pb644TypographyPicker .pb644TypographyChoice:hover{border-color:#94a3b8;background:#f8fafc}#pb644TypographyPicker .pb644TypographyChoice.active{border-color:#315efb;box-shadow:0 0 0 2px #315efb18;background:#eef2ff}#pb644TypographyPicker .pb644TypographyChoice img{width:100%;height:100%;object-fit:contain;background:#fff;border-radius:8px}#pb644TypographyPicker .pb644TypographyChoice span{display:block;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;font-size:10px;font-weight:800;color:#334155}
      .adminAlbumDesignSandbox .albumTemplatePsdOnlyStart,.adminAlbumDesignSandbox .albumTemplatePsdImport{direction:rtl!important;text-align:right!important;justify-self:stretch!important;width:100%!important;margin-inline-start:0!important;margin-inline-end:0!important}.adminAlbumDesignSandbox .albumTemplatePsdImport>label{direction:rtl!important;text-align:right!important;justify-items:stretch!important}.adminAlbumDesignSandbox .albumTemplatePsdImport input[type=file]{direction:rtl!important;text-align:right!important}.adminAlbumDesignSandbox .albumTemplatePsdOnlyStart{justify-items:stretch!important}
      @media(max-width:760px){.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb644NativeKindHolder{grid-template-columns:1fr!important}.adminAlbumDesignSandbox .albumPsdTypographyCount{min-width:0!important;width:100%!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>input{width:110px!important;min-width:110px!important}#pb644TypographyPicker{padding:6px}#pb644TypographyPicker .pb644PickerCard{width:calc(100vw - 12px);height:calc(100dvh - 12px);border-radius:14px}#pb644TypographyPicker .pb644PickerGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px}#pb644TypographyPicker .pb644TypographyChoice{grid-template-rows:108px auto}}
    `;document.head.appendChild(s);
  }

  function nativeKindButtons(root){
    if(!root)return {instagram:null,album:null,holder:null};
    const holder=Array.from(root.children).find(el=>el.tagName==='DIV'&&!el.classList.contains('pb644DesignKindChoices'))||root.querySelector(':scope > div');
    const buttons=holder?Array.from(holder.querySelectorAll(':scope > button')):[];
    const instagram=buttons.find(b=>/اینستاگرام|instagram/i.test(String(b.textContent||'')))||null;
    const album=buttons.find(b=>/^\s*آلبوم(?:\s|$)/i.test(String(b.textContent||''))||/album/i.test(String(b.textContent||'')))||null;
    return {instagram,album,holder};
  }

  function bindNativeDesignButtons(root){
    const {instagram,album,holder}=nativeKindButtons(root);
    if(!holder||!instagram||!album)return false;
    holder.classList.add('pb644NativeKindHolder');
    instagram.classList.add('pb644NativeInstagram');
    album.classList.add('pb644NativeAlbum');
    if(!instagram.dataset.pb644Bound){
      instagram.dataset.pb644Bound='1';
      instagram.addEventListener('click',()=>{setTimeout(()=>syncDesignKindUi(lastSandbox),20)},true);
    }
    if(!album.dataset.pb644Bound){
      album.dataset.pb644Bound='1';
      album.addEventListener('click',()=>{
        if(album.dataset.pb644StretchedProxy==='1') delete album.dataset.pb644StretchedProxy;
        else setVariant('normal');
        setTimeout(()=>syncDesignKindUi(lastSandbox),20);
      },true);
    }
    // Keep the two React-owned buttons as the real controls. Only the third
    // (stretched album) is synthetic, so Instagram never depends on proxy clicks.
    if(!holder.querySelector('.pb644StretchedChoice')){
      const stretched=document.createElement('button');
      stretched.type='button';
      stretched.className='pb644StretchedChoice';
      stretched.innerHTML='<b>آلبوم کشیده</b><small>مدل‌های عریض و کشیده</small>';
      stretched.addEventListener('click',()=>{
        setVariant('stretched');
        album.dataset.pb644StretchedProxy='1';
        // HTMLElement.click() triggers React's delegated click handler on the
        // actual Album button, while the flag above preserves stretched state.
        album.click();
        setTimeout(()=>syncDesignKindUi(lastSandbox),30);
      });
      holder.appendChild(stretched);
    }
    return true;
  }

  function syncDesignKindUi(sandbox=lastSandbox){
    if(!sandbox||!sandbox.isConnected)return;
    const root=sandbox.querySelector('.albumTemplateDesignKind.'+ENHANCED);if(!root)return;
    const {instagram,album,holder}=nativeKindButtons(root);
    if(!instagram||!album||!holder)return;
    const instagramActive=instagram.classList.contains('active');
    const albumActive=album.classList.contains('active')&&!instagramActive;
    const stretched=holder.querySelector('.pb644StretchedChoice');
    // The native Album button represents normal album. When stretched mode is
    // selected we keep React in album mode but visually move active state to the
    // stretched button without mutating React-owned className.
    album.classList.toggle('pb644ProxyInactive',Boolean(albumActive&&albumVariant==='stretched'));
    stretched?.classList.toggle('active',Boolean(albumActive&&albumVariant==='stretched'));
    instagram.classList.toggle('pb644NativeLabelReady',true);
    album.classList.toggle('pb644NativeLabelReady',true);
    if(String(instagram.textContent||'').trim()!=='اینستاگرام') instagram.textContent='اینستاگرام';
    if(String(album.textContent||'').trim()!=='آلبوم معمولی') album.textContent='آلبوم معمولی';
    const hint=root.parentElement?.querySelector('.pb644AlbumVariantHint');
    if(hint){
      const next=instagramActive?'<b>اینستاگرام</b> · PSD پست اینستاگرام را انتخاب و آپلود کن.':'<b>'+(albumVariant==='stretched'?'آلبوم کشیده':'آلبوم معمولی')+'</b> · '+(albumVariant==='stretched'?'برای مدل‌های کشیده؛ اندازه واقعی خود PSD هنگام خواندن حفظ می‌شود.':'برای مدل‌های معمولی؛ اندازه واقعی خود PSD هنگام خواندن حفظ می‌شود.');
      if(hint.innerHTML!==next)hint.innerHTML=next;
    }
  }

  function enhanceDesignKinds(sandbox){
    const root=sandbox.querySelector('.albumTemplateDesignKind');if(!root)return;
    // Remove the v643 synthetic selector if the browser restored it from a
    // previous cached DOM snapshot. v644 deliberately uses the real React
    // Instagram button, which fixes the non-selectable Instagram state.
    root.querySelectorAll('.pb643DesignKindChoices,.pb644DesignKindChoices').forEach(x=>x.remove());
    root.classList.remove('pb643Enhanced');
    root.classList.add(ENHANCED);
    let hint=root.parentElement?.querySelector('.pb644AlbumVariantHint');
    if(!hint){hint=document.createElement('div');hint.className='pb644AlbumVariantHint';root.insertAdjacentElement('afterend',hint)}
    if(!bindNativeDesignButtons(root)){
      // React may still be mounting the manager; retry against the fresh node,
      // never against a stale root reference.
      setTimeout(()=>{const fresh=document.querySelector('.adminAlbumDesignSandbox .albumTemplateDesignKind');if(fresh){fresh.classList.add(ENHANCED);bindNativeDesignButtons(fresh);syncDesignKindUi(fresh.closest('.adminAlbumDesignSandbox'))}},80);
      return;
    }
    syncDesignKindUi(sandbox);
  }

  function closePicker(){const modal=document.getElementById('pb644TypographyPicker');if(modal)modal.hidden=true}
  function ensurePicker(){
    let modal=document.getElementById('pb644TypographyPicker');if(modal)return modal;
    modal=document.createElement('div');modal.id='pb644TypographyPicker';modal.hidden=true;
    modal.innerHTML='<section class="pb644PickerCard"><header><div><b>بانک Typography</b><small>طرح جایگزین را برای همین لایه انتخاب کن.</small></div><button type="button" aria-label="بستن">×</button></header><div class="pb644PickerTools"><input type="search" placeholder="جستجو در نام Typography…"/></div><div class="pb644PickerGrid"></div></section>';
    modal.addEventListener('pointerdown',e=>{if(e.target===modal)closePicker()});
    modal.querySelector('header button').onclick=closePicker;
    modal.querySelector('input').addEventListener('input',e=>{const q=String(e.target.value||'').trim().toLowerCase();modal.querySelectorAll('.pb644TypographyChoice').forEach(x=>x.hidden=Boolean(q&&!String(x.dataset.search||'').includes(q)))});
    document.body.appendChild(modal);return modal;
  }

  function bankArticles(sandbox){return Array.from(sandbox?.querySelectorAll('.albumTypographyBankGrid .albumTypographyAdminAsset')||[])}
  function openTypographyPicker(article){
    const sandbox=article?.closest('.adminAlbumDesignSandbox');if(!article||!sandbox)return;
    activeTypographyArticle=article;
    sandbox.querySelectorAll('.albumTemplateDetectedText.pb644TypographyTarget').forEach(x=>x.classList.remove('pb644TypographyTarget'));
    article.classList.add('pb644TypographyTarget');
    const select=article.querySelector('.albumDetectedTypographyDefaultPicker select');if(!select)return toast('فهرست Typography این لایه پیدا نشد.','error');
    const options=Array.from(select.options||[]).filter(o=>String(o.value||''));
    const assets=bankArticles(sandbox),modal=ensurePicker(),grid=modal.querySelector('.pb644PickerGrid');grid.replaceChildren();
    const assetById=new Map();
    for(const asset of assets){const key=String(asset.querySelector('b')?.textContent||'').trim().toLowerCase();if(key)assetById.set(key,asset)}
    const frag=document.createDocumentFragment();
    for(const opt of options){
      const name=String(opt.textContent||opt.value).trim();
      const asset=assetById.get(name.toLowerCase())||assets.find(a=>String(a.textContent||'').includes(name));
      const img=asset?.querySelector('.albumTypographyAssetPreview img'),src=img?.getAttribute('src')||'';
      const b=document.createElement('button');b.type='button';b.className='pb644TypographyChoice'+(String(select.value)===String(opt.value)?' active':'');b.dataset.search=name.toLowerCase();
      if(src){const im=document.createElement('img');im.src=src;im.alt='';b.appendChild(im)}else{b.appendChild(document.createElement('span'))}
      const label=document.createElement('span');label.textContent=name;b.appendChild(label);
      b.onclick=()=>{select.value=opt.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));toast('Typography این لایه تغییر کرد.');closePicker();setTimeout(()=>article.scrollIntoView({behavior:'smooth',block:'center'}),40)};
      frag.appendChild(b);
    }
    grid.appendChild(frag);modal.querySelector('input').value='';modal.hidden=false;
  }

  function enhanceTypographyArticles(sandbox){
    for(const article of sandbox.querySelectorAll('.albumTemplateDetectedText')){
      const picker=article.querySelector('.albumDetectedTypographyDefaultPicker');if(!picker||picker.querySelector('.pb644OpenTypographyBank'))continue;
      const button=document.createElement('button');button.type='button';button.className='pb644OpenTypographyBank';button.textContent='باز کردن بانک Typography';
      button.onclick=e=>{e.preventDefault();e.stopPropagation();openTypographyPicker(article)};
      picker.insertBefore(button,picker.querySelector('.albumAdminTypographySelectedPreview')||null);
    }
  }

  function hideSlideshowAdminCards(sandbox){
    for(const card of sandbox.querySelectorAll('.albumDesignTemplateCard')){
      if(/slideshow|اسلایدشو/i.test(String(card.textContent||'')) && card.style.display!=='none')card.style.display='none';
    }
  }

  function enhanceNow(){
    enhanceTimer=0;
    const sandbox=document.querySelector('.adminAlbumDesignSandbox');
    if(!sandbox){lastSandbox=null;return}
    lastSandbox=sandbox;installStyle();enhanceDesignKinds(sandbox);enhanceTypographyArticles(sandbox);hideSlideshowAdminCards(sandbox);syncDesignKindUi(sandbox);
  }
  function scheduleEnhance(delay=90){
    if(enhanceTimer)return;
    enhanceTimer=setTimeout(enhanceNow,delay);
  }

  function installObserver(){
    if(observer)return;
    const root=document.getElementById('root')||document.body;
    observer=new MutationObserver(mutations=>{
      // Only child-list changes matter. v640 observed class attributes across the
      // whole application and could create a render/observer feedback loop.
      if(mutations.some(m=>m.type==='childList'))scheduleEnhance(120);
    });
    observer.observe(root,{subtree:true,childList:true});
  }

  document.addEventListener('click',e=>{
    const sandbox=e.target.closest?.('.adminAlbumDesignSandbox');if(!sandbox)return;
    const edit=e.target.closest?.('.albumDesignTemplateCardActions .edit');if(edit){const txt=String(edit.closest('.albumDesignTemplateCard')?.textContent||'');setVariant(/کشیده|۳۰\s*[×x]\s*۶۰|۴۰\s*[×x]\s*۸۰/.test(txt)?'stretched':'normal')}
    if(e.target.closest?.('.albumTemplateNewButton'))setVariant('normal');
    const hotspot=e.target.closest?.('.albumSlotBuilderTextHotspot');
    if(hotspot&&String(hotspot.querySelector('.albumSlotTextLabel')?.textContent||'').toLowerCase().includes('typography')){
      setTimeout(()=>{const article=sandbox.querySelector('.albumTemplateDetectedText.pb613TypographyPopup');if(article){enhanceTypographyArticles(sandbox);openTypographyPicker(article)}},80);
    }
  },true);

  const start=()=>{void clearStaleServiceWorker();scheduleEnhance(120);installObserver()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
