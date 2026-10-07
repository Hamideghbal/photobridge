/* PhotoBridge v707 — React-safe runtime. NEVER reparent/remove/insert nodes inside #root. */
(()=>{
  'use strict';
  if(window.__PB707_RUNTIME__)return;
  window.__PB707_RUNTIME__=true;
  const MOBILE='(max-width: 820px)';
  const qs=(s,r=document)=>r?.querySelector?.(s)||null;
  const mobile=()=>{try{return matchMedia(MOBILE).matches}catch{return innerWidth<=820}};
  const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true}catch{return navigator.standalone===true}};
  const isiOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(/macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  let installPrompt=null,raf=0,timer=0,lastHref=location.href;
  function schedule(delay=0){
    if(delay){clearTimeout(timer);timer=setTimeout(()=>schedule(),delay);return}
    if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync()});
  }
  function photographerHeader(){return qs('#photographerStoreRoleHeader')||qs('.photographerMain>.unifiedRoleHeader.photographerHeaderRefined')}
  function ensureInstallHelp(){
    let overlay=qs('#pb707InstallOverlay');
    if(!overlay){
      overlay=document.createElement('div');overlay.id='pb707InstallOverlay';overlay.hidden=true;
      overlay.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="pb707InstallTitle"><div class="pb707InstallHead"><b id="pb707InstallTitle">نصب PhotoBridge</b><button type="button" aria-label="بستن">×</button></div><div class="pb707InstallBody"></div><button class="pb707InstallOk" type="button">متوجه شدم</button></section>';
      document.body.appendChild(overlay);
      const close=()=>{overlay.hidden=true};
      qs('.pb707InstallHead button',overlay).onclick=close;qs('.pb707InstallOk',overlay).onclick=close;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    }
    const body=qs('.pb707InstallBody',overlay);
    if(isiOS())body.innerHTML='<p>در iPhone و iPad نصب از Safari انجام می‌شود:</p><ol><li>Share / اشتراک‌گذاری را بزنید.</li><li>Add to Home Screen / افزودن به صفحه اصلی را انتخاب کنید.</li><li>Add / افزودن را تأیید کنید.</li></ol>';
    else body.innerHTML='<p>اگر پنجره نصب مستقیم نمایش داده نشد، از منوی مرورگر گزینه «Install app / نصب برنامه» را انتخاب کنید.</p>';
    overlay.hidden=false;
  }
  async function requestInstall(){
    if(standalone())return;
    const p=installPrompt||window.__PB_INSTALL_PROMPT__||null;
    if(p){installPrompt=null;window.__PB_INSTALL_PROMPT__=null;try{await p.prompt();await p.userChoice}catch{}schedule(80);return}
    ensureInstallHelp();
  }
  function ensureInstallButton(h){
    let b=qs('#pb707InstallButton');
    if(!mobile()||!h||standalone()){b?.remove();return}
    if(!b){
      b=document.createElement('button');b.id='pb707InstallButton';b.type='button';b.innerHTML='<span aria-hidden="true">↧</span><b>نصب برنامه</b>';b.setAttribute('aria-label','نصب برنامه PhotoBridge');b.addEventListener('click',requestInstall);document.body.appendChild(b);
    }
    const r=h.getBoundingClientRect();
    b.style.top=`${Math.max(0,Math.round(r.top+51))}px`;b.style.left='116px';
  }
  function styleHeaderOnly(h){
    if(!h)return;
    // Class-only decoration is React-safe: never change child order/parentage.
    if(!mobile()&&!h.classList.contains('photographerPrintModeHeader')){
      h.classList.add('pb704DesktopPhotographerHeader');
      const nav=qs(':scope>.photographerHomeModeNav,:scope>.photographerHeaderNav',h);const tools=qs(':scope>.photographerHeaderTools,:scope>.roleHeaderCenter',h);
      nav?.classList.add('pb704DesktopPrimaryNav');tools?.classList.add('pb704DesktopTools');
    }
  }
  function sync(){
    const h=photographerHeader();styleHeaderOnly(h);ensureInstallButton(h);lastHref=location.href;
  }
  function after(){schedule(24);setTimeout(()=>schedule(),120);setTimeout(()=>schedule(),420)}
  document.addEventListener('click',e=>{if(e.target?.closest?.('.photographerBottomAppNav button,.photographerHeaderNav button,.photographerMobileHeaderQuickActions button,#storeSectionNavV673 button'))after()},true);
  const wrap=n=>{const old=history[n];if(!old||old.__pb707)return;const fn=function(...args){const out=old.apply(this,args);if(location.href!==lastHref)after();return out};fn.__pb707=true;history[n]=fn};
  try{wrap('pushState');wrap('replaceState')}catch{}
  addEventListener('popstate',after,{passive:true});addEventListener('pageshow',after,{passive:true});addEventListener('resize',()=>schedule(80),{passive:true});
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;window.__PB_INSTALL_PROMPT__=e;after()});
  addEventListener('appinstalled',()=>{installPrompt=null;window.__PB_INSTALL_PROMPT__=null;after()});
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))addEventListener('load',()=>navigator.serviceWorker.register('/photobridge-sw-v707.js',{scope:'/'}).catch(()=>{}),{once:true});
  const start=()=>{sync();[120,350,900,1800,3200].forEach(ms=>setTimeout(sync,ms))};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  console.info('[PhotoBridge] v707 React-safe runtime active');
})();
