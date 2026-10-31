/* PhotoBridge v710 — install state only; no React DOM mutation. */
(()=>{
  'use strict';
  if(window.__PB710_RUNTIME__)return;
  window.__PB710_RUNTIME__=true;

  const KEY='photobridge:pwa-installed';
  const root=document.documentElement;
  const isiOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(/macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true||String(document.referrer||'').startsWith('android-app://')}catch{return navigator.standalone===true}};
  const readMarker=()=>{try{return localStorage.getItem(KEY)==='1'}catch{return false}};
  const writeMarker=v=>{try{v?localStorage.setItem(KEY,'1'):localStorage.removeItem(KEY)}catch{}};

  let promptEvent=null;
  let installed=standalone()||readMarker();
  if(standalone())writeMarker(true);

  function paint(){
    const ready=!installed&&(isiOS()||!!promptEvent);
    root.classList.toggle('pb710Installed',!!installed);
    root.classList.toggle('pb710InstallReady',!!ready);
  }

  async function detectInstalled(){
    if(standalone()){
      installed=true;writeMarker(true);paint();return true;
    }
    try{
      if(typeof navigator.getInstalledRelatedApps==='function'){
        const apps=await navigator.getInstalledRelatedApps();
        if(Array.isArray(apps)&&apps.length){installed=true;writeMarker(true);paint();return true}
      }
    }catch{}
    paint();return installed;
  }

  function manualHelp(){
    if(isiOS())alert('برای نصب PhotoBridge در iPhone/iPad: در Safari دکمه Share را بزنید و Add to Home Screen را انتخاب کنید.');
    else alert('برای نصب PhotoBridge، از منوی مرورگر گزینه Install app / نصب برنامه را انتخاب کنید.');
  }

  window.PB710InstallApp=async()=>{
    if(standalone()){installed=true;writeMarker(true);paint();return}
    await detectInstalled();
    if(installed)return;
    if(isiOS()){manualHelp();return}
    const p=promptEvent||window.__PB_INSTALL_PROMPT__||null;
    if(!p){manualHelp();return}
    promptEvent=null;window.__PB_INSTALL_PROMPT__=null;paint();
    try{
      await p.prompt();
      const choice=await p.userChoice;
      if(choice?.outcome==='accepted'){installed=true;writeMarker(true)}
    }catch{}
    paint();
  };

  addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    // This event is the browser's strongest signal that this origin is NOT installed.
    // Clear a stale marker left by a previous uninstall and show the CTA again.
    installed=false;writeMarker(false);
    promptEvent=e;window.__PB_INSTALL_PROMPT__=e;paint();
  });
  addEventListener('appinstalled',()=>{
    installed=true;writeMarker(true);promptEvent=null;window.__PB_INSTALL_PROMPT__=null;paint();
  });
  addEventListener('pageshow',()=>{
    if(standalone()){installed=true;writeMarker(true)}
    void detectInstalled();
  },{passive:true});

  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    addEventListener('load',()=>navigator.serviceWorker.register('/photobridge-sw-v710.js',{scope:'/'}).catch(()=>{}),{once:true});
  }

  paint();
  void detectInstalled();
  console.info('[PhotoBridge] v710 unified React-owned mobile header/PWA state active');
})();
