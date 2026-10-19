const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pb1316-')),dir=path.join(tmp,'dist/web');
fs.mkdirSync(dir,{recursive:true});
const files=[
 'photobridge-r1126-desktop-navigation.js','photobridge-r1126-desktop-navigation.css',
 'photobridge-r1310-layout.js','photobridge-r1310-layout.css',
 'photobridge-ui-fixes-v765.js',
 'photobridge-v904r100f37-store-header-core.js',
 'photobridge-v904r100f38-header-route-isolation.js',
 'photobridge-v904r100f39-print-actions-cleanup.js',
 ...['v813-finance-parity','v814-finance-store-print-polish','v815-print-finance-tabs','v816-print-finance-unify','v817-print-header-stability','v818-print-finance-composer-fix','v821-store-print-finance-fix','v822-direct-ui-fix'].map(n=>'photobridge-'+n+'.js')
];
for(const f of files)fs.copyFileSync(path.join('dist/web',f),path.join(dir,f));
fs.writeFileSync(path.join(dir,'index.html'),'<head><script src="/photobridge-r1126-desktop-navigation.js?v=test"></script><link rel="stylesheet" href="/photobridge-r1126-desktop-navigation.css?v=test"></head>');
function stage(s){execFileSync(process.execPath,[path.resolve('scripts/enable-'+s+'.mjs')],{cwd:tmp,stdio:'pipe'});}
async function main(){
 try{
  for(const s of ['r1307-desktop-print-controls','r1308-finance-and-entry','r1309-single-desktop-header','r1310-gallery-mobile-layout','r1311-panel-session-refresh','r1314-print-workspace','r1315-print-scroll-and-lab-header','r1316-atomic-print-scroll'])stage(s);
  const nav=fs.readFileSync(path.join(dir,files[0]),'utf8');
  const css=fs.readFileSync(path.join(dir,files[1]),'utf8');
  const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  execFileSync(process.execPath,['--check',path.join(dir,files[0])],{stdio:'pipe'});
  assert(nav.includes("addEventListener('wheel',pb1316Wheel,{capture:true,passive:true})"));
  assert(nav.includes("!nativeModes||!clonedModes"),'blank secondary bar never shown before both controls');
  assert(nav.includes("row.hidden=choosing||waiting"),'readiness governs the entire row');
  assert(css.includes('/* PB1316 print scroll + atomic header */'));
  assert(css.includes('grid-template-rows:72px!important'),'pending row collapses its background too');
  assert(css.includes('.ordersWorkspace.liveCustomerOrders'),'order cards unclipped');
  assert(css.includes('.albumOrderWorkspace'),'album cards unclipped');
  assert(html.includes('printAtomic=r1316'),'production asset URLs changed');
  const snapshot=[nav,css,html];
  stage('r1316-atomic-print-scroll');
  assert.deepEqual([fs.readFileSync(path.join(dir,files[0]),'utf8'),fs.readFileSync(path.join(dir,files[1]),'utf8'),fs.readFileSync(path.join(dir,'index.html'),'utf8')],snapshot,'repeat build is idempotent');
  console.log('PASS R1316 syntax, atomic row, order+album card CSS, cache versions and idempotence');
  // This wheel behavior test runs in every production build, without JSDOM.
  const from=nav.indexOf("  const pb1316Wheel=e=>{"),to=nav.indexOf("  addEventListener('wheel',pb1316Wheel",from);
  assert(from>=0&&to>from,'embedded wheel handler must be emitted');
  const handlerSource=nav.slice(from,to);
  let frame=null;
  const sc={clientHeight:420,scrollHeight:1400,scrollTop:0,isConnected:true,contains:()=>true};
  const root={querySelector:()=>sc,contains:()=>true};
  const card={nodeType:1,parentElement:sc,closest:()=>null};
  sc.parentElement=root;
  const handler=new Function('document','matchMedia','requestAnimationFrame',handlerSource+'\nreturn pb1316Wheel;')(
   {querySelector:()=>root},()=>({matches:true}),fn=>{frame=fn;}
  );
  handler({deltaY:160,deltaMode:0,ctrlKey:false,shiftKey:false,target:card});
  assert(typeof frame==='function','a failed native wheel schedules a non-intercepting fallback');
  frame();assert.equal(sc.scrollTop,160,'wheel fallback moves the order-card scroll container');
  handler({deltaY:120,deltaMode:0,ctrlKey:false,shiftKey:false,target:card});
  sc.scrollTop=210;frame();assert.equal(sc.scrollTop,210,'native scrolling is never doubled');
  handler({deltaY:180,deltaMode:0,ctrlKey:true,shiftKey:false,target:card});
  assert.equal(sc.scrollTop,210,'browser zoom gestures are not intercepted');
  console.log('PASS wheel fallback scrolls blocked cards without double-scrolling working native wheels');


  let JSDOM;
  try{({JSDOM}=require(process.env.PB_JSDOM_PATH||'jsdom'));}
  catch(e){if(e.code==='MODULE_NOT_FOUND'){console.log('SKIP JSDOM interactions: not installed in build environment');return;}throw e;}
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const parent=new JSDOM('<body class="pbAuthenticatedPhotographerPortal"><div id="root"><header id="photographerRoleHeaderV710"><div class="photographerHeaderIdentity"><h1>عکاسی</h1></div></header></div></body>',{url:'https://photobridge.ir/photographer/gallery',runScripts:'outside-only',pretendToBeVisual:true});
  try{
   const w=parent.window;w.matchMedia=()=>({matches:true});w.fetch=async()=>({ok:false});w.requestIdleCallback=()=>0;
   w.eval(nav);await sleep(40);
   w.document.querySelector('[data-pb1126-kind="print"]').click();
   const panel=w.document.querySelector('[data-panel="print"]'),frame=panel.querySelector('iframe'),doc=frame.contentDocument;
   doc.body.innerHTML='<header id="photographerRoleHeaderV710"><div class="photographerHeaderIdentity"><h1>عکاسی</h1></div></header><nav class="photographerPrintModeNav"><button class="photographerPrintPhotoTab">چاپ عکس</button></nav><main class="photographerMain photographerPrintWorkspace"><section class="photographerRolePageScrollArea"><div class="ordersWorkspace liveCustomerOrders"><article>کارت سفارش</article></div></section></main>';
   w.dispatchEvent(new w.CustomEvent('photobridge-panel-ready',{detail:{frame}}));await sleep(40);
   const row=w.document.querySelector('.pb1126Secondary');
   assert(row.hidden,'partial Print controls cannot show an empty row');
   assert(w.document.documentElement.classList.contains('pb1316PrintRowPending'));
   doc.querySelector('.photographerPrintModeNav').insertAdjacentHTML('beforeend','<button class="photographerPrintAlbumTab">آلبوم</button>');
   w.dispatchEvent(new w.Event('photobridge-desktop-identity-ready'));await sleep(40);
   assert(!row.hidden,'photo+album buttons show together');
   assert(!w.document.documentElement.classList.contains('pb1316PrintRowPending'));
   assert.equal(row.querySelectorAll('.pb1127PrintModes>button').length,2);
   doc.documentElement.classList.add('pbR100F37LabEnterBoot');await sleep(30);
   assert(w.document.documentElement.classList.contains('pb1315PanelChanging'),'lab transition shields secondary bar');
   doc.documentElement.classList.remove('pbR100F37LabEnterBoot');await sleep(30);
   assert(!w.document.documentElement.classList.contains('pb1315PanelChanging'));
   console.log('PASS two controls render as one and lab-entry header stays hidden throughout transition');
  }finally{parent.window.close();}
  const child=new JSDOM('<body><div id="root"><main class="photographerMain photographerPrintWorkspace"><section class="photographerRolePageScrollArea"><div class="ordersWorkspace liveCustomerOrders"><article id="card">کارت سفارش چاپ</article></div></section></main></div></body>',{url:'https://photobridge.ir/photographer/orders/flow?pbDesktopContent=1',runScripts:'outside-only',pretendToBeVisual:true});
  try{
   const w=child.window;w.matchMedia=()=>({matches:true});
   const sc=w.document.querySelector('.photographerRolePageScrollArea');
   Object.defineProperty(sc,'scrollHeight',{value:1400,configurable:true});
   Object.defineProperty(sc,'clientHeight',{value:420,configurable:true});
   const card=w.document.getElementById('card');
   w.eval(nav);
   card.dispatchEvent(new w.WheelEvent('wheel',{bubbles:true,deltaY:180}));
   await sleep(45);
   assert.equal(sc.scrollTop,180,'wheel fallback moves real Print cards when default wheel did not scroll');
   console.log('PASS blocked wheel routes into the Print order-card scroller');
  }finally{child.window.close();}
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1;fs.rmSync(tmp,{recursive:true,force:true});});