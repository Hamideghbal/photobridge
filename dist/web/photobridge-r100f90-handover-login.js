/* PhotoBridge R100F90 — desktop handover parity and full clickable manager calendar.
   Keep the owner/staff API permissions and booking actions unchanged. */
(()=>{
  'use strict';
  if(window.__PB_R100F90_DESKTOP_PARITY__)return;
  window.__PB_R100F90_DESKTOP_PARITY__=true;
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
  const enabled=()=>desktop()&&document.body.classList.contains('rentalAppReady')&&!document.body.classList.contains('pbR100F9StaffMode')&&q('#bookings')?.classList.contains('active')&&['approved','out'].includes(mode());
  const bookings=()=>typeof data!=='undefined'?(data?.bookings||[]):(window.data?.bookings||[]);
  const includes=(b,kind,d)=>{
    const status=String(b.status||''),start=String(b.rental_start||'').slice(0,10),end=String(b.rental_end||'').slice(0,10);
    if(kind==='approved'){
      if(!['reserved','payment_pending','picked_up','returned'].includes(status))return false;
      return status==='picked_up'&&valid(start)&&valid(end)&&end>=start?start<=d&&end>=d:start===d;
    }
    return ['picked_up','returned'].includes(status)&&end===d;
  };
  function calendar(kind,anchor,selected){
    const first=firstOf(anchor),month=parts(first),offset=(first.getUTCDay()+1)%7;
    let length=0;while(length<32){const p=parts(shift(first,length));if(p.year!==month.year||p.month!==month.month)break;length++}
    const count=Math.ceil((offset+length)/7)*7;
    const title=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long',year:'numeric',timeZone:'Asia/Tehran'}).format(first);
    const appointments=bookings();
    let html='<div class="pbR100F89CalendarHeading"><button type="button" data-pb90-month="-1" aria-label="ماه قبل">›</button><strong>'+escape(title)+'</strong><button type="button" data-pb90-month="1" aria-label="ماه بعد">‹</button></div><div class="pbR100F89CalendarGrid">';
    for(const w of ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'])html+='<span class="pbR100F89Weekday">'+w+'</span>';
    for(let i=0;i<count;i++){
      const d=shift(first,i-offset),day=iso(d),p=parts(d),n=appointments.filter(b=>includes(b,kind,day)).length;
      const other=p.month!==month.month||p.year!==month.year;
      const label=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'long',day:'numeric',month:'long',timeZone:'Asia/Tehran'}).format(d);
      html+='<button type="button" data-pb90-day="'+day+'" class="pbR100F89Cell'+(other?' other':'')+(day===selected?' active':'')+(day===today()?' today':'')+'" aria-pressed="'+(day===selected)+'" aria-label="'+escape(label)+(n?'، '+fa(n)+' آفیش':'، بدون آفیش')+'"><b>'+fa(p.day)+'</b><small>'+(n?fa(n)+' آفیش':'')+'</small></button>';
    }
    return html+'</div><p class="pbR100F89CalendarHelp">روز را انتخاب کنید؛ آفیش‌های همان روز در سمت چپ دیده می‌شوند.</p>';
  }
  let frame=0,observing=false;
  function paint(){
    frame=0;
    const active=enabled(),kind=mode();
    document.body.classList.toggle('pbR100F90ManagerParity',active);
    if(!active)return;
    const current=pane(kind),box=current?.querySelector('.box'),list=box?.querySelector('.pb854BookingStatusList');
    if(!box||!list)return;
    box.classList.add('pbR100F90ManagerLayout');
    list.classList.add('pbR100F90ManagerList');
    const st=state[kind],rail=q('#pbR100F64ManagerDateHost .pb100rManagerDates')||q('.pb100rManagerDates',current);
    const fromRail=rail?.querySelector('[data-pb100r-date-kind="'+kind+'"].active')?.dataset.pb100rDay;
    if(valid(fromRail)&&st.selected!==fromRail){st.selected=fromRail;st.month=fromRail}
    if(!valid(st.selected)){st.selected=today();st.month=st.selected}
    if(!valid(st.month))st.month=st.selected;
    let aside=box.querySelector(':scope > .pbR100F90ManagerCalendar');
    if(!aside){aside=document.createElement('aside');aside.className='pbR100F90ManagerCalendar';aside.setAttribute('aria-label','تقویم آفیش');box.appendChild(aside)}
    const html=calendar(kind,st.month,st.selected);
    if(aside.innerHTML!==html)aside.innerHTML=html;
    if(!aside.dataset.pbR100F90Bound){
      aside.dataset.pbR100F90Bound='1';
      aside.addEventListener('click',event=>{
        const nav=event.target.closest('[data-pb90-month]');
        if(nav){const st=state[mode()];if(!st)return;st.month=iso(shift(firstOf(st.month),Number(nav.dataset.pb90Month)<0?-1:35));schedule();return}
        const day=event.target.closest('[data-pb90-day]');
        if(day){const kind=mode(),st=state[kind];if(!st)return;st.selected=day.dataset.pb90Day;st.month=st.selected;window.pb100rSelectManagerDate?.(kind,st.selected);schedule()}
      });
    }
  }
  function schedule(){if(frame)return;frame=requestAnimationFrame(paint)}
  const oldSelect=window.pb100rSelectManagerDate;
  if(typeof oldSelect==='function'){
    window.pb100rSelectManagerDate=function(kind,day,...args){
      if(state[kind]&&valid(day)){state[kind].selected=day;state[kind].month=day}
      const out=oldSelect.call(this,kind,day,...args);schedule();return out;
    };
  }
  const oldReset=window.pb100rResetManagerToToday;
  if(typeof oldReset==='function'){
    window.pb100rResetManagerToToday=function(kind,...args){
      const out=oldReset.call(this,kind,...args);
      if(state[kind]){state[kind].selected=today();state[kind].month=state[kind].selected}
      schedule();return out;
    };
  }
  const oldRender=window.pb854RenderBookingStatusPanes;
  if(typeof oldRender==='function'){
    const wrapped=function(...args){const out=oldRender.apply(this,args);schedule();return out};
    window.pb854RenderBookingStatusPanes=wrapped;
    try{pb854RenderBookingStatusPanes=wrapped}catch{}
  }
  const oldTab=window.pb843SetOfficeTab;
  if(typeof oldTab==='function'){
    const wrapped=function(...args){const out=oldTab.apply(this,args);schedule();return out};
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
    if(!root||observing)return;
    observing=true;
    const observer=new MutationObserver(schedule);
    observer.observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{attach();schedule()},{once:true});
  else{attach();schedule()}
})();
