/* PhotoBridge R100F22 — authoritative Store/Lab nav parity after legacy appearance inline painters. */
(()=>{
  'use strict';
  if(window.__PB_R100F22_STORE_LAB_NAV_PARITY__)return;
  window.__PB_R100F22_STORE_LAB_NAV_PARITY__=true;
  let nav=null,observer=null,rootObserver=null,raf=0;
  const set=(el,p,v)=>{if(el?.style?.getPropertyValue(p)!==v||el.style.getPropertyPriority(p)!=='important')el.style.setProperty(p,v,'important')};
  function paint(){
    raf=0;
    const next=document.getElementById('storeSectionNavV673');
    if(!(next instanceof HTMLElement))return;
    if(next!==nav){
      nav=next;observer?.disconnect?.();
      observer=new MutationObserver(schedule);
      observer.observe(nav,{subtree:true,attributes:true,attributeFilter:['class','style','aria-selected','aria-current']});
    }
    /* Match the Lab row, and neutralize old R100F20 gradient inline paint. */
    set(nav,'background','#f8fafc');
    set(nav,'background-color','#f8fafc');
    set(nav,'background-image','none');
    set(nav,'border-bottom','1px solid #e4e9f1');
    set(nav,'box-shadow','none');
    nav.querySelectorAll(':scope>button').forEach(btn=>{
      const active=btn.classList.contains('active')||btn.getAttribute('aria-selected')==='true';
      if(active){
        set(btn,'background','var(--pb-r100-accent,#1677ff)');
        set(btn,'background-color','var(--pb-r100-accent,#1677ff)');
        set(btn,'background-image','none');
        set(btn,'border-color','var(--pb-r100-accent,#1677ff)');
        set(btn,'color','#fff');
        set(btn,'box-shadow','0 3px 10px rgba(49,94,251,.16)');
      }else{
        set(btn,'background','#fff');
        set(btn,'background-color','#fff');
        set(btn,'background-image','none');
        set(btn,'border-color','#d7deea');
        set(btn,'color','#475467');
        set(btn,'box-shadow','none');
      }
    });
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(paint)}
  function start(){
    paint();
    const root=document.getElementById('storePhotographerWorkspace')||document.body;
    rootObserver=new MutationObserver(schedule);
    rootObserver.observe(root,{subtree:true,childList:true});
    document.addEventListener('click',e=>{if(e.target?.closest?.('#storeSectionNavV673,[data-store-panel]')){schedule();setTimeout(schedule,0);setTimeout(schedule,40)}},true);
    addEventListener('pageshow',schedule,{passive:true});
    for(const ms of [0,60,180,600,1500])setTimeout(schedule,ms);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
