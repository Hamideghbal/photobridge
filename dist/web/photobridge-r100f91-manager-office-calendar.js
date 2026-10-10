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
 const calendarMarkup=new WeakMap();
 let frame=0,observerSet=false;
 const pane=kind=>q('#bookings [data-pb843-office-pane="'+kind+'"].active');
 const mode=()=>q('#pb848BookingHeaderTabs [data-pb843-office-tab].active')?.dataset.pb843OfficeTab||'';
 const ready=()=>desktop()&&document.body.classList.contains('rentalAppReady')&&!document.body.classList.contains('pbR100F9StaffMode')&&q('#bookings')?.classList.contains('active');
 const bookings=()=>typeof data!=='undefined'?(data?.bookings||[]):(window.data?.bookings||[]);
 function selectDay(kind,day){
   const st=state[kind];
   if(!st||!valid(day))return;
   st.selected=day;st.month=day;
   let result;
   try{result=window.pb100rSelectManagerDate?.(kind,day)}catch(error){console.error('[PhotoBridge] date selection fallback',error)}
   if(frame){cancelAnimationFrame(frame);frame=0}
   paint();
   return result===undefined?true:result;
 }
 window.pbR100F91SelectDay=selectDay;
 document.addEventListener('click',event=>{
   if(document.body.classList.contains('pbR100F9StaffMode'))return;
   const button=event.target.closest?.('[data-pb91-day],[data-pb1010-day],[data-pb100r-date-kind]');
   if(!button)return;
   const kind=button.dataset.pb91Kind||button.dataset.pb100rDateKind||button.closest('[data-pb843-office-pane]')?.dataset.pb843OfficePane||mode();
   const day=button.dataset.pb91Day||button.dataset.pb1010Day||button.dataset.pb100rDay;
   if((kind!=='approved'&&kind!=='out')||!valid(day))return;
   event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
   selectDay(kind,day);
 },true);
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
   const firstDay=iso(first),lastDay=iso(shift(first,length-1)),eventsByDay=new Map();
   const addEvent=(day,b)=>{if(!eventsByDay.has(day))eventsByDay.set(day,[]);eventsByDay.get(day).push(b)};
   for(const b of rows){const status=String(b.status||''),start=String(b.rental_start||'').slice(0,10),end=String(b.rental_end||'').slice(0,10);if(kind==='approved'){if(!['reserved','payment_pending','picked_up','returned'].includes(status))continue;if(status==='picked_up'&&valid(start)&&valid(end)&&end>=start){let day=start>firstDay?start:firstDay;const through=end<lastDay?end:lastDay;while(day<=through){addEvent(day,b);day=iso(shift(noon(day),1))}}else if(start>=firstDay&&start<=lastDay)addEvent(start,b)}else if(['picked_up','returned'].includes(status)&&end>=firstDay&&end<=lastDay)addEvent(end,b)}
   const title=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long',year:'numeric',timeZone:'Asia/Tehran'}).format(first);
   let out='<div class="pb843CalendarToolbar">'+
     '<button type="button" class="pb843CalendarNav" data-pb91-month="-1" aria-label="ماه قبل">›</button>'+
     '<div><b>'+escape(title)+'</b><small>روز موردنظر را برای مشاهده '+(kind==='approved'?'تحویل':'دریافت')+' انتخاب کنید</small></div>'+
     '<button type="button" class="pb843CalendarNav" data-pb91-month="1" aria-label="ماه بعد">‹</button></div>'+
     '<div class="pb843CalendarWeek">'+weekday.map(w=>'<span>'+w+'</span>').join('')+'</div>'+
     '<div class="pb843CalendarGrid">';
   for(let n=0;n<offset;n++)out+='<button type="button" class="pb843CalendarDay blank" tabindex="-1" aria-hidden="true"></button>';
   for(let n=0;n<length;n++){
     const d=shift(first,n),day=iso(d),p=parts(d),items=eventsByDay.get(day)||[];
     const names=items.slice(0,2).map(b=>'<span class="pb843CalendarEvent">'+escape(b.photographer_name||b.customer_name||b.customer_mobile||'عکاس')+'</span>').join('');
     const more=items.length>2?'<span class="pb843CalendarMore">+ '+fa(items.length-2)+' دیگر</span>':'';
     const count=items.length?'<em class="pb904r2DayCount has">'+fa(items.length)+'</em>':'';
     const aria=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'long',day:'numeric',month:'long',timeZone:'Asia/Tehran'}).format(d);
     out+='<button type="button" class="pb843CalendarDay'+(day===today()?' today':'')+(day===selected?' pbR100F91SelectedDay':'')+
       '" data-pb91-kind="'+kind+'" data-pb91-day="'+day+'" aria-pressed="'+(day===selected)+'" aria-label="'+escape(aria)+'، '+fa(items.length)+' آفیش" onclick="window.pbR100F91SelectDay?.(\''+kind+'\',\''+day+'\')">'+
       '<strong>'+fa(p.day)+'</strong>'+count+'<span class="pb843CalendarEvents">'+names+more+'</span></button>';
   }
   return out+'</div>';
 }
 function fit(element){
   if(!element||!element.getClientRects().length)return;
   const top=element.getBoundingClientRect().top;
   if(top<0||top>=innerHeight)return;
   const height=Math.max(160,Math.floor(innerHeight-top-7));
   if(element.style.getPropertyValue('--pb-r100f91-fit-height')!==height+'px')
     element.style.setProperty('--pb-r100f91-fit-height',height+'px');
 }
 function paint(){
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
   // Compare generated markup with itself, not the browser's normalized serialization.
   // Keep day buttons mounted when only selection changes so pointer/focus targets survive.
   const html=monthMarkup(kind,st.month,'');
   if(calendarMarkup.get(cal)!==html){cal.innerHTML=html;calendarMarkup.set(cal,html)}
   cal.querySelectorAll('[data-pb91-day]').forEach(button=>{
     const selected=button.dataset.pb91Day===st.selected;
     button.classList.toggle('pbR100F91SelectedDay',selected);
     const pressed=String(selected);
     if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);
   });
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
         e.preventDefault();e.stopPropagation();
         selectDay(activeKind,chosen.dataset.pb91Day);
       }
     });
   }
   fit(box);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;paint()})}
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
 // Replay only after every binding, render dependency and event handler is initialized.
 const pending=window.__PB_R100F91PendingSelection;
 if(pending){delete window.__PB_R100F91PendingSelection;selectDay(pending.kind,pending.day)}
})();


/* R1052: actions only on Office calendar day booking cards; never change card dimensions. */
(()=>{
 'use strict';
 if(window.__PB_R1052_OFFICE_DAY_ACTIONS__)return;
 window.__PB_R1052_OFFICE_DAY_ACTIONS__=true;
 let selectedIso='',scheduled=false,busy=new Set();
 const q=s=>document.querySelector(s);
 const statusRow=id=>{
   try{return (typeof data!=='undefined'&&Array.isArray(data?.bookings)?data.bookings:[]).find(b=>String(b.id)===String(id))||null}catch{return null}
 };
 const rowsForDay=day=>{
   try{return typeof pb843BookingsForIso==='function'?pb843BookingsForIso(day):[]}catch{return []}
 };
 const showError=message=>{if(typeof window.storeNotice==='function')window.storeNotice(message,'آفیش');else alert(message)};
 const safeId=id=>encodeURIComponent(String(id||''));
 const htmlEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const controls=b=>{
   const s=String(b?.status||'');
   if(s==='reserved')return [['picked_up','تحویل به مشتری'],['cancelled','حذف آفیش']];
   if(s==='picked_up')return [['returned','دریافت تجهیزات از مشتری'],['invoice','فاکتور'],['commitment','تعهدنامه']];
   if(s==='returned')return [['invoice','فاکتور'],['commitment','تعهدنامه']];
   return [];
 };
 const docStyles=document.createElement('style');
 docStyles.id='pbR1052DayActionStyles';
 docStyles.textContent=[
   '#pb904r2DayPanelBody .pbR1052DayGroup{display:flex;direction:rtl;align-items:center;justify-content:space-between;gap:7px;width:100%;min-width:0;padding:8px 9px;box-sizing:border-box;border:1px solid #e4e7ec;border-radius:10px;background:#fff}',
   '#pb904r2DayPanelBody .pbR1052DayGroup>.pb904r2DayBooking{flex:1 1 auto!important;width:auto!important;min-width:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;box-sizing:border-box!important}',
   '#pb904r2DayPanelBody .pbR1052DayGroup>.pbR1052DayActions{flex:0 1 auto;min-width:0;margin:0;justify-content:flex-end}',
   '#pb904r2DayPanelBody .pbR1052DayGroup+.pbR1052DayGroup{margin-top:0}',
   '.pbR1052DayActions{display:flex;flex-direction:row;flex-wrap:wrap;gap:5px;align-items:center;justify-content:flex-end;direction:rtl}',
   '.pbR1052DayActions>button{min-height:29px;padding:4px 8px;max-width:100%;border:1px solid #d0d5dd;border-radius:8px;background:#fff;color:#344054;font:800 10px/1.5 Vazirmatn,Tahoma,sans-serif;cursor:pointer}',
   '.pbR1052DayActions>button[data-office-action="picked_up"]{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}',
   '.pbR1052DayActions>button[data-office-action="returned"]{background:#f0fdf4;color:#15803d;border-color:#bbf7d0}',
   '.pbR1052DayActions>button[data-office-action="cancelled"]{background:#fff7f7;color:#b42318;border-color:#fecaca}',
   '.pbR1052DayActions>button:disabled{opacity:.5;cursor:wait}',
   '#pb843BookingDetailBody .pb843BookingDetailCard.pbR1053CalendarCard{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 7px;align-items:center}',
   '#pb843BookingDetailBody .pb843BookingDetailCard.pbR1053CalendarCard>b,#pb843BookingDetailBody .pb843BookingDetailCard.pbR1053CalendarCard>small{grid-column:1;min-width:0;margin:0}',
   '#pb843BookingDetailBody .pbR1052DayActions{grid-column:2;grid-row:1/span 5;max-width:min(52vw,260px);align-self:center;margin:0}',
   '.pbR1052DocBackdrop{position:fixed;inset:0;z-index:2147483000;background:#101828ab;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box}',
   '.pbR1052DocDialog{display:flex;flex-direction:column;width:min(920px,100%);height:min(94dvh,1000px);min-height:0;background:white;border-radius:14px;overflow:hidden;direction:rtl}',
   '.pbR1052DocBar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:10px 12px;border-bottom:1px solid #eaecf0}',
   '.pbR1052DocBar>div{display:flex;gap:12px;flex-wrap:wrap;align-items:center}',
   '.pbR1052DocBar button{border:1px solid #d0d5dd;border-radius:8px;padding:7px 12px;background:#fff;font:800 11px Vazirmatn,Tahoma;cursor:pointer}',
   '.pbR1052DocFrame{width:100%;flex:1;min-height:0;border:0;background:#fff}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922InvoiceToolbar>div{display:flex;gap:12px;align-items:center;flex-wrap:wrap}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922InvoiceDialog{width:min(920px,calc(100vw - 20px));max-height:calc(100dvh - 20px);min-height:0}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922InvoiceContent{padding:6px!important;overflow:hidden!important;overscroll-behavior:none!important}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper{border:0!important;padding:9px!important;line-height:1.45!important;font-size:10px!important}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper .pb922Head{gap:8px!important;padding-bottom:5px!important;margin-bottom:6px!important}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper h1{font-size:15px!important}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper h2{font-size:12px!important}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper .pb922Facts{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:3px 9px!important;margin-bottom:5px!important}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper .pb922TableScroll{overflow:visible!important}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper table{min-width:0!important;table-layout:fixed!important;font-size:9px!important}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper th,#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper td{padding:3px!important;overflow-wrap:anywhere}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper .pb922Totals{margin-top:6px!important}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper .pb922Totals div{padding:2px 0!important}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper .pb922Sign{margin-top:9px!important;padding-top:6px!important}',
   '#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper .pb922Footer{margin-top:5px!important;padding-top:4px!important}',
   '@media(max-width:850px){#pb922InvoiceModal.pbR1053CalendarInvoice .pb922InvoiceToolbar{padding:8px!important}#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper{padding:5px!important;font-size:9px!important}#pb922InvoiceModal.pbR1053CalendarInvoice .pb922Paper table{font-size:8px!important}}',
   '@media(max-width:850px){.pbR1052DayActions>button{font-size:10px;min-height:32px}.pbR1052DocDialog{height:94dvh}}'
 ].join('\n');
 document.head.appendChild(docStyles);
 const makeActions=b=>{
   const row=document.createElement('div');row.className='pbR1052DayActions';row.dataset.officeBookingId=String(b.id);
   for(const [kind,label] of controls(b)){
     const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.officeAction=kind;
     button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();void dispatch(b.id,kind,button)});
     row.appendChild(button);
   }
   return row;
 };
 function mount(){
   const desk=q('#pb904r2DayPanelBody');
   if(desk){
     for(const card of [...desk.querySelectorAll(':scope > .pb904r2DayBooking[data-pb904r5-booking-id]')]){
       const b=statusRow(card.dataset.pb904r5BookingId);
       if(!b)continue;
       const wrap=document.createElement('div');wrap.className='pbR1052DayGroup';card.before(wrap);wrap.append(card);wrap.append(makeActions(b));
     }
     for(const wrap of desk.querySelectorAll('.pbR1052DayGroup')){
       const card=wrap.querySelector('[data-pb904r5-booking-id]'),b=card&&statusRow(card.dataset.pb904r5BookingId),existing=wrap.querySelector('.pbR1052DayActions');
       if(!b)continue;
       const signature=controls(b).map(x=>x[0]).join('|');
       if(existing?.dataset.actionsSignature!==signature){const actions=makeActions(b);actions.dataset.actionsSignature=signature;existing?.replaceWith(actions);if(!existing)wrap.append(actions)}
     }
   }
   const mobile=q('#pb843BookingDetailBody');
   if(mobile&&q('#pb843BookingDetailBackdrop.open')){
     const day=selectedIso||q('#pb843CalendarGrid .pb904r2SelectedDay')?.dataset.pb843CalDay||'';
     const rows=rowsForDay(day),cards=[...mobile.querySelectorAll(':scope > .pb843BookingDetailCard')];
     cards.forEach((card,i)=>{
       const b=rows[i];if(!b)return;
       const signature=String(b.id)+'|'+controls(b).map(x=>x[0]).join('|');
       if(card.dataset.pbR1052Actions===signature)return;
       card.querySelector('.pbR1052DayActions')?.remove();
       card.classList.add('pbR1053CalendarCard');card.append(makeActions(b));card.dataset.pbR1052Actions=signature;
     });
   }
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount()})}
 const observer=new MutationObserver(mutations=>{
   if(mutations.some(m=>{
     const el=m.target;
     return el.nodeType===1&&(el.id==='pb904r2DayPanelBody'||el.id==='pb843BookingDetailBody'||Boolean(el.closest?.('#pb904r2DayPanelBody,#pb843BookingDetailBody'))||[...m.addedNodes].some(n=>n.nodeType===1&&(n.id==='pb843BookingDetailBackdrop'||n.id==='pb904r2DayPanelBody')));
   }))schedule();
 });
 function boot(){observer.observe(document.body,{childList:true,subtree:true});schedule()}
 document.addEventListener('click',e=>{
   const day=e.target.closest?.('#pb843CalendarGrid [data-pb843-cal-day]');
   if(day){selectedIso=day.dataset.pb843CalDay;schedule()}
 },true);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

 async function invoice(id){
   let inv=null;
   try{
     inv=(typeof accountingData!=='undefined'&&Array.isArray(accountingData?.invoices)?accountingData.invoices:[]).find(x=>String(x.booking_id||'')===String(id));
     if(!inv&&typeof loadAccounting==='function'){
       await loadAccounting();
       inv=(typeof accountingData!=='undefined'&&Array.isArray(accountingData?.invoices)?accountingData.invoices:[]).find(x=>String(x.booking_id||'')===String(id));
     }
   }catch{showError('دریافت اطلاعات فاکتور انجام نشد.');return}
   if(!inv){showError('فاکتور این آفیش هنوز صادر نشده است.');return}
   if(typeof window.pb922OpenInvoice!=='function'){showError('نمایش فاکتور در دسترس نیست.');return}
   window.pb922OpenInvoice(String(inv.id));
   const modal=q('#pb922InvoiceModal'),paper=modal?.querySelector('.pb922Paper'),content=modal?.querySelector('.pb922InvoiceContent'),bar=modal?.querySelector('.pb922InvoiceToolbar');
   if(!modal||!paper||!content||!bar)return;
   modal.classList.add('pbR1053CalendarInvoice');
   const fit=()=>{
     if(modal.hidden)return;
     paper.style.zoom='1';
     const fullHeight=paper.scrollHeight+12,available=Math.max(100,window.innerHeight-36-bar.offsetHeight);
     const scale=Math.min(1,available/Math.max(1,fullHeight));
     paper.style.zoom=String(scale);
   };
   requestAnimationFrame(()=>requestAnimationFrame(fit));
   const cleanup=new MutationObserver(()=>{
     if(modal.hidden){cleanup.disconnect();window.removeEventListener('resize',fit);paper.style.removeProperty('zoom');modal.classList.remove('pbR1053CalendarInvoice')}
   });
   cleanup.observe(modal,{attributes:true,attributeFilter:['hidden']});
   window.addEventListener('resize',fit,{passive:true});
 }
 async function commitment(id){
   let markup;
   try{
     const response=await fetch('/api/rental/bookings/'+safeId(id)+'/commitment',{credentials:'include'});
     if(!response.ok)throw new Error('HTTP '+response.status);
     markup=(await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'');
   }catch{showError('دریافت تعهدنامه انجام نشد.');return}
   const back=document.createElement('div');back.className='pbR1052DocBackdrop';
   const dialog=document.createElement('section');dialog.className='pbR1052DocDialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
   const bar=document.createElement('header');bar.className='pbR1052DocBar';bar.innerHTML='<b>تعهدنامه تجهیزات</b><div><button type="button" data-print>چاپ / ذخیره PDF</button><button type="button" data-close>بستن</button></div>';
   const frame=document.createElement('iframe');frame.className='pbR1052DocFrame';frame.title='پیش‌نمایش تعهدنامه';frame.srcdoc=markup;
   dialog.append(bar,frame);back.append(dialog);document.body.append(back);
   const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
   const close=()=>{document.removeEventListener('keydown',onKey);back.remove();document.body.style.overflow=previousOverflow};
   bar.querySelector('[data-close]').onclick=close;
   back.addEventListener('click',e=>{if(e.target===back)close()});
   bar.querySelector('[data-print]').onclick=()=>{try{frame.contentWindow?.focus();frame.contentWindow?.print()}catch{showError('چاپ تعهدنامه در مرورگر در دسترس نیست.')}};
   const onKey=e=>{if(e.key==='Escape'){document.removeEventListener('keydown',onKey);close()}};
   document.addEventListener('keydown',onKey);
 }
 async function dispatch(id,kind,button){
   const key=String(id);if(busy.has(key))return;
   const b=statusRow(id);
   if(!b||!controls(b).some(x=>x[0]===kind)){showError('وضعیت آفیش تغییر کرده است. صفحه را تازه‌سازی کنید.');return}
   busy.add(key);button.disabled=true;
   try{
     if(kind==='invoice')await invoice(id);
     else if(kind==='commitment')await commitment(id);
     else if(typeof window.bookingStatus==='function'){
       await window.bookingStatus(String(id),kind);
       const current=statusRow(id);
       if(current&&String(current.status)!==String(b.status)){
         const day=selectedIso||q('#pb843CalendarGrid .pb904r2SelectedDay')?.dataset.pb843CalDay||'';
         if(q('#pb843BookingDetailBackdrop.open')&&day&&typeof pb843OpenBookingDay==='function')pb843OpenBookingDay(day);
         if(day&&typeof window.pb904r2RenderDayPanel==='function')window.pb904r2RenderDayPanel(day);
       }
     }
   }catch{showError('عملیات آفیش انجام نشد. دوباره تلاش کنید.')}
   finally{busy.delete(key);button.disabled=false;schedule()}
 }
})();
