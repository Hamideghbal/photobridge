/* PhotoBridge R100F21 — move the live sale checkout/pre-order notice into the cart drawer. */
(()=>{
  'use strict';
  if(window.__PB_R100F21_SALE_CART_NOTICE__)return;
  window.__PB_R100F21_SALE_CART_NOTICE__=true;
  let raf=0;
  function mount(){
    raf=0;
    if(!/^\/equipment-rental\/book(?:\/|$)/.test(location.pathname))return;
    const notice=document.getElementById('salesCheckoutNotice');
    const drawer=document.getElementById('saleCartDrawer');
    const footer=drawer?.querySelector('.saleCartFooter');
    if(!notice||!drawer||!footer)return;
    notice.classList.add('saleCartPreorderNoticeV21');
    if(notice.parentElement!==drawer)drawer.insertBefore(notice,footer);
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(mount)}
  function start(){
    mount();
    const root=document.getElementById('storePhotographerWorkspace')||document.body;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    document.addEventListener('click',e=>{
      if(e.target?.closest?.('#saleCartBtn,[data-store-panel="salesPanel"],#storeSectionNavV673'))setTimeout(schedule,0);
    },true);
    for(const ms of [0,50,180,600])setTimeout(schedule,ms);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
