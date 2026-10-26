(()=>{
 'use strict';
 const ua=String(navigator.userAgent||'');
 if(/Windows|Electron/i.test(ua)||!/Android|iPhone|iPod|iPad/i.test(ua)||window.pbNativeStorage)return;
 let frame=0,resize=null,watched=[];
 const write=(key,value)=>{const style=document.documentElement.style;if(style.getPropertyValue(key)!==value)style.setProperty(key,value)};
 function sync(){
  frame=0;
  const enabled=document.documentElement.classList.contains('pb1482LabPhoneMode');
  const main=enabled&&document.querySelector('.labRoleWorkspace main.appWorkspacePage');
  const scroll=main?.querySelector(':scope>.labRolePageScrollArea'),dock=document.querySelector('body>.pb1482LabPhoneDock');
  if(!scroll||!dock)return;
  const clear=main.querySelector('.stageQueueWorkspace .queueOrderSearch .headerSearchClear');
  if(clear)clear.click();
  const headers=[...main.querySelectorAll(':scope>.labSingleHeader,:scope>.pb1148SecondaryHeader,:scope>.pb1372ThirdHeader')].filter(n=>n.getClientRects().length);
  const top=Math.ceil(Math.max(0,...headers.map(n=>n.getBoundingClientRect().bottom)));
  const viewport=window.innerHeight,edge=Math.floor(dock.getBoundingClientRect().top);
  if(top>0&&edge>top){write('--pb1483-scroll-top',top+'px');write('--pb1483-scroll-bottom',Math.max(0,viewport-edge)+'px');}
  const next=[...headers,dock];
  if(next.length!==watched.length||next.some((n,i)=>n!==watched[i])){resize?.disconnect();watched=next;resize||=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;next.forEach(n=>resize?.observe(n));}
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(sync)}
 function start(){
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,characterData:true});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  for(const event of ['resize','popstate','pageshow'])window.addEventListener(event,schedule);
  window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
  schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
