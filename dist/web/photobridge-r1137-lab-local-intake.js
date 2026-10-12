/* Laboratory intake: original photos stay in the selected local directory. */
(()=>{
'use strict';
if(window.pb1137LocalIntake)return;window.pb1137LocalIntake=true;
let active=null;
const q=(s,r=document)=>r.querySelector(s);
function node(tag,text,cls){const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}
const storage=()=>window.pbLabLocalIntakeStorage;
const errors={download_device_not_registered:'کامپیوتر اصلی لابراتوار هنوز مشخص نشده است.',not_primary_download_device:'ثبت حضوری فقط روی کامپیوتر اصلی ذخیرهٔ فایل‌های لابراتوار انجام می‌شود.',files_not_ready:'فایل‌ها هنوز آماده نیستند.',print_selection_required:'سایز و نوع چاپ را انتخاب کن.',invalid_delegated_order:'اطلاعات مشتری کامل نیست.',stock_unavailable:'موجودی شاسی یا قاب کافی نیست.'};
async function api(url,body){try{return await storage().request(url,{...(body?{method:'POST',body:JSON.stringify(body)}:{})});}catch(e){throw Error(e.data?.message||errors[e.data?.error||e.message]||'ثبت سفارش انجام نشد. دوباره تلاش کن.');}}

function field(parent,label,input){const wrapper=node('label');wrapper.append(node('span',label),input);parent.append(wrapper);return input;}
function select(options){const el=node('select');for(const [value,label] of options){const o=node('option',label);o.value=value;el.append(o);}return el;}
async function open(){
 if(active)return;
 const modal=node('dialog',null,'pb1137Intake');modal.setAttribute('dir','rtl');modal.setAttribute('aria-label','ثبت سفارش عکس حضوری');active=modal;
 const head=node('header');head.append(node('h2','ثبت سفارش عکس حضوری'));const close=node('button','بستن');close.type='button';head.append(close);modal.append(head);
 const previews=[];
 const message=node('p','عکس‌ها در مسیر همیشگی کامپیوتر اصلی لابراتوار ذخیره می‌شوند. سایز و کاغذ هر عکس را انتخاب کن و سفارش را ثبت کن.');modal.append(message);
 const form=node('form');form.method='dialog';modal.append(form);
 const error=node('p',null,'pb1137Error');error.setAttribute('role','status');form.append(error);
 const closeModal=()=>{previews.forEach(url=>URL.revokeObjectURL(url));modal.close();modal.remove();active=null;};close.onclick=closeModal;modal.addEventListener('cancel',e=>{if(form.dataset.busy){e.preventDefault();return;}previews.forEach(url=>URL.revokeObjectURL(url));active=null;modal.remove();});document.body.append(modal);modal.showModal();
 const provider=storage();let directory,bootstrap;
 try{
  const primary=await api('/api/lab/download-device');
  if(!primary.registered||!primary.isThisDevice)throw Error(primary.registered?errors.not_primary_download_device:errors.download_device_not_registered);
  directory=await provider.root();
  if(!directory)throw Error('مسیر همیشگی ذخیره هنوز تنظیم نشده است. آن را در تنظیمات «ذخیره روی هارد» لابراتوار مشخص کن.');
  bootstrap=await api('/api/lab/delegated-orders/bootstrap');
 }catch(e){error.textContent=e.message;return;}
 if(active!==modal)return;
 form.append(node('div','ذخیرهٔ خودکار در مسیر اصلی لابراتوار: '+directory.name,'pb1138SavePath'));
 const settings=node('div',null,'pb1137Settings');form.append(settings);
 const customers=field(settings,'عکاس / مشتری',select([['','انتخاب کن'],...(bootstrap.customers||[]).map(c=>[c.id,`${c.name} · ${c.mobile}`]),['new','مشتری جدید']]));customers.required=true;
 const newFields=node('div',null,'pb1137Settings');newFields.hidden=true;form.append(newFields);
 const name=field(newFields,'نام مشتری / عکاسی',node('input'));name.maxLength=140;
 const mobile=field(newFields,'شماره موبایل',node('input'));mobile.inputMode='tel';mobile.dir='ltr';mobile.placeholder='09xxxxxxxxx';
 customers.onchange=()=>{newFields.hidden=customers.value!=='new';};
 const sizes=(bootstrap.printSizes||[]).map(s=>[s.id,s.label]);
 const defaultSize=field(settings,'سایز پیش‌فرض چاپ',select([['','انتخاب سایز'],...sizes]));
 const defaultPaper=field(settings,'نوع کاغذ پیش‌فرض',select([['luster','لاستر'],['silk','سیلک'],['metallic','متالیک']]));
 const delivery=field(settings,'تحویل سفارش',select([['pickup','حضوری'],['courier','ارسال']]));
 const priority=field(settings,'اولویت',select([['normal','عادی'],['urgent','فوری'],['very_urgent','بسیار فوری']]));
 const fileInput=node('input');fileInput.type='file';fileInput.accept='image/jpeg,image/png,image/tiff,image/webp';fileInput.multiple=true;field(form,'انتخاب عکس‌ها',fileInput);
 const list=node('div',null,'pb1137Files');form.append(list);let entries=[],order=null,submitting=false,locked=false,startedAt=null;
 fileInput.onchange=()=>{previews.splice(0).forEach(url=>URL.revokeObjectURL(url));entries=[...fileInput.files].map(file=>({file,id:crypto.randomUUID(),size:defaultSize.value,paper:defaultPaper.value}));list.replaceChildren();for(const item of entries){const row=node('div',null,'pb1137File');const preview=URL.createObjectURL(item.file);previews.push(preview);const photo=node('img');photo.src=preview;photo.alt=item.file.name;row.append(photo,node('b',item.file.name));const size=select([['','سایز چاپ'],...sizes]);size.value=item.size;size.onchange=()=>item.size=size.value;const paper=select([['luster','لاستر'],['silk','سیلک'],['metallic','متالیک']]);paper.value=item.paper;paper.onchange=()=>item.paper=paper.value;row.append(size,paper);list.append(row);}};
 const submit=node('button','ثبت سفارش و صدور فاکتور', 'pb1137Submit');submit.type='submit';form.append(submit);
 const clientOrderId=crypto.randomUUID();
 function busy(value){submitting=value;form.dataset.busy=value?'1':'';for(const control of modal.querySelectorAll('button,input,select'))control.disabled=value||locked&&control!==submit&&control!==close;}
 form.onsubmit=async e=>{
  e.preventDefault();if(submitting)return;
  if(!customers.value||customers.value==='new'&&(!name.value.trim()||!/^09\d{9}$/.test(mobile.value.trim()))){error.textContent='مشتری و شماره موبایل معتبر را مشخص کن.';return;}
  if(!entries.length||entries.some(x=>!x.size||x.file.size<=0)){error.textContent='عکس‌ها و سایز چاپ هر عکس را مشخص کن.';return;}
  busy(true);error.textContent='در حال ذخیره روی هارد و ثبت سفارش…';
  try{
   if(!await provider.permission(directory))throw Error('اجازهٔ نوشتن در مسیر همیشگی داده نشد؛ سفارش ارسال نشد.');
   // Reserve the existing draft first so the normal folders include the real order number.
   locked=true;startedAt ||= new Date().toISOString();
   if(!order)order=await api('/api/lab/delegated-orders',{clientOrderId,localOnly:true,mode:'print',delivery:delivery.value,priority:priority.value,...(customers.value==='new'?{studioName:name.value.trim(),mobile:mobile.value.trim()}:{customerId:customers.value})});
   for(const item of entries){if(item.registered)continue;const result=await api('/api/lab/delegated-orders/'+order.orderId+'/files/presign',{clientFileId:item.id,name:item.file.name,relativePath:item.file.name,bytes:item.file.size,contentType:item.file.type,printSizeId:item.size,printType:item.paper,localOnly:true});if(result.storageMode!=='device-local'||result.uploadUrl)throw Error('سفارش محلی تأیید نشد؛ هیچ عکسی به سرور ارسال نشد.');item.registered=true;item.fileId=result.fileId;}
   const detail=await api('/api/lab/orders/'+order.orderId);
   detail.order._local_download_started_at=startedAt;
   const targets=[],names=new Set();
   for(const item of entries){const file=detail.files.find(f=>f.id===item.fileId);if(!file)throw Error('اطلاعات عکس در سفارش پیدا نشد.');const target=await provider.target(directory,detail,file);const key=target.dir.name+'/'+provider.fileName(file.original_name,'file');if(names.has(key))throw Error('نام دو عکس در مسیر چاپ یکسان است. نام فایل‌ها را متفاوت انتخاب کن.');names.add(key);targets.push({item,file,target});}
   for(const {item,file,target} of targets){if(item.saved)continue;const saved=await provider.write(target.dir,file.original_name,item.file);item.saved=true;item.localName=saved.name;}
   provider.saveResume(order.orderId,{startedAt,done:entries.length,total:entries.length,loadedBytes:entries.reduce((n,x)=>n+x.file.size,0),totalBytes:entries.reduce((n,x)=>n+x.file.size,0),completedIds:entries.map(x=>x.fileId),remaining:0,lastError:null,localComplete:true});
   const result=await api('/api/lab/delegated-orders/'+order.orderId+'/submit',{});
   form.replaceChildren(node('h3','سفارش شمارهٔ '+order.orderNumber+' ثبت شد.'),node('p',result.invoice?'فاکتور صادر شد. عکس‌ها روی هارد این کامپیوتر ذخیره شدند.':'عکس‌ها روی هارد ذخیره شدند. برای صدور فاکتور، تعرفه‌های ناقص سفارش را تکمیل کن.'));
   const done=node('button','نمایش سفارش');done.type='button';done.onclick=()=>{closeModal();location.assign('/lab/orders');};form.append(done);close.disabled=false;form.dataset.busy='';submitting=false;
  }catch(e){busy(false);error.textContent=e.name==='NotAllowedError'?'اجازهٔ ذخیره روی هارد داده نشد؛ سفارش ارسال نشد.':e.message;}
 };
}
function mount(){
 const provider=storage();
 const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain');
 const old=document.getElementById('pb1137LocalIntakeButton');
 if(!/^\/lab(?:\/|$)/.test(location.pathname)||!host||!provider||!provider.deviceId()){old?.remove();return;}
 if(primaryState===null){checkPrimary();return;}if(!primaryState){old?.remove();return;}
 const target=host.querySelector('.ordersWorkspace');if(!target){old?.remove();return;}
 if(old){if(old.parentElement!==target)target.prepend(old);return;}const button=node('button','ثبت سفارش عکس حضوری','pb1137Launch');button.id='pb1137LocalIntakeButton';button.type='button';button.onclick=open;
 target.prepend(button);
}
let primaryState=null,checking=false;
async function checkPrimary(){if(checking)return;checking=true;try{const state=await api('/api/lab/download-device');primaryState=state.registered&&state.isThisDevice;}catch{primaryState=false;}finally{checking=false;schedule();}}
window.addEventListener('photobridge-auth-session-changed',()=>{primaryState=null;schedule();});
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount();});}
function boot(){mount();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener('popstate',schedule);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
