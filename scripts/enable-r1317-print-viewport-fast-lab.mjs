import fs from 'node:fs';
import path from 'node:path';

// R1317 is applied after R1316 in the Liara build.
const navFile='dist/web/photobridge-r1126-desktop-navigation.js';
let nav=fs.readFileSync(navFile,'utf8');
if(!nav.includes('/* PB1317 actual desktop header bottom */')){
 const anchor="  row.hidden=choosing||waiting;";
 if(nav.split(anchor).length!==2)throw Error('[R1317] Atomic Print header anchor changed');
 nav=nav.replace(anchor,anchor+[
  "",
  "  /* PB1317 actual desktop header bottom */",
  "  // The canonical header can grow beyond the old fixed 114px estimate.",
  "  if(active==='print'&&printPanel&&!printPanel.hidden){",
  "   requestAnimationFrame(()=>{",
  "    if(selected!=='print'||printPanel.hidden||!printPanel.isConnected||!chrome?.isConnected)return;",
  "    const edge=Math.ceil(chrome.getBoundingClientRect().bottom);",
  "    if(edge>=60&&edge<innerHeight-64){",
  "     const next=edge+'px';",
  "     if(printPanel.style.getPropertyValue('top')!==next)printPanel.style.setProperty('top',next,'important');",
  "    }",
  "   });",
  "  }"
 ].join('\n'));
 fs.writeFileSync(navFile,nav);
}
const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* PB1317 first card below header */')){
 css+=[
  "",
  "/* PB1317 first card below header */",
  "@media(min-width:821px){",
  " html.pb1126Embedded body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea.photographerRolePageScrollArea{",
  "  padding-top:16px!important;scroll-padding-top:16px!important;box-sizing:border-box!important",
  " }",
  " html.pb1126Embedded body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea .ordersWorkspace.liveCustomerOrders,",
  " html.pb1126Embedded body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea .photographerAlbumListFlush{",
  "  scroll-margin-top:16px!important;margin-top:max(0px, var(--pb1317-first-card-margin, 0px))!important",
  " }",
  "}",
  "@media(max-width:820px){",
  " /* Fill the measured scrollport to the actual bottom navigation edge. */",
  " html.pb1310MobilePrint body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea.photographerRolePageScrollArea{",
  "  background:#f5f7fb!important;padding-bottom:0!important;box-sizing:border-box!important",
  " }",
  " html.pb1310MobilePrint body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea.photographerRolePageScrollArea>.ordersWorkspace.liveCustomerOrders,",
  " html.pb1310MobilePrint body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea.photographerRolePageScrollArea>.photographerAlbumListFlush,",
  " html.pb1310MobilePrint body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea.photographerRolePageScrollArea>.albumOrderWorkspace{",
  "  min-height:100%!important;height:auto!important;box-sizing:border-box!important;background:#f5f7fb!important",
  " }",
  "}",
  ""
 ].join('\n');
 fs.writeFileSync(cssFile,css);
}
const mobileFile='dist/web/photobridge-r1310-layout.js';
let mobile=fs.readFileSync(mobileFile,'utf8');
if(!mobile.includes('/* PB1317 mobile scroll insets */')){
 const anchor="Object.entries({position:'fixed',top:box.top+'px',bottom:box.bottom+'px'";
 if(mobile.split(anchor).length!==2)throw Error('[R1317] R1310 mobile viewport application changed');
 mobile=mobile.replace(anchor,"Object.entries({position:'fixed',/* PB1317 mobile scroll insets */inset:box.top+'px 0px '+box.bottom+'px 0px',top:box.top+'px',bottom:box.bottom+'px'");
 fs.writeFileSync(mobileFile,mobile);
}
// R100F37/38/39 previously waited for a 15s periodic tick to settle Lab.
const names=new Set(['photobridge-v904r100f37-store-header-core.js','photobridge-v904r100f38-header-route-isolation.js','photobridge-v904r100f39-print-actions-cleanup.js']);
let settledFiles=0;
function speed(dir){
 if(!fs.existsSync(dir))return;
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,item.name);
  if(item.isDirectory()){speed(file);continue;}
  if(!names.has(item.name))continue;
  let src=fs.readFileSync(file,'utf8');
  if(src.includes('/* PB1317 event-driven lab ready */'))continue;
  const oldObserve="new MutationObserver(()=>schedule(70)).observe(root";
  const oldTick="setInterval(()=>{clockBadge();settleBoot()},15000);";
  const oldDelay="},320)}";
  if(!src.includes(oldObserve)||!src.includes(oldTick)||!src.includes(oldDelay))continue;
  if(src.split(oldObserve).length!==2||src.split(oldTick).length!==2||src.split(oldDelay).length!==2)
   throw Error('[R1317] Ambiguous lab observer '+file);
  src=src.replace(oldObserve,"/* PB1317 event-driven lab ready */new MutationObserver(()=>{schedule(70);settleBoot()}).observe(root");
  src=src.replace(oldTick,"setInterval(clockBadge,15000);");
  src=src.replace(oldDelay,"},120)}");
  fs.writeFileSync(file,src);settledFiles++;
 }
}
speed('dist/web');speed('dist/api');
if(!fs.readFileSync('dist/web/photobridge-v904r100f39-print-actions-cleanup.js','utf8').includes('/* PB1317 event-driven lab ready */'))
 throw Error('[R1317] Primary lab synchronizer missing');
function refresh(dir){
 if(!fs.existsSync(dir))return;
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,item.name);
  if(item.isDirectory())refresh(file);
  else if(item.name.endsWith('.html')){
   const html=fs.readFileSync(file,'utf8');
   const next=html.replace(/(photobridge-(?:r1126-desktop-navigation\.(?:js|css)|r1310-layout\.js|v904r100f3[789]-[^"'<>\s?]+\.js))([^"'<>\s]*)/g,(_,asset,q)=>{
    const clean=q.replace(/([?&])printViewport=[^&]*/g,'$1').replace(/[?&]$/,'');
    return asset+clean+(clean.includes('?')?'&':'?')+'printViewport=r1317';
   });
   if(next!==html)fs.writeFileSync(file,next);
  }
 }
}
refresh('dist/web');refresh('dist/api');
console.log('[PhotoBridge R1317] measured header, mobile scrollport and '+settledFiles+' fast lab-entry modules.');