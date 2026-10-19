import fs from 'node:fs';import path from 'node:path';
const file='dist/web/photobridge-r1126-desktop-navigation.js';let s=fs.readFileSync(file,'utf8');
if(!s.includes('/* PB1312 desktop panel flow */')){
 const replace=(a,b)=>{if(s.split(a).length!==2)throw Error('R1312 anchor missing: '+a.slice(0,85));s=s.replace(a,b);};
 replace("if(query.get('pbDesktopContent')==='1'){",`if(query.get('pbDesktopContent')==='1'){const ready=()=>{try{if(parent!==window)parent.dispatchEvent(new parent.CustomEvent('photobridge-panel-ready',{detail:{frame:window.frameElement}}));}catch{}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else queueMicrotask(ready);`);
 replace('  scheduled=false;if(!document.body)return;',`  scheduled=false;if(!document.body)return;
  if(!panelSessionReady){chrome?.parentElement.remove();chrome=null;document.documentElement.classList.remove('pb1126Desktop','pb1127Choosing','pb1310GalleryHome');return;}
  document.documentElement.classList.add('pb1126Desktop');
  for(const p of panels.values())syncPanelDocument(p);`);
 s=s.replace(/const choosing=([^\n]+);/,(_,value)=>"const choosing=!!panels.get(selected)?.classList.contains('pb1312Transition')||("+value+");");
 replace('  row.hidden=choosing;',"  row.hidden=choosing||!!panels.get(selected)?.classList.contains('pb1312Transition');");
 const start="   frame.addEventListener('load',()=>{try{const u=new URL(frame.contentWindow.location.href);";
 const end="}catch{}});\n   panel.append(frame,loading);";
 const pos=s.indexOf(start),last=s.indexOf(end,pos);if(pos<0||last<0)throw Error('R1312 frame load anchor missing');
 s=s.slice(0,pos)+`   frame.addEventListener('load',()=>{try{const u=new URL(frame.contentWindow.location.href);if(u.href==='about:blank')return;if(u.origin!==location.origin||!/^\\/(equipment-rental|photographer)(\\/|$)/.test(u.pathname)||/^\\/photographer\\/(login|signup|register)/.test(u.pathname)){location.assign(u.href);return;}bindPanelDocument(panel);syncPanelDocument(panel);schedule();}catch{}});
   panel.append(frame,loading);`+s.slice(last+end.length);
 replace(" function openStoreChooser(doc){const button=doc?.querySelector('[data-store-home]');if(!button)return false;button.click();return true;}",` /* PB1312 desktop panel flow */
 const panelDocuments=new WeakMap();
 function openStoreChooser(doc){if(doc?.body?.classList.contains('pbR96ChoosingStore'))return true;const button=doc?.querySelector('[data-store-home]');if(!button)return false;button.click();return true;}
 function openPrintChooser(doc){
  if(!doc?.defaultView||!doc.querySelector('.photographerPrintModeNav,#pbR99LabChooser'))return false;
  if(doc.querySelector('#pbR99LabChooser'))return true;
  const w=doc.defaultView,u=new URL('/photographer/orders/flow',location.origin);u.searchParams.set('workspace','print');u.searchParams.set('pbLabChooser','1');u.searchParams.set('pbDesktopContent','1');
  w.history.pushState(null,'',u);w.dispatchEvent(new w.PopStateEvent('popstate'));return true;
 }
 function syncPanelDocument(panel){
  if(!panel.isConnected)return;
  const doc=panel.querySelector('iframe')?.contentDocument;if(!doc)return;
  if(panel.dataset.chooser==='1'){
   const opened=panel.dataset.panel==='print'?openPrintChooser(doc):openStoreChooser(doc);if(opened)delete panel.dataset.chooser;
  }
  const usable=doc.querySelector('#pbR99LabChooser,.photographerPrintModeNav,#photographerStoreRoleHeader,.pbR96StoreChooser');
  if(usable&&!doc.documentElement.classList.contains('pbR100F37LabEnterBoot')){panel.querySelector('.pb1126Loading').hidden=true;panel.classList.remove('pb1312Transition');}
 }
 function bindPanelDocument(panel){
  const frame=panel.querySelector('iframe'),doc=frame?.contentDocument;if(!doc?.body||panelDocuments.has(doc))return;panelDocuments.set(doc,true);
  new MutationObserver(()=>{syncPanelDocument(panel);schedule();}).observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','disabled','aria-current']});
  frame.contentWindow.addEventListener('beforeunload',()=>{if(!panel.isConnected)return;panel.classList.add('pb1312Transition');panel.querySelector('.pb1126Loading').hidden=false;if(selected===panel.dataset.panel){chrome?.querySelector('.pb1126Secondary')?.setAttribute('hidden','');document.documentElement.classList.add('pb1127Choosing');}});
  syncPanelDocument(panel);
 }
 window.addEventListener('photobridge-panel-ready',event=>{for(const p of panels.values())if(p.querySelector('iframe')===event.detail?.frame){bindPanelDocument(p);schedule();}});`);
 const a=s.indexOf(' function navigate(key){'),b=s.indexOf('  closePanels();const tab=tabs.find',a);if(a<0||b<0)throw Error('R1312 navigation anchor missing');
 s=s.slice(0,a)+` function navigate(key){
  if(key==='store'||key==='print'){open(key);const panel=panels.get(key);if(panel){panel.dataset.chooser='1';syncPanelDocument(panel);}return;}
`+s.slice(b);
 replace(' function clearPanelDocuments(){\n  warmEpoch++'," function clearPanelDocuments(){\n  for(const p of panels.values())delete p.dataset.chooser;\n  warmEpoch++");
 replace("panelSessionReady=false;pendingPanel=null;authenticated=false;clearPanelDocuments();walletBalance=null;", "panelSessionReady=false;pendingPanel=null;authenticated=false;clearPanelDocuments();chrome?.parentElement.remove();chrome=null;document.documentElement.classList.remove('pb1126Desktop','pb1127Choosing','pb1310GalleryHome');schedule();walletBalance=null;");
 fs.writeFileSync(file,s);
}
const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';let css=fs.readFileSync(cssFile,'utf8');if(!css.includes('/* PB1312 desktop panel flow */')){css+=`\n/* PB1312 desktop panel flow */
@media(min-width:821px){
 body:not(.pbAuthenticatedPhotographerPortal) #pb1126ChromeHost{display:none!important}
 html.pb1126Embedded body #root main.photographerMain>.photographerRolePageScrollArea{position:fixed!important;inset:0!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior-y:contain!important;touch-action:pan-y!important;pointer-events:auto!important}
 html.pb1126Desktop:not(.pb1126PanelOpen) body #root main.photographerMain:has(.clientGalleryManager)>.photographerRolePageScrollArea{position:fixed!important;top:114px!important;bottom:0!important;left:0!important;right:0!important;height:auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important}
 html.pb1126Desktop body .pb1126ContentPanel.pb1312Transition .pb1126Loading{display:grid!important;pointer-events:none!important}
 html.pb1126Desktop body .pb1126ContentPanel.pb1312Transition iframe{visibility:hidden!important}
}
`;fs.writeFileSync(cssFile,css);}
const viewportFiles=['photobridge-ui-fixes-v765.js','photobridge-v904r100f37-store-header-core.js','photobridge-v904r100f38-header-route-isolation.js','photobridge-v904r100f39-print-actions-cleanup.js'];
function patchViewports(dir){for(const name of viewportFiles){const f=path.join(dir,name);if(!fs.existsSync(f))continue;let code=fs.readFileSync(f,'utf8');if(code.includes('/* PB1312 embedded geometry */'))continue;const from='pb1310=window.pb1310PrintGeometry?.(w)';if(!code.includes(from))throw Error('R1312 viewport anchor missing '+f);code=code.replace(from,"pb1310=window.pb1310PrintGeometry?.(w)??(/* PB1312 embedded geometry */document.documentElement.classList.contains('pb1126Embedded')&&matchMedia('(min-width:821px)').matches?{top:0,bottom:0}:null)");fs.writeFileSync(f,code);}}
patchViewports('dist/web');
function refresh(dir){patchViewports(dir);if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())refresh(f);else if(e.name.endsWith('.html')){const a=fs.readFileSync(f,'utf8');const b=a.replace(/(photobridge-(?:r1126-desktop-navigation\.(?:js|css)|ui-fixes-v765\.js|v904r100f3[789]-[^"'<>\s]+\.js))([^"'<>\s]*)/g,(_,n,q)=>{const c=q.replace(/([?&])panelFlow=[^&]*/g,'$1').replace(/[?&]$/,'');return n+c+(c.includes('?')?'&':'?')+'panelFlow=r1312';});if(a!==b)fs.writeFileSync(f,b);}}}refresh('dist/web');refresh('dist/api');
console.log('[PhotoBridge R1312] chooser entry, early document readiness, scrolling and clean desktop logout.');
