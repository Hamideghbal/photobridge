/* PhotoBridge v0.17.572 — smart public guide library + six-slot admin uploader + preserved contextual guides.
   Kept as a small runtime enhancement so it can be cache-busted independently from the main React bundle. */
(()=>{
  'use strict';
  const VERSION='0.17.699';
  const PUBLIC_GUIDE_REACT_SAFE=true; // v572: never replace React-owned /guide DOM nodes.
  const MOBILE_QUERY='(max-width: 820px)';
  const slots=[
    {key:'membership-mobile',kind:'membership',device:'mobile',title:'آموزش عضویت (موبایل)',category:'راهنمای عضویت · موبایل',description:'آموزش عضویت و شروع کار با PhotoBridge در موبایل',sortOrder:890},
    {key:'membership-desktop',kind:'membership',device:'desktop',title:'آموزش عضویت (دسکتاپ)',category:'راهنمای عضویت · دسکتاپ',description:'آموزش عضویت و شروع کار با PhotoBridge در ویندوز و دسکتاپ',sortOrder:900},
    {key:'print-mobile',kind:'print',device:'mobile',title:'راهنمای چاپ عکس (موبایل)',category:'راهنمای چاپ عکس · موبایل',description:'آموزش ارسال و سفارش چاپ عکس در موبایل',sortOrder:910},
    {key:'print-desktop',kind:'print',device:'desktop',title:'راهنمای چاپ عکس (دسکتاپ)',category:'راهنمای چاپ عکس · دسکتاپ',description:'آموزش ارسال و سفارش چاپ عکس در ویندوز و دسکتاپ',sortOrder:920},
    {key:'album-mobile',kind:'album',device:'mobile',title:'راهنمای سفارش آلبوم (موبایل)',category:'راهنمای سفارش آلبوم · موبایل',description:'آموزش ثبت سفارش آلبوم در موبایل',sortOrder:930},
    {key:'album-desktop',kind:'album',device:'desktop',title:'راهنمای سفارش آلبوم (دسکتاپ)',category:'راهنمای سفارش آلبوم · دسکتاپ',description:'آموزش ثبت سفارش آلبوم در ویندوز و دسکتاپ',sortOrder:940}
  ];
  let publicCache={at:0,guides:[]};
  let adminLoading=false;
  let observerQueued=false;

  const token=()=>{try{return sessionStorage.getItem('lablink_test_session')||''}catch{return ''}};
  const portal=()=>location.pathname.startsWith('/admin')?'admin':location.pathname.startsWith('/lab')?'lab':location.pathname.startsWith('/photographer')?'photographer':'';
  const apiHeaders=(json=true)=>{
    const t=token(),p=portal();
    return {...(json?{'content-type':'application/json'}:{}),...(p?{'x-photobridge-portal':p}:{}),...(t?{authorization:`Bearer ${t}`}:{})};
  };
  async function request(path,opts={}){
    const headers={...apiHeaders(opts.body!==undefined && !(opts.body instanceof FormData)),...(opts.headers||{})};
    const r=await fetch(path,{credentials:'include',cache:'no-store',...opts,headers});
    const data=await r.json().catch(()=>({}));
    if(!r.ok){const e=new Error(data.error||'request_failed');e.status=r.status;e.data=data;throw e}
    return data;
  }
  function uploadFile(url,file,onProgress){
    return new Promise((resolve,reject)=>{
      const xhr=new XMLHttpRequest();xhr.open('PUT',url);xhr.withCredentials=url.startsWith('/');
      if(url.startsWith('/')){const t=token();if(t)xhr.setRequestHeader('authorization',`Bearer ${t}`)}
      if(file.type)xhr.setRequestHeader('content-type',file.type);
      xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress?.(Math.max(1,Math.min(100,Math.round(e.loaded/e.total*100))))};
      xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error('upload_failed'));
      xhr.onerror=()=>reject(new Error('upload_failed'));xhr.send(file);
    });
  }
  const isMobile=()=>window.matchMedia?.(MOBILE_QUERY)?.matches??innerWidth<=820;
  function slotFor(kind){return slots.find(s=>s.kind===kind&&s.device===(isMobile()?'mobile':'desktop'))}

  async function loadPublicGuides(force=false){
    if(!force&&Date.now()-publicCache.at<60000)return publicCache.guides;
    const d=await request('/api/public/video-guides?raw=1');
    publicCache={at:Date.now(),guides:Array.isArray(d.guides)?d.guides:[]};return publicCache.guides;
  }
  function closeGuideModal(){document.querySelector('.pb567GuideBackdrop')?.remove();document.documentElement.classList.remove('pb567GuideOpen')}
  function showGuideModal(guide,slot){
    closeGuideModal();
    const back=document.createElement('div');back.className='pb567GuideBackdrop';back.setAttribute('role','presentation');
    const dialog=document.createElement('section');dialog.className='pb567GuideDialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.dir='rtl';
    const head=document.createElement('header');head.className='pb567GuideDialogHead';
    const copy=document.createElement('div');
    const badge=document.createElement('span');badge.textContent=isMobile()?'نسخه موبایل':'نسخه دسکتاپ';
    const title=document.createElement('h2');title.textContent=guide?.title||slot.title;
    const desc=document.createElement('p');desc.textContent=guide?.description||'ویدیوی این راهنما هنوز توسط ادمین بارگذاری نشده است.';
    copy.append(badge,title,desc);
    const close=document.createElement('button');close.type='button';close.className='pb567GuideClose';close.setAttribute('aria-label','بستن');close.textContent='×';close.onclick=closeGuideModal;
    head.append(copy,close);dialog.append(head);
    if(guide?.src){
      const frame=document.createElement('div');frame.className='pb567GuideVideoFrame';
      const video=document.createElement('video');video.controls=true;video.playsInline=true;video.autoplay=true;video.preload='metadata';if(guide.poster)video.poster=guide.poster;
      const source=document.createElement('source');source.src=guide.src;source.type=guide.contentType||'video/mp4';video.append(source);frame.append(video);dialog.append(frame);
      setTimeout(()=>video.play().catch(()=>{}),60);
    }else{
      const empty=document.createElement('div');empty.className='pb567GuideEmpty';empty.innerHTML='<b>آموزش هنوز منتشر نشده است.</b><span>ادمین می‌تواند از بخش «راهنمای ویدیویی» فایل مخصوص این دستگاه را بارگذاری کند.</span>';dialog.append(empty);
    }
    back.append(dialog);back.addEventListener('mousedown',e=>{if(e.target===back)closeGuideModal()});document.body.append(back);document.documentElement.classList.add('pb567GuideOpen');
  }
  async function openContextGuide(kind,button){
    const slot=slotFor(kind);if(!slot)return;
    const old=button?.innerHTML;if(button){button.disabled=true;button.classList.add('loading')}
    try{const guides=await loadPublicGuides();const guide=guides.find(g=>String(g.category||'').trim()===slot.category);showGuideModal(guide||null,slot)}
    catch{showGuideModal(null,slot)}
    finally{if(button){button.disabled=false;button.classList.remove('loading');if(old!=null)button.innerHTML=old}}
  }
  function guideButton(kind){
    const b=document.createElement('span');
    b.className=`pb569WorkflowGuideButton ${kind}`;
    b.dataset.pbGuide=kind;
    b.title=kind==='print'?'راهنمای چاپ عکس':'راهنمای سفارش آلبوم';
    b.setAttribute('aria-label',b.title);
    b.setAttribute('role','button');
    b.tabIndex=0;
    b.innerHTML='<em class="pb569GuideLabel" aria-hidden="true">؟</em>';
    const open=e=>{e.preventDefault();e.stopPropagation();openContextGuide(kind,b)};
    b.addEventListener('click',open);
    b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){open(e)}});
    return b;
  }
  function pointGuideArrow(button,target){
    if(!button||!target||!button.isConnected||!target.isConnected)return;
    const arrow=button.querySelector('.pb569GuideArrow');if(!arrow)return;
    const br=button.getBoundingClientRect(),tr=target.getBoundingClientRect();
    const bx=br.left+br.width/2,tx=tr.left+tr.width/2;
    arrow.textContent=tx>=bx?'→':'←';
    button.dataset.pbGuideArrow=tx>=bx?'right':'left';
  }
  function cleanupHeaderButtons(){
    const validNav=document.querySelector('.photographerPrintWorkspace .photographerPrintModeNav');
    document.querySelectorAll('.pb569WorkflowGuideButton').forEach(el=>{if(!validNav||!validNav.contains(el))el.remove()});
    if(!validNav)document.querySelectorAll('.photographerHeaderNav.pb699DesktopGuideNav,.photographerHeaderNav.pb569WorkflowGuideNavReady,.photographerHeaderNav.pb692InlineGuideReady').forEach(el=>el.classList.remove('pb699DesktopGuideNav','pb569WorkflowGuideNavReady','pb692InlineGuideReady'));
    return validNav;
  }
  function mountHeaderButtons(){
    const nav=cleanupHeaderButtons();if(!nav)return;
    const print=nav.querySelector('.photographerPrintPhotoTab'),album=nav.querySelector('.photographerPrintAlbumTab'),lab=nav.querySelector('.photographerPrintTopLab');
    if(!print||!lab)return;
    print.querySelectorAll('.pb569WorkflowGuideButton:not(.print)').forEach(x=>x.remove());
    if(album)album.querySelectorAll('.pb569WorkflowGuideButton:not(.album)').forEach(x=>x.remove());

    if(isMobile()){
      /* Mobile: guide stays as the compact square INSIDE the main button. */
      nav.querySelectorAll(':scope > .pb567WorkflowGuideButton').forEach(x=>x.remove());
      let p=print.querySelector(':scope > .pb569WorkflowGuideButton.print')||nav.querySelector(':scope > .pb569WorkflowGuideButton.print');
      if(!p)p=guideButton('print');
      p.classList.remove('pb699DesktopGuide');
      if(!p.querySelector(':scope > .pb569GuideLabel')||p.querySelector(':scope > .pb569GuideLabel')?.textContent!=='؟'||p.children.length!==1)p.innerHTML='<em class="pb569GuideLabel" aria-hidden="true">؟</em>';
      if(p.parentElement!==print||print.lastElementChild!==p)print.append(p);
      if(album){
        let a=album.querySelector(':scope > .pb569WorkflowGuideButton.album')||nav.querySelector(':scope > .pb569WorkflowGuideButton.album');
        if(!a)a=guideButton('album');
        a.classList.remove('pb699DesktopGuide');
        if(!a.querySelector(':scope > .pb569GuideLabel')||a.querySelector(':scope > .pb569GuideLabel')?.textContent!=='؟'||a.children.length!==1)a.innerHTML='<em class="pb569GuideLabel" aria-hidden="true">؟</em>';
        if(a.parentElement!==album||album.lastElementChild!==a)album.append(a);
      }else nav.querySelector(':scope > .pb569WorkflowGuideButton.album')?.remove();
      nav.classList.remove('pb567WorkflowGuideNavReady','pb699DesktopGuideNav');
      nav.classList.add('pb569WorkflowGuideNavReady','pb692InlineGuideReady');
      return;
    }

    /* Desktop/Windows: guides are independent labelled buttons BESIDE their destinations. */
    let p=nav.querySelector(':scope > .pb569WorkflowGuideButton.print')||print.querySelector(':scope > .pb569WorkflowGuideButton.print');
    if(!p)p=guideButton('print');
    p.classList.add('pb699DesktopGuide');
    if(!p.querySelector('.pb699GuideArrow')||p.querySelector('.pb569GuideLabel')?.textContent!=='راهنما')p.innerHTML='<i class="pb569GuideArrow pb699GuideArrow" aria-hidden="true">←</i><em class="pb569GuideLabel">راهنما</em>';
    if(p.parentElement!==nav||p.nextElementSibling!==print)nav.insertBefore(p,print);

    let a=null;
    if(album){
      a=nav.querySelector(':scope > .pb569WorkflowGuideButton.album')||album.querySelector(':scope > .pb569WorkflowGuideButton.album');
      if(!a)a=guideButton('album');
      a.classList.add('pb699DesktopGuide');
      if(!a.querySelector('.pb699GuideArrow')||a.querySelector('.pb569GuideLabel')?.textContent!=='راهنما')a.innerHTML='<i class="pb569GuideArrow pb699GuideArrow" aria-hidden="true">→</i><em class="pb569GuideLabel">راهنما</em>';
      if(a.parentElement!==nav||nav.lastElementChild!==a)nav.append(a);
    }else nav.querySelector(':scope > .pb569WorkflowGuideButton.album')?.remove();

    nav.classList.remove('pb567WorkflowGuideNavReady','pb692InlineGuideReady');
    nav.classList.add('pb569WorkflowGuideNavReady','pb699DesktopGuideNav');
    requestAnimationFrame(()=>{pointGuideArrow(p,print);if(a&&album)pointGuideArrow(a,album)});
  }

  function currentLabName(){
    const selectors=[
      '.photographerPrintTopLabStatic',
      '.photographerPrintTopLabSelect .pbSelectTrigger',
      '.photographerPrintTopLabSelect .pbSelectButton',
      '.simplePrintPilotLabStatic',
      '.simplePrintPilotLabSelect .pbSelectTrigger',
      '.simplePrintPilotLabSelect .pbSelectButton',
      '.albumMultiOrderToolbar .albumOrderLabStatic',
      '.albumMultiOrderToolbar .albumOrderLabSelect .pbSelectTrigger',
      '.albumMultiOrderToolbar .albumOrderLabSelect .pbSelectButton',
      '.albumOrderEmbeddedHeader .albumOrderLabStatic',
      '.albumOrderEmbeddedHeader .albumOrderLabSelect .pbSelectTrigger',
      '.albumOrderEmbeddedHeader .albumOrderLabSelect .pbSelectButton'
    ];
    for(const selector of selectors){
      const el=document.querySelector(selector);
      const text=String(el?.textContent||'').replace(/\s+/g,' ').trim();
      if(text&&text!=='لابراتوار')return text;
    }
    return 'لابراتوار';
  }
  function mountAlbumQuoteLab(){
    const createRoot=document.querySelector('.photographerAlbumCreateWorkspaceMode');
    document.querySelectorAll('.pb570AlbumQuoteLab').forEach(el=>{if(!createRoot||!createRoot.contains(el))el.remove()});
    if(!createRoot||isMobile())return;
    const name=currentLabName();
    createRoot.querySelectorAll('.albumQuoteCard').forEach(card=>{
      const sourceIdentity=card.querySelector(':scope > .albumQuoteLabIdentity');
      if(sourceIdentity){
        const b=sourceIdentity.querySelector('b');if(b)b.textContent=name;
        return;
      }
      let row=card.querySelector(':scope > .pb570AlbumQuoteLab');
      if(!row){
        row=document.createElement('div');row.className='pb570AlbumQuoteLab';
        row.innerHTML='<span>لابراتوار</span><b></b>';
        card.insertAdjacentElement('afterbegin',row);
      }
      const b=row.querySelector('b');if(b)b.textContent=name;
    });
  }
  function syncLabSemantics(){
    const mobile=isMobile();
    document.querySelectorAll('.photographerPrintModeHeader .photographerPrintTopLab').forEach(el=>{
      if(mobile)el.removeAttribute('aria-hidden');else el.setAttribute('aria-hidden','true');
    });
    document.querySelectorAll('.photographerPrintWorkspace .simplePrintPilotHeader .simplePrintPilotLabSelect,.photographerPrintWorkspace .simplePrintPilotHeader .simplePrintPilotLabStatic').forEach(el=>{
      if(mobile)el.setAttribute('aria-hidden','true');else el.removeAttribute('aria-hidden');
    });
  }

  const smartGuideKinds=[
    {kind:'membership',title:'آموزش عضویت',category:'شروع کار',description:'عضویت و شروع استفاده از PhotoBridge را قدم‌به‌قدم ببین.'},
    {kind:'print',title:'راهنمای چاپ عکس',category:'چاپ عکس',description:'انتخاب فایل، تنظیم مشخصات چاپ و ارسال سفارش را ببین.'},
    {kind:'album',title:'راهنمای سفارش آلبوم',category:'سفارش آلبوم',description:'ثبت سفارش آلبوم و ارسال فایل‌های طراحی را مرحله‌به‌مرحله ببین.'}
  ];
  function smartGuideDisplay(meta,guide,slot){
    const displaySlot={...slot,title:meta.title,category:meta.category,description:meta.description};
    const displayGuide=guide?{...guide,title:meta.title,category:meta.category,description:meta.description}:null;
    showGuideModal(displayGuide,displaySlot);
  }
  function smartGuideCard(meta,guide,slot){
    const card=document.createElement('article');card.className='publicGuideCard pb571SmartGuideCard';card.tabIndex=0;card.setAttribute('role','button');card.dataset.kind=meta.kind;
    const thumb=document.createElement('div');thumb.className='publicGuideThumb';
    if(guide?.poster){const img=document.createElement('img');img.src=guide.poster;img.alt='';thumb.append(img)}
    else{const fb=document.createElement('div');fb.className='publicGuidePosterFallback';fb.innerHTML='<strong style="font-size:34px;line-height:1">PB</strong><span>PhotoBridge</span>';thumb.append(fb)}
    const play=document.createElement('span');play.className='publicGuidePlay';play.setAttribute('aria-hidden','true');play.textContent='▶';thumb.append(play);
    if(guide?.duration){const duration=document.createElement('small');duration.dir='ltr';duration.textContent=guide.duration;thumb.append(duration)}
    const body=document.createElement('div');body.className='publicGuideCardBody';
    const cat=document.createElement('span');cat.textContent=meta.category;
    const h=document.createElement('h3');h.textContent=meta.title;
    const p=document.createElement('p');p.textContent=meta.description;
    const b=document.createElement('button');b.type='button';b.className='publicGuideWatch';b.textContent=guide?.src?'پخش آموزش':'آموزش هنوز بارگذاری نشده';
    const open=()=>smartGuideDisplay(meta,guide,slot);
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open()});card.addEventListener('click',open);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
    body.append(cat,h,p,b);card.append(thumb,body);return card;
  }
  async function mountSmartGuidePage(){
    if(location.pathname!=='/guide')return;
    const grid=document.querySelector('.publicGuidePage .publicGuideGrid');if(!grid)return;
    if(grid.dataset.pb571Loading==='1')return;
    grid.dataset.pb571Loading='1';
    try{
      const guides=await loadPublicGuides();
      const device=isMobile()?'mobile':'desktop';
      const chosen=smartGuideKinds.map(meta=>{const slot=slots.find(s=>s.kind===meta.kind&&s.device===device);const guide=(guides||[]).find(g=>String(g.category||'').trim()===slot?.category);return {meta,slot,guide}});
      const signature=device+'|'+chosen.map(x=>x.guide?.id||'empty').join('|');
      const currentSmart=grid.querySelectorAll(':scope > .pb571SmartGuideCard').length===smartGuideKinds.length;
      if(grid.dataset.pb571Signature===signature&&currentSmart)return;
      grid.dataset.pb571Signature=signature;grid.replaceChildren(...chosen.map(x=>smartGuideCard(x.meta,x.guide,x.slot)));
      const count=document.querySelector('.publicGuidePage .publicGuideSectionHead > span');if(count)count.textContent='۳ آموزش';
    }catch{}finally{grid.dataset.pb571Loading='0'}
  }

  function statusText(guide){
    if(!guide)return 'هنوز ویدیویی ثبت نشده';
    if(guide.videoKey||guide.videoUrl||guide.legacySrc)return guide.optimizationStatus==='processing'?'ویدیو بارگذاری شد · در حال بهینه‌سازی':'ویدیو آماده پخش است';
    return 'اسلات ساخته شده؛ فایل ویدیو را انتخاب کن';
  }
  async function ensureSlotGuide(slot,guides){
    let guide=(guides||[]).find(g=>String(g.category||'').trim()===slot.category);
    if(guide){
      if(guide.title!==slot.title||guide.active===false){
        const d=await request(`/api/admin/video-guides/${encodeURIComponent(guide.id)}`,{method:'PATCH',body:JSON.stringify({title:slot.title,description:slot.description,category:slot.category,active:true,sortOrder:slot.sortOrder})});guide={...guide,...(d.guide||{})};
      }
      return guide;
    }
    const d=await request('/api/admin/video-guides',{method:'POST',body:JSON.stringify({title:slot.title,description:slot.description,category:slot.category,active:true,featured:false,sortOrder:slot.sortOrder})});
    return d.guide;
  }
  function adminCard(slot,guide,storageAvailable,refresh){
    const card=document.createElement('article');card.className='pb567GuideSlotCard';card.dataset.slot=slot.key;
    const top=document.createElement('div');top.className='pb567GuideSlotTop';
    const icon=document.createElement('span');icon.className='pb567GuideDeviceIcon';icon.textContent=slot.device==='mobile'?'▯':'▭';
    const text=document.createElement('div');const h=document.createElement('b');h.textContent=slot.kind==='membership'?'عضویت':slot.kind==='print'?'چاپ عکس':'سفارش آلبوم';const small=document.createElement('small');small.textContent=slot.device==='mobile'?'ویدیوی مخصوص موبایل':'ویدیوی مخصوص ویندوز / دسکتاپ';text.append(h,small);top.append(icon,text);
    const status=document.createElement('div');status.className='pb567GuideSlotStatus '+((guide?.videoKey||guide?.videoUrl||guide?.legacySrc)?'ready':'empty');status.textContent=statusText(guide);
    const actions=document.createElement('div');actions.className='pb567GuideSlotActions';
    const label=document.createElement('label');label.className='pb567GuideUploadButton '+(!storageAvailable?'disabled':'');label.innerHTML=`<span>${guide?.videoKey||guide?.videoUrl||guide?.legacySrc?'جایگزینی ویدیو':'بارگذاری ویدیو'}</span><input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" ${storageAvailable?'':'disabled'}>`;
    const input=label.querySelector('input');
    const progress=document.createElement('div');progress.className='pb567GuideSlotProgress';progress.innerHTML='<i></i><span></span>';
    input?.addEventListener('change',async()=>{
      const file=input.files?.[0];if(!file)return;
      if(file.size>2*1024*1024*1024){alert('حجم ویدیو بیشتر از ۲ گیگابایت است.');input.value='';return}
      label.classList.add('busy');status.textContent='در حال آماده‌سازی آپلود…';progress.classList.add('active');
      try{
        const d=await request('/api/admin/video-guides');const g=await ensureSlotGuide(slot,d.guides||[]);
        const start=await request(`/api/admin/video-guides/${encodeURIComponent(g.id)}/upload`,{method:'POST',body:JSON.stringify({kind:'video',name:file.name,contentType:file.type||'video/mp4',bytes:file.size})});
        await uploadFile(start.uploadUrl,file,n=>{progress.querySelector('i').style.width=`${n}%`;progress.querySelector('span').textContent=`${n}٪`;status.textContent=`در حال آپلود · ${n}٪`});
        await request(`/api/admin/video-guides/${encodeURIComponent(g.id)}/upload/complete`,{method:'POST',body:JSON.stringify({uploadId:start.uploadId})});
        publicCache={at:0,guides:[]};status.textContent='ویدیو بارگذاری شد';await refresh();
      }catch(e){
        const code=e?.data?.error;status.textContent='آپلود انجام نشد';alert(code==='upload_not_configured'?'فضای Object Storage برای ویدیو فعال نیست.':code==='video_type_not_allowed'?'فرمت ویدیو باید MP4، WebM یا MOV باشد.':code==='file_too_large'?'حجم فایل بیشتر از حد مجاز است.':'آپلود ویدیوی راهنما انجام نشد. دوباره تلاش کن.');
      }finally{label.classList.remove('busy');progress.classList.remove('active');input.value=''}
    });
    actions.append(label);card.append(top,status,actions,progress);return card;
  }
  async function renderAdminManager(manager){
    if(adminLoading)return;adminLoading=true;manager.classList.add('loading');
    try{
      const data=await request('/api/admin/video-guides');manager.innerHTML='';
      const head=document.createElement('div');head.className='pb567GuideManagerHead';head.innerHTML='<div><span>راهنمای هوشمند PhotoBridge</span><h3>ویدیوهای عضویت، چاپ عکس و سفارش آلبوم</h3><p>برای هر آموزش نسخه موبایل و دسکتاپ را جدا بارگذاری کن؛ صفحه راهنما و دکمه‌های داخل سفارش نسخه مناسب دستگاه کاربر را خودکار انتخاب می‌کنند.</p></div>';
      const grid=document.createElement('div');grid.className='pb567GuideSlotGrid';
      const refresh=async()=>{await renderAdminManager(manager)};
      for(const s of slots){const g=(data.guides||[]).find(x=>String(x.category||'').trim()===s.category);grid.append(adminCard(s,g,Boolean(data.storageAvailable),refresh))}
      manager.append(head);
      if(!data.storageAvailable){const warn=document.createElement('div');warn.className='pb567GuideStorageWarn';warn.textContent='برای بارگذاری ویدیو، Object Storage باید فعال باشد.';manager.append(warn)}
      manager.append(grid);
    }catch(e){manager.innerHTML='<div class="pb567GuideManagerError">دریافت ویدیوهای اختصاصی انجام نشد. صفحه را تازه‌سازی کن.</div>'}
    finally{manager.classList.remove('loading');adminLoading=false}
  }
  function mountAdminManager(){
    const panel=document.querySelector('.adminGuidePanel');if(!panel||panel.querySelector('.pb567WorkflowGuideManager'))return;
    // Wait until the real admin guide UI (not only the loading placeholder) is mounted.
    if(!panel.querySelector('.adminGuideHead'))return;
    const manager=document.createElement('section');manager.className='pb567WorkflowGuideManager';manager.dataset.version=VERSION;manager.innerHTML='<div class="pb567GuideManagerLoading">در حال دریافت شش ویدیوی اختصاصی…</div>';
    const head=panel.querySelector('.adminGuideHead');head.insertAdjacentElement('afterend',manager);renderAdminManager(manager);
  }
  function sync(){if(location.pathname==='/guide')return;cleanupHeaderButtons();syncLabSemantics();mountHeaderButtons();mountAlbumQuoteLab();mountAdminManager()}
  function queueSync(){if(observerQueued)return;observerQueued=true;requestAnimationFrame(()=>{observerQueued=false;sync()})}
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeGuideModal()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  new MutationObserver(queueSync).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('popstate',queueSync);window.addEventListener('resize',queueSync,{passive:true});
})();
