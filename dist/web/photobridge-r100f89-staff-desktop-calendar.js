/* R100F89: full Persian month calendar for Windows handover operators. */
(()=>{
  if(window.__PB_R100F89_STAFF_CALENDAR__)return;
  window.__PB_R100F89_STAFF_CALENDAR__=true;
  const q=(s,r=document)=>r.querySelector(s);
  const isDesktop=()=>document.body.classList.contains('pbR100F9StaffMode')&&matchMedia('(min-width:851px)').matches;
  const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''));
  const iso=d=>d.toISOString().slice(0,10);
  const shift=(d,n)=>{const copy=new Date(d);copy.setUTCDate(copy.getUTCDate()+n);return copy};
  const parts=d=>Object.fromEntries(new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric',timeZone:'Asia/Tehran'}).formatToParts(d).filter(p=>['year','month','day'].includes(p.type)).map(p=>[p.type,Number(p.value)]));
  const noon=s=>new Date(s+'T12:00:00Z');
  const firstDay=s=>{const d=noon(s);return shift(d,1-parts(d).day)};
  const today=()=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Tehran'}).format(new Date());
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const state={month:'',mode:'',selected:''};
  const available=(b,mode,day)=>{
    if(mode==='out'){
      if(!['reserved','picked_up','returned'].includes(String(b.status||'')))return false;
      const start=String(b.rental_start||'').slice(0,10),end=String(b.rental_end||'').slice(0,10);
      return b.status==='picked_up'&&valid(start)&&valid(end)&&end>=start?start<=day&&end>=day:start===day;
    }
    return ['picked_up','returned'].includes(String(b.status||''))&&String(b.rental_end||'').slice(0,10)===day;
  };
  function render(){
    if(!isDesktop())return;
    const mode=q('.pbR100F9StaffTabs [data-staff-mode].active')?.dataset.staffMode;
    const rail=q('#pbR100F9StaffDates');
    if(!rail||!['out','in'].includes(mode)||document.body.classList.contains('pbR100F72ExtraActive'))return;
    const selected=valid(window.pbR100F89ActiveStaffDay)?window.pbR100F89ActiveStaffDay:today();
    if(!state.month||state.mode!==mode||state.selected!==selected){
      state.month=selected;state.mode=mode;state.selected=selected;
    }
    const first=firstDay(state.month),key=parts(first);
    let monthLength=0;
    while(monthLength<32){
      const p=parts(shift(first,monthLength));
      if(p.month!==key.month||p.year!==key.year)break;
      monthLength++;
    }
    const offset=(first.getUTCDay()+1)%7;
    const nCells=Math.ceil((offset+monthLength)/7)*7;
    const name=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long',year:'numeric',timeZone:'Asia/Tehran'}).format(first);
    const bookings=(typeof data!=='undefined'?(data?.bookings||[]):window.data?.bookings)||[];
    let html='<div class="pbR100F89CalendarHeading">'+
      '<button type="button" data-pb89-month="-1" aria-label="ماه قبل">›</button>'+
      '<strong>'+name+'</strong>'+
      '<button type="button" data-pb89-month="1" aria-label="ماه بعد">‹</button></div>'+
      '<div class="pbR100F89CalendarGrid">';
    for(const w of ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'])html+='<span class="pbR100F89Weekday">'+w+'</span>';
    for(let i=0;i<nCells;i++){
      const d=shift(first,i-offset),day=iso(d),part=parts(d);
      const count=bookings.filter(b=>available(b,mode,day)).length;
      const title=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'long',day:'numeric',month:'long',timeZone:'Asia/Tehran'}).format(d);
      const inMonth=part.month===key.month&&part.year===key.year;
      html+='<button type="button" data-pb89-day="'+day+'"'+
        ' class="pbR100F89Cell'+(!inMonth?' other':'')+(day===selected?' active':'')+(day===today()?' today':'')+'"'+
        ' aria-pressed="'+(day===selected)+'" aria-label="'+title+(count?'، '+fa(count)+' آفیش':'، بدون آفیش')+'">'+
        '<b>'+fa(part.day)+'</b><small>'+(count?fa(count)+' آفیش':'')+'</small></button>';
    }
    html+='</div><p class="pbR100F89CalendarHelp">روز موردنظر را انتخاب کنید؛ آفیش‌ها در سمت چپ نمایش داده می‌شوند.</p>';
    rail.classList.add('pbR100F89MonthRail');
    if(rail.innerHTML!==html)rail.innerHTML=html;
    if(rail.dataset.pbR100F89Events!=='1'){
      rail.dataset.pbR100F89Events='1';
      rail.addEventListener('click',e=>{
        const nav=e.target.closest('[data-pb89-month]');
        if(nav){
          const first=firstDay(state.month);
          state.month=iso(shift(first,Number(nav.dataset.pb89Month)<0?-1:35));
          render();return;
        }
        const item=e.target.closest('[data-pb89-day]');
        if(item){
          state.month=item.dataset.pb89Day;
          window.pbR100F89PickStaffDay?.(item.dataset.pb89Day);
          render();
        }
      });
    }
  }
  const oldPaint=window.pbR100F9PaintStaffList;
  if(typeof oldPaint==='function'){
    window.pbR100F9PaintStaffList=function(...args){const out=oldPaint.apply(this,args);render();return out};
  }
  const oldRender=window.pbR100F9RenderStaffPortal;
  if(typeof oldRender==='function'){
    window.pbR100F9RenderStaffPortal=function(...args){const out=oldRender.apply(this,args);render();return out};
  }
  window.addEventListener('resize',render,{passive:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('.pbR100F9StaffTabs'))queueMicrotask(render)},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
