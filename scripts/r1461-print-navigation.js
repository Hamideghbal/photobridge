/* Desktop Print chrome and refresh position. No file/order data is persisted. */
(()=>{
 if(!matchMedia('(min-width:821px)').matches)return;
 let scheduled=false;
 const validRoute=value=>{try{if(!String(value).startsWith('/')||String(value).startsWith('//'))return null;const u=new URL(value,location.origin);if(u.origin!==location.origin||!/^\/photographer\/(?:orders\/(?:flow|needs_fix|ready|completed)|upload|album|archive|finance)\/?$/.test(u.pathname)||u.searchParams.get('pbLabChooser')==='1')return null;u.searchParams.delete('pbDesktopPanel');u.searchParams.delete('pbPrintRoute');u.searchParams.set('workspace','print');u.searchParams.set('pbDesktopContent','1');return u.pathname+u.search}catch{return null}};
 function sync(){
  scheduled=false;const main=document.querySelector('main.photographerPrintWorkspace');if(!main)return;
  const rail=main.querySelector(':scope>.photographerLabContextRail');
  // PB2015: the native list and current route own the third row; action/slot
  // children may mount a render later. Do not depend on a particular button.
  const area=main.querySelector(':scope>.photographerRolePageScrollArea');
  const board=!!area?.querySelector('.ordersWorkspace.liveCustomerOrders');
  const chooser=new URLSearchParams(location.search).get('pbLabChooser')==='1'||document.body.classList.contains('pbR100F14ChoosingLab')||!!document.querySelector('#pbR99LabChooser');
  const composer=main.classList.contains('simplePrintPilotWorkspaceMode')||main.classList.contains('photographerAlbumCreateWorkspaceMode');
  const eligible=!!rail&&board&&!chooser&&!composer;
  const orders=eligible&&/^\/photographer\/orders(?:\/(?:flow|needs_fix|ready|completed))?\/?$/.test(location.pathname);
  const album=eligible&&/^\/photographer\/album\/?$/.test(location.pathname);
  main.classList.toggle('pb1461Orders',orders);
  main.classList.toggle('pb1464Album',album);
  main.classList.toggle('pb2015OrderBoard',orders||album);
  // PB2016: reserve the same row on empty/loading/populated lists. Header
  // coordinates belong to the visible document, not its changing cards.
  const listRoute=!chooser&&!composer&&/^\/photographer\/(?:orders(?:\/(?:flow|needs_fix|ready|completed))?|album)\/?$/.test(location.pathname);
  const intakeRoute=!chooser&&/^\/photographer\/upload\/?$/.test(location.pathname);
  const managed=listRoute||intakeRoute;
  main.classList.toggle('pb2016ManagedViewport',managed);
  main.classList.toggle('pb2016OrderList',listRoute);
  main.classList.toggle('pb2016PhotoIntake',intakeRoute);
  if(managed){
   const embedded=window.self!==window.top;
   const header=document.getElementById('pb1126DesktopHeader');
   const native=document.getElementById('photographerRoleHeaderV710');
   const edge=embedded?0:Math.max(0,Math.ceil(header?.getBoundingClientRect().bottom||native?.getBoundingClientRect().bottom||114));
   const value=edge+'px';
   if(main.style.getPropertyValue('--pb2016ChromeEdge')!==value)main.style.setProperty('--pb2016ChromeEdge',value);
   if(listRoute&&rail)for(const prop of ['display','visibility','pointer-events'])if(rail.style.getPropertyValue(prop))rail.style.removeProperty(prop);
   // A stale inline inset from the legacy mobile/desktop measurement wins
   // against stylesheet !important. Remove only the geometry on managed routes.
   if(area?.style)for(const prop of ['inset','top','bottom','left','right','inset-block-start','inset-block-end','height','max-height','min-height','margin','margin-top','padding-top'])if(area.style.getPropertyValue(prop))area.style.removeProperty(prop);
  }else main.style.removeProperty('--pb2016ChromeEdge');
  if(orders||album){
   // Clear stale mobile-only inline hiding, never rebuild React controls.
   for(const prop of ['display','visibility','pointer-events'])if(rail.style.getPropertyValue(prop))rail.style.removeProperty(prop);
   const embedded=window.self!==window.top;
   const header=document.getElementById('pb1126DesktopHeader');
   const native=document.getElementById('photographerRoleHeaderV710');
   const headerEdge=header?.getBoundingClientRect().bottom||native?.getBoundingClientRect().bottom||114;
   const edge=embedded?0:Math.max(0,Math.ceil(headerEdge));
   const top=edge+'px',bottom=(edge+44)+'px';
   if(main.style.getPropertyValue('--pb2014OrderTop')!==top)main.style.setProperty('--pb2014OrderTop',top);
   if(main.style.getPropertyValue('--pb2014OrderContentTop')!==bottom)main.style.setProperty('--pb2014OrderContentTop',bottom);
  }else for(const prop of ['--pb2014OrderTop','--pb2014OrderContentTop'])main.style.removeProperty(prop);

  for(const grid of main.querySelectorAll('.simplePrintPhotoGrid')){const width=grid.getBoundingClientRect().width;if(width>0){const columns=width>=980?6:width>=720?5:4,next='repeat('+columns+', minmax(0, 1fr))';if(grid.style.getPropertyValue('grid-template-columns')!==next)grid.style.setProperty('grid-template-columns',next,'important')}}
  try{
   if(parent===window||!window.frameElement?.closest('.pb1126ContentPanel[data-panel="print"]:not([hidden])'))return;
   if(document.querySelector('#pbR99LabChooser')||!document.querySelector('.photographerPrintModeNav'))return;
   const route=validRoute(location.pathname+location.search);if(!route)return;
   const u=new URL(parent.location.href);if(u.searchParams.get('pbDesktopPanel')!=='print'||u.searchParams.get('pbPrintRoute')===route)return;
   u.searchParams.set('pbPrintRoute',route);parent.history.replaceState(parent.history.state,'',u);
  }catch{}
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(sync)}}
 for(const key of ['pushState','replaceState']){const original=history[key];history[key]=function(...args){const result=original.apply(this,args);schedule();return result}}
 addEventListener('popstate',schedule);addEventListener('resize',schedule);
 const start=()=>{new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});schedule()};
 if(document.readyState==='loading')addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
