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
  const tabs=q('#pb848BookingHeaderTabs'),requests=tabs?.querySelector('[data-pb843-office-tab="pending"]'),office=tabs?.querySelector('[data-pb843-office-tab="calendar"]');
  if(requests&&office&&requests.nextElementSibling!==office)office.before(requests);
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
  const register=q('#pbR1073Register',host);register.onclick=beginRegistration;
  if(!oldRail)center(rail,q('[data-office-day="'+selected+'"]',rail),false);
 }
 function beginRegistration(){
  q('#pbR1076Registration')?.querySelector('[data-register-close]')?.click();
  const back=document.createElement('div');back.id='pbR1076Registration';
  back.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="pbR1076RegistrationTitle"><header><b id="pbR1076RegistrationTitle">انتخاب روزهای آفیش</b><button type="button" data-register-close aria-label="بستن">×</button></header><p>روزهای پیوسته موردنظر را انتخاب کنید.</p><div data-register-calendar></div><p role="alert"></p><footer><span data-register-count></span><button type="button" data-register-clear>پاک کردن</button><button type="button" data-register-next disabled>ادامه ثبت آفیش</button></footer></section>';
  const picked=new Set(),overflow=document.body.style.overflow,focus=document.activeElement;let month=today();
  const add=(day,n)=>new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
  const close=()=>{back.remove();document.body.style.overflow=overflow;document.removeEventListener('keydown',escapeKey);focus?.focus({preventScroll:true})};
  const escapeKey=e=>{if(e.key==='Escape'){e.preventDefault();close()}};
  back.querySelector('[data-register-close]').onclick=close;back.onclick=e=>{if(e.target===back)close()};document.addEventListener('keydown',escapeKey);
  const draw=()=>{
   const p=window.jalaliPartsFromIso(month),iso=d=>window.jalaliInputToIso(`${p.year}/${p.month}/${d}`),first=iso(1),length=window.jalaliMonthLength(p.year,p.month),offset=(new Date(first+'T12:00:00Z').getUTCDay()+1)%7;
   let cells='<span></span>'.repeat(offset);
   for(let n=1;n<=length;n++){const day=iso(n);cells+='<button type="button" data-register-day="'+day+'" aria-pressed="'+picked.has(day)+'" '+(day<today()?'disabled':'')+'>'+Number(n).toLocaleString('fa-IR')+'</button>'}
   back.querySelector('[data-register-calendar]').innerHTML='<div class="pbR1076Month"><button type="button" data-register-month="-1" aria-label="ماه قبل">›</button><b>'+new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long',year:'numeric',timeZone:'Asia/Tehran'}).format(new Date(first+'T12:00:00Z'))+'</b><button type="button" data-register-month="1" aria-label="ماه بعد">‹</button></div><div class="pbR1076Days">'+['ش','ی','د','س','چ','پ','ج'].map(d=>'<span>'+d+'</span>').join('')+cells+'</div>';
   back.querySelectorAll('[data-register-day]').forEach(button=>button.onclick=()=>{const day=button.dataset.registerDay;if(picked.has(day))picked.delete(day);else picked.add(day);back.querySelector('[role=alert]').textContent='';draw()});
   back.querySelectorAll('[data-register-month]').forEach(button=>button.onclick=()=>{month=Number(button.dataset.registerMonth)>0?add(iso(length),1):add(first,-1);draw()});
   back.querySelector('[data-register-count]').textContent=Number(picked.size).toLocaleString('fa-IR')+' روز انتخاب شده';back.querySelector('[data-register-next]').disabled=!picked.size;
  };
  back.querySelector('[data-register-clear]').onclick=()=>{picked.clear();draw()};
  back.querySelector('[data-register-next]').onclick=()=>{const days=[...picked].sort();if(!days.length)return;if(days.some((d,i)=>i>0&&d!==add(days[i-1],1))){back.querySelector('[role=alert]').textContent='روزهای آفیش باید پشت سر هم باشند؛ روزهای بین تاریخ‌های انتخاب‌شده را هم انتخاب کنید.';return}close();window.pbR1076RegisterOfficeDays?.(days)};
  document.body.append(back);document.body.style.overflow='hidden';draw();back.querySelector('[data-register-close]').focus({preventScroll:true});
 }
 window.pbR1075BeginOfficeRegistration=beginRegistration;
 // Route every mobile registration entry to the same multi-day picker.
 document.addEventListener('click',event=>{if(!mobile()||document.body.classList.contains('pbR100F9StaffMode'))return;const button=event.target.closest?.('#pbR1073Register,#pbR1033OfficeHeaderAction,#pb892CalendarContinue,[data-pb843-office-tab="manual"]');if(!button||button.disabled)return;event.preventDefault();event.stopImmediatePropagation();beginRegistration()},true);

 const original=window.pb843RenderCalendar;if(typeof original==='function'){const wrapped=function(...args){const out=original.apply(this,args);schedule();return out};window.pb843RenderCalendar=wrapped;try{pb843RenderCalendar=wrapped}catch{}}
 function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','data-pb-channel-off']});
 window.addEventListener('resize',schedule,{passive:true});window.pbR1073PaintMobileOffice=paint;schedule();
})();
