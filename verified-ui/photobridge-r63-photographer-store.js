(()=>{
  'use strict';
  const q=s=>document.querySelector(s), qa=s=>Array.from(document.querySelectorAll(s));
  let cy=0,cm=0,rs='',re='';
  function today(){try{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),o={};p.forEach(x=>{if(x.type==='year'||x.type==='month'||x.type==='day')o[x.type]=x.value});return o.year+'-'+o.month+'-'+o.day}catch{return new Date().toISOString().slice(0,10)}}
  function jp(iso){try{return typeof window.jalaliPartsFromIso==='function'?window.jalaliPartsFromIso(iso):null}catch{return null}}
  function jiso(y,m,d){try{if(typeof window.toGregorian!=='function')return'';const g=window.toGregorian(y,m,d);return String(g.gy).padStart(4,'0')+'-'+String(g.gm).padStart(2,'0')+'-'+String(g.gd).padStart(2,'0')}catch{return''}}
  function oneSelected(btn){const id=btn&&btn.dataset&&btn.dataset.storePanel;if(!id)return;qa('#storeSectionNavV673>[data-store-panel]').forEach(b=>{const on=b.dataset.storePanel===id;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')})}
  function initMonth(){if(cy&&cm)return;const t=jp(today());cy=t&&t.year||1405;cm=t&&t.month||1}
  function ensure(){const panel=q('#equipmentPanel'),box=panel&&panel.querySelector(':scope>.box');if(!panel||!box)return null;let host=q('#pbR63RentalCalendar');if(!host){host=document.createElement('div');host.id='pbR63RentalCalendar';host.className='pbR63RentalCalendar';host.innerHTML='<div class="pbR63CalendarHead"><button type="button" data-prev>‹</button><div class="pbR63CalendarTitle"><b></b><small></small></div><button type="button" data-next>›</button></div><div class="pbR63Week"><span>شنبه</span><span>یکشنبه</span><span>دوشنبه</span><span>سه‌شنبه</span><span>چهارشنبه</span><span>پنجشنبه</span><span>جمعه</span></div><div class="pbR63Days"></div><div class="pbR63CalendarFoot"><div class="pbR63Range"><b>تاریخ آفیش را انتخاب کنید</b><small>تاریخ را انتخاب کنید و سپس آفیش را بزنید. موجودی فروشگاه برای عکاس نمایش داده نمی‌شود.</small></div><button class="pbR63OfficeBtn" type="button" disabled>آفیش</button></div>';box.insertBefore(host,q('#equipmentFlow')||null);host.querySelector('[data-prev]').onclick=()=>move(-1);host.querySelector('[data-next]').onclick=()=>move(1);host.querySelector('.pbR63OfficeBtn').onclick=openOffice;
    const clear=document.createElement('button');
    clear.type='button';clear.className='pbR1130ClearDates';clear.textContent='پاک کردن تاریخ';
    host.querySelector('.pbR63CalendarFoot').insertBefore(clear,host.querySelector('.pbR63OfficeBtn'));
    clear.onclick=()=>{rs='';re='';render()};
    }
    let top=q('#pbR63OfficeTop');if(!top){top=document.createElement('div');top.id='pbR63OfficeTop';top.className='pbR63OfficeTop';top.innerHTML='<div><b>آفیش تجهیزات</b><small></small></div><button type="button" class="pbR63BackCalendar">تغییر تاریخ</button>';const flow=q('#equipmentFlow');if(flow)flow.insertBefore(top,flow.firstChild);top.querySelector('button').onclick=()=>{panel.classList.remove('pbR63OfficeOpen');render()}}
    return host}
  function move(x){initMonth();cm+=x;if(cm<1){cm=12;cy--}if(cm>12){cm=1;cy++}render()}
  function nextRange(start,end,iso,desktop){
    if(!start)return [iso,''];
    if(!desktop)return end?[iso,'']:iso<start?[iso,'']:[start,iso];
    if(iso<start)return [iso,end||start];
    if(iso>(end||start))return [start,iso];
    return [start,end];
  }
  function choose(iso){
    if(!iso||iso<today())return;
    [rs,re]=nextRange(rs,re,iso,matchMedia('(min-width:821px)').matches);
    render();
  }
  function render(){const host=ensure();if(!host)return;initMonth();const first=jiso(cy,cm,1);if(!first)return;const count=typeof window.jalaliMonthLength==='function'?window.jalaliMonthLength(cy,cm):31,off=(new Date(first+'T12:00:00Z').getUTCDay()+1)%7,days=host.querySelector('.pbR63Days'),tt=today();host.querySelector('.pbR63CalendarTitle b').textContent=(window.jalaliMonths&&window.jalaliMonths[cm-1])||String(cm);host.querySelector('.pbR63CalendarTitle small').textContent=typeof window.faDigits==='function'?window.faDigits(cy):String(cy);let h='';for(let i=0;i<off;i++)h+='<button class="pbR63Day blank" tabindex="-1"></button>';for(let d=1;d<=count;d++){const iso=jiso(cy,cm,d),range=!!rs&&iso>=rs&&iso<=(re||rs),edge=iso===rs||iso===re;h+='<button type="button" class="pbR63Day'+(iso===tt?' today':'')+(range?' inRange':'')+(edge?' edge':'')+'" data-date="'+iso+'" '+(iso<tt?'disabled':'')+'><span>'+(typeof window.faDigits==='function'?window.faDigits(d):d)+'</span></button>'}days.innerHTML=h;days.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>choose(b.dataset.date));const btn=host.querySelector('.pbR63OfficeBtn'),copy=host.querySelector('.pbR63Range'),end=re||rs;btn.disabled=!rs;if(rs){let a=rs,b=end;try{if(typeof window.rentalDateLongV811==='function'){a=window.rentalDateLongV811(rs);b=window.rentalDateLongV811(end)}}catch{}copy.querySelector('b').textContent=a+(end!==rs?' تا '+b:'');copy.querySelector('small').textContent='پس از انتخاب تجهیزات، درخواست برای تأیید فروشگاه ارسال می‌شود.';const clear=host.querySelector('.pbR1130ClearDates');if(clear)clear.disabled=!rs}else{copy.querySelector('b').textContent='تاریخ آفیش را انتخاب کنید';copy.querySelector('small').textContent='تاریخ را انتخاب کنید و سپس آفیش را بزنید. موجودی فروشگاه برای عکاس نمایش داده نمی‌شود.';const clear=host.querySelector('.pbR1130ClearDates');if(clear)clear.disabled=true}}
  function openOffice(){if(!rs)return;const end=re||rs,s=q('#start'),e=q('#end');try{if(s)s.value=typeof window.isoToJalaliInput==='function'?window.isoToJalaliInput(rs):rs;if(e)e.value=typeof window.isoToJalaliInput==='function'?window.isoToJalaliInput(end):end}catch{}q('#equipmentPanel')?.classList.add('pbR63OfficeOpen');const sm=q('#pbR63OfficeTop small');if(sm)sm.textContent=rs+(end!==rs?' تا '+end:'');try{if(typeof window.renderItems==='function')window.renderItems()}catch{}}
  function rentalIntro(){q('#equipmentPanel')?.classList.remove('pbR63OfficeOpen');render()}
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#storeSectionNavV673>[data-store-panel],.storeHomeActionsV671 [data-store-panel]');if(!b)return;setTimeout(()=>{oneSelected(b);if(b.dataset.storePanel==='equipmentPanel')rentalIntro()},0)},false);
  const boot=()=>{ensure();render();const active=q('#storeSectionNavV673>[data-store-panel].active');if(active)oneSelected(active)};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
