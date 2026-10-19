const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pb1317-')),dir=path.join(tmp,'dist/web');
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
fs.writeFileSync(path.join(dir,'index.html'),'<head><script src="/photobridge-r1126-desktop-navigation.js?v=test"></script><script src="/photobridge-r1310-layout.js?v=test"></script><script src="/photobridge-v904r100f39-print-actions-cleanup.js?v=test"></script><link rel="stylesheet" href="/photobridge-r1126-desktop-navigation.css?v=test"></head>');
const step=s=>execFileSync(process.execPath,[path.resolve('scripts/enable-'+s+'.mjs')],{cwd:tmp,stdio:'pipe'});
const read=p=>fs.readFileSync(path.join(dir,p),'utf8');
async function main(){
 try{
  for(const s of ['r1307-desktop-print-controls','r1308-finance-and-entry','r1309-single-desktop-header','r1310-gallery-mobile-layout','r1311-panel-session-refresh','r1314-print-workspace','r1315-print-scroll-and-lab-header','r1316-atomic-print-scroll','r1317-print-viewport-fast-lab'])step(s);
  const nav=read(files[0]),css=read(files[1]),mobile=read(files[2]),html=read('index.html');
  for(const p of [files[0],files[2],files[5],files[6],files[7]])execFileSync(process.execPath,['--check',path.join(dir,p)],{stdio:'pipe'});
  assert(nav.includes('/* PB1317 actual desktop header bottom */'));
  assert(nav.includes("chrome.getBoundingClientRect().bottom"),'panel top uses real header bottom');
  assert(nav.includes("printPanel.style.setProperty('top',next,'important')"),'frame cannot hide first card beneath parent header');
  assert(css.includes('/* PB1317 first card below header */'));
  assert(css.includes('padding-top:16px!important;scroll-padding-top:16px!important'),'the first card has a visible top inset');
  assert(css.includes('>.ordersWorkspace.liveCustomerOrders'),'mobile order list fills the viewport');
  assert(css.includes('>.photographerAlbumListFlush'),'mobile album list fills the viewport');
  assert(mobile.includes('/* PB1317 mobile scroll insets */'));
  assert(mobile.includes("inset:box.top+'px 0px '+box.bottom+'px 0px'"),'mobile bottom must follow measured dock not 78px');
  for(const name of files.slice(5,8)){
   const src=read(name);
   assert(src.includes('/* PB1317 event-driven lab ready */'),name+' subscribes to content readiness');
   assert(src.includes('new MutationObserver(()=>{schedule(70);settleBoot()})'),name+' settles without 15s polling');
   assert(src.includes('setInterval(clockBadge,15000);'),name+' retains date updates independently');
   assert(!src.includes('clockBadge();settleBoot()'),name+' does not wait for the next periodic clock tick');
   assert(src.includes('},120)}'),name+' uses a short content stabilization period');
  }
  assert(html.includes('printViewport=r1317'),'all new assets have fresh URLs');
  const snapshot=[...files.slice(0,8),'index.html'].map(read);
  step('r1317-print-viewport-fast-lab');
  assert.deepEqual([...files.slice(0,8),'index.html'].map(read),snapshot,'R1317 must be idempotent');
  console.log('PASS R1317 build, responsive scroll insets, measured header, fast lab-ready state and idempotence');

  let JSDOM;try{({JSDOM}=require(process.env.PB_JSDOM_PATH||'jsdom'));}
  catch(e){if(e.code==='MODULE_NOT_FOUND'){console.log('SKIP JSDOM interaction test; not in production dependencies');return;}throw e;}
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const d=new JSDOM('<body class="pbAuthenticatedPhotographerPortal"><div id="root"><header id="photographerRoleHeaderV710"><div class="photographerHeaderIdentity"><h1>عکاسی</h1></div></header></div></body>',{url:'https://photobridge.ir/photographer/gallery',runScripts:'outside-only',pretendToBeVisual:true});
  try{
   const w=d.window;w.matchMedia=()=>({matches:true});w.fetch=async()=>({ok:false});w.requestIdleCallback=()=>0;
   w.eval(nav);await sleep(45);
   const header=w.document.querySelector('#pb1126DesktopHeader');
   header.getBoundingClientRect=()=>({top:0,bottom:138,left:0,right:1250,width:1250,height:138});
   w.document.querySelector('[data-pb1126-kind="print"]').click();await sleep(45);
   const panel=w.document.querySelector('[data-panel="print"]');
   assert(panel,'Print iframe exists');
   assert.equal(panel.style.top,'138px','Print cards must start below actual 138px header');
   header.getBoundingClientRect=()=>({top:0,bottom:114,left:0,right:1250,width:1250,height:114});
   w.dispatchEvent(new w.Event('resize'));await sleep(45);
   assert.equal(panel.style.top,'114px','Print panel adjusts on header geometry changes');
   console.log('PASS measured-header Print panel follows actual 138px then 114px boundaries');
  }finally{d.window.close();}
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1;fs.rmSync(tmp,{recursive:true,force:true});});