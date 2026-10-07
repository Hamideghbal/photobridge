/* PhotoBridge v709 — PWA state only; zero React DOM structure mutation. */
(()=>{
  'use strict';
  if(window.__PB709_RUNTIME__)return;
  window.__PB709_RUNTIME__=true;
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
    root.classList.toggle('pb709Installed',!!installed);
    root.classList.toggle('pb709InstallReady',!installed&&(isiOS()||!!promptEvent));
  }

  async function detectInstalled(){
    if(installed||standalone()){installed=true;writeMarker(true);paint();return true}
    try{
      if(typeof navigator.getInstalledRelatedApps==='function'){
        const apps=await navigator.getInstalledRelatedApps();
        if(Array.isArray(apps)&&apps.length){installed=true;writeMarker(true);paint();return true}
      }
    }catch{}
    paint();return false;
  }

  function iosHelp(){
    alert('برای نصب PhotoBridge در iPhone/iPad: در Safari دکمه Share را بزنید، سپس Add to Home Screen را انتخاب کنید.');
  }

  window.PB709InstallApp=async()=>{
    if(await detectInstalled())return;
    if(isiOS()){iosHelp();return}
    const p=promptEvent||window.__PB_INSTALL_PROMPT__||null;
    if(!p)return;
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
    // Chromium won't normally emit this for an installed PWA. If it does, re-check first.
    promptEvent=e;window.__PB_INSTALL_PROMPT__=e;
    detectInstalled().then(()=>{if(!installed)paint()});
  });
  addEventListener('appinstalled',()=>{installed=true;writeMarker(true);promptEvent=null;window.__PB_INSTALL_PROMPT__=null;paint()});
  addEventListener('pageshow',()=>{if(standalone()){installed=true;writeMarker(true)};detectInstalled()},{passive:true});

  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    addEventListener('load',()=>navigator.serviceWorker.register('/photobridge-sw-v709.js',{scope:'/'}).catch(()=>{}),{once:true});
  }
  detectInstalled();
  console.info('[PhotoBridge] v709 React-owned mobile header/PWA state active');
})();
