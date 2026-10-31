/* Day-specific availability shared by store staff and photographers. */
(()=>{
 'use strict';
 const dayFormat=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',weekday:'long',day:'numeric',month:'long'});
 const number=n=>Number(n).toLocaleString('fa-IR');
 const date=d=>dayFormat.format(new Date(String(d).slice(0,10)+'T12:00:00Z'));
 window.pbRentalDailyAvailabilityText=(days,quantity=1)=>{
   if(!Array.isArray(days)||!days.length)return '';
   const missing=days.filter(d=>Number(d.available)<quantity),available=days.filter(d=>Number(d.available)>=quantity);
   return [missing.length?'ناموجود / کسری: '+missing.map(d=>date(d.date)+' (کسری '+number(quantity-Number(d.available))+' عدد)').join('، '):'',available.length?'موجود: '+available.map(d=>date(d.date)+' (باقی‌مانده '+number(d.available)+' عدد)').join('، '):''].filter(Boolean).join('\n');
 };
 window.pbRentalShortageDatesText=row=>Array.isArray(row.shortage_days)&&row.shortage_days.length
   ?'روزهای نیاز به تأمین: '+row.shortage_days.map(d=>date(d.date)+' · '+number(d.quantity)+' عدد').join('، '):'';
 const style=document.createElement('style');
 style.textContent='.pbRentalDailyDates,[data-booking-availability]{white-space:pre-line;overflow-wrap:anywhere}.pbRentalDailyDates{display:block;color:#344054;font-size:11px;line-height:1.8;margin-top:5px}';
 document.head.append(style);
 // Customer cards are controlled by the stock-mode guard; never render stock counts there.
})();
