/* R1073: mobile Office uses a day strip; desktop retains the month calendar. */
(()=>{
 const q=(s,r=document)=>r.querySelector(s),mobile=()=>matchMedia('(max-width:850px)').matches;
 const today=()=>window.pbR17TehranIsoDate?.()||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const store=()=>typeof data!=='undefined'?data:window.data;
 let selected='',frame=0,lastSignature='';
 function center(rail,button,smooth){if(!button)return;const r=rail.getBoundingClientRect(),b=button.getBoundingClientRect();rail.scrollTo({left:Math.max(0,Math.min(rail.scrollWidth-rail.clientWidth,rail.scrollLeft+b.left+b.width/2-r.left-r.width/2)),behavior:smooth?'smooth':'auto'})}
 function paint(){
  frame=0;
  // Legacy status renderers must never restore separate handover navigation.
  document.querySelectorAll('#pb848BookingHeaderTabs [data-pb843-office-tab="approved"],#pb848BookingHeaderTabs [data-pb843-office-tab="out"],.pbR100F9StaffTabs [data-staff-mode="in"]').forEach(button=>button.remove());
  const bottom=q('#rentalMobileBottomNav');
  if(bottom){const n=[...bottom.querySelectorAll(':scope > button')].filter(b=>!b.hidden&&b.dataset.pbChannelOff!=='true'&&getComputedStyle(b).display!=='none').length;const columns=String(Math.max(1,n));if(bottom.style.getPropertyValue('--pb-office-nav-count')!==columns)bottom.style.setProperty('--pb-office-nav-count',columns)}
  if(!mobile()){lastSignature='';return}
  if(document.body.classList.contains('pbR100F9StaffMode'))return;
  const pane=q('#bookings [data-pb843-office-pane="calendar"].active .pb843BookingCalendarBox');if(!pane)return;
  const bookings=(store()?.bookings||[]).filter(b=>!['cancelled','rejected'].includes(b.status));
  if(!valid(selected))selected=today();
  const dates=new Set([today(),selected]);
  for(const b of bookings){let d=String(b.rental_start||'').slice(0,10),end=String(b.rental_end||'').slice(0,10);if(!valid(d)||!valid(end))continue;for(let n=0;d<=end&&n<366;n++,d=new Date(Date.parse(d+'T12:00:00Z')+86400000).toISOString().slice(0,10))dates.add(d)}
  const days=[...dates].sort(),rows=bookings.filter(b=>String(b.rental_start).slice(0,10)<=selected&&String(b.rental_end).slice(0,10)>=selected);
  const signature=JSON.stringify([selected,bookings]);if(signature===lastSignature&&q('#pbR1073OfficeRail',pane))return;lastSignature=signature;
  let host=q('#pbR1073MobileOffice',pane);if(!host){host=document.createElement('section');host.id='pbR1073MobileOffice';pane.append(host)}
  const oldRail=q('#pbR1073OfficeRail',host),scroll=oldRail?.scrollLeft||0;
  host.innerHTML='<div id="pbR1073OfficeRail" class="pbR1073OfficeRail" aria-label="انتخاب روز آفیش">'+days.map(d=>window.pbR100F86DateButton?.({d,count:bookings.filter(b=>String(b.rental_start).slice(0,10)<=d&&String(b.rental_end).slice(0,10)>=d).length,selected,today:today(),staff:true}).replace('data-staff-day=','data-office-day=')||'<button data-office-day="'+d+'">'+escape(d)+'</button>').join('')+'</div><button type="button" id="pbR1073Register">ثبت آفیش</button><div id="pbR1073OfficeRows">'+(rows.length?rows.map(b=>window.pbR100F86Card?.(b,['picked_up','returned'].includes(b.status)?'in':'out','','',{manager:true})||'<article>'+escape(b.photographer_name||b.customer_mobile||'عکاس')+'</article>').join(''):'<div class="empty">برای این روز آفیشی ثبت نشده است.</div>')+'</div>';
  const rail=q('#pbR1073OfficeRail',host);rail.scrollLeft=scroll;
  rail.querySelectorAll('[data-office-day]').forEach(button=>button.onclick=()=>{selected=button.dataset.officeDay;paint();center(q('#pbR1073OfficeRail'),q('[data-office-day="'+selected+'"]'),true)});
  const register=q('#pbR1073Register',host);register.disabled=selected<today();register.onclick=()=>window.pbR1073RegisterOfficeDay?.(selected);
  if(!oldRail)center(rail,q('[data-office-day="'+selected+'"]',rail),false);
 }
 const original=window.pb843RenderCalendar;if(typeof original==='function'){const wrapped=function(...args){const out=original.apply(this,args);schedule();return out};window.pb843RenderCalendar=wrapped;try{pb843RenderCalendar=wrapped}catch{}}
 function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','data-pb-channel-off']});
 window.addEventListener('resize',schedule,{passive:true});window.pbR1073PaintMobileOffice=paint;schedule();
})();
