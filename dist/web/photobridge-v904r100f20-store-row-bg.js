/* PhotoBridge R100F20 — keep Store section-nav surface on the same soft blue as the filter dock, even after appearance scripts repaint inline styles. */
(()=>{
  'use strict';
  if(window.__PB_R100F20_STORE_ROW_BG__)return;
  window.__PB_R100F20_STORE_ROW_BG__=true;
  const BG='linear-gradient(180deg, rgba(238, 248, 255, 0.98) 0%, rgba(241, 249, 255, 0.86) 46%, rgba(246, 251, 255, 0.44) 100%)';
  const COLOR='#eef8ff';
  let nav=null,navObserver=null,raf=0,rootObserver=null;

  function painted(el){
    if(!(el instanceof HTMLElement))return false;
    const bg=String(el.style.getPropertyValue('background')||'').toLowerCase();
    const img=String(getComputedStyle(el).backgroundImage||'').toLowerCase();
    return (bg.includes('linear-gradient')||img.includes('linear-gradient')) && el.style.getPropertyPriority('background')==='important';
  }
  function apply(){
    raf=0;
    const el=document.getElementById('storeSectionNavV673');
    if(!(el instanceof HTMLElement))return;
    if(!painted(el)){
      el.style.setProperty('background',BG,'important');
      el.style.setProperty('background-color',COLOR,'important');
      el.style.setProperty('border-bottom-color','rgba(183,211,238,.34)','important');
    }
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(apply)}
  function bind(){
    const next=document.getElementById('storeSectionNavV673');
    if(next===nav){schedule();return}
    nav=next;
    navObserver?.disconnect?.();navObserver=null;
    if(nav instanceof HTMLElement){
      navObserver=new MutationObserver(schedule);
      navObserver.observe(nav,{attributes:true,attributeFilter:['style','class']});
      apply();
    }
  }
  function start(){
    bind();
    const root=document.getElementById('storePhotographerWorkspace')||document.body;
    rootObserver=new MutationObserver(()=>{bind();schedule()});
    rootObserver.observe(root,{childList:true,subtree:true});
    document.addEventListener('click',e=>{if(e.target?.closest?.('#storeSectionNavV673,[data-store-panel],#saleFilterBarR68,#rentalFilterBarR68'))setTimeout(schedule,0)},true);
    addEventListener('pageshow',schedule,{passive:true});
    addEventListener('focus',schedule,{passive:true});
    for(const ms of [0,40,120,320,900,1800])setTimeout(schedule,ms);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
