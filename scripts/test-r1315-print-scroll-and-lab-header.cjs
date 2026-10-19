const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pb1315-'));
const dir=path.join(temp,'dist/web');
fs.mkdirSync(dir,{recursive:true});
const files=['photobridge-r1126-desktop-navigation.js','photobridge-r1126-desktop-navigation.css','photobridge-r1310-layout.js','photobridge-r1310-layout.css','photobridge-ui-fixes-v765.js','photobridge-v904r100f37-store-header-core.js','photobridge-v904r100f38-header-route-isolation.js','photobridge-v904r100f39-print-actions-cleanup.js',...['v813-finance-parity','v814-finance-store-print-polish','v815-print-finance-tabs','v816-finance-unify','v817-print-header-stability','v818-print-finance-composer-fix','v821-store-print-finance-fix','v822-direct-ui-fix'].map(n=>'photobridge-'+n+'.js')];
files[files.indexOf('photobridge-v816-finance-unify.js')]='photobridge-v816-finance-unify.js'; // retained for explicit file list
// The legacy actual asset has "print" in its name.
files[files.indexOf('photobridge-v816-finance-unify.js')]='photobridge-v816-print-finance-unify.js';
for(const name of files)fs.copyFileSync(path.join('dist/web',name),path.join(dir,name));
fs.writeFileSync(path.join(dir,'index.html'),'<head><link href="/photobridge-r1126-desktop-navigation.css?v=1"><script src="/photobridge-r1126-desktop-navigation.js?v=1"></script><script src="/photobridge-ui-fixes-v765.js?v=1"></script></head>');
function patch(name){execFileSync(process.execPath,[path.resolve('scripts/enable-'+name+'.mjs')],{cwd:temp,stdio:'pipe'});}
try{
 for(const stage of ['r1307-desktop-print-controls','r1308-finance-and-entry','r1309-single-desktop-header','r1310-gallery-mobile-layout','r1311-panel-session-refresh','r1314-print-workspace','r1315-print-scroll-and-lab-header'])patch(stage);
 const nav=fs.readFileSync(path.join(dir,files[0]),'utf8');
 const css=fs.readFileSync(path.join(dir,files[1]),'utf8');
 const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 assert(nav.includes('/* PB1315 stable laboratory transition */'));
 assert(nav.includes('pb1315Documents=new WeakSet()'));
 assert(nav.includes("attributeFilter:['class']"),'no costly frame subtree observer');
 assert(nav.includes("doc.documentElement.classList.contains('pbR100F37LabEnterBoot')"),'wait for lab transition');
 assert(nav.includes("doc.defaultView.addEventListener('beforeunload'"),'shield navigation');
 assert(nav.includes("pb1315Watch(panel);schedule();break;"),'early R1314 readiness must not bypass transition');
 assert(css.includes('/* PB1315 native header and inner scroll */'));
 assert(css.includes('html.pb1126Embedded body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea.photographerRolePageScrollArea'));
 assert(css.includes('overflow-y:auto!important'),'embedded Print/Album local scroll');
 assert(css.includes('#pbF37PhotographerHeader'),'native duplicate header hidden');
 assert(html.includes('printStable=r1315'),'new assets cache-busted');
 for(const name of [...files.slice(4,8)]){
  const s=fs.readFileSync(path.join(dir,name),'utf8');
  assert(s.includes('/* PB1315 embedded print viewport */'),name+' must override stale inline-important header offsets');
  execFileSync(process.execPath,['--check',path.join(dir,name)],{stdio:'pipe'});
 }
 execFileSync(process.execPath,['--check',path.join(dir,files[0])],{stdio:'pipe'});
 const snapshot=[...files.slice(0,8),'index.html'].map(n=>fs.readFileSync(path.join(dir,n),'utf8'));
 patch('r1315-print-scroll-and-lab-header');
 assert.deepEqual([...files.slice(0,8),'index.html'].map(n=>fs.readFileSync(path.join(dir,n),'utf8')),snapshot,'stage is byte-identical when repeated');
 console.log('PASS R1315 syntax, all four viewport corrections, CSS, header guards, cache refresh and idempotence');
 let JSDOM;try{({JSDOM}=require(process.env.PB_JSDOM_PATH||'jsdom'));}catch(e){if(e.code==='MODULE_NOT_FOUND'){console.log('SKIP runtime JSDOM not bundled in production build');fs.rmSync(temp,{recursive:true,force:true});return;}throw e;}
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 (async()=>{
  const dom=new JSDOM('<body class="pbAuthenticatedPhotographerPortal"><div id="root"><header id="photographerRoleHeaderV710"><div class="photographerHeaderIdentity"><h1>عکاسی</h1></div></header></div></body>',{url:'https://photobridge.ir/photographer/gallery',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;w.matchMedia=()=>({matches:true});w.fetch=async()=>({ok:false});w.requestIdleCallback=()=>0;w.eval(nav);
  await sleep(40);
  w.document.querySelector('[data-pb1126-kind="print"]').click();
  const panel=w.document.querySelector('[data-panel="print"]'),frame=panel.querySelector('iframe');
  const doc=frame.contentDocument;doc.body.innerHTML='<nav class="photographerPrintModeNav"><button>عکس</button><button>آلبوم</button></nav><main class="photographerMain photographerPrintWorkspace"><section class="photographerRolePageScrollArea"><article>کارت چاپ</article></section></main>';
  w.dispatchEvent(new w.CustomEvent('photobridge-panel-ready',{detail:{frame}}));
  await sleep(30);
  assert(panel.querySelector('.pb1126Loading').hidden,'ready print cards remove loader');
  doc.documentElement.classList.add('pbR100F37LabEnterBoot');
  await sleep(30);
  assert(!panel.querySelector('.pb1126Loading').hidden,'lab entry must shield intermediate header');
  assert(w.document.documentElement.classList.contains('pb1315PanelChanging'));
  doc.documentElement.classList.remove('pbR100F37LabEnterBoot');
  await sleep(35);
  assert(panel.querySelector('.pb1126Loading').hidden,'lab settled only after transition boot ends');
  assert(!w.document.documentElement.classList.contains('pb1315PanelChanging'));
  w.document.body.classList.remove('pbAuthenticatedPhotographerPortal');
  w.dispatchEvent(new w.CustomEvent('photobridge-auth-session-changed',{detail:{labRole:''}}));
  assert.equal(w.document.querySelector('#pb1126ChromeHost'),null,'logout does not leave native or cloned second header');
  w.close();
  console.log('PASS lab entry shield, stable reveal, exact one-header logout');
 })().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>fs.rmSync(temp,{recursive:true,force:true}));
}catch(e){fs.rmSync(temp,{recursive:true,force:true});throw e;}