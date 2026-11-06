/* R1653: stable desktop photographer header and cached Settings pages.
 * Patch only the desktop navigation shell, not minified React or billing logic.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const one=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('R1653 '+label+' count '+n);return s.replace(a,b);};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const style='photobridge-r1653-photographer-desktop-stability.css',settings='photobridge-r1635-photographer-inline-settings.js';
const css=fs.readFileSync('scripts/r1653-photographer-desktop-stability.css','utf8');
const cachedSettings=fs.readFileSync('scripts/r1653-photographer-inline-settings.js','utf8');
execFileSync(process.execPath,['--check','scripts/r1653-photographer-inline-settings.js'],{stdio:'inherit'});
const bootstrap='<style id="pb1653FirstPaint">@media(min-width:821px){html.pb1653DesktopBoot body #root #photographerRoleHeaderV710,html.pb1653DesktopBoot body #root .photographerHeaderRefined,html.pb1653EmbeddedBoot body #root #photographerRoleHeaderV710,html.pb1653EmbeddedBoot body #root .photographerHeaderRefined{visibility:hidden!important}}</style>'+
'<script id="pb1653FirstPaintBoot">(()=>{try{const u=new URL(location.href);if(!/^\\/photographer(?:\\/|$)/.test(u.pathname)||/^\\/photographer\\/(login|signup|register|invite)(?:\\/|$)/.test(u.pathname))return;const h=document.documentElement;if(u.searchParams.get("pbDesktopContent")==="1"){h.classList.add("pb1653EmbeddedBoot");return}if(!matchMedia("(min-width:821px)").matches)return;h.classList.add("pb1653DesktopBoot");let o;const done=()=>{if(document.getElementById("pb1126DesktopHeader")){h.classList.remove("pb1653DesktopBoot");o?.disconnect();return true}return false};o=new MutationObserver(done);o.observe(h,{childList:true,subtree:true});done();setTimeout(()=>{o.disconnect();h.classList.remove("pb1653DesktopBoot")},30000)}catch{}})();</script>';

function patchNav(nav){
 if(nav.includes('/* PB1653 stable desktop photographer */'))return nav;
 nav=one(nav,
  "||(!doc?.querySelector('.photographerPrintModeNav')&&selected==='print')",'',
  'transient missing print-nav chooser');
 nav=one(nav,
  "const nav=chrome.querySelector('.pb1126MainNav'),active=selected||kind(),previousActive=nav.dataset.pb1132Active||'';",
  "const nav=chrome.querySelector('.pb1126MainNav'),active=selected||kind(),previousActive=nav.dataset.pb1132Active||'';\n  const navHighlight=document.documentElement.classList.contains('pb1635SettingsOpen')?null:active;",
  'separate active work from selected tab');
 nav=one(nav,
  "button.classList.toggle('active',active===key);if(active===key)",
  "button.classList.toggle('active',navHighlight===key);if(navHighlight===key)",
  'clear previous selection');
 if(nav.includes("visible.map(el=>el.outerHTML).join('')"))
  nav=one(nav,"visible.map(el=>el.outerHTML).join('')",
   "visible.map(el=>el.tagName+'|'+[...el.classList].filter(c=>!['active','loading','pending'].includes(c)).join('.')+'|'+el.textContent.trim()).join('|')",
   'structural modes signature');
 const target="const thirdVisible=controls.length>0||(financeTabSelected&&financeThird.children.length>0);";
 const fresh="const thirdVisible=controls.length>0||(financeThird.children.length>0&&chrome.classList.contains('pb1632FinanceThird')&&!doc?.querySelector('.liveCustomerOrders,.archiveWorkspace,.simplePrintPilot,.photographerLabDirectory,.albumCustomerOrders'));";
 if(nav.includes(target))nav=one(nav,target,fresh,'finance third row');
 else nav=one(nav,'const thirdVisible=controls.length>0;',fresh,'finance third row fallback');

 const helper=[
 '  function pb1653RelevantHeader(records){',
 "   const header='#photographerRoleHeaderV710,.photographerPrintModeNav,.photographerPrintModeUtilityCluster,.financeSectionTabs,#pbR99LabChooser';",
 "   const sections='.financeWorkspace,.liveCustomerOrders,.archiveWorkspace,.simplePrintPilot,.photographerLabDirectory,.albumCustomerOrders';",
 '   for(const change of records){',
 '    const el=change.target?.nodeType===1?change.target:null;',
 '    if(el?.closest?.(header))return true;',
 "    if(change.type==='attributes'&&el===el?.ownerDocument?.body&&el.classList.contains('pbR100F14ChoosingLab'))return true;",
 "    if(change.type==='childList'){",
 '     for(const node of [...change.addedNodes,...change.removedNodes]){',
 '      if(node.nodeType!==1)continue;',
 "      if(node.matches?.(header+','+sections)||node.querySelector?.(header+','+sections))return true;",
 '     }',
 '    }',
 '   }',
 '   return false;',
 '  }'
 ].join('\n');
 const fn=" function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render);}}";
 nav=one(nav,fn,fn+'\n'+helper,'filtered observer helper');
 const obsModern="frame._pb1648HeaderObserver=new MutationObserver(schedule);";
 const obsLegacy="new MutationObserver(schedule).observe(frame.contentDocument.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','disabled','aria-current']});";
 if(nav.includes(obsModern))
  nav=one(nav,obsModern,"frame._pb1648HeaderObserver=new MutationObserver(records=>{if(pb1653RelevantHeader(records))schedule()});",'frame observer modern');
 else nav=one(nav,obsLegacy,
  "new MutationObserver(records=>{if(pb1653RelevantHeader(records))schedule()}).observe(frame.contentDocument.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','disabled','aria-current']});",
  'frame observer legacy');
 nav=one(nav,
 "new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true});",
 "new MutationObserver(records=>{if(pb1653RelevantHeader(records))schedule()}).observe(document.getElementById('root')||document.body,{childList:true,subtree:true});",
 'root observer');
 const normalized=[
 "  if(active==='print'&&!choosing){",
 "   const copies=[...row.querySelectorAll('.pb1127PrintModes>button,.pb1127PrintUtilities>button')];",
 "   const settingsOpen=document.documentElement.classList.contains('pb1635SettingsOpen');",
 '   copies.forEach((copy,index)=>{',
 '    const original=visible[index];if(!original)return;',
 "    copy.classList.toggle('active',!settingsOpen&&original.classList.contains('active'));",
 "    for(const attr of ['aria-current','aria-selected']){",
 '     const value=settingsOpen?null:original.getAttribute(attr);',
 '     if(value===null)copy.removeAttribute(attr);else copy.setAttribute(attr,value);',
 '    }',
 '   });',
 '  }'
 ].join('\n');
 nav=one(nav,' const pressTimers=new WeakMap();',normalized+'\n const pressTimers=new WeakMap();','settings mode restore');
 nav=one(nav,"window.addEventListener('resize',schedule,{passive:true});",
 "window.addEventListener('resize',schedule,{passive:true});\n  window.addEventListener('pb1653-settings-selection',schedule);",
 'settings event bridge');
 nav+='\n/* PB1653 stable desktop photographer */\n';
 return nav;
}
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const navFile=root+'/photobridge-r1126-desktop-navigation.js';
 fs.writeFileSync(navFile,patchNav(fs.readFileSync(navFile,'utf8')));
 execFileSync(process.execPath,['--check',navFile],{stdio:'inherit'});
 fs.writeFileSync(root+'/'+settings,cachedSettings);
 fs.writeFileSync(root+'/'+style,css);
 const index=root+'/index.html';let html=fs.readFileSync(index,'utf8');
 if(!html.includes('id="pb1653FirstPaint"'))html=one(html,'<head>','<head>'+bootstrap,'bootstrap');
 if(!html.includes(style))html=one(html,'</head>','<link rel="stylesheet" href="/'+style+'?v=r1653"></head>','stylesheet');
 html=html.replace(/photobridge-r1126-desktop-navigation\.js\?[^"']*/g,u=>u.includes('stable=r1653')?u:u+'&stable=r1653');
 html=html.replace(/photobridge-r1635-photographer-inline-settings\.js\?[^"']*/g,u=>u.includes('speed=r1653')?u:u+'&speed=r1653');
 if(html.split('stable=r1653').length!==2||html.split('speed=r1653').length!==2)throw Error('R1653 cache version markers '+root);
 fs.writeFileSync(index,html);
 if(root.endsWith('/lab-desktop-ui')){
  const p=root+'/manifest.json',m=JSON.parse(fs.readFileSync(p,'utf8'));
  if(m.protocol!==1||m.channel!=='lab'||!Array.isArray(m.files))throw Error('R1653 manifest contract');
  for(const name of ['index.html','photobridge-r1126-desktop-navigation.js',settings,style]){
   let entry=m.files.find(x=>x.name===name);
   if(!entry){entry={name,url:'/lab-desktop-ui/'+name};m.files.push(entry)}
   entry.sha256=hash(fs.readFileSync(root+'/'+name));
  }
  m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();
  fs.writeFileSync(p,JSON.stringify(m));
 }
}
console.log('[R1653] Stable desktop header; settings pages reused, finance subtitle removed');
