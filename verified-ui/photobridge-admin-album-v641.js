(()=>{
  'use strict';
  if(!/^\/admin(?:\/|$)/.test(location.pathname)) return;
  const VERSION='641';
  const VARIANT_KEY='pb641AdminAlbumVariant';
  const ENHANCED='pb641Enhanced';
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
      const key='pb641AdminStaleSwReloaded';
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
    let root=document.getElementById('pb641AdminAlbumToast');
    if(!root){root=document.createElement('div');root.id='pb641AdminAlbumToast';document.body.appendChild(root)}
    root.className=tone==='error'?'error':'ok';root.textContent=message;root.hidden=false;
    clearTimeout(toast._t);toast._t=setTimeout(()=>{root.hidden=true},2800);
  }
  toast._t=0;

  // Keep the narrow request decoration used for normal/stretched album saving,
  // but do not touch unrelated requests and never recurse into our wrapper.
  if(!window.__pb641AdminAlbumFetchWrapped){
    window.__pb641AdminAlbumFetchWrapped=true;
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
    if(document.getElementById('pb641AdminAlbumStyle'))return;
    const s=document.createElement('style');s.id='pb641AdminAlbumStyle';s.textContent=`
      #pb641AdminAlbumToast{position:fixed;top:72px;left:50%;transform:translateX(-50%);z-index:2147483500;direction:rtl;font-family:Vazirmatn,Vazir,Tahoma,sans-serif;padding:10px 14px;border-radius:12px;background:#ecfdf3;color:#067647;border:1px solid #a6f4c5;box-shadow:0 10px 35px #0f172a22;font-size:11px;font-weight:850}#pb641AdminAlbumToast.error{background:#fff1f2;color:#b42318;border-color:#fecdd3}#pb641AdminAlbumToast[hidden]{display:none!important}
      .adminAlbumDesignSandbox .albumPsdTypographyCount{min-width:210px!important;justify-content:space-between!important;padding:7px 9px!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>span{font-size:10px!important;font-weight:800!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>input{width:96px!important;min-width:96px!important;height:38px!important;padding:4px 10px!important;font-size:15px!important;font-weight:900!important;line-height:1!important;direction:ltr!important;text-align:center!important;color:#111827!important;background:#fff!important}
      .adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div:not(.pb641DesignKindChoices){display:none!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>span{align-self:center!important}.pb641DesignKindChoices{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;flex:1!important}.pb641DesignKindChoices button{display:grid!important;gap:2px!important;min-height:54px!important;padding:8px 10px!important;border:1px solid #d7dee8!important;border-radius:11px!important;background:#fff!important;color:#344054!important;text-align:center!important}.pb641DesignKindChoices button b{font-size:11px!important}.pb641DesignKindChoices button small{font-size:8.5px!important;color:#667085!important}.pb641DesignKindChoices button.active{border-color:#315efb!important;background:#eef2ff!important;color:#2447c5!important;box-shadow:0 0 0 2px #315efb16!important}.pb641AlbumVariantHint{margin-top:7px;padding:7px 10px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;color:#475569;font-size:9.5px;line-height:1.8}.pb641AlbumVariantHint b{color:#111827}
      .pb641OpenTypographyBank{min-height:36px!important;padding:7px 10px!important;border:1px solid #c7d2fe!important;border-radius:9px!important;background:#eef2ff!important;color:#3730a3!important;font-weight:900!important;cursor:pointer!important}.albumTemplateDetectedText.pb641TypographyTarget{outline:2px solid #6366f1!important;outline-offset:2px!important}
      #pb641TypographyPicker{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:16px;background:#0f172a77;backdrop-filter:blur(3px);direction:rtl;font-family:Vazirmatn,Vazir,Tahoma,sans-serif}#pb641TypographyPicker[hidden]{display:none!important}#pb641TypographyPicker .pb641PickerCard{width:min(980px,calc(100vw - 24px));height:min(760px,calc(100dvh - 24px));display:flex;flex-direction:column;overflow:hidden;border-radius:18px;background:#fff;box-shadow:0 30px 90px #0f172a55}#pb641TypographyPicker header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border-bottom:1px solid #e5e7eb}#pb641TypographyPicker header div{display:grid;gap:2px}#pb641TypographyPicker header b{font-size:14px}#pb641TypographyPicker header small{font-size:9.5px;color:#667085}#pb641TypographyPicker header button{width:34px;height:34px;border:0;border-radius:10px;background:#f2f4f7;font-size:20px;cursor:pointer}#pb641TypographyPicker .pb641PickerTools{padding:10px 14px;border-bottom:1px solid #eef2f6;background:#fafbfc}#pb641TypographyPicker .pb641PickerTools input{width:100%;height:40px;padding:7px 11px;border:1px solid #d7dee8;border-radius:10px;font:inherit;font-size:11px}#pb641TypographyPicker .pb641PickerGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;padding:12px;overflow:auto;align-content:start}#pb641TypographyPicker .pb641TypographyChoice{position:relative;display:grid;grid-template-rows:120px auto;gap:6px;min-width:0;padding:7px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;cursor:pointer}#pb641TypographyPicker .pb641TypographyChoice:hover{border-color:#94a3b8;background:#f8fafc}#pb641TypographyPicker .pb641TypographyChoice.active{border-color:#315efb;box-shadow:0 0 0 2px #315efb18;background:#eef2ff}#pb641TypographyPicker .pb641TypographyChoice img{width:100%;height:100%;object-fit:contain;background:#fff;border-radius:8px}#pb641TypographyPicker .pb641TypographyChoice span{display:block;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;font-size:10px;font-weight:800;color:#334155}
      @media(max-width:760px){.pb641DesignKindChoices{grid-template-columns:1fr!important}.adminAlbumDesignSandbox .albumPsdTypographyCount{min-width:0!important;width:100%!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>input{width:110px!important;min-width:110px!important}#pb641TypographyPicker{padding:6px}#pb641TypographyPicker .pb641PickerCard{width:calc(100vw - 12px);height:calc(100dvh - 12px);border-radius:14px}#pb641TypographyPicker .pb641PickerGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px}#pb641TypographyPicker .pb641TypographyChoice{grid-template-rows:108px auto}}
    `;document.head.appendChild(s);
  }

  function originalKindButtons(root){return Array.from(root?.querySelectorAll(':scope>div:not(.pb641DesignKindChoices) button')||[])}
  function clickOriginalKind(root,kind){
    const buttons=originalKindButtons(root);
    let target=null;
    if(kind==='instagram') target=buttons.find(b=>/اینستاگرام|instagram/i.test(String(b.textContent||'')));
    else target=buttons.find(b=>/^\s*آلبوم\s*$/i.test(String(b.textContent||''))||/album/i.test(String(b.textContent||'')));
    if(target) target.click();
    else if(kind==='instagram'){
      // Current underlying editor may render Instagram as a dedicated route/state.
      // Do not force a slideshow fallback; just keep the UI responsive.
      toast('حالت اینستاگرام در این صفحه هنوز بارگذاری نشده؛ صفحه را یک‌بار تازه کن.','error');
    }
  }

  function syncDesignKindUi(sandbox=lastSandbox){
    if(!sandbox||!sandbox.isConnected)return;
    const root=sandbox.querySelector('.albumTemplateDesignKind.'+ENHANCED);if(!root)return;
    const original=originalKindButtons(root);
    const activeText=String(original.find(b=>b.classList.contains('active'))?.textContent||'');
    const instagramActive=/اینستاگرام|instagram/i.test(activeText);
    root.querySelectorAll('.pb641DesignKindChoices button').forEach(btn=>{
      const should=instagramActive?btn.dataset.kind==='instagram':btn.dataset.kind===albumVariant;
      if(btn.classList.contains('active')!==should)btn.classList.toggle('active',should);
    });
    const hint=root.parentElement?.querySelector('.pb641AlbumVariantHint');
    if(hint){
      const next=instagramActive?'<b>اینستاگرام</b> · PSD عمودی اینستاگرام را آپلود کن.':'<b>'+(albumVariant==='stretched'?'آلبوم کشیده':'آلبوم معمولی')+'</b> · '+(albumVariant==='stretched'?'برای مدل‌های کشیده؛ اندازه واقعی خود PSD هنگام خواندن حفظ می‌شود.':'برای مدل‌های معمولی؛ اندازه واقعی خود PSD هنگام خواندن حفظ می‌شود.');
      if(hint.innerHTML!==next)hint.innerHTML=next;
    }
  }

  function enhanceDesignKinds(sandbox){
    const root=sandbox.querySelector('.albumTemplateDesignKind');if(!root)return;
    if(root.classList.contains(ENHANCED)){syncDesignKindUi(sandbox);return}
    root.classList.add(ENHANCED);
    const choices=document.createElement('div');choices.className='pb641DesignKindChoices';
    const defs=[['instagram','اینستاگرام','قالب عمودی شبکه اجتماعی'],['normal','آلبوم معمولی','مدل‌های استاندارد'],['stretched','آلبوم کشیده','مدل‌های عریض و کشیده']];
    for(const [kind,label,sub] of defs){
      const b=document.createElement('button');b.type='button';b.dataset.kind=kind;b.innerHTML=`<b>${label}</b><small>${sub}</small>`;
      b.addEventListener('click',()=>{if(kind==='instagram')clickOriginalKind(root,'instagram');else{setVariant(kind);clickOriginalKind(root,'album')}setTimeout(()=>syncDesignKindUi(sandbox),30)});
      choices.appendChild(b);
    }
    root.appendChild(choices);
    const hint=document.createElement('div');hint.className='pb641AlbumVariantHint';root.insertAdjacentElement('afterend',hint);
    syncDesignKindUi(sandbox);
  }

  function closePicker(){const modal=document.getElementById('pb641TypographyPicker');if(modal)modal.hidden=true}
  function ensurePicker(){
    let modal=document.getElementById('pb641TypographyPicker');if(modal)return modal;
    modal=document.createElement('div');modal.id='pb641TypographyPicker';modal.hidden=true;
    modal.innerHTML='<section class="pb641PickerCard"><header><div><b>بانک Typography</b><small>طرح جایگزین را برای همین لایه انتخاب کن.</small></div><button type="button" aria-label="بستن">×</button></header><div class="pb641PickerTools"><input type="search" placeholder="جستجو در نام Typography…"/></div><div class="pb641PickerGrid"></div></section>';
    modal.addEventListener('pointerdown',e=>{if(e.target===modal)closePicker()});
    modal.querySelector('header button').onclick=closePicker;
    modal.querySelector('input').addEventListener('input',e=>{const q=String(e.target.value||'').trim().toLowerCase();modal.querySelectorAll('.pb641TypographyChoice').forEach(x=>x.hidden=Boolean(q&&!String(x.dataset.search||'').includes(q)))});
    document.body.appendChild(modal);return modal;
  }

  function bankArticles(sandbox){return Array.from(sandbox?.querySelectorAll('.albumTypographyBankGrid .albumTypographyAdminAsset')||[])}
  function openTypographyPicker(article){
    const sandbox=article?.closest('.adminAlbumDesignSandbox');if(!article||!sandbox)return;
    activeTypographyArticle=article;
    sandbox.querySelectorAll('.albumTemplateDetectedText.pb641TypographyTarget').forEach(x=>x.classList.remove('pb641TypographyTarget'));
    article.classList.add('pb641TypographyTarget');
    const select=article.querySelector('.albumDetectedTypographyDefaultPicker select');if(!select)return toast('فهرست Typography این لایه پیدا نشد.','error');
    const options=Array.from(select.options||[]).filter(o=>String(o.value||''));
    const assets=bankArticles(sandbox),modal=ensurePicker(),grid=modal.querySelector('.pb641PickerGrid');grid.replaceChildren();
    const assetById=new Map();
    for(const asset of assets){const key=String(asset.querySelector('b')?.textContent||'').trim().toLowerCase();if(key)assetById.set(key,asset)}
    const frag=document.createDocumentFragment();
    for(const opt of options){
      const name=String(opt.textContent||opt.value).trim();
      const asset=assetById.get(name.toLowerCase())||assets.find(a=>String(a.textContent||'').includes(name));
      const img=asset?.querySelector('.albumTypographyAssetPreview img'),src=img?.getAttribute('src')||'';
      const b=document.createElement('button');b.type='button';b.className='pb641TypographyChoice'+(String(select.value)===String(opt.value)?' active':'');b.dataset.search=name.toLowerCase();
      if(src){const im=document.createElement('img');im.src=src;im.alt='';b.appendChild(im)}else{b.appendChild(document.createElement('span'))}
      const label=document.createElement('span');label.textContent=name;b.appendChild(label);
      b.onclick=()=>{select.value=opt.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));toast('Typography این لایه تغییر کرد.');closePicker();setTimeout(()=>article.scrollIntoView({behavior:'smooth',block:'center'}),40)};
      frag.appendChild(b);
    }
    grid.appendChild(frag);modal.querySelector('input').value='';modal.hidden=false;
  }

  function enhanceTypographyArticles(sandbox){
    for(const article of sandbox.querySelectorAll('.albumTemplateDetectedText')){
      const picker=article.querySelector('.albumDetectedTypographyDefaultPicker');if(!picker||picker.querySelector('.pb641OpenTypographyBank'))continue;
      const button=document.createElement('button');button.type='button';button.className='pb641OpenTypographyBank';button.textContent='باز کردن بانک Typography';
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
