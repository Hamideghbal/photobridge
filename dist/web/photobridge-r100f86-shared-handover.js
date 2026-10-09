/* R100F86: ONE mobile handover UI shared by manager and operator. */
(()=>{
 if(window.__PB_R100F86_SHARED_HANDOVER__)return;
 window.__PB_R100F86_SHARED_HANDOVER__=true;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const store=()=>typeof data!=='undefined'?(data||{}):(window.data||{});
 const fa=x=>Number(x||0).toLocaleString('fa-IR');
 const iso=x=>String(x||'').slice(0,10);
 const date=x=>{if(!x)return '—';try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Tehran'}).format(new Date(iso(x)+'T12:00:00Z'))}catch{return iso(x)}};
 const shortages=id=>(store().returnShortages||[]).filter(s=>String(s.booking_id)===String(id)&&s.status==='missing'&&!s.resolved_at&&Number(s.missing_qty)>0);
 const summary=b=>{if(typeof window.pb100rOutGearSummary==='function')return window.pb100rOutGearSummary(b);return b.item_titles||'تجهیزات آفیش'};
 const range=b=>{if(typeof window.pbR100F71BookingRange==='function')return window.pbR100F71BookingRange(b);return date(b.rental_start)+' تا '+date(b.rental_end)};
 const modeNames={out:'تحویل',in:'دریافت',returnShortages:'کسری دریافت'};
 // Both roles render exactly the same card classes, order and markup.
 // pb914BookingCard was triggering legacy owner-only mobile stacking rules.
 window.pbR100F86Card=(b,mode,action,state,config={})=>{
   const done=b.status==='returned',picked=b.status==='picked_up',who=b.photographer_name||b.customer_name||'عکاس';
   const missing=mode==='in'&&done?shortages(b.id):[];
   const missingText=missing.map(x=>fa(x.missing_qty)+' عدد '+String(x.item_title||'تجهیز')).join('، ');
   const badgeText=mode==='out'?(done||picked?'✓ تحویل شده':''):(done?'✓ دریافت شده':'');
   // Printable owner documents are in the details dialog, not on mobile cards.
   const controls=String(action||'').replace(/<span class="pb100rManagerDocs">[\s\S]*?<\/span>/g,'').trim();
   const badge=badgeText&&!controls.includes('pbR100F9StaffState')?
      '<span class="pbR100F9StaffState pbR100F86State">'+esc(badgeText)+'</span>':'';
   return '<article class="pbR100F9StaffCard pbR100F71UnifiedCard pbR100F86SharedCard" data-pb915-booking-id="'+esc(b.id)+'" role="button" tabindex="0" aria-label="نمایش جزئیات آفیش">'+
     '<div class="pbR100F71Identity pbR100F86Identity">'+
     '<b>'+esc(who)+'</b>'+(config.badge||'')+
     '<small class="pb854PhotographerPhone" dir="ltr">'+esc(b.photographer_mobile||b.customer_mobile||'')+'</small>'+
     '<small class="pbR100F71Gear">'+esc(summary(b))+'</small>'+
     '<small class="pbR100F71Range">'+esc(range(b))+'</small>'+
     '</div><div class="pbR100F71StaffAction pbR100F86Actions">'+
     (controls?'<div class="pbR100F86ActionButtons">'+controls+'</div>':'')+badge+'</div>'+
     (missing.length?'<div class="pbR100F86MissingNote">کسری دریافت: '+esc(missingText)+'</div>':'')+
     (config.notice?'<div class="pbR100F86DeadlineNote">'+config.notice+'</div>':'')+
     '</article>';
 };
 window.pbR100F86DateButton=({d,count,selected,today,managerKind,staff})=>{
   const when=new Date(d+'T12:00:00Z');
   const weekday=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'long',timeZone:'Asia/Tehran'}).format(when);
   const label=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric',month:'long',timeZone:'Asia/Tehran'}).format(when);
   const manager=!!managerKind,attrs=manager?
     'data-pb100r-date-kind="'+managerKind+'" data-pb100r-day="'+d+'" onclick="pb100rSelectManagerDate(&quot;'+managerKind+'&quot;,&quot;'+d+'&quot;)"':
     'data-staff-day="'+d+'"';
   return '<button type="button" '+attrs+' data-today="'+(d===today)+'" class="pbR100F86Day'+(d===selected?' active':'')+'">'+
     '<span class="pbR100F86DayTop pb100rManagerDateTop pbR100F9StaffDateTop"><small>'+esc(weekday)+'</small></span>'+
     '<strong>'+esc(label)+'</strong><em><b>'+fa(count)+'</b> آفیش'+(d===today?'<span class="pbR100F76TodayBadge">امروز</span>':'')+'</em></button>';
 };
 window.pbR100F86ShortageCards=()=>{
   const rows=[...(store().returnShortages||[])].sort((a,b)=>Number(Boolean(a.resolved_at))-Number(Boolean(b.resolved_at)));
   return '<section class="pbR100F72Panel pbR100F86Shortages"><h2>کسری دریافت</h2><div class="pbR100F72Entries">'+
     (rows.length?rows.map(x=>{
       const done=x.status==='returned_later'||!!x.resolved_at;
       return '<article class="pbR100F72Entry pbR100F86ShortageEntry">'+
         '<b>'+esc(x.photographer_name||x.customer_name||'عکاس')+'</b>'+
         '<small dir="ltr">'+esc(x.photographer_mobile||x.customer_mobile||'')+'</small>'+
         '<div class="pbR100F86ShortageItem">'+esc(x.item_title||'تجهیز')+'</div>'+
         '<small>'+esc(date(x.detected_at))+'</small>'+
         '<strong class="'+(done?'resolved':'pending')+'">'+(done?'✓ دریافت شده':'کسری '+fa(x.missing_qty)+' عدد')+'</strong>'+
         (x.resolution_note?'<small>توضیح: '+esc(x.resolution_note)+'</small>':'')+
         (done?'':'<button type="button" class="pbR100F74ResolveBtn" data-r74-return-shortage="'+esc(x.id)+'" data-pbr86-resolve="'+esc(x.id)+'">دریافت کسری</button>')+
         '</article>';
     }).join(''):'<div class="pbR100F72Empty">موردی ثبت نشده است.</div>')+'</div></section>';
 };
 // All three panes use the same shortage markup/handler; only existing role permissions differ.
 window.pbR85ReturnShortagePane=window.pbR100F86ShortageCards;
 document.addEventListener('click',e=>{
   const b=e.target.closest?.('[data-pbr86-resolve]');
   if(b){e.preventDefault();e.stopPropagation();window.pbR85ResolveReturnShortage?.(b.dataset.pbr86Resolve,b);return}
 },true);
 function syncTabs(){
   const staff=document.body.classList.contains('pbR100F9StaffMode');
   document.querySelectorAll('.pbR100F9StaffTabs [data-staff-mode]').forEach(b=>{
     if(!modeNames[b.dataset.staffMode])return;
     b.textContent=modeNames[b.dataset.staffMode];
     b.classList.add('pbR100F86ModeTab');
   });
   const tabs=document.querySelector('#pb848BookingHeaderTabs');
   if(tabs&&!staff){
     const handover=tabs.querySelector('[data-pb843-office-tab="approved"]');
     const receiving=tabs.querySelector('[data-pb843-office-tab="out"]');
     const shortage=tabs.querySelector('[data-pb843-office-tab="returnShortages"]');
     if(handover&&receiving&&handover.nextElementSibling!==receiving)handover.insertAdjacentElement('afterend',receiving);
     if(receiving&&shortage&&receiving.nextElementSibling!==shortage)receiving.insertAdjacentElement('afterend',shortage);
     for(const [mode,key] of [['out','approved'],['in','out'],['returnShortages','returnShortages']]){
       const b=tabs.querySelector('[data-pb843-office-tab="'+key+'"]');
       if(!b)continue;
       const label=b.querySelector('.pb905rOfficeTabLabel')||b;
       if(label.textContent!==modeNames[mode])label.textContent=modeNames[mode];
       b.classList.add('pbR100F86ModeTab');
     }
   }
 }
 // The staff portrait is always the shop's saved logo, not the operator's portrait.
 let loading=false;
 async function syncLogo(){
   if(loading||!document.body.classList.contains('pbR100F9StaffMode'))return;
   loading=true;
   try{
     const response=await fetch('/api/rental/profile-image',{credentials:'same-origin',headers:{'x-photobridge-portal':'rental'}});
     if(!response.ok)return;
     const value=String((await response.json()).imageData||'');
     if(value!==String(window.__pbRentalProfileImage||'')){
       window.__pbRentalProfileImage=value;
       window.pbR100F60RenderAccountHeader?.();
     }
   }catch{}finally{loading=false}
 }
 const render=window.pbR100F9RenderStaffPortal;
 if(typeof render==='function')window.pbR100F9RenderStaffPortal=function(...args){const out=render.apply(this,args);syncTabs();void syncLogo();return out};
 document.addEventListener('click',e=>{if(e.target.closest?.('.pbR100F9StaffTabs,#pb848BookingHeaderTabs'))setTimeout(syncTabs,0)},true);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void syncLogo()});
 window.addEventListener('focus',()=>void syncLogo(),{passive:true});
 setTimeout(()=>{syncTabs();if(document.body.classList.contains('pbR100F9StaffMode'))window.pbR100F9PaintStaffList?.();else if(document.body.classList.contains('pb899MainBookings'))window.pb854RenderBookingStatusPanes?.();void syncLogo()},0);

 const invoiceUrl=id=>'/api/rental/bookings/'+encodeURIComponent(id)+'/handover-invoice';
 async function printInvoice(bookingId){
   // Open on direct user click, before the network request, to avoid blocked popups.
   const w=window.open('','_blank','width=900,height=900');
   if(!w){window.storeNotice?.('اجازه بازکردن پنجره چاپ فاکتور را فعال کنید.','چاپ فاکتور');return}
   w.document.write('<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>فاکتور فروشگاه</title></head><body><p>در حال دریافت فاکتور…</p></body></html>');
   try{
     const response=await fetch(invoiceUrl(bookingId),{credentials:'same-origin',headers:{'x-photobridge-portal':'rental'}});
     if(!response.ok)throw Error('invoice_not_found');
     const {invoice:i,shopName}=await response.json();
     const lineItems=Array.isArray(i.items)?i.items:[];
     const lines=lineItems.map((x,j)=>'<tr><td>'+fa(j+1)+'</td><td>'+esc(x.title||'تجهیز')+'</td><td>'+fa(x.quantity)+'</td><td>'+fa(x.rental_days||1)+'</td><td>'+fa(x.subtotal)+'</td></tr>').join('');
     const total=fa(i.total_amount)+' تومان',depo=fa(i.deposit_amount)+' تومان';
     w.document.open();
     w.document.write('<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>فاکتور '+esc(i.invoice_number)+'</title>'+
       '<style>@page{size:A4;margin:13mm}body{font:12px/1.9 Tahoma,Arial,sans-serif;color:#182230;margin:20px}header{display:flex;justify-content:space-between;border-bottom:2px solid #475467;padding-bottom:12px}h1{font-size:19px;margin:0}.info{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:18px 0}table{border-collapse:collapse;width:100%}td,th{border:1px solid #d0d5dd;padding:8px;text-align:right}th{background:#f2f4f7}.total{margin-top:18px;font-size:15px;font-weight:bold}.action{margin:20px 0;padding:10px 16px;background:#315efb;color:white;border:0;border-radius:8px}@media print{.action{display:none}}</style></head><body>'+
       '<header><div><h1>فاکتور اجاره تجهیزات</h1>شماره: '+esc(i.invoice_number)+'</div><b>'+esc(shopName)+'</b></header>'+
       '<div class="info"><div>عکاس: <b>'+esc(i.photographer_name)+'</b></div><div>تلفن: <b dir="ltr">'+esc(i.photographer_mobile)+'</b></div>'+
       '<div>بازه آفیش: '+esc(date(i.rental_start))+' تا '+esc(date(i.rental_end))+'</div><div>تاریخ صدور: '+esc(date(i.issued_at))+'</div></div>'+
       '<table><thead><tr><th>ردیف</th><th>شرح</th><th>تعداد</th><th>روز</th><th>مبلغ (تومان)</th></tr></thead><tbody>'+lines+'</tbody></table>'+
       '<div class="total">مبلغ نهایی: '+total+'</div><div>ودیعه: '+depo+'</div>'+
       (Number(i.invoice_adjustment_amount)>0?'<p>هزینه اصلاح / دیرکرد: '+fa(i.invoice_adjustment_amount)+' تومان</p><p>'+esc(i.invoice_adjustment_note)+'</p>':'')+
       '<button class="action" onclick="window.print()">چاپ / ذخیره PDF</button></body></html>');
     w.document.close();setTimeout(()=>{try{w.focus();w.print()}catch{}},350);
   }catch{w.close();window.storeNotice?.('فاکتور این آفیش دریافت نشد.','خطای فاکتور')}
 }
 window.pbR100F86OfferInvoice=id=>{
   document.querySelector('#pbR100F86InvoiceChoice')?.remove();
   const back=document.createElement('div');back.id='pbR100F86InvoiceChoice';back.className='pbR100F76ShortageBack';
   back.innerHTML='<div class="pbR100F76ShortageDialog" role="dialog" aria-modal="true">'+
     '<h2>دریافت کسری ثبت شد</h2><p>فاکتور به‌روز شده است. آیا می‌خواهید آن را چاپ یا ذخیره کنید؟</p>'+
     '<div class="pbR100F76Buttons"><button type="button" data-close>بستن</button><button type="button" data-print>چاپ / نمایش فاکتور</button></div></div>';
   document.body.append(back);
   back.querySelector('[data-close]').onclick=()=>back.remove();
   back.querySelector('[data-print]').onclick=()=>{printInvoice(id);back.remove()};
 };
})();
