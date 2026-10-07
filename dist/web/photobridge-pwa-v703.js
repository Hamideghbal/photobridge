/* PhotoBridge v703 — PWA registration + mobile install control. */
(()=>{
  'use strict';
  const MOBILE='(max-width: 820px)';
  const qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const mobile=()=>{try{return matchMedia(MOBILE).matches}catch{return innerWidth<=820}};
  const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true}catch{return navigator.standalone===true}};
  const isiOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(/macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  let installPrompt=null, raf=0;

  function ensureInviteLabel(row){
    const invites=qsa('.mobileHeaderInvite',row);if(!invites.length)return;
    const keep=invites[0];invites.slice(1).forEach(x=>x.remove());
    let label=qs(':scope>.pb703InviteLabel,:scope>.pb700InviteLabel,:scope>.pb699InviteLabel,:scope>.pb698InviteLabel',keep);
    if(!label){label=document.createElement('span')}
    label.className='pb698InviteLabel pb699InviteLabel pb700InviteLabel pb703InviteLabel';
    label.textContent='دعوت همکار';
    keep.replaceChildren(label);keep.title='دعوت همکار';keep.setAttribute('aria-label','دعوت همکار');
  }

  function showHelp(){
    let overlay=qs('#pb703InstallOverlay');
    if(!overlay){
      overlay=document.createElement('div');overlay.id='pb703InstallOverlay';overlay.hidden=true;
      overlay.innerHTML='<section id="pb703InstallSheet" role="dialog" aria-modal="true" aria-labelledby="pb703InstallTitle"><div class="pb703InstallHead"><b id="pb703InstallTitle">نصب PhotoBridge</b><button class="pb703InstallClose" type="button" aria-label="بستن">×</button></div><div class="pb703InstallBody"></div><button class="pb703InstallPrimary" type="button">متوجه شدم</button></section>';
      document.body.appendChild(overlay);
      const close=()=>{overlay.hidden=true};
      qs('.pb703InstallClose',overlay).onclick=close;qs('.pb703InstallPrimary',overlay).onclick=close;
      overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    }
    const body=qs('.pb703InstallBody',overlay);
    if(isiOS())body.innerHTML='<p>برای نصب روی آیفون یا آیپد، PhotoBridge را در Safari باز نگه دارید و این مراحل را انجام دهید:</p><ol><li>روی دکمه Share / اشتراک‌گذاری بزنید.</li><li>گزینه «Add to Home Screen / افزودن به صفحه اصلی» را انتخاب کنید.</li><li>در صفحه بعد روی «Add / افزودن» بزنید.</li></ol>';
    else body.innerHTML='<p>مرورگر فعلی هنوز پنجره نصب مستقیم را ارائه نکرده است. از منوی مرورگر گزینه «Install app / نصب برنامه» یا «Add to Home screen / افزودن به صفحه اصلی» را انتخاب کنید.</p>';
    overlay.hidden=false;
  }

  async function requestInstall(){
    if(standalone())return;
    if(installPrompt){
      const p=installPrompt;installPrompt=null;
      try{await p.prompt();await p.userChoice}catch{}
      sync();return;
    }
    showHelp();
  }

  function ensureInstall(row){
    if(!mobile()||!row)return;
    let b=qs(':scope>.mobileHeaderInstall',row);
    if(!b){b=document.createElement('button');b.type='button';b.className='mobileHeaderInstall';b.textContent='نصب برنامه';b.title='نصب PhotoBridge روی گوشی';b.setAttribute('aria-label','نصب برنامه PhotoBridge');b.addEventListener('click',requestInstall);row.appendChild(b)}
    b.classList.toggle('pb703Installed',standalone());
  }

  function normalizeRow(row){
    if(!row)return;ensureInviteLabel(row);ensureInstall(row);
    const bell=qs('.mobileNotificationBell',row),power=qs('.mobileHeaderPower',row),settings=qs('.mobileHeaderSettings',row),wallet=qs('.mobileHeaderWallet',row);
    [bell,power,settings,wallet].filter(Boolean).forEach(x=>row.appendChild(x));
    // Invite/install stay DOM children but CSS absolutely places them on line two, so no first-row width is consumed.
    const invite=qs('.mobileHeaderInvite',row),install=qs('.mobileHeaderInstall',row);if(invite)row.appendChild(invite);if(install)row.appendChild(install);
    row.classList.add('pb703MobileQuickActions');
  }

  function sync(){
    if(!mobile())return;
    qsa('.photographerMobileHeaderQuickActions').forEach(normalizeRow);
  }
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync()})}

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;sync()});
  window.addEventListener('appinstalled',()=>{installPrompt=null;sync()});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('pageshow',schedule,{passive:true});
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});

  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    window.addEventListener('load',()=>navigator.serviceWorker.register('/photobridge-sw-v703.js',{scope:'/'}).catch(()=>{}),{once:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  setTimeout(sync,100);setTimeout(sync,650);
  console.info('[PhotoBridge] v703 PWA/mobile two-line header active');
})();
