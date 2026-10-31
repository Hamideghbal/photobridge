/* PhotoBridge R100F18 — move the real sale cart from the identity header into the sale filter row. */
(()=>{
  'use strict';
  if(window.__PB_R100F18_STORE_FILTER_CART__)return;
  window.__PB_R100F18_STORE_FILTER_CART__=true;
  let raf=0;
  function mount(){
    raf=0;
    if(!/^\/equipment-rental\/book(?:\/|$)/.test(location.pathname))return;
    const bar=document.getElementById('saleFilterBarR68');
    const cart=document.getElementById('saleCartBtn');
    if(!bar||!cart)return;
    if(cart.parentElement!==bar)bar.appendChild(cart);
    cart.classList.add('pbR100F18SaleFilterCart');
    cart.setAttribute('title','سبد خرید');
    cart.setAttribute('aria-label','سبد خرید');
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(mount)}
  const start=()=>{
    mount();
    const root=document.getElementById('storePhotographerWorkspace')||document.body;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    document.addEventListener('click',e=>{if(e.target.closest?.('[data-store-panel="salesPanel"],#storeSectionNavV673'))setTimeout(schedule,0)},true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
