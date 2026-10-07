(()=>{
  'use strict';
  const VARIANT_KEY='pb640AdminAlbumVariant';
  let albumVariant='normal';
  try{albumVariant=sessionStorage.getItem(VARIANT_KEY)==='stretched'?'stretched':'normal'}catch{}
  let activeTypographyArticle=null;
  const nativeFetch=window.fetch.bind(window);
  function setVariant(v){albumVariant=v==='stretched'?'stretched':'normal';try{sessionStorage.setItem(VARIANT_KEY,albumVariant)}catch{};syncDesignKindUi()}
  function toast(message,tone='ok'){
    let root=document.getElementById('pb640AdminAlbumToast');if(!root){root=document.createElement('div');root.id='pb640AdminAlbumToast';document.body.appendChild(root)}
    root.className=tone==='error'?'error':'ok';root.textContent=message;root.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>{root.hidden=true},3400)
  }
  toast._t=0;
  window.fetch=async function(input,init){
    let nextInit=init;
    try{
      const url=typeof input==='string'?input:(input&&input.url)||'';
      const method=String(init?.method||(input&&input.method)||'GET').toUpperCase();
      if((method==='POST'||method==='PUT')&&/\/api\/admin\/test-album-design\/templates(?:\?|$)/.test(url)&&typeof init?.body==='string'){
        const data=JSON.parse(init.body);
        if(String(data?.designKind||'album').toLowerCase()==='album'){
          data.category=albumVariant==='stretched'?'آلبوم کشیده':'آلبوم معمولی';
          data.pbAlbumVariant=albumVariant;
          nextInit={...init,body:JSON.stringify(data)};
        }
      }
      if(method==='POST'&&/\/api\/admin\/test-album-design\/typography-assets(?:\?|$)/.test(url)&&typeof init?.body==='string'){
        let body=null;try{body=JSON.parse(init.body)}catch{}
        const autoPsd=String(body?.fa||'').includes('استخراج‌شده از PSD')||String(body?.fileName||'').startsWith('psd-typography-');
        const response=await nativeFetch(input,nextInit);
        if(autoPsd){if(response.ok)toast('Typography لایه PSD خودکار به بانک اضافه شد.');else toast('افزودن خودکار Typography لایه PSD به بانک انجام نشد.','error')}
        return response;
      }
    }catch{}
    return nativeFetch(input,nextInit);
  };
  function installStyle(){
    if(document.getElementById('pb640AdminAlbumStyle'))return;
    const s=document.createElement('style');s.id='pb640AdminAlbumStyle';s.textContent=`
      #pb640AdminAlbumToast{position:fixed;top:72px;left:50%;transform:translateX(-50%);z-index:2147483500;direction:rtl;font-family:Vazirmatn,Vazir,Tahoma,sans-serif;padding:10px 14px;border-radius:12px;background:#ecfdf3;color:#067647;border:1px solid #a6f4c5;box-shadow:0 10px 35px #0f172a22;font-size:11px;font-weight:850}#pb640AdminAlbumToast.error{background:#fff1f2;color:#b42318;border-color:#fecdd3}#pb640AdminAlbumToast[hidden]{display:none!important}
      .adminAlbumDesignSandbox .albumPsdTypographyCount{min-width:210px!important;justify-content:space-between!important;padding:7px 9px!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>span{font-size:10px!important;font-weight:800!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>input{width:96px!important;min-width:96px!important;height:38px!important;padding:4px 10px!important;font-size:15px!important;font-weight:900!important;line-height:1!important;direction:ltr!important;text-align:center!important;color:#111827!important;background:#fff!important}
      .adminAlbumDesignSandbox .albumTemplateDesignKind.pb640Enhanced>div:not(.pb640DesignKindChoices){display:none!important}.adminAlbumDesignSandbox .albumTemplateDesignKind.pb640Enhanced>span{align-self:center!important}.pb640DesignKindChoices{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;flex:1!important}.pb640DesignKindChoices button{display:grid!important;gap:2px!important;min-height:54px!important;padding:8px 10px!important;border:1px solid #d7dee8!important;border-radius:11px!important;background:#fff!important;color:#344054!important;text-align:center!important}.pb640DesignKindChoices button b{font-size:11px!important}.pb640DesignKindChoices button small{font-size:8.5px!important;color:#667085!important}.pb640DesignKindChoices button.active{border-color:#315efb!important;background:#eef2ff!important;color:#2447c5!important;box-shadow:0 0 0 2px #315efb16!important}.pb640AlbumVariantHint{margin-top:7px;padding:7px 10px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;color:#475569;font-size:9.5px;line-height:1.8}.pb640AlbumVariantHint b{color:#111827}
      .pb640OpenTypographyBank{min-height:36px!important;padding:7px 10px!important;border:1px solid #c7d2fe!important;border-radius:9px!important;background:#eef2ff!important;color:#3730a3!important;font-weight:900!important;cursor:pointer!important}.albumTemplateDetectedText.pb640TypographyTarget{outline:2px solid #6366f1!important;outline-offset:2px!important}
      #pb640TypographyPicker{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:16px;background:#0f172a77;backdrop-filter:blur(3px);direction:rtl;font-family:Vazirmatn,Vazir,Tahoma,sans-serif}#pb640TypographyPicker[hidden]{display:none!important}#pb640TypographyPicker .pb640PickerCard{width:min(980px,calc(100vw - 24px));height:min(760px,calc(100dvh - 24px));display:flex;flex-direction:column;overflow:hidden;border-radius:18px;background:#fff;box-shadow:0 30px 90px #0f172a55}#pb640TypographyPicker header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border-bottom:1px solid #e5e7eb}#pb640TypographyPicker header div{display:grid;gap:2px}#pb640TypographyPicker header b{font-size:14px}#pb640TypographyPicker header small{font-size:9.5px;color:#667085}#pb640TypographyPicker header button{width:34px;height:34px;border:0;border-radius:10px;background:#f2f4f7;font-size:20px;cursor:pointer}#pb640TypographyPicker .pb640PickerTools{padding:10px 14px;border-bottom:1px solid #eef2f6;background:#fafbfc}#pb640TypographyPicker .pb640PickerTools input{width:100%;height:40px;padding:7px 11px;border:1px solid #d7dee8;border-radius:10px;font:inherit;font-size:11px}#pb640TypographyPicker .pb640PickerGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;padding:12px;overflow:auto;align-content:start}#pb640TypographyPicker .pb640TypographyChoice{position:relative;display:grid;grid-template-rows:120px auto;gap:6px;min-width:0;padding:7px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;cursor:pointer}#pb640TypographyPicker .pb640TypographyChoice:hover{border-color:#94a3b8;background:#f8fafc}#pb640TypographyPicker .pb640TypographyChoice.active{border-color:#315efb;box-shadow:0 0 0 2px #315efb18;background:#eef2ff}#pb640TypographyPicker .pb640TypographyChoice img{width:100%;height:100%;object-fit:contain;background:linear-gradient(45deg,#f7f7f7 25%,transparent 25%,transparent 75%,#f7f7f7 75%),linear-gradient(45deg,#f7f7f7 25%,#fff 25%,#fff 75%,#f7f7f7 75%);background-position:0 0,6px 6px;background-size:12px 12px;border-radius:8px}#pb640TypographyPicker .pb640TypographyChoice span{display:block;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;font-size:10px;font-weight:800;color:#334155}
      @media(max-width:760px){.pb640DesignKindChoices{grid-template-columns:1fr!important}.adminAlbumDesignSandbox .albumPsdTypographyCount{min-width:0!important;width:100%!important}.adminAlbumDesignSandbox .albumPsdTypographyCount>input{width:110px!important;min-width:110px!important}#pb640TypographyPicker{padding:6px}#pb640TypographyPicker .pb640PickerCard{width:calc(100vw - 12px);height:calc(100dvh - 12px);border-radius:14px}#pb640TypographyPicker .pb640PickerGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px}#pb640TypographyPicker .pb640TypographyChoice{grid-template-rows:108px auto}}
    `;document.head.appendChild(s)
  }
  function originalKindButtons(root){return Array.from(root?.querySelectorAll(':scope>div:not(.pb640DesignKindChoices) button')||[])}
  function clickOriginalKind(root,kind){const buttons=originalKindButtons(root);const target=buttons.find(b=>kind==='instagram'?String(b.textContent||'').includes('اینستاگرام'):String(b.textContent||'').trim()==='آلبوم');target?.click()}
  function syncDesignKindUi(){
    const root=document.querySelector('.adminAlbumDesignSandbox .albumTemplateDesignKind.pb640Enhanced');if(!root)return;
    const original=originalKindButtons(root),instagramActive=original.some(b=>b.classList.contains('active')&&String(b.textContent||'').includes('اینستاگرام'));
    root.querySelectorAll('.pb640DesignKindChoices button').forEach(btn=>{const k=btn.dataset.kind;btn.classList.toggle('active',instagramActive?k==='instagram':k===albumVariant)});
    const hint=root.parentElement?.querySelector('.pb640AlbumVariantHint');if(hint)hint.innerHTML=instagramActive?'<b>اینستاگرام</b> · PSD عمودی اینستاگرام را آپلود کن.':'<b>'+(albumVariant==='stretched'?'آلبوم کشیده':'آلبوم معمولی')+'</b> · '+(albumVariant==='stretched'?'برای مدل‌های ۳۰×۶۰ و ۴۰×۸۰؛ اندازه واقعی خود PSD هنگام خواندن حفظ می‌شود.':'برای مدل‌های معمول ۳۰×۴۵، ۴۰×۶۰ و ۵۰×۷۰؛ اندازه واقعی خود PSD هنگام خواندن حفظ می‌شود.');
  }
  function enhanceDesignKinds(){
    const root=document.querySelector('.adminAlbumDesignSandbox .albumTemplateDesignKind');if(!root||root.classList.contains('pb640Enhanced')){syncDesignKindUi();return}
    root.classList.add('pb640Enhanced');const choices=document.createElement('div');choices.className='pb640DesignKindChoices';
    const defs=[['instagram','اینستاگرام','قالب عمودی شبکه اجتماعی'],['normal','آلبوم معمولی','۳۰×۴۵ · ۴۰×۶۰ · ۵۰×۷۰'],['stretched','آلبوم کشیده','۳۰×۶۰ · ۴۰×۸۰']];
    defs.forEach(([kind,label,sub])=>{const b=document.createElement('button');b.type='button';b.dataset.kind=kind;b.innerHTML=`<b>${label}</b><small>${sub}</small>`;b.onclick=()=>{if(kind==='instagram'){clickOriginalKind(root,'instagram')}else{setVariant(kind);clickOriginalKind(root,'album')}setTimeout(syncDesignKindUi,0)};choices.appendChild(b)});
    root.appendChild(choices);const hint=document.createElement('div');hint.className='pb640AlbumVariantHint';root.insertAdjacentElement('afterend',hint);syncDesignKindUi();
  }
  function closePicker(){const modal=document.getElementById('pb640TypographyPicker');if(modal)modal.hidden=true}
  function ensurePicker(){
    let modal=document.getElementById('pb640TypographyPicker');if(modal)return modal;
    modal=document.createElement('div');modal.id='pb640TypographyPicker';modal.hidden=true;modal.innerHTML='<section class="pb640PickerCard"><header><div><b>بانک Typography</b><small>یک طرح را انتخاب کن؛ همان لحظه جای Typography این لایه می‌نشیند.</small></div><button type="button" aria-label="بستن">×</button></header><div class="pb640PickerTools"><input type="search" placeholder="جستجو در نام Typography…"/></div><div class="pb640PickerGrid"></div></section>';
    modal.addEventListener('pointerdown',e=>{if(e.target===modal)closePicker()});modal.querySelector('header button').onclick=closePicker;modal.querySelector('input').addEventListener('input',e=>{const q=String(e.target.value||'').trim().toLowerCase();modal.querySelectorAll('.pb640TypographyChoice').forEach(x=>x.hidden=q&&!String(x.dataset.search||'').includes(q))});document.body.appendChild(modal);return modal;
  }
  function bankArticles(){return Array.from(document.querySelectorAll('.adminAlbumDesignSandbox .albumTypographyBankGrid .albumTypographyAdminAsset'))}
  function openTypographyPicker(article){
    if(!article)return;activeTypographyArticle=article;document.querySelectorAll('.albumTemplateDetectedText.pb640TypographyTarget').forEach(x=>x.classList.remove('pb640TypographyTarget'));article.classList.add('pb640TypographyTarget');
    const select=article.querySelector('.albumDetectedTypographyDefaultPicker select');if(!select)return toast('فهرست Typography این لایه پیدا نشد.','error');
    const options=Array.from(select.options||[]).filter(o=>String(o.value||''));const assets=bankArticles(),modal=ensurePicker(),grid=modal.querySelector('.pb640PickerGrid');grid.innerHTML='';
    options.forEach((opt,index)=>{const asset=assets[index],name=String(opt.textContent||opt.value),img=asset?.querySelector('.albumTypographyAssetPreview img'),src=img?.getAttribute('src')||img?.src||'';const b=document.createElement('button');b.type='button';b.className='pb640TypographyChoice'+(String(select.value)===String(opt.value)?' active':'');b.dataset.search=name.toLowerCase();b.innerHTML=`${src?`<img src="${String(src).replace(/"/g,'&quot;')}" alt="">`:'<span></span>'}<span>${name.replace(/</g,'&lt;')}</span>`;b.onclick=()=>{select.value=opt.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));toast('Typography این لایه تغییر کرد.');closePicker();setTimeout(()=>article.scrollIntoView({behavior:'smooth',block:'center'}),40)};grid.appendChild(b)});
    modal.querySelector('input').value='';modal.querySelectorAll('.pb640TypographyChoice').forEach(x=>x.hidden=false);modal.hidden=false;
  }
  function enhanceTypographyArticles(){
    document.querySelectorAll('.adminAlbumDesignSandbox .albumTemplateDetectedText').forEach(article=>{
      const picker=article.querySelector('.albumDetectedTypographyDefaultPicker');if(!picker||picker.querySelector('.pb640OpenTypographyBank'))return;
      const button=document.createElement('button');button.type='button';button.className='pb640OpenTypographyBank';button.textContent='باز کردن بانک Typography';button.onclick=e=>{e.preventDefault();e.stopPropagation();openTypographyPicker(article)};picker.insertBefore(button,picker.querySelector('.albumAdminTypographySelectedPreview')||null);
    });
  }
  function hideSlideshowAdminCards(){document.querySelectorAll('.adminAlbumDesignSandbox .albumDesignTemplateCard').forEach(card=>{if(/slideshow|اسلایدشو/i.test(String(card.textContent||'')))card.style.display='none'})}
  function enhance(){if(!/^\/admin(?:\/|$)/.test(location.pathname))return;installStyle();enhanceDesignKinds();enhanceTypographyArticles();hideSlideshowAdminCards();syncDesignKindUi()}
  document.addEventListener('click',e=>{
    const edit=e.target.closest?.('.adminAlbumDesignSandbox .albumDesignTemplateCardActions .edit');if(edit){const txt=String(edit.closest('.albumDesignTemplateCard')?.textContent||'');setVariant(/کشیده|۳۰\s*[×x]\s*۶۰|۴۰\s*[×x]\s*۸۰/.test(txt)?'stretched':'normal')}
    if(e.target.closest?.('.adminAlbumDesignSandbox .albumTemplateNewButton'))setVariant('normal');
    const hotspot=e.target.closest?.('.adminAlbumDesignSandbox .albumSlotBuilderTextHotspot');if(hotspot&&String(hotspot.querySelector('.albumSlotTextLabel')?.textContent||'').toLowerCase().includes('typography')){setTimeout(()=>{const article=document.querySelector('.adminAlbumDesignSandbox .albumTemplateDetectedText.pb613TypographyPopup');if(article){activeTypographyArticle=article;enhanceTypographyArticles();openTypographyPicker(article)}},0)}
  },true);
  const observer=new MutationObserver(()=>enhance());
  const start=()=>{enhance();observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
