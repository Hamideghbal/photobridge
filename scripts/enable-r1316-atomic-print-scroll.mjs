import fs from 'node:fs';
import path from 'node:path';

// Apply after R1315; this is a narrow repair for the embedded Windows Print tab.
const navFile='dist/web/photobridge-r1126-desktop-navigation.js';
let nav=fs.readFileSync(navFile,'utf8');
if(!nav.includes('/* PB1316 atomic print row */')){
 const replace=(before,after)=>{
  if(nav.split(before).length!==2)throw Error('[R1316] Missing or duplicated navigation anchor '+before.slice(0,100));
  nav=nav.replace(before,after);
 };

 // Mouse wheel fallback: when legacy scroll handlers have blocked native scrolling,
 // wait until after the native wheel default and only then scroll the real card
 // container. Do not preventDefault: normal wheels, touchpads and nested areas win.
 const wheel=[
  "  /* PB1316 atomic print row */",
  "  const pb1316Wheel=e=>{",
  "   if(e.ctrlKey||e.shiftKey||!e.deltaY||!matchMedia('(min-width:821px)').matches)return;",
  "   const root=document.querySelector('main.photographerMain.photographerPrintWorkspace');",
  "   const target=e.target?.nodeType===1?e.target:e.target?.parentElement;",
  "   if(!root||!target||!root.contains(target)||target.closest('dialog,[role=\"dialog\"],.pb748Modal,.pb1178TariffDialog,textarea,select,[contenteditable=\"true\"]'))return;",
  "   const viewport=root.querySelector(':scope>.photographerRolePageScrollArea')||root.querySelector('.photographerRolePageScrollArea');",
  "   if(!viewport||!viewport.contains(target))return;",
  "   const candidates=[];",
  "   for(let node=target;node&&node!==root;node=node.parentElement){",
  "    if(node.clientHeight>1&&node.scrollHeight>node.clientHeight+2&&!candidates.includes(node))candidates.push(node);",
  "   }",
  "   if(!candidates.includes(viewport))candidates.push(viewport);",
  "   const snapshot=candidates.map(node=>node.scrollTop);",
  "   const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?Math.max(1,viewport.clientHeight):1);",
  "   requestAnimationFrame(()=>{",
  "    if(!viewport.isConnected||candidates.some((node,i)=>node.scrollTop!==snapshot[i]))return;",
  "    for(const node of candidates){",
  "     const limit=node.scrollHeight-node.clientHeight;",
  "     if(limit<=1||!(delta>0?node.scrollTop<limit-1:node.scrollTop>1))continue;",
  "     const old=node.scrollTop;node.scrollTop=Math.max(0,Math.min(limit,old+delta));",
  "     if(node.scrollTop!==old)break;",
  "    }",
  "   });",
  "  };",
  "  addEventListener('wheel',pb1316Wheel,{capture:true,passive:true});"
 ].join('\n');

 replace(" if(query.get('pbDesktopContent')==='1'){"," if(query.get('pbDesktopContent')==='1'){\n"+wheel);

 // The row must never be shown as an empty 41px background strip. React can
 // create the two native controls on different frames: show the complete row
 // only after BOTH are connected and their desktop clones have been created.
 const ending="   row.dataset.source=signature;\n  }\n }";
 const atomic=[
  "   row.dataset.source=signature;",
  "  }",
  "  const printPanel=panels.get('print');",
  "  const loading=printPanel?.querySelector('.pb1126Loading');",
  "  const nativeModes=active==='print'&&!choosing&&visible.some(button=>button.classList.contains('photographerPrintPhotoTab'))&&visible.some(button=>button.classList.contains('photographerPrintAlbumTab'));",
  "  const clonedModes=!!row.querySelector('.pb1127PrintModes .photographerPrintPhotoTab')&&!!row.querySelector('.pb1127PrintModes .photographerPrintAlbumTab');",
  "  const waiting=active==='print'&&!choosing&&(!nativeModes||!clonedModes||!loading?.hidden||document.documentElement.classList.contains('pb1315PanelChanging'));",
  "  document.documentElement.classList.toggle('pb1316PrintRowPending',waiting);",
  "  row.classList.toggle('pb1316Ready',active==='print'&&!choosing&&!waiting);",
  "  row.hidden=choosing||waiting;",
  " }"
 ].join('\n');
 replace(ending,atomic);

 // Clear the print-only waiting flag when another main tab is active, or when
 // all embedded panels are closed following logout / navigation.
 const close=" function closePanels(){for(const p of panels.values())p.hidden=true;selected=null;document.documentElement.classList.remove('pb1126PanelOpen','pb1315PanelChanging');}";
 if(nav.split(close).length!==2)throw Error('[R1316] Unexpected R1315 closePanels');
 replace(close,close.replace("'pb1315PanelChanging'","'pb1315PanelChanging','pb1316PrintRowPending'"));

 fs.writeFileSync(navFile,nav);
}

const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* PB1316 print scroll + atomic header */')){
 css+=[
  "",
  "/* PB1316 print scroll + atomic header */",
  "@media(min-width:821px){",
  " /* The whole second header row (background and controls) appears in one frame. */",
  " html.pb1126Desktop:is(.pb1316PrintRowPending,.pb1315PanelChanging) body #pb1126ChromeHost #pb1126DesktopHeader{",
  "  height:72px!important;min-height:72px!important;max-height:72px!important;grid-template-rows:72px!important",
  " }",
  " html.pb1126Desktop:is(.pb1316PrintRowPending,.pb1315PanelChanging) body #pb1126ChromeHost #pb1126DesktopHeader>.pb1126Secondary{",
  "  display:none!important;visibility:hidden!important;background:transparent!important;pointer-events:none!important",
  " }",
  " html.pb1126Desktop:is(.pb1316PrintRowPending,.pb1315PanelChanging) body .pb1126ContentPanel[data-panel='print']{top:72px!important}",
  " html.pb1126Embedded body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea,",
  " html.pb1126Embedded body #root main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea.photographerRolePageScrollArea{",
  "  overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior-y:contain!important;",
  "  touch-action:pan-y!important;pointer-events:auto!important;min-height:0!important;max-height:none!important",
  " }",
  " html.pb1126Embedded body #root main.photographerMain.photographerPrintWorkspace .ordersWorkspace.liveCustomerOrders,",
  " html.pb1126Embedded body #root main.photographerMain.photographerPrintWorkspace .albumOrderWorkspace{",
  "  height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important",
  " }",
  "}",
  ""
 ].join('\n');
 fs.writeFileSync(cssFile,css);
}
// Refresh active JS and CSS references, including copied HTML in API routes.
function refresh(dir){
 if(!fs.existsSync(dir))return;
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const f=path.join(dir,e.name);
  if(e.isDirectory())refresh(f);
  else if(e.name.endsWith('.html')){
   const src=fs.readFileSync(f,'utf8');
   const result=src.replace(/(photobridge-r1126-desktop-navigation\.(?:css|js))([^"'<>\s]*)/g,(_,name,q)=>{
    const clean=q.replace(/([?&])printAtomic=[^&]*/g,'$1').replace(/[?&]$/,'');
    return name+clean+(clean.includes('?')?'&':'?')+'printAtomic=r1316';
   });
   if(result!==src)fs.writeFileSync(f,result);
  }
 }
}
refresh('dist/web');refresh('dist/api');
console.log('[PhotoBridge R1316] synchronized Print row and wheel fallback for order/album cards.');