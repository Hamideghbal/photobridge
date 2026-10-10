/* Availability is rechecked in the same transaction as the new invoice. */
(()=>{
 'use strict';
 const shift=(day,n)=>new Date(Date.parse(day.slice(0,10)+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
 const fa=n=>Number(n).toLocaleString('fa-IR'),date=day=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric',month:'long',year:'numeric'}).format(new Date(day+'T12:00:00Z'));
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const bookings=()=>{try{return (typeof data!=='undefined'?data:window.data)?.bookings||[]}catch{return []}};
 const find=id=>bookings().find(b=>String(b.id)===String(id));
 const request=(url,opt)=>api(url,opt);
 const errors={equipment_unavailable:'برای این روزها موجودی کافی نیست.',extension_equipment_unavailable:'موجودی تغییر کرده است؛ روزها و تجهیزات را دوباره بررسی کنید.',extension_supply_dates_unavailable:'بازه تأمین این تجهیز، روزهای تمدید را پوشش نمی‌دهد.',extension_untracked_equipment:'ابتدا تحویل و سریال‌های این تجهیز را تکمیل کنید.',extension_requires_handover:'تمدید برای تجهیزات تحویل‌شده انجام می‌شود.',past_rental_date:'روز شروع تمدید گذشته است.',booking_already_extended:'تمام تجهیزات این آفیش قبلاً تمدید شده‌اند.',invalid_extension_dates:'روزهای تمدید باید از فردای پایان آفیش، پیوسته و حداکثر ۱۸۰ روز باشند.'};
 const style=document.createElement('style');style.textContent=`
 #pbOfficeExtension{position:fixed;inset:0;z-index:2147483100;background:#10182888;display:grid;place-items:center;padding:12px;direction:rtl}
 #pbOfficeExtension .extDialog{background:#fff;color:#172b4d;border-radius:18px;width:min(1040px,100%);max-height:calc(100dvh - 24px);overflow:auto;padding:20px;box-sizing:border-box}
 #pbOfficeExtension .extHead,#pbOfficeExtension .extFoot,#pbOfficeExtension .extMonth{display:flex;align-items:center;justify-content:space-between;gap:10px}
 #pbOfficeExtension .extSplit{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:16px 0}
 #pbOfficeExtension .extGrid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin-top:10px}
 #pbOfficeExtension button{font:inherit;cursor:pointer;border:1px solid #d9e2f5;border-radius:8px;padding:9px;background:#f6f8ff;color:#27446f;transition:transform .14s,background .14s}
 #pbOfficeExtension button:active{transform:scale(.96)}#pbOfficeExtension button:disabled{opacity:.4;cursor:default}
 #pbOfficeExtension .extGrid button{padding:10px 2px;min-width:0}#pbOfficeExtension button[aria-pressed=true],#pbOfficeExtension .extSubmit{background:#3457ff;color:white}
 #pbOfficeExtension .extItem{display:flex;gap:10px;padding:12px;border:1px solid #d8e5ff;border-radius:10px;margin-bottom:8px;align-items:start;background:#f6f9ff}
 #pbOfficeExtension .extItem.blocked{background:#fff4f3;border-color:#ffc4c0;color:#b42318}#pbOfficeExtension .extItem input{width:20px;height:20px;flex-shrink:0}
 #pbOfficeExtension .extItem small{display:block;margin-top:5px;line-height:1.8}#pbOfficeExtension [role=alert]{color:#b42318;line-height:1.8}
 .pbOfficeExtendButton{font:inherit;border:1px solid #cad8ff;border-radius:8px;background:#f5f8ff;color:#3457ff;padding:7px 12px;cursor:pointer;min-height:34px}
 .pbOfficeExtendButton:disabled{opacity:.55;cursor:default}
 @media(max-width:850px){#pbOfficeExtension .extSplit{grid-template-columns:1fr;gap:12px}#pbOfficeExtension .extDialog{padding:14px}#pbOfficeExtension .extFoot{flex-wrap:wrap}}
 `;document.head.append(style);
 let active=null;
 function close(){if(!active)return;const st=active;active=null;st.version++;st.modal.remove();document.body.style.overflow=st.overflow;st.focus?.focus()}
 function calendar(st){
   const host=st.modal.querySelector('.extCalendar'),p=window.jalaliPartsFromIso(st.month);if(!p)return;
   const iso=d=>window.pb843IsoForJalali(p.year,p.month,d)||window.jalaliInputToIso(`${p.year}/${p.month}/${d}`);
   const first=iso(1),offset=(new Date(first+'T12:00:00Z').getUTCDay()+1)%7,days=window.jalaliMonthLength(p.year,p.month);
   let cells=Array.from({length:offset},()=>'<span></span>').join('');
   for(let n=1;n<=days;n++){const day=iso(n),disabled=day<st.start||day>shift(st.start,179);cells+=`<button type="button" data-ext-day="${day}" aria-label="${esc(date(day))}" aria-pressed="${day>=st.start&&day<=st.end}" ${disabled?'disabled':''}>${fa(n)}</button>`}
   host.innerHTML=`<div class="extMonth"><button type="button" data-ext-month="-1" aria-label="ماه قبل">›</button><b>${esc(new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long',year:'numeric'}).format(new Date(first+'T12:00:00Z')))}</b><button type="button" data-ext-month="1" aria-label="ماه بعد">‹</button></div><div class="extGrid">${['ش','ی','د','س','چ','پ','ج'].map(d=>'<span>'+d+'</span>').join('')}${cells}</div>`;
   host.querySelectorAll('[data-ext-day]').forEach(b=>b.onclick=()=>{if(st.submitting)return;st.end=b.dataset.extDay;st.requestId=crypto.randomUUID();calendar(st);void preview(st)});
   host.querySelectorAll('[data-ext-month]').forEach(b=>b.onclick=()=>{st.month=Number(b.dataset.extMonth)>0?shift(iso(days),1):shift(first,-1);calendar(st)});
   st.modal.querySelector('.extRange').textContent=date(st.start)+' تا '+date(st.end)+' · '+fa(Math.round((Date.parse(st.end)-Date.parse(st.start))/86400000)+1)+' روز';
 }
 function selection(st){
   st.modal.querySelector('.extSubmit').disabled=st.busy||!st.selected.size;
   const total=st.items.filter(x=>st.selected.has(x.itemId)).reduce((n,x)=>n+Number(x.subtotal||0),0);
   st.modal.querySelector('.extTotal').textContent='جمع قبل از تخفیف: '+fa(total)+' تومان';
 }
 async function preview(st){
   const version=++st.version;st.busy=true;selection(st);st.modal.querySelector('[role=alert]').textContent='';st.modal.querySelector('.extItems').textContent='در حال بررسی موجودی روزهای تمدید…';
   try{
     const result=await request('/api/rental/bookings/'+st.id+'/extension?endDate='+encodeURIComponent(st.end));
     if(active!==st||version!==st.version)return;
     st.items=result.items;st.selected=new Set([...st.selected].filter(id=>st.items.some(x=>x.itemId===id&&x.extendable)));
     st.modal.querySelector('.extItems').innerHTML=st.items.map(x=>`<label class="extItem ${x.extendable?'':'blocked'}"><input type="checkbox" data-ext-item="${esc(x.itemId)}" ${x.extendable?'':'disabled'} ${st.selected.has(x.itemId)?'checked':''}><span><b>${esc(x.title)} × ${fa(x.requested)}</b><small>${x.extendable?'قابل تمدید · '+fa(x.subtotal)+' تومان':esc(errors[x.extensionReason]||'قابل تمدید نیست.')}</small></span></label>`).join('');
     st.modal.querySelectorAll('[data-ext-item]').forEach(input=>input.onchange=()=>{input.checked?st.selected.add(input.dataset.extItem):st.selected.delete(input.dataset.extItem);st.requestId=crypto.randomUUID();selection(st)});
   }catch(e){if(active!==st||version!==st.version)return;st.items=[];st.selected.clear();st.modal.querySelector('.extItems').textContent='';st.modal.querySelector('[role=alert]').textContent=errors[e.error]||'بررسی موجودی انجام نشد. دوباره انتخاب کنید.'}
   if(active===st&&version===st.version){st.busy=false;selection(st)}
 }
 window.pbRentalOpenExtension=async id=>{
   const b=find(id);if(!b||b.status!=='picked_up')return;
   close();document.querySelector('#pbR100F71Details.open [data-pb-r71-close]')?.click();
   const modal=document.createElement('div');modal.id='pbOfficeExtension';modal.innerHTML=`<section class="extDialog" role="dialog" aria-modal="true" aria-labelledby="pbExtTitle"><div class="extHead"><b id="pbExtTitle">تمدید آفیش · ${esc(b.photographer_name||b.customer_name)}</b><button type="button" data-ext-close aria-label="بستن">×</button></div><p>آخرین روز آفیش قبلی: ${esc(date(String(b.rental_end).slice(0,10)))}</p><div class="extSplit"><div><p class="extRange"></p><div class="extCalendar"></div></div><div><b>تجهیزات در اختیار مشتری</b><p>روز پایان را انتخاب کنید؛ همه روزها از فردای آفیش قبلی انتخاب می‌شوند.</p><div class="extItems"></div></div></div><p role="alert"></p><div class="extFoot"><span class="extTotal"></span><button type="button" class="extSubmit" disabled>تمدید و صدور فاکتور جدید</button></div></section>`;
   const start=shift(String(b.rental_end),1),st={id,start,end:start,month:start,modal,items:[],selected:new Set(),version:0,busy:true,submitting:false,requestId:crypto.randomUUID(),overflow:document.body.style.overflow,focus:document.activeElement};active=st;
   document.body.append(modal);document.body.style.overflow='hidden';modal.querySelector('[data-ext-close]').onclick=close;modal.querySelector('[data-ext-close]').focus();calendar(st);
   modal.querySelector('.extSubmit').onclick=async()=>{
     if(st.busy||!st.selected.size)return;st.busy=true;st.submitting=true;selection(st);modal.querySelectorAll('[data-ext-item]').forEach(x=>x.disabled=true);
     try{
       const result=await request('/api/rental/bookings/'+id+'/extension',{method:'POST',body:JSON.stringify({endDate:st.end,itemIds:[...st.selected],requestId:st.requestId})});
       if(active===st)close();if(typeof load==='function')await load();if(typeof window.pb100rPrintInvoice==='function')window.pb100rPrintInvoice(result.id);
     }catch(e){if(active===st){st.busy=false;st.submitting=false;modal.querySelector('[role=alert]').textContent=errors[e.error]||'ثبت تمدید انجام نشد؛ دوباره تلاش کنید.';modal.querySelectorAll('[data-ext-item]').forEach(x=>x.disabled=!st.items.find(i=>i.itemId===x.dataset.extItem)?.extendable);selection(st)}}
   };
   await preview(st);
 };
 function mount(){
   document.querySelectorAll('[data-office-booking-id],[data-pb915-booking-id],[data-pb904r5-booking-id]').forEach(card=>{
     if(card.closest('#pbOfficeExtension')||card.querySelector('[data-office-booking-id]'))return;
     const id=card.dataset.officeBookingId||card.dataset.pb915BookingId||card.dataset.pb904r5BookingId,b=find(id);if(!b)return;
     let button=card.querySelector(':scope > .pbOfficeExtendButton');
     if(!button){button=document.createElement('button');button.type='button';button.className='pbOfficeExtendButton';button.dataset.extensionBookingId=id;button.textContent='تمدید آفیش';card.append(button)}
     const enabled=b.status==='picked_up'&&(b.handover_serials||[]).some(x=>!x.extendedToBookingId);
     if(button.disabled===enabled)button.disabled=!enabled;
     const title=enabled?'تمدید تجهیزات تحویل‌شده':'تمدید پس از تحویل تجهیزات در دسترس است';if(button.title!==title)button.title=title;
   });
 }
 let frame=0;const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;mount()})};
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-extension-booking-id]');if(b&&!b.disabled){e.preventDefault();e.stopImmediatePropagation();void window.pbRentalOpenExtension(b.dataset.extensionBookingId)}},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();close()}});
 new MutationObserver(records=>{if(records.some(r=>!r.target.closest?.('#pbOfficeExtension')))schedule()}).observe(document.body,{childList:true,subtree:true});schedule();
})();
