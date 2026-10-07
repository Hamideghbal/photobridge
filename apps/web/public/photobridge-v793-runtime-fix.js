/* PhotoBridge v793 — mobile finance lab identity, visible gallery totals, polished renewal, Instagram beta and gallery video guides. */
(()=>{
  'use strict';
  if(window.__PB793_RUNTIME_FIX__)return;
  window.__PB793_RUNTIME_FIX__=true;

  const qs=(s,r=document)=>r&&r.querySelector?r.querySelector(s):null;
  const qsa=(s,r=document)=>r&&r.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const clean=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const money=n=>`${Number(n||0).toLocaleString('fa-IR')} تومان`;
  const isGalleryList=()=>location.pathname==='/photographer/gallery';
  const isPublicGallery=()=>location.pathname.startsWith('/g/');
  const isPhotographer=()=>/^\/photographer(?:\/|$)/.test(location.pathname);
  let raf=0,guideRequest=0;

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

  /* ---------- Finance lab strip ---------- */
  function syncFinanceLab(){
    const main=qs('.photographerMain[data-pb791-finance="1"]');if(!main)return;
    const lab=qs('.photographerPrintTopLab',main);if(!lab)return;
    lab.classList.add('pb793FinanceLabAligned');
    const name=qs('.photographerPrintTopLabStatic,.photographerPrintTopLabSelect .pbSelectTrigger>span,.photographerPrintTopLabSelect .pbSelectButton>span',lab);
    if(name){const full=clean(name);if(full)name.setAttribute('title',full)}
  }

  /* ---------- Instagram tab for every photographer + beta marker ---------- */
  function goInstagram(){
    try{window.__PB_PUBLIC_DESIGN_MODE__='instagram'}catch{}
    const target='/photographer/album-design?pb_mode=instagram';
    if(location.pathname==='/photographer/album-design'&&new URLSearchParams(location.search).get('pb_mode')==='instagram')return;
    history.pushState(null,'',target);window.dispatchEvent(new PopStateEvent('popstate'));
  }
  function ensureInstagram(){
    if(!isPhotographer())return;
    const desktop=qs('.photographerHomeModeNav');
    if(desktop){
      let b=qs('.photographerInstagramDesignEntry',desktop);
      if(!b){
        b=document.createElement('button');b.type='button';b.className='rolePrimaryAction photographerInstagramDesignEntry pb793InjectedInstagram';b.textContent='طراحی اینستاگرام';
        const store=qs('.photographerStoreEntry',desktop);store?desktop.insertBefore(b,store):desktop.appendChild(b);
        b.addEventListener('click',goInstagram);
      }
      b.hidden=false;b.removeAttribute('aria-hidden');b.removeAttribute('disabled');b.setAttribute('title','طراحی اینستاگرام · آزمایشی');
    }
    const grid=qs('.photographerBottomAppNavGrid');
    if(grid){
      let b=qs('.photographerInstagramMobileNav',grid);
      if(!b){
        b=document.createElement('button');b.type='button';b.className='photographerInstagramMobileNav pb793InjectedInstagram';b.setAttribute('aria-label','اینستاگرام');
        const icon=document.createElement('span');icon.className='photographerBottomNavIcon instagram';icon.setAttribute('aria-hidden','true');
        const em=document.createElement('em');em.textContent='اینستاگرام';b.append(icon,em);
        const store=qs('.photographerStoreMobileNav',grid);store?grid.insertBefore(b,store):grid.appendChild(b);
        b.addEventListener('click',goInstagram);
      }
      b.hidden=false;b.removeAttribute('aria-hidden');b.removeAttribute('disabled');b.setAttribute('title','اینستاگرام · آزمایشی');
    }
  }

  /* ---------- Customer gallery total + polished final step ---------- */
  function currentCartTotal(){
    const cart=clean(qs('.publicClientGalleryPage .clientGalleryCartButton small'));
    if(cart.includes('·')){const parts=cart.split('·').map(x=>x.trim()).filter(Boolean);if(parts.length>1)return parts.slice(1).join(' · ')}
    const status=clean(qs('.publicClientGalleryPage .clientGallerySelectionStatus.priced .clientGallerySelectionStatusMain small'));
    if(status.includes('·')){const parts=status.split('·').map(x=>x.trim()).filter(Boolean);const last=parts[parts.length-1];if(last&&/تومان|ریال/.test(last))return last}
    const invoice=clean(qs('.publicClientGalleryPage .clientGalleryCustomerOrderHead>strong'));if(invoice)return invoice;
    return '۰ تومان';
  }
  function enhanceCart(){
    if(!isPublicGallery())return;
    const card=qs('#pb792-cart-layer .pb792CartCard');
    if(card){
      let total=qs('.pb793CartTotal',card);
      if(!total){
        total=document.createElement('div');total.className='pb793CartTotal';total.innerHTML='<small>مجموع فاکتور</small><b></b>';
        const footer=qs(':scope>footer',card);footer?card.insertBefore(total,footer):card.appendChild(total);
      }
      const b=qs('b',total),value=currentCartTotal();if(b&&clean(b)!==value)b.textContent=value;
    }
    const finalize=qs('.publicClientGalleryPage .clientGalleryFinalizeConfirm');
    if(finalize&&qs('.clientGallerySelectionStatus.priced')){
      let total=qs('.pb793FinalizeTotal',finalize);
      if(!total){total=document.createElement('div');total.className='pb793FinalizeTotal';total.innerHTML='<small>مبلغ نهایی سفارش</small><b></b>';const ack=qs('.clientGalleryFinalizeAcknowledge',finalize);ack?finalize.insertBefore(total,ack):finalize.appendChild(total)}
      const b=qs('b',total),value=currentCartTotal();if(b&&clean(b)!==value)b.textContent=value;
    }
    const invoiceTotal=qs('.publicClientGalleryPage .clientGalleryCustomerOrderHead>strong');
    if(invoiceTotal){const full=clean(invoiceTotal);if(full)invoiceTotal.setAttribute('aria-label',`مبلغ نهایی فاکتور ${full}`)}
  }

  /* ---------- Reusable v793 modal ---------- */
  function removeLayer(id){qs(`#${id}`)?.remove()}
  function modalShell({id='pb793-modal-layer',title='',subtitle=''}){
    removeLayer(id);
    const layer=document.createElement('div');layer.id=id;layer.className='pb793ModalLayer';
    const card=document.createElement('section');card.className='pb793ModalCard';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');
    const head=document.createElement('header');head.className='pb793ModalHead';
    const copy=document.createElement('div');const b=document.createElement('b');b.textContent=title;copy.appendChild(b);if(subtitle){const s=document.createElement('small');s.textContent=subtitle;copy.appendChild(s)}
    const close=document.createElement('button');close.type='button';close.className='pb793ModalClose';close.setAttribute('aria-label','بستن');close.textContent='×';
    const body=document.createElement('div');body.className='pb793ModalBody';const actions=document.createElement('footer');actions.className='pb793ModalActions';
    head.append(copy,close);card.append(head,body,actions);layer.appendChild(card);document.body.appendChild(layer);
    const closeIt=()=>layer.remove();close.addEventListener('click',closeIt);layer.addEventListener('click',e=>{if(e.target===layer)closeIt()});
    return {layer,card,body,actions,close:closeIt,title:b};
  }

  /* ---------- Renewal modal ---------- */
  function matchGallery(data,card){
    const rows=Array.isArray(data?.galleries)?data.galleries:[];
    const id=String(card?.dataset?.pb791GalleryId||'');if(id){const exact=rows.find(g=>String(g?.id)===id);if(exact)return exact}
    const heading=clean(qs('.clientGalleryCardBody h3',card));const customer=clean(qs('.clientGalleryCardBody>p',card));
    return rows.find(g=>String(g?.title||'')===heading&&(!g?.customer_name||customer.includes(String(g.customer_name))))||rows[qsa('.clientGalleryCard').indexOf(card)]||null;
  }
  function renewKey(id){
    const k=`pb793-gallery-renew:${id}`;try{let v=sessionStorage.getItem(k)||'';if(!v){v=crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;sessionStorage.setItem(k,v)}return {k,v}}catch{return {k,v:crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}}
  }
  async function openRenewModal(button){
    if(button?.disabled)return;
    const card=button.closest('.clientGalleryCard');if(!card)return;
    button.disabled=true;
    let data,g;
    try{data=await jsonRequest('/api/customer/client-galleries');g=matchGallery(data,card)}catch{button.disabled=false;showRenewError('دریافت اطلاعات گالری انجام نشد. اتصال را بررسی و دوباره تلاش کن.');return}
    button.disabled=false;if(!g?.id){showRenewError('اطلاعات این گالری پیدا نشد. صفحه را تازه‌سازی و دوباره تلاش کن.');return}
    const fee=Number(data?.billing?.renewalFee??data?.billing?.fee??0),days=Number(data?.billing?.renewalDays||30);
    const ui=modalShell({id:'pb793-renew-layer',title:'تمدید گالری',subtitle:String(g.title||'گالری مشتری')});
    const summary=document.createElement('div');summary.className='pb793ModalSummary';
    const a=document.createElement('span');a.innerHTML='<small>مدت تمدید</small><b></b>';qs('b',a).textContent=`${fa(days)} روز`;
    const c=document.createElement('span');c.innerHTML='<small>هزینه تمدید</small><b></b>';qs('b',c).textContent=fee>0?money(fee):'بدون هزینه';summary.append(a,c);
    const msg=document.createElement('p');msg.className='pb793ModalMessage';msg.textContent='با تأیید، عمر این گالری تمدید می‌شود و در صورت وجود هزینه، مبلغ از کیف پول خدمات کسر خواهد شد.';ui.body.append(summary,msg);
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='فعلاً نه';cancel.addEventListener('click',ui.close);
    const confirm=document.createElement('button');confirm.type='button';confirm.className='primary';confirm.textContent=`تمدید ${fa(days)} روزه`;
    ui.actions.append(cancel,confirm);
    confirm.addEventListener('click',async()=>{
      const next=String(confirm.dataset.pb793Action||'');
      if(next==='reload'){location.reload();return}
      if(next==='wallet'){ui.close();history.pushState(null,'','/photographer/wallet');window.dispatchEvent(new PopStateEvent('popstate'));return}
      confirm.disabled=true;cancel.disabled=true;confirm.textContent='در حال تمدید…';msg.className='pb793ModalMessage';msg.textContent='در حال ثبت تمدید گالری…';
      const key=renewKey(String(g.id));
      try{
        const out=await jsonRequest(`/api/customer/client-galleries/${encodeURIComponent(String(g.id))}/renew`,{method:'POST',body:JSON.stringify({idempotencyKey:key.v})});
        try{sessionStorage.removeItem(key.k)}catch{}
        msg.className='pb793ModalMessage success';msg.textContent=`گالری ${fa(Number(out?.renewalDays||days))} روز تمدید شد${Number(out?.chargedAmount||0)>0?` و ${money(out.chargedAmount)} از کیف پول کسر شد`:''}.`;
        confirm.disabled=false;confirm.dataset.pb793Action='reload';confirm.textContent='تأیید و تازه‌سازی';cancel.remove();
      }catch(e){
        const code=e?.data?.error;
        if(Number(e?.status)===402&&code==='service_wallet_insufficient'){
          msg.className='pb793ModalMessage warn';msg.textContent=`موجودی کیف پول کافی نیست. مبلغ لازم ${money(e?.data?.required||fee)} است.`;
          confirm.disabled=false;confirm.dataset.pb793Action='wallet';confirm.className='wallet';confirm.textContent='رفتن به کیف پول';cancel.disabled=false;
        }else if(code==='gallery_renewal_not_yet_available'){
          msg.className='pb793ModalMessage warn';msg.textContent='تمدید از ۷ روز مانده به پایان عمر گالری فعال می‌شود.';confirm.remove();cancel.disabled=false;cancel.textContent='متوجه شدم';
        }else if(code==='gallery_renewal_expired'){
          msg.className='pb793ModalMessage error';msg.textContent='مهلت این گالری تمام شده و تمدید از این مسیر ممکن نیست.';confirm.remove();cancel.disabled=false;cancel.textContent='بستن';
        }else{
          msg.className='pb793ModalMessage error';msg.textContent='تمدید گالری انجام نشد. اتصال را بررسی و دوباره تلاش کن.';delete confirm.dataset.pb793Action;confirm.disabled=false;cancel.disabled=false;confirm.className='primary';confirm.textContent='تلاش دوباره';
        }
      }
    });
  }
  function showRenewError(message){
    const ui=modalShell({id:'pb793-renew-layer',title:'تمدید گالری'});const p=document.createElement('p');p.className='pb793ModalMessage error';p.textContent=message;ui.body.appendChild(p);const b=document.createElement('button');b.type='button';b.className='primary';b.textContent='بستن';b.addEventListener('click',ui.close);ui.actions.style.gridTemplateColumns='1fr';ui.actions.appendChild(b);
  }

  /* ---------- Gallery video guide ---------- */
  async function publicGuides(){
    const r=await fetch(`/api/public/video-guides?_=${Date.now()}`,{credentials:'include',cache:'no-store'});const d=await r.json().catch(()=>({}));return r.ok&&Array.isArray(d?.guides)?d.guides:[];
  }
  function guideScore(g,target){
    const hay=[g?.title,g?.category,g?.description,g?.id].filter(Boolean).join(' ').toLowerCase();
    const targetWords=target==='instagram'?['instagram','اینستاگرام']:['windows','window','ویندوز'];
    const galleryWords=['gallery','گالری'];let s=0;
    if(targetWords.some(w=>hay.includes(w)))s+=10;if(galleryWords.some(w=>hay.includes(w)))s+=5;
    if(hay.includes(`gallery-${target}`)||hay.includes(`gallery_${target}`))s+=8;
    if(g?.src)s+=2;return s;
  }
  function findGuide(list,target){return [...list].filter(g=>g&&g.src).sort((a,b)=>guideScore(b,target)-guideScore(a,target)).find(g=>guideScore(g,target)>=15)||null}
  function ensureGalleryGuideButton(){
    if(!isGalleryList())return;
    const head=qs('.clientGalleryIntroHeader');if(!head||qs('#pb793-gallery-video-guide',head))return;
    const b=document.createElement('button');b.type='button';b.id='pb793-gallery-video-guide';b.className='pb793GalleryGuideButton';b.innerHTML='<span aria-hidden="true">▶</span><b>راهنمای ویدیویی</b>';b.addEventListener('click',openGuideChooser);head.appendChild(b);
  }
  function guideLayer(title='راهنمای ویدیویی گالری',subtitle='آموزش موردنظر را انتخاب کن'){
    removeLayer('pb793-guide-layer');
    const layer=document.createElement('div');layer.id='pb793-guide-layer';layer.className='pb793GuideLayer';
    const sheet=document.createElement('section');sheet.className='pb793GuideSheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');
    const head=document.createElement('header');head.className='pb793GuideHead';const copy=document.createElement('div');const b=document.createElement('b');b.textContent=title;const s=document.createElement('small');s.textContent=subtitle;copy.append(b,s);const x=document.createElement('button');x.type='button';x.className='pb793GuideClose';x.textContent='×';x.setAttribute('aria-label','بستن');head.append(copy,x);const body=document.createElement('div');body.className='pb793GuideBody';sheet.append(head,body);layer.appendChild(sheet);document.body.appendChild(layer);
    const close=()=>layer.remove();x.addEventListener('click',close);layer.addEventListener('click',e=>{if(e.target===layer)close()});return {layer,sheet,head,body,close,title:b,subtitle:s};
  }
  async function openGuideChooser(){
    const seq=++guideRequest,ui=guideLayer();ui.body.innerHTML='<div class="pb793GuideHint">در حال دریافت ویدیوهای آموزشی…</div>';
    let list=[];try{list=await publicGuides()}catch{}if(seq!==guideRequest||!document.body.contains(ui.layer))return;
    const instagram=findGuide(list,'instagram'),windows=findGuide(list,'windows');ui.body.replaceChildren();
    const choices=document.createElement('div');choices.className='pb793GuideChoices';
    const make=(kind,guide)=>{const b=document.createElement('button');b.type='button';b.className='pb793GuideChoice';b.disabled=!guide;const icon=document.createElement('span');icon.className='pb793GuideIcon';icon.textContent=kind==='instagram'?'◎':'▣';const copy=document.createElement('div');const title=document.createElement('b');title.textContent=kind==='instagram'?'راهنمای گالری برای اینستاگرام':'راهنمای گالری برای ویندوز';const sub=document.createElement('small');sub.textContent=kind==='instagram'?'آموزش مسیر گالری و استفاده مرتبط با اینستاگرام':'آموزش مسیر گالری در نسخه ویندوز PhotoBridge';copy.append(title,sub);const status=document.createElement('span');status.className='pb793GuideStatus';status.textContent=guide?'آماده پخش':'هنوز بارگذاری نشده';b.append(icon,copy,status);if(guide)b.addEventListener('click',()=>playGuide(ui,guide,kind));return b};
    choices.append(make('instagram',instagram),make('windows',windows));ui.body.appendChild(choices);
    if(!instagram||!windows){const hint=document.createElement('div');hint.className='pb793GuideHint';hint.textContent='برای فعال شدن هر گزینه، ویدیوی مربوط را از بخش ویدیوهای آموزشی ادمین بارگذاری کن. در عنوان یا دسته ویدیو عبارت «گالری اینستاگرام» یا «گالری ویندوز» را بنویس؛ بعد از آپلود، همین دکمه بدون تغییر کد آن را پیدا می‌کند.';ui.body.appendChild(hint)}
  }
  function playGuide(ui,guide,kind){
    ui.title.textContent=kind==='instagram'?'راهنمای گالری · اینستاگرام':'راهنمای گالری · ویندوز';ui.subtitle.textContent=String(guide?.title||'ویدیوی آموزشی');ui.body.replaceChildren();
    const wrap=document.createElement('div');wrap.className='pb793GuideVideoWrap';const video=document.createElement('video');video.controls=true;video.playsInline=true;video.preload='metadata';video.src=String(guide.src||'');if(guide.poster)video.poster=String(guide.poster);const meta=document.createElement('div');meta.className='pb793GuideVideoMeta';const b=document.createElement('b');b.textContent=String(guide.title||'راهنمای ویدیویی');const s=document.createElement('small');s.textContent=String(guide.description||guide.category||'PhotoBridge');meta.append(b,s);wrap.append(video,meta);ui.body.appendChild(wrap);setTimeout(()=>video.play().catch(()=>{}),80);
  }

  /* ---------- Event ownership ---------- */
  document.addEventListener('click',e=>{
    const renew=e.target?.closest?.('.pb792RenewGallery');
    if(renew&&isGalleryList()){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();void openRenewModal(renew);return;
    }
  },true);

  function sync(){
    syncFinanceLab();ensureInstagram();ensureGalleryGuideButton();enhanceCart();
  }
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync()})}
  const root=qs('#root');if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true});
  new MutationObserver(schedule).observe(document.body||document.documentElement,{subtree:true,childList:true});
  for(const name of ['pushState','replaceState']){
    const old=history[name];if(typeof old!=='function'||old.__pb793)return;const fn=function(...args){const out=old.apply(this,args);setTimeout(schedule,0);return out};fn.__pb793=true;history[name]=fn;
  }
  addEventListener('popstate',schedule,{passive:true});addEventListener('pageshow',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  schedule();
  console.info('[PhotoBridge] v793 runtime active');
})();
