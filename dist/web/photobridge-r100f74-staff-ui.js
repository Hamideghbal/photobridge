/* PhotoBridge R100F74 — only staff booking UI, read-only decoration + explicit shortage resolution. */
(()=>{
  if(window.__PB_R100F74_STAFF__)return;
  window.__PB_R100F74_STAFF__=true;
  const q=(s,r=document)=>r.querySelector(s);
  const staff=()=>document.body.classList.contains('pbR100F9StaffMode');
  const store=()=>typeof data!=='undefined'?(data||{}):(window.data||{});
  const matches=(a,b)=>String(a||'')===String(b||'');
  const pendingFor=id=>(store().returnShortages||[]).filter(x=>
    matches(x.booking_id,id)&&String(x.status)==='missing'&&!x.resolved_at);
  const fa=n=>Number(n||0).toLocaleString('fa-IR');

  function decorateCards(){
    if(!staff())return;
    const bookings=store().bookings||[];
    q('#pbR100F9StaffList')?.querySelectorAll('.pbR100F9StaffCard[data-pb915-booking-id]').forEach(card=>{
      const b=bookings.find(x=>matches(x.id,card.dataset.pb915BookingId));
      if(!b||b.status!=='returned')return;
      card.classList.add('pbR100F74ReceivedOrder');
      const status=q('.pbR100F9StaffState',card);
      if(status)status.textContent=q('[data-staff-mode="out"].active')?'تحویل شده':'دریافت شده';
      const missing=pendingFor(b.id),count=missing.reduce((n,x)=>n+Number(x.missing_qty||0),0);
      if(!count)return;
      card.classList.add('pbR100F74HasMissing');
      if(status)status.textContent=q('[data-staff-mode="out"].active')?'تحویل شده':'کسری تحویل · '+fa(count)+' عدد';
      const identity=q('.pbR100F71Identity',card)||card;
      let box=q('.pbR100F74MissingBox',identity);
      if(!box){box=document.createElement('div');box.className='pbR100F74MissingBox';identity.appendChild(box)}
      const heading=document.createElement('strong');heading.textContent='کسری دریافت دارد';
      const summary=document.createElement('span');
      summary.textContent=missing.map(x=>String(x.item_title||'تجهیز')+' × '+fa(x.missing_qty||0)).join('، ');
      box.replaceChildren(heading,summary);
    });
  }


  // Staff verifies every returned shortage explicitly. No fee is charged by default.
  function confirmShortageReceipt(shortage){
    return new Promise(resolve=>{
      const dialog=document.createElement('div');
      dialog.className='pbR100F76ShortageBackdrop';
      dialog.innerHTML='<form class="pbR100F76ShortageDialog" role="dialog" aria-modal="true">'+
        '<h2>تحویل کسری و اصلاح فاکتور</h2><p data-shortage></p>'+
        '<label class="pbR100F76ReceiptCheck"><input type="checkbox" name="received"><span>تمام واحدهای این کسری را از مشتری تحویل گرفتم.</span></label>'+
        '<label>افزایش مبلغ فاکتور بابت دیرکرد (تومان) — اختیاری<input name="lateFee" inputmode="numeric" value="0" autocomplete="off"></label>'+
        '<label>دلیل دیرکرد (در صورت افزایش مبلغ)<textarea name="reason" rows="2" maxlength="1000" placeholder="مثلاً برگشت با دو روز تأخیر"></textarea></label>'+
        '<p data-preview></p><p class="pbR100F76ShortageError" role="alert"></p>'+
        '<div class="pbR100F76ShortageActions"><button type="button" data-cancel>انصراف</button><button class="primary" type="submit">ثبت تحویل کسری</button></div></form>';
      document.body.appendChild(dialog);
      dialog.querySelector('[data-shortage]').textContent=String(shortage.item_title||'تجهیز')+' · '+fa(shortage.missing_qty||0)+' واحد کسری';
      const b=(store().bookings||[]).find(x=>matches(x.id,shortage.booking_id));
      const original=Number(b?.total_amount);
      const feeInput=dialog.querySelector('[name="lateFee"]'),reasonInput=dialog.querySelector('[name="reason"]');
      const error=dialog.querySelector('.pbR100F76ShortageError'),preview=dialog.querySelector('[data-preview]');
      const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
      let closed=false;const close=value=>{if(closed)return;closed=true;dialog.remove();document.body.style.overflow=oldOverflow;document.removeEventListener('keydown',onKey);resolve(value)};
      const onKey=e=>{if(e.key==='Escape'){e.preventDefault();close(null)}};document.addEventListener('keydown',onKey);
      dialog.querySelector('[data-cancel]').onclick=()=>close(null);
      const number=v=>String(v||'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[,\u066C\s]/g,'');
      const previewFee=()=>{const t=number(feeInput.value),n=/^\d+$/.test(t)?Number(t):NaN;
        preview.textContent=Number.isSafeInteger(n)&&Number.isSafeInteger(original)&&Number.isSafeInteger(original+n)
          ?'فاکتور فعلی: '+fa(original)+' تومان · مبلغ جدید: '+fa(original+n)+' تومان':'در صورت نداشتن مبلغ اضافی، صفر وارد کنید.';
      };
      feeInput.addEventListener('input',previewFee);previewFee();
      dialog.querySelector('form').onsubmit=e=>{e.preventDefault();error.textContent='';
        if(!dialog.querySelector('[name="received"]').checked){error.textContent='دریافت کسری را تأیید کنید.';return}
        const raw=number(feeInput.value),amount=/^\d+$/.test(raw)?Number(raw):NaN;
        if(!Number.isSafeInteger(amount)||amount<0||amount>1000000000000){error.textContent='مبلغ دیرکرد معتبر نیست.';return}
        const note=reasonInput.value.trim();if(amount>0&&!note){error.textContent='دلیل افزایش فاکتور الزامی است.';return}
        close({receiptConfirmed:true,lateFeeAmount:amount,lateFeeNote:note});
      };
    });
  }
  const activeResolutions=new Set();
  function decorateShortagePane(){
    if(!staff()||!document.body.classList.contains('pbR100F72ExtraActive'))return;
    const pane=q('#pbR100F72ExtraPane');
    if(!pane||pane.hidden||!q('.pbR100F72Entries',pane))return;
    const rows=[...(store().returnShortages||[])].sort((a,b)=>
      Number(Boolean(a.resolved_at))-Number(Boolean(b.resolved_at)));
    const entries=[...pane.querySelectorAll('.pbR100F72Entries>.pbR100F72Entry')];
    for(let i=0;i<entries.length;i++){
      const entry=entries[i],shortage=rows[i];
      if(!shortage||shortage.status!=='missing'||shortage.resolved_at)continue;
      if(entry.querySelector('[data-r74-return-shortage]'))continue;
      const btn=document.createElement('button');
      btn.type='button';btn.className='pbR100F74ResolveBtn';btn.dataset.r74ReturnShortage=String(shortage.id);
      btn.textContent='تحویل کسری';
      btn.addEventListener('click',async e=>{
        e.stopPropagation();
        const id=String(shortage.id||'');
        if(!id||activeResolutions.has(id))return;
        const desc=String(shortage.item_title||'تجهیز')+' · '+fa(shortage.missing_qty||0)+' عدد';
        const receipt=await confirmShortageReceipt(shortage);
        if(!receipt)return;
        activeResolutions.add(id);btn.disabled=true;btn.textContent='در حال ثبت…';
        try{
          const response=await fetch('/api/rental/return-shortages/'+encodeURIComponent(id),{
            method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({note:'تحویل کسری ثبت‌شده توسط پرسنل فروشگاه',...receipt})
          });
          const result=await response.json().catch(()=>({}));
          if(!response.ok){
            const error=result.error==='return_shortage_asset_mismatch'
              ?'کد یا وضعیت واحدهای کسری با سفارش هماهنگ نیست؛ عملیات ثبت نشد.'
              :result.error==='return_shortage_receipt_confirmation_required'
              ?'ابتدا دریافت کسری را تأیید کنید.'
              :result.error==='invoice_adjustment_note_required'
              ?'برای مبلغ دیرکرد، دلیل اصلاح فاکتور را وارد کنید.'
              :result.error==='invalid_invoice_adjustment'
              ?'مبلغ دیرکرد با فاکتور معتبر نیست.'
              :result.error==='return_shortage_not_found'
              ?'این کسری قبلاً ثبت شده یا دیگر قابل دریافت نیست.'
              :'ثبت جبران کسری انجام نشد.';
            throw new Error(error);
          }
          window.storeNotice?.(receipt.lateFeeAmount?'کسری تحویل شد و مبلغ دیرکرد به فاکتور افزوده شد.':'جبران کسری با موفقیت ثبت شد.','کسری تحویل');
          await window.pbR100F9ReloadStaff?.();
          decorateCards();decorateShortagePane();
        }catch(error){
          window.storeNotice?.(String(error.message||'خطای ثبت جبران'),'خطای کسری');
          btn.disabled=false;btn.textContent='تحویل کسری';
        }finally{activeResolutions.delete(id)}
      });
      entry.appendChild(btn);
    }
  }

  function decorateDetails(){
    if(!staff())return;
    const modal=q('#pbR100F71Details.open');if(!modal)return;if(q('.pbR100F74ItemStates',modal))return;
    const id=String(document.activeElement?.dataset?.pb915BookingId||window.__PB_R100F74_SELECTED_BOOKING__||'');
    const b=(store().bookings||[]).find(x=>matches(x.id,id));
    if(!b||b.status!=='returned')return;
    const items=Array.isArray(b.items)?b.items:[];
    const list=[...modal.querySelectorAll('.pbR100F71Items li')];
    const shortages=pendingFor(b.id);
    list.forEach((li,i)=>{
      const item=items[i];
      const title=String(item?.title||'');
      const quantity=Number(item?.quantity||1);
      const missing=shortages.filter(x=>item?.itemId?matches(x.item_id,item.itemId):
        String(x.item_title||'').trim()===title.trim()).reduce((n,x)=>n+Number(x.missing_qty||0),0);
      const received=Math.max(0,quantity-missing);
      let tags=q('.pbR100F74ItemTags',li);
      if(!tags){tags=document.createElement('div');tags.className='pbR100F74ItemTags';li.appendChild(tags)}
      tags.replaceChildren();
      if(received>0){
        const green=document.createElement('span');green.className='pbR100F74Received';
        green.textContent='دریافت شد'+(quantity>1?' · '+fa(received)+' عدد':'');
        tags.appendChild(green);
      }
      if(missing>0){
        const amber=document.createElement('span');amber.className='pbR100F74Missing';
        amber.textContent='کسری '+fa(missing)+' عدد';tags.appendChild(amber);
      }
    });
  }

  const paint=window.pbR100F9PaintStaffList;
  if(typeof paint==='function')window.pbR100F9PaintStaffList=function(...args){
    const out=paint.apply(this,args);
    decorateCards();decorateShortagePane();return out;
  };
  document.addEventListener('click',event=>{
    if(!staff())return;
    const card=event.target.closest?.('.pbR100F9StaffCard[data-pb915-booking-id]');
    if(card&&!event.target.closest('button,a,input,select,textarea')){window.__PB_R100F74_SELECTED_BOOKING__=card.dataset.pb915BookingId;
      queueMicrotask(decorateDetails);
    }
    if(event.target.closest?.('.pbR100F9StaffTabs'))queueMicrotask(decorateShortagePane);
  },true);
  document.addEventListener('keydown',event=>{
    if(!staff()||!['Enter',' '].includes(event.key))return;
    const card=event.target.closest?.('.pbR100F9StaffCard[data-pb915-booking-id]');
    if(card){window.__PB_R100F74_SELECTED_BOOKING__=card.dataset.pb915BookingId;
      queueMicrotask(decorateDetails);}
  },true);
  if(staff()){decorateCards();decorateShortagePane()}
})();
