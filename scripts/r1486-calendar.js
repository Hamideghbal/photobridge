(()=>{
 'use strict';
 const ua=String(navigator.userAgent||'');
 if(/Windows|Electron/i.test(ua)||!/Android|iPhone|iPod|iPad/i.test(ua)||window.pbNativeStorage)return;
 let queued=false;const placed=new WeakSet();
 function calendarRect(trigger,viewport,dockTop){
  const width=Math.max(0,Math.min(300,viewport.width-48)),left=viewport.left+(viewport.width-width)/2;
  const top=trigger.bottom+6,maxBottom=Math.min(viewport.top+viewport.height,dockTop)-8;
  return {left,top,width,maxHeight:Math.max(0,maxBottom-top)};
 }
 function closeOutside(event){
  if(!document.documentElement.classList.contains('pb1482LabPhoneMode'))return;
  document.querySelectorAll('.labRoleWorkspace .persianDateField').forEach(field=>{if(field.querySelector('.persianDatePopover')&&!field.contains(event.target))field.querySelector('.persianDateTrigger')?.click()});
 }
 function paint(){
  queued=false;if(!document.documentElement.classList.contains('pb1482LabPhoneMode'))return;
  const v=window.visualViewport,viewport={left:v?.offsetLeft||0,top:v?.offsetTop||0,width:v?.width||window.innerWidth,height:v?.height||window.innerHeight};
  const dock=document.querySelector('body>.pb1482LabPhoneDock'),edge=dock?.getBoundingClientRect().top??(viewport.top+viewport.height);
  document.querySelectorAll('.labRoleWorkspace .persianDateField').forEach(field=>{
   const popup=field.querySelector('.persianDatePopover'),trigger=field.querySelector('.persianDateTrigger');if(!popup||!trigger)return;
   const scroller=field.closest('.labRolePageScrollArea');
   if(!placed.has(popup)){
    placed.add(popup);
    if(scroller&&edge-trigger.getBoundingClientRect().bottom<260){
     const tabs=scroller.querySelector('.financeNavDock'),inset=tabs?.getBoundingClientRect().height||0;
     const delta=trigger.getBoundingClientRect().top-scroller.getBoundingClientRect().top-inset-12;
     if(delta>0)scroller.scrollTop+=delta;
    }
   }
   const rect=calendarRect(trigger.getBoundingClientRect(),viewport,edge);
   for(const [key,value]of Object.entries(rect)){const name='--pb1485-'+key;if(popup.style.getPropertyValue(name)!==value+'px')popup.style.setProperty(name,value+'px');}
  });
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(paint)}}
 function start(){document.addEventListener("pointerdown",closeOutside,true);new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);schedule()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
