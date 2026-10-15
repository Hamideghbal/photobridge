(()=>{'use strict';
 // Shop-owner settings UI scoped by the shop's persisted business category.
 const frameType=()=>['frame','chassis','frame_chassis'].includes(String(typeof data!=='undefined'?data?.shop?.business_category:''));
 let queued=false;
 const qa=(selector,root=document)=>[...root.querySelectorAll(selector)];
 function sync(){
  queued=false;
  const frame=frameType();
  document.body.classList.toggle('pb1250ProductionMode',frame);
  const settings=document.getElementById('settings');
  const category=document.querySelector('#shopForm select[name="businessCategory"]');
  if(category){
   const before=category.value;
   const canonical=['frame','chassis','frame_chassis'].includes(before)?'frame_chassis':'equipment_rental_sale';
   const allowed=[['frame_chassis','فروش و تولید قاب و شاسی'],['equipment_rental_sale','فروش و اجاره تجهیزات عکاسی و فیلمبرداری']];
   if(category.options.length!==2||allowed.some(([value,text],i)=>category.options[i]?.value!==value||category.options[i]?.text!==text)){
    category.replaceChildren(...allowed.map(([value,text])=>new Option(text,value)));
    category.value=canonical;
   }
   if(category.disabled)category.disabled=false;
   const activityText=category.closest('label');if(activityText)activityText.classList.add('pb1250ShopCategoryField');
  }
  if(settings){
   // Rental configuration has no meaning for a manufacturing-only store.
   qa('section,.settingsGroup,.box',settings).forEach(el=>{
    if(el.id==='pbR100F9StaffSettings'){el.hidden=frame;return;}
    if(el.classList.contains('settingsGroup')&&el.classList.contains('reachSettingsGroup')){el.classList.toggle('pb1250RentalReachRemoved',frame);return;}
    const heading=el.querySelector(':scope > h2,:scope > h3,:scope > strong');
    const title=heading?.textContent?.trim()||'';
    if(/شابلون تعهدنامه|قالب تعهدنامه|پذیرش.*اجاره|کسری تجهیزات|پرسنل تحویل/.test(title))el.classList.toggle('pb1250RentalSettingsRemoved',frame);
   });
  }
  const list=document.getElementById('photographerList');
  if(list&&frame){
   qa('thead th',list).forEach(cell=>{
    if(cell.textContent.includes('رزرو'))cell.textContent='سفارش‌ها';
    if(cell.textContent.includes('ودیعه')||cell.textContent.includes('مدرک ضمانت'))cell.classList.add('pb1250RentalCollateral');
   });
   qa('button[onclick*="editPhotographerCollateral"]',list).forEach(button=>button.classList.add('pb1250RentalCollateral'));
   qa('.pb860PhotographerDetails > div',list).forEach(block=>{
    if(block.querySelector(':scope>strong')?.textContent.includes('ودیعه'))block.classList.add('pb1250RentalCollateral');
   });
   qa('tbody tr',list).forEach(row=>{
    const th=qa('thead th',list),idx=th.findIndex(c=>c.classList.contains('pb1250RentalCollateral'));
    if(idx>=0&&row.children[idx])row.children[idx].classList.add('pb1250RentalCollateral');
   });
  }
  if(frame){
   qa('#photographerList .pb861PhotographerCell small,#photographerList .pb860PhotographerFact small,#pb884PhotographerModal small,#photographerList th').forEach(el=>{
    if(el.textContent.trim()==='رزروها'||el.textContent.trim()==='تعداد رزرو')el.textContent=el.textContent.includes('تعداد')?'تعداد سفارش':'سفارش‌ها';
   });
  }
 }
 function enqueue(){if(queued)return;queued=true;requestAnimationFrame(sync)}
 function begin(){
  enqueue();
  const settings=document.getElementById('settings'),list=document.getElementById('photographerList');
  if(settings)new MutationObserver(enqueue).observe(settings,{childList:true,subtree:true});
  if(list)new MutationObserver(enqueue).observe(list,{childList:true,subtree:true});
  document.addEventListener('change',e=>{
   if(e.target?.matches?.('#shopForm select[name="businessCategory"]'))document.body.classList.toggle('pb1250ProductionMode',e.target.value==='frame_chassis');
  });
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pb851-settings-tab],#saveSmsSettings,.pb861PhotographerCard'))setTimeout(enqueue,120)});
  setTimeout(enqueue,700);setInterval(enqueue,4500);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',begin,{once:true});else begin();
})();