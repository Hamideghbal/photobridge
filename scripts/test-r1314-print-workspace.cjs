const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pb1314-'));
const dist=path.join(temp,'dist/web');
fs.mkdirSync(dist,{recursive:true});
const files=['photobridge-r1126-desktop-navigation.js','photobridge-r1126-desktop-navigation.css','photobridge-r1310-layout.js','photobridge-r1310-layout.css','photobridge-ui-fixes-v765.js','photobridge-v904r100f37-store-header-core.js','photobridge-v904r100f38-header-route-isolation.js','photobridge-v904r100f39-print-actions-cleanup.js',...['v813-finance-parity','v814-finance-store-print-polish','v815-print-finance-tabs','v816-print-finance-unify','v817-print-header-stability','v818-print-finance-composer-fix','v821-store-print-finance-fix','v822-direct-ui-fix'].map(n=>'photobridge-'+n+'.js')];
for(const file of files)fs.copyFileSync(path.join('dist/web',file),path.join(dist,file));
fs.writeFileSync(path.join(dist,'index.html'),'<head><link href="/photobridge-r1126-desktop-navigation.css?v=test"><script defer src="/photobridge-r1126-desktop-navigation.js?v=test"></script></head>');
function patch(stage){execFileSync(process.execPath,[path.resolve('scripts/enable-'+stage+'.mjs')],{cwd:temp,stdio:'pipe'});}
try{
 for(const stage of ['r1307-desktop-print-controls','r1308-finance-and-entry','r1309-single-desktop-header','r1310-gallery-mobile-layout','r1311-panel-session-refresh','r1314-print-workspace'])patch(stage);
 const nav=fs.readFileSync(path.join(dist,files[0]),'utf8');
 const css=fs.readFileSync(path.join(dist,files[1]),'utf8');
 const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
 assert(nav.includes('/* PB1314 print workspace */'));
 assert(nav.includes("if(!panelSessionReady){chrome?.parentElement.remove()"),'login never renders old desktop chrome');
 assert(nav.includes("clearPanelDocuments();chrome?.parentElement.remove()"),'logout removes header immediately');
 assert(nav.includes("key==='print'?openPrintChooser(doc):openStoreChooser(doc)"),'Print and Store reset to chooser');
 assert(nav.includes("frame.addEventListener('load',goToChooser,{once:true})"),'initial load retries chooser');
 assert(nav.includes("window.addEventListener('photobridge-panel-ready'"),'early content-ready event');
 assert(css.includes('/* PB1314 print workspace layout */'));
 assert(css.includes('overflow-y:auto!important;overscroll-behavior-y:contain!important'),'embedded print can scroll');
 assert(css.includes('min-height:100%!important;max-height:none!important'),'photo/album card regions grow naturally');
 assert(html.includes('printWorkspace=r1314'),'JS and CSS cache refreshed');
 execFileSync(process.execPath,['--check',path.join(dist,files[0])]);
 const snapshot=[nav,css,html];patch('r1314-print-workspace');
 assert.deepEqual([fs.readFileSync(path.join(dist,files[0]),'utf8'),fs.readFileSync(path.join(dist,files[1]),'utf8'),fs.readFileSync(path.join(dist,'index.html'),'utf8')],snapshot,'build patch idempotent');
 console.log('PASS R1314 anchors, scroll/viewport selectors, cache refresh, JavaScript syntax, idempotence');
 try{
  const {JSDOM}=require(process.env.PB_JSDOM_PATH||'jsdom');
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  (async()=>{
   const d=new JSDOM('<body class="pbAuthenticatedPhotographerPortal"><div id="root"><header id="photographerRoleHeaderV710"><div class="photographerHeaderIdentity"><h1>عکاسی</h1></div></header></div></body>',{url:'https://photobridge.ir/photographer/gallery',runScripts:'outside-only',pretendToBeVisual:true});
   const w=d.window;w.matchMedia=()=>({matches:true});w.fetch=async()=>({ok:false});w.requestIdleCallback=()=>0;
   w.eval(nav);await sleep(50);
   assert(w.document.querySelector('#pb1126ChromeHost'),'authenticated header rendered');
   w.document.querySelector('[data-pb1126-kind="print"]').click();
   const panel=w.document.querySelector('[data-panel="print"]'),frame=panel.querySelector('iframe');
   assert(frame.src.includes('pbLabChooser=1'),'new Print panel starts at chooser');
   // Real React content triggers DOM-ready event before slow images finish.
   frame.contentDocument.body.innerHTML='<nav class="photographerPrintModeNav"><button>عکس</button></nav>';
   w.dispatchEvent(new w.CustomEvent('photobridge-panel-ready',{detail:{frame}}));
   await sleep(30);
   assert(panel.querySelector('.pb1126Loading').hidden,'early readiness removes the loading overlay');
   w.document.querySelector('[data-pb1126-kind="print"]').click();
   assert(frame.contentWindow.location.search.includes('pbLabChooser=1'),'repeated Print enters chooser');
   w.document.body.classList.remove('pbAuthenticatedPhotographerPortal');
   w.dispatchEvent(new w.CustomEvent('photobridge-auth-session-changed',{detail:{labRole:''}}));
   assert.equal(w.document.querySelector('#pb1126ChromeHost'),null,'logout immediately removes stale header');
   assert.equal(w.document.querySelectorAll('.pb1126ContentPanel').length,0,'logout clears stale panels');
   await sleep(35);
   assert.equal(w.document.querySelector('#pb1126ChromeHost'),null,'stale React header never regenerates chrome');
   w.close();console.log('PASS Print chooser, early loading release, logout/session isolation');
  })().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>fs.rmSync(temp,{recursive:true,force:true}));
 }catch(err){
  if(err?.code!=='MODULE_NOT_FOUND')throw err;
  console.log('SKIP JSDOM browser harness not available; static/Node checks passed');
  fs.rmSync(temp,{recursive:true,force:true});
 }
}catch(error){fs.rmSync(temp,{recursive:true,force:true});throw error;}