/* Customer appointment calendar. Shared CRM auth/request helpers, Tehran civil dates. */
(()=>{
'use strict';
const el=id=>document.getElementById(id);
const fmtDate=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(d));
const noon=date=>new Date(date+'T12:00:00Z');
const addDays=(date,n)=>new Date(noon(date).getTime()+n*86400000).toISOString().slice(0,10);
const parts=date=>Object.fromEntries(new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(noon(date)).filter(p=>['year','month','day'].includes(p.type)).map(p=>[p.type,Number(p.value)]));
const firstOf=date=>addDays(date,1-parts(date).day);
const longDate=date=>new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(noon(date));
const timeLabel=date=>new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(date));
const today=()=>fmtDate(new Date());
const mobile=()=>matchMedia('(max-width:760px)').matches;
const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="4"/><path d="M7 3v4m10-4v4M3 11h18m-12 4h6m-6 3h4"/></svg>';
const requestedDate=params.get('date');
let selected=/^\d{4}-\d{2}-\d{2}$/.test(requestedDate||'')&&Number.isFinite(Date.parse(requestedDate))?requestedDate:today();
let month=firstOf(selected),appointments=[],editing=null,formDate=selected,quote=null,loadVersion=0,loading=false,returnToForm=false;
const messages={invalid_appointment:'اطلاعات نوبت معتبر نیست. تاریخ، ساعت و نام خدمات را بررسی کنید.',appointment_overlap:'در این ساعت نوبت دیگری دارید. ساعت یا مدت نوبت را تغییر دهید.',appointment_changed:'این نوبت در دستگاه دیگری تغییر کرده است. پنجره را ببندید و برنامه را دوباره دریافت کنید.',appointment_missing:'این نوبت دیگر در دسترس نیست.',appointment_sms_unavailable:'ارسال پیامک برای این حساب آماده نیست. می‌توانید نوبت را با یادآوری داخلی ذخیره کنید.',customer_missing:'مشتری انتخاب‌شده در دسترس نیست.'};
Object.assign(errors,messages);
function days(){const start=addDays(month,-((noon(month).getUTCDay()+1)%7));return Array.from({length:42},(_,i)=>addDays(start,i))}
function dayItems(date){return appointments.filter(a=>fmtDate(a.starts_at)===date)}
function escape(v){return escaped(v)}
function calendarError(message){el('cal-calendar-error').className=message?'calError':'';el('cal-calendar-error').textContent=message}
function render(){
 const p=parts(month);el('cal-month').textContent=new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',month:'long'}).format(noon(month));el('cal-year').textContent=fa(p.year);
 const grid=el('cal-days');grid.replaceChildren();
 for(const date of days()){
  const button=document.createElement('button');button.type='button';const items=dayItems(date).filter(a=>a.status!=='cancelled');
  button.className='calDay'+(parts(date).month!==p.month?' outside':'')+(date===today()?' isToday':'')+(date===selected?' selected':'');
  button.setAttribute('aria-pressed',String(date===selected));button.setAttribute('aria-label',longDate(date)+'، '+fa(items.length)+' نوبت');
  const number=document.createElement('span');number.textContent=fa(parts(date).day);const count=document.createElement('span');count.className='calCount';count.textContent=items.length?fa(items.length)+' نوبت':'\u00a0';
  button.append(number,count);button.onclick=()=>selectDate(date,true);grid.append(button);
 }
 const monthly=appointments.filter(a=>parts(fmtDate(a.starts_at)).month===p.month&&parts(fmtDate(a.starts_at)).year===p.year&&a.status!=='cancelled');
 el('cal-stats').textContent=loading?'در حال دریافت برنامه‌ها…':fa(monthly.length)+' نوبت در این ماه · ساعت‌ها به وقت تهران';
 el('cal-open-selected').textContent='برنامهٔ '+new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',day:'numeric',month:'long'}).format(noon(selected))+' · '+fa(dayItems(selected).length)+' نوبت';
 renderAgenda(el('cal-agenda'));if(el('cal-day-dialog').open)renderAgenda(el('cal-day-content'));
}
function renderAgenda(container){
 const list=dayItems(selected).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));
 const head=document.createElement('div');head.className='calAgendaHead';head.innerHTML='<div><h3>'+escape(new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',weekday:'long',day:'numeric',month:'long'}).format(noon(selected)))+'</h3><small>برنامهٔ مشتریان این روز</small></div><span class="calPill">'+fa(list.filter(a=>a.status!=='cancelled').length)+' نوبت</span>';
 const body=document.createElement('div');body.className='calAgendaList';
 if(loading){const text=document.createElement('p');text.className='calLoading';text.textContent='در حال دریافت نوبت‌ها…';body.append(text)}
 else if(!list.length){const empty=document.createElement('div');empty.className='calEmpty';empty.innerHTML=icon+'<strong>این روز هنوز نوبتی ندارد</strong><p>برای یک برنامهٔ تازه جا داریم.<br>اولین نوبت این روز را ثبت کنید.</p>';body.append(empty)}
 for(const appointment of list){
  const card=document.createElement('article');card.className='calAppointment '+appointment.status;
  const end=new Date(new Date(appointment.starts_at).getTime()+appointment.duration_minutes*60000);
  card.innerHTML='<div class="calAppointmentHead"><time>'+escape(timeLabel(appointment.starts_at))+' <span class="dim small">تا '+escape(timeLabel(end))+'</span></time><span class="calPill">'+({scheduled:'برنامه‌ریزی‌شده',completed:'انجام‌شده',cancelled:'لغوشده'}[appointment.status]||'')+'</span></div><h4>'+escape(appointment.customer_name)+'</h4><p>'+escape(appointment.service_name)+'</p>';
  const phone=document.createElement('a');phone.href='tel:'+String(appointment.customer_mobile||'').replace(/[^+\d]/g,'');phone.dir='ltr';phone.textContent=appointment.customer_mobile;phone.setAttribute('aria-label','تماس با '+appointment.customer_name);card.append(phone);
  if(appointment.notes){const notes=document.createElement('p');notes.textContent=appointment.notes;card.append(notes)}
  const foot=document.createElement('div');foot.className='calAppointmentFoot';const reminder=document.createElement('small');
  reminder.textContent=appointment.sms_enabled?({sent:'پیامک یادآوری ارسال شد',failed:'ارسال پیامک ناموفق بود',processing:'ارسال پیامک در حال بررسی است',cancelled:'یادآوری لغو شده'}[appointment.sms_state]||'اعلان داخلی + پیامک روز قبل'):'اعلان داخلی روز قبل';
  if(appointment.sms_state==='failed'){reminder.className='failed';if(appointment.sms_error==='service_wallet_insufficient')reminder.textContent='پیامک ارسال نشد؛ اعتبار حساب کافی نیست.';}
  const edit=document.createElement('button');edit.type='button';edit.textContent='ویرایش نوبت';edit.onclick=()=>openForm(appointment);foot.append(reminder,edit);card.append(foot);body.append(card);
 }
 const add=document.createElement('button');add.type='button';add.className='calAgendaAdd';add.textContent='＋ ثبت نوبت برای این روز';add.onclick=()=>openForm();body.append(add);container.replaceChildren(head,body);
}
async function load(){
 const version=++loadVersion;loading=true;calendarError('');render();
 const gridDays=days();
 try{const data=await request('appointments?from='+gridDays[0]+'&to='+addDays(gridDays.at(-1),1));if(version!==loadVersion)return;appointments=data.appointments||[]}
 catch(error){if(version!==loadVersion)return;appointments=[];calendarError(error.message||'دریافت برنامه‌ها انجام نشد.')}
 finally{if(version===loadVersion){loading=false;render()}}
}
function selectDate(date,show){
 selected=date;const previous=month;month=firstOf(date);if(previous!==month)load();else render();
 if(returnToForm){calendarError('');returnToForm=false;formDate=date;el('cal-form-date').textContent=longDate(date);if(quote)updateSmsQuote();el('cal-form-dialog').showModal();return}
 if(show&&mobile()){renderAgenda(el('cal-day-content'));if(!el('cal-day-dialog').open)el('cal-day-dialog').showModal()}
}
function newCustomerMode(enabled){el('cal-new-customer').hidden=!enabled;el('cal-customer').disabled=enabled;el('cal-customer').required=!enabled;el('cal-new-name').required=enabled;el('cal-new-mobile').required=enabled;el('cal-new-customer-toggle').textContent=enabled?'انتخاب از مشتریان قبلی':'＋ مشتری جدید'}
function updateSmsQuote(){
 const hint=el('cal-sms-quote');hint.className='calQuote';
 if(!quote?.available){hint.textContent='پیامک برای این حساب آماده نیست؛ یادآوری داخلی فعال می‌ماند.';return}
 const name=!el('cal-new-customer').hidden?el('cal-new-name').value:(state.customers.find(c=>c.id===el('cal-customer').value)?.fullName||editing?.customer_name||'مشتری');
 const date=new Date(formDate+'T'+(el('cal-time').value||'10:00')+':00+03:30');
 const dateText=new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',month:'long',day:'numeric'}).format(date);
 const message='PhotoBridge: '+dateText+' ساعت '+timeLabel(date)+'، '+name+'؛ '+(el('cal-service').value||'خدمات درخواستی');
 const segments=message.length<=70?1:Math.ceil(message.length/67),total=segments*quote.unitPrice;
 hint.textContent='گیرنده: '+quote.recipientMobile+' · هر بخش پیامک: '+fa(quote.unitPrice)+' تومان · برآورد این یادآوری: '+fa(segments)+' بخش، '+fa(total)+' تومان · اعتبار: '+fa(quote.balance)+' تومان. هزینه هنگام ارسال و با تعرفهٔ همان زمان کسر می‌شود.';
 if(quote.balance<total){hint.className='calQuote error';hint.textContent+=' اعتبار فعلی کافی نیست؛ پیش از ارسال کیف پول را شارژ کنید.'}
}
async function loadQuote(){
 el('cal-sms-quote').textContent='در حال دریافت تعرفهٔ پیامک…';el('cal-sms').disabled=true;
 try{quote=await request('appointments/quote');el('cal-sms').disabled=!quote.available&&!el('cal-sms').checked;updateSmsQuote()}
 catch(error){quote=null;el('cal-sms').disabled=!el('cal-sms').checked;el('cal-sms-quote').textContent='تعرفهٔ پیامک دریافت نشد؛ ثبت نوبت با یادآوری داخلی ممکن است.'}
}
function openForm(appointment=null){
 if(loading)return;
 if(el('cal-day-dialog').open)el('cal-day-dialog').close();
 editing=appointment;formDate=appointment?fmtDate(appointment.starts_at):selected;el('cal-form').reset();newCustomerMode(false);
 el('cal-customer').innerHTML='<option value="">انتخاب مشتری…</option>'+customerOptions();
 el('cal-service-options').innerHTML=state.shootTypes.map(t=>'<option value="'+escape(t.name)+'"></option>').join('');
 el('cal-form-title').textContent=appointment?'ویرایش نوبت مشتری':'ثبت نوبت جدید';el('cal-form-date').textContent=longDate(formDate);el('cal-save').textContent=appointment?'ذخیره تغییرات':'ثبت نوبت';el('cal-status-field').hidden=!appointment;el('cal-form-error').textContent='';
 if(appointment&&!state.customers.some(c=>c.id===appointment.customer_id)){const option=document.createElement('option');option.value=appointment.customer_id;option.textContent=appointment.customer_name+' — '+appointment.customer_mobile+' (بایگانی‌شده)';el('cal-customer').append(option);}
 if(appointment){el('cal-customer').value=appointment.customer_id;el('cal-service').value=appointment.service_name;el('cal-time').value=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(appointment.starts_at));el('cal-duration').value=String(appointment.duration_minutes);el('cal-notes').value=appointment.notes||'';el('cal-status').value=appointment.status;el('cal-sms').checked=appointment.sms_enabled}
 el('cal-form-dialog').showModal();loadQuote();
}
el('cal-form').addEventListener('submit',async event=>{
 event.preventDefault();const button=el('cal-save');if(button.disabled)return;
 if(el('cal-status').value==='scheduled'&&el('cal-sms').checked&&(!quote?.available)){el('cal-form-error').textContent='ابتدا گزینهٔ پیامک را غیرفعال کنید یا اتصال پیامک را بررسی کنید.';return}
 if(!el('cal-form').reportValidity())return;
 button.disabled=true;el('cal-form-error').textContent='';
 try{
  let customerId=el('cal-customer').value;
  if(!el('cal-new-customer').hidden){
   const result=await request('customers','POST',buildCustomerPayload(el('cal-new-name').value,el('cal-new-mobile').value));customerId=result.id;
   // Keep the new identity even when saving the appointment fails; retry never creates another customer.
   state.customers.unshift({id:customerId,fullName:el('cal-new-name').value.trim(),mobile:el('cal-new-mobile').value.trim(),marketingPermission:'unknown'});
   renderCustomers();el('cal-customer').innerHTML=customerOptions();el('cal-customer').value=customerId;newCustomerMode(false);
  }
  const startsAt=new Date(formDate+'T'+el('cal-time').value+':00+03:30').toISOString();
  await request(editing?'appointments/'+editing.id:'appointments',editing?'PUT':'POST',{customerId,expectedRevision:editing?.revision,serviceName:el('cal-service').value,startsAt,durationMinutes:Number(el('cal-duration').value),notes:el('cal-notes').value,status:el('cal-status').value,smsEnabled:el('cal-sms').checked});
  el('cal-form-dialog').close();selected=formDate;month=firstOf(selected);await load();toast(editing?'نوبت مشتری به‌روز شد.':'نوبت مشتری ثبت شد.');if(mobile()){renderAgenda(el('cal-day-content'));el('cal-day-dialog').showModal()}
 }catch(error){el('cal-form-error').textContent=error.message||'ثبت نوبت انجام نشد.'}finally{button.disabled=false}
});
el('cal-create').onclick=()=>openForm();el('cal-open-selected').onclick=()=>selectDate(selected,true);
el('cal-new-customer-toggle').onclick=()=>{newCustomerMode(el('cal-new-customer').hidden);updateSmsQuote()};
for(const id of ['cal-customer','cal-service','cal-new-name','cal-time'])el(id).addEventListener('input',()=>{if(quote)updateSmsQuote()});
el('cal-change-date').onclick=()=>{el('cal-form-dialog').close();returnToForm=true;el('cal-calendar-error').className='note';el('cal-calendar-error').textContent='روز جدید نوبت را از تقویم انتخاب کنید.';el('cal-days').scrollIntoView({behavior:'smooth',block:'center'})};
el('cal-tomorrow').onclick=()=>selectDate(addDays(today(),1),true);
el('cal-prev').onclick=()=>{month=firstOf(addDays(month,-1));load()};el('cal-next').onclick=()=>{month=firstOf(addDays(month,32));load()};el('cal-today').onclick=()=>{returnToForm=false;selectDate(today(),false)};
document.querySelectorAll('[data-cal-close]').forEach(button=>button.onclick=()=>{el(button.dataset.calClose).close();returnToForm=false});
for(const dialog of document.querySelectorAll('.calDialog'))dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientY<rect.top||event.clientY>rect.bottom||event.clientX<rect.left||event.clientX>rect.right)dialog.close()}});
async function enablePush(prompt=false){
 const button=el('cal-enable-push'),hint=el('cal-push-state');
 if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)){hint.textContent='اعلان داخلی فعال است · برای اعلان گوشی از مرورگر پشتیبانی‌شده یا نسخهٔ نصب‌شده استفاده کنید.';button.hidden=true;return}
 if(Notification.permission==='denied'){hint.textContent='اعلان داخلی فعال است · اجازهٔ اعلان گوشی را از تنظیمات مرورگر فعال کنید.';button.textContent='بررسی اجازهٔ اعلان';return}
 if(Notification.permission!=='granted'&&!prompt)return;
 button.disabled=true;
 try{
  if(Notification.permission!=='granted'&&await Notification.requestPermission()!=='granted')throw new Error('اجازهٔ اعلان داده نشد؛ یادآوری داخلی همچنان فعال است.');
  const keyResponse=await fetch('/api/push/public-key',{credentials:'same-origin',headers:header});if(!keyResponse.ok)throw new Error('فعالسازی اعلان گوشی انجام نشد.');const key=await keyResponse.json();
  const raw=atob((key.publicKey+'='.repeat((4-key.publicKey.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/'));const bytes=Uint8Array.from(raw,char=>char.charCodeAt(0));
  const registration=await navigator.serviceWorker.register('/photobridge-sw-v710.js?gallery=r1318',{scope:'/'});await navigator.serviceWorker.ready;
  const subscription=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
  const response=await fetch(portal==='lab'?'/api/lab/push/subscribe':'/api/customer/push/subscribe',{method:'POST',credentials:'same-origin',headers:{...header,'content-type':'application/json'},body:JSON.stringify({...subscription.toJSON(),deviceLabel:'تقویم مشتریان · '+String(navigator.platform||'مرورگر')})});if(!response.ok)throw new Error('ثبت اعلان گوشی انجام نشد.');
  hint.textContent='اعلان داخلی و اعلان گوشی فعال‌اند · یادآوری ۲۴ ساعت قبل از نوبت';button.textContent='اعلان گوشی فعال است';button.disabled=true;
 }catch(error){hint.textContent=error.message;button.disabled=false}
}
navigator.serviceWorker?.addEventListener('message',event=>{if(event.data?.type==='PB_PUSH_FOREGROUND'&&event.data.payload?.event==='crm_appointment_reminder'){toast(event.data.payload.body||'یادآوری برنامه مشتری');load();}});
el('cal-enable-push').onclick=()=>enablePush(true);
const tab=document.querySelector('nav button[data-view="calendar"]');tab.addEventListener('click',()=>{load();enablePush()});
// Explicit deep links from background push open the requested Persian calendar day.
if(params.get('view')==='calendar'&&['lab','photographer'].includes(portal)){tab.click()}
else render();
})();
