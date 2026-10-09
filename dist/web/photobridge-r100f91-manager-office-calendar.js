/* PhotoBridge R100F91 – manager handover uses the exact Office calendar structure.
   The existing booking renderer remains the source of truth for actions, status and permissions. */
(()=>{
 'use strict';
 if(window.__PB_R100F91_OFFICE_HANDOVER__)return;
 window.__PB_R100F91_OFFICE_HANDOVER__=true;
 const q=(s,r=document)=>r.querySelector(s);
 const desktop=()=>matchMedia('(min-width:851px)').matches;
 const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''));
 const today=()=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Tehran'}).format(new Date());
 const noon=s=>new Date(s+'T12:00:00Z');
 const iso=d=>d.toISOString().slice(0,10);
 const shift=(d,n)=>{const c=new Date(d);c.setUTCDate(c.getUTCDate()+n);return c};
 const parts=d=>Object.fromEntries(new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric',timeZone:'Asia/Tehran'}).formatToParts(d).filter(p=>['year','month','day'].includes(p.type)).map(p=>[p.type,Number(p.value)]));
 const firstOf=s=>{const d=noon(s);return shift(d,1-parts(d).day)};
 const fa=n=>Number(n||0).toLocaleString('fa-IR');
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const state={approved:{selected:'',month:''},out:{selected:'',month:''}};
 const pane=kind=>q('#bookings [data-pb843-office-pane="'+kind+'"].active');
 const mode=()=>q('#pb848BookingHeaderTabs [data-pb843-office-tab].active')?.dataset.pb843OfficeTab||'';
 const ready=()=>desktop()&&document.body.classList.contains('rentalAppReady')&&!document.body.classList.contains('pbR100F9StaffMode')&&q('#bookings')?.classList.contains('active');
 const bookings=()=>typeof data!=='undefined'?(data?.bookings||[]):(window.data?.bookings||[]);
 const matches=(b,kind,d)=>{
   const status=String(b.status||''),start=String(b.rental_start||'').slice(0,10),end=String(b.rental_end||'').slice(0,10);
   if(kind==='approved'){
     if(!['reserved','payment_pending','picked_up','returned'].includes(status))return false;
     return status==='picked_up'&&valid(start)&&valid(end)&&end>=start?start<=d&&end>=d:start===d;
   }
   return ['picked_up','returned'].includes(status)&&end===d;
 };
 const weekday=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
 function monthMarkup(kind,anchor,selected){
   const first=firstOf(anchor),key=parts(first),offset=(first.getUTCDay()+1)%7,rows=bookings();
   let length=0;
   while(length<32){const p=parts(shift(first,length));if(p.year!==key.year||p.month!==key.month)break;length++}
   const title=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long',year:'numeric',timeZone:'Asia/Tehran'}).format(first);
   let out='<div class="pb843CalendarToolbar">'+
     '<button type="button" class="pb843CalendarNav" data-pb91-month="-1" aria-label="ماه قبل">›</button>'+
     '<div><b>'+escape(title)+'</b><small>روز موردنظر را برای مشاهده '+(kind==='approved'?'تحویل':'دریافت')+' انتخاب کنید</small></div>'+
     '<button type="button" class="pb843CalendarNav" data-pb91-month="1" aria-label="ماه بعد">‹</button></div>'+
     '<div class="pb843CalendarWeek">'+weekday.map(w=>'<span>'+w+'</span>').join('')+'</div>'+
     '<div class="pb843CalendarGrid">';
   for(let n=0;n<offset;n++)out+='<button type="button" class="pb843CalendarDay blank" tabindex="-1" aria-hidden="true"></button>';
   for(let n=0;n<length;n++){
     const d=shift(first,n),day=iso(d),p=parts(d),items=rows.filter(b=>matches(b,kind,day));
     const names=items.slice(0,2).map(b=>'<span class="pb843CalendarEvent">'+escape(b.photographer_name||b.customer_name||b.customer_mobile||'عکاس')+'</span>').join('');
     const more=items.length>2?'<span class="pb843CalendarMore">+ '+fa(items.length-2)+' دیگر</span>':'';
     const count=items.length?'<em class="pb904r2DayCount has">'+fa(items.length)+'</em>':'';
     const aria=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'long',day:'numeric',month:'long',timeZone:'Asia/Tehran'}).format(d);
     out+='<button type="button" class="pb843CalendarDay'+(day===today()?' today':'')+(day===selected?' pbR100F91SelectedDay':'')+
       '" data-pb91-day="'+day+'" aria-pressed="'+(day===selected)+'" aria-label="'+escape(aria)+'، '+fa(items.length)+' آفیش">'+
       '<strong>'+fa(p.day)+'</strong>'+count+'<span class="pb843CalendarEvents">'+names+more+'</span></button>';
   }
   return out+'</div>';
 }
 let frame=0,observerSet=false;
 function fit(element){
   if(!element||!element.getClientRects().length)return;
   const top=element.getBoundingClientRect().top;
   if(top<0||top>=innerHeight)return;
   const height=Math.max(160,Math.floor(innerHeight-top-7));
   if(element.style.getPropertyValue('--pb-r100f91-fit-height')!==height+'px')
     element.style.setProperty('--pb-r100f91-fit-height',height+'px');
 }
 function paint(){
   frame=0;
   const on=ready(),kind=mode(),handover=on&&(kind==='approved'||kind==='out'),office=on&&kind==='calendar';
   document.body.classList.toggle('pbR100F91ManagerOffice',handover);
   document.body.classList.toggle('pbR100F91OfficeViewport',handover||office);
   if(office){
     const cal=q('#bookings [data-pb843-office-pane="calendar"].active .pb843BookingCalendarBox');
     fit(cal);
     return;
   }
   if(!handover)return;
   const current=pane(kind),box=current?.querySelector(':scope > .box'),list=box?.querySelector('.pb854BookingStatusList');
   if(!box||!list)return;
   box.classList.add('pbR100F91OfficeBox','pb843BookingCalendarBox');
   const st=state[kind];
   if(!valid(st.selected)){
     const rail=q('#pbR100F64ManagerDateHost .pb100rManagerDates')||q('.pb100rManagerDates',current);
     st.selected=rail?.querySelector('[data-pb100r-date-kind="'+kind+'"].active')?.dataset.pb100rDay||today();
   }
   if(!valid(st.month))st.month=st.selected;
   let split=q(':scope > .pbR100F91OfficeSplit',box);
   if(!split){
     split=document.createElement('div');
     split.className='pb904r2CalendarSplit pbR100F91OfficeSplit';
     box.appendChild(split);
   }
   let cal=q(':scope > .pbR100F91CalendarPane',split);
   if(!cal){
     cal=document.createElement('div');
     cal.className='pb904r2CalendarPane pbR100F91CalendarPane';
     split.appendChild(cal);
   }
   let panel=q(':scope > .pbR100F91DayPanel',split);
   if(!panel){
     panel=document.createElement('aside');
     panel.className='pb904r2DayPanel pbR100F91DayPanel';
     panel.setAttribute('aria-label',kind==='approved'?'آفیش‌های تحویل روز':'آفیش‌های دریافت روز');
     panel.innerHTML='<div class="pb904r2DayPanelHead"><b class="pbR100F91DayTitle"></b><small class="pbR100F91DayCount"></small></div>';
     split.appendChild(panel);
   }
   list.classList.add('pbR100F91ManagerList','pb904r2DayPanelBody');
   if(list.parentNode!==panel)panel.appendChild(list);
   const listRows=bookings().filter(b=>matches(b,kind,st.selected));
   const title=(kind==='approved'?'تحویل‌های روز ':'دریافت‌های روز ')+new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Tehran'}).format(noon(st.selected));
   const counter=listRows.length?fa(listRows.length)+' آفیش':'بدون آفیش';
   const dayTitle=q('.pbR100F91DayTitle',panel),dayCount=q('.pbR100F91DayCount',panel);
   if(dayTitle&&dayTitle.textContent!==title)dayTitle.textContent=title;
   if(dayCount&&dayCount.textContent!==counter)dayCount.textContent=counter;
   const html=monthMarkup(kind,st.month,st.selected);
   if(cal.innerHTML!==html)cal.innerHTML=html;
   if(!cal.dataset.pbR100F91Events){
     cal.dataset.pbR100F91Events='1';
     cal.addEventListener('click',e=>{
       const nav=e.target.closest('[data-pb91-month]');
       if(nav){
         const currentState=state[mode()];
         if(!currentState)return;
         currentState.month=iso(shift(firstOf(currentState.month),Number(nav.dataset.pb91Month)<0?-1:35));
         schedule();return;
       }
       const chosen=e.target.closest('[data-pb91-day]');
       if(chosen){
         const activeKind=mode(),currentState=state[activeKind];
         if(!currentState)return;
         currentState.selected=chosen.dataset.pb91Day;
         currentState.month=currentState.selected;
         window.pb100rSelectManagerDate?.(activeKind,currentState.selected);
         schedule();
       }
     });
   }
   fit(box);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
 const oldSelect=window.pb100rSelectManagerDate;
 if(typeof oldSelect==='function'){
   window.pb100rSelectManagerDate=function(kind,day,...rest){
     if(state[kind]&&valid(day)){state[kind].selected=day;state[kind].month=day}
     const result=oldSelect.call(this,kind,day,...rest);schedule();return result;
   };
 }
 const oldReset=window.pb100rResetManagerToToday;
 if(typeof oldReset==='function'){
   window.pb100rResetManagerToToday=function(kind,...rest){
     const result=oldReset.call(this,kind,...rest);
     if(state[kind]){state[kind].selected=today();state[kind].month=state[kind].selected}
     schedule();return result;
   };
 }
 const oldRender=window.pb854RenderBookingStatusPanes;
 if(typeof oldRender==='function'){
   const wrapped=function(...args){const result=oldRender.apply(this,args);schedule();return result};
   window.pb854RenderBookingStatusPanes=wrapped;
   try{pb854RenderBookingStatusPanes=wrapped}catch{}
 }
 const oldTab=window.pb843SetOfficeTab;
 if(typeof oldTab==='function'){
   const wrapped=function(...args){const result=oldTab.apply(this,args);schedule();return result};
   window.pb843SetOfficeTab=wrapped;
   try{pb843SetOfficeTab=wrapped}catch{}
 }
 document.addEventListener('click',e=>{
   if(e.target.closest?.('#pb848BookingHeaderTabs,[data-rental-desktop-tab="bookings"],[data-rental-bottom-tab="bookings"]'))schedule();
 },true);
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('pageshow',schedule,{passive:true});
 function attach(){
   const root=q('#bookings');
   if(!root||observerSet)return;
   observerSet=true;
   new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{attach();schedule()},{once:true});
 else{attach();schedule()}
})();