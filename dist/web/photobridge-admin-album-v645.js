(()=>{
  'use strict';
  if(!/^\/admin(?:\/|$)/.test(location.pathname)) return;
  const VERSION='645';
  const VARIANT_KEY='pb645AdminAlbumVariant';
  const ENHANCED='pb645Enhanced';
  let albumVariant='normal';
  let enhanceTimer=0;
  let observer=null;
  let lastSandbox=null;
  const nativeFetch=window.fetch.bind(window);
  try{albumVariant=sessionStorage.getItem(VARIANT_KEY)==='stretched'?'stretched':'normal'}catch{}

  function setVariant(v){
    albumVariant=v==='stretched'?'stretched':'normal';
    try{sessionStorage.setItem(VARIANT_KEY,albumVariant)}catch{}
    syncDesignKindUi();
  }

  function toast(message,tone='ok'){
    let root=document.getElementById('pb645AdminAlbumToast');
    if(!root){root=document.createElement('div');root.id='pb645AdminAlbumToast';document.body.appendChild(root)}
    root.className=tone==='error'?'error':'ok';root.textContent=message;root.hidden=false;
    clearTimeout(toast._t);toast._t=setTimeout(()=>{root.hidden=true},2600);
  }
  toast._t=0;

  // Save Album sub-category independently from the React designKind.
  if(!window.__pb645AdminAlbumFetchWrapped){
    window.__pb645AdminAlbumFetchWrapped=true;
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
          }else if(kind==='instagram'){
            data.category='اینستاگرام';
            delete data.pbAlbumVariant;
            nextInit={...init,body:JSON.stringify(data)};
          }
        }
      }catch{}
      return nativeFetch(input,nextInit);
    };
  }

  function installStyle(){
    if(document.getElementById('pb645AdminAlbumStyle'))return;
    const s=document.createElement('style');s.id='pb645AdminAlbumStyle';s.textContent=`
      #pb645AdminAlbumToast{position:fixed;top:72px;left:50%;transform:translateX(-50%);z-index:2147483500;direction:rtl;font-family:Vazirmatn,Vazir,Tahoma,sans-serif;padding:10px 14px;border-radius:12px;background:#ecfdf3;color:#067647;border:1px solid #a6f4c5;box-shadow:0 10px 35px #0f172a22;font-size:11px;font-weight:850}#pb645AdminAlbumToast.error{background:#fff1f2;color:#b42318;border-color:#fecdd3}#pb645AdminAlbumToast[hidden]{display:none!important}
      .adminAlbumDesignSandbox .albumPsdTypographyCount{min-width:210px!important;justify-content:space-between!important;padding:7px 9px!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>span{font-size:10px!important;font-weight:800!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>input{width:96px!important;min-width:96px!important;height:38px!important;padding:4px 10px!important;font-size:15px!important;font-weight:900!important;line-height:1!important;direction:ltr!important;text-align:center!important;color:#111827!important;background:#fff!important}
      .adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;align-items:center!important;gap:10px!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>span{align-self:center!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb645NativeKindHolder{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;min-width:0!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb645NativeKindHolder>button{display:grid!important;place-content:center!important;min-height:50px!important;padding:8px 12px!important;border:1px solid #d7dee8!important;border-radius:11px!important;background:#fff!important;color:#344054!important;text-align:center!important;font-weight:900!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb645NativeKindHolder>button.active{border-color:#315efb!important;background:#eef2ff!important;color:#2447c5!important;box-shadow:0 0 0 2px #315efb16!important}
      .pb645AlbumCategoryRow{grid-column:1/-1;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:10px;padding-top:9px;margin-top:1px;border-top:1px dashed #d8dee8}.pb645AlbumCategoryRow[hidden]{display:none!important}.pb645AlbumCategoryRow>span{font-size:10px;font-weight:900;color:#475569;white-space:nowrap}.pb645AlbumCategoryChoices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pb645AlbumCategoryChoices button{min-height:42px!important;border:1px solid #d7dee8!important;border-radius:10px!important;background:#fff!important;color:#475569!important;font-weight:850!important}.pb645AlbumCategoryChoices button.active{background:#111827!important;color:#fff!important;border-color:#111827!important;box-shadow:none!important}.pb645AlbumVariantHint{grid-column:1/-1;padding:7px 10px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;color:#475569;font-size:9.5px;line-height:1.8}.pb645AlbumVariantHint b{color:#111827}
      .adminAlbumDesignSandbox .albumTemplatePsdOnlyStart.pb645PsdStart{display:grid!important;grid-template-columns:minmax(240px,.65fr) minmax(420px,1.35fr)!important;grid-template-areas:'size psd'!important;gap:10px!important;direction:ltr!important;align-items:stretch!important}.adminAlbumDesignSandbox .albumTemplatePsdOnlyStart.pb645PsdStart>.albumMasterSizeChoice{grid-area:size!important;direction:rtl!important;text-align:right!important;margin:0!important}.adminAlbumDesignSandbox .albumTemplatePsdOnlyStart.pb645PsdStart>.albumTemplatePsdImport{grid-area:psd!important;direction:rtl!important;text-align:right!important;margin:0!important;width:auto!important;min-width:0!important}.adminAlbumDesignSandbox .albumTemplateManager.instagramMode .albumTemplatePsdOnlyStart.pb645PsdStart{grid-template-columns:1fr!important;grid-template-areas:'psd'!important}.adminAlbumDesignSandbox .albumTemplatePsdImport.pb645PsdLayout{display:grid!important;grid-template-columns:132px minmax(0,1fr)!important;grid-template-areas:'preview file'!important;align-items:stretch!important;gap:10px!important}.adminAlbumDesignSandbox .albumTemplatePsdImport.pb645PsdLayout>label{grid-area:file!important;min-width:0!important;direction:rtl!important;text-align:right!important;justify-items:stretch!important}.adminAlbumDesignSandbox .albumTemplatePsdImport.pb645PsdLayout input[type=file]{direction:rtl!important;text-align:right!important}.pb645PsdPreview{grid-area:preview;display:grid;place-items:center;min-height:94px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;overflow:hidden;padding:5px}.pb645PsdPreview img{display:block;width:100%;height:100%;max-height:122px;object-fit:contain;border-radius:7px}.pb645PsdPreview span{font-size:9px;line-height:1.6;color:#98a2b3;text-align:center;padding:8px}
      .adminAlbumDesignSandbox .albumTypographyBankGrid.albumTypographyShelfGrid{grid-template-columns:repeat(8,minmax(0,1fr))!important;gap:7px!important}.adminAlbumDesignSandbox .albumTypographyShelfGrid>article{padding:6px!important;gap:4px!important}.adminAlbumDesignSandbox .albumTypographyShelfGrid .albumTypographyAssetPreview{height:72px!important}.adminAlbumDesignSandbox .albumTypographyShelfGrid>article>b{font-size:8.5px!important}.adminAlbumDesignSandbox .albumTypographyShelfGrid>article>small{font-size:7.5px!important}.adminAlbumDesignSandbox .albumTextPickerModalAnchored.typographyMode .albumTypographyBankGrid{grid-template-columns:repeat(8,minmax(0,1fr))!important}
      .pb645OpenTypographyBank{min-height:36px!important;padding:7px 10px!important;border:1px solid #c7d2fe!important;border-radius:9px!important;background:#eef2ff!important;color:#3730a3!important;font-weight:900!important;cursor:pointer!important}.albumTemplateDetectedText.pb645TypographyTarget{outline:2px solid #6366f1!important;outline-offset:2px!important}
      #pb645TypographyPicker{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:16px;background:#0f172a77;backdrop-filter:blur(3px);direction:rtl;font-family:Vazirmatn,Vazir,Tahoma,sans-serif}#pb645TypographyPicker[hidden]{display:none!important}#pb645TypographyPicker .pb645PickerCard{width:min(1180px,calc(100vw - 24px));height:min(760px,calc(100dvh - 24px));display:flex;flex-direction:column;overflow:hidden;border-radius:18px;background:#fff;box-shadow:0 30px 90px #0f172a55}#pb645TypographyPicker header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border-bottom:1px solid #e5e7eb}#pb645TypographyPicker header div{display:grid;gap:2px}#pb645TypographyPicker header b{font-size:14px}#pb645TypographyPicker header small{font-size:9.5px;color:#667085}#pb645TypographyPicker header button{width:34px;height:34px;border:0;border-radius:10px;background:#f2f4f7;font-size:20px;cursor:pointer}#pb645TypographyPicker .pb645PickerTools{padding:10px 14px;border-bottom:1px solid #eef2f6;background:#fafbfc}#pb645TypographyPicker .pb645PickerTools input{width:100%;height:40px;padding:7px 11px;border:1px solid #d7dee8;border-radius:10px;font:inherit;font-size:11px}#pb645TypographyPicker .pb645PickerGrid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px;padding:12px;overflow:auto;align-content:start}#pb645TypographyPicker .pb645TypographyChoice{position:relative;display:grid;grid-template-rows:92px auto;gap:5px;min-width:0;padding:6px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;cursor:pointer}#pb645TypographyPicker .pb645TypographyChoice:hover{border-color:#94a3b8;background:#f8fafc}#pb645TypographyPicker .pb645TypographyChoice.active{border-color:#315efb;box-shadow:0 0 0 2px #315efb18;background:#eef2ff}#pb645TypographyPicker .pb645TypographyChoice img{width:100%;height:100%;object-fit:contain;background:#fff;border-radius:7px}#pb645TypographyPicker .pb645TypographyChoice span{display:block;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;font-size:8.5px;font-weight:800;color:#334155}
      @media(max-width:1180px){.adminAlbumDesignSandbox .albumTypographyBankGrid.albumTypographyShelfGrid,.adminAlbumDesignSandbox .albumTextPickerModalAnchored.typographyMode .albumTypographyBankGrid,#pb645TypographyPicker .pb645PickerGrid{grid-template-columns:repeat(6,minmax(0,1fr))!important}}
      @media(max-width:900px){.adminAlbumDesignSandbox .albumTypographyBankGrid.albumTypographyShelfGrid,.adminAlbumDesignSandbox .albumTextPickerModalAnchored.typographyMode .albumTypographyBankGrid,#pb645TypographyPicker .pb645PickerGrid{grid-template-columns:repeat(4,minmax(0,1fr))!important}.adminAlbumDesignSandbox .albumTemplatePsdOnlyStart.pb645PsdStart{grid-template-columns:1fr!important;grid-template-areas:'psd' 'size'!important}}
      @media(max-width:760px){.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}{grid-template-columns:1fr!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb645NativeKindHolder{grid-template-columns:repeat(2,minmax(0,1fr))!important}.pb645AlbumCategoryRow{grid-template-columns:1fr!important}.adminAlbumDesignSandbox .albumPsdTypographyCount{min-width:0!important;width:100%!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>input{width:110px!important;min-width:110px!important}.adminAlbumDesignSandbox .albumTemplatePsdImport.pb645PsdLayout{grid-template-columns:1fr!important;grid-template-areas:'file' 'preview'!important}.pb645PsdPreview{min-height:110px}#pb645TypographyPicker{padding:6px}#pb645TypographyPicker .pb645PickerCard{width:calc(100vw - 12px);height:calc(100dvh - 12px);border-radius:14px}#pb645TypographyPicker .pb645PickerGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px;padding:8px}.adminAlbumDesignSandbox .albumTypographyBankGrid.albumTypographyShelfGrid,.adminAlbumDesignSandbox .albumTextPickerModalAnchored.typographyMode .albumTypographyBankGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
    `;document.head.appendChild(s);
  }

  function nativeKindButtons(root){
    if(!root)return {instagram:null,album:null,holder:null};
    const holder=Array.from(root.children).find(el=>el.tagName==='DIV'&&!el.classList.contains('pb645AlbumCategoryRow'))||root.querySelector(':scope > div');
    const buttons=holder?Array.from(holder.querySelectorAll(':scope > button')):[];
    const instagram=buttons.find(b=>/اینستاگرام|instagram/i.test(String(b.textContent||'')))||null;
    const album=buttons.find(b=>/^\s*آلبوم(?:\s|$)/i.test(String(b.textContent||''))||/album/i.test(String(b.textContent||'')))||null;
    return {instagram,album,holder};
  }

  function ensureCategoryRow(root,album){
    let row=root.querySelector('.pb645AlbumCategoryRow');
    if(!row){
      row=document.createElement('div');row.className='pb645AlbumCategoryRow';
      row.innerHTML='<span>دسته‌بندی آلبوم</span><div class="pb645AlbumCategoryChoices"><button type="button" data-variant="normal">آلبوم معمولی</button><button type="button" data-variant="stretched">آلبوم کشیده</button></div><div class="pb645AlbumVariantHint"></div>';
      root.appendChild(row);
      row.querySelector('[data-variant="normal"]').addEventListener('click',()=>{
        setVariant('normal');
        if(!album.classList.contains('active')){album.dataset.pb645PreserveVariant='1';album.click()}
      });
      row.querySelector('[data-variant="stretched"]').addEventListener('click',()=>{
        setVariant('stretched');
        if(!album.classList.contains('active')){album.dataset.pb645PreserveVariant='1';album.click()}
      });
    }
    return row;
  }

  function bindNativeDesignButtons(root){
    root.querySelectorAll('.pb643DesignKindChoices,.pb644DesignKindChoices,.pb644StretchedChoice').forEach(x=>x.remove());
    const {instagram,album,holder}=nativeKindButtons(root);
    if(!holder||!instagram||!album)return false;
    holder.classList.remove('pb644NativeKindHolder');holder.classList.add('pb645NativeKindHolder');
    Array.from(holder.querySelectorAll(':scope > button')).forEach(b=>{if(b!==instagram&&b!==album)b.style.display='none'});
    if(!instagram.dataset.pb645Bound){
      instagram.dataset.pb645Bound='1';
      instagram.addEventListener('click',()=>setTimeout(()=>syncDesignKindUi(lastSandbox),20),true);
    }
    if(!album.dataset.pb645Bound){
      album.dataset.pb645Bound='1';
      album.addEventListener('click',()=>{
        if(album.dataset.pb645PreserveVariant==='1')delete album.dataset.pb645PreserveVariant;else setVariant('normal');
        setTimeout(()=>syncDesignKindUi(lastSandbox),20);
      },true);
    }
    if(String(instagram.textContent||'').trim()!=='اینستاگرام')instagram.textContent='اینستاگرام';
    if(String(album.textContent||'').trim()!=='آلبوم')album.textContent='آلبوم';
    ensureCategoryRow(root,album);
    return true;
  }

  function syncDesignKindUi(sandbox=lastSandbox){
    if(!sandbox||!sandbox.isConnected)return;
    const root=sandbox.querySelector('.albumTemplateDesignKind.'+ENHANCED);if(!root)return;
    const {instagram,album}=nativeKindButtons(root);if(!instagram||!album)return;
    const instagramActive=instagram.classList.contains('active');
    const albumActive=album.classList.contains('active')&&!instagramActive;
    const row=root.querySelector('.pb645AlbumCategoryRow');
    if(row){
      row.hidden=!albumActive;
      row.querySelectorAll('[data-variant]').forEach(b=>b.classList.toggle('active',String(b.dataset.variant)===albumVariant));
      const hint=row.querySelector('.pb645AlbumVariantHint');
      if(hint)hint.innerHTML=albumVariant==='stretched'?'<b>آلبوم کشیده</b> · PSDهای کشیده در همین دسته ذخیره می‌شوند.':'<b>آلبوم معمولی</b> · PSDهای معمولی در همین دسته ذخیره می‌شوند.';
    }
    if(instagramActive){
      const manager=root.closest('.albumTemplateManager');manager?.classList.add('instagramMode');manager?.classList.remove('albumMode');
    }
  }

  function syncPsdPanel(sandbox){
    const start=sandbox.querySelector('.albumTemplatePsdOnlyStart');if(start)start.classList.add('pb645PsdStart');
    const box=sandbox.querySelector('.albumTemplatePsdImport');if(!box)return;
    box.classList.add('pb645PsdLayout');
    let preview=box.querySelector('.pb645PsdPreview');
    if(!preview){preview=document.createElement('div');preview.className='pb645PsdPreview';preview.innerHTML='<span>پیش‌نمایش PSD بعد از انتخاب فایل اینجا نمایش داده می‌شود.</span>';box.appendChild(preview)}
    const source=sandbox.querySelector('.albumTemplateSlotStep .albumSlotBuilderArtwork');
    const src=source?.getAttribute('src')||'';
    const old=preview.querySelector('img')?.getAttribute('src')||'';
    if(src&&src!==old){preview.replaceChildren();const img=document.createElement('img');img.src=src;img.alt='پیش‌نمایش PSD';preview.appendChild(img)}
    if(!src&&preview.querySelector('img'))preview.innerHTML='<span>پیش‌نمایش PSD بعد از انتخاب فایل اینجا نمایش داده می‌شود.</span>';
  }

  function closePicker(){const modal=document.getElementById('pb645TypographyPicker');if(modal)modal.hidden=true}
  function ensurePicker(){
    let modal=document.getElementById('pb645TypographyPicker');if(modal)return modal;
    modal=document.createElement('div');modal.id='pb645TypographyPicker';modal.hidden=true;
    modal.innerHTML='<section class="pb645PickerCard"><header><div><b>بانک Typography</b><small>طرح جایگزین را برای همین لایه انتخاب کن.</small></div><button type="button" aria-label="بستن">×</button></header><div class="pb645PickerTools"><input type="search" placeholder="جستجو در نام Typography…"/></div><div class="pb645PickerGrid"></div></section>';
    modal.addEventListener('pointerdown',e=>{if(e.target===modal)closePicker()});
    modal.querySelector('header button').onclick=closePicker;
    modal.querySelector('input').addEventListener('input',e=>{const q=String(e.target.value||'').trim().toLowerCase();modal.querySelectorAll('.pb645TypographyChoice').forEach(x=>x.hidden=Boolean(q&&!String(x.dataset.search||'').includes(q)))});
    document.body.appendChild(modal);return modal;
  }
  function bankArticles(sandbox){return Array.from(sandbox?.querySelectorAll('.albumTypographyBankGrid .albumTypographyAdminAsset')||[])}
  function openTypographyPicker(article){
    const sandbox=article?.closest('.adminAlbumDesignSandbox');if(!article||!sandbox)return;
    sandbox.querySelectorAll('.albumTemplateDetectedText.pb645TypographyTarget').forEach(x=>x.classList.remove('pb645TypographyTarget'));article.classList.add('pb645TypographyTarget');
    const select=article.querySelector('.albumDetectedTypographyDefaultPicker select');if(!select)return toast('فهرست Typography این لایه پیدا نشد.','error');
    const options=Array.from(select.options||[]).filter(o=>String(o.value||'')),assets=bankArticles(sandbox),modal=ensurePicker(),grid=modal.querySelector('.pb645PickerGrid');grid.replaceChildren();
    const assetById=new Map();for(const asset of assets){const key=String(asset.querySelector('b')?.textContent||'').trim().toLowerCase();if(key)assetById.set(key,asset)}
    const frag=document.createDocumentFragment();
    for(const opt of options){
      const name=String(opt.textContent||opt.value).trim(),asset=assetById.get(name.toLowerCase())||assets.find(a=>String(a.textContent||'').includes(name)),src=asset?.querySelector('.albumTypographyAssetPreview img')?.getAttribute('src')||'';
      const b=document.createElement('button');b.type='button';b.className='pb645TypographyChoice'+(String(select.value)===String(opt.value)?' active':'');b.dataset.search=name.toLowerCase();
      if(src){const im=document.createElement('img');im.src=src;im.alt='';b.appendChild(im)}else b.appendChild(document.createElement('span'));
      const label=document.createElement('span');label.textContent=name;b.appendChild(label);
      b.onclick=()=>{select.value=opt.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));toast('Typography این لایه تغییر کرد.');closePicker();setTimeout(()=>article.scrollIntoView({behavior:'smooth',block:'center'}),40)};
      frag.appendChild(b);
    }
    grid.appendChild(frag);modal.querySelector('input').value='';modal.hidden=false;
  }
  function enhanceTypographyArticles(sandbox){
    for(const article of sandbox.querySelectorAll('.albumTemplateDetectedText')){
      const picker=article.querySelector('.albumDetectedTypographyDefaultPicker');if(!picker||picker.querySelector('.pb645OpenTypographyBank'))continue;
      picker.querySelectorAll('.pb644OpenTypographyBank,.pb643OpenTypographyBank').forEach(x=>x.remove());
      const button=document.createElement('button');button.type='button';button.className='pb645OpenTypographyBank';button.textContent='باز کردن بانک Typography';button.onclick=e=>{e.preventDefault();e.stopPropagation();openTypographyPicker(article)};picker.insertBefore(button,picker.querySelector('.albumAdminTypographySelectedPreview')||null);
    }
  }
  function hideSlideshowAdminCards(sandbox){for(const card of sandbox.querySelectorAll('.albumDesignTemplateCard'))if(/slideshow|اسلایدشو/i.test(String(card.textContent||'')))card.style.display='none'}

  function enhanceNow(){
    enhanceTimer=0;const sandbox=document.querySelector('.adminAlbumDesignSandbox');if(!sandbox){lastSandbox=null;return}
    lastSandbox=sandbox;installStyle();
    const root=sandbox.querySelector('.albumTemplateDesignKind');
    if(root){root.classList.remove('pb643Enhanced','pb644Enhanced');root.classList.add(ENHANCED);bindNativeDesignButtons(root);syncDesignKindUi(sandbox)}
    syncPsdPanel(sandbox);enhanceTypographyArticles(sandbox);hideSlideshowAdminCards(sandbox);
  }
  function scheduleEnhance(delay=80){if(enhanceTimer)return;enhanceTimer=setTimeout(enhanceNow,delay)}
  function installObserver(){if(observer)return;const root=document.getElementById('root')||document.body;observer=new MutationObserver(m=>{if(m.some(x=>x.type==='childList'))scheduleEnhance(100)});observer.observe(root,{subtree:true,childList:true})}

  document.addEventListener('click',e=>{
    const sandbox=e.target.closest?.('.adminAlbumDesignSandbox');if(!sandbox)return;
    const edit=e.target.closest?.('.albumDesignTemplateCardActions .edit');if(edit){const txt=String(edit.closest('.albumDesignTemplateCard')?.textContent||'');setVariant(/کشیده|۳۰\s*[×x]\s*۶۰|۴۰\s*[×x]\s*۸۰/.test(txt)?'stretched':'normal')}
    if(e.target.closest?.('.albumTemplateNewButton'))setVariant('normal');
    const hotspot=e.target.closest?.('.albumSlotBuilderTextHotspot');if(hotspot&&String(hotspot.querySelector('.albumSlotTextLabel')?.textContent||'').toLowerCase().includes('typography'))setTimeout(()=>{const article=sandbox.querySelector('.albumTemplateDetectedText.pb613TypographyPopup');if(article){enhanceTypographyArticles(sandbox);openTypographyPicker(article)}},80);
  },true);

  const start=()=>{installStyle();scheduleEnhance(100);installObserver();console.info('[PhotoBridge] admin album patch',VERSION)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
