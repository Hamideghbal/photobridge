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
      if(status)status.textContent=q('.pbR100F9StaffTabs [data-staff-mode="out"].active')?'تحویل شده':'دریافت شده';
      const missing=pendingFor(b.id),count=missing.reduce((n,x)=>n+Number(x.missing_qty||0),0);
      if(!count)return;
      card.classList.add('pbR100F74HasMissing');
      if(status)status.textContent='کسری تحویل · '+fa(count)+' عدد';
      const identity=q('.pbR100F71Identity',card)||card;
      let box=q('.pbR100F74MissingBox',identity);
      if(!box){box=document.createElement('div');box.className='pbR100F74MissingBox';identity.appendChild(box)}
      const heading=document.createElement('strong');heading.textContent='کسری دریافت دارد';
      const summary=document.createElement('span');
      summary.textContent=missing.map(x=>String(x.item_title||'تجهیز')+' × '+fa(x.missing_qty||0)).join('، ');
      box.replaceChildren(heading,summary);
    });
  }

  const activeResolutions=new Set();
  function confirmShortageReceipt(description){
    return new Promise(resolve=>{
      const backdrop=document.createElement('div');backdrop.className='pbR100F76ShortageBack';
      backdrop.innerHTML='<section class="pbR100F76ShortageDialog" role="dialog" aria-modal="true" aria-labelledby="pbR100F76ShortageTitle">'+
        '<h2 id="pbR100F76ShortageTitle">تحویل کسری و اصلاح فاکتور</h2><p data-description></p>'+
        '<label class="pbR100F76Confirm"><input type="checkbox" data-received><span>تأیید می‌کنم این کسری واقعاً تحویل گرفته شده است.</span></label>'+
        '<label>مبلغ اضافه بابت تأخیر (تومان، اختیاری)<input type="text" inputmode="numeric" autocomplete="off" data-charge placeholder="۰"></label>'+
        '<label>توضیح اصلاح فاکتور<textarea data-note maxlength="1000" rows="2" placeholder="علت مبلغ اضافه یا توضیح تحویل کسری"></textarea></label>'+
        '<small data-error role="alert"></small><div class="pbR100F76ShortageActions"><button type="button" data-cancel>انصراف</button><button type="button" data-submit disabled>ثبت تحویل کسری</button></div></section>';
      backdrop.querySelector('[data-description]').textContent=description;
      const check=q('[data-received]',backdrop),charge=q('[data-charge]',backdrop);
      const note=q('[data-note]',backdrop),error=q('[data-error]',backdrop),submit=q('[data-submit]',backdrop);
      const overflow=document.body.style.overflow;document.body.style.overflow='hidden';document.body.append(backdrop);
      let closed=false;
      const close=value=>{if(closed)return;closed=true;document.body.style.overflow=overflow;document.removeEventListener('keydown',onKey);backdrop.remove();resolve(value)};
      const onKey=e=>{if(e.key==='Escape')close(null)};
      document.addEventListener('keydown',onKey);
      backdrop.querySelector('[data-cancel]').onclick=()=>close(null);
      check.onchange=()=>{submit.disabled=!check.checked};
      submit.onclick=()=>{
        error.textContent='';
        const digits=String(charge.value||'0').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776))
          .replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[٬,\s]/g,'');
        if(!/^\d+$/.test(digits)){error.textContent='مبلغ باید یک عدد صحیح و غیرمنفی باشد.';return}
        const amount=Number(digits),reason=note.value.trim();
        if(!Number.isSafeInteger(amount)||amount>1000000000000){error.textContent='مبلغ واردشده معتبر نیست.';return}
        if(amount>0&&!reason){error.textContent='برای افزایش مبلغ فاکتور، توضیح دیرکرد را وارد کنید.';return}
        close({note:reason,extraChargeAmount:amount});
      };
      check.focus();
    });
  }

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
        const receipt=await confirmShortageReceipt(desc);
        if(!receipt)return;
        activeResolutions.add(id);btn.disabled=true;btn.textContent='در حال ثبت…';
        try{
          const response=await fetch('/api/rental/return-shortages/'+encodeURIComponent(id),{
            method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json'},
            body:JSON.stringify(receipt)
          });
          const result=await response.json().catch(()=>({}));
          if(!response.ok){
            const error=result.error==='return_shortage_asset_mismatch'
              ?'کد یا وضعیت واحدهای کسری با سفارش هماهنگ نیست؛ عملیات ثبت نشد.'
              :result.error==='return_shortage_not_found'
              ?'این کسری قبلاً ثبت شده یا دیگر قابل دریافت نیست.'
              :'ثبت جبران کسری انجام نشد.';
            throw new Error(error);
          }
          window.storeNotice?.(receipt.extraChargeAmount?'کسری ثبت و مبلغ دیرکرد به فاکتور اضافه شد.':'جبران کسری با موفقیت ثبت شد.','کسری تحویل');
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


  // Owner's shortage tab uses the same checked receipt and optional late-fee flow.
  if(typeof window.pbR85ResolveReturnShortage==='function'){
    window.pbR85ResolveReturnShortage=async function(id,btn){
      const shortage=(store().returnShortages||[]).find(x=>matches(x.id,id));
      if(!shortage||shortage.status!=='missing'||shortage.resolved_at){
        window.storeNotice?.('این کسری دیگر قابل دریافت نیست.','کسری تحویل');return;
      }
      const desc=String(shortage.item_title||'تجهیز')+' · '+fa(shortage.missing_qty||0)+' عدد';
      const receipt=await confirmShortageReceipt(desc);
      if(!receipt)return;
      if(btn)btn.disabled=true;
      try{
        const response=await fetch('/api/rental/return-shortages/'+encodeURIComponent(String(id)),{
          method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json'},
          body:JSON.stringify(receipt)
        });
        const result=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(result.error==='return_shortage_not_found'?
          'این کسری قبلاً ثبت شده یا قابل دریافت نیست.':
          result.error==='return_shortage_asset_mismatch'?'کد تجهیزات کسری با سفارش هماهنگ نیست.':
          'ثبت تحویل کسری یا اصلاح فاکتور انجام نشد.');
        if(typeof window.load==='function')await window.load({reloadExtra:false});
        window.pb843SetOfficeTab?.('returnShortages');
        window.storeNotice?.(receipt.extraChargeAmount?'کسری دریافت و مبلغ دیرکرد در فاکتور ثبت شد.':'تحویل کسری ثبت شد.','کسری تحویل');
      }catch(error){
        if(btn)btn.disabled=false;
        window.storeNotice?.(String(error.message||'ثبت کسری انجام نشد.'),'خطای کسری');
      }
    };
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
