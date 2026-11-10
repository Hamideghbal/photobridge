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
 $('customer-rows').innerHTML=entries.map(c=>'<tr><td>'+escaped(c.fullName)+'</td><td dir="ltr">'+escaped(c.mobile)+'</td><td>'+(c.marketingPermission==='opted_in'?'موافق':c.marketingPermission==='opted_out'?'انصراف داده':'نامشخص')+'</td><td><button data-edit="'+c.id+'">ویرایش</button> <button data-delete="'+c.id+'">حذف</button></td></tr>').join('')||'<tr><td colspan="4">مشتری ثبت نشده است.</td></tr>';
 document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>editCustomer(b.dataset.edit)));
 document.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteCustomer(b.dataset.delete)));
 for(const s of ['session-customer','event-customer','invoice-customer','sms-customers'])populate($(s),customerOptions());
}
function renderTypes(){
 $('shoot-list').replaceChildren();
 state.shootTypes.forEach(t=>{
  const box=document.createElement('div');box.className='tag';box.textContent=t.name+' ';
  const edit=document.createElement('button');edit.textContent='ویرایش';edit.onclick=()=>{const name=prompt('نام جدید مدل عکاسی',t.name);if(name!==null)handle(request('types/'+t.id,'PUT',{name}),'نام مدل تغییر کرد')};
  const del=document.createElement('button');del.textContent='بایگانی';del.onclick=()=>{if(confirm('این مدل در انتخاب‌های جدید پنهان شود؟ سوابق مشتری حفظ می‌شود.'))handle(request('types/'+t.id,'DELETE',{}),'مدل بایگانی شد')};
  box.append(edit,del);$('shoot-list').append(box);
 });
 for(const key of ['session-type','template-type'])populate($(key),typeOptions());
}
function renderInvoices(){
 $('invoice-rows').innerHTML=state.invoices.map(i=>{
 const id=i.id,cid=i.customer_id,status=i.status;
 return '<tr><td>'+fa(i.invoice_number)+'</td><td>'+escaped(labelCustomer(cid))+'</td><td>'+fa(i.total_toman)+' تومان</td><td>'+fa(i.due_toman)+' تومان</td><td>'+(status==='void'?'باطل‌شده':'صادرشده')+'</td><td>'+ (status==='issued'?'<button data-print="'+id+'" data-format="a4">A4</button> <button data-print="'+id+'" data-format="thermal">حرارتی</button> <button data-void="'+id+'">ابطال</button>':'—')+'</td></tr>';
 }).join('')||'<tr><td colspan="6">هنوز فاکتوری ثبت نشده است.</td></tr>';
 document.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>printInvoice(b.dataset.print,b.dataset.format)));
 document.querySelectorAll('[data-void]').forEach(b=>b.addEventListener('click',()=>{const reason=prompt('علت ابطال فاکتور (در سوابق نگهداری می‌شود)');if(reason?.trim())handle(request('invoices/'+b.dataset.void+'/void','POST',{reason}),'فاکتور با حفظ سابقه باطل شد')}));
}
function renderAll(){renderCustomers();renderTypes();renderInvoices();onTypeChanged()}
let editingCustomerId=null;
function updateCustomerFormMode(){
 const editing=!!editingCustomerId;
 $('customer-form-title').textContent=editing?'ویرایش مشخصات مشتری':'ثبت مشتری جدید';
 $('customer-submit').textContent=editing?'ذخیره تغییرات':'ثبت مشتری';
 $('customer-cancel').hidden=!editing;
}
function resetCustomerForm(){
 editingCustomerId=null;
 $('customer-form').reset();
 updateCustomerFormMode();
}
function buildCustomerPayload(fullName,mobile,consented,previous=null){
 const marketingPermission=consented?'opted_in':previous?.marketingPermission==='opted_out'?'opted_out':'unknown';
 const permissionSource=consented
  ? (previous?.marketingPermission==='opted_in'&&previous.permissionSource
    ? previous.permissionSource
    : 'اعلام رضایت مشتری و ثبت توسط اپراتور')
  : '';
 return {fullName:fullName.trim(),mobile:mobile.trim(),marketingPermission,permissionSource,notes:previous?.notes||''};
}
function editCustomer(id){
 const c=state.customers.find(x=>x.id===id);if(!c)return;
 editingCustomerId=id;
 $('customer-name').value=c.fullName;
 $('customer-mobile').value=c.mobile;
 $('marketing-consent').checked=c.marketingPermission==='opted_in';
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
   const body=document.createElement('div');body.textContent=(o.title||o.occasion_type)+' · '+fa(o.daysUntil)+' روز دیگر · '+o.dueAt;
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
 const data=buildCustomerPayload($('customer-name').value,$('customer-mobile').value,$('marketing-consent').checked,existing);
 const button=$('customer-submit');
 button.disabled=true;
 try{
  await request(savedId?'customers/'+savedId:'customers',savedId?'PUT':'POST',data);
  toast(savedId?'مشخصات مشتری به‌روز شد.':'مشتری ثبت شد.');
  resetCustomerForm();
  await reload();
 }catch(error){toast(error.message,true)}
 finally{button.disabled=false}
});
$('customer-cancel').addEventListener('click',resetCustomerForm);
$('session-date').addEventListener('change',()=>{
 const value=$('session-date').value;
 $('session-date-display').textContent=value?'تاریخ میلادی: '+value:'فرمت میلادی: YYYY-MM-DD';
});
$('search').addEventListener('input',renderCustomers);
$('add-shoot').addEventListener('click',()=>{const name=$('shoot-name').value.trim();if(name)handle(request('types','POST',{name}),'مدل عکاسی اضافه شد')});
$('seed-shoot').addEventListener('click',()=>handle(request('types/seed','POST',{}),'مدل‌های پیشنهادی اضافه شدند'));
$('session-form').addEventListener('submit',e=>{
 e.preventDefault();handle(request('sessions','POST',{customerId:$('session-customer').value,shootTypeId:$('session-type').value,shootDate:$('session-date').value||null}),'نوع عکاسی مشتری ثبت شد');
});
$('event-form').addEventListener('submit',e=>{
 e.preventDefault();handle(request('occasions','POST',{customerId:$('event-customer').value,occasionType:$('event-type').value,title:$('event-title').value,calendarKind:$('event-calendar').value,eventYear:$('event-year').value,eventMonth:$('event-month').value,eventDay:$('event-day').value,repeatsYearly:true}),'مناسبت ثبت شد');
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
 if(!confirm('فاکتور صادر شود؟ بعد از صدور ریز خدمات ثابت می‌ماند.'))return;
 try{
  const result=await request('invoices','POST',{customerId:$('invoice-customer').value,items:itemsFromForm(),discountToman:Number($('invoice-discount').value||0),paidToman:Number($('invoice-paid').value||0),businessPhone:$('invoice-business-phone').value,businessAddress:$('invoice-business-address').value,notes:$('invoice-notes').value});
  toast('فاکتور شماره '+fa(result.invoiceNumber)+' صادر شد. اکنون می‌توانید آن را چاپ کنید.');
  await reload();printInvoice(result.id,'a4');
 }catch(e){toast(e.message,true)}
});
$('role').textContent=portal==='lab'?'لابراتوار':portal==='photographer'?'عکاس':'';
$('back').href=portal==='lab'?'/lab':portal==='photographer'?'/photographer':'/';
addInvoiceLine();
if(!['lab','photographer'].includes(portal)){toast('از نشانی مخصوص لابراتوار یا عکاس وارد شوید.',true);document.querySelectorAll('button').forEach(b=>b.disabled=true)}
else reload().catch(e=>toast(e.message,true));
