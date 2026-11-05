/* R1599: one role-owned bottom dock on mobile, including finance/invoice routes.
   Ignore stale Lab React elements when Photographer logs in immediately after Lab logout.
   Only hide stray UI; never unmount or click a React-owned navigation element. */
(()=>{
 'use strict';
 if(window.PB1598PhotographerDock)return;
 window.PB1598PhotographerDock=true;
 if(typeof matchMedia!=='function')return;
 const phone=matchMedia('(max-width:820px)');
 const isPhone=()=>phone.matches&&!window.pbNativeStorage;
 const role=()=>/^\/lab(?:\/|$)/.test(location.pathname)?'lab':
     /^\/photographer(?:\/|$)/.test(location.pathname)?'photographer':
     /^\/(?:rental|equipment-rental)(?:\/|$)/.test(location.pathname)?'rental':'';
 const roleClasses=['pb1599LabRoute','pb1599PhotographerRoute','pb1599RentalRoute'];
 let frame=0;
 function sync(){
   frame=0;
   const html=document.documentElement;
   const owner=isPhone()?role():'';
   roleClasses.forEach((cls,index)=>html.classList.toggle(cls,
     (owner==='lab'&&index===0)||(owner==='photographer'&&index===1)||(owner==='rental'&&index===2)));
   const modal=owner==='photographer' &&
     Boolean(document.querySelector('.globalInvoicePreviewLayer .customerInvoicePreview'));
   html.classList.toggle('pb1598CustomerInvoiceOpen',modal);
   const navs=[...document.querySelectorAll(
     'nav.photographerMobileUtilityRail:not(.labBottomAppNav):not(.labMobileUtilityRail),'+
     'nav.photographerBottomAppNav[aria-label="ناوبری اصلی عکاس"]'
   )].filter((nav,index,array)=>array.indexOf(nav)===index);
   const visible=nav=>typeof nav.getClientRects==='function'?nav.getClientRects().length>0:true;
   const current=navs.filter(nav=>nav.closest('.photographerMain')&&visible(nav));
   const primary=current[0]||navs.find(visible)||navs[0];
   navs.forEach(nav=>{
     if(owner==='photographer'&&nav!==primary)
       nav.setAttribute('data-pb1598-duplicate','1');
     else nav.removeAttribute('data-pb1598-duplicate');
   });
   // Lab's detached dock was created by an older global mobile script. Hide it
   // by route before it can double the Photographer finance bar.
   const stray=document.querySelectorAll('body > nav.pb1482LabPhoneDock');
   stray.forEach(nav=>{if(owner!=='lab')nav.setAttribute('data-pb1599-wrong-role','1');
     else nav.removeAttribute('data-pb1599-wrong-role')});
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(sync)}
 function start(){
   new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','style','aria-label']});
   window.addEventListener('popstate',schedule);
   window.addEventListener('pageshow',schedule);
   window.addEventListener('resize',schedule,{passive:true});
   if(phone.addEventListener)phone.addEventListener('change',schedule);
   else if(phone.addListener)phone.addListener(schedule);
   for(const key of ['pushState','replaceState']){
     if(typeof history==='undefined')continue;
     const old=history[key];
     if(typeof old==='function'&&!old.__pb1599RoleSync){
       const fn=function(){const v=old.apply(this,arguments);schedule();return v};
       fn.__pb1599RoleSync=true;history[key]=fn;
     }
   }
   schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();