/* R1830 — read-only booking range selection for camera-store Office calendar (site + Windows). */
(()=>{
 'use strict';
 if(window.__PB_R1830_OFFICE_RANGE__)return;
 window.__PB_R1830_OFFICE_RANGE__=true;
 const camera=()=>document.body?.classList.contains('rentalAppReady')&&
  ['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String((typeof data!=='undefined'?data:window.data)?.shop?.business_category||''));
 const source=()=>{try{return (typeof data!=='undefined'?data:window.data)?.bookings||[]}catch{return []}};
 const find=id=>source().find(b=>String(b.id)===String(id)&&String(b.status)!=='cancelled');
 const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))&&!Number.isNaN(Date.parse(s+'T12:00:00Z'));
 const date=s=>String(s||'').slice(0,10);
 const formatted=s=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',
  {year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Tehran'}).format(new Date(s+'T12:00:00Z'));
 let chosen='',viewDay='',queued=false,rootObserver=null,detailObserver=null,watching=false;
 const dayFromCalendar=()=>document.querySelector('#pb843CalendarGrid .pb904r2SelectedDay')?.dataset.pb843CalDay||
  (typeof window.pb904r2SelectedDay==='string'?window.pb904r2SelectedDay:'')||viewDay;
 function range(b){
  const start=date(b?.rental_start),end=date(b?.rental_end);
  return valid(start)&&valid(end)&&start<=end?{start,end}:null;
 }
 function paint(){
  queued=false;
  if(!camera())return;
  if(chosen&&!find(chosen))chosen='';
  const b=chosen?find(chosen):null,r=b?range(b):null;
  if(b&&!r)chosen='';
  const text=r?'آفیش انتخاب‌شده: '+formatted(r.start)+' تا '+formatted(r.end):'';
  const grid=document.getElementById('pb843CalendarGrid');
  if(grid)grid.querySelectorAll('[data-pb843-cal-day]').forEach(el=>{
   const day=el.dataset.pb843CalDay,inside=!!r&&day>=r.start&&day<=r.end;
   const kind=inside?(r.start===r.end?'single':day===r.start?'start':day===r.end?'end':'middle'):'';
   if(kind){if(el.dataset.pb1830Range!==kind)el.dataset.pb1830Range=kind;el.title=text}
   else{if(el.hasAttribute('data-pb1830-range'))delete el.dataset.pb1830Range;if(el.title.startsWith('آفیش انتخاب‌شده:'))el.removeAttribute('title')}
  });
  const panel=document.getElementById('pb904r2DayPanelBody');
  if(panel)panel.querySelectorAll('[data-pb904r5-booking-id]').forEach(el=>{
   const active=!!chosen&&el.dataset.pb904r5BookingId===chosen;
   el.classList.toggle('pb1830Picked',active);
   if(el.getAttribute('aria-pressed')!==String(active))el.setAttribute('aria-pressed',String(active));
   if(active)el.title=text;else if(el.title.startsWith('آفیش انتخاب‌شده:'))el.removeAttribute('title');
  });
  const mobile=document.getElementById('pb843BookingDetailBody');
  if(mobile){
   const day=viewDay||dayFromCalendar();
   let rows=[];
   try{rows=typeof pb843BookingsForIso==='function'?pb843BookingsForIso(day):source().filter(x=>date(x.rental_start)<=day&&date(x.rental_end)>=day)}catch{}
   const cards=mobile.querySelectorAll(':scope > .pb843BookingDetailCard');
   cards.forEach((el,i)=>{
    const active=!!chosen&&String(rows[i]?.id||'')===chosen;
    el.classList.toggle('pb1830Picked',active);
    el.dataset.pb1830BookingId=String(rows[i]?.id||'');
    if(el.getAttribute('role')!=='button')el.setAttribute('role','button');
    if(!el.hasAttribute('tabindex'))el.tabIndex=0;
    el.setAttribute('aria-pressed',String(active));
   });
  }
 }
 function queue(){if(!queued){queued=true;requestAnimationFrame(paint)}}
 function select(id){
  if(!camera())return;
  const b=find(id);
  if(!b||!range(b))return;
  chosen=chosen===String(id)?'':String(id);
  queue();
 }
 // Capture before the legacy card action that opens an invoice; selection must be separate.
 window.addEventListener('click',event=>{
  if(!camera())return;
  const day=event.target.closest?.('#pb843CalendarGrid [data-pb843-cal-day]');
  if(day){viewDay=day.dataset.pb843CalDay;chosen='';queue();return}
  const card=event.target.closest?.('#pb904r2DayPanelBody [data-pb904r5-booking-id]');
  if(card){
   const action=event.target.closest('button,a,input,select,textarea,[data-office-action]');
   if(action&&action!==card)return;
   event.preventDefault();event.stopImmediatePropagation();
   select(card.dataset.pb904r5BookingId);return;
  }
  const mobile=event.target.closest?.('#pb843BookingDetailBody .pb843BookingDetailCard');
  if(mobile){
   if(event.target.closest('.pbR1052DayActions,button,a,input,select,textarea'))return;
   const id=mobile.dataset.pb1830BookingId;
   if(!id)return;
   event.preventDefault();event.stopImmediatePropagation();select(id);
   // The modal covers the calendar; close it so the selected date range is visible.
   if(typeof pb843CloseBookingDay==='function')pb843CloseBookingDay();
  }
 },true);
 window.addEventListener('keydown',event=>{
  if(event.key!=='Enter'&&event.key!==' ')return;
  const card=event.target.closest?.('#pb843BookingDetailBody .pb843BookingDetailCard[role=button]');
  if(!card||!camera()||!card.dataset.pb1830BookingId)return;
  if(event.target.closest('button,a,input,select,textarea'))return;
  event.preventDefault();event.stopPropagation();
  select(card.dataset.pb1830BookingId);
  if(typeof pb843CloseBookingDay==='function')pb843CloseBookingDay();
 },true);
 function attach(){
  if(!document.body)return;
  const root=document.getElementById('bookings');
  if(root&&!rootObserver){rootObserver=new MutationObserver(queue);rootObserver.observe(root,{childList:true,subtree:true})}
  const detail=document.getElementById('pb843BookingDetailBody');
  if(detail&&!detailObserver){detailObserver=new MutationObserver(queue);detailObserver.observe(detail,{childList:true})}
  queue();
 }
 function boot(){
  if(!watching){watching=true;new MutationObserver(attach).observe(document.body,{childList:true})}
  attach();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
 window.addEventListener('pageshow',queue,{passive:true});
})();
