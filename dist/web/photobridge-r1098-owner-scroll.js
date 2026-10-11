/* PB R1098 — recover mobile store scrolling after tab/modal transitions. */
(()=>{
'use strict';
const q=s=>document.querySelector(s);
const actualOverlayOpen=()=>{
 const b=document.body;
 if(!b)return false;
 if(['rentalItemModalOpen','saleItemModalOpen','pb904r27ManualOpen'].some(x=>b.classList.contains(x)))return true;
 const selectors=[
  '#pb892ManualBackdrop.open',
  '#pb884PhotographerModal.open',
  '#pb834GalleryBackdrop.open',
  '#pb922InvoiceModal:not([hidden])',
  '#pb921ManagedSheet:not([hidden])',
  '#pbR1076Registration',
  '.storeNoticeBackdrop:not([hidden])',
  '[role="dialog"][aria-modal="true"].open'
 ];
 return selectors.some(s=>q(s));
};
let frame=0,timer=0;
function recover(){
 frame=0;timer=0;
 if(actualOverlayOpen())return;
 const body=document.body,root=document.documentElement;
 if(!body||!root)return;
 for(const el of [body,root]){
  if(el.style.getPropertyValue('overflow')==='hidden')el.style.removeProperty('overflow');
  if(el.style.getPropertyValue('overflow-y')==='hidden')el.style.removeProperty('overflow-y');
  el.style.removeProperty('touch-action');
 }
 const active=q('#app>.panel.active');
 if(active){
  if(active.style.getPropertyValue('overflow')==='hidden')active.style.removeProperty('overflow');
  if(active.style.getPropertyValue('overflow-y')==='hidden')active.style.removeProperty('overflow-y');
  active.style.removeProperty('touch-action');
 }
 // Force WebKit/Chromium to recalculate the page scroller without changing scroll position.
 void (document.scrollingElement||root).clientHeight;
}
function schedule(){
 if(!frame)frame=requestAnimationFrame(recover);
 clearTimeout(timer);timer=setTimeout(recover,80);
}
const old=window.selectRentalTab;
if(typeof old==='function'){
 window.selectRentalTab=function(tab,opts){
  const out=old.call(this,tab,opts);
  schedule();setTimeout(schedule,180);
  return out;
 };
 try{selectRentalTab=window.selectRentalTab}catch{}
}
document.addEventListener('click',e=>{
 if(e.target.closest?.('#rentalDesktopPrimaryNav [data-rental-desktop-tab],#rentalMobileBottomNav [data-rental-bottom-tab],#rentalMobileDrawer [data-rental-tab],#tabs [data-tab]'))schedule();
},true);
window.addEventListener('pageshow',schedule,{passive:true});
window.addEventListener('resize',schedule,{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
const app=q('#app');if(app)new MutationObserver(schedule).observe(app,{subtree:false,childList:false,attributes:true,attributeFilter:['class']});
schedule();
})();
