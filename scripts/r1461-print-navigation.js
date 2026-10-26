/* Desktop Print chrome and refresh position. No file/order data is persisted. */
(()=>{
 if(!matchMedia('(min-width:821px)').matches)return;
 let scheduled=false;
 const validRoute=value=>{try{if(!String(value).startsWith('/')||String(value).startsWith('//'))return null;const u=new URL(value,location.origin);if(u.origin!==location.origin||!/^\/photographer\/(?:orders\/(?:flow|needs_fix|ready|completed)|upload|album|archive|finance)\/?$/.test(u.pathname)||u.searchParams.get('pbLabChooser')==='1')return null;u.searchParams.delete('pbDesktopPanel');u.searchParams.delete('pbPrintRoute');u.searchParams.set('workspace','print');u.searchParams.set('pbDesktopContent','1');return u.pathname+u.search}catch{return null}};
 function sync(){
  scheduled=false;const main=document.querySelector('main.photographerPrintWorkspace');if(!main)return;
  const rail=main.querySelector(':scope>.photographerLabContextRail');
  const orders=/^\/photographer\/orders\//.test(location.pathname)&&!!rail?.querySelector('.photographerContextAction.primary');
  main.classList.toggle('pb1461Orders',orders);
  const album=/^\/photographer\/album\/?$/.test(location.pathname)&&!!rail?.querySelector('#photographer-album-status-desktop-slot');
  main.classList.toggle('pb1464Album',album);
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
