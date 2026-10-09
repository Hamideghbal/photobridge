/* R100F86: one mobile handover UI for shop owner and handover staff. */
(()=>{
  if(window.__PB_R100F86_UNIFIED_HANDOVER__)return;
  window.__PB_R100F86_UNIFIED_HANDOVER__=true;
  const $=(selector,root=document)=>root.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const fa=value=>Number(value||0).toLocaleString('fa-IR');
  const store=()=>typeof data!=='undefined'?(data||{}):(window.data||{});
  const isMobile=()=>window.matchMedia('(max-width:850px)').matches;
  const dateFa=value=>{try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Tehran'}).format(new Date(String(value).slice(0,10)+'T12:00:00Z'))}catch{return String(value||'—')}};
  const pendingFor=id=>(store().returnShortages||[]).filter(item=>String(item.booking_id)===String(id)&&String(item.status||'missing')==='missing'&&!item.resolved_at);
  const nameOf=b=>String(b.photographer_name||b.customer_name||'عکاس');
  const phoneOf=b=>String(b.photographer_mobile||b.customer_mobile||'');
  const gearOf=b=>String(window.pb100rOutGearSummary?.(b)||b.item_titles||'تجهیزات سفارش');
  const rangeOf=b=>String(window.pbR100F71BookingRange?.(b)||[dateFa(b.rental_start),dateFa(b.rental_end)].join(' تا '));
  const isStaff=()=>document.body.classList.contains('pbR100F9StaffMode');

  // Both date strips call this factory. Existing respective day-click/scroll handlers remain intact.
  window.pbR100F86DateButton=({scope,kind,day,selected,today,count})=>{
    const w=new Date(String(day)+'T12:00:00Z');
    const weekday=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'long',timeZone:'Asia/Tehran'}).format(w);
    const formatted=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric',month:'long',timeZone:'Asia/Tehran'}).format(w);
    const manager=scope==='manager';
    const attrs=manager?'data-pb100r-date-kind="'+esc(kind)+'" data-pb100r-day="'+esc(day)+'" onclick="pb100rSelectManagerDate(\''+esc(kind)+'\',\''+esc(day)+'\')"':'data-staff-day="'+esc(day)+'"';
    return '<button type="button" class="pbR100F86Day '+(day===selected?'active':'')+'" '+attrs+' data-today="'+(day===today)+'">'+
      '<span class="pbR100F86DateTop pbR100F9StaffDateTop pb100rManagerDateTop"><small>'+esc(weekday)+'</small></span>'+
      '<strong>'+esc(formatted)+'</strong><em><b>'+fa(count)+'</b> آفیش'+
      (day===today?'<span class="pbR100F76TodayBadge">امروز</span>':'')+'</em></button>';
  };

  // The exact same card markup powers all three destinations in both roles.
  window.pbR100F86Card=(booking,mode,actionHTML='',options={})=>{
    const b=booking||{},out=mode==='out',returned=b.status==='returned';
    const delivered=out&&['picked_up','returned'].includes(String(b.status));
    const receipt=!out&&returned;
    const state=out?(delivered?'✓ تحویل شده':''):(receipt?'✓ دریافت شده':'');
    const shortages=!out&&receipt?pendingFor(b.id):[];
    const warning=shortages.length?'<div class="pbR100F86Missing" role="note">کسری دریافت: '+
      shortages.map(x=>esc(x.item_title||'تجهیز')+' × '+fa(x.missing_qty||0)+' عدد').join('، ')+'</div>':'';
    const classes=['pbR100F86Card','pbR100F71UnifiedCard'];
    if(options.staff)classes.push('pbR100F9StaffCard');
    else classes.push('pb854BookingStatusCard','pb914BookingCard');
    if(warning)classes.push('pbR100F86HasMissing');
    const waiting=options.badge&&b.status==='payment_pending'?'<span class="pbR100F86Pending">منتظر پرداخت</span>':'';
    return '<article class="'+classes.join(' ')+'" data-pb915-booking-id="'+esc(b.id)+'" role="button" tabindex="0" aria-label="نمایش جزئیات آفیش">'+
      '<div class="pbR100F71Identity pbR100F86Identity">'+
      '<b>'+esc(nameOf(b))+'</b>'+waiting+
      '<small class="pbR100F86Phone" dir="ltr">'+esc(phoneOf(b))+'</small>'+
      '<small class="pbR100F71Gear">'+esc(gearOf(b))+'</small>'+
      '<small class="pbR100F71Range">'+esc(rangeOf(b))+'</small>'+warning+'</div>'+
      '<div class="pbR100F71StaffAction pbR100F86Action">'+
      (options.notice?'<small class="pbR100F86Deadline">'+options.notice+'</small>':'')+
      (actionHTML||'')+
      (state?'<span class="pbR100F9StaffState pbR100F74Received">'+state+'</span>':'')+
      '</div></article>';
  };

  // A single shared shortage card is used by the manager's shortage pane and the staff pane.
  window.pbR100F86ShortageCards=()=>{
    const rows=[...(store().returnShortages||[])].sort((a,b)=>Number(Boolean(a.resolved_at))-Number(Boolean(b.resolved_at)));
    return '<section class="pbR100F72Panel pbR100F86ShortagePanel"><h2>کسری دریافت</h2>'+
      '<div class="pbR100F72Entries">'+(rows.length?rows.map(x=>{
        const done=x.status==='returned_later'||Boolean(x.resolved_at);
        const bookingId=String(x.booking_id||'');
        const status=done?'<strong class="resolved">✓ دریافت شده</strong>':'<strong class="pending">کسری '+fa(x.missing_qty)+' عدد</strong>';
        return '<article class="pbR100F72Entry pbR100F86ShortageCard" data-shortage-id="'+esc(x.id)+'">'+
          '<b>'+esc(x.photographer_name||x.customer_name||'عکاس')+'</b>'+
          '<small dir="ltr" class="pbR100F86Phone">'+esc(x.customer_mobile||x.photographer_mobile||'')+'</small>'+
          '<div>'+esc(x.item_title||'تجهیز')+' · '+fa(x.missing_qty)+' عدد</div>'+
          '<small>ثبت کسری: '+esc(dateFa(x.detected_at))+'</small>'+
          (x.resolution_note?'<small>توضیح: '+esc(x.resolution_note)+'</small>':'')+
          status+'<div class="pbR100F86ShortageActions">'+
          (done?'':'<button type="button" class="pbR100F74ResolveBtn" data-r74-return-shortage="'+esc(x.id)+'">دریافت کسری</button>')+
          (done&&bookingId?'<button type="button" class="pbR100F86InvoiceLink" data-pbr86-invoice-booking="'+esc(bookingId)+'">فاکتور</button>':'')+
          '</div></article>';
      }).join(''):'<div class="pbR100F72Empty">کسری دریافتی ثبت نشده است.</div>')+'</div></section>';
  };
  const priorManagerShortagePane=window.pbR85ReturnShortagePane;
  window.pbR85ReturnShortagePane=()=>isMobile()?'<div class="box pbR100F86ManagerShortages">'+window.pbR100F86ShortageCards()+'</div>':(typeof priorManagerShortagePane==='function'?priorManagerShortagePane():'');
  document.addEventListener('click',event=>{
    const receive=event.target.closest?.('[data-r74-return-shortage]');
    if(receive){
      event.preventDefault();event.stopPropagation();
      if(receive.disabled)return;
      const id=receive.dataset.r74ReturnShortage;
      if(id&&typeof window.pbR85ResolveReturnShortage==='function')window.pbR85ResolveReturnShortage(id,receive);
      return;
    }
    const invoice=event.target.closest?.('[data-pbr86-invoice-booking]');
    if(invoice){event.preventDefault();event.stopPropagation();window.pbR100F86OfferInvoice(invoice.dataset.pbr86InvoiceBooking)}
  },true);

  const safeDate=value=>esc(dateFa(value));
  const printInvoice=async bookingId=>{
    const printWindow=window.open('','_blank','width=900,height=900');
    if(!printWindow){window.storeNotice?.('پنجره چاپ مسدود شد؛ بازکردن پنجره‌های جدید را مجاز کنید.','فاکتور');return}
    try{
      const response=await fetch('/api/rental/bookings/'+encodeURIComponent(bookingId)+'/handover-invoice',{credentials:'same-origin'});
      const result=await response.json().catch(()=>({}));
      if(!response.ok||!result.invoice)throw new Error('فاکتور این آفیش پیدا نشد.');
      const i=result.invoice,items=Array.isArray(i.items)?i.items:[];
      const money=n=>fa(n)+' تومان';
      const lines=items.map((item,index)=>'<tr><td>'+fa(index+1)+'</td><td>'+esc(item.title)+'</td><td>'+fa(item.quantity)+'</td><td>'+fa(item.rental_days)+'</td><td>'+esc(money(item.daily_price))+'</td><td>'+esc(money(item.subtotal))+'</td></tr>').join('');
      const html='<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>فاکتور '+esc(i.invoice_number)+'</title>'+
        '<style>@page{size:A4;margin:14mm}body{font:12px/1.8 Tahoma,Arial,sans-serif;color:#182230}.head{display:flex;justify-content:space-between;border-bottom:2px solid #344054;padding-bottom:12px}.facts{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #cbd5e1;padding:7px;text-align:right}th{background:#eef2f7}.total{font-size:15px;font-weight:bold;text-align:left;margin:22px 0}button{padding:10px 18px;background:#315efb;color:white;border:0;border-radius:8px}@media print{button{display:none}}</style></head><body>'+
        '<div class="head"><div><h2>فاکتور اجاره تجهیزات</h2>شماره: '+esc(i.invoice_number)+'</div><b>'+esc(result.shopName)+'</b></div>'+
        '<div class="facts"><div>عکاس: '+esc(i.photographer_name)+'</div><div>موبایل: <span dir="ltr">'+esc(i.photographer_mobile)+'</span></div><div>بازه آفیش: '+safeDate(i.rental_start)+' تا '+safeDate(i.rental_end)+'</div><div>صدور: '+safeDate(i.issued_at)+'</div></div>'+
        '<table><thead><tr><th>ردیف</th><th>تجهیزات</th><th>تعداد</th><th>روز</th><th>روزانه</th><th>مبلغ</th></tr></thead><tbody>'+lines+'</tbody></table>'+
        (Number(i.invoice_adjustment_amount||0)>0?'<p>جریمه / اصلاح فاکتور: '+esc(money(i.invoice_adjustment_amount))+'</p>':'')+
        (i.invoice_adjustment_note?'<p>توضیح: '+esc(i.invoice_adjustment_note)+'</p>':'')+
        '<div class="total">مبلغ نهایی: '+esc(money(i.total_amount))+'</div><p>ودیعه: '+esc(money(i.deposit_amount))+'</p>'+
        '<button onclick="window.print()">چاپ / ذخیره PDF</button></body></html>';
      printWindow.document.open();printWindow.document.write(html);printWindow.document.close();
      printWindow.focus();
    }catch(e){
      printWindow.close();window.storeNotice?.(e?.message||'نمایش فاکتور انجام نشد.','فاکتور');
    }
  };
  window.pbR100F86OfferInvoice=bookingId=>{
    if(!bookingId)return;
    document.querySelector('.pbR100F86InvoiceOverlay')?.remove();
    const back=document.createElement('div');
    back.className='pbR100F86InvoiceOverlay';
    back.innerHTML='<section role="dialog" aria-modal="true" aria-label="فاکتور دریافت کسری"><h2>فاکتور دریافت کسری</h2>'+
      '<p>برای مشاهده، چاپ یا ذخیره فاکتور اصلاح‌شده از دکمه زیر استفاده کنید.</p>'+
      '<div><button type="button" data-close>بستن</button><button type="button" class="primary" data-print>مشاهده / چاپ فاکتور</button></div></section>';
    document.body.appendChild(back);
    back.querySelector('[data-close]').onclick=()=>back.remove();
    back.querySelector('[data-print]').onclick=()=>{back.remove();void printInvoice(bookingId)};
    back.addEventListener('click',e=>{if(e.target===back)back.remove()});
  };

  // The shop's shared logo is reloaded on return to the staff screen; no personal staff avatar.
  let logoLoading=false;
  async function syncLogo(){
    if(!isStaff()||logoLoading||document.visibilityState==='hidden')return;
    logoLoading=true;
    try{
      const r=await fetch('/api/rental/profile-image',{credentials:'same-origin'});
      if(!r.ok)return;
      const response=await r.json(),next=String(response.imageData||'');
      if(window.__pbRentalProfileImage!==next){
        window.__pbRentalProfileImage=next;
        window.pbR100F60RenderAccountHeader?.();
      }
    }catch{}finally{logoLoading=false}
  }
  window.addEventListener('focus',syncLogo,{passive:true});
  window.addEventListener('pageshow',syncLogo,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncLogo()});
  const oldReload=window.pbR100F9ReloadStaff;
  if(typeof oldReload==='function')window.pbR100F9ReloadStaff=async function(...args){
    const result=await oldReload.apply(this,args);void syncLogo();return result;
  };

  function syncTabs(){
    if(!isMobile())return;
    const top=$('#pb848BookingHeaderTabs');
    if(top&&!isStaff()){
      for(const [key,label] of [['approved','تحویل'],['out','دریافت'],['returnShortages','کسری دریافت']]){
        const b=top.querySelector('[data-pb843-office-tab="'+key+'"]');
        if(!b)continue;
        b.classList.add('pbR100F86Tab');
        const element=b.querySelector('.pb905rOfficeTabLabel,.pb904r5OfficeTabLabel,.pb854TabLabel');
        if(element&&element.textContent!==label)element.textContent=label;
        if(!element&&b.childElementCount===0&&b.textContent!==label)b.textContent=label;
      }
    }
    $('.pbR100F9StaffTabs')?.querySelectorAll('button').forEach(button=>button.classList.add('pbR100F86Tab'));
  }
  document.addEventListener('click',event=>{if(event.target.closest?.('#pb848BookingHeaderTabs,.pbR100F9StaffTabs'))queueMicrotask(syncTabs)},true);
  requestAnimationFrame(syncTabs);
  setTimeout(syncTabs,600);
  if(isStaff())void syncLogo();
})();