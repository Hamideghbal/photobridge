/* R1096: customer-store channel visibility follows the chosen store's real switches. */
(()=>{
 'use strict';
 if(window.__PB_R1096_SHOPPER_CHANNELS__)return;
 window.__PB_R1096_SHOPPER_CHANNELS__=true;
 const q=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
 const channelFor=id=>id==='equipmentPanel'?'rental_enabled':id==='salesPanel'?'sale_enabled':null;
 const selected=()=>{try{return shopId?selectedShopRecord():null}catch{return null}};
 const isAllowed=(id,shop=selected())=>{const key=channelFor(id);return !key||!shop||shop[key]!==false};
 const fallback=shop=>isAllowed('equipmentPanel',shop)?'equipmentPanel':isAllowed('salesPanel',shop)?'salesPanel':'bookingsPanel';
 function toggleButton(btn,hidden){
  if(!btn)return;
  if(btn.hidden!==hidden)btn.hidden=hidden;
  btn.disabled=hidden;
  if(hidden){btn.setAttribute('aria-hidden','true');btn.tabIndex=-1;btn.style.setProperty('display','none','important')}
  else{btn.removeAttribute('aria-hidden');btn.removeAttribute('tabindex');btn.style.removeProperty('display')}
 }
 function togglePanel(panel,hidden){
  if(!panel)return;
  if(panel.hidden!==hidden)panel.hidden=hidden;
  if(hidden){panel.setAttribute('aria-hidden','true');panel.style.setProperty('display','none','important')}
  else{panel.removeAttribute('aria-hidden');panel.style.removeProperty('display')}
 }
 let applying=false;
 function syncChannels(redirect=true){
  if(applying)return;
  applying=true;
  try{
   const shop=selected();
   for(const id of ['equipmentPanel','salesPanel']){
    const off=!isAllowed(id,shop);
    all('[data-store-panel="'+id+'"]').forEach(btn=>toggleButton(btn,off));
    togglePanel(q('#'+id),off);
   }
   const nav=q('#storeSectionNavV673');
   if(nav){
    const count=all('#storeSectionNavV673 > button[data-store-panel]').filter(btn=>!btn.hidden).length;
    nav.style.setProperty('grid-template-columns','repeat('+Math.max(1,count)+',minmax(0,1fr))','important');
   }
   if(shop&&redirect){
    const active=q('#storeSectionNavV673 [data-store-panel].active')?.dataset.storePanel
     ||q('.rentalPanel.mobileActive')?.id;
    if(active&&!isAllowed(active,shop))openStoreSection(fallback(shop));
   }
  }finally{applying=false}
 }
 // The original router remains responsible for desktop scrolling, responsive
 // panel selection, history and header/cart state. We only restrict channels.
 if(typeof openStoreSection==='function'){
  const original=openStoreSection;
  openStoreSection=function(id){
   syncChannels(false);
   const shop=selected();
   return original.call(this,isAllowed(id,shop)?id:fallback(shop));
  };
 }
 if(typeof renderShops==='function'){
  const original=renderShops;
  renderShops=function(...args){const res=original.apply(this,args);syncChannels(false);return res};
 }
 if(typeof selectShop==='function'){
  const original=selectShop;
  selectShop=async function(...args){const res=await original.apply(this,args);syncChannels(true);return res};
 }
 // Capturing guard also handles alternative navigation widgets and restores
 // accessibility if a store was changed while the UI was still visible.
 document.addEventListener('click',event=>{
  const btn=event.target.closest?.('[data-store-panel]');
  if(!btn)return;
  const shop=selected();
  if(shop&&!isAllowed(btn.dataset.storePanel,shop)){
   event.preventDefault();event.stopImmediatePropagation();
   openStoreSection(fallback(shop));
  }
 },true);
 function start(){syncChannels(true)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
 window.pbR1096SyncShopChannels=syncChannels;
})();
