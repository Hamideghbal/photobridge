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
      notify('این کسری قبلاً دریافت شده یا دیگر قابل ثبت نیست.','کسری دریافت');return;
    }
    const booking=(store().bookings||[]).find(x=>String(x.id)===String(row.booking_id));
    const owner=!store().staffMode;
    const back=document.createElement('div');
    back.className='pbR100F76ShortageBack';
    back.innerHTML='<form class="pbR100F76ShortageDialog" role="dialog" aria-modal="true">'+
      '<h2>دریافت کسری</h2><p>تمام '+esc(row.missing_qty||0)+' واحد کسری «'+esc(row.item_title||'تجهیز')+'» برگشته است؟</p>'+
      '<label class="pbR100F76Confirm"><input name="confirmed" type="checkbox">بازگشت تمام واحدهای این کسری را تأیید می‌کنم.</label>'+
      '<label>توضیح تحویل (اختیاری)<textarea name="note" rows="2" maxlength="1000" placeholder="وضعیت تجهیزات یا زمان تحویل"></textarea></label>'+
      (owner?'<label class="pbR100F76Confirm"><input name="addFee" type="checkbox">افزودن هزینه دیرکرد به فاکتور</label>'+
        '<div class="pbR100F76FeeFields" hidden><label>مبلغ افزایشی (تومان)<input name="fee" type="number" min="1" max="1000000000000" step="1" inputmode="numeric"></label>'+
        '<label>دلیل اصلاح فاکتور<textarea name="feeReason" maxlength="1000" rows="2" placeholder="مثلاً بازگشت با تأخیر"></textarea></label>'+
        '<small class="pbR100F76InvoiceTotal"></small></div>':'')+
      '<p class="pbR100F76Error" role="alert" aria-live="polite"></p>'+
      '<div class="pbR100F76Buttons"><button type="button" data-cancel>انصراف</button><button type="submit">ثبت دریافت کسری</button></div></form>';
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
        notify(hasFee?'دریافت کسری و افزایش فاکتور ثبت شد.':'دریافت کسری ثبت شد.','تکمیل شد');
      }catch(ex){
        sending=false;form.querySelector('[type=submit]').disabled=false;if(btn)btn.disabled=false;
        const msg={return_shortage_asset_mismatch:'کد یا وضعیت واحدهای کسری با سفارش تطبیق ندارد.',
          invoice_adjustment_not_allowed:'اصلاح مالی فقط برای مدیر فروشگاه مجاز است.',
          return_shortage_not_found:'این کسری قبلاً ثبت شده یا دیگر قابل دریافت نیست.',
          invoice_adjustment_negative_total:'مبلغ اصلاح معتبر نیست.'};
        error.textContent=msg[ex?.error]||'ثبت دریافت کسری انجام نشد. دوباره تلاش کن.';
      }
    };
  };
})();


/* R100F85 — finance and office controls for owner mobile. Independent of handover staff. */
(()=>{
  if(window.__pbR100F85OwnerFinance)return;window.__pbR100F85OwnerFinance=true;
  const q=(s,r=document)=>r.querySelector(s);
  const date=v=>{try{return typeof dateFa==='function'?dateFa(v):String(v||'—').slice(0,10)}catch{return String(v||'—').slice(0,10)}};
  const moneyText=v=>{try{return typeof money==='function'?money(v):String(v||0)}catch{return String(v||0)}};
  const append=(root,tag,cls,value)=>{const el=document.createElement(tag);el.className=cls;el.textContent=String(value??'—');root.appendChild(el)};
  const owner=()=>document.body.classList.contains('rentalAppReady')&&!document.body.classList.contains('pbR100F9StaffMode');
  function decorateInvoices(){
    if(!owner())return;
    const invoices=typeof accountingData!=='undefined'?(accountingData?.invoices||[]):[];
    for(const card of document.querySelectorAll('#accounting #pb855FinanceInvoices .pb855FinanceInvoiceRow[data-pb897-invoice-view]')){
      if(q('.pbR100F85Primary',card))continue;
      const x=invoices.find(r=>String(r.id)===String(card.dataset.pb897InvoiceView));if(!x)continue;
      const left=document.createElement('section');left.className='pbR100F85Primary';
      append(left,'small','label','شماره فاکتور');
      append(left,'b','number',x.invoice_number||'—');
      append(left,'small','date','تاریخ: '+date(x.issued_at));
      append(left,'strong','total','مبلغ: '+moneyText(x.total_amount));
      append(left,'small','name','آتلیه / عکاس: '+(x.photographer_name||'—'));
      const right=document.createElement('section');right.className='pbR100F85Details';
      append(right,'b','title','جزئیات آفیش');
      append(right,'small','range','بازه: '+(x.rental_start?date(x.rental_start)+(x.rental_end&&x.rental_end!==x.rental_start?' تا '+date(x.rental_end):''):'—'));
      append(right,'p','gear',q('.pb855InvoiceEquipmentSummary',card)?.textContent||x.item_titles||'تجهیزات سفارش');
      append(right,'small','deposit','ودیعه: '+moneyText(x.deposit_amount));
      append(right,'small','state',x.payment_status==='paid'?'پرداخت‌شده':'ثبت‌شده');
      const actions=q('.pb890AccountingAction',card);
      card.insertBefore(left,actions||null);card.insertBefore(right,actions||null);
    }
  }
  const invoicesBase=window.pb855RenderAdminInvoices||(typeof pb855RenderAdminInvoices==='function'?pb855RenderAdminInvoices:null);
  if(typeof invoicesBase==='function'){
    const wrapped=function(...args){const out=invoicesBase.apply(this,args);decorateInvoices();return out};
    window.pb855RenderAdminInvoices=wrapped;
    try{pb855RenderAdminInvoices=wrapped}catch{}
  }
  // Duplicate render calls made by tab selection, resize, or scrolling reuse completed ledger content.
  const ledgerBase=window.pb842RenderAccountingLedger;
  let lastKey='',lastCache=null,pendingKey='',pending=null;
  if(typeof ledgerBase==='function')window.pb842RenderAccountingLedger=function(...args){
    const select=q('#accountingLedgerPhotographer');
    const uid=String(select?.value||'');
    const from=String(q('#pb856AccountingFrom')?.value||''),to=String(q('#pb856AccountingTo')?.value||'');
    const key=uid+'|'+from+'|'+to;
    const cache=window.pb869LedgerRowsCache;
    const complete=Boolean(q('#accountingLedgerEntries .pb922Paper,#accountingLedgerEntries table.accountingTable'));
    if(uid&&complete&&cache&&cache===lastCache&&key===lastKey)return Promise.resolve(cache);
    if(uid&&pending&&key===pendingKey)return pending;
    pendingKey=key;
    pending=Promise.resolve(ledgerBase.apply(this,args)).then(out=>{
      lastKey=key;lastCache=window.pb869LedgerRowsCache;
      return out;
    }).finally(()=>{if(pendingKey===key){pending=null;pendingKey=''}});
    return pending;
  };
  // Allow pressing the calendar action without dates and display a clear explanation.
  let dateButton=null,dateObserver=null;
  const selected=()=>Boolean(document.querySelector('#pb843CalendarGrid .pb892SelectedDay'));
  function mountDateButton(){
    const btn=q('#pb892CalendarContinue');if(!btn||btn===dateButton)return;
    dateObserver?.disconnect();dateButton=btn;
    const unlock=()=>{
      if(btn.disabled)btn.disabled=false;
      const noDate=!selected();btn.setAttribute('aria-disabled',String(noDate));
      btn.title=noDate?'ابتدا یک تاریخ از تقویم انتخاب کن.':'ثبت آفیش برای تاریخ انتخابی';
    };
    dateObserver=new MutationObserver(unlock);
    dateObserver.observe(btn,{attributes:true,attributeFilter:['disabled']});
    btn.addEventListener('click',event=>{
      if(selected())return;
      event.preventDefault();event.stopImmediatePropagation();
      if(typeof window.pb920CalendarNotice==='function')window.pb920CalendarNotice('ابتدا تاریخ آفیش را از تقویم انتخاب کن.');
      else if(typeof window.storeNotice==='function')window.storeNotice('ابتدا تاریخ آفیش را از تقویم انتخاب کن.','انتخاب تاریخ');
      else alert('ابتدا تاریخ آفیش را از تقویم انتخاب کن.');
    },true);
    unlock();
  }
  mountDateButton();
  if(!dateButton&&document.body){
    const watch=new MutationObserver(()=>{mountDateButton();if(dateButton)watch.disconnect()});
    watch.observe(document.body,{childList:true,subtree:true});
  }
  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-pb842-tab="invoices"]'))requestAnimationFrame(decorateInvoices);
    if(event.target.closest?.('#pb843CalendarGrid [data-pb843-cal-day]'))requestAnimationFrame(()=>{mountDateButton();if(dateButton){dateButton.disabled=false;dateButton.setAttribute('aria-disabled',String(!selected()))}});
    if(event.target.closest?.('#pb892CalendarContinue'))requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const focused=document.activeElement;
      if(q('#pb892ManualBackdrop.open')&&focused?.closest?.('#pb892ManualBackdrop')&&focused.matches?.('input,textarea'))focused.blur();
    }));
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mountDateButton();decorateInvoices()},{once:true});
  else decorateInvoices();
})();
