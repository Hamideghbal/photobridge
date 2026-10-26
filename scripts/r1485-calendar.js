(()=>{
 'use strict';
 const ua=String(navigator.userAgent||'');
 if(/Windows|Electron/i.test(ua)||!/Android|iPhone|iPod|iPad/i.test(ua)||window.pbNativeStorage)return;
 let queued=false;
 function calendarRect(trigger,viewport,dockTop){
  const left=viewport.left+8,width=Math.max(0,Math.min(340,viewport.width-16));
  const minTop=viewport.top+8,maxBottom=Math.max(minTop+1,Math.min(viewport.top+viewport.height,dockTop)-8);
  const height=Math.min(344,maxBottom-minTop),below=trigger.bottom+6;
  const top=below+height<=maxBottom?below:Math.max(minTop,Math.min(trigger.top-height-6,maxBottom-height));
  return {left:left+(viewport.width-16-width)/2,top,width,maxHeight:Math.max(1,maxBottom-top)};
 }
 function paint(){
  queued=false;if(!document.documentElement.classList.contains('pb1482LabPhoneMode'))return;
  const v=window.visualViewport,viewport={left:v?.offsetLeft||0,top:v?.offsetTop||0,width:v?.width||window.innerWidth,height:v?.height||window.innerHeight};
  const dock=document.querySelector('body>.pb1482LabPhoneDock'),edge=dock?.getBoundingClientRect().top??(viewport.top+viewport.height);
  document.querySelectorAll('.labRoleWorkspace .persianDateField').forEach(field=>{
   const popup=field.querySelector('.persianDatePopover'),trigger=field.querySelector('.persianDateTrigger');if(!popup||!trigger)return;
   const rect=calendarRect(trigger.getBoundingClientRect(),viewport,edge);
   for(const [key,value]of Object.entries(rect)){const name='--pb1485-'+key;if(popup.style.getPropertyValue(name)!==value+'px')popup.style.setProperty(name,value+'px');}
  });
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(paint)}}
 function start(){new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);schedule()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
