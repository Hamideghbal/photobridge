/* PhotoBridge v0.17.572 — smart public guide library + six-slot admin uploader + preserved contextual guides.
   Kept as a small runtime enhancement so it can be cache-busted independently from the main React bundle. */
(()=>{
  'use strict';
  const VERSION='0.17.705-r2005-archive-finance-guides';
  const PUBLIC_GUIDE_REACT_SAFE=true; // v572: never replace React-owned /guide DOM nodes.
  const MOBILE_QUERY='(max-width: 820px)';
  const slots=[
    {key:'membership-mobile',kind:'membership',device:'mobile',title:'آموزش عضویت (موبایل)',category:'راهنمای عضویت · موبایل',description:'آموزش عضویت و شروع کار با PhotoBridge در موبایل',sortOrder:890},
    {key:'membership-desktop',kind:'membership',device:'desktop',title:'آموزش عضویت (دسکتاپ)',category:'راهنمای عضویت · دسکتاپ',description:'آموزش عضویت و شروع کار با PhotoBridge در ویندوز و دسکتاپ',sortOrder:900},
    {key:'print-mobile',kind:'print',device:'mobile',title:'راهنمای چاپ عکس (موبایل)',category:'راهنمای چاپ عکس · موبایل',description:'آموزش ارسال و سفارش چاپ عکس در موبایل',sortOrder:910},
    {key:'print-desktop',kind:'print',device:'desktop',title:'راهنمای چاپ عکس (دسکتاپ)',category:'راهنمای چاپ عکس · دسکتاپ',description:'آموزش ارسال و سفارش چاپ عکس در ویندوز و دسکتاپ',sortOrder:920},
    {key:'album-mobile',kind:'album',device:'mobile',title:'راهنمای سفارش آلبوم (موبایل)',category:'راهنمای سفارش آلبوم · موبایل',description:'آموزش ثبت سفارش آلبوم در موبایل',sortOrder:930},
    {key:'album-desktop',kind:'album',device:'desktop',title:'راهنمای سفارش آلبوم (دسکتاپ)',category:'راهنمای سفارش آلبوم · دسکتاپ',description:'آموزش ثبت سفارش آلبوم در ویندوز و دسکتاپ',sortOrder:940},
    {key:'archive-mobile',kind:'archive',device:'mobile',title:'راهنمای آرشیو (موبایل)',category:'راهنمای آرشیو · موبایل',description:'آموزش استفاده از آرشیو سفارش‌ها در موبایل',sortOrder:950},
    {key:'archive-desktop',kind:'archive',device:'desktop',title:'راهنمای آرشیو (دسکتاپ)',category:'راهنمای آرشیو · دسکتاپ',description:'آموزش استفاده از آرشیو سفارش‌ها در ویندوز و دسکتاپ',sortOrder:960},
    {key:'finance-mobile',kind:'finance',device:'mobile',title:'راهنمای مالی (موبایل)',category:'راهنمای مالی · موبایل',description:'آموزش فاکتورها، پرداخت‌ها و حساب معین در موبایل',sortOrder:970},
    {key:'finance-desktop',kind:'finance',device:'desktop',title:'راهنمای مالی (دسکتاپ)',category:'راهنمای مالی · دسکتاپ',description:'آموزش فاکتورها، پرداخت‌ها و حساب معین در ویندوز و دسکتاپ',sortOrder:980}
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
  function closeGuideModal(){
    document.querySelectorAll('.pb567GuideBackdrop video').forEach(video=>{try{video.pause();video.removeAttribute('src');video.load()}catch{}});
    document.querySelector('.pb567GuideBackdrop')?.remove();
    document.documentElement.classList.remove('pb567GuideOpen');
  }
  // Stable dialog sizing: a decoded video must have a visible picture area.
  // Scoped only to the contextual guide overlay; other PhotoBridge video players are untouched.
  function ensureVisiblePlayerStyle(){
    let style=document.getElementById('pb1986VisibleVideoPlayer');
    if(!style){style=document.createElement('style');style.id='pb1986VisibleVideoPlayer';
      style.textContent='html body .pb567GuideBackdrop{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:12px!important;background:rgba(10,20,40,.78)!important;box-sizing:border-box!important}html body .pb567GuideBackdrop .pb567GuideDialog{position:relative!important;display:flex!important;flex-direction:column!important;width:min(940px,100%)!important;max-width:940px!important;max-height:calc(100dvh - 24px)!important;overflow:auto!important;background:#fff!important;border-radius:16px!important;box-sizing:border-box!important}html body .pb567GuideBackdrop .pb567GuideVideoFrame{position:relative!important;display:block!important;width:100%!important;min-height:180px!important;aspect-ratio:16/9!important;background:#080b12!important;overflow:hidden!important;flex:0 0 auto!important}html body .pb567GuideBackdrop .pb567GuideVideoFrame video{position:relative!important;display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;height:100%!important;min-height:180px!important;max-height:min(70dvh,700px)!important;object-fit:contain!important;background:#080b12!important;transform:none!important;filter:none!important}html body .pb567GuideBackdrop .pb1986VideoError{padding:14px!important;background:#fff4e5!important;color:#713c08!important;line-height:1.8!important}html body .pb567GuideBackdrop .pb1986VideoError a{display:inline-block;margin-inline-start:10px;color:#1b59c7;text-decoration:underline}';
    }
    // Later-injected app styles should not override the guide's visible video.
    if(!style.isConnected)document.head.append(style);
  }
  function showGuideModal(guide,slot,loading=false){
    closeGuideModal();
    ensureVisiblePlayerStyle();
    const back=document.createElement('div');back.className='pb567GuideBackdrop';back.setAttribute('role','presentation');
    const dialog=document.createElement('section');dialog.className='pb567GuideDialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.dir='rtl';
    const head=document.createElement('header');head.className='pb567GuideDialogHead';
    const copy=document.createElement('div');
    const badge=document.createElement('span');badge.textContent=isMobile()?'نسخه موبایل':'نسخه دسکتاپ';
    const title=document.createElement('h2');title.textContent=guide?.title||slot.title;
    const desc=document.createElement('p');desc.textContent=loading?'در حال دریافت ویدیوی آموزشی…':guide?.description||'ویدیوی این راهنما هنوز توسط ادمین بارگذاری نشده است.';
    copy.append(badge,title,desc);
    const close=document.createElement('button');close.type='button';close.className='pb567GuideClose';close.setAttribute('aria-label','بستن');close.textContent='×';close.onclick=closeGuideModal;
    head.append(copy,close);dialog.append(head);
    if(loading){const spinner=document.createElement('div');spinner.className='pb567GuideEmpty';spinner.setAttribute('role','status');spinner.textContent='در حال بارگذاری ویدیوی آموزشی…';dialog.append(spinner);}
    else if(guide?.src){
      const frame=document.createElement('div');frame.className='pb567GuideVideoFrame';
      const video=document.createElement('video');video.controls=true;video.playsInline=true;video.autoplay=false;video.preload='metadata';if(guide.poster)video.poster=guide.poster;
      // Do not assert MP4 for files with an unknown/incorrect MIME type. Browser should sniff the stream.
      const source=document.createElement('source');source.src=guide.src;
      if(guide.contentType&&/video\/(mp4|webm|ogg)/i.test(guide.contentType))source.type=guide.contentType;
      video.append(source);frame.append(video);dialog.append(frame);
      let warned=false;
      const showVideoError=()=>{
        if(warned||!video.isConnected)return;warned=true;video.pause();
        const msg=document.createElement('div');msg.className='pb1986VideoError';msg.setAttribute('role','alert');
        msg.append(document.createTextNode('تصویر این ویدیو در مرورگر قابل نمایش نیست. ممکن است کُدک تصویر فایل پشتیبانی نشود. فایل را با H.264 (AVC) و صدای AAC در قالب MP4 بارگذاری کنید. '));
        const link=document.createElement('a');link.href=guide.src;link.target='_blank';link.rel='noopener noreferrer';link.textContent='باز کردن فایل ویدیو';msg.append(link);
        frame.insertAdjacentElement('afterend',msg);
      };
      video.addEventListener('error',showVideoError);
      video.addEventListener('loadedmetadata',()=>{if(!video.videoWidth||!video.videoHeight)showVideoError()});
      video.addEventListener('playing',()=>{if(video.readyState>=1&&(!video.videoWidth||!video.videoHeight))showVideoError()});
      video.addEventListener('loadeddata',()=>{if(!video.videoWidth||!video.videoHeight)showVideoError()});
    }else{
      const empty=document.createElement('div');empty.className='pb567GuideEmpty';empty.innerHTML='<b>آموزش هنوز منتشر نشده است.</b><span>ادمین می‌تواند از بخش «راهنمای ویدیویی» فایل مخصوص این دستگاه را بارگذاری کند.</span>';dialog.append(empty);
    }
    back.append(dialog);back.addEventListener('mousedown',e=>{if(e.target===back)closeGuideModal()});document.body.append(back);document.documentElement.classList.add('pb567GuideOpen');
  }
  async function openContextGuide(kind,button){
    const slot=slotFor(kind);if(!slot)return;
    const old=button?.innerHTML;if(button){button.disabled=true;button.classList.add('loading')}
    // Open synchronously on the first click. API latency must not look like a dead button.
    showGuideModal(null,slot,true);
    const pendingBackdrop=document.querySelector('.pb567GuideBackdrop');
    try{
      const guides=await loadPublicGuides();
      if(document.querySelector('.pb567GuideBackdrop')!==pendingBackdrop)return;
      const guide=guides.find(g=>String(g.category||'').trim()===slot.category);
      showGuideModal(guide||null,slot);
    }catch{
      if(document.querySelector('.pb567GuideBackdrop')===pendingBackdrop)showGuideModal(null,slot);
    }finally{if(button){button.disabled=false;button.classList.remove('loading');if(old!=null)button.innerHTML=old}}
  }
  // R1984: Desktop chrome rebuilds its secondary row by cloneNode(true), which
  // deliberately does NOT copy addEventListener handlers. One capturing handler
  // survives those clones and React re-renders on both desktop and mobile.
  function onDelegatedVideoGuideClick(event){
    const button=event.target?.closest?.('button.pb569WorkflowGuideButton,button.pb1978VideoGuideButton');
    if(!button||!button.isConnected||!location.pathname.startsWith('/photographer'))return;
    const kind=button.dataset.pbGuide||(button.classList.contains('album')?'album':button.classList.contains('print')?'print':'');
    if(!['print','album','archive','finance'].includes(kind))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(button.dataset.pbGuideOpening==='1')return;
    button.dataset.pbGuideOpening='1';
    void openContextGuide(kind,button).finally(()=>{delete button.dataset.pbGuideOpening});
  }
  window.addEventListener('click',onDelegatedVideoGuideClick,true);
  // R1978: a labelled, real button is visible on mobile AND copied into the
  // desktop Print secondary header (which clones only native <button> elements).
  function guideButton(kind){
    const b=document.createElement('button');
    b.type='button';
    b.className='pb569WorkflowGuideButton pb1978VideoGuideButton '+(kind==='archive'||kind==='finance'?'pb2005UtilityGuide':kind);
    b.dataset.pbGuide=kind;
    b.title='ویدیوی آموزشی '+({print:'چاپ عکس',album:'صحافی آلبوم',archive:'آرشیو',finance:'مالی'}[kind]);
    if(kind==='archive'||kind==='finance')b.classList.add('pb2005UtilityGuide');
    b.setAttribute('aria-label',b.title);
    b.innerHTML='<span class="pb569GuideArrow" aria-hidden="true">▶</span><em class="pb569GuideLabel">راهنما</em>';
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();void openContextGuide(kind,b)});
    return b;
  }
  function pointGuideIcon(button){
    if(!button||!button.isConnected)return;
    const icon=button.querySelector('.pb569GuideArrow');
    if(icon&&icon.textContent!=='▶')icon.textContent='▶';
  }
  // R1987: the stable delegated capture handler owns video-guide clicks on rebuilt desktop rows.
  // R1983: user-approved concept 3 — prominent main modes and understated
  // compact tutorials, each paired beside its own tab in the SAME header row.
  function installR1978GuideStyle(){
    // R1989: the final approved model 2 stylesheet owns the bar.
    // Never re-inject the old model 3 style after hydration.
    if(document.querySelector('link[href*="photobridge-r1989-model2-segmented.css"],link[href*="photobridge-boot-"]')){
      document.getElementById('pb1983ModelThreeStyles')?.remove();
      return;
    }
    let style=document.getElementById('pb1983ModelThreeStyles');
    if(style)return; // R2005: never move a style node on every observed mutation.
    style=document.createElement('style');
    style.id='pb1983ModelThreeStyles';
    style.textContent=`
      .photographerPrintWorkspace .photographerPrintModeNav,
      #pb1126DesktopHeader .pb1127PrintModes {
        display:flex!important;align-items:center!important;justify-content:center!important;
        flex-wrap:nowrap!important;gap:5px!important;direction:rtl!important;
      }
      /* Main actions stand out. Never alter their native click handlers. */
      html body .photographerPrintWorkspace .photographerPrintModeNav > button.photographerPrintPhotoTab,
      html body .photographerPrintWorkspace .photographerPrintModeNav > button.photographerPrintAlbumTab,
      html body #pb1126DesktopHeader .pb1127PrintModes > button.photographerPrintPhotoTab,
      html body #pb1126DesktopHeader .pb1127PrintModes > button.photographerPrintAlbumTab {
        display:inline-flex!important;align-items:center!important;justify-content:center!important;
        flex:0 0 auto!important;height:35px!important;min-height:35px!important;
        min-width:0!important;width:auto!important;max-width:none!important;
        padding:5px 13px!important;margin:0!important;
        border:1px solid #a9bfea!important;border-radius:11px!important;
        background:#eef4ff!important;color:#214990!important;
        box-shadow:0 2px 7px rgba(39,81,164,.09)!important;
        white-space:nowrap!important;font:800 12px/1.3 Vazirmatn,Tahoma,sans-serif!important;
        cursor:pointer!important;opacity:1!important;visibility:visible!important;
        text-decoration:none!important;
      }
      html body .photographerPrintWorkspace .photographerPrintModeNav > button.photographerPrintPhotoTab:is(.active,.selected,[aria-selected="true"],[aria-pressed="true"]),
      html body .photographerPrintWorkspace .photographerPrintModeNav > button.photographerPrintAlbumTab:is(.active,.selected,[aria-selected="true"],[aria-pressed="true"]),
      html body #pb1126DesktopHeader .pb1127PrintModes > button.photographerPrintPhotoTab:is(.active,.selected,[aria-selected="true"],[aria-pressed="true"]),
      html body #pb1126DesktopHeader .pb1127PrintModes > button.photographerPrintAlbumTab:is(.active,.selected,[aria-selected="true"],[aria-pressed="true"]) {
        background:linear-gradient(135deg,#397bff,#2356d8)!important;color:#fff!important;
        border-color:#2559d9!important;box-shadow:0 3px 9px rgba(36,89,219,.19)!important;
      }
      /* Each tutorial is deliberately smaller, quiet and adjacent to its main tab. */
      html body .photographerPrintWorkspace .photographerPrintModeNav > .pb1978VideoGuideButton,
      html body #pb1126DesktopHeader .pb1127PrintModes > .pb1978VideoGuideButton {
        display:inline-flex!important;align-items:center!important;justify-content:center!important;
        flex:0 0 auto!important;width:auto!important;min-width:0!important;max-width:none!important;
        height:26px!important;min-height:26px!important;padding:3px 7px!important;
        margin:0!important;gap:4px!important;border:1px solid #d8e4f8!important;
        border-radius:8px!important;background:#fff!important;color:#6480a8!important;
        box-shadow:none!important;font:700 10px/1.25 Vazirmatn,Tahoma,sans-serif!important;
        white-space:nowrap!important;opacity:1!important;visibility:visible!important;
        position:relative!important;cursor:pointer!important;text-decoration:none!important;
      }
      html body :is(.photographerPrintWorkspace .photographerPrintModeNav,#pb1126DesktopHeader .pb1127PrintModes) > .pb1978VideoGuideButton .pb569GuideLabel {
        display:inline!important;font:inherit!important;color:inherit!important;
        margin:0!important;padding:0!important;white-space:nowrap!important;
      }
      html body :is(.photographerPrintWorkspace .photographerPrintModeNav,#pb1126DesktopHeader .pb1127PrintModes) > .pb1978VideoGuideButton .pb569GuideArrow {
        display:inline!important;font:800 12px/1 Tahoma,sans-serif!important;
        color:#4678cf!important;font-style:normal!important;
        width:auto!important;height:auto!important;line-height:1!important;
      }
      html body :is(.photographerPrintWorkspace .photographerPrintModeNav,#pb1126DesktopHeader .pb1127PrintModes) > .pb1978VideoGuideButton:hover,
      html body :is(.photographerPrintWorkspace .photographerPrintModeNav,#pb1126DesktopHeader .pb1127PrintModes) > .pb1978VideoGuideButton:focus-visible {
        background:#edf4ff!important;color:#235bd1!important;
        border-color:#a9c5f8!important;outline:2px solid #b2ccfb;outline-offset:1px;
      }
      /* A little air between the two pairs; no layout changes outside this row. */
      html body :is(.photographerPrintWorkspace .photographerPrintModeNav,#pb1126DesktopHeader .pb1127PrintModes) > .photographerPrintPhotoTab {
        margin-inline-end:9px!important;
      }
      @media(max-width:820px){
        html body .photographerPrintWorkspace .photographerPrintModeNav{gap:3px!important}
        html body .photographerPrintWorkspace .photographerPrintModeNav > button.photographerPrintPhotoTab,
        html body .photographerPrintWorkspace .photographerPrintModeNav > button.photographerPrintAlbumTab{
          height:31px!important;min-height:31px!important;
          padding:4px 7px!important;font-size:11px!important;border-radius:9px!important;
        }
        html body .photographerPrintWorkspace .photographerPrintModeNav > .pb1978VideoGuideButton{
          height:25px!important;min-height:25px!important;padding:3px 5px!important;
          font-size:9px!important;gap:2px!important;border-radius:7px!important;
        }
        html body .photographerPrintWorkspace .photographerPrintModeNav > .photographerPrintPhotoTab {
          margin-inline-end:3px!important;
        }
      }
      @media(max-width:380px){
        html body .photographerPrintWorkspace .photographerPrintModeNav > button.photographerPrintPhotoTab,
        html body .photographerPrintWorkspace .photographerPrintModeNav > button.photographerPrintAlbumTab{
          padding-inline:5px!important;font-size:10px!important;
        }
        html body .photographerPrintWorkspace .photographerPrintModeNav > .pb1978VideoGuideButton{
          padding-inline:3px!important;font-size:8px!important;
        }
      }
    `;
    document.head.append(style);
  }
  // R1981: on desktop the original React mode row lives inside an iframe/
  // hidden native header. The user only sees the stable cloned SECONDARY row.
  // Mount directly beside those visible buttons, NOT in their transient source.
  function visiblePrintModeNav(){
    if(!location.pathname.startsWith('/photographer'))return null;
    // R2005: an embedded desktop document never competes with its parent chrome,
    // even when a Windows window is resized below the mobile breakpoint.
    if(window.self!==window.top)return null;
    if(!isMobile()){
      // Do not place tutorials in the embedded/hidden desktop content document.
      if(window.self!==window.top)return null;
      const header=document.querySelector('#pb1126DesktopHeader');
      const secondary=header?.querySelector('.pb1126Secondary');
      if(!secondary||secondary.hidden)return null;
      const nav=secondary.querySelector('.pb1127PrintModes');
      return nav?.querySelector('.photographerPrintPhotoTab')?nav:null;
    }
    // Mobile has no cloned desktop row; use the real interactive mode header.
    const modes=[...document.querySelectorAll('.photographerPrintWorkspace .photographerPrintModeNav')];
    return modes.find(nav=>nav.isConnected&&nav.querySelector('.photographerPrintPhotoTab')&&nav.getClientRects().length>0)||null;
  }
  function cleanupHeaderButtons(){
    const validNav=visiblePrintModeNav();
    document.querySelectorAll('.pb569WorkflowGuideButton').forEach(el=>{
      if(!el.classList.contains('pb2005UtilityGuide')&&(!validNav||!validNav.contains(el)))el.remove();
    });
    return validNav;
  }
  function mountHeaderButtons(){
    const nav=cleanupHeaderButtons();if(!nav)return;
    const print=nav.querySelector('.photographerPrintPhotoTab'),
          album=nav.querySelector('.photographerPrintAlbumTab');
    if(!print)return; // R1976: do not depend on a preselected lab.
    if(nav.classList.contains('pb1983ModelThree'))nav.classList.remove('pb1983ModelThree');
    if(!nav.classList.contains('pb1989ModelTwo'))nav.classList.add('pb1989ModelTwo');
    installR1978GuideStyle();
    function mount(kind,target){
      const selector=':scope > .pb1978VideoGuideButton.'+kind;
      let button=nav.querySelector(selector);
      if(button?.tagName!=='BUTTON'){button?.remove();button=null;}
      if(!button)button=guideButton(kind);
      if(!button.querySelector('.pb569GuideArrow')||!button.querySelector('.pb569GuideLabel')||
         button.querySelector('.pb569GuideLabel').textContent!=='راهنما')
        button.innerHTML='<span class="pb569GuideArrow" aria-hidden="true">▶</span><em class="pb569GuideLabel">راهنما</em>';
      if(!button.classList.contains('pb1978VideoGuideButton'))button.classList.add('pb1978VideoGuideButton');
      // No React-owned button is replaced; tutorials are adjacent siblings.
      // R1989: selected new model 2 reference — all four buttons share ONE rounded shell.
      // Visual RTL order: [چاپ عکس] [ویدیوی چاپ] [صحافی آلبوم] [ویدیوی آلبوم].
      // Both tutorials go AFTER their corresponding primary action in DOM.
      if(button.parentElement!==nav||button.previousElementSibling!==target)
        target.insertAdjacentElement('afterend',button);
      return button;
    }
    const printGuide=mount('print',print);
    const albumGuide=album?mount('album',album):null;
    if(!album)nav.querySelectorAll(':scope > .pb569WorkflowGuideButton.album').forEach(el=>el.remove());
    // The parent React/Desktop header may clone the two main actions in
    // either order. Normalize once, without triggering repeated DOM mutations.
    if(album&&print.nextElementSibling!==printGuide){
      if(printGuide?.isConnected)print.insertAdjacentElement('afterend',printGuide);
    }
    if(albumGuide&&album&&album.nextElementSibling!==albumGuide)
      album.insertAdjacentElement('afterend',albumGuide);
    pointGuideIcon(printGuide);pointGuideIcon(albumGuide);
  }

  // R2005: Utility guides are adjacent siblings, never nested buttons and
  // never proxies for the actual archive/finance navigation actions.
  function visibleUtilityNav(){
    if(!location.pathname.startsWith('/photographer')||window.self!==window.top)return null;
    const candidates=isMobile()
      ? [...document.querySelectorAll('.photographerPrintModeUtilityCluster')]
      : [...document.querySelectorAll('#pb1126DesktopHeader .pb1126Secondary:not([hidden]) .pb1127PrintUtilities')];
    return candidates.find(el=>el.isConnected&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden'&&el.querySelector('button.archive,button.finance'))||null;
  }
  function mountUtilityGuides(){
    const nav=visibleUtilityNav();
    document.querySelectorAll('button.pb2005UtilityGuide').forEach(el=>{if(!nav||!nav.contains(el))el.remove()});
    if(!nav)return;
    for(const kind of ['archive','finance']){
      const target=nav.querySelector('button.'+kind+':not(.pb2005UtilityGuide)');
      const copies=[...nav.querySelectorAll('button.pb2005UtilityGuide[data-pb-guide="'+kind+'"]')];
      if(!target){copies.forEach(el=>el.remove());continue}
      const button=copies.shift()||guideButton(kind);
      copies.forEach(el=>el.remove());
      if(button.previousElementSibling!==target||button.parentElement!==nav)target.insertAdjacentElement('afterend',button);
    }
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
        const b=sourceIdentity.querySelector('b');if(b&&b.textContent!==name)b.textContent=name;
        return;
      }
      let row=card.querySelector(':scope > .pb570AlbumQuoteLab');
      if(!row){
        row=document.createElement('div');row.className='pb570AlbumQuoteLab';
        row.innerHTML='<span>لابراتوار</span><b></b>';
        card.insertAdjacentElement('afterbegin',row);
      }
      const b=row.querySelector('b');if(b&&b.textContent!==name)b.textContent=name;
    });
  }
  function syncLabSemantics(){
    const mobile=isMobile();
    document.querySelectorAll('.photographerPrintModeHeader .photographerPrintTopLab').forEach(el=>{
      if(mobile){if(el.hasAttribute('aria-hidden'))el.removeAttribute('aria-hidden')}else if(el.getAttribute('aria-hidden')!=='true')el.setAttribute('aria-hidden','true');
    });
    document.querySelectorAll('.photographerPrintWorkspace .simplePrintPilotHeader .simplePrintPilotLabSelect,.photographerPrintWorkspace .simplePrintPilotHeader .simplePrintPilotLabStatic').forEach(el=>{
      if(mobile){if(el.getAttribute('aria-hidden')!=='true')el.setAttribute('aria-hidden','true')}else if(el.hasAttribute('aria-hidden'))el.removeAttribute('aria-hidden');
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
    const text=document.createElement('div');const h=document.createElement('b');h.textContent=({membership:'عضویت',print:'چاپ عکس',album:'صحافی آلبوم',archive:'آرشیو',finance:'مالی'})[slot.kind];const small=document.createElement('small');small.textContent=slot.device==='mobile'?'ویدیوی مخصوص موبایل':'ویدیوی مخصوص ویندوز / دسکتاپ';text.append(h,small);top.append(icon,text);
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
      const head=document.createElement('div');head.className='pb567GuideManagerHead';head.innerHTML='<div><span>راهنمای هوشمند PhotoBridge</span><h3>ویدیوهای عضویت، چاپ عکس، صحافی آلبوم، آرشیو و مالی</h3><p>برای هر آموزش نسخه موبایل و دسکتاپ را جدا بارگذاری کن؛ صفحه راهنما و دکمه‌های داخل سفارش نسخه مناسب دستگاه کاربر را خودکار انتخاب می‌کنند.</p></div>';
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
    const manager=document.createElement('section');manager.className='pb567WorkflowGuideManager';manager.dataset.version=VERSION;manager.innerHTML='<div class="pb567GuideManagerLoading">در حال دریافت ویدیوهای اختصاصی…</div>';
    const head=panel.querySelector('.adminGuideHead');head.insertAdjacentElement('afterend',manager);renderAdminManager(manager);
  }
  function sync(){if(location.pathname==='/guide')return;installR1978GuideStyle();if(document.querySelector('.pb567GuideBackdrop'))ensureVisiblePlayerStyle();cleanupHeaderButtons();syncLabSemantics();mountHeaderButtons();mountUtilityGuides();mountAlbumQuoteLab();mountAdminManager()}
  function queueSync(){if(observerQueued)return;observerQueued=true;requestAnimationFrame(()=>{observerQueued=false;sync()})}
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeGuideModal()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  // React toggles hidden/classes after hydration without adding/removing nodes.
  // Observe those transitions too, so guide buttons are reattached immediately.
  new MutationObserver(queueSync).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueSync()});
  window.addEventListener('popstate',queueSync);window.addEventListener('resize',queueSync,{passive:true});
})();
