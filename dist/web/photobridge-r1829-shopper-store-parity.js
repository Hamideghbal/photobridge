/* R1829: Store shopper parity - equipment camera stores only; never alter lab or frame/chassis. */
(()=>{
 'use strict';
 if(window.__PB_R1829_SHOPPER_STORE__)return;
 window.__PB_R1829_SHOPPER_STORE__=true;
 const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
 const cameraShop=shop=>['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(shop?.business_category||''));
 const allowed=(shop,channel)=>cameraShop(shop)&&shop[channel]!==false;
 window.pbR1829ShopperChannelEnabled=allowed;
 let queued=false,observed=null,observer=null;
 const active=()=>document.body.classList.contains('rentalPhotographerMode')&&!document.body.classList.contains('pbR96ChoosingStore')&&!!q('#storePhotographerWorkspace');
 function sync(){
  queued=false;
  if(!active()||typeof selectedShopRecord!=='function'){document.body.classList.remove('pbR1829CameraShopper');return;}
  const shop=selectedShopRecord();
  document.body.classList.toggle('pbR1829CameraShopper',cameraShop(shop));
  if(!cameraShop(shop))return;
  const canSale=allowed(shop,'sale_enabled'),canRent=allowed(shop,'rental_enabled');
  const navs=qa('#pbR1123StoreDesktopNav [data-store-panel="salesPanel"],#storeSectionNavV673 [data-store-panel="salesPanel"],.storeHomeActionsV671 [data-store-panel="salesPanel"]');
  for(const button of navs){
   if(button.hidden===canSale)button.hidden=!canSale;
   if(button.disabled===canSale)button.disabled=!canSale;
   if(canSale){button.removeAttribute('aria-hidden');button.removeAttribute('tabindex');if(button.style.getPropertyValue('display')==='none')button.style.removeProperty('display');}
   else {button.setAttribute('aria-hidden','true');button.tabIndex=-1;}
  }
  const saleCart=q('#saleCartBtn');
  if(saleCart&&!canSale){saleCart.hidden=true;saleCart.style.setProperty('display','none','important')}
  const desktop=q('#pbR1123StoreDesktopNav [data-store-panel="salesPanel"]');
  if(desktop&&canSale&&desktop.textContent.trim()!=='خرید تجهیزات')desktop.textContent='خرید تجهیزات';
  const mobile=q('#storeSectionNavV673 [data-store-panel="salesPanel"]');
  if(mobile&&canSale&&mobile.textContent.trim()!=='خرید تجهیزات')mobile.textContent='خرید تجهیزات';
  // Hide duplicate category action only if the functional compact category picker exists.
  const extra=q('#saleFilterBarR68 #saleCategoryBtnR68');
  const picker=q('#salesPanel .pbR67FilterToolbar [data-r67-cat]');
  if(extra&&picker&&!extra.hidden){extra.hidden=true;extra.style.setProperty('display','none','important')}
  // Preserve the existing sales cart, API-backed catalogue and shop channel permissions.
  const panel=q('#salesPanel');
  if(panel&&canSale&&panel.hidden)panel.hidden=false;
  if(!canSale&&panel&&!panel.hidden)panel.hidden=true;
  if(!canRent&&!canSale)return;
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}
 function observe(){
  const shopNav=q('#storeSectionNavV673');
  if(shopNav&&shopNav!==observed){observer?.disconnect();observed=shopNav;observer=new MutationObserver(schedule);observer.observe(shopNav,{attributes:true,subtree:true,attributeFilter:['class','hidden','aria-hidden','aria-selected']})}
 }
 function start(){schedule();observe();document.addEventListener('click',e=>{if(e.target.closest?.('[data-rental-shop-id],[data-store-panel],#storeIdentityToggle,#storeSectionNavV673')){setTimeout(schedule,30);setTimeout(schedule,250)}},true);addEventListener('pageshow',schedule,{passive:true});addEventListener('popstate',schedule,{passive:true});setInterval(()=>{observe();if(active())schedule()},2500)}
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
