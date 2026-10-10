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
 function close(){if(!active)return;const st=active;active=null;st.version++;window.closeJalaliCalendar?.();st.modal.remove();document.body.classList.remove('pbOfficeEditOpen');document.body.style.overflow=st.overflow;st.focus?.focus()}
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
 window.pbRentalOpenBookingEdit=async id=>{
   const b=find(id);if(!b)return;
   close();document.querySelector('#pbR100F71Details.open [data-pb-r71-close]')?.click();
   const modal=document.createElement('div');modal.id='pbOfficeExtension';modal.innerHTML='<section class="extDialog" role="dialog" aria-modal="true" aria-labelledby="pbEditTitle"><div class="extHead"><b id="pbEditTitle">ویرایش آفیش</b><button type="button" data-ext-close aria-label="بستن">×</button></div><div class="editBody">در حال دریافت آفیش…</div><p role="alert"></p></section>';
   const st={id,modal,version:0,overflow:document.body.style.overflow,focus:document.activeElement,busy:false};active=st;document.body.append(modal);document.body.style.overflow='hidden';document.body.classList.add('pbOfficeEditOpen');modal.querySelector('[data-ext-close]').onclick=close;
   try{
     const draft=await request('/api/rental/bookings/'+id+'/edit');if(active!==st)return;
     const qty=new Map(draft.items.map(x=>[x.itemId,x.quantity]));
     modal.querySelector('.editBody').innerHTML=`<form class="editForm"><div class="editDates"><label>تاریخ شروع<input name="startDate" inputmode="none" readonly value="${esc(window.isoToJalaliInput(draft.startDate))}"></label><label>تاریخ پایان<input name="endDate" inputmode="none" readonly value="${esc(window.isoToJalaliInput(draft.endDate))}"></label></div><div class="editItems"></div><div class="extFoot"><button type="button" data-edit-add>افزودن تجهیز به آفیش</button><button type="submit" class="extSubmit">ذخیره تغییرات</button></div></form>`;
     const form=modal.querySelector('form');
     const titles=new Map(draft.catalog.map(x=>[x.id,x.title]));
     for(const x of b.items||[])if(!titles.has(x.itemId))titles.set(x.itemId,x.title);
     let inventory=new Map(),inventoryVersion=0,picker=null,pickerVersion=0,pickerPage=0,pickerBusy=false,refreshTimer=0;
     const dates=()=>({startDate:window.jalaliInputToIso(form.elements.startDate.value),endDate:window.jalaliInputToIso(form.elements.endDate.value)});
     const check=items=>request('/api/rental/bookings/'+id+'/edit/availability',{method:'POST',body:JSON.stringify({...dates(),items})});
     const description=row=>!row?'در حال بررسی موجودی…':!row.valid?'این تجهیز قابل انتخاب نیست.':row.shortage>0?('کسری '+fa(row.shortage)+' عدد در این بازه'+(window.pbRentalDailyAvailabilityText?' · '+window.pbRentalDailyAvailabilityText(row.dailyAvailability,row.requested):'')):'موجود در تمام روزهای انتخاب‌شده';
     function paintAvailability(){form.querySelectorAll('[data-edit-row]').forEach(row=>{const item=inventory.get(row.dataset.editRow);row.classList.toggle('blocked',Boolean(item&&(!item.valid||item.shortage>0)));row.querySelector('.editStock').textContent=description(item)})}
     async function refresh(){
       const version=++inventoryVersion,items=[...qty].map(([itemId,quantity])=>({itemId,quantity}));inventory.clear();paintAvailability();
       if(!items.length)return;
       try{const result=await check(items);if(active!==st||version!==inventoryVersion)return;inventory=new Map(result.items.map(x=>[x.itemId,x]));paintAvailability()}
       catch(error){if(active===st&&version===inventoryVersion){form.querySelectorAll('.editStock').forEach(x=>x.textContent='بررسی موجودی انجام نشد؛ تاریخ‌ها را بررسی کنید.')}}
     }
     function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{if(active===st)void refresh()},120)}
     function renderItems(){
       form.querySelector('.editItems').innerHTML=qty.size?[...qty].map(([itemId,quantity])=>`<div class="extItem" data-edit-row="${esc(itemId)}"><div class="editItemName"><b>${esc(titles.get(itemId)||'تجهیز ثبت‌شده')}</b><small class="editStock"></small></div><div class="editQuantity"><button type="button" data-edit-step="-1" aria-label="کاهش تعداد ${esc(titles.get(itemId)||'تجهیز')}" ${quantity<=1?'disabled':''}>−</button><input type="number" aria-label="تعداد ${esc(titles.get(itemId)||'تجهیز')}" data-edit-item="${esc(itemId)}" min="1" max="99" step="1" value="${quantity}" required><button type="button" data-edit-step="1" aria-label="افزایش تعداد ${esc(titles.get(itemId)||'تجهیز')}" ${quantity>=99?'disabled':''}>+</button></div><button type="button" data-edit-remove aria-label="حذف ${esc(titles.get(itemId)||'تجهیز')}">حذف</button></div>`).join(''):'<p>تجهیزی انتخاب نشده است؛ از «افزودن تجهیز» استفاده کنید.</p>';
       form.querySelectorAll('[data-edit-row]').forEach(row=>{
         const input=row.querySelector('[data-edit-item]'),itemId=input.dataset.editItem;
         const update=()=>{const value=Number(input.value);if(!Number.isInteger(value)||value<1||value>99)return;qty.set(itemId,value);row.querySelector('[data-edit-step="-1"]').disabled=value<=1;row.querySelector('[data-edit-step="1"]').disabled=value>=99;scheduleRefresh()};
         input.onchange=update;
         row.querySelectorAll('[data-edit-step]').forEach(button=>button.onclick=()=>{if(st.busy)return;input.value=String(Math.max(1,Math.min(99,(qty.get(itemId)||1)+Number(button.dataset.editStep))));update()});
         row.querySelector('[data-edit-remove]').onclick=()=>{if(st.busy)return;qty.delete(itemId);renderItems();scheduleRefresh()};
       });paintAvailability();
     }
     const closePicker=()=>{if(!picker)return false;pickerVersion++;picker.remove();picker=null;form.querySelector('[data-edit-add]').focus();return true};st.closePicker=closePicker;
     async function paintPicker(){
       if(!picker)return;const view=picker,version=++pickerVersion,rows=draft.catalog.slice(pickerPage*60,(pickerPage+1)*60);pickerBusy=true;
       view.querySelector('.editPickerList').textContent='در حال بررسی موجودی تاریخ‌های انتخاب‌شده…';
       view.querySelector('.editPickerRange').textContent=date(dates().startDate)+' تا '+date(dates().endDate);
       try{
         const result=rows.length?await check(rows.map(x=>({itemId:x.id,quantity:Math.min(99,(qty.get(x.id)||0)+1)}))):{items:[]};
         if(active!==st||picker!==view||version!==pickerVersion)return;
         const stock=new Map(result.items.map(x=>[x.itemId,x]));
         view.querySelector('.editPickerList').innerHTML=rows.length?rows.map(x=>{const row=stock.get(x.id),count=qty.get(x.id)||0;return `<article class="extItem ${row&&(!row.valid||row.shortage>0)?'blocked':''}"><div class="editItemName"><b>${esc(x.title)}</b><small>${esc(description(row))}</small>${count?'<small>در آفیش: '+fa(count)+' عدد</small>':''}</div><button type="button" data-picker-item="${esc(x.id)}" ${!row?.valid||count>=99?'disabled':''}>${row?.shortage>0?'افزودن با کسری':'افزودن'}</button></article>`}).join(''):'<p>تجهیزی برای افزودن وجود ندارد.</p>';
         view.querySelectorAll('[data-picker-item]').forEach(button=>button.onclick=()=>{if(pickerBusy||st.busy)return;const key=button.dataset.pickerItem;qty.set(key,Math.min(99,(qty.get(key)||0)+1));renderItems();scheduleRefresh();void paintPicker()});
         view.querySelector('[data-picker-prev]').disabled=pickerPage===0;view.querySelector('[data-picker-next]').disabled=(pickerPage+1)*60>=draft.catalog.length;
       }catch(error){if(active===st&&picker===view&&version===pickerVersion)view.querySelector('.editPickerList').textContent='موجودی دریافت نشد؛ تاریخ شروع و پایان را بررسی کنید.'}
       if(picker===view&&version===pickerVersion)pickerBusy=false;
     }
     form.querySelector('[data-edit-add]').onclick=()=>{
       if(st.busy||picker)return;if(!dates().startDate||!dates().endDate||dates().startDate>dates().endDate){modal.querySelector('[role=alert]').textContent='تاریخ شروع و پایان را درست انتخاب کنید.';return;}
       picker=document.createElement('div');picker.className='editPicker';picker.innerHTML='<section class="extDialog" role="dialog" aria-modal="true" aria-label="افزودن تجهیزات"><div class="extHead"><b>افزودن تجهیزات به آفیش</b><button type="button" data-picker-close>بازگشت به ویرایش</button></div><p class="editPickerRange"></p><div class="editPickerList"></div><div class="extFoot"><button type="button" data-picker-prev>قبلی</button><button type="button" data-picker-next>بعدی</button></div></section>';modal.append(picker);
       picker.querySelector('[data-picker-close]').onclick=closePicker;picker.querySelector('[data-picker-close]').focus();pickerPage=0;
       picker.querySelector('[data-picker-prev]').onclick=()=>{if(pickerPage>0){pickerPage--;void paintPicker()}};picker.querySelector('[data-picker-next]').onclick=()=>{if((pickerPage+1)*60<draft.catalog.length){pickerPage++;void paintPicker()}};void paintPicker();
     };
     for(const name of ['startDate','endDate']){form.elements[name].onclick=()=>window.openJalaliCalendar(form.elements[name]);form.elements[name].onchange=()=>{scheduleRefresh();if(picker)void paintPicker()}}
     renderItems();void refresh();
     form.onsubmit=async e=>{
       e.preventDefault();if(st.busy)return;
       const items=[...qty].map(([itemId,quantity])=>({itemId,quantity}));
       if(!items.length){modal.querySelector('[role=alert]').textContent='حداقل یک تجهیز انتخاب کنید.';return;}
       const payload={revision:draft.revision,startDate:window.jalaliInputToIso(form.elements.startDate.value),endDate:window.jalaliInputToIso(form.elements.endDate.value),items};
       st.busy=true;form.querySelector('[type=submit]').disabled=true;
       try{
         const save=()=>request('/api/rental/bookings/'+id+'/edit',{method:'PUT',body:JSON.stringify(payload)});
         try{await save()}catch(error){
           if(error.error!=='equipment_unavailable'||!confirm('برخی تجهیزات در روزهای انتخاب‌شده موجود نیستند. تغییرات با ثبت کسری برای تأمین ذخیره شود؟'))throw error;
           payload.allowShortage=true;await save();
         }
         if(active===st)close();if(typeof load==='function')await load();
       }
       catch(error){if(active===st){modal.querySelector('[role=alert]').textContent=({booking_not_editable:'این آفیش تحویل شده یا فاکتور دارد و قابل ویرایش نیست.',booking_changed_retry:'آفیش تغییر کرده است؛ پنجره را ببندید و دوباره باز کنید.',booking_supplied_edit_requires_review:'این آفیش تجهیزات تأمین‌شده دارد؛ ابتدا وضعیت تأمین را بررسی کنید.',past_rental_date:'تاریخ گذشته قابل انتخاب نیست.'})[error.error]||'ویرایش انجام نشد؛ تاریخ و تجهیزات را بررسی کنید.'}}
       finally{st.busy=false;if(active===st)form.querySelector('[type=submit]').disabled=false}
     };
   }catch(error){if(active===st)modal.querySelector('[role=alert]').textContent='این آفیش قابل ویرایش نیست یا دریافت اطلاعات انجام نشد.'}
 };
 style.textContent+='\n.pbOfficeEditOpen #jalaliCalendarPopover{z-index:2147483201!important}.pbOfficeEditOpen #jalaliCalendarBackdrop{z-index:2147483200!important}#pbOfficeExtension .editForm input{font:inherit;box-sizing:border-box;max-width:100%;padding:10px;border:1px solid #d9e2f5;border-radius:8px}#pbOfficeExtension .editForm label>input:not([type=number]){display:block;width:100%}#pbOfficeExtension .editItems{margin:12px 0;max-height:40dvh;overflow:auto}#pbOfficeExtension .editItems .extItem{justify-content:space-between;align-items:center}#pbOfficeExtension .editItems input[type=number]{width:80px;height:42px}#pbOfficeExtension .editItems [hidden]{display:none}';
 style.textContent+='\n#pbOfficeExtension .editDates{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin:14px 0}#pbOfficeExtension .editDates label{min-width:0;font-size:14px}#pbOfficeExtension .editDates input{font-size:16px;cursor:pointer}#pbOfficeExtension .editItemName{min-width:0;flex:1;overflow-wrap:anywhere}#pbOfficeExtension .editItemName small{white-space:pre-line}#pbOfficeExtension .editQuantity{display:flex;gap:6px;align-items:center;direction:ltr}#pbOfficeExtension .editQuantity button{min-width:44px;min-height:44px;font-size:20px;padding:4px}#pbOfficeExtension .editQuantity input[type=number]{width:60px;text-align:center}#pbOfficeExtension [data-edit-remove]{color:#b42318;background:#fff4f3;min-height:44px}#pbOfficeExtension .editPicker{position:fixed;inset:0;z-index:2147483150;display:grid;place-items:center;padding:12px;background:#10182899}#pbOfficeExtension .editPickerList{max-height:60dvh;overflow:auto;padding:2px}#pbOfficeExtension .editPicker .extItem{align-items:center}#pbOfficeExtension [data-picker-item]{min-height:44px;flex-shrink:0}@media(max-width:560px){#pbOfficeExtension .editItems .extItem{display:grid;grid-template-columns:minmax(0,1fr) auto}#pbOfficeExtension .editItems .editItemName{grid-column:1/-1}#pbOfficeExtension .editDates input{padding:9px 4px}#pbOfficeExtension .editPicker .extItem{font-size:14px}}';
 const cardSelector='[data-office-booking-id],[data-pb915-booking-id],[data-pb904r5-booking-id]';
 const cardId=card=>card.dataset.officeBookingId||card.dataset.pb915BookingId||card.dataset.pb904r5BookingId;
 function mount(){
   document.querySelectorAll(cardSelector).forEach(card=>{
     if(card.closest('#pbOfficeExtension'))return;
     // Desktop day cards and their action toolbar are siblings in the same group.
     const group=card.closest('.pbR1052DayGroup'),toolbar=group?.querySelector('[data-office-booking-id]');
     if(toolbar&&cardId(toolbar)===cardId(card)&&card!==toolbar)return;
     const parent=card.parentElement?.closest(cardSelector);if(parent&&cardId(parent)===cardId(card))return;
     const id=card.dataset.officeBookingId||card.dataset.pb915BookingId||card.dataset.pb904r5BookingId,b=find(id);if(!b)return;
     const extend=b.status==='picked_up'&&(b.handover_serials||[]).some(x=>!x.extendedToBookingId),edit=['reserved','pending_approval','payment_pending'].includes(b.status)&&!b.has_invoice&&!b.invoice_id&&b.payment_status!=='paid';
     const buttons=[...card.querySelectorAll('.pbOfficeExtendButton')];let button=buttons.shift();buttons.forEach(x=>x.remove());
     if(!extend&&!edit){button?.remove();return;}
     if(!button){button=document.createElement('button');button.type='button';button.className='pbOfficeExtendButton';(card.querySelector('.pbR1052DayActions,.actions')||card).append(button)}
     if(button.disabled)button.disabled=false;
     const label=extend?'تمدید آفیش':'ویرایش آفیش';if(button.textContent!==label)button.textContent=label;
     if(button.dataset.bookingAction!==(extend?'extend':'edit'))button.dataset.bookingAction=extend?'extend':'edit';
     if(button.dataset.extensionBookingId!==id)button.dataset.extensionBookingId=id;
   });
 }
 let frame=0;const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;mount()})};
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-extension-booking-id]');if(b&&!b.disabled){e.preventDefault();e.stopImmediatePropagation();void (b.dataset.bookingAction==='edit'?window.pbRentalOpenBookingEdit:window.pbRentalOpenExtension)(b.dataset.extensionBookingId)}},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();if(!active.closePicker?.())close()}});
 new MutationObserver(records=>{if(records.some(r=>!r.target.closest?.('#pbOfficeExtension')))schedule()}).observe(document.body,{childList:true,subtree:true});schedule();
})();
