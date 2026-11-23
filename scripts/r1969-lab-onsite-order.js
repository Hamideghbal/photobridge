/* R1969 — Lab manager mobile on-site photo intake using the existing delegated order API.
   Unlike the walk-in customer QR link, this creates an actual Lab order and verifies every uploaded original. */
(()=>{
'use strict';
if(window.pb1969OpenLabOnsiteOrder)return;
let shell=null,state=null,submitting=false;
const papers=[['luster','لاستر'],['silk','سیلک'],['metallic','متالیک']];
const make=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!=null)x.textContent=String(txt);return x;};
const digits=value=>String(value||'').replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
const money=value=>new Intl.NumberFormat('fa-IR').format(Number(value)||0)+' تومان';
const messages={
 invalid_delegated_order:'مشتری یا اطلاعات سفارش معتبر نیست.',
 photographer_not_in_lab:'این عکاس در مشتریان لابراتوار نیست.',
 upload_not_configured:'فضای آپلود سفارش روی سرور آماده نیست.',
 invalid_print_size:'سایز چاپ معتبر نیست.',
 print_selection_required:'سایز یا نوع چاپ را انتخاب کنید.',
 files_not_ready:'تمام فایل‌ها هنوز به‌طور کامل ارسال و تأیید نشده‌اند.',
 upload_missing_or_incomplete:'ارسال فایل ناقص است. دوباره تلاش کنید.',
 invalid_file_size:'حجم یکی از فایل‌ها خارج از محدوده مجاز است.',
 print_jpeg_conversion_failed:'تبدیل عکس به فایل آماده چاپ ناموفق بود.',
 stock_unavailable:'موجودی شاسی یا قاب کافی نیست.',
 forbidden:'دسترسی حساب مدیر لابراتوار تأیید نشد.'
};
async function request(url,method='GET',data){
 const r=await fetch(url,{method,credentials:'same-origin',cache:'no-store',headers:data===undefined?{}:{'content-type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 let value={};try{value=await r.json()}catch{}
 if(!r.ok){const code=value.error||String(r.status);const e=new Error(messages[code]||('خطای سرور: '+code));e.status=r.status;throw e}
 return value;
}
function field(parent,name,control){
 const label=make('label','pb1969Field');
 label.append(make('span','',name),control);parent.append(label);return control;
}
function makeField(name,control){const label=make('label','pb1969Field');label.append(make('span','',name),control);return label;}
function option(select,value,title){
 const o=make('option','',title);o.value=value;select.append(o);return o;
}
function close(){
 if(submitting)return;
 if(shell)shell.hidden=true;
}
function notice(value,kind=''){
 if(!state)return;state.message.textContent=value;state.message.className='pb1969Notice '+kind;
}
function quote(){
 if(!state?.bootstrap)return;
 const sizes=new Map(state.bootstrap.printSizes.map(s=>[String(s.id),s]));
 let amount=0;
 for(const item of state.items){
  const price=Number(sizes.get(item.size)?.[item.paper]||0);
  amount+=price*item.copies;
 }
 state.total.textContent=state.items.length?'برآورد چاپ: '+money(amount):'';
}
function addFileRows(files){
 if(!state||state.locked)return;
 const existing=new Set(state.items.map(x=>x.file.name+'|'+x.file.size+'|'+x.file.lastModified));
 for(const file of files){
  if(!(file instanceof File)||file.size<=0)continue;
  const key=file.name+'|'+file.size+'|'+file.lastModified;
  if(existing.has(key))continue;existing.add(key);
  state.items.push({file,id:crypto.randomUUID(),size:'',paper:'luster',copies:1,complete:false});
 }
 drawRows();
}
function drawRows(){
 const holder=state.rows;holder.replaceChildren();
 for(const item of state.items){
  const row=make('section','pb1969FileRow');
  const head=make('div','pb1969FileHead');
  head.append(make('b','',item.file.name),make('small','',new Intl.NumberFormat('fa-IR').format(Math.ceil(item.file.size/1024))+' کیلوبایت'));
  const remove=make('button','pb1969Remove','×');remove.type='button';remove.title='حذف این عکس';remove.disabled=state.locked;
  remove.onclick=()=>{state.items=state.items.filter(x=>x!==item);drawRows()};
  head.append(remove);row.append(head);
  const grid=make('div','pb1969FileControls');
  const sizes=make('select');sizes.required=true;option(sizes,'','سایز چاپ');
  for(const s of state.bootstrap?.printSizes||[])option(sizes,String(s.id),s.label||[s.width_cm,s.height_cm].join('×'));
  sizes.value=item.size;sizes.disabled=state.locked;
  sizes.onchange=()=>{item.size=sizes.value;quote()};
  const paper=make('select');for(const [value,title] of papers)option(paper,value,title);
  paper.value=item.paper;paper.disabled=state.locked;paper.onchange=()=>{item.paper=paper.value;quote()};
  const copies=make('input');copies.type='number';copies.min='1';copies.max='99';copies.step='1';copies.value=String(item.copies);copies.inputMode='numeric';copies.setAttribute('aria-label','تعداد چاپ');copies.disabled=state.locked;
  copies.onchange=()=>{const value=Number(digits(copies.value));item.copies=Number.isInteger(value)&&value>=1&&value<=99?value:0;quote()};
  grid.append(makeField('سایز',sizes),makeField('کاغذ',paper),makeField('تعداد',copies));
  row.append(grid);if(item.complete)row.append(make('small','pb1969FileComplete','✓ فایل کامل دریافت و تأیید شد'));
  holder.append(row);
 }
 state.count.textContent=state.items.length?new Intl.NumberFormat('fa-IR').format(state.items.length)+' عکس انتخاب شده':'هنوز عکسی انتخاب نشده';
 quote();
}
function syncCustomer(){
 const isNew=state.customer.value==='__new__';
 state.newCustomer.hidden=!isNew;
 state.newName.disabled=state.locked||!isNew;
 state.newMobile.disabled=state.locked||!isNew;
}
function lockForm(){
 state.locked=true;
 for(const el of [state.customer,state.newName,state.newMobile,state.pick])el.disabled=true;
 drawRows();
}
function finish(orderNumber){
 state.done=true;
 state.fields.hidden=true;state.actions.hidden=true;
 const done=make('div','pb1969Done');
 done.append(make('h3','','✓ سفارش شماره '+(orderNumber||'')+' ثبت شد'),make('p','','تمام فایل‌ها پیش از ثبت نهایی روی سرور کنترل شده‌اند. سفارش در صف لابراتوار برای دریافت در کامپیوتر اصلی قرار گرفته است.'));
 const back=make('button','pb1969Primary','نمایش سفارش‌ها');back.type='button';back.onclick=()=>location.assign('/lab/orders/flow');
 done.append(back);state.body.append(done);
 notice('تمام مراحل ثبت سفارش حضوری با موفقیت انجام شد.','success');
}
async function upload(entry,index,total){
 if(entry.complete)return;
 notice('در حال دریافت مجوز ارسال عکس '+index+' از '+total+'…','busy');
 const base='/api/lab/delegated-orders/'+encodeURIComponent(state.orderId);
 const presign=await request(base+'/files/presign','POST',{
  clientFileId:entry.id,name:entry.file.name,relativePath:entry.file.name,bytes:entry.file.size,
  contentType:entry.file.type||'application/octet-stream',printSizeId:entry.size,printType:entry.paper,
  printCopies:entry.copies,localOnly:false
 });
 if(presign.storageMode==='device-local')throw Error('فایل موبایل نباید در حالت هارد محلی ثبت شود.');
 if(presign.state!=='active'){
  if(!presign.uploadUrl)throw Error('آدرس ارسال فایل صادر نشد.');
  const target=new URL(presign.uploadUrl,location.origin);
  if(target.protocol!=='https:'&&target.origin!==location.origin)throw Error('آدرس ارسال فایل امن نیست.');
  notice('در حال ارسال عکس '+index+' از '+total+'…','busy');
  const transfer=await fetch(target.href,{method:'PUT',body:entry.file,
   credentials:target.origin===location.origin?'same-origin':'omit',
   headers:{'Content-Type':entry.file.type||'application/octet-stream'}});
  if(!transfer.ok)throw Error('آپلود عکس '+index+' کامل نشد ('+transfer.status+').');
  notice('در حال تأیید کامل بودن عکس '+index+' از '+total+'…','busy');
  await request('/api/lab/delegated-files/complete','POST',{fileId:presign.fileId});
 }
 entry.complete=true;drawRows();
}
async function submit(){
 if(submitting||!state?.bootstrap||state.done)return;
 const newCustomer=state.customer.value==='__new__';
 if(!state.customer.value){notice('ابتدا عکاس یا مشتری را مشخص کنید.','error');return}
 const name=state.newName.value.trim(),mobile=digits(state.newMobile.value).replace(/\D/g,'');
 if(newCustomer&&(!name||!/^09\d{9}$/.test(mobile))){notice('برای مشتری جدید، نام و شماره موبایل ۱۱ رقمی معتبر لازم است.','error');return}
 if(!state.items.length){notice('حداقل یک عکس انتخاب کنید.','error');return}
 if(state.items.some(item=>!item.size||!papers.some(p=>p[0]===item.paper)||!Number.isInteger(item.copies)||item.copies<1||item.copies>99)){
  notice('برای همه عکس‌ها سایز، کاغذ و تعداد معتبر انتخاب کنید.','error');return;
 }
 submitting=true;state.submit.disabled=true;state.close.disabled=true;
 try{
  if(!state.orderId){
   notice('در حال ثبت اولیه سفارش در لابراتوار…','busy');
   const body={clientOrderId:state.clientOrderId,localOnly:false,mode:'print',delivery:'pickup',priority:'normal'};
   if(newCustomer){body.studioName=name;body.mobile=mobile}else body.customerId=state.customer.value;
   const result=await request('/api/lab/delegated-orders','POST',body);
   if(!result.orderId)throw Error('شماره سفارش از سرور دریافت نشد.');
   state.orderId=result.orderId;state.orderNumber=result.orderNumber||'';
   lockForm();
  }
  for(let i=0;i<state.items.length;i++)await upload(state.items[i],i+1,state.items.length);
  notice('در حال تأیید نهایی سفارش حضوری…','busy');
  const result=await request('/api/lab/delegated-orders/'+encodeURIComponent(state.orderId)+'/submit','POST',{sendInvoiceSms:false});
  if(!result.order&&!result.ok&&!result.submitted&&!result.replay)throw Error('تأیید ثبت نهایی سفارش دریافت نشد.');
  finish(state.orderNumber);
 }catch(error){
  notice((error.message||'ثبت سفارش انجام نشد.')+' برای ادامه، «تلاش دوباره» را بزنید؛ عکس‌های تأییدشده دوباره ارسال نمی‌شوند.','error');
  state.submit.textContent='تلاش دوباره';
 }finally{submitting=false;state.close.disabled=false;if(!state.done)state.submit.disabled=false;}
}
async function bootstrap(){
 try{
  const data=await request('/api/lab/delegated-orders/bootstrap?mode=print&fresh='+Date.now());
  if(!Array.isArray(data.customers)||!Array.isArray(data.printSizes))throw Error('تعرفه‌ها یا فهرست مشتریان آماده نیست.');
  state.bootstrap=data;state.customer.replaceChildren();option(state.customer,'','انتخاب عکاس / مشتری');
  for(const c of data.customers)option(state.customer,String(c.id),[c.name,c.mobile].filter(Boolean).join(' · '));
  option(state.customer,'__new__','＋ مشتری جدید');
  state.customer.disabled=false;state.pick.disabled=false;state.submit.disabled=false;
  state.loading.hidden=true;state.fields.hidden=false;state.actions.hidden=false;notice('');
 }catch(error){state.loading.textContent=error.message||'دریافت اطلاعات لابراتوار ناموفق بود.';notice('برای راه‌اندازی فرم، اطلاعات لابراتوار باید از سرور دریافت شوند.','error')}
}
function open(){
 if(!/^\/lab(?:\/|$)/.test(location.pathname)){alert('سفارش حضوری فقط در حساب لابراتوار قابل ثبت است.');return}
 if(shell){shell.hidden=false;state.close.focus({preventScroll:true});return}
 shell=make('div','pb1969Backdrop');shell.setAttribute('role','presentation');
 const dialog=make('section','pb1969Dialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','ثبت سفارش حضوری لابراتوار');
 const head=make('header','pb1969Header');
 const heading=make('div');heading.append(make('h2','','ثبت سفارش حضوری'),make('small','','ثبت سفارش واقعی در صف لابراتوار، بدون لینک QR مشتری آزاد'));
 const closeButton=make('button','pb1969Close','×');closeButton.type='button';closeButton.setAttribute('aria-label','بستن');
 head.append(heading,closeButton);dialog.append(head);
 const body=make('div','pb1969Body');
 const loading=make('p','pb1969Loading','در حال آماده‌سازی مشتریان و تعرفه‌های لابراتوار…');body.append(loading);
 const fields=make('div','pb1969Fields');fields.hidden=true;body.append(fields);
 const customer=field(fields,'عکاس / مشتری',make('select'));customer.disabled=true;
 const newCustomer=make('div','pb1969NewCustomer');newCustomer.hidden=true;fields.append(newCustomer);
 const newName=field(newCustomer,'نام مشتری جدید',make('input'));newName.maxLength=140;
 const newMobile=field(newCustomer,'شماره موبایل',make('input'));newMobile.inputMode='tel';newMobile.placeholder='09xxxxxxxxx';newMobile.maxLength=15;
 customer.onchange=()=>syncCustomer();
 const pick=field(fields,'افزودن عکس‌های سفارش',make('input'));pick.type='file';pick.multiple=true;pick.accept='image/*,.jpg,.jpeg,.png,.heic,.heif,.tif,.tiff';pick.disabled=true;
 const count=make('small','pb1969Count','هنوز عکسی انتخاب نشده');fields.append(count);
 const rows=make('div','pb1969Rows');fields.append(rows);
 const total=make('b','pb1969Estimate','');fields.append(total);
 fields.append(make('p','pb1969Hint','سایز، نوع کاغذ و تعداد هر عکس را تعیین کنید. برآورد صرفاً چاپ است؛ فاکتور قطعی طبق روال لابراتوار صادر می‌شود.'));
 const msg=make('p','pb1969Notice');msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');body.append(msg);
 const actions=make('div','pb1969Actions');actions.hidden=true;
 const cancel=make('button','pb1969Secondary','انصراف');cancel.type='button';cancel.onclick=close;
 const submitButton=make('button','pb1969Primary','ثبت و ارسال سفارش حضوری');submitButton.type='button';submitButton.disabled=true;submitButton.onclick=submit;
 actions.append(cancel,submitButton);body.append(actions);
 dialog.append(body);shell.append(dialog);document.body.append(shell);
 state={body,fields,loading,customer,newCustomer,newName,newMobile,pick,count,rows,total,message:msg,close:closeButton,actions,submit:submitButton,
  clientOrderId:crypto.randomUUID(),bootstrap:null,orderId:null,orderNumber:'',items:[],locked:false,done:false};
 closeButton.onclick=close;pick.onchange=()=>{addFileRows(Array.from(pick.files||[]));pick.value=''};
 shell.addEventListener('mousedown',e=>{if(e.target===shell)close()});
 closeButton.focus({preventScroll:true});void bootstrap();
}
window.pb1969OpenLabOnsiteOrder=open;
})();