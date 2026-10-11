/* PhotoBridge v791 — finance lab context + gallery lifetime/delete + modal select stacking. */
(()=>{
  'use strict';
  if(window.__PB791_RUNTIME_FIX__)return;
  window.__PB791_RUNTIME_FIX__=true;

  const mq=window.matchMedia('(max-width:820px)');
  const qs=(s,r=document)=>r&&r.querySelector?r.querySelector(s):null;
  const qsa=(s,r=document)=>r&&r.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const text=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const mobile=()=>mq.matches;
  const isGalleryList=()=>location.pathname==='/photographer/gallery';
  let frame=0;
  let galleryPromise=null;
  let gallerySnapshot=null;
  let countdownTimer=0;

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

  async function galleryData(force=false){
    if(gallerySnapshot&&!force)return gallerySnapshot;
    if(galleryPromise&&!force)return galleryPromise;
    galleryPromise=fetch('/api/customer/client-galleries',{credentials:'include',cache:'no-store',headers:authHeaders()})
      .then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'gallery_list_failed');return d})
      .then(d=>(gallerySnapshot=d,d))
      .finally(()=>{galleryPromise=null});
    return galleryPromise;
  }

  function appendWorkspacePrint(url){
    if(typeof url!=='string'||!url.startsWith('/photographer/finance/'))return url;
    const u=new URL(url,location.origin);
    u.searchParams.set('workspace','print');
    return `${u.pathname}${u.search}${u.hash}`;
  }

  function financeContextType(){
    if(qs('.photographerStoreIdentityBar,#photographerStoreIdentityBar'))return 'فروشگاه';
    return 'لابراتوار';
  }
  function financeContextName(main){
    const lab=qs('.photographerPrintTopLab',main);
    const selected=text(qs('.pbSelectTrigger>span,.pbSelectButton>span,.photographerPrintTopLabStatic',lab));
    return selected&&!/^انتخاب/.test(selected)?selected:'';
  }
  function updateFinanceTitle(main){
    const title=qs('#pb790-finance-chrome .pb790FinanceTitle',main);if(!title)return;
    let ctx=qs('.pb791FinanceContext',title);
    if(!ctx){ctx=document.createElement('small');ctx.className='pb791FinanceContext';title.appendChild(ctx)}
    const kind=financeContextType(),name=financeContextName(main);
    ctx.textContent=name?`(مربوط به ${kind} ${name})`:`(مربوط به ${kind})`;
  }
  function bindFinanceTabs(main){
    const chrome=qs('#pb790-finance-chrome',main);if(!chrome||chrome.dataset.pb791Bound==='1')return;
    chrome.dataset.pb791Bound='1';
    chrome.addEventListener('click',e=>{
      const btn=e.target?.closest?.('[data-fin]');if(!btn)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      const label=String(btn.dataset.fin||'');
      const real=qsa('.financeWorkspace .financeSectionTabs button').find(b=>text(b)===label);
      if(!real)return;
      const push=history.pushState,replace=history.replaceState;
      try{
        history.pushState=function(state,title,url){return push.call(history,state,title,appendWorkspacePrint(url))};
        history.replaceState=function(state,title,url){return replace.call(history,state,title,appendWorkspacePrint(url))};
        real.click();
      }finally{
        history.pushState=push;history.replaceState=replace;
      }
      setTimeout(schedule,0);setTimeout(schedule,90);
    },true);
  }
  function normalizeFinance(){
    if(!mobile())return;
    const finance=qs('.financeWorkspace');if(!finance)return;
    const main=finance.closest('.photographerMain');if(!(main instanceof HTMLElement))return;
    // v790 owns the finance shell. v791 extends it only when opened in the Print workspace.
    if(!qs('#pb790-finance-chrome',main))return;
    main.dataset.pb791Finance='1';
    qs('.photographerPrintModeNav',main)?.classList.add('pb791FinanceNav');
    updateFinanceTitle(main);bindFinanceTabs(main);
    requestAnimationFrame(()=>{
      const header=qs('.photographerPrintModeHeader',main);
      const nav=qs('.photographerPrintModeNav',main);
      const bottomBar=qs('.photographerMobileUtilityRail,.mobileRoleUtilityRail');
      const hr=header?.getBoundingClientRect?.(),nr=nav?.getBoundingClientRect?.(),br=bottomBar?.getBoundingClientRect?.();
      const top=Math.max(0,Math.ceil(Math.max(Number(hr?.bottom||0),Number(nr?.bottom||0))));
      const bottom=Math.max(0,Math.ceil(br&&br.top<innerHeight?innerHeight-br.top:76));
      main.style.setProperty('--pb790-finance-top',`${top}px`);
      main.style.setProperty('--pb790-finance-bottom',`${bottom}px`);
    });
  }

  function remainingLabel(deadline){
    const at=Date.parse(String(deadline||''));if(!Number.isFinite(at))return '';
    const ms=at-Date.now();
    if(ms<=0)return 'در انتظار حذف خودکار';
    const minute=60000,hour=60*minute,day=24*hour;
    if(ms>=day)return `${fa(Math.ceil(ms/day))} روز مانده`;
    if(ms>=hour)return `${fa(Math.ceil(ms/hour))} ساعت مانده`;
    if(ms>=minute)return `${fa(Math.ceil(ms/minute))} دقیقه مانده`;
    return 'کمتر از یک دقیقه مانده';
  }
  function updateCountdowns(){
    qsa('.pb791GalleryLifetime[data-deadline]').forEach(el=>{el.textContent=remainingLabel(el.dataset.deadline)});
  }
  async function deleteGallery(g,card,button){
    const title=String(g?.title||'این گالری');
    if(!await window.pb1113GalleryConfirm(`گالری «${title}» و عکس‌ها و اطلاعات مربوط به آن حذف شود؟ این کار قابل بازگشت نیست.`))return;
    button.disabled=true;button.textContent='در حال حذف…';
    try{
      const r=await fetch(`/api/customer/client-galleries/${encodeURIComponent(String(g.id))}`,{method:'DELETE',credentials:'include',cache:'no-store',headers:authHeaders()});
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||'gallery_delete_failed');
      card?.remove();gallerySnapshot=null;
      const count=qs('.clientGalleryListHead p');
      if(count){const n=qsa('.clientGalleryCard').length;count.textContent=`${fa(n)} گالری ساخته شده`}
    }catch{
      button.disabled=false;button.textContent='حذف گالری';window.pb1113GalleryNotice('حذف گالری انجام نشد. اتصال را بررسی و دوباره تلاش کن.');
    }
  }
  function renewalEligible(deadline){
    const at=Date.parse(String(deadline||''));if(!Number.isFinite(at))return false;
    const ms=at-Date.now();
    // Renewal appears in the last 7 days and remains available while an expired
    // gallery is still present in the automatic-deletion grace period.
    return ms<=7*24*60*60*1000;
  }
  function renewalKey(galleryId){
    const storageKey=`pb792-gallery-renew:${galleryId}`;
    try{let v=sessionStorage.getItem(storageKey)||'';if(!v){v=(crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`);sessionStorage.setItem(storageKey,v)}return {storageKey,value:v}}catch{return {storageKey,value:(crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`)}}
  }
  async function renewGallery(g,life,button){
    if(!g?.id||button?.disabled)return;
    let d;try{d=await galleryData()}catch{d={}}
    const fee=Number(d?.billing?.renewalFee??d?.billing?.fee??0),days=Number(d?.billing?.renewalDays||30);
    if(!await window.pb1113GalleryConfirm(`تمدید این گالری برای ${fa(days)} روز${fee>0?` با هزینه ${fee.toLocaleString('fa-IR')} تومان`:' بدون هزینه'} انجام شود؟`))return;
    const key=renewalKey(String(g.id));button.disabled=true;button.textContent='در حال تمدید…';
    try{
      const r=await fetch(`/api/customer/client-galleries/${encodeURIComponent(String(g.id))}/renew`,{method:'POST',credentials:'include',cache:'no-store',headers:authHeaders(),body:JSON.stringify({idempotencyKey:key.value})});
      const out=await r.json().catch(()=>({}));
      if(!r.ok){
        if(r.status===402&&out?.error==='service_wallet_insufficient'){
          button.disabled=false;button.textContent='تمدید گالری';
          if(await window.pb1113GalleryConfirm(`موجودی کیف پول کافی نیست. مبلغ لازم ${Number(out.required||fee).toLocaleString('fa-IR')} تومان است. به کیف پول بروی؟`)){history.pushState({},'', '/photographer/wallet');dispatchEvent(new PopStateEvent('popstate'));}
          return;
        }
        if(out?.error==='gallery_renewal_not_yet_available'){button.remove();return}
        if(out?.error==='gallery_renewal_expired'){button.disabled=false;button.textContent='تمدید گالری';window.pb1113GalleryNotice('این گالری از مهلت عادی گذشته است؛ اگر هنوز حذف نشده باشد می‌توان آن را بازیابی و تمدید کرد. دوباره تلاش کن.');return}
        throw new Error(out?.error||'gallery_renew_failed');
      }
      try{sessionStorage.removeItem(key.storageKey)}catch{}
      if(out.cleanupAfter)g.cleanup_after=out.cleanupAfter;
      if(out.expiresAt)g.expires_at=out.expiresAt;
      const deadline=g.cleanup_after||g.expires_at||out.deadlineAfter||'';
      if(life&&deadline){life.dataset.deadline=String(deadline);life.textContent=remainingLabel(deadline)}
      button.remove();gallerySnapshot=null;
      window.pb1113GalleryNotice(`گالری ${fa(Number(out.renewalDays||days))} روز تمدید شد${Number(out.chargedAmount||0)>0?` · ${Number(out.chargedAmount).toLocaleString('fa-IR')} تومان از کیف پول کسر شد`:''}.`);
    }catch{
      button.disabled=false;button.textContent='تمدید گالری';window.pb1113GalleryNotice('تمدید گالری انجام نشد. اتصال را بررسی و دوباره تلاش کن.');
    }
  }

  function matchGalleryToCard(galleries,card,index){
    if(card.dataset.pb791GalleryId){const exact=galleries.find(g=>String(g.id)===card.dataset.pb791GalleryId);if(exact)return exact}
    const heading=text(qs('.clientGalleryCardBody h3',card));
    const customer=text(qs('.clientGalleryCardBody>p',card));
    return galleries.find(g=>String(g.title||'')===heading&&customer.includes(String(g.customer_name||'')))||galleries[index]||null;
  }
  async function normalizeGalleryList(){
    if(!isGalleryList()||qs('.clientGalleryManager'))return;
    const cards=qsa('.clientGalleryCard');if(!cards.length)return;
    let d;try{d=await galleryData()}catch{return}
    const galleries=Array.isArray(d?.galleries)?d.galleries:[];
    cards.forEach((card,index)=>{
      const g=matchGalleryToCard(galleries,card,index);if(!g?.id)return;
      card.dataset.pb791GalleryId=String(g.id);
      const cover=qs('.clientGalleryCardCover',card);
      if(cover){
        let life=qs('.pb791GalleryLifetime',cover);
        const deadline=g.cleanup_after||g.expires_at||'';
        if(deadline){
          if(!life){life=document.createElement('span');life.className='pb791GalleryLifetime';cover.appendChild(life)}
          life.dataset.deadline=String(deadline);life.textContent=remainingLabel(deadline);
        }else life?.remove();
      }
      const actions=qs('.clientGalleryCardActions',card);
      if(actions){
        const deadline=g.cleanup_after||g.expires_at||'';
        const renewReady=Boolean(deadline&&renewalEligible(deadline));
        card.classList.toggle('pb792Renewable',renewReady);
        let renew=qs('.pb792RenewGallery',actions);
        if(renewReady){
          if(!renew){renew=document.createElement('button');renew.type='button';renew.className='pbActionButton secondaryAction pb792RenewGallery';renew.textContent='تمدید گالری';renew.addEventListener('click',()=>renewGallery(g,qs('.pb791GalleryLifetime',cover||card),renew));actions.appendChild(renew)}
        }else renew?.remove();
        if(!qs('.pb791DeleteGallery',actions)){
          const del=document.createElement('button');del.type='button';del.className='pbActionButton dangerSoft pb791DeleteGallery';del.textContent='حذف گالری';
          del.addEventListener('click',()=>deleteGallery(g,card,del));actions.appendChild(del);
        }
      }
    });
    updateCountdowns();
    if(!countdownTimer)countdownTimer=window.setInterval(updateCountdowns,30000);
  }

  function normalizeGalleryModal(){
    if(!location.pathname.startsWith('/g/'))return;
    // The PBSelect menu is portalled to body. v790's full-screen order modal uses a near-max z-index,
    // so mark open select menus for the v791 CSS top layer.
    qsa('.pbSelectMenuPortal').forEach(el=>el.classList.add('pb791ModalSelectTop'));
  }

  function schedule(){
    if(frame)return;
    frame=requestAnimationFrame(()=>{frame=0;normalizeFinance();normalizeGalleryModal();void normalizeGalleryList()});
  }
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-pb790-finance']});
  addEventListener('popstate',()=>{gallerySnapshot=null;schedule()});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('pageshow',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){gallerySnapshot=null;schedule()}});
  schedule();
})();
