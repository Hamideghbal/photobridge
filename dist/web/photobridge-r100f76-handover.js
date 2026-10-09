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
    // Manager and authorized handover staff may both record a late fee.
    const back=document.createElement('div');
    back.className='pbR100F76ShortageBack';
    back.innerHTML='<form class="pbR100F76ShortageDialog" role="dialog" aria-modal="true">'+
      '<h2>دریافت کسری</h2><p>از '+esc(row.missing_qty||0)+' واحد کسری «'+esc(row.item_title||'تجهیز')+'»، فقط مواردی را که واقعاً تحویل گرفته‌اید ثبت کنید.</p>'+
      '<div class="pbR100F92QuantityFields" data-pb92-quantity-fields></div>'+
      '<label class="pbR100F76Confirm"><input name="confirmed" type="checkbox">دریافت تعداد انتخاب‌شده را تأیید می‌کنم.</label>'+
      '<label>توضیح تحویل (اختیاری)<textarea name="note" rows="2" maxlength="1000" placeholder="وضعیت تجهیزات یا زمان تحویل"></textarea></label>'+
      ('<label class="pbR100F76Confirm"><input name="addFee" type="checkbox">افزودن هزینه دیرکرد به فاکتور</label>'+
        '<div class="pbR100F76FeeFields" hidden><label>مبلغ افزایشی (تومان)<input name="fee" type="text" inputmode="numeric" autocomplete="off" dir="ltr" placeholder="0" aria-label="مبلغ افزایشی به تومان"></label>'+
        '<label>دلیل اصلاح فاکتور<textarea name="feeReason" maxlength="1000" rows="2" placeholder="مثلاً بازگشت با تأخیر"></textarea></label>'+
        '<small class="pbR100F76InvoiceTotal"></small></div>')+
      '<label class="pbR100F76Confirm"><input name="printInvoice" type="checkbox">نمایش فاکتور پس از ثبت دریافت</label>'+
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
    const normalizeDigits=value=>String(value??'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776))
      .replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632));
    const cleanFee=value=>normalizeDigits(value).replace(/[^0-9]/g,'').replace(/^0+(?=\d)/,'');
    const feeAmount=()=>Number(cleanFee(form.elements.fee?.value||''));
    const feeInput=form.elements.fee;
    if(feeInput)feeInput.addEventListener('input',()=>{
      const original=String(feeInput.value||''),caret=feeInput.selectionStart??original.length;
      const countBefore=cleanFee(original.slice(0,caret)).length;
      const digits=cleanFee(original).slice(0,13);
      const formatted=digits.replace(/\B(?=(\d{3})+(?!\d))/g,',');
      if(feeInput.value!==formatted){
        feeInput.value=formatted;
        let index=0,passed=0;
        for(;index<formatted.length&&passed<countBefore;index++)if(/[0-9]/.test(formatted[index]))passed++;
        feeInput.setSelectionRange(index,index);
      }
      refreshFee();
    });
    // Tracked assets are selected by code; non-tracked items use a quantity field.
    const missingQty=Math.max(0,Number(row.missing_qty||0));
    const assignedCodes=Array.isArray(row.missing_asset_codes)?row.missing_asset_codes.map(x=>String(x||'').trim()).filter(Boolean):[];
    const externalQty=Math.max(0,missingQty-assignedCodes.length);
    const qtyFields=back.querySelector('[data-pb92-quantity-fields]');
    if(qtyFields){
      qtyFields.innerHTML=(assignedCodes.length?'<fieldset class="pbR100F92Tracked"><legend>انتخاب تجهیز تحویل‌شده</legend>'+
        assignedCodes.map(code=>'<label class="pbR100F92TrackedRow"><input type="checkbox" name="receivedAsset" value="'+esc(code)+'"><span>کد تجهیز: <b dir="ltr">'+esc(code)+'</b></span></label>').join('')+'</fieldset>':'')+
        (externalQty?'<label class="pbR100F92Quantity">تعداد دریافتی بدون کد'+
        '<input name="returnedQty" type="number" min="0" max="'+externalQty+'" step="1" value="'+(assignedCodes.length?0:Math.min(1,externalQty))+'" inputmode="numeric"></label>':'')+
        '<small class="pbR100F92QuantitySummary" data-pb92-qty-summary></small>';
    }
    const selectedCodes=()=>[...back.querySelectorAll('input[name="receivedAsset"]:checked')].map(x=>x.value);
    const externalSelected=()=>externalQty?Number(form.elements.returnedQty?.value):0;
    const selectedQty=()=>selectedCodes().length+externalSelected();
    const refreshQuantity=()=>{
      const count=selectedQty(),summary=back.querySelector('[data-pb92-qty-summary]');
      if(summary)summary.textContent=Number.isSafeInteger(count)&&count>=0&&count<=missingQty?
        'دریافت این مرحله: '+count.toLocaleString('fa-IR')+' عدد · باقی‌مانده: '+(missingQty-count).toLocaleString('fa-IR')+' عدد':
        'تعداد انتخاب‌شده معتبر نیست.';
    };
    qtyFields?.addEventListener('input',refreshQuantity);
    qtyFields?.addEventListener('change',refreshQuantity);
    refreshQuantity();
    const refreshFee=()=>{
      const active=!!form.elements.addFee?.checked,fields=back.querySelector('.pbR100F76FeeFields');
      if(fields)fields.hidden=!active;
      const current=Number(booking?.total_amount||0),amount=active?feeAmount():0,total=back.querySelector('.pbR100F76InvoiceTotal');
      if(total)total.textContent=booking&&Number.isSafeInteger(current+amount)&&current+amount>=0?
        'مبلغ فاکتور پس از اصلاح: '+(typeof money==='function'?money(current+amount):String(current+amount)+' تومان'):
        'مبلغ افزایشی پس از ثبت به فاکتور اصلی اضافه خواهد شد.';
    };
    form.elements.addFee?.addEventListener('change',refreshFee);
    // Fee input refreshes after its live thousands-separator formatter.
    refreshFee();
    form.onsubmit=async e=>{
      e.preventDefault();if(sending)return;
      error.textContent='';
      if(!form.elements.confirmed.checked){error.textContent='دریافت موارد انتخاب‌شده را تأیید کن.';return}
      const returnQty=selectedQty();
      if(!Number.isSafeInteger(returnQty)||returnQty<1||returnQty>missingQty||!Number.isSafeInteger(externalSelected())||externalSelected()<0||externalSelected()>externalQty){error.textContent='حداقل یک قلم را با تعداد معتبر انتخاب کن.';return}
      const hasFee=!!form.elements.addFee?.checked;
      const amount=feeAmount(),reason=String(form.elements.feeReason?.value||'').trim();
      if(hasFee&&(!Number.isSafeInteger(amount)||amount<1||amount>1000000000000||!reason)){
        error.textContent='مبلغ معتبر و دلیل اصلاح فاکتور را وارد کن.';return;
      }
      const payload={note:String(form.elements.note?.value||'').trim(),returnedQty:returnQty,returnedAssetCodes:selectedCodes()};
      if(hasFee)payload.invoiceAdjustment={amount,note:reason};
      sending=true;form.querySelector('[type=submit]').disabled=true;if(btn)btn.disabled=true;
      try{
        await api('/api/rental/return-shortages/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(payload)});
        const offerInvoice=!!form.elements.printInvoice?.checked;
        close();
        if(document.body.classList.contains('pbR100F9StaffMode')){
          await window.pbR100F9ReloadStaff?.();
        }else{
          await load({reloadExtra:false});
          window.pb843SetOfficeTab?.('returnShortages');
        }
        notify(hasFee?'دریافت '+returnQty.toLocaleString('fa-IR')+' واحد و افزایش فاکتور ثبت شد.':'دریافت '+returnQty.toLocaleString('fa-IR')+' واحد ثبت شد؛ بقیه کسری باز می‌ماند.','تکمیل شد');
        if(offerInvoice&&booking?.id)window.pbR100F86OfferInvoice?.(booking.id);
      }catch(ex){
        sending=false;form.querySelector('[type=submit]').disabled=false;if(btn)btn.disabled=false;
        const msg={return_shortage_asset_mismatch:'کد یا وضعیت واحدهای کسری با سفارش تطبیق ندارد.',
          invalid_returned_qty:'تعداد انتخاب‌شده صحیح نیست یا از کسری باقی‌مانده بیشتر است.',
          invalid_returned_asset_codes:'کد تجهیزات دریافت‌شده صحیح نیست یا انتخاب نشده است.',
          invoice_adjustment_not_allowed:'مجوز اصلاح مالی این حساب تأیید نشد.',
          return_shortage_not_found:'این کسری قبلاً ثبت شده یا دیگر قابل دریافت نیست.',
          invoice_adjustment_negative_total:'مبلغ اصلاح معتبر نیست.'};
        error.textContent=msg[ex?.error]||'ثبت دریافت کسری انجام نشد. دوباره تلاش کن.';
      }
    };
  };
})();
