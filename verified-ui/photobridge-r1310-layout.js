/* R1310: shared desktop gallery frame and measured mobile Print viewport. */
(()=>{
 'use strict';
 if(window.__PB1310_LAYOUT__)return;window.__PB1310_LAYOUT__=true;
 const root=document.documentElement;
 const qs=(s,r=document)=>r?.querySelector(s);
 const mobile=()=>matchMedia('(max-width:820px)').matches;
 const set=(el,name,value,priority='')=>{if(el&&(el.style.getPropertyValue(name)!==value||el.style.getPropertyPriority(name)!==priority))el.style.setProperty(name,value,priority);};
 function bounds(el){
  if(!el||el.hidden)return null;
  const style=getComputedStyle(el);if(style.display==='none'||style.visibility==='hidden')return null;
  const box=el.getBoundingClientRect();return box.height>0&&box.width>0?box:null;
 }
 function geometry(w){
  if(root.classList.contains('pb1126Embedded'))return null;
  const height=innerHeight,viewport=window.visualViewport;
  const start=Math.max(0,Number(viewport?.offsetTop||0));
  const end=Math.min(height,start+Number(viewport?.height||height));
  let top=start,bottomEdge=end;
  for(const el of document.querySelectorAll('#pbF37PhotographerHeader,#pbF37Subheader,#pbF37PrintComposerActions,.photographerPrintModeHeader,.photographerPrintModeNav,#pb761-mode-actions')){
   if(qs('.photographerRolePageScrollArea',w)?.contains(el))continue;
   const box=bounds(el);if(box&&box.bottom>start&&box.top<end&&box.bottom<end-64)top=Math.max(top,box.bottom);
  }
  for(const el of document.querySelectorAll('.photographerBottomAppNav,.photographerMobileUtilityRail,#photographerStoreBottomNav')){
   const box=bounds(el);if(box&&box.bottom>start&&box.top<end&&box.top>=top)bottomEdge=Math.min(bottomEdge,box.top);
  }
  return {top:Math.ceil(top),bottom:Math.max(0,Math.ceil(height-bottomEdge))};
 }
 window.pb1310PrintGeometry=geometry;
 let pending=false,observer=null,observed=[];
 function sync(){
  pending=false;
  const active=qs('#pb1126DesktopHeader [data-pb1126-kind].active')?.dataset.pb1126Kind;
  const gallery=!mobile()&&root.classList.contains('pb1126Desktop')&&active==='gallery'&&!!qs('.clientGalleryWorkspace')&&!qs('.clientGalleryManager');
  root.classList.toggle('pb1310GalleryHome',gallery);
  const w=qs('.photographerMain.photographerPrintWorkspace');
  const on=mobile()&&!!w&&!root.classList.contains('pb1126Embedded')&&!qs('#pbR99LabChooser');
  root.classList.toggle('pb1310MobilePrint',on);
  if(on){
   const scroll=qs(':scope>.photographerRolePageScrollArea',w),box=geometry(w);
   set(w,'--pb761-content-top',box.top+'px');set(w,'--pb761-content-bottom',box.bottom+'px');
   set(w,'--pb1310-print-top',box.top+'px');set(w,'--pb1310-print-bottom',box.bottom+'px');
   if(scroll){for(const [key,value]of Object.entries({position:'fixed',/* PB1317 mobile scroll insets */inset:box.top+'px 0px '+box.bottom+'px 0px',top:box.top+'px',bottom:box.bottom+'px',left:'0px',right:'0px',width:'100%',height:'auto','min-height':'0px','max-height':'none',margin:'0px','box-sizing':'border-box','overflow-y':'auto','overflow-x':'hidden'}))set(scroll,key,value,'important');}
  }
  if(observer){
   const next=[...document.querySelectorAll('#pbF37PhotographerHeader,#pbF37Subheader,#pbF37PrintComposerActions,.photographerPrintModeHeader,.photographerPrintModeNav,.photographerBottomAppNav,.photographerMobileUtilityRail')];
   if(next.length!==observed.length||next.some((el,i)=>el!==observed[i])){observer.disconnect();for(const el of next)observer.observe(el);observed=next;}
  }
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(sync);}}
 function boot(){
  if(typeof ResizeObserver==='function')observer=new ResizeObserver(schedule);
  new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'||m.target.matches?.('.photographerMain,[data-pb1126-kind],#pb1126DesktopHeader')))schedule();}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  addEventListener('resize',schedule,{passive:true});addEventListener('orientationchange',schedule,{passive:true});addEventListener('popstate',schedule);
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
  schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
