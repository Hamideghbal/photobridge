(()=>{
  'use strict';
  if(!/^\/admin(?:\/|$)/.test(location.pathname)) return;
  const VERSION='646';
  const VARIANT_KEY='pb646AdminAlbumVariant';
  const ENHANCED='pb646Enhanced';
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
    let root=document.getElementById('pb646AdminAlbumToast');
    if(!root){root=document.createElement('div');root.id='pb646AdminAlbumToast';document.body.appendChild(root)}
    root.className=tone==='error'?'error':'ok';root.textContent=message;root.hidden=false;
    clearTimeout(toast._t);toast._t=setTimeout(()=>{root.hidden=true},2600);
  }
  toast._t=0;

  // Save Album sub-category independently from the React designKind.
  if(!window.__pb646AdminAlbumFetchWrapped){
    window.__pb646AdminAlbumFetchWrapped=true;
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
    if(document.getElementById('pb646AdminAlbumStyle'))return;
    const s=document.createElement('style');s.id='pb646AdminAlbumStyle';s.textContent=`
      #pb646AdminAlbumToast{position:fixed;top:72px;left:50%;transform:translateX(-50%);z-index:2147483500;direction:rtl;font-family:Vazirmatn,Vazir,Tahoma,sans-serif;padding:10px 14px;border-radius:12px;background:#ecfdf3;color:#067647;border:1px solid #a6f4c5;box-shadow:0 10px 35px #0f172a22;font-size:11px;font-weight:850}#pb646AdminAlbumToast.error{background:#fff1f2;color:#b42318;border-color:#fecdd3}#pb646AdminAlbumToast[hidden]{display:none!important}
      .adminAlbumDesignSandbox .albumPsdTypographyCount{min-width:210px!important;justify-content:space-between!important;padding:7px 9px!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>span{font-size:10px!important;font-weight:800!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>input{width:96px!important;min-width:96px!important;height:38px!important;padding:4px 10px!important;font-size:15px!important;font-weight:900!important;line-height:1!important;direction:ltr!important;text-align:center!important;color:#111827!important;background:#fff!important}
      .adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;align-items:center!important;gap:10px!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>span{align-self:center!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb646NativeKindHolder{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;min-width:0!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb646NativeKindHolder>button{display:grid!important;place-content:center!important;min-height:50px!important;padding:8px 12px!important;border:1px solid #d7dee8!important;border-radius:11px!important;background:#fff!important;color:#344054!important;text-align:center!important;font-weight:900!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb646NativeKindHolder>button.active{border-color:#315efb!important;background:#eef2ff!important;color:#2447c5!important;box-shadow:0 0 0 2px #315efb16!important}
      .pb646AlbumCategoryRow{grid-column:1/-1;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:10px;padding-top:9px;margin-top:1px;border-top:1px dashed #d8dee8}.pb646AlbumCategoryRow[hidden]{display:none!important}.pb646AlbumCategoryRow>span{font-size:10px;font-weight:900;color:#475569;white-space:nowrap}.pb646AlbumCategoryChoices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pb646AlbumCategoryChoices button{min-height:42px!important;border:1px solid #d7dee8!important;border-radius:10px!important;background:#fff!important;color:#475569!important;font-weight:850!important}.pb646AlbumCategoryChoices button.active{background:#111827!important;color:#fff!important;border-color:#111827!important;box-shadow:none!important}.pb646AlbumVariantHint{grid-column:1/-1;padding:7px 10px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;color:#475569;font-size:9.5px;line-height:1.8}.pb646AlbumVariantHint b{color:#111827}
      .adminAlbumDesignSandbox .albumTemplatePsdOnlyStart.pb646PsdStart{display:block!important;direction:rtl!important}.adminAlbumDesignSandbox .albumTemplatePsdOnlyStart.pb646PsdStart>.albumMasterSizeChoice{display:none!important}.adminAlbumDesignSandbox .albumTemplatePsdOnlyStart.pb646PsdStart>.albumTemplatePsdImport{width:100%!important;min-width:0!important;margin:0!important;direction:rtl!important;text-align:right!important}
      .adminAlbumDesignSandbox .albumTemplatePsdImport.pb646PsdLayout{display:grid!important;grid-template-columns:150px minmax(0,1fr)!important;grid-template-rows:auto auto minmax(110px,auto)!important;gap:10px!important;direction:ltr!important;align-items:stretch!important}.adminAlbumDesignSandbox .albumTemplatePsdImport.pb646PsdLayout>.albumPsdTextLayerToggle{grid-column:1/-1!important;direction:rtl!important;text-align:right!important}.adminAlbumDesignSandbox .albumTemplatePsdImport.pb646PsdLayout>label:has(input[type=file]){grid-column:2!important;grid-row:3!important;min-width:0!important;direction:rtl!important;text-align:right!important;justify-items:stretch!important}.adminAlbumDesignSandbox .albumTemplatePsdImport.pb646PsdLayout input[type=file]{direction:rtl!important;text-align:right!important}.pb646PsdPreview{grid-column:1!important;grid-row:3!important;display:grid;place-items:center;min-height:110px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;overflow:hidden;padding:5px;direction:rtl}.pb646PsdPreview img{display:block;width:100%;height:100%;max-height:145px;object-fit:contain;border-radius:7px}.pb646PsdPreview span{font-size:9px;line-height:1.6;color:#98a2b3;text-align:center;padding:8px}
      .adminAlbumDesignSandbox .albumTypographyBankGrid.albumTypographyShelfGrid,.adminAlbumDesignSandbox .albumTextPickerModalAnchored.typographyMode .albumTypographyBankGrid{grid-template-columns:repeat(8,minmax(0,1fr))!important;gap:7px!important}.adminAlbumDesignSandbox .albumTypographyShelfGrid>article{padding:6px!important;gap:4px!important}.adminAlbumDesignSandbox .albumTypographyShelfGrid .albumTypographyAssetPreview{height:72px!important}.adminAlbumDesignSandbox .albumTypographyShelfGrid>article>b{font-size:8.5px!important}.adminAlbumDesignSandbox .albumTypographyShelfGrid>article>small{font-size:7.5px!important}
      .pb646OpenTypographyBank{min-height:36px!important;padding:7px 10px!important;border:1px solid #c7d2fe!important;border-radius:9px!important;background:#eef2ff!important;color:#3730a3!important;font-weight:900!important;cursor:pointer!important}.albumTemplateDetectedText.pb646TypographyTarget{outline:2px solid #6366f1!important;outline-offset:2px!important}
      #pb646TypographyPicker{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:16px;background:#0f172a77;backdrop-filter:blur(3px);direction:rtl;font-family:Vazirmatn,Vazir,Tahoma,sans-serif}#pb646TypographyPicker[hidden]{display:none!important}#pb646TypographyPicker .pb646PickerCard{width:min(1180px,calc(100vw - 24px));height:min(760px,calc(100dvh - 24px));display:flex;flex-direction:column;overflow:hidden;border-radius:18px;background:#fff;box-shadow:0 30px 90px #0f172a55}#pb646TypographyPicker header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border-bottom:1px solid #e5e7eb}#pb646TypographyPicker header div{display:grid;gap:2px}#pb646TypographyPicker header b{font-size:14px}#pb646TypographyPicker header small{font-size:9.5px;color:#667085}#pb646TypographyPicker header button{width:34px;height:34px;border:0;border-radius:10px;background:#f2f4f7;font-size:20px;cursor:pointer}#pb646TypographyPicker .pb646PickerTools{padding:10px 14px;border-bottom:1px solid #eef2f6;background:#fafbfc}#pb646TypographyPicker .pb646PickerTools input{width:100%;height:40px;padding:7px 11px;border:1px solid #d7dee8;border-radius:10px;font:inherit;font-size:11px}#pb646TypographyPicker .pb646PickerGrid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px;padding:12px;overflow:auto;align-content:start}#pb646TypographyPicker .pb646TypographyChoice{position:relative;display:grid;grid-template-rows:92px auto;gap:5px;min-width:0;padding:6px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;cursor:pointer}#pb646TypographyPicker .pb646TypographyChoice:hover{border-color:#94a3b8;background:#f8fafc}#pb646TypographyPicker .pb646TypographyChoice.active{border-color:#315efb;box-shadow:0 0 0 2px #315efb18;background:#eef2ff}#pb646TypographyPicker .pb646TypographyChoice img{width:100%;height:100%;object-fit:contain;background:#fff;border-radius:7px}#pb646TypographyPicker .pb646TypographyChoice span{display:block;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;font-size:8.5px;font-weight:800;color:#334155}
      @media(max-width:760px){.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}{grid-template-columns:1fr!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.${ENHANCED}>div.pb646NativeKindHolder{grid-template-columns:repeat(2,minmax(0,1fr))!important}.pb646AlbumCategoryRow{grid-template-columns:1fr!important}.adminAlbumDesignSandbox .albumPsdTypographyCount{min-width:0!important;width:100%!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>input{width:110px!important;min-width:110px!important}.adminAlbumDesignSandbox .albumTemplatePsdImport.pb646PsdLayout{grid-template-columns:1fr!important;grid-template-rows:auto auto auto auto!important}.adminAlbumDesignSandbox .albumTemplatePsdImport.pb646PsdLayout>label:has(input[type=file]){grid-column:1!important;grid-row:3!important}.pb646PsdPreview{grid-column:1!important;grid-row:4!important;min-height:110px}#pb646TypographyPicker{padding:6px}#pb646TypographyPicker .pb646PickerCard{width:calc(100vw - 12px);height:calc(100dvh - 12px);border-radius:14px}#pb646TypographyPicker .pb646PickerGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px;padding:8px}.adminAlbumDesignSandbox .albumTypographyBankGrid.albumTypographyShelfGrid,.adminAlbumDesignSandbox .albumTextPickerModalAnchored.typographyMode .albumTypographyBankGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
    `;document.head.appendChild(s);
  }

  function nativeKindButtons(root){
    if(!root)return {instagram:null,album:null,holder:null};
    const holder=Array.from(root.children).find(el=>el.tagName==='DIV'&&!el.classList.contains('pb646AlbumCategoryRow'))||root.querySelector(':scope > div');
    const buttons=holder?Array.from(holder.querySelectorAll(':scope > button')):[];
    const instagram=buttons.find(b=>/اینستاگرام|instagram/i.test(String(b.textContent||'')))||null;
    const album=buttons.find(b=>/^\s*آلبوم(?:\s|$)/i.test(String(b.textContent||''))||/album/i.test(String(b.textContent||'')))||null;
    return {instagram,album,holder};
  }

  function ensureCategoryRow(root,album){
    let row=root.querySelector('.pb646AlbumCategoryRow');
    if(!row){
      row=document.createElement('div');row.className='pb646AlbumCategoryRow';
      row.innerHTML='<span>دسته‌بندی آلبوم</span><div class="pb646AlbumCategoryChoices"><button type="button" data-variant="normal">آلبوم معمولی</button><button type="button" data-variant="stretched">آلبوم کشیده</button></div><div class="pb646AlbumVariantHint"></div>';
      root.appendChild(row);
      row.querySelector('[data-variant="normal"]').addEventListener('click',()=>{
        setVariant('normal');
        if(!album.classList.contains('active')){album.dataset.pb646PreserveVariant='1';album.click()}
      });
      row.querySelector('[data-variant="stretched"]').addEventListener('click',()=>{
        setVariant('stretched');
        if(!album.classList.contains('active')){album.dataset.pb646PreserveVariant='1';album.click()}
      });
    }
    return row;
  }

  function bindNativeDesignButtons(root){
    root.querySelectorAll('.pb643DesignKindChoices,.pb644DesignKindChoices,.pb644StretchedChoice').forEach(x=>x.remove());
    const {instagram,album,holder}=nativeKindButtons(root);
    if(!holder||!instagram||!album)return false;
    holder.classList.remove('pb644NativeKindHolder');holder.classList.add('pb646NativeKindHolder');
    Array.from(holder.querySelectorAll(':scope > button')).forEach(b=>{const txt=String(b.textContent||'');if(b!==instagram&&b!==album||/slideshow|اسلایدشو/i.test(txt))b.style.display='none'});
    if(!instagram.dataset.pb646Bound){
      instagram.dataset.pb646Bound='1';
      instagram.addEventListener('click',()=>setTimeout(()=>syncDesignKindUi(lastSandbox),20),true);
    }
    if(!album.dataset.pb646Bound){
      album.dataset.pb646Bound='1';
      album.addEventListener('click',()=>{
        if(album.dataset.pb646PreserveVariant==='1')delete album.dataset.pb646PreserveVariant;else setVariant('normal');
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
    const row=root.querySelector('.pb646AlbumCategoryRow');
    if(row){
      row.hidden=!albumActive;
      row.querySelectorAll('[data-variant]').forEach(b=>b.classList.toggle('active',String(b.dataset.variant)===albumVariant));
      const hint=row.querySelector('.pb646AlbumVariantHint');
      if(hint)hint.innerHTML=albumVariant==='stretched'?'<b>آلبوم کشیده</b> · PSDهای کشیده در همین دسته ذخیره می‌شوند.':'<b>آلبوم معمولی</b> · PSDهای معمولی در همین دسته ذخیره می‌شوند.';
    }
    const manager=root.closest('.albumTemplateManager');
    if(manager){manager.classList.toggle('instagramMode',instagramActive);manager.classList.toggle('albumMode',albumActive)}
  }

  function syncPsdPanel(sandbox){
    const start=sandbox.querySelector('.albumTemplatePsdOnlyStart');if(start)start.classList.add('pb646PsdStart');
    const box=sandbox.querySelector('.albumTemplatePsdImport');if(!box)return;
    box.classList.add('pb646PsdLayout');
    let preview=box.querySelector('.pb646PsdPreview');
    if(!preview){preview=document.createElement('div');preview.className='pb646PsdPreview';preview.innerHTML='<span>پیش‌نمایش PSD بعد از انتخاب فایل اینجا نمایش داده می‌شود.</span>';box.appendChild(preview)}
    const source=sandbox.querySelector('.albumTemplateSlotStep .albumSlotBuilderArtwork,.albumTemplateSlotPreview img,.albumSlotBuilderArtwork,.albumTemplateCanvas img');
    const src=source?.getAttribute('src')||'';
    const old=preview.querySelector('img')?.getAttribute('src')||'';
    if(src&&src!==old){preview.replaceChildren();const img=document.createElement('img');img.src=src;img.alt='پیش‌نمایش PSD';preview.appendChild(img)}
    if(!src&&preview.querySelector('img'))preview.innerHTML='<span>پیش‌نمایش PSD بعد از انتخاب فایل اینجا نمایش داده می‌شود.</span>';
  }

  function closePicker(){const modal=document.getElementById('pb646TypographyPicker');if(modal)modal.hidden=true}
  function ensurePicker(){
    let modal=document.getElementById('pb646TypographyPicker');if(modal)return modal;
    modal=document.createElement('div');modal.id='pb646TypographyPicker';modal.hidden=true;
    modal.innerHTML='<section class="pb646PickerCard"><header><div><b>بانک Typography</b><small>طرح جایگزین را برای همین لایه انتخاب کن.</small></div><button type="button" aria-label="بستن">×</button></header><div class="pb646PickerTools"><input type="search" placeholder="جستجو در نام Typography…"/></div><div class="pb646PickerGrid"></div></section>';
    modal.addEventListener('pointerdown',e=>{if(e.target===modal)closePicker()});
    modal.querySelector('header button').onclick=closePicker;
    modal.querySelector('input').addEventListener('input',e=>{const q=String(e.target.value||'').trim().toLowerCase();modal.querySelectorAll('.pb646TypographyChoice').forEach(x=>x.hidden=Boolean(q&&!String(x.dataset.search||'').includes(q)))});
    document.body.appendChild(modal);return modal;
  }
  function bankArticles(sandbox){return Array.from(sandbox?.querySelectorAll('.albumTypographyBankGrid .albumTypographyAdminAsset')||[])}
  function openTypographyPicker(article){
    const sandbox=article?.closest('.adminAlbumDesignSandbox');if(!article||!sandbox)return;
    sandbox.querySelectorAll('.albumTemplateDetectedText.pb646TypographyTarget').forEach(x=>x.classList.remove('pb646TypographyTarget'));article.classList.add('pb646TypographyTarget');
    const select=article.querySelector('.albumDetectedTypographyDefaultPicker select');if(!select)return toast('فهرست Typography این لایه پیدا نشد.','error');
    const options=Array.from(select.options||[]).filter(o=>String(o.value||'')),assets=bankArticles(sandbox),modal=ensurePicker(),grid=modal.querySelector('.pb646PickerGrid');grid.replaceChildren();
    const assetById=new Map();for(const asset of assets){const key=String(asset.querySelector('b')?.textContent||'').trim().toLowerCase();if(key)assetById.set(key,asset)}
    const frag=document.createDocumentFragment();
    for(const opt of options){
      const name=String(opt.textContent||opt.value).trim(),asset=assetById.get(name.toLowerCase())||assets.find(a=>String(a.textContent||'').includes(name)),src=asset?.querySelector('.albumTypographyAssetPreview img')?.getAttribute('src')||'';
      const b=document.createElement('button');b.type='button';b.className='pb646TypographyChoice'+(String(select.value)===String(opt.value)?' active':'');b.dataset.search=name.toLowerCase();
      if(src){const im=document.createElement('img');im.src=src;im.alt='';b.appendChild(im)}else b.appendChild(document.createElement('span'));
      const label=document.createElement('span');label.textContent=name;b.appendChild(label);
      b.onclick=()=>{select.value=opt.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));toast('Typography این لایه تغییر کرد.');closePicker();setTimeout(()=>article.scrollIntoView({behavior:'smooth',block:'center'}),40)};
      frag.appendChild(b);
    }
    grid.appendChild(frag);modal.querySelector('input').value='';modal.hidden=false;
  }
  function enhanceTypographyArticles(sandbox){
    for(const article of sandbox.querySelectorAll('.albumTemplateDetectedText')){
      const picker=article.querySelector('.albumDetectedTypographyDefaultPicker');if(!picker||picker.querySelector('.pb646OpenTypographyBank'))continue;
      picker.querySelectorAll('.pb644OpenTypographyBank,.pb643OpenTypographyBank').forEach(x=>x.remove());
      const button=document.createElement('button');button.type='button';button.className='pb646OpenTypographyBank';button.textContent='باز کردن بانک Typography';button.onclick=e=>{e.preventDefault();e.stopPropagation();openTypographyPicker(article)};picker.insertBefore(button,picker.querySelector('.albumAdminTypographySelectedPreview')||null);
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


/* PhotoBridge v0.17.663 — public high-quality output gateway prices (multi-digit safe) */
(()=>{ 'use strict';
  const BOX_CLASS='pb659PublicGatewayPrices', BOX_ID='pb660PublicGatewayPrices';
  let busy=false,checkout=null,mounting=false,scheduled=false;
  const asciiDigits=v=>String(v??'').replace(/[۰-۹]/g,ch=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch))).replace(/[٠-٩]/g,ch=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(ch))).replace(/[^0-9]/g,'');
  const money=v=>String(Math.max(0,Math.round(Number(asciiDigits(v))||0)));
  const pretty=v=>Number(money(v)||0).toLocaleString('fa-IR');
  async function getCheckout(){if(checkout)return checkout;const r=await fetch('/api/admin/test-album-design',{credentials:'same-origin'});if(!r.ok)throw new Error('load');const d=await r.json();checkout=d.checkout||{};return checkout}
  async function save(box){if(busy)return;busy=true;const btn=box.querySelector('button'),inputs=box.querySelectorAll('input');if(btn)btn.textContent='در حال ذخیره…';try{const body={publicInstagramPriceToman:Number(money(inputs[0]?.value)),publicExportPriceToman:Number(money(inputs[1]?.value))},r=await fetch('/api/admin/test-album-design/checkout',{method:'PUT',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),d=await r.json();if(!r.ok)throw new Error(d.error||'save');checkout=d.checkout||body;inputs[0].value=pretty(checkout.publicInstagramPriceToman||0);inputs[1].value=pretty(checkout.publicExportPriceToman||0);alert('تعرفه پرداخت آنلاین خروجی باکیفیت ذخیره شد.')}catch(e){alert('ذخیره تعرفه درگاه انجام نشد.')}finally{busy=false;if(btn)btn.textContent='ذخیره تعرفه درگاه'}}
  function normalizeExisting(panel){
    const boxes=Array.from(document.querySelectorAll('.'+BOX_CLASS+',#'+BOX_ID));
    if(!boxes.length)return null;
    const keep=boxes[0];
    for(const extra of boxes.slice(1))extra.remove();
    keep.id=BOX_ID;keep.classList.add(BOX_CLASS);
    if(panel.nextElementSibling!==keep)panel.insertAdjacentElement('afterend',keep);
    panel.dataset.pb660GatewayMounted='1';
    return keep;
  }
  async function decorate(){
    const panel=document.querySelector('.albumDesignCheckoutAdmin');if(!panel)return;
    if(normalizeExisting(panel))return;
    if(mounting)return;mounting=true;
    try{
      const c=await getCheckout();
      const livePanel=document.querySelector('.albumDesignCheckoutAdmin');if(!livePanel)return;
      if(normalizeExisting(livePanel))return;
      const box=document.createElement('section');box.id=BOX_ID;box.className=BOX_CLASS;
      box.innerHTML='<div><b>پرداخت آنلاین خروجی باکیفیت</b><small>مبلغی که مشتری بدون عضویت قبل از دانلود فایل کیفیت بالا در درگاه پرداخت می‌کند.</small></div><label><span>اینستاگرام باکیفیت</span><input inputmode="numeric" aria-label="قیمت خروجی باکیفیت اینستاگرام"></label><label><span>آلبوم باکیفیت عمومی</span><input inputmode="numeric" aria-label="قیمت خروجی باکیفیت آلبوم"></label><button type="button" class="primary">ذخیره تعرفه درگاه</button>';
      const ins=box.querySelectorAll('input');ins[0].value=pretty(c.publicInstagramPriceToman||0);ins[1].value=pretty(c.publicExportPriceToman||0);
      ins.forEach(i=>{i.autocomplete='off';i.addEventListener('focus',()=>{i.value=money(i.value)==='0'?'':money(i.value);i.select?.()});i.addEventListener('input',()=>{const digits=asciiDigits(i.value);i.value=digits.replace(/^0+(?=\d)/,'')});i.addEventListener('blur',()=>{i.value=pretty(i.value)})});box.querySelector('button').onclick=()=>save(box);
      livePanel.insertAdjacentElement('afterend',box);livePanel.dataset.pb660GatewayMounted='1';
    }finally{mounting=false}
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;void decorate()})}
  const observer=new MutationObserver(m=>{if(m.some(x=>x.type==='childList'))schedule()});observer.observe(document.documentElement,{subtree:true,childList:true});
  addEventListener('DOMContentLoaded',schedule,{once:true});if(document.readyState!=='loading')schedule();
})();

/* PhotoBridge v0.17.663 — admin PSD movement lock + compact builder controls */
(()=>{
  'use strict';
  if(!/^\/admin(?:\/|$)/.test(location.pathname))return;
  let movementLocked=true,currentBuilder=null,scheduled=false;
  const blockedPointers=new Set();
  const MOVABLE='.albumSlotBuilderBox,.albumSlotBuilderTextHotspot,.albumSlotBuilderCustomSample';
  function installStyle(){
    if(document.getElementById('pb662AdminPsdLockStyle'))return;
    const s=document.createElement('style');s.id='pb662AdminPsdLockStyle';s.textContent=`
      .adminAlbumDesignSandbox .albumSlotBuilderToolbar{position:sticky!important;top:0!important;z-index:260!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:6px!important;min-height:42px!important;padding:5px 7px!important;margin:0 0 5px!important;border:1px solid #e3e8ef!important;border-radius:10px!important;background:rgba(255,255,255,.97)!important;box-shadow:0 4px 14px #0f172a10!important;backdrop-filter:blur(8px)!important}
      .adminAlbumDesignSandbox .albumSlotBuilderToolbar>div:first-child{display:flex!important;align-items:center!important;flex:0 0 auto!important;min-width:0!important}.adminAlbumDesignSandbox .albumSlotBuilderToolbar>div:first-child b{font-size:9px!important;line-height:1!important;white-space:nowrap!important}.adminAlbumDesignSandbox .albumSlotBuilderToolbar>div:first-child small{display:none!important}
      .adminAlbumDesignSandbox .albumSlotBuilderToolbar>div:last-child{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:4px!important;flex:1 1 auto!important;min-width:0!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important}.adminAlbumDesignSandbox .albumSlotBuilderToolbar>div:last-child::-webkit-scrollbar{display:none!important}
      .adminAlbumDesignSandbox .albumSlotBuilderToolbar button{flex:0 0 auto!important;min-height:29px!important;height:29px!important;padding:0 7px!important;border-radius:7px!important;font-size:7.5px!important;line-height:1!important;white-space:nowrap!important}.adminAlbumDesignSandbox .albumSlotBuilderToolbar span{flex:0 0 auto!important;padding:4px 6px!important;font-size:7px!important;white-space:nowrap!important}
      .adminAlbumDesignSandbox .albumSlotBuilderToolbar .pb662MovementLock{border-color:#cbd5e1!important;background:#f8fafc!important;color:#475569!important;font-weight:900!important}.adminAlbumDesignSandbox .albumSlotBuilderToolbar .pb662MovementLock.active{border-color:#f59e0b!important;background:#fff7ed!important;color:#9a3412!important}
      .adminAlbumDesignSandbox .albumSlotSampleManager{gap:6px!important;padding:6px 8px!important;margin:4px 0!important;border-radius:9px!important}.adminAlbumDesignSandbox .albumSlotSampleManager>div:first-child small{display:none!important}.adminAlbumDesignSandbox .albumSlotSampleManager>div:first-child b{font-size:8px!important}.adminAlbumDesignSandbox .albumSlotSampleManager button{min-height:29px!important;height:29px!important;padding:0 7px!important;font-size:7.5px!important;border-radius:7px!important}.adminAlbumDesignSandbox .albumSlotSampleManager label{font-size:7.5px!important;gap:3px!important}.adminAlbumDesignSandbox .albumSlotSampleManager input[type=range]{min-height:18px!important}
      .adminAlbumDesignSandbox.pb662MovementLocked .albumSlotBuilderBox,.adminAlbumDesignSandbox.pb662MovementLocked .albumSlotBuilderTextHotspot,.adminAlbumDesignSandbox.pb662MovementLocked .albumSlotBuilderCustomSample{cursor:default!important}.adminAlbumDesignSandbox.pb662MovementLocked .albumSlotBuilderBox.selected>i,.adminAlbumDesignSandbox.pb662MovementLocked .albumSlotBuilderTextHotspot.selected>i{opacity:.28!important;cursor:not-allowed!important}
      @media(max-width:820px){.adminAlbumDesignSandbox .albumSlotBuilderToolbar{min-height:39px!important;padding:4px 5px!important;border-radius:8px!important}.adminAlbumDesignSandbox .albumSlotBuilderToolbar>div:first-child b{font-size:7.5px!important}.adminAlbumDesignSandbox .albumSlotBuilderToolbar button{height:28px!important;min-height:28px!important;padding:0 6px!important;font-size:7px!important}.adminAlbumDesignSandbox .albumSlotBuilderToolbar span{font-size:6.5px!important;padding-inline:4px!important}}
    `;document.head.appendChild(s);
  }
  function setLocked(on){movementLocked=Boolean(on);const sandbox=document.querySelector('.adminAlbumDesignSandbox');sandbox?.classList.toggle('pb662MovementLocked',movementLocked);const b=sandbox?.querySelector('.pb662MovementLock');if(b){b.classList.toggle('active',movementLocked);b.setAttribute('aria-pressed',movementLocked?'true':'false');b.textContent=movementLocked?'🔒 حرکت قفل':'🔓 حرکت آزاد';b.title=movementLocked?'لایه‌ها جابه‌جا نمی‌شوند؛ برای حرکت دادن قفل را باز کن.':'حرکت و تغییر اندازه لایه‌ها آزاد است.'}}
  function ensure(){
    scheduled=false;installStyle();const sandbox=document.querySelector('.adminAlbumDesignSandbox');if(!sandbox)return;
    const builder=sandbox.querySelector('.albumSlotBuilder');if(!builder)return;
    if(builder.querySelector('.pb662NativeMovementLock')){movementLocked=false;blockedPointers.clear();sandbox.classList.remove('pb662MovementLocked');builder.querySelector('.pb662MovementLock')?.remove();return}
    if(builder!==currentBuilder){currentBuilder=builder;setLocked(true)}
    const host=builder.querySelector('.albumSlotBuilderToolbar>div:last-child');if(!host)return;
    let b=host.querySelector('.pb662MovementLock');if(!b){b=document.createElement('button');b.type='button';b.className='pb662MovementLock';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setLocked(!movementLocked)});const fs=host.querySelector('.albumSlotFullscreenButton');host.insertBefore(b,fs||host.firstChild)}
    setLocked(movementLocked);
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(ensure)}
  document.addEventListener('pointerdown',e=>{if(document.querySelector('.pb662NativeMovementLock')||!movementLocked)return;const node=e.target?.closest?.(MOVABLE);if(!node||!node.closest('.adminAlbumDesignSandbox .albumSlotBuilder'))return;blockedPointers.add(e.pointerId)},true);
  document.addEventListener('pointermove',e=>{if(document.querySelector('.pb662NativeMovementLock')||!movementLocked||!blockedPointers.has(e.pointerId))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.()}, {capture:true,passive:false});
  const clear=e=>blockedPointers.delete(e.pointerId);document.addEventListener('pointerup',clear,true);document.addEventListener('pointercancel',clear,true);
  document.addEventListener('dragstart',e=>{if(movementLocked&&e.target?.closest?.(MOVABLE)){e.preventDefault();e.stopPropagation()}},true);
  document.addEventListener('click',e=>{if(e.target?.closest?.('.albumDesignTemplateCardActions .edit,.albumTemplateNewButton')){currentBuilder=null;setLocked(true);setTimeout(schedule,40)}},true);
  document.addEventListener('change',e=>{if(e.target?.matches?.('.albumTemplatePsdImport input[type=file]')){currentBuilder=null;setLocked(true);setTimeout(schedule,80)}},true);
  const obs=new MutationObserver(schedule);obs.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
