/* Laboratory intake: original photos stay in the selected local directory. */
(()=>{
'use strict';
if(window.pb1137LocalIntake)return;window.pb1137LocalIntake=true;
let active=null;
const q=(s,r=document)=>r.querySelector(s);
function node(tag,text,cls){const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}
async function api(url,body,device){const r=await fetch(url,{method:body?'POST':'GET',credentials:'same-origin',headers:{'Content-Type':'application/json',...(device?{'x-photobridge-device-id':device,'x-photobridge-desktop-local-file':'1'}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Error(data.message||({files_not_ready:'فایل‌ها هنوز آماده نیستند.',print_selection_required:'سایز و نوع چاپ را انتخاب کن.',invalid_delegated_order:'اطلاعات مشتری کامل نیست.',desktop_local_file_required:'این نسخهٔ اپلیکیشن ذخیرهٔ محلی سفارش جدید را پشتیبانی نمی‌کند؛ از Chrome یا Edge ویندوز استفاده کن.',stock_unavailable:'موجودی شاسی یا قاب کافی نیست.'}[data.error])||'ثبت سفارش انجام نشد. دوباره تلاش کن.');return data;}
function field(parent,label,input){const wrapper=node('label');wrapper.append(node('span',label),input);parent.append(wrapper);return input;}
function select(options){const el=node('select');for(const [value,label] of options){const o=node('option',label);o.value=value;el.append(o);}return el;}
async function open(){
 if(active)return;
 const modal=node('dialog',null,'pb1137Intake');modal.setAttribute('dir','rtl');modal.setAttribute('aria-label','ثبت سفارش عکس حضوری');active=modal;
 const head=node('header');head.append(node('h2','ثبت سفارش عکس حضوری'));const close=node('button','بستن');close.type='button';head.append(close);modal.append(head);
 const message=node('p','عکس‌ها در پوشه‌ای که روی این کامپیوتر انتخاب می‌کنی ذخیره می‌شوند. سفارش و فاکتور با روال معمول لابراتوار ثبت می‌شوند.');modal.append(message);
 const form=node('form');form.method='dialog';modal.append(form);
 const error=node('p',null,'pb1137Error');error.setAttribute('role','status');form.append(error);
 const closeModal=()=>{modal.close();modal.remove();active=null;};close.onclick=closeModal;modal.addEventListener('cancel',e=>{if(form.dataset.busy){e.preventDefault();return;}active=null;modal.remove();});document.body.append(modal);modal.showModal();
 if(location.hostname==='127.0.0.1'||typeof showDirectoryPicker!=='function'){error.textContent='ذخیرهٔ مستقیم روی هارد در این محیط فعال نیست. این بخش را در Chrome یا Edge کامپیوتر باز کن.';return;}
 let bootstrap;try{bootstrap=await api('/api/lab/delegated-orders/bootstrap');}catch(e){error.textContent=e.message;return;}
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
 const folderButton=node('button','انتخاب پوشهٔ ذخیره روی هارد');folderButton.type='button';form.append(folderButton);let directory;
 folderButton.onclick=async()=>{try{directory=await showDirectoryPicker({mode:'readwrite'});folderButton.textContent='پوشهٔ انتخاب‌شده: '+directory.name;error.textContent='';}catch(e){if(e.name!=='AbortError')error.textContent='دسترسی به پوشه داده نشد.';}};
 const fileInput=node('input');fileInput.type='file';fileInput.accept='image/jpeg,image/png,image/tiff,image/webp';fileInput.multiple=true;field(form,'انتخاب عکس‌ها',fileInput);
 const list=node('div',null,'pb1137Files');form.append(list);let entries=[],order=null,submitting=false,locked=false;
 fileInput.onchange=()=>{entries=[...fileInput.files].map(file=>({file,id:crypto.randomUUID(),size:defaultSize.value,paper:defaultPaper.value}));list.replaceChildren();for(const item of entries){const row=node('div',null,'pb1137File');row.append(node('b',item.file.name));const size=select([['','سایز چاپ'],...sizes]);size.value=item.size;size.onchange=()=>item.size=size.value;const paper=select([['luster','لاستر'],['silk','سیلک'],['metallic','متالیک']]);paper.value=item.paper;paper.onchange=()=>item.paper=paper.value;row.append(size,paper);list.append(row);}};
 const submit=node('button','ثبت سفارش و صدور فاکتور', 'pb1137Submit');submit.type='submit';form.append(submit);
 const clientOrderId=crypto.randomUUID(),device='pbwin-'+crypto.randomUUID();
 function busy(value){submitting=value;form.dataset.busy=value?'1':'';for(const control of modal.querySelectorAll('button,input,select'))control.disabled=value||locked&&control!==submit&&control!==close;}
 form.onsubmit=async e=>{
  e.preventDefault();if(submitting)return;
  if(!directory){error.textContent='ابتدا پوشهٔ ذخیره روی هارد را انتخاب کن.';return;}
  if(!customers.value||customers.value==='new'&&(!name.value.trim()||!/^09\d{9}$/.test(mobile.value.trim()))){error.textContent='مشتری و شماره موبایل معتبر را مشخص کن.';return;}
  if(!entries.length||entries.some(x=>!x.size||x.file.size<=0)){error.textContent='عکس‌ها و سایز چاپ هر عکس را مشخص کن.';return;}
  busy(true);error.textContent='در حال ذخیره روی هارد و ثبت سفارش…';
  try{
   // Copy all originals before any order can enter the production flow.
   const local=await directory.getDirectoryHandle('PhotoBridge-'+clientOrderId,{create:true});
   for(const item of entries){if(item.saved)continue;const handle=await local.getFileHandle(item.id+'-'+item.file.name.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_'),{create:true});const writer=await handle.createWritable();try{await writer.write(item.file);await writer.close();}catch(e){await writer.abort().catch(()=>{});throw e;}const saved=await handle.getFile();if(saved.size!==item.file.size)throw Error('ذخیرهٔ کامل عکس روی هارد تأیید نشد.');item.saved=true;item.localName=handle.name;}
   locked=true;
   if(!order)order=await api('/api/lab/delegated-orders',{clientOrderId,mode:'print',delivery:delivery.value,priority:priority.value,...(customers.value==='new'?{studioName:name.value.trim(),mobile:mobile.value.trim()}:{customerId:customers.value})},device);
   for(const item of entries){if(item.registered)continue;const result=await api('/api/lab/delegated-orders/'+order.orderId+'/files/presign',{clientFileId:item.id,name:item.file.name,relativePath:item.file.name,bytes:item.file.size,contentType:item.file.type,printSizeId:item.size,printType:item.paper,localOnly:true},device);if(result.storageMode!=='device-local'||result.uploadUrl)throw Error('سفارش محلی تأیید نشد؛ هیچ عکسی به سرور ارسال نشد.');item.registered=true;}
   const manifest=await local.getFileHandle('order.json',{create:true});const manifestWriter=await manifest.createWritable();await manifestWriter.write(JSON.stringify({orderId:order.orderId,orderNumber:order.orderNumber,files:entries.map(x=>({id:x.id,name:x.file.name,localName:x.localName,bytes:x.file.size,printSizeId:x.size,printType:x.paper}))},null,2));await manifestWriter.close();
   const result=await api('/api/lab/delegated-orders/'+order.orderId+'/submit',{},device);
   form.replaceChildren(node('h3','سفارش شمارهٔ '+order.orderNumber+' ثبت شد.'),node('p',result.invoice?'فاکتور صادر شد. عکس‌ها روی هارد این کامپیوتر ذخیره شدند.':'عکس‌ها روی هارد ذخیره شدند. برای صدور فاکتور، تعرفه‌های ناقص سفارش را تکمیل کن.'));
   const done=node('button','نمایش سفارش');done.type='button';done.onclick=()=>{closeModal();location.assign('/lab/orders');};form.append(done);close.disabled=false;
  }catch(e){busy(false);error.textContent=e.name==='NotAllowedError'?'اجازهٔ ذخیره روی هارد داده نشد؛ سفارش ارسال نشد.':e.message;}
 };
}
function mount(){
 const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain');
 const old=document.getElementById('pb1137LocalIntakeButton');
 if(!/^\/lab(?:\/|$)/.test(location.pathname)||!host){old?.remove();return;}
 const target=host.querySelector('.ordersWorkspace');if(!target){old?.remove();return;}
 if(old){if(old.parentElement!==target)target.prepend(old);return;}const button=node('button','ثبت سفارش عکس حضوری','pb1137Launch');button.id='pb1137LocalIntakeButton';button.type='button';button.onclick=open;
 target.prepend(button);
}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount();});}
function boot(){mount();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener('popstate',schedule);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
