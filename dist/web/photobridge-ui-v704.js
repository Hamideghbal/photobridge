/* PhotoBridge v704 — one mobile two-line header, installable PWA, deterministic desktop store tabs. */
(()=>{
  'use strict';
  const MOBILE='(max-width: 820px)';
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const isMobile=()=>{try{return matchMedia(MOBILE).matches}catch{return innerWidth<=820}};
  const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true}catch{return navigator.standalone===true}};
  const isiOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(/macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  let installPrompt=null,raf=0;
  const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync()})};

  function headerOf(row){return row?.closest?.('.photographerHeaderRefined,#photographerStoreRoleHeader')||null}
  function ensureSecondRow(header){
    if(!header)return null;
    let row=qs(':scope>.pb704MobileSecondaryActions',header);
    if(!row){row=document.createElement('div');row.className='pb704MobileSecondaryActions';header.appendChild(row)}
    return row;
  }
  function normalizeInvite(header,primary){
    if(!header||!primary)return null;
    const candidates=qsa('.mobileHeaderInvite',header);
    let invite=candidates[0]||null;
    candidates.slice(1).forEach(x=>x.remove());
    if(!invite){
      invite=document.createElement('button');invite.type='button';invite.className='mobileHeaderInvite';
      invite.addEventListener('click',e=>{e.preventDefault();location.href='/photographer/settings/invites'});
    }
    invite.id='pb704HeaderInviteButton';invite.title='دعوت همکار';invite.setAttribute('aria-label','دعوت همکار');
    let label=qs(':scope>.pb704InviteLabel',invite);
    if(!label){label=document.createElement('span');label.className='pb698InviteLabel pb704InviteLabel'}
    label.textContent='دعوت همکار';invite.replaceChildren(label);
    return invite;
  }
  function installHelp(){
    let overlay=qs('#pb704InstallOverlay');
    if(!overlay){
      overlay=document.createElement('div');overlay.id='pb704InstallOverlay';overlay.hidden=true;
      overlay.innerHTML='<section id="pb704InstallSheet" role="dialog" aria-modal="true" aria-labelledby="pb704InstallTitle"><div class="pb704InstallHead"><b id="pb704InstallTitle">نصب PhotoBridge</b><button class="pb704InstallClose" type="button" aria-label="بستن">×</button></div><div class="pb704InstallBody"></div><button class="pb704InstallPrimary" type="button">متوجه شدم</button></section>';
      document.body.appendChild(overlay);
      const close=()=>overlay.hidden=true;
      qs('.pb704InstallClose',overlay).onclick=close;qs('.pb704InstallPrimary',overlay).onclick=close;
      overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    }
    const body=qs('.pb704InstallBody',overlay);
    if(isiOS()) body.innerHTML='<p>در iPhone و iPad نصب PWA از Safari انجام می‌شود:</p><ol><li>Share / اشتراک‌گذاری را بزنید.</li><li>Add to Home Screen / افزودن به صفحه اصلی را انتخاب کنید.</li><li>Add / افزودن را تأیید کنید.</li></ol>';
    else body.innerHTML='<p>برای نصب کامل PhotoBridge از Chrome یا مرورگر سازگار استفاده کنید. اگر پنجره نصب مستقیم ظاهر نشد، از منوی مرورگر «Install app / نصب برنامه» را انتخاب کنید.</p>';
    overlay.hidden=false;
  }
  async function requestInstall(){
    if(standalone())return;
    if(installPrompt){
      const p=installPrompt;installPrompt=null;
      try{await p.prompt();await p.userChoice}catch{}
      schedule();return;
    }
    installHelp();
  }
  function ensureInstall(second){
    if(!second)return null;
    let b=qs(':scope>.mobileHeaderInstall',second);
    if(!b){b=document.createElement('button');b.type='button';b.className='mobileHeaderInstall';b.innerHTML='<span class="pb704InstallGlyph" aria-hidden="true">↧</span><span>نصب برنامه</span>';b.title='نصب PhotoBridge روی گوشی';b.setAttribute('aria-label','نصب برنامه PhotoBridge');b.addEventListener('click',requestInstall);second.appendChild(b)}
    b.classList.toggle('pb704Installed',standalone());
    return b;
  }
  function normalizeMobileHeader(header){
    if(!isMobile()||!header)return;
    const primary=qs('.photographerMobileHeaderQuickActions',header);if(!primary)return;
    const second=ensureSecondRow(header);
    const invite=normalizeInvite(header,primary);
    const install=ensureInstall(second);
    const bell=qs('.mobileNotificationBell',primary),power=qs('.mobileHeaderPower',primary),settings=qs('.mobileHeaderSettings',primary),wallet=qs('.mobileHeaderWallet',primary);
    [bell,power,settings,wallet].filter(Boolean).forEach(x=>primary.appendChild(x));
    if(invite)second.appendChild(invite);
    if(install)second.appendChild(install);
    primary.classList.add('pb704MobilePrimaryActions');header.classList.add('pb704TwoLineMobileHeader');
  }

  function ensureDesktopInstagram(nav){
    if(!nav||isMobile())return;
    if(qs('button[data-main-href="/photographer/album-design?pb_mode=instagram"]',nav)||qs('.photographerInstagramDesignEntry',nav))return;
    const b=document.createElement('button');b.type='button';b.className='rolePrimaryAction photographerInstagramDesignEntry';b.textContent='طراحی اینستاگرام';
    b.addEventListener('click',()=>location.assign('/photographer/album-design?pb_mode=instagram'));
    const store=qs('.photographerStoreEntry,.storeDesktopPrimary',nav);if(store)nav.insertBefore(b,store);else nav.appendChild(b);
  }
  function cleanupStaleGuideButtons(){
    const printNav=qs('.photographerPrintWorkspace .photographerPrintModeNav');
    qsa('.pb569WorkflowGuideButton').forEach(btn=>{if(!printNav||!printNav.contains(btn))btn.remove()});
    if(!printNav)qsa('.photographerHeaderNav.pb699DesktopGuideNav,.photographerHeaderNav.pb569WorkflowGuideNavReady,.photographerHeaderNav.pb692InlineGuideReady').forEach(nav=>nav.classList.remove('pb699DesktopGuideNav','pb569WorkflowGuideNavReady','pb692InlineGuideReady'));
  }

  function decorateDesktopHeader(header){
    if(!header||isMobile()||header.classList.contains('photographerPrintModeHeader'))return;
    const nav=qs(':scope>.photographerHomeModeNav,:scope>.photographerHeaderNav',header);
    const tools=qs(':scope>.photographerHeaderTools,:scope>.roleHeaderCenter',header);
    const identity=qs(':scope>.photographerHeaderIdentity,:scope>.workspaceIdentity',header);
    if(!nav||!tools||!identity)return;
    ensureDesktopInstagram(nav);
    const toolButtons=qs('.roleHeaderToolButtons',tools);
    if(header.id==='photographerStoreRoleHeader'&&toolButtons&&!qs('.photographerInviteHeaderBtn',toolButtons)){
      const invite=document.createElement('button');invite.type='button';invite.className='headerUtilityBtn photographerInviteHeaderBtn';invite.textContent='دعوت همکار';invite.title='دعوت همکار';invite.addEventListener('click',()=>location.assign('/photographer/settings/invites'));
      const bell=qs('#storeDesktopNotificationBtn,.systemNotificationBell',toolButtons);if(bell)toolButtons.insertBefore(invite,bell);else toolButtons.appendChild(invite);
    }
    header.classList.add('pb704DesktopPhotographerHeader');nav.classList.add('pb704DesktopPrimaryNav');tools.classList.add('pb704DesktopTools');
    let sep=qs(':scope>.pb704DesktopHeaderSeparator',header);
    if(!sep){sep=document.createElement('span');sep.className='pb704DesktopHeaderSeparator';sep.setAttribute('aria-hidden','true');header.insertBefore(sep,tools)}
  }

  function setupDesktopStore(){
    if(isMobile())return;
    const root=qs('#storePhotographerWorkspace'),nav=qs('#storeSectionNavV673'),shell=qs('#storePhotographerWorkspace>.shell');
    if(!root||!nav||!shell)return;
    decorateDesktopHeader(qs('#photographerStoreRoleHeader'));
    nav.classList.add('pb704DesktopStoreTabs');
    // v702 used an IntersectionObserver that could overwrite the clicked tab. Disconnect it if an old page kept it alive.
    try{nav._pb702Observer?.disconnect?.();nav._pb702Observer=null}catch{}
    const buttons=qsa(':scope>[data-store-panel]',nav);
    const activate=(id,scroll=true)=>{
      const panel=qs('#'+CSS.escape(id));if(!panel)return;
      buttons.forEach(b=>{const on=b.dataset.storePanel===id;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false')});
      nav.dataset.pb704Active=id;
      if(scroll){
        const shellRect=shell.getBoundingClientRect(),panelRect=panel.getBoundingClientRect();
        const y=Math.max(0,shell.scrollTop+(panelRect.top-shellRect.top)-10);
        shell.scrollTo({top:y,behavior:'smooth'});
      }
    };
    if(nav.dataset.pb704Bound!=='1'){
      nav.dataset.pb704Bound='1';
      nav.addEventListener('click',e=>{
        const b=e.target.closest?.('[data-store-panel]');if(!b||isMobile())return;
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();activate(b.dataset.storePanel,true);
      },true);
    }
    const requested=new URLSearchParams(location.search).get('panel');
    const map={rental:'equipmentPanel',sales:'salesPanel',bookings:'bookingsPanel',finance:'financePanel'};
    const initial=map[requested]||nav.dataset.pb704Active||buttons.find(b=>b.classList.contains('active'))?.dataset.storePanel||'';
    if(initial)activate(initial,false);else buttons.forEach(b=>{b.classList.remove('active');b.setAttribute('aria-selected','false')});
  }

  function sync(){
    if(isMobile()) qsa('.photographerHeaderRefined').forEach(normalizeMobileHeader);
    else{
      qsa('.photographerMain>.photographerHeaderRefined:not(.photographerPrintModeHeader)').forEach(decorateDesktopHeader);
      decorateDesktopHeader(qs('#photographerStoreRoleHeader'));setupDesktopStore();
    }
    cleanupStaleGuideButtons();
  }

  addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;schedule()});
  addEventListener('appinstalled',()=>{installPrompt=null;schedule()});
  addEventListener('resize',schedule,{passive:true});addEventListener('pageshow',schedule,{passive:true});addEventListener('popstate',schedule);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    addEventListener('load',()=>navigator.serviceWorker.register('/photobridge-sw-v704.js',{scope:'/'}).catch(()=>{}),{once:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  setTimeout(sync,80);setTimeout(sync,400);setTimeout(sync,1200);
  console.info('[PhotoBridge] v704 unified mobile/PWA and deterministic desktop store active');
})();
