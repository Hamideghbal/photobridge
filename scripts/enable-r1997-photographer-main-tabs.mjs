import fs from 'node:fs';
import path from 'node:path';

// R1997 runs after R1966, R1314 and the other native navigation writers.
// Keep Print, Gallery and Store as separate cached documents. Do not re-enter
// chooser or rebuild Store buttons on every React mutation.
const navFile='dist/web/photobridge-r1126-desktop-navigation.js';
let nav=fs.readFileSync(navFile,'utf8');
if(!nav.includes('/* PB1997 cached gallery / stable store */')){
 const once=(from,to,label)=>{
  const count=nav.split(from).length-1;
  if(count!==1)throw Error('[R1997] '+label+' anchor count '+count);
  nav=nav.replace(from,to);
 };
 once(
  " const nativeHeader=doc=>doc.querySelector('#photographerRoleHeaderV710,#photographerStoreRoleHeader');",
  [
   ' /* PB1997 cached gallery / stable store */',
   ' function pb1997StoreKey(el){',
   "  if(!el)return '';",
   "  for(const attr of ['data-store-panel','data-frame-customer-view','data-frame-customer-history','data-frame-customer-cart']){",
   "   if(el.hasAttribute(attr))return attr+':'+(el.getAttribute(attr)||el.id||el.getAttribute('aria-label')||(el.textContent||'').trim().slice(0,32)||'1');",
   '  }',
   "  return 'id:'+(el.id||el.getAttribute('aria-label')||(el.textContent||'').trim().slice(0,32));",
   ' }',
   ' function pb1997LiveStoreControl(doc,key){',
   '  if(!doc||!key)return null;',
   "  return [...doc.querySelectorAll('#pbR1123StoreDesktopNav button,#frameCustomerNav button,[data-frame-customer-view],[data-frame-customer-history],[data-frame-customer-cart]')].find(el=>el.isConnected&&pb1997StoreKey(el)===key)||null;",
   ' }',
   ' function pb1997SyncStoreHeader(row,controls,doc){',
   "  for(const original of controls){",
   '   const key=pb1997StoreKey(original);',
   "   const copy=[...row.querySelectorAll('.pb1126FrameStoreTabs [data-pb1997-store-key],.pb1126FrameStoreCart [data-pb1997-store-key]')].find(el=>el.dataset.pb1997StoreKey===key);",
   '   if(!copy)continue;',
   "   for(const name of ['active','selected'])copy.classList.toggle(name,original.classList.contains(name));",
   "   for(const attr of ['aria-current','aria-selected','aria-pressed']){const v=original.getAttribute(attr);if(v===null){if(copy.hasAttribute(attr))copy.removeAttribute(attr);}else if(copy.getAttribute(attr)!==v)copy.setAttribute(attr,v);}",
   '   if(copy.disabled!==original.disabled)copy.disabled=original.disabled;',
   '  }',
   "  const count=doc?.querySelector('#saleCartCount,[data-frame-cart-count],.saleCartCount')?.textContent?.trim();",
   "  const badge=row.querySelector('.pb1126FrameStoreCart .pb1242CartCount');",
   '  if(count&&badge&&badge.textContent!==count)badge.textContent=count;',
   ' }',
   " const nativeHeader=doc=>doc.querySelector('#photographerRoleHeaderV710,#photographerStoreRoleHeader');"
  ].join('\n'),
  'stable controls helpers'
 );
 once(
  "frame.title=key==='calendar'?'تقویم مشتریان':key==='crm'?'دفتر مشتریان':key==='store'?'فروشگاه':'چاپ';",
  "frame.title=key==='calendar'?'تقویم مشتریان':key==='crm'?'دفتر مشتریان':key==='store'?'فروشگاه':key==='gallery'?'گالری':'چاپ';",
  'Gallery document uses correct accessible iframe title'
 );
 once(
  "if(key==='crm'||key==='calendar'){const crmUrl=",
  "if(key==='gallery'){frame.src='/photographer/gallery?pbDesktopContent=1&pbDesktopPanel=gallery';}else if(key==='crm'||key==='calendar'){const crmUrl=",
  'gallery loads actual isolated document'
 );
 once(
  "new MutationObserver(schedule).observe(frame.contentDocument.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','disabled','aria-current']});",
  "new MutationObserver(()=>{if(selected===key&&!panel.hidden)schedule();}).observe(frame.contentDocument.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','disabled','aria-current']});",
  'only visible panel schedules redraw'
 );
 const navigateStart=nav.indexOf(' function navigate(key){');
 const preamble=nav.indexOf('  // R1978: reset a cached Print frame',navigateStart);
 const preambleEnd=nav.indexOf('  /* PB1763 CRM desktop navigation compatibility */',preamble);
 if(navigateStart<0||preamble<navigateStart||preambleEnd<preamble)throw Error('[R1997] R1978 repeated iframe reload anchor missing');
 nav=nav.slice(0,preamble)+"  // R1997: chooser re-entry is handled once below; never force full iframe reload.\n"+nav.slice(preambleEnd);
 once(
  "  if(key==='print'||key==='crm'||key==='calendar'){open(key);return;}",
  "  if(key==='crm'||key==='calendar'){open(key);return;}",
  'remove older Print shortcut that bypassed chooser'
 );
 const branchStart=nav.indexOf("  if(key==='print'||key==='store'){",navigateStart);
 const branchEnd=nav.indexOf('  // R1995: history.pushState only changes the URL;',branchStart);
 if(branchStart<0||branchEnd<branchStart)throw Error('[R1997] existing Print/Store navigation branch missing');
 nav=nav.slice(0,branchStart)+[
  "  if(key==='store'||key==='gallery'){",
  "   // Keep the selected storefront/gallery document; never reset Store to chooser.",
  "   open(key);return;",
  "  }",
  "  if(key==='print'){",
  "   open('print');",
  "   const panel=panels.get('print'),frame=panel?.querySelector('iframe');",
  "   if(!frame)return;",
  "   const reenter=()=>{if(panel.hidden||selected!=='print'||!frame.isConnected)return;const doc=frame.contentDocument;if(!doc?.body||frame.contentWindow?.location.href==='about:blank')return;openPrintChooser(doc);schedule();};",
  "   reenter();",
  "   if(!frame.contentDocument?.body)frame.addEventListener('load',reenter,{once:true});",
  "   return;",
  "  }",
  ""
 ].join('\n')+nav.slice(branchEnd);
 const restore="['store','print','crm','calendar'].includes(panel)";
 const restoreCount=nav.split(restore).length-1;
 if(restoreCount!==2)throw Error('[R1997] panel reload/popstate anchors count '+restoreCount);
 nav=nav.split(restore).join("['store','print','crm','calendar','gallery'].includes(panel)");
 once(
  "headerControls.map(el=>el.outerHTML).join('')+(cameraCart?.outerHTML||'')",
  "headerControls.map(el=>pb1997StoreKey(el)).join('|')+pb1997StoreKey(cameraCart)",
  'Store signature ignores volatile React HTML'
 );
 once(
  "const copy=cleanClone(original);copy.classList.add('pb1126FrameStoreControl');copy.style.removeProperty('display');",
  "const copy=cleanClone(original);copy.classList.add('pb1126FrameStoreControl');copy.style.removeProperty('display');copy.dataset.pb1997StoreKey=pb1997StoreKey(original);",
  'Store cloned controls get stable source identity'
 );
 once(
  "copy.onclick=()=>{original.click();requestAnimationFrame(()=>{schedule();reveal(motionContent(doc));});};",
  "copy.onclick=()=>{const live=pb1997LiveStoreControl(doc,copy.dataset.pb1997StoreKey)||(original.isConnected?original:null);if(!live||live.disabled)return;live.click();requestAnimationFrame(()=>{schedule();reveal(motionContent(doc));});};",
  'Store proxy does not retain detached React controls'
 );
 once(
  "\n }\n const pressTimers=new WeakMap();",
  "\n  if(storeHeader&&!choosing)pb1997SyncStoreHeader(row,headerControls,doc);\n }\n const pressTimers=new WeakMap();",
  'Store selection sync without recreation'
 );
 // R1995 body is still a real full-document route for AI/album/Instagram, not
 // a history-only fake SPA navigation. Gallery is a *real* isolated iframe.
 if(!nav.includes("if(key==='store'||key==='gallery')")||!nav.includes("frame.src='/photographer/gallery?pbDesktopContent=1&pbDesktopPanel=gallery'"))throw Error('[R1997] gallery/store isolation not installed');
 // Node syntax check, not execution (this code runs in the browser).
 new Function(nav);
 fs.writeFileSync(navFile,nav);
}
const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* PB1997 resilient Store secondary grid */')){
 css+=[
  '',
  '/* PB1997 resilient Store secondary grid */',
  '@media(min-width:821px){',
  ' html.pb1126Desktop body #pb1126ChromeHost #pb1126DesktopHeader:is(.pb1126FrameStore,.pb1126CameraStore)>.pb1126Secondary:not([hidden]){',
  '  display:grid!important;direction:ltr!important;grid-template-columns:minmax(100px,1fr) minmax(120px,auto) minmax(230px,1fr)!important;',
  '  align-items:center!important;column-gap:8px!important;padding-inline:14px!important;box-sizing:border-box!important;overflow:hidden!important',
  ' }',
  ' html.pb1126Desktop body #pb1126ChromeHost #pb1126DesktopHeader:is(.pb1126FrameStore,.pb1126CameraStore)>.pb1126Secondary>.pb1126FrameStoreTitle{',
  '  position:static!important;transform:none!important;grid-column:2!important;grid-row:1!important;max-width:100%!important;min-width:0!important;',
  '  white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;direction:rtl!important',
  ' }',
  ' html.pb1126Desktop body #pb1126ChromeHost #pb1126DesktopHeader:is(.pb1126FrameStore,.pb1126CameraStore)>.pb1126Secondary>.pb1126FrameStoreTabs{',
  '  position:static!important;grid-column:3!important;grid-row:1!important;max-width:100%!important;min-width:0!important;',
  '  width:100%!important;justify-content:flex-start!important;overflow-x:auto!important;overflow-y:hidden!important;direction:rtl!important',
  ' }',
  ' html.pb1126Desktop body #pb1126ChromeHost #pb1126DesktopHeader:is(.pb1126FrameStore,.pb1126CameraStore)>.pb1126Secondary>.pb1126FrameStoreCart{',
  '  position:static!important;grid-column:1!important;grid-row:1!important;min-width:0!important;max-width:100%!important;',
  '  justify-content:flex-start!important;overflow:hidden!important;direction:rtl!important',
  ' }',
  ' html.pb1126Desktop body #pb1126ChromeHost #pb1126DesktopHeader:is(.pb1126FrameStore,.pb1126CameraStore)>.pb1126Secondary .pb1126FrameStoreControl{',
  '  white-space:nowrap!important;flex:none!important',
  ' }',
  '}',
  ''
 ].join('\n');
 fs.writeFileSync(cssFile,css);
}
function refresh(dir){
 if(!fs.existsSync(dir))return;
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const f=path.join(dir,entry.name);
  if(entry.isDirectory())refresh(f);
  else if(f.endsWith('.html')){
   const html=fs.readFileSync(f,'utf8');
   const updated=html.replace(/(photobridge-r1126-desktop-navigation\.(?:js|css))([^"'<> \t\r\n]*)/g,(_,name,q)=>{
    const clean=q.replace(/([?&])primaryTabs=[^&]*/g,'$1').replace(/[?&]$/,'');
    return name+clean+(clean.includes('?')?'&':'?')+'primaryTabs=r1997';
   });
   if(updated!==html)fs.writeFileSync(f,updated);
  }
 }
}
refresh('dist/web');refresh('dist/api');
console.log('[R1997] cached Gallery iframe, persistent Store navigation, bounded frame observers and stable Store controls.');
