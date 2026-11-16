// PhotoBridge independent CRM page. No imports from legacy SPA.
'use strict';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const portal=params.get('portal');
const header={'x-photobridge-portal':portal};
const state={customers:[],shootTypes:[],sessions:[],occasions:[],templates:[],invoices:[]};
const fa=n=>Number(n||0).toLocaleString('fa-IR');
const escaped=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const errors={invalid_customer:'نام یا موبایل نامعتبر است یا اطلاعات رضایت پیامک کامل نیست.',crm_duplicate:'این مورد قبلاً ثبت شده است.',crm_forbidden:'ابتدا از بخش عکاسی یا لابراتوار وارد حساب خود شوید.',crm_origin_required:'اجازه تغییر اطلاعات از این صفحه داده نشد.',crm_internal_error:'خطای سرور؛ تغییرات انجام نشد.',sms_template_unavailable:'برای این مدل پیامک فعالی ثبت نشده است.',invalid_message_text:'متن پیامک نامعتبر است.',invalid_occasion:'تاریخ مناسبت معتبر نیست.',invalid_invoice_amount:'مبلغ یا تعداد نامعتبر است.',invoice_missing:'فاکتور پیدا نشد.',service_wallet_insufficient:'اعتبار کافی نیست.'};
function toast(t,error=false){const el=$('status');el.textContent=t;el.className='status '+(error?'error':'success');}
async function request(path,method='GET',data){
 const response=await fetch('/api/crm/'+path,{method,headers:{...header,...(data!==undefined?{'content-type':'application/json'}:{})},body:data===undefined?undefined:JSON.stringify(data),credentials:'same-origin',cache:'no-store'});
 const contentType=response.headers.get('content-type')||'';
 const output=contentType.includes('application/json')?await response.json():await response.text();
 if(!response.ok){const key=output?.error||'network_error';throw new Error(errors[key]||key)}
 return output;
}
function handle(promise,success){promise.then(()=>{toast(success);return reload()}).catch(e=>toast(e.message,true))}
async function reload(){
 const data=await request('bootstrap');Object.assign(state,data);
 renderAll();
}
function labelCustomer(id){return state.customers.find(x=>x.id===id)?.fullName||'مشتری ثبت‌شده'}
function customerOptions(){
 return state.customers.map(c=>'<option value="'+c.id+'">'+escaped(c.fullName)+' — '+escaped(c.mobile)+'</option>').join('');
}
function typeOptions(){return state.shootTypes.map(t=>'<option value="'+t.id+'">'+escaped(t.name)+'</option>').join('')}
function populate(sel,options){const old=sel.value;sel.innerHTML=options;if([...sel.options].some(x=>x.value===old))sel.value=old}
function renderCustomers(){
 const q=$('search').value.trim().toLowerCase();
 const entries=state.customers.filter(c=>(c.fullName+' '+c.mobile).toLowerCase().includes(q));
 $('customer-rows').innerHTML=entries.map(c=>'<tr><td>'+escaped(c.fullName)+'</td><td dir="ltr">'+escaped(c.mobile)+'</td><td><button data-edit="'+c.id+'">ویرایش</button> <button data-delete="'+c.id+'">حذف</button> <button data-new-invoice="'+c.id+'">فاکتور جدید</button></td></tr>').join('')||'<tr><td colspan="3">مشتری ثبت نشده است.</td></tr>';
 document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>editCustomer(b.dataset.edit)));
 document.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteCustomer(b.dataset.delete)));
 document.querySelectorAll('[data-new-invoice]').forEach(b=>b.addEventListener('click',()=>{editCustomer(b.dataset.newInvoice);$('invoice-form').reset();$('invoice-lines').replaceChildren();addInvoiceLine();$('invoice-form').scrollIntoView({behavior:'smooth',block:'start'});}));
 for(const s of ['sms-customers'])populate($(s),customerOptions());
}
function renderTypes(){
 for(const key of ['session-type','template-type'])populate($(key),typeOptions());
}
function renderInvoices(){
 $('invoice-rows').innerHTML=state.invoices.filter(i=>i.customer_id===editingCustomerId).map(i=>{
 const id=i.id,cid=i.customer_id,status=i.status;
 return '<tr><td>'+fa(i.invoice_number)+'</td><td>'+escaped(labelCustomer(cid))+'</td><td>'+fa(i.total_toman)+' تومان</td><td>'+fa(i.due_toman)+' تومان</td><td>'+(status==='void'?'باطل‌شده':'صادرشده')+'</td><td>'+ (status==='issued'?'<button data-print="'+id+'" data-format="a4">A4</button> <button data-print="'+id+'" data-format="thermal">حرارتی</button> <button data-void="'+id+'">ابطال</button>':'—')+'</td></tr>';
 }).join('')||'<tr><td colspan="6">هنوز فاکتوری ثبت نشده است.</td></tr>';
 document.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>printInvoice(b.dataset.print,b.dataset.format)));
 document.querySelectorAll('[data-void]').forEach(b=>b.addEventListener('click',()=>{const reason=prompt('علت ابطال فاکتور (در سوابق نگهداری می‌شود)');if(reason?.trim())handle(request('invoices/'+b.dataset.void+'/void','POST',{reason}),'فاکتور با حفظ سابقه باطل شد')}));
}
function renderAll(){renderCustomers();renderTypes();renderInvoices();renderCustomerSessions();onTypeChanged()}
let editingCustomerId=null;
function updateCustomerFormMode(){
 const editing=!!editingCustomerId;
 $('customer-form-title').textContent=editing?'ویرایش مشخصات مشتری':'ثبت مشتری جدید';
 $('customer-submit').textContent=editing?'ذخیره تغییرات':'ثبت مشتری';
 $('customer-cancel').hidden=!editing;
 $('customer-details').hidden=!editing;
}
function resetCustomerForm(){
 $('invoice-form').reset();$('invoice-lines').replaceChildren();addInvoiceLine();
 editingCustomerId=null;
 $('customer-form').reset();
 updateCustomerFormMode();
}
function buildCustomerPayload(fullName,mobile,previous=null){
 return {fullName:fullName.trim(),mobile:mobile.trim(),marketingPermission:previous?.marketingPermission||'unknown',permissionSource:previous?.permissionSource||'',notes:previous?.notes||''};
}
function renderCustomerSessions(){
 $('customer-sessions').textContent=state.sessions.filter(s=>s.customer_id===editingCustomerId).map(s=>(state.shootTypes.find(t=>t.id===s.shoot_type_id)?.name||'خدمت')+' · '+(s.shoot_date?new Intl.DateTimeFormat('fa-IR',{dateStyle:'long',timeZone:'Asia/Tehran'}).format(new Date(s.shoot_date)):'بدون تاریخ')).join(' | ');
}
function editCustomer(id){
 const c=state.customers.find(x=>x.id===id);if(!c)return;
 if(editingCustomerId!==id){$('invoice-form').reset();$('invoice-lines').replaceChildren();addInvoiceLine();}
 editingCustomerId=id;
 $('customer-name').value=c.fullName;
 $('customer-mobile').value=c.mobile;
 $('session-form').reset();
 $('session-date').value='';
 $('session-date-trigger').textContent='انتخاب تاریخ شمسی';
 $('session-calendar').hidden=true;
 renderInvoices();renderCustomerSessions();
 updateCustomerFormMode();
 $('customer-editor').scrollIntoView({behavior:'smooth',block:'start'});
 $('customer-name').focus({preventScroll:true});
}
function deleteCustomer(id){if(confirm('این مشتری از فهرست جدید پنهان شود؟ سوابق فاکتور حفظ می‌شود.'))handle(request('customers/'+id,'DELETE',{}),'مشتری از فهرست پنهان شد')}
function onTypeChanged(){
 const t=state.templates.find(x=>x.shoot_type_id===$('template-type').value);
 $('template-text').value=t?.message_text||'سلام {نام_مشتری} عزیز، به مناسبت {مناسبت} پیشنهاد ویژه‌ای برای شما داریم. {نام_مجموعه}';
 updateSegmentHint();
}
function updateSegmentHint(){
 const s=$('template-text').value;
 // Provisional editor-only count. Server recalculates each personalized message.
 const latin=/^[\x00-\x7F]*$/.test(s),units=s.length,cap=latin?(units<=160?160:153):(units<=70?70:67),sections=units?Math.ceil(units/cap):0;
 $('template-parts').textContent='برآورد قالب: '+fa(sections)+' بخش پیامک — '+fa(units)+' واحد متن. نام واقعی هر مشتری و رمزگذاری دقیق هنگام پیش‌نمایش گروهی محاسبه می‌شود.';
}
function addInvoiceLine(name='',qty=1,price=0){
 const row=document.createElement('div');row.className='rowinput';
 const service=document.createElement('input');service.className='item-service';service.placeholder='عنوان خدمت مثل عکاسی کودک';service.maxLength=200;service.required=true;service.value=name;
 const quantity=document.createElement('input');quantity.type='number';quantity.min=1;quantity.max=10000;quantity.placeholder='تعداد';quantity.required=true;quantity.value=qty;
 const unit=document.createElement('input');unit.type='number';unit.min=0;unit.max=1000000000;unit.placeholder='فی (تومان)';unit.required=true;unit.value=price;
 const remove=document.createElement('button');remove.type='button';remove.textContent='حذف ردیف';remove.onclick=()=>row.remove();
 row.append(service,quantity,unit,remove);$('invoice-lines').append(row);
}
function itemsFromForm(){
 return [...$('invoice-lines').children].map(row=>({description:row.children[0].value,quantity:Number(row.children[1].value),unitPriceToman:Number(row.children[2].value)}));
}
async function printInvoice(id,format){
 const w=window.open('','_blank');
 if(!w){toast('مرورگر پنجره چاپ را مسدود کرده است.',true);return}
 w.opener=null;
 w.document.write('<html lang="fa" dir="rtl"><body>در حال دریافت فاکتور…</body></html>');w.document.close();
 try{
  const html=await request('invoices/'+id+'/print?format='+encodeURIComponent(format));
  w.document.open();w.document.write(html);w.document.close();
 }catch(e){w.document.open();w.document.write('<p>فاکتور باز نشد. این پنجره را ببندید.</p>');w.document.close();toast(e.message,true)}
}
async function showDue(range){
 try{
  const data=await request('due?range='+range);
  $('due-list').replaceChildren();
  data.occasions.forEach(o=>{
   const box=document.createElement('div');box.className='card';
   const strong=document.createElement('strong');strong.textContent=o.customer_name;
   const body=document.createElement('div');body.textContent=(o.title||o.occasion_type)+' · '+fa(o.daysUntil)+' روز دیگر · '+new Intl.DateTimeFormat('fa-IR',{dateStyle:'long',timeZone:'Asia/Tehran'}).format(new Date(o.dueAt+'T12:00:00Z'));
   const note=document.createElement('small');note.textContent='پیامک تبلیغاتی: '+(o.marketing_permission==='opted_in'?'رضایت ثبت شده':'فاقد رضایت');
   box.append(strong,body,note);$('due-list').append(box);
  });
  if(!data.occasions.length)$('due-list').textContent='در این بازه مناسبتی ثبت نشده است.';
 }catch(e){toast(e.message,true)}
}
document.querySelectorAll('nav button[data-view]').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x===b));
 document.querySelectorAll('.view').forEach(x=>x.hidden=x.id!==b.dataset.view);
 if(b.dataset.view==='events')showDue('month');
}));
$('customer-form').addEventListener('submit',async e=>{
 e.preventDefault();
 const savedId=editingCustomerId;
 const existing=savedId?state.customers.find(c=>c.id===savedId):null;
 const data=buildCustomerPayload($('customer-name').value,$('customer-mobile').value,existing);
 const button=$('customer-submit');
 button.disabled=true;
 try{
  const result=await request(savedId?'customers/'+savedId:'customers',savedId?'PUT':'POST',data);
  toast(savedId?'مشخصات مشتری به‌روز شد.':'مشتری ثبت شد.');
  await reload();
  editCustomer(savedId||result.id);
 }catch(error){toast(error.message,true)}
 finally{button.disabled=false}
});
$('customer-cancel').addEventListener('click',resetCustomerForm);
$('search').addEventListener('input',renderCustomers);
$('session-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!editingCustomerId)return;
 if(!$('session-date').value){toast('تاریخ شمسی خدمت را انتخاب کنید.',true);return}
 const button=e.submitter;button.disabled=true;
 try{await request('sessions','POST',{customerId:editingCustomerId,shootTypeId:$('session-type').value,shootDate:$('session-date').value||null,createOccasion:true});toast('خدمت و مناسبت مشتری ثبت شد.');await reload();}
 catch(error){toast(error.message,true)}finally{button.disabled=false}
});
document.querySelectorAll('[data-range]').forEach(b=>b.addEventListener('click',()=>showDue(b.dataset.range)));
$('template-type').addEventListener('change',onTypeChanged);
$('template-text').addEventListener('input',updateSegmentHint);
document.querySelectorAll('[data-insert]').forEach(button=>button.addEventListener('click',()=>{
 const ta=$('template-text'),start=ta.selectionStart,end=ta.selectionEnd,token=button.dataset.insert;
 ta.value=ta.value.slice(0,start)+token+ta.value.slice(end);ta.focus();ta.setSelectionRange(start+token.length,start+token.length);updateSegmentHint();
}));
$('template-save').addEventListener('click',()=>handle(request('templates/'+$('template-type').value,'PUT',{messageText:$('template-text').value,enabled:true}),'قالب پیامک ذخیره شد'));
$('sms-preview').addEventListener('click',async()=>{
 const customerIds=[...$('sms-customers').selectedOptions].map(o=>o.value);
 try{
  const x=await request('sms-preview','POST',{shootTypeId:$('template-type').value,messageText:$('template-text').value,customerIds,occasion:$('template-occasion').value});
  const container=$('sms-results');container.replaceChildren();
  const summary=document.createElement('p');summary.className='summary';summary.textContent='گیرندهٔ معتبر: '+fa(x.validRecipients)+' نفر | مجموع مصرف: '+fa(x.totalSegments)+' بخش | هزینهٔ واقعی: هنوز قابل محاسبه نیست | ارسال غیرفعال';
  container.append(summary);
  for(const r of x.messages){
   const card=document.createElement('div');card.className='card';
   const title=document.createElement('strong');title.textContent=(r.customerName||'مشتری')+' — '+(r.valid?'واجد شرایط':'غیرمجاز');
   const msg=document.createElement('div');msg.textContent=r.text||'';
   const info=document.createElement('small');info.textContent=r.valid?fa(r.segments)+' بخش پیامک':(r.errors||[]).join('؛ ');
   card.append(title,msg,info);container.append(card);
  }
 }catch(e){toast(e.message,true)}
});
$('invoice-add-line').addEventListener('click',()=>addInvoiceLine());
$('invoice-form').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!editingCustomerId)return;
 if(!confirm('فاکتور صادر شود؟ بعد از صدور ریز خدمات ثابت می‌ماند.'))return;
 const button=e.submitter;button.disabled=true;
 try{
  const result=await request('invoices','POST',{customerId:editingCustomerId,items:itemsFromForm(),discountToman:Number($('invoice-discount').value||0),paidToman:Number($('invoice-paid').value||0),businessPhone:$('invoice-business-phone').value,businessAddress:$('invoice-business-address').value,notes:$('invoice-notes').value});
  toast('فاکتور شماره '+fa(result.invoiceNumber)+' صادر شد. اکنون می‌توانید آن را چاپ کنید.');
  await reload();$('invoice-form').reset();$('invoice-lines').replaceChildren();addInvoiceLine();printInvoice(result.id,'a4');
 }catch(e){toast(e.message,true)}finally{button.disabled=false}
});
$('role').textContent=portal==='lab'?'لابراتوار':portal==='photographer'?'عکاس':'';
$('back').href=portal==='lab'?'/lab':portal==='photographer'?'/photographer':'/';
addInvoiceLine();
if(!['lab','photographer'].includes(portal)){toast('از نشانی مخصوص لابراتوار یا عکاس وارد شوید.',true);document.querySelectorAll('button').forEach(b=>b.disabled=true)}
else reload().catch(e=>toast(e.message,true));

// Persian calendar: Saturday first, Tehran dates and Gregorian storage only.
function persianParts(date){return Object.fromEntries(new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(date).filter(p=>['year','month','day'].includes(p.type)).map(p=>[p.type,Number(p.value)]));}
let calendarMonth=new Date();
function renderCalendar(){
 const first=new Date(calendarMonth);first.setUTCDate(first.getUTCDate()+1-persianParts(first).day);
 const head=document.createElement('div');head.className='crmCalendarHead';
 const prev=document.createElement('button'),next=document.createElement('button'),title=document.createElement('b');
 prev.type=next.type='button';prev.textContent='›';next.textContent='‹';
 title.textContent=new Intl.DateTimeFormat('fa-IR',{month:'long',year:'numeric',timeZone:'Asia/Tehran'}).format(first);
 prev.onclick=()=>{calendarMonth=new Date(first.getTime()-86400000);renderCalendar()};
 next.onclick=()=>{calendarMonth=new Date(first.getTime()+32*86400000);calendarMonth.setUTCDate(calendarMonth.getUTCDate()+1-persianParts(calendarMonth).day);renderCalendar()};
 head.append(prev,title,next);const grid=document.createElement('div');grid.className='crmCalendarGrid';
 for(const day of ['ش','ی','د','س','چ','پ','ج']){const el=document.createElement('span');el.textContent=day;grid.append(el)}
 for(let i=0;i<(first.getUTCDay()+1)%7;i++)grid.append(document.createElement('span'));
 for(let i=0;i<32;i++){const date=new Date(first.getTime()+i*86400000);if(persianParts(date).month!==persianParts(first).month)break;const button=document.createElement('button');button.type='button';button.textContent=fa(i+1);const value=date.toISOString().slice(0,10);button.classList.toggle('selected',value===$('session-date').value);button.onclick=()=>{$('session-date').value=value;$('session-date-trigger').textContent=new Intl.DateTimeFormat('fa-IR',{dateStyle:'long',timeZone:'Asia/Tehran'}).format(date);$('session-calendar').hidden=true};grid.append(button)}
 const today=document.createElement('button');today.type='button';today.textContent='امروز';today.onclick=()=>{calendarMonth=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())+'T12:00:00Z');renderCalendar()};
 $('session-calendar').replaceChildren(head,grid,today);
}
$('session-date-trigger').onclick=()=>{calendarMonth=new Date(($('session-date').value||new Date().toISOString().slice(0,10))+'T12:00:00Z');renderCalendar();$('session-calendar').hidden=!$('session-calendar').hidden};
