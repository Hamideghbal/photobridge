/* R2035: reveal only the real desktop destination; no artificial sleep. */
(()=>{
 'use strict';
 if(!matchMedia('(min-width:821px)').matches||!/^\/photographer(?:\/|$)/.test(location.pathname)||/^\/photographer\/(?:signup|register|invite)(?:\/|$)/.test(location.pathname))return;
 const html=document.documentElement,embedded=window!==window.top||new URLSearchParams(location.search).get('pbDesktopContent')==='1';
 const printPath=p=>/^\/photographer\/(?:orders|upload|album|archive|finance)(?:\/|$)/.test(p);
 const visible=el=>!!el&&!el.hidden&&el.getBoundingClientRect().height>0&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
 const chooser=()=>visible(document.querySelector('#pbR99LabChooser'));
 const nativePrint=()=>!!document.querySelector('#photographerRoleHeaderV710 .photographerPrintModeNav')&&!!document.querySelector('main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea');
 function clearLegacy(){
  if(!printPath(location.pathname)||chooser()||!nativePrint()||new URLSearchParams(location.search).get('pbLabChooser')==='1')return;
  html.classList.remove('pbR100F37LabEnterBoot','pbR100F14LabChooserBoot');
  try{sessionStorage.removeItem('photobridge:r100f37:lab-enter-pending')}catch{}
 }
 if(embedded){
  // The outer panel owns visibility. Do not wait for mobile's 5.2s fallback.
  const deadline=Date.now()+12000;
  const tick=()=>{clearLegacy();if(Date.now()<deadline&&(!nativePrint()||html.classList.contains('pbR100F37LabEnterBoot')))setTimeout(tick,60)};
  if(printPath(location.pathname))tick();
  return;
 }
 let pending=true,features=false,started=Date.now(),stable=0,scheduled=false,authShown=false,entryFailed=false;
 html.classList.add('pb2035EntryPending');
 const auth=()=>!!document.querySelector('#root .unifiedLoginPage,#root .passwordResetCard');
 function showGate(){
  if(!document.body)return null;
  let gate=document.getElementById('pb2035EntryOverlay');
  if(!gate){
   gate=document.createElement('div');gate.id='pb2035EntryOverlay';gate.setAttribute('role','status');
   gate.innerHTML='<span class="pb2035Spinner" aria-hidden="true"></span><span>در حال آماده‌سازی پنل عکاسی…</span>';
   document.body.append(gate);
  }
  return gate;
 }
 function release(){
  pending=false;stable=0;html.classList.remove('pb2035EntryPending');document.getElementById('pb2035EntryOverlay')?.remove();
 }
 function begin(keepFeatures=false){
  if(pending)return;
  pending=true;if(!keepFeatures)features=false;stable=0;entryFailed=false;started=Date.now();html.classList.add('pb2035EntryPending');schedule();
 }
 function fail(gate,retry){
  if(!gate||gate.dataset.pb2035Error)return;
  gate.dataset.pb2035Error='1';
  const msg=document.createElement('span');msg.textContent='آماده‌سازی صفحه بیش از حد طول کشید. اتصال را بررسی کنید.';
  const button=document.createElement('button');button.type='button';button.textContent='تلاش مجدد';button.onclick=retry;
  gate.replaceChildren(msg,button);
 }
 function ready(){
  const p=location.pathname.replace(/\/+$/,'');
  if(p==='/photographer'||p==='/photographer/login'||!features)return false;
  const header=document.querySelector('#pb1126DesktopHeader');
  if(!visible(header)||!header.querySelector('.pb1126MainNav>button.active'))return false;
  const panel=document.querySelector('.pb1126ContentPanel:not([hidden])');
  if(panel){
   if(panel.querySelector('.pb1126Loading:not([hidden])'))return false;
   const doc=panel.querySelector('iframe')?.contentDocument;
   if(!doc?.body)return false;
   if(panel.dataset.panel==='print')return !!doc.querySelector('#pbR99LabChooser')||(!!doc.querySelector('main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea')&&visible(header.querySelector('.pb1126Secondary')));
   return !!doc.body.childElementCount;
  }
  if(printPath(p)){
   if(chooser())return true;
   if(!nativePrint()||!visible(header.querySelector('.pb1126Secondary'))||!header.querySelector('.pb1127PrintModes'))return false;
  }
  return !!document.querySelector('#root main.photographerMain');
 }
 let watchedLoader=null,loaderStart=0,loaderFailed=false;
 function watchPanel(){
  const panel=document.querySelector('.pb1126ContentPanel[data-panel="print"]:not([hidden])'),loader=panel?.querySelector('.pb1126Loading:not([hidden])');
  if(!loader){watchedLoader=null;loaderStart=0;loaderFailed=false;return}
  if(loader!==watchedLoader){watchedLoader=loader;loaderStart=Date.now();loaderFailed=false;delete loader.dataset.pb2035Error;loader.textContent='در حال دریافت…'}
  if(!loaderFailed&&Date.now()-loaderStart>=12000){
   loaderFailed=true;
   fail(loader,()=>{
    const frame=panel.querySelector('iframe');delete loader.dataset.pb2035Error;loader.textContent='در حال دریافت…';loaderStart=Date.now();loaderFailed=false;
    try{frame.contentWindow.location.reload()}catch{frame.src=frame.src}
   });
  }
 }
 function sync(){
  scheduled=false;clearLegacy();watchPanel();
  if(auth()){
   authShown=true;if(pending)release();return;
  }
  if(authShown){authShown=false;begin(true)}
  if(!pending)return;
  const gate=showGate();
  if(ready()){
   if(++stable>=2){release();return}
   schedule();return;
  }
  stable=0;
  if(Date.now()-started>=12000&&!entryFailed){entryFailed=true;fail(gate,()=>location.reload())}
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(sync)}}
 addEventListener('photobridge-navigation-tabs',()=>{features=true;schedule()});
 addEventListener('photobridge-auth-session-changed',event=>{
  if(event.detail?.labRole==='customer'&&(authShown||auth()||location.pathname==='/photographer')){
   features=false;if(!auth()){authShown=false;begin()}
  }
  schedule();
 });
 addEventListener('popstate',schedule);
 const boot=()=>{
  showGate();new MutationObserver(()=>{if(pending||authShown||watchedLoader||auth()||html.classList.contains('pbR100F37LabEnterBoot')||document.querySelector('.pb1126ContentPanel[data-panel="print"]:not([hidden]) .pb1126Loading:not([hidden])'))schedule()}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
  schedule();
  // Only read geometry while waiting for first paint or a visible Print loader.
  setInterval(()=>{if(pending||watchedLoader)schedule()},150);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
