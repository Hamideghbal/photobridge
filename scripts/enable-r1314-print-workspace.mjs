import fs from 'node:fs';
import path from 'node:path';

// Apply after R1311. Deliberately do not enable R1312.
const file='dist/web/photobridge-r1126-desktop-navigation.js';
let nav=fs.readFileSync(file,'utf8');
if(!nav.includes('/* PB1314 print workspace */')){
 const replace=(before,after)=>{
  if(nav.split(before).length!==2)throw Error('[R1314] Missing or ambiguous anchor: '+before.slice(0,100));
  nav=nav.replace(before,after);
 };
 // Child frame signals once a real Print chooser/workspace exists, before image load.
 const embedded=[
  " if(query.get('pbDesktopContent')==='1'){",
  "  /* PB1314 print workspace */",
  "  let pb1314ReadySent=false,pb1314Observer=null;",
  "  const pb1314Signal=()=>{",
  "   if(pb1314ReadySent||!document.querySelector('#pbR99LabChooser,.photographerPrintModeNav,#photographerStoreRoleHeader,.pbR96StoreChooser'))return;",
  "   pb1314ReadySent=true;pb1314Observer?.disconnect();",
  "   try{if(parent!==window)parent.dispatchEvent(new parent.CustomEvent('photobridge-panel-ready',{detail:{frame:window.frameElement}}));}catch{}",
  "  };",
  "  const pb1314Watch=()=>{if(!document.body)return;pb1314Observer=new MutationObserver(pb1314Signal);pb1314Observer.observe(document.body,{subtree:true,childList:true});pb1314Signal();};",
  "  if(query.get('pbUtilityWindow')!=='1'&&/^\/(?:photographer\/orders|equipment-rental\/book)/.test(location.pathname)){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pb1314Watch,{once:true});else queueMicrotask(pb1314Watch);}"
 ].join('\n');
 replace(" if(query.get('pbDesktopContent')==='1'){",embedded);
 // R1311 owns document lifetime. Suppress chrome unless session is ready.
 replace(" document.documentElement.classList.add('pb1126Desktop');\n const tabs=",
         " if(document.body?.classList.contains('pbAuthenticatedPhotographerPortal'))document.documentElement.classList.add('pb1126Desktop');\n const tabs=");
 replace("  scheduled=false;if(!document.body)return;",
         "  scheduled=false;if(!document.body)return;\n  if(!panelSessionReady){chrome?.parentElement.remove();chrome=null;document.documentElement.classList.remove('pb1126Desktop','pb1127Choosing','pb1310GalleryHome');return;}\n  document.documentElement.classList.add('pb1126Desktop');");
 replace("panelSessionReady=false;pendingPanel=null;authenticated=false;clearPanelDocuments();walletBalance=null;",
         "panelSessionReady=false;pendingPanel=null;authenticated=false;clearPanelDocuments();chrome?.parentElement.remove();chrome=null;document.documentElement.classList.remove('pb1126Desktop','pb1127Choosing','pb1310GalleryHome');walletBalance=null;");
 const readiness=[
  " window.addEventListener('photobridge-panel-ready',event=>{",
  "  if(!panelSessionReady)return;",
  "  for(const panel of panels.values()){",
  "   const frame=panel.querySelector('iframe');",
  "   if(frame!==event.detail?.frame)continue;",
  "   if(!frame.contentDocument?.querySelector('#pbR99LabChooser,.photographerPrintModeNav,#photographerStoreRoleHeader,.pbR96StoreChooser'))return;",
  "   const loading=panel.querySelector('.pb1126Loading');if(loading)loading.hidden=true;",
  "   schedule();break;",
  "  }",
  " });",
  " window.addEventListener('photobridge-desktop-identity-ready',schedule);"
 ].join('\n');
 replace(" window.addEventListener('photobridge-desktop-identity-ready',schedule);",readiness);
 // Reset the chosen mode on EVERY Print/Store tab click while retaining cache.
 const begin=nav.indexOf(' function navigate(key){');
 const finish=nav.indexOf('  closePanels();const tab=tabs.find',begin);
 if(begin<0||finish<begin)throw Error('[R1314] Missing desktop navigate anchors');
 const navigate=[
 " function openPrintChooser(doc){",
 "  if(doc?.querySelector('#pbR99LabChooser'))return true;",
 "  if(!doc?.defaultView||!doc.querySelector('.photographerPrintModeNav'))return false;",
 "  const w=doc.defaultView,url=new URL('/photographer/orders/flow',location.origin);",
 "  url.searchParams.set('workspace','print');url.searchParams.set('pbLabChooser','1');url.searchParams.set('pbDesktopContent','1');",
 "  w.history.pushState(null,'',url);w.dispatchEvent(new w.PopStateEvent('popstate'));return true;",
 " }",
 " function navigate(key){",
 "  if(key==='print'||key==='store'){",
 "   open(key);const panel=panels.get(key),frame=panel?.querySelector('iframe');if(!frame)return;",
 "   let complete=false;",
 "   const goToChooser=()=>{",
 "    if(complete||!frame.isConnected||panel.hidden||selected!==key)return;",
 "    const doc=frame.contentDocument;",
 "    if(!doc?.body||frame.contentWindow?.location.href==='about:blank')return;",
 "    complete=key==='print'?openPrintChooser(doc):openStoreChooser(doc);",
 "    if(complete)schedule();",
 "   };",
 "   goToChooser();",
 "   if(!complete)frame.addEventListener('load',goToChooser,{once:true});",
 "   return;",
 "  }",
 ""].join('\n');
 nav=nav.slice(0,begin)+navigate+nav.slice(finish);
 replace(" function openStoreChooser(doc){const button=doc?.querySelector('[data-store-home]');if(!button)return false;button.click();return true;}",
         " function openStoreChooser(doc){if(doc?.body?.classList.contains('pbR96ChoosingStore'))return true;const button=doc?.querySelector('[data-store-home]');if(!button)return false;button.click();return true;}");
 fs.writeFileSync(file,nav);
}

const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* PB1314 print workspace layout */')){
 css+=[
  "",
  "/* PB1314 print workspace layout: separate embedded desktop scroll container. */",
  "@media(min-width:821px){",
  " html.pb1126Embedded body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea{",
  "  position:fixed!important;inset:0!important;top:0!important;bottom:0!important;width:100%!important;",
  "  height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;box-sizing:border-box!important;",
  "  overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior-y:contain!important;",
  "  -webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;pointer-events:auto!important",
  " }",
  " html.pb1126Embedded body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea>:is(.simplePrintPilot,.albumOrderWorkspace){",
  "  height:auto!important;min-height:100%!important;max-height:none!important;box-sizing:border-box!important",
  " }",
  " html.pb1126Desktop body:not(.pbAuthenticatedPhotographerPortal) #pb1126ChromeHost{display:none!important}",
  "}",
  "@media(max-width:820px){",
  " /* The previous fixed 100% child height left dead space below photo/album cards. */",
  " html.pb1310MobilePrint body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea{",
  "  padding-bottom:max(12px, env(safe-area-inset-bottom))!important;overflow-y:auto!important;",
  "  overscroll-behavior-y:contain!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important",
  " }",
  " html.pb1310MobilePrint body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea>:is(.simplePrintPilot,.albumOrderWorkspace){",
  "  height:auto!important;min-height:100%!important;max-height:none!important;box-sizing:border-box!important",
  " }",
  "}",
  ""].join('\n');
 fs.writeFileSync(cssFile,css);
}

// Cache-bust the existing JS/CSS from every entry page (web & API).
function refresh(dir){
 if(!fs.existsSync(dir))return;
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const target=path.join(dir,item.name);
  if(item.isDirectory())refresh(target);
  else if(item.name.endsWith('.html')){
   const html=fs.readFileSync(target,'utf8');
   const next=html.replace(/(photobridge-r1126-desktop-navigation\.(?:js|css))([^"'<>\s]*)/g,(_,name,q)=>{
    const clean=q.replace(/([?&])printWorkspace=[^&]*/g,'$1').replace(/[?&]$/,'');
    return name+clean+(clean.includes('?')?'&':'?')+'printWorkspace=r1314';
   });
   if(next!==html)fs.writeFileSync(target,next);
  }
 }
}
refresh('dist/web');refresh('dist/api');
console.log('[PhotoBridge R1314] Print/Album scrolling, mobile space, fast readiness, chooser entry and logout header.');