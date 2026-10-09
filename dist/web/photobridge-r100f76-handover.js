/* PhotoBridge R100F76: confirmed shortage receipt with optional owner-only late fee. */
(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const store=()=>typeof data!=='undefined'?(data||{}):(window.data||{});
  const rows=()=>Array.isArray(store().returnShortages)?store().returnShortages:[];
  const notify=(message,title)=>window.storeNotice?.(message,title);
  window.pbR85ResolveReturnShortage=async(id,btn)=>{
    if(btn?.disabled)return;
    const row=rows().find(x=>String(x.id)===String(id));
    if(!row||row.resolved_at||String(row.status)!=='missing'){
      notify('این کسری قبلاً دریافت شده یا دیگر قابل ثبت نیست.','کسری تحویل');return;
    }
    const booking=(store().bookings||[]).find(x=>String(x.id)===String(row.booking_id));
    const owner=!store().staffMode;
    const back=document.createElement('div');
    back.className='pbR100F76ShortageBack';
    back.innerHTML='<form class="pbR100F76ShortageDialog" role="dialog" aria-modal="true">'+
      '<h2>تحویل کسری</h2><p>تمام '+esc(row.missing_qty||0)+' واحد کسری «'+esc(row.item_title||'تجهیز')+'» برگشته است؟</p>'+
      '<label class="pbR100F76Confirm"><input name="confirmed" type="checkbox">بازگشت تمام واحدهای این کسری را تأیید می‌کنم.</label>'+
      '<label>توضیح تحویل (اختیاری)<textarea name="note" rows="2" maxlength="1000" placeholder="وضعیت تجهیزات یا زمان تحویل"></textarea></label>'+
      (owner?'<label class="pbR100F76Confirm"><input name="addFee" type="checkbox">افزودن هزینه دیرکرد به فاکتور</label>'+
        '<div class="pbR100F76FeeFields" hidden><label>مبلغ افزایشی (تومان)<input name="fee" type="number" min="1" max="1000000000000" step="1" inputmode="numeric"></label>'+
        '<label>دلیل اصلاح فاکتور<textarea name="feeReason" maxlength="1000" rows="2" placeholder="مثلاً بازگشت با تأخیر"></textarea></label>'+
        '<small class="pbR100F76InvoiceTotal"></small></div>':'')+
      '<p class="pbR100F76Error" role="alert" aria-live="polite"></p>'+
      '<div class="pbR100F76Buttons"><button type="button" data-cancel>انصراف</button><button type="submit">ثبت تحویل کسری</button></div></form>';
    document.body.appendChild(back);
    const form=back.querySelector('form'),error=back.querySelector('.pbR100F76Error');
    const overflow=document.body.style.overflow;
    let sending=false,closed=false;
    document.body.style.overflow='hidden';
    const close=()=>{if(closed)return;closed=true;back.remove();document.removeEventListener('keydown',onKey);document.body.style.overflow=overflow;if(btn)btn.disabled=false};
    const onKey=e=>{if(e.key==='Escape'&&!sending){e.preventDefault();close()}};
    document.addEventListener('keydown',onKey);
    back.querySelector('[data-cancel]').onclick=()=>{if(!sending)close()};
    back.onclick=e=>{if(e.target===back&&!sending)close()};
    const refreshFee=()=>{
      const active=!!form.elements.addFee?.checked,fields=back.querySelector('.pbR100F76FeeFields');
      if(fields)fields.hidden=!active;
      const current=Number(booking?.total_amount||0),amount=active?Number(form.elements.fee?.value||0):0,total=back.querySelector('.pbR100F76InvoiceTotal');
      if(total)total.textContent=booking&&Number.isSafeInteger(current+amount)&&current+amount>=0?
        'مبلغ فاکتور پس از اصلاح: '+(typeof money==='function'?money(current+amount):String(current+amount)+' تومان'):
        'مبلغ افزایشی پس از ثبت به فاکتور اصلی اضافه خواهد شد.';
    };
    form.elements.addFee?.addEventListener('change',refreshFee);
    form.elements.fee?.addEventListener('input',refreshFee);
    refreshFee();
    form.onsubmit=async e=>{
      e.preventDefault();if(sending)return;
      error.textContent='';
      if(!form.elements.confirmed.checked){error.textContent='بازگشت تمام واحدهای کسری را تأیید کن.';return}
      const hasFee=!!form.elements.addFee?.checked;
      const amount=Number(form.elements.fee?.value),reason=String(form.elements.feeReason?.value||'').trim();
      if(hasFee&&(!Number.isSafeInteger(amount)||amount<1||amount>1000000000000||!reason)){
        error.textContent='مبلغ معتبر و دلیل اصلاح فاکتور را وارد کن.';return;
      }
      const payload={note:String(form.elements.note?.value||'').trim()};
      if(hasFee)payload.invoiceAdjustment={amount,note:reason};
      sending=true;form.querySelector('[type=submit]').disabled=true;if(btn)btn.disabled=true;
      try{
        await api('/api/rental/return-shortages/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(payload)});
        close();
        if(document.body.classList.contains('pbR100F9StaffMode')){
          await window.pbR100F9ReloadStaff?.();
        }else{
          await load({reloadExtra:false});
          window.pb843SetOfficeTab?.('returnShortages');
        }
        notify(hasFee?'تحویل کسری و افزایش فاکتور ثبت شد.':'تحویل کسری ثبت شد.','تکمیل شد');
      }catch(ex){
        sending=false;form.querySelector('[type=submit]').disabled=false;if(btn)btn.disabled=false;
        const msg={return_shortage_asset_mismatch:'کد یا وضعیت واحدهای کسری با سفارش تطبیق ندارد.',
          invoice_adjustment_not_allowed:'اصلاح مالی فقط برای مدیر فروشگاه مجاز است.',
          return_shortage_not_found:'این کسری قبلاً ثبت شده یا دیگر قابل دریافت نیست.',
          invoice_adjustment_negative_total:'مبلغ اصلاح معتبر نیست.'};
        error.textContent=msg[ex?.error]||'ثبت تحویل کسری انجام نشد. دوباره تلاش کن.';
      }
    };
  };
})();

/* R100F80: let handover staff confirm store booking shortages and print a record. */
(()=>{
  if(window.__PB_R100F80_STAFF_SHORTAGE__)return;
  window.__PB_R100F80_STAFF_SHORTAGE__=true;
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const current=()=>typeof data!=='undefined'?(data||{}):(window.data||{});
  const number=value=>typeof window.fa==='function'?window.fa(value):String(value??'');
  const message=(text,title='کسری آفیش')=>window.storeNotice?.(text,title);
  const staffMode=()=>document.body.classList.contains('pbR100F9StaffMode');
  function printReceipt(row){
    const w=window.open('','_blank','width=800,height=720');
    if(!w){message('برای چاپ رسید، پنجرهٔ جدید مرورگر را مجاز کن.','پنجرهٔ چاپ بسته است');return}
    const shop=escapeHtml(current().shop?.name||'فروشگاه تجهیزات'),name=escapeHtml(row.photographer_name||'عکاس');
    const item=escapeHtml(row.item_title||'تجهیز'),qty=number(row.shortage_qty||0),note=escapeHtml(row.resolution_note||'بدون توضیح');
    const day=escapeHtml(typeof window.dateFa==='function'?window.dateFa(row.rental_start):row.rental_start||'—');
    const actor=escapeHtml(row.resolved_by_name||'متصدی تحویل فروشگاه');
    const confirmed=escapeHtml(typeof window.dateFa==='function'?window.dateFa(row.resolved_at):row.resolved_at||'—');
    w.document.open();w.document.write(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>رسید تأیید کسری آفیش</title><style>body{font:15px/2 Tahoma,Arial,sans-serif;color:#182230;margin:32px}.paper{max-width:760px;margin:auto;border:1px solid #d0d5dd;border-radius:16px;padding:28px}.head{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #315efb;padding-bottom:14px}.head h1{font-size:21px;margin:0}.muted{color:#667085}.facts{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0}.facts div{padding:12px;border:1px solid #e4e7ec;border-radius:10px}.note{padding:14px;background:#f8fafc;border-radius:10px}.sign{display:flex;justify-content:space-between;margin-top:42px;color:#475467}.print{margin:18px 0;padding:10px 18px;border:0;border-radius:8px;background:#315efb;color:white;font-weight:bold}@media print{body{margin:0}.paper{border:0}.print{display:none}}</style></head><body><main class="paper"><header class="head"><h1>رسید تأیید تأمین کسری آفیش</h1><b>${shop}</b></header><section class="facts"><div>عکاس / مشتری: <b>${name}</b></div><div>تجهیز: <b>${item}</b></div><div>تعداد کسری تأمین‌شده: <b>${qty} عدد</b></div><div>تاریخ آفیش: <b>${day}</b></div><div>تأییدکننده: <b>${actor}</b></div><div>تاریخ ثبت تأیید: <b>${confirmed}</b></div></section><p class="note"><b>توضیحات ثبت‌شده:</b> ${note}</p><footer class="sign"><span>امضای فروشگاه</span><span>امضای تحویل‌گیرنده</span></footer><button class="print" onclick="window.print()">چاپ / ذخیره PDF</button></main></body></html>`);w.document.close();setTimeout(()=>{try{w.focus();w.print()}catch{}},250);
  }
  function render(){
    const root=document.getElementById('pbR100F9StaffList');if(!root||!staffMode())return;
    root.querySelector('[data-staff-shortages-v80]')?.remove();
    const tab=document.querySelector('.pbR100F9StaffTabs [data-staff-mode].active')?.dataset.staffMode;
    if(tab!=='out')return;
    const date=document.querySelector('#pbR100F9StaffDates [data-staff-day].active')?.dataset.staffDay;
    if(!date)return;
    const rows=(Array.isArray(current().shortages)?current().shortages:[]).filter(x=>String(x.rental_start||'').slice(0,10)===date);
    if(!rows.length)return;
    const box=document.createElement('section');box.setAttribute('data-staff-shortages-v80','');box.className='pbR100F80ShortagePanel';
    box.innerHTML=`<header><b>کسری‌های آفیش این روز</b><small>${number(rows.length)} مورد</small></header>`+rows.map(row=>{
      const id=escapeHtml(row.id),done=String(row.status||'pending')==='provided'||Boolean(row.resolved_at),cancelled=Boolean(row.booking_cancelled_at),ack=Boolean(row.external_cancellation_acknowledged_at);
      return `<article class="pbR100F80ShortageCard ${done?'done':''}" data-shortage-id="${id}"><div class="pbR100F80ShortageInfo"><b>${escapeHtml(row.photographer_name||'عکاس')}</b><small>${escapeHtml(row.item_title||'تجهیز')} · ${number(row.shortage_qty||0)} عدد کسری</small>${cancelled?`<small>${escapeHtml(row.cancellation_note||'آفیش لغو شده است.')}</small>`:''}${done?`<small>تأیید ثبت‌شده${row.resolved_by_name?' توسط '+escapeHtml(row.resolved_by_name):''}${row.resolved_at?' · '+escapeHtml(typeof window.dateFa==='function'?window.dateFa(row.resolved_at):row.resolved_at):''}</small>${row.resolution_note?`<small>توضیح: ${escapeHtml(row.resolution_note)}</small>`:''}`:''}</div><div class="pbR100F80ShortageActions">${cancelled?done?(ack?'<span class="pbR100F80DoneLabel">✓ پیگیری لغو ثبت شد</span>':'<button type="button" data-shortage-cancel-ack>تأمین بیرونی لغو شد</button>'):'<span>آفیش لغو شده؛ تأمین بیرونی ثبت نشده است.</span>':done?'<span class="pbR100F80DoneLabel">✓ تأمین تأیید شد</span>':'<label class="pbR100F80Note"><span>توضیح تأیید (اختیاری)</span><input type="text" maxlength="1000" placeholder="مثلاً تأمین از همکار"></label><button type="button" data-shortage-confirm>تأیید تأمین کسری</button>'}${done?'<button type="button" class="secondary" data-shortage-print>چاپ رسید تأیید</button>':''}</div></article>`;
    }).join('');
    root.prepend(box);
    box.addEventListener('click',async event=>{
      const btn=event.target.closest('button');if(!btn)return;
      const card=btn.closest('[data-shortage-id]'),row=rows.find(x=>String(x.id)===String(card?.dataset.shortageId));if(!row)return;
      if(btn.hasAttribute('data-shortage-print')){printReceipt(row);return}
      if(btn.disabled)return;btn.disabled=true;
      try{
        const body=btn.hasAttribute('data-shortage-cancel-ack')?{externalCancellationAcknowledged:true}:{status:'provided',resolutionNote:String(card.querySelector('input')?.value||'').trim()};
        await api('/api/rental/shortages/'+encodeURIComponent(row.id),{method:'PATCH',body:JSON.stringify(body)});
        data=await api('/api/rental/overview');window.pbR100F9PaintStaffList?.();
        message(body.externalCancellationAcknowledged?'پیگیری لغو تأمین ثبت شد.':'تأیید تأمین کسری ثبت شد.','ثبت شد');
      }catch(error){btn.disabled=false;message(error?.error==='shortage_update_failed'?'ثبت تأیید کسری انجام نشد؛ دوباره تلاش کن.':'دسترسی یا ثبت کسری انجام نشد. دوباره تلاش کن.','خطا')}
    });
  }
  const paint=window.pbR100F9PaintStaffList;
  if(typeof paint==='function')window.pbR100F9PaintStaffList=function(...args){const result=paint.apply(this,args);requestAnimationFrame(render);return result};
  document.addEventListener('click',event=>{if(event.target.closest?.('.pbR100F9StaffTabs,[data-staff-day]'))requestAnimationFrame(render)},true);
})();
