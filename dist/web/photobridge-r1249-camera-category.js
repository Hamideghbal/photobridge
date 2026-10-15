(()=>{'use strict';
 // Move the ORIGINAL chooser; do not duplicate its click/filter state.
 let origin=null,queued=false;
 function sync(){
  queued=false;
  const button=document.getElementById('saleCategoryBtnR68');
  if(!button)return;
  const isCustomer=document.body.classList.contains('rentalPhotographerMode');
  const frame=isCustomer&&document.body.classList.contains('frameCustomerStore');
  const camera=isCustomer&&!frame;
  const mobile=matchMedia('(max-width:820px)').matches;
  const nav=frame?document.getElementById('frameCustomerNav'):document.getElementById('photographerStoreIdentityBar');
  const cart=frame?nav?.querySelector('[data-frame-customer-cart]'):nav?.querySelector('#saleCartBtn,.rentalCartBtnV810,.saleCartBtn');
  const show=(frame||camera)&&mobile&&nav&&cart&&!document.body.classList.contains('pbR96ChoosingStore');
  if(show){
   if(!origin||!origin.parent?.isConnected){origin={parent:button.parentNode,marker:document.createComment('Category original slot')};button.parentNode?.insertBefore(origin.marker,button);}
   if(button.parentNode!==nav||button.nextElementSibling!==cart)nav.insertBefore(button,cart);
   button.hidden=false;button.style.removeProperty('display');
   button.classList.toggle('pb1249CategoryHeader',camera);
   button.classList.toggle('pb1250FrameCategoryHeader',frame);
  }else if(origin?.marker?.parentNode){
   origin.marker.parentNode.insertBefore(button,origin.marker);
   origin.marker.remove();origin=null;
   button.classList.remove('pb1249CategoryHeader','pb1250FrameCategoryHeader');
  }
 }
 const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(sync)};
 function start(){
  queue();window.addEventListener('resize',queue,{passive:true});
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-store-panel],[data-store-home],[data-frame-customer-view],.shopCard'))queue()},true);
  // Legacy frame tab renderer may move the chooser back to its old slot.
  setInterval(queue,1800);setTimeout(queue,350);setTimeout(queue,1100);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();