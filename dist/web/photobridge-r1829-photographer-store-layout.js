/* R1829: equipment-store view within photographer portal only. */
(()=>{
'use strict';
if(window.__PB_R1829_STORE_SHOPPER__)return;window.__PB_R1829_STORE_SHOPPER__=true;
const getRoot=()=>document.getElementById('storePhotographerWorkspace');
const visible=e=>!!(e&&e.getClientRects().length&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden');
const inStore=()=>location.pathname.startsWith('/photographer')&&visible(getRoot());
const saved=new WeakMap(),lab=/^(?:تعرفه\s*لابراتوار|تعریف\s*لابراتوار|دعوت\s*همکار|موقعیت\s*عکاسی)$/;
let queued=false;
function fixHeader(){
 document.querySelectorAll('header button,header a,.photographerHeaderNav button,.photographerHeaderNav a,.photographerSecondaryHeader button,.photographerSecondaryHeader a').forEach(el=>{
  if(getRoot()?.contains(el)||el.closest('#photographerStoreRoleHeader'))return;
  if(!lab.test(String(el.textContent||'').replace(/\s+/g,' ').trim()))return;
  if(inStore()){
   if(!saved.has(el))saved.set(el,{value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});
   el.dataset.pbR1829Hidden='1';el.style.setProperty('display','none','important');
  }else if(el.dataset.pbR1829Hidden==='1'){
   const prev=saved.get(el);if(prev?.value)el.style.setProperty('display',prev.value,prev.priority);else el.style.removeProperty('display');
   delete el.dataset.pbR1829Hidden;saved.delete(el);
  }
 });
}
function fixSales(){
 if(!inStore())return;
 const r=getRoot(),nav=r.querySelector('#storeSectionNavV673'),panel=r.querySelector('#salesPanel');
 let shop;try{shop=typeof selectedShopRecord==='function'?selectedShopRecord():null}catch{}
 if(!nav||!panel||!shop||shop.sale_enabled===false)return;
 let b=nav.querySelector('[data-store-panel="salesPanel"]');
 if(!b){
  b=document.createElement('button');b.type='button';b.dataset.storePanel='salesPanel';b.textContent='فروش تجهیزات';
  b.addEventListener('click',()=>{if(typeof openStoreSection==='function')openStoreSection('salesPanel')});
  const rental=nav.querySelector('[data-store-panel="equipmentPanel"]');if(rental)rental.insertAdjacentElement('afterend',b);else nav.appendChild(b);
 }
 if(b.hidden||b.getAttribute('aria-hidden')==='true'){b.hidden=false;b.disabled=false;b.removeAttribute('aria-hidden');b.style.removeProperty('display')}
 if(panel.hidden||panel.getAttribute('aria-hidden')==='true'){panel.hidden=false;panel.removeAttribute('aria-hidden');panel.style.removeProperty('display')}
}
function fixCategory(){
 if(!inStore())return;
 for(const b of getRoot().querySelectorAll('button')){
  if(String(b.textContent||'').replace(/\s+/g,' ').trim()!=='دسته‌بندی')continue;
  if(b.closest('#equipmentPanel,#salesPanel,.pbR67FilterToolbar'))continue;
  const row=b.parentElement;if(row&&[...row.querySelectorAll('button')].some(x=>/سبد\s*خرید/.test(x.textContent||''))){b.hidden=true;b.style.setProperty('display','none','important')}
 }
}
function sync(){queued=false;fixHeader();fixSales();fixCategory()}
function schedule(){if(!queued){queued=true;requestAnimationFrame(sync)}}
function init(){
 const node=document.getElementById('root')||document.body;
 new MutationObserver(schedule).observe(node,{childList:true,subtree:true});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-store-panel],.photographerHeaderNav button'))setTimeout(schedule,50)},true);
 addEventListener('popstate',schedule);addEventListener('focus',schedule);schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();