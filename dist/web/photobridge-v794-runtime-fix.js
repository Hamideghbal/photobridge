/* PhotoBridge v794 — gallery mobile clearance/delete repair, customer gallery polish, print header collision fix, unified status tabs and device-aware gallery guide. */
(()=>{
  'use strict';
  if(window.__PB794_RUNTIME_FIX__)return;
  window.__PB794_RUNTIME_FIX__=true;

  const qs=(s,r=document)=>r&&r.querySelector?r.querySelector(s):null;
  const qsa=(s,r=document)=>r&&r.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const clean=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const isGalleryList=()=>location.pathname==='/photographer/gallery';
  const isPublicGallery=()=>location.pathname.startsWith('/g/');
  const isPrintWorkspace=()=>/^\/photographer\/(?:orders|upload|album|archive|finance)/.test(location.pathname)&&new URLSearchParams(location.search).get('workspace')==='print';
  let raf=0,deleteBusy=false,guideSeq=0;

  function authHeaders(){
    const h={'content-type':'application/json','x-photobridge-portal':'photographer'};
    try{
      const token=sessionStorage.getItem('lablink_test_session')||'';
      const raw=sessionStorage.getItem('photobridge_admin_impersonation')||'';
      let info=null;try{info=raw?JSON.parse(raw):null}catch{}
      if(token)h.authorization=`Bearer ${token}`;
      if(token&&info)h['x-photobridge-impersonation']='1';
      if(token&&info?.role==='lab'&&info?.labId)h['x-photobridge-impersonation-lab-id']=String(info.labId);
    }catch{}
    return h;
  }
  async function jsonRequest(url,options={}){
    const r=await fetch(url,{credentials:'include',cache:'no-store',...options,headers:{...authHeaders(),...(options.headers||{})}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){const e=new Error(String(d?.error||`http_${r.status}`));e.status=r.status;e.data=d;throw e}
    return d;
  }

  function removeLayer(id){qs(`#${id}`)?.remove()}
  function modalShell({id,title,subtitle='',danger=false}){
    removeLayer(id);
    const layer=document.createElement('div');layer.id=id;layer.className='pb794ModalLayer';
    const card=document.createElement('section');card.className='pb794ModalCard'+(danger?' danger':'');card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.dir='rtl';
    const head=document.createElement('header');head.className='pb794ModalHead';
    const copy=document.createElement('div');const b=document.createElement('b');b.textContent=title;copy.appendChild(b);
    if(subtitle){const s=document.createElement('small');s.textContent=subtitle;copy.appendChild(s)}
    const x=document.createElement('button');x.type='button';x.className='pb794ModalClose';x.textContent='×';x.setAttribute('aria-label','بستن');
    const body=document.createElement('div');body.className='pb794ModalBody';
    const actions=document.createElement('footer');actions.className='pb794ModalActions';
    head.append(copy,x);card.append(head,body,actions);layer.appendChild(card);document.body.appendChild(layer);
    const close=()=>{if(!deleteBusy)layer.remove()};x.addEventListener('click',close);layer.addEventListener('click',e=>{if(e.target===layer)close()});
    requestAnimationFrame(()=>layer.classList.add('open'));
    return {layer,card,body,actions,close,title:b,closeButton:x};
  }

  function galleryFromCard(data,card){
    const rows=Array.isArray(data?.galleries)?data.galleries:[];
    const id=String(card?.dataset?.pb791GalleryId||'');if(id){const hit=rows.find(g=>String(g?.id)===id);if(hit)return hit}
    const title=clean(qs('.clientGalleryCardBody h3',card)),customer=clean(qs('.clientGalleryCardBody>p',card));
    return rows.find(g=>String(g?.title||'')===title&&(!g?.customer_name||customer.includes(String(g.customer_name))))||rows[qsa('.clientGalleryCard').indexOf(card)]||null;
  }

  async function openDeleteGallery(button){
    if(deleteBusy||button?.disabled)return;
    const card=button.closest('.clientGalleryCard');if(!card)return;
    let data,g;
    try{data=await jsonRequest('/api/customer/client-galleries');g=galleryFromCard(data,card)}catch{showDeleteError('اطلاعات گالری دریافت نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.');return}
    if(!g?.id){showDeleteError('این گالری پیدا نشد. صفحه را تازه‌سازی کن و دوباره تلاش کن.');return}
    const title=String(g.title||'این گالری');
    const ui=modalShell({id:'pb794-delete-gallery-layer',title:'حذف گالری',subtitle:title,danger:true});
    const warning=document.createElement('div');warning.className='pb794DeleteWarning';warning.innerHTML='<span aria-hidden="true">!</span><div><b>این حذف قابل بازگشت نیست</b><p></p></div>';
    qs('p',warning).textContent='همه عکس‌ها، انتخاب‌های مشتری، اطلاعات سفارش و داده‌های همین گالری حذف می‌شوند.';
    const detail=document.createElement('div');detail.className='pb794DeleteSummary';
    const photos=Number(g.photo_count||0),order=String(g.current_order_status||'').trim();
    detail.innerHTML=`<span><small>گالری</small><b></b></span><span><small>تعداد عکس</small><b>${fa(photos)}</b></span><span><small>وضعیت سفارش</small><b></b></span>`;
    const bs=qsa('b',detail);if(bs[0])bs[0].textContent=title;if(bs[2])bs[2].textContent=order||'بدون سفارش فعال';
    const msg=document.createElement('p');msg.className='pb794DeleteMessage';msg.textContent='اگر مطمئنی، حذف گالری را تأیید کن.';
    ui.body.append(warning,detail,msg);
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='انصراف';cancel.addEventListener('click',ui.close);
    const confirm=document.createElement('button');confirm.type='button';confirm.className='danger';confirm.textContent='بله، گالری حذف شود';
    ui.actions.append(cancel,confirm);
    confirm.addEventListener('click',async()=>{
      if(deleteBusy)return;deleteBusy=true;confirm.disabled=true;cancel.disabled=true;ui.closeButton.disabled=true;confirm.textContent='در حال حذف…';msg.className='pb794DeleteMessage busy';msg.textContent='در حال حذف گالری و اطلاعات مرتبط…';
      try{
        await jsonRequest(`/api/customer/client-galleries/${encodeURIComponent(String(g.id))}`,{method:'DELETE'});
        msg.className='pb794DeleteMessage success';msg.textContent='گالری با موفقیت حذف شد.';
        card?.classList.add('pb794GalleryRemoving');
        setTimeout(()=>{card?.remove();const count=qs('.clientGalleryListHead p');if(count)count.textContent=`${fa(qsa('.clientGalleryCard').length)} گالری ساخته شده`;},180);
        confirm.textContent='حذف شد';
        setTimeout(()=>location.reload(),650);
      }catch(e){
        const code=String(e?.data?.error||'');
        msg.className='pb794DeleteMessage error';
        msg.textContent=code==='gallery_not_found'?'این گالری قبلاً حذف شده یا دیگر در دسترس نیست.':'حذف گالری انجام نشد. اتصال را بررسی و دوباره تلاش کن.';
        confirm.disabled=false;cancel.disabled=false;ui.closeButton.disabled=false;confirm.textContent='تلاش دوباره';deleteBusy=false;
      }
    });
  }
  function showDeleteError(message){
    const ui=modalShell({id:'pb794-delete-gallery-layer',title:'حذف گالری',danger:true});const p=document.createElement('p');p.className='pb794DeleteMessage error';p.textContent=message;ui.body.appendChild(p);const b=document.createElement('button');b.type='button';b.className='primary';b.textContent='بستن';b.addEventListener('click',ui.close);ui.actions.style.gridTemplateColumns='1fr';ui.actions.appendChild(b);
  }

  function markMediaReady(card,media){
    if(!card||card.classList.contains('pb794MediaReady'))return;
    card.classList.remove('pb794MediaPending');card.classList.add('pb794MediaReady');
  }
  function enhancePublicGalleryMedia(){
    if(!isPublicGallery())return;
    const page=qs('.publicClientGalleryPage.unlocked');if(!page)return;
    page.classList.add('pb794CustomerGallery');
    qsa('.clientGalleryPublicMedia',page).forEach(card=>{
      if(card.dataset.pb794LoadBound==='1')return;
      const media=qs('.clientGalleryPublicMediaView img,.clientGalleryPublicMediaView video',card);if(!media)return;
      card.dataset.pb794LoadBound='1';
      const ready=media.tagName==='IMG'?Boolean(media.complete&&media.naturalWidth>0):Number(media.readyState||0)>=2;
      if(ready){markMediaReady(card,media);return}
      card.classList.add('pb794MediaPending');
      const done=()=>markMediaReady(card,media);
      media.addEventListener(media.tagName==='IMG'?'load':'loadeddata',done,{once:true});
      media.addEventListener('error',done,{once:true});
    });
  }

  function isMobileDevice(){
    try{if(navigator.userAgentData&&typeof navigator.userAgentData.mobile==='boolean')return navigator.userAgentData.mobile}catch{}
    const ua=String(navigator.userAgent||'');
    return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(ua)||matchMedia('(max-width: 820px)').matches||matchMedia('(pointer: coarse)').matches;
  }
  async function rawGuides(){
    const r=await fetch(`/api/public/video-guides?raw=1&_=${Date.now()}`,{credentials:'include',cache:'no-store'});const d=await r.json().catch(()=>({}));return r.ok&&Array.isArray(d?.guides)?d.guides:[];
  }
  function guideScore(g,target){
    const hay=[g?.title,g?.category,g?.description,g?.id].filter(Boolean).join(' ').toLowerCase();
    const gallery=['gallery','گالری'];
    const targetWords=target==='mobile'?['mobile','موبایل','android','اندروید','iphone','ios']:['windows','window','ویندوز','desktop','دسکتاپ'];
    let s=0;if(gallery.some(w=>hay.includes(w)))s+=20;if(targetWords.some(w=>hay.includes(w)))s+=18;
    if(hay.includes(`gallery-${target}`)||hay.includes(`gallery_${target}`))s+=12;
    if(String(g?.category||'').trim()===`راهنمای گالری · ${target==='mobile'?'موبایل':'ویندوز'}`)s+=20;
    if(g?.src)s+=3;return s;
  }
  function findGuide(list,target){return [...list].filter(g=>g&&g.src).sort((a,b)=>guideScore(b,target)-guideScore(a,target)).find(g=>guideScore(g,target)>=38)||null}
  function ensureGuideButton(){
    if(!isGalleryList())return;
    const head=qs('.clientGalleryIntroHeader');if(!head)return;
    // Keep the legacy id as a sentinel so v793 does not inject its old two-choice button again.
    // Our document-capture click handler below owns the click and opens the device-matched video directly.
    let b=qs('#pb793-gallery-video-guide',head)||qs('#pb794-gallery-video-guide',head);
    if(!b){b=document.createElement('button');b.type='button';head.appendChild(b)}
    qsa('#pb794-gallery-video-guide',head).filter(x=>x!==b).forEach(x=>x.remove());
    b.id='pb793-gallery-video-guide';b.className='pb793GalleryGuideButton pb794GalleryGuideButton';b.innerHTML='<span aria-hidden="true">▶</span><b>راهنمای ویدیویی</b>';b.setAttribute('title','راهنمای مناسب دستگاه شما به‌صورت خودکار پخش می‌شود');
  }
  function guideModal(title,subtitle=''){
    const ui=modalShell({id:'pb794-gallery-guide-layer',title,subtitle});ui.card.classList.add('pb794GuideCard');return ui;
  }
  async function openDeviceGuide(){
    const target=isMobileDevice()?'mobile':'windows',seq=++guideSeq;
    const ui=guideModal('راهنمای ویدیویی گالری',target==='mobile'?'نسخه موبایل':'نسخه ویندوز');
    const loading=document.createElement('div');loading.className='pb794GuideLoading';loading.innerHTML='<span></span><b>در حال آماده‌سازی ویدیو…</b>';ui.body.appendChild(loading);ui.actions.style.display='none';
    let list=[];try{list=await rawGuides()}catch{}
    if(seq!==guideSeq||!document.body.contains(ui.layer))return;
    const guide=findGuide(list,target);ui.body.replaceChildren();
    if(!guide){
      const p=document.createElement('div');p.className='pb794GuideMissing';p.innerHTML='<span aria-hidden="true">▶</span><div><b></b><p></p></div>';qs('b',p).textContent=`ویدیوی راهنمای گالری ${target==='mobile'?'موبایل':'ویندوز'} هنوز بارگذاری نشده است.`;qs('p',p).textContent='بعد از آپلود و فعال‌سازی از پنل ادمین، همین دکمه مستقیماً ویدیوی مناسب دستگاه را پخش می‌کند.';ui.body.appendChild(p);ui.actions.style.display='grid';ui.actions.style.gridTemplateColumns='1fr';const close=document.createElement('button');close.type='button';close.className='primary';close.textContent='بستن';close.addEventListener('click',ui.close);ui.actions.appendChild(close);return;
    }
    ui.title.textContent='راهنمای ویدیویی گالری';
    const wrap=document.createElement('div');wrap.className='pb794GuideVideoWrap';const video=document.createElement('video');video.controls=true;video.playsInline=true;video.preload='auto';video.src=String(guide.src||'');if(guide.poster)video.poster=String(guide.poster);const meta=document.createElement('div');meta.className='pb794GuideVideoMeta';const b=document.createElement('b');b.textContent=String(guide.title||`راهنمای گالری ${target==='mobile'?'موبایل':'ویندوز'}`);const s=document.createElement('small');s.textContent=String(guide.description||'PhotoBridge');meta.append(b,s);wrap.append(video,meta);ui.body.appendChild(wrap);setTimeout(()=>video.play().catch(()=>{}),60);
  }

  function stabilizePrintHeader(){
    const inPrint=isPrintWorkspace();
    qsa('.photographerInstagramMobileNav').forEach(el=>el.classList.toggle('pb794HideInstagramInPrint',inPrint));
    if(!inPrint)return;
    qsa('.photographerPrintModeNav .photographerInstagramDesignEntry,.photographerPrintModeHeader .pb793InjectedInstagram').forEach(el=>el.remove());
  }

  function sync(){
    ensureGuideButton();enhancePublicGalleryMedia();stabilizePrintHeader();
  }
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync()})}

  document.addEventListener('click',e=>{
    const del=e.target?.closest?.('.pb791DeleteGallery');
    if(del&&isGalleryList()){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();void openDeleteGallery(del);return;
    }
    const guide=e.target?.closest?.('#pb793-gallery-video-guide,#pb794-gallery-video-guide');
    if(guide&&isGalleryList()){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();void openDeviceGuide();return;
    }
  },true);

  const root=qs('#root');if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true});
  new MutationObserver(schedule).observe(document.body||document.documentElement,{subtree:true,childList:true});
  for(const name of ['pushState','replaceState']){
    const old=history[name];if(typeof old!=='function'||old.__pb794)continue;const fn=function(...args){const out=old.apply(this,args);setTimeout(schedule,0);return out};fn.__pb794=true;history[name]=fn;
  }
  addEventListener('popstate',schedule,{passive:true});addEventListener('pageshow',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  schedule();
  console.info('[PhotoBridge] v794 runtime active');
})();
