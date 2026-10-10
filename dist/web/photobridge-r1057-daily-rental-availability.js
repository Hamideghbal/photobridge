/* Day-specific availability shared by store staff and photographers. */
(()=>{
 'use strict';
 const dayFormat=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',weekday:'long',day:'numeric',month:'long'});
 const number=n=>Number(n).toLocaleString('fa-IR');
 const date=d=>dayFormat.format(new Date(String(d).slice(0,10)+'T12:00:00Z'));
 window.pbRentalDailyAvailabilityText=(days,quantity=1)=>{
   if(!Array.isArray(days)||!days.length)return '';
   const missing=days.filter(d=>Number(d.available)<quantity),available=days.filter(d=>Number(d.available)>=quantity);
   return [missing.length?'ناموجود / کسری: '+missing.map(d=>date(d.date)+' (کسری '+number(quantity-Number(d.available))+' عدد)').join('، '):'',available.length?'موجود: '+available.map(d=>date(d.date)).join('، '):''].filter(Boolean).join('\n');
 };
 window.pbRentalShortageDatesText=row=>Array.isArray(row.shortage_days)&&row.shortage_days.length
   ?'روزهای نیاز به تأمین: '+row.shortage_days.map(d=>date(d.date)+' · '+number(d.quantity)+' عدد').join('، '):'';
 const style=document.createElement('style');
 style.textContent='.pbRentalDailyDates,[data-booking-availability]{white-space:pre-line;overflow-wrap:anywhere}.pbRentalDailyDates{display:block;color:#344054;font-size:11px;line-height:1.8;margin-top:5px}';
 document.head.append(style);
 // The manager's existing availability controller reads the same day breakdown.
 // Only the photographer page needs its own debounced preview request.
 if(!document.getElementById('equipmentPanel'))return;
 let timer,sequence=0,snapshot=new Map();
 function paint(){
   document.querySelectorAll('#items .item').forEach(card=>{
     const id=card.querySelector('.pick')?.value,row=snapshot.get(id),quantity=Math.max(1,Number(card.querySelector('.qty')?.value)||1);
     let label=card.querySelector('.pbRentalDailyDates');
     if(!label){label=document.createElement('small');label.className='pbRentalDailyDates';card.querySelector('.itemInfo')?.append(label)}
     const text=row?.valid===false?'این تجهیز غیرفعال یا نامعتبر است.':window.pbRentalDailyAvailabilityText(row?.dailyAvailability,quantity);
     if(label.textContent!==text)label.textContent=text;
   });
 }
 function schedule(){
   clearTimeout(timer);const seq=++sequence;snapshot.clear();paint();
   timer=setTimeout(async()=>{
     const startDate=jalaliInputToIso(document.getElementById('start')?.value||''),endDate=jalaliInputToIso(document.getElementById('end')?.value||'');
     if(!shopId||!startDate||!endDate||!items.length)return;
     try{
       const out=await api('/api/customer/equipment-rental/availability',{method:'POST',body:JSON.stringify({shopId,startDate,endDate,items:items.map(i=>({itemId:i.id,quantity:1}))})});
       if(seq!==sequence)return;
       snapshot=new Map((out.items||[]).map(row=>[String(row.itemId),row]));paint();
     }catch{if(seq===sequence){document.querySelectorAll('.pbRentalDailyDates').forEach(label=>label.textContent='بررسی موجودی انجام نشد؛ دوباره تاریخ را انتخاب کنید.')}}
   },180);
 }
 const previous=renderItems;
 renderItems=function(){const out=previous.apply(this,arguments);schedule();return out};
 const previousDateChange=onRentalDateChangedV811;
 onRentalDateChangedV811=function(){const out=previousDateChange.apply(this,arguments);schedule();return out};
 document.addEventListener('input',e=>{if(e.target.matches('#start,#end'))schedule();else if(e.target.matches('#items .qty'))paint()});
 document.addEventListener('change',e=>{if(e.target.matches('#start,#end'))schedule();else if(e.target.matches('#items .qty'))paint()});
 schedule();
})();
