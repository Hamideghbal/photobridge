(()=>{'use strict';
 // Move the REAL photo/video-store category control beside its cart,
 // preserving the existing category chooser and filtering callbacks.
 let slot=null,queued=false;
 function sync(){
  queued=false;
  const button=document.getElementById('saleCategoryBtnR68');
  const isCamera=Boolean(document.body.classList.contains('rentalPhotographerMode')&&!document.body.classList.contains('frameCustomerStore'));
  const mobile=matchMedia('(max-width:820px)').matches;
  const header=document.getElementById('photographerStoreIdentityBar');
  const cart=header?.querySelector('#saleCartBtn,.rentalCartBtnV810,.saleCartBtn');
  const show=Boolean(isCamera&&mobile&&header&&cart&&!document.body.classList.contains('pbR96ChoosingStore'));
  if(show&&button){
   if(!slot){slot=document.createComment('Frame store original category location');button.parentNode?.insertBefore(slot,button);}
   if(button.parentNode!==header||button.nextSibling!==cart)header.insertBefore(button,cart);
   button.classList.add('pb1249CategoryHeader');
  }else if(button&&slot?.parentNode){
   slot.parentNode.insertBefore(button,slot);button.classList.remove('pb1249CategoryHeader');
  }
 }
 function queue(){if(queued)return;queued=true;requestAnimationFrame(sync)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
 window.addEventListener('resize',queue,{passive:true});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-store-panel],[data-store-home],.shopCard'))queue()},true);
 setTimeout(queue,250);setTimeout(queue,1000);
})();