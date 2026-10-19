/* Start desktop Print/Album below the last visible header row, including overflow. */
(()=>{
 'use strict';let frame=0;const observed=new WeakSet();
 const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return !el.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
 function edge(elements){return Math.ceil(Math.max(0,...elements.filter(visible).map(el=>el.getBoundingClientRect().bottom)))}
 // Only visible chrome outside the scrolling content owns space in this frame.
 const innerHeaders='main.photographerPrintWorkspace>.photographerPrintModeHeader,main.photographerPrintWorkspace>.photographerLabContextRail,#pb761-mode-actions,#pbF37PrintComposerActions';
 window.pb1318PrintInset=()=>{
  if(!document.documentElement.classList.contains('pb1126Embedded'))return 0;
  const area=document.querySelector('main.photographerPrintWorkspace>.photographerRolePageScrollArea');
  return edge([...document.querySelectorAll(innerHeaders)].filter(el=>!area?.contains(el)));
 };
 window.pb1319DesktopPrintInset=chrome=>edge([chrome,...chrome.querySelectorAll('.pb1126Secondary,.pb1127PrintModes,.pb1127PrintUtilities,.pb1126Secondary>*,.pb1126Secondary>*>*')]);
 const resize=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
 function sync(){frame=0;if(!matchMedia('(min-width:821px)').matches)return;
  const chrome=document.querySelector('#pb1126DesktopHeader'),panel=document.querySelector('.pb1126ContentPanel[data-panel="print"]');
  if(chrome&&panel&&!panel.hidden){const nodes=[chrome,...chrome.querySelectorAll('.pb1126Secondary,.pb1127PrintModes,.pb1127PrintUtilities,.pb1126Secondary>*,.pb1126Secondary>*>*')];nodes.forEach(watch);const top=window.pb1319DesktopPrintInset(chrome);if(top>0&&top<innerHeight-64&&panel.style.getPropertyValue('top')!==top+'px')panel.style.setProperty('top',top+'px','important');}
  if(document.documentElement.classList.contains('pb1126Embedded')){const area=document.querySelector('main.photographerPrintWorkspace>.photographerRolePageScrollArea');if(area){const top=window.pb1318PrintInset();document.querySelectorAll(innerHeaders).forEach(watch);if(area.style.getPropertyValue('top')!==top+'px')area.style.setProperty('top',top+'px','important');}}
 }
 function watch(el){if(resize&&!observed.has(el)){observed.add(el);resize.observe(el)}}
 function schedule(){if(!frame)frame=requestAnimationFrame(sync)}
 const start=()=>{new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});schedule();};
 addEventListener('resize',schedule,{passive:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
