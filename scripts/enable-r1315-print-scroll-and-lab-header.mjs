import fs from 'node:fs';
import path from 'node:path';

// R1315: actual print viewport offsets and stable lab entry, after R1314.
// The earlier R1314 CSS could not override inline-important legacy bounds.
const viewportNames=new Set([
 'photobridge-ui-fixes-v765.js',
 'photobridge-v904r100f37-store-header-core.js',
 'photobridge-v904r100f38-header-route-isolation.js',
 'photobridge-v904r100f39-print-actions-cleanup.js'
]);
let corrected=0;
function patchViewportTree(dir){
 if(!fs.existsSync(dir))return;
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){patchViewportTree(file);continue;}
  if(!viewportNames.has(entry.name))continue;
  let source=fs.readFileSync(file,'utf8');
  if(source.includes('/* PB1315 embedded print viewport */'))continue;
  const target='pb1310=window.pb1310PrintGeometry?.(w)';
  if(!source.includes(target))continue; // Some copies predate R1310.
  if(source.split(target).length!==2)throw Error('[R1315] Duplicate viewport reference '+file);
  source=source.replace(target,"pb1310=window.pb1310PrintGeometry?.(w)??(/* PB1315 embedded print viewport */document.documentElement.classList.contains('pb1126Embedded')?{top:0,bottom:0}:null)");
  fs.writeFileSync(file,source);corrected++;
 }
}
patchViewportTree('dist/web');
patchViewportTree('dist/api');
const primary='dist/web/photobridge-ui-fixes-v765.js';
if(!fs.readFileSync(primary,'utf8').includes('/* PB1315 embedded print viewport */'))
 throw Error('[R1315] Required Print viewport source was not patched');

const navFile='dist/web/photobridge-r1126-desktop-navigation.js';
let nav=fs.readFileSync(navFile,'utf8');
if(!nav.includes('/* PB1315 stable laboratory transition */')){
 const anchor=" window.addEventListener('photobridge-panel-ready',event=>{";
 if(nav.split(anchor).length!==2)throw Error('[R1315] Missing unique panel-ready handler');
 const guards=[
  " /* PB1315 stable laboratory transition */",
  " const pb1315Documents=new WeakSet();",
  " function pb1315Sync(panel){",
  "  if(!panel?.isConnected||panel.dataset.panel!=='print'||panel.hidden)return;",
  "  const doc=panel.querySelector('iframe')?.contentDocument;",
  "  if(!doc?.body)return;",
  "  const chooser=doc.querySelector('#pbR99LabChooser');",
  "  const choosing=chooser&&!chooser.hidden&&doc.defaultView?.getComputedStyle(chooser).display!=='none';",
  "  const scroll=doc.querySelector('main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea');",
  "  const workspace=!!doc.querySelector('.photographerPrintModeNav')&&!!scroll?.children.length;",
  "  const boot=doc.documentElement.classList.contains('pbR100F37LabEnterBoot');",
  "  const transitioning=boot||(!choosing&&!workspace);",
  "  const loader=panel.querySelector('.pb1126Loading');",
  "  if(loader)loader.hidden=!transitioning;",
  "  if(selected==='print'){",
  "   document.documentElement.classList.toggle('pb1315PanelChanging',transitioning);",
  "   const row=chrome?.querySelector('.pb1126Secondary');",
  "   if(row&&transitioning)row.hidden=true;",
  "   if(!transitioning)schedule();",
  "  }",
  " }",
  " function pb1315Watch(panel){",
  "  if(!panel?.isConnected||panel.dataset.panel!=='print')return;",
  "  const frame=panel.querySelector('iframe'),doc=frame?.contentDocument;",
  "  if(!doc?.body||!doc.defaultView)return;",
  "  if(!pb1315Documents.has(doc)){",
  "   pb1315Documents.add(doc);",
  "   new MutationObserver(()=>pb1315Sync(panel)).observe(doc.documentElement,{attributes:true,attributeFilter:['class']});",
  "   doc.defaultView.addEventListener('beforeunload',()=>{",
  "    if(!panel.hidden&&selected==='print'){",
  "     const loader=panel.querySelector('.pb1126Loading');if(loader)loader.hidden=false;",
  "     document.documentElement.classList.add('pb1315PanelChanging');",
  "     const row=chrome?.querySelector('.pb1126Secondary');if(row)row.hidden=true;",
  "    }",
  "   });",
  "  }",
  "  pb1315Sync(panel);",
  " }",
  ""
 ].join('\n');
 nav=nav.replace(anchor,guards+anchor);
 const old="   const loading=panel.querySelector('.pb1126Loading');if(loading)loading.hidden=true;\n   schedule();break;";
 if(nav.split(old).length!==2)throw Error('[R1315] Early-ready handler changed');
 nav=nav.replace(old,"   pb1315Watch(panel);schedule();break;");
 const loadAnchor="   panel.append(frame,loading);document.body.append(panel);panels.set(key,panel);";
 if(nav.split(loadAnchor).length!==2)throw Error('[R1315] Embedded panel constructor changed');
 nav=nav.replace(loadAnchor,"   frame.addEventListener('load',()=>pb1315Watch(panel));\n"+loadAnchor);
 const close=" function closePanels(){for(const p of panels.values())p.hidden=true;selected=null;document.documentElement.classList.remove('pb1126PanelOpen');}";
 if(nav.split(close).length!==2)throw Error('[R1315] Panel close boundary changed');
 nav=nav.replace(close,close.replace("'pb1126PanelOpen'","'pb1126PanelOpen','pb1315PanelChanging'"));
 fs.writeFileSync(navFile,nav);
}

const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* PB1315 native header and inner scroll */')){
 css+=[
  "",
  "/* PB1315 native header and inner scroll */",
  "/* The parent desktop header owns navigation; embedded legacy headers are action sources only.",
  "   Hide them even when the iframe temporarily measures narrower than 821px. */",
  "html.pb1126Embedded body #root :is(#photographerRoleHeaderV710,#pbF37PhotographerHeader,#pbF37Subheader,#pbSharedPhotographerHeader,#pbSharedPhotographerSubheader,.photographerPrintModeHeader){",
  " display:none!important;visibility:hidden!important;pointer-events:none!important",
  "}",
  "html.pb1126Embedded body.pbF37UnifiedActive :is(#pbF37PhotographerHeader,#pbF37Subheader){",
  " display:none!important;visibility:hidden!important;pointer-events:none!important",
  "}",
  "@media(min-width:821px){",
  " html.pb1126Embedded,html.pb1126Embedded body,html.pb1126Embedded body #root{height:100dvh!important;min-height:0!important;overflow:hidden!important}",
  " html.pb1126Embedded body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea.photographerRolePageScrollArea{",
  "  position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;inset:0!important;",
  "  height:auto!important;min-height:0!important;max-height:none!important;box-sizing:border-box!important;",
  "  overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior-y:contain!important;",
  "  -webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;pointer-events:auto!important",
  " }",
  " html.pb1126Desktop.pb1315PanelChanging body #pb1126ChromeHost #pb1126DesktopHeader>.pb1126Secondary{display:none!important}",
  " html.pb1126Desktop body .pb1126ContentPanel[data-panel='print'] .pb1126Loading:not([hidden]){display:grid!important;z-index:3!important}",
  "}",
  ""
 ].join('\n');
 fs.writeFileSync(cssFile,css);
}
function refresh(dir){
 if(!fs.existsSync(dir))return;
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())refresh(file);
  else if(entry.name.endsWith('.html')){
   const before=fs.readFileSync(file,'utf8');
   const after=before.replace(/(photobridge-(?:r1126-desktop-navigation\.(?:js|css)|ui-fixes-v765\.js|v904r100f3[789]-[^"'<>\s?]+\.js))([^"'<>\s]*)/g,(_,name,query)=>{
    const clean=query.replace(/([?&])printStable=[^&]*/g,'$1').replace(/[?&]$/,'');
    return name+clean+(clean.includes('?')?'&':'?')+'printStable=r1315';
   });
   if(after!==before)fs.writeFileSync(file,after);
  }
 }
}
refresh('dist/web');
refresh('dist/api');
console.log('[PhotoBridge R1315] '+corrected+' embedded viewport copies, stable lab entry, and print/album scrolling.');