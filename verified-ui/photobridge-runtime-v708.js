/* PhotoBridge v708 — React-safe mobile secondary row + install-state detection. */
(()=>{
  'use strict';
  if(window.__PB708_RUNTIME__)return;
  window.__PB708_RUNTIME__=true;

  const MOBILE='(max-width: 820px)';
  const INSTALL_KEY='photobridge:pwa-installed';
  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const mobile=()=>{try{return matchMedia(MOBILE).matches}catch{return innerWidth<=820}};
  const isiOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(/macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  const standalone=()=>{
    try{
      return matchMedia('(display-mode: standalone)').matches||
        matchMedia('(display-mode: fullscreen)').matches||
        navigator.standalone===true||
        String(document.referrer||'').startsWith('android-app://');
    }catch{return navigator.standalone===true}
  };
  const installedMarker=()=>{try{return localStorage.getItem(INSTALL_KEY)==='1'}catch{return false}};
  const setInstalledMarker=(value)=>{try{value?localStorage.setItem(INSTALL_KEY,'1'):localStorage.removeItem(INSTALL_KEY)}catch{}};

  let installPrompt=null;
  let raf=0,timer=0,lastHref=location.href;

  if(standalone())setInstalledMarker(true);

  function photographerHeader(){
    return qs('#photographerStoreRoleHeader')||qs('.photographerMain>.unifiedRoleHeader.photographerHeaderRefined');
  }

  function schedule(delay=0){
    if(delay){clearTimeout(timer);timer=setTimeout(()=>schedule(),delay);return}
    if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;sync()});
  }

  function installVisible(){
    if(!mobile()||standalone()||installedMarker())return false;
    // On Android/Chromium only show when the browser confirms the PWA is installable.
    // This naturally keeps the control hidden when the app is already installed.
    if(!isiOS())return !!installPrompt;
    // iOS has no beforeinstallprompt; show the manual install helper when not standalone.
    return true;
  }

  function ensureInstallHelp(){
    let overlay=qs('#pb708InstallOverlay');
    if(!overlay){
      overlay=document.createElement('div');
      overlay.id='pb708InstallOverlay';
      overlay.hidden=true;
      overlay.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="pb708InstallTitle"><div class="pb708InstallHead"><b id="pb708InstallTitle">نصب PhotoBridge</b><button type="button" aria-label="بستن">×</button></div><div class="pb708InstallBody"></div><button class="pb708InstallOk" type="button">متوجه شدم</button></section>';
      document.body.appendChild(overlay);
      const close=()=>{overlay.hidden=true};
      qs('.pb708InstallHead button',overlay).onclick=close;
      qs('.pb708InstallOk',overlay).onclick=close;
      overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    }
    const body=qs('.pb708InstallBody',overlay);
    if(isiOS())body.innerHTML='<p>در iPhone و iPad نصب از Safari انجام می‌شود:</p><ol><li>Share / اشتراک‌گذاری را بزنید.</li><li>Add to Home Screen / افزودن به صفحه اصلی را انتخاب کنید.</li><li>Add / افزودن را تأیید کنید.</li></ol>';
    else body.innerHTML='<p>برای نصب PhotoBridge، گزینه Install app / نصب برنامه را از مرورگر انتخاب کنید.</p>';
    overlay.hidden=false;
  }

  async function requestInstall(){
    if(standalone()||installedMarker())return;
    if(isiOS()){ensureInstallHelp();return}
    const p=installPrompt||window.__PB_INSTALL_PROMPT__||null;
    if(!p)return;
    installPrompt=null;
    window.__PB_INSTALL_PROMPT__=null;
    try{
      await p.prompt();
      const choice=await p.userChoice;
      if(choice?.outcome==='accepted')setInstalledMarker(true);
    }catch{}
    schedule(80);
  }

  function ensureInstallButton(){
    let b=qs('#pb708InstallButton');
    if(!installVisible()){
      b?.remove();
      return null;
    }
    if(!b){
      b=document.createElement('button');
      b.id='pb708InstallButton';
      b.type='button';
      b.innerHTML='<span aria-hidden="true">↧</span><b>نصب برنامه</b>';
      b.setAttribute('aria-label','نصب برنامه PhotoBridge');
      b.addEventListener('click',requestInstall);
      document.body.appendChild(b);
    }
    return b;
  }

  function measurePrimaryActions(h){
    const q=qs('.photographerMobileHeaderQuickActions',h);
    if(!q)return null;
    const selectors=['.mobileNotificationBell','.mobileHeaderPower','.mobileHeaderSettings','.mobileHeaderWallet'];
    const rects=selectors.map(s=>qs(s,q)?.getBoundingClientRect()).filter(r=>r&&r.width>0&&r.height>0);
    if(!rects.length)return null;
    const left=Math.min(...rects.map(r=>r.left));
    const right=Math.max(...rects.map(r=>r.right));
    return {left,right,width:Math.max(1,right-left)};
  }

  function layoutSecondaryRow(h){
    if(!mobile()||!h)return;
    const invite=qs('.photographerMobileHeaderQuickActions>.mobileHeaderInvite',h);
    if(!invite)return;
    const span=measurePrimaryActions(h);
    const hr=h.getBoundingClientRect();
    const root=document.documentElement;
    const left=Math.round(span?.left ?? Math.max(8,hr.left+8));
    const total=Math.round(span?.width ?? Math.min(214,Math.max(188,innerWidth*.54)));
    const gap=6;
    const showInstall=installVisible();
    const inviteW=showInstall?Math.floor((total-gap)/2):total;
    const installW=showInstall?Math.max(1,total-gap-inviteW):0;
    const top=Math.round(hr.top+61);

    root.style.setProperty('--pb708-row-left',`${left}px`);
    root.style.setProperty('--pb708-row-top',`${top}px`);
    root.style.setProperty('--pb708-row-total',`${total}px`);
    root.style.setProperty('--pb708-invite-w',`${inviteW}px`);
    root.style.setProperty('--pb708-install-w',`${installW}px`);
    root.style.setProperty('--pb708-install-left',`${left+inviteW+gap}px`);
    root.classList.toggle('pb708InstallVisible',showInstall);
  }

  function styleHeaderOnly(h){
    if(!h)return;
    // Class-only decoration: do not move/remove React-owned nodes.
    if(!mobile()&&!h.classList.contains('photographerPrintModeHeader')){
      h.classList.add('pb704DesktopPhotographerHeader');
      const nav=qs(':scope>.photographerHomeModeNav,:scope>.photographerHeaderNav',h);
      const tools=qs(':scope>.photographerHeaderTools,:scope>.roleHeaderCenter',h);
      nav?.classList.add('pb704DesktopPrimaryNav');
      tools?.classList.add('pb704DesktopTools');
    }
  }

  function sync(){
    const h=photographerHeader();
    styleHeaderOnly(h);
    ensureInstallButton();
    layoutSecondaryRow(h);
    lastHref=location.href;
  }

  function after(){schedule(20);setTimeout(()=>schedule(),100);setTimeout(()=>schedule(),360)}
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('.photographerBottomAppNav button,.photographerHeaderNav button,.photographerMobileHeaderQuickActions button,#storeSectionNavV673 button'))after();
  },true);

  const wrap=n=>{
    const old=history[n];
    if(!old||old.__pb708)return;
    const fn=function(...args){const out=old.apply(this,args);if(location.href!==lastHref)after();return out};
    fn.__pb708=true;history[n]=fn;
  };
  try{wrap('pushState');wrap('replaceState')}catch{}

  addEventListener('popstate',after,{passive:true});
  addEventListener('pageshow',after,{passive:true});
  addEventListener('resize',()=>schedule(60),{passive:true});
  try{
    visualViewport?.addEventListener('resize',()=>schedule(40),{passive:true});
    visualViewport?.addEventListener('scroll',()=>schedule(40),{passive:true});
  }catch{}

  addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    // If Chromium offers install again, any previous marker is stale (for example after uninstall).
    setInstalledMarker(false);
    installPrompt=e;
    window.__PB_INSTALL_PROMPT__=e;
    after();
  });
  addEventListener('appinstalled',()=>{
    setInstalledMarker(true);
    installPrompt=null;
    window.__PB_INSTALL_PROMPT__=null;
    qs('#pb708InstallButton')?.remove();
    after();
  });

  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    addEventListener('load',()=>navigator.serviceWorker.register('/photobridge-sw-v708.js',{scope:'/'}).catch(()=>{}),{once:true});
  }

  const start=()=>{sync();[100,300,800,1600,3000].forEach(ms=>setTimeout(sync,ms))};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v708 mobile header/PWA runtime active');
})();
