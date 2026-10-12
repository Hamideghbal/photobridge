/* Laboratory intake: original photos stay in the selected local directory. */
(()=>{
'use strict';
if(window.pb1137LocalIntake)return;window.pb1137LocalIntake=true;
let active=null,opening=false;
const q=(s,r=document)=>r.querySelector(s);
function node(tag,text,cls){const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}
const storage=()=>window.pbLabLocalIntakeStorage;
const errors={download_device_not_registered:'کامپیوتر اصلی لابراتوار هنوز مشخص نشده است.',not_primary_download_device:'ثبت حضوری فقط روی کامپیوتر اصلی ذخیرهٔ فایل‌های لابراتوار انجام می‌شود.',files_not_ready:'فایل‌ها هنوز آماده نیستند.',print_selection_required:'سایز و نوع چاپ را انتخاب کن.',invalid_delegated_order:'اطلاعات مشتری کامل نیست.',stock_unavailable:'موجودی شاسی یا قاب کافی نیست.'};
async function api(url,body){try{return await storage().request(url,{...(body?{method:'POST',body:JSON.stringify(body)}:{})});}catch(e){throw Error(e.data?.message||errors[e.data?.error||e.message]||'ثبت سفارش انجام نشد. دوباره تلاش کن.');}}

function field(parent,label,input){if(['INPUT','SELECT','TEXTAREA'].includes(input.tagName))input.setAttribute('aria-label',label);const wrapper=node('label');wrapper.append(node('span',label),input);parent.append(wrapper);return input;}
function select(options){const el=node('select');for(const [value,label] of options){const o=node('option',label);o.value=value;el.append(o);}return el;}
function customerMenu(parent,options,onChange){
 const wrapper=node('div',null,'pb1139Customer');wrapper.append(node('span','عکاس / مشتری'));
 const button=node('button','انتخاب عکاس ▾');button.type='button';button.setAttribute('aria-label','عکاس / مشتری');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
 const menu=node('div',null,'pb1139PickerMenu');menu.hidden=true;
 const search=node('input');search.type='search';search.placeholder='جستجوی نام یا موبایل';search.setAttribute('aria-label','جستجوی عکاس');search.autocomplete='off';
 const list=node('div',null,'pb1139PickerOptions');list.setAttribute('role','listbox');list.setAttribute('aria-label','انتخاب عکاس');menu.append(search,list);wrapper.append(button,menu);parent.append(wrapper);
 const model={value:'',button};
 const normalize=text=>String(text||'').replace(/[۰-۹]/g,x=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[٠-٩]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(x))).toLocaleLowerCase('fa-IR');
 function render(){list.replaceChildren();const term=normalize(search.value.trim());for(const [value,label]of options){if(value!=='new'&&term&&!normalize(label).includes(term))continue;const option=node('button',label);option.type='button';option.setAttribute('role','option');option.setAttribute('aria-selected',String(model.value===value));option.onclick=()=>{model.value=value;button.textContent=label+' ▾';menu.hidden=true;button.setAttribute('aria-expanded','false');onChange(value);};list.append(option);}if(!list.children.length)list.append(node('p','عکاسی پیدا نشد.'));}
 button.onclick=()=>{menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)render();};search.oninput=render;
 search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();list.querySelector('[role=option]')?.click();}});
 wrapper.addEventListener('keydown',e=>{if(!menu.hidden&&(e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();const options=[...list.querySelectorAll('[role=option]')];const index=options.indexOf(document.activeElement);const current=index<0?(e.key==='ArrowDown'?-1:0):index;options[(current+(e.key==='ArrowDown'?1:-1)+options.length)%options.length]?.focus();}if(e.key==='Escape'&&!menu.hidden){e.preventDefault();e.stopPropagation();menu.hidden=true;button.setAttribute('aria-expanded','false');button.focus();}});
 parent.closest('dialog').addEventListener('click',e=>{if(!wrapper.contains(e.target)){menu.hidden=true;button.setAttribute('aria-expanded','false');}});
 return model;
}
async function open(){
 if(active||opening)return;
 opening=true;
 const launch=document.getElementById('pb1137LocalIntakeButton');if(launch){launch.disabled=true;launch.textContent='در حال آماده‌سازی…';}
 const provider=storage();let directory,bootstrap,loadError;
 try{
  const [primary,root,data]=await Promise.all([api('/api/lab/download-device'),provider.root(),api('/api/lab/delegated-orders/bootstrap')]);
  if(!primary.registered||!primary.isThisDevice)throw Error(primary.registered?errors.not_primary_download_device:errors.download_device_not_registered);
  if(!root)throw Error('مسیر همیشگی ذخیره هنوز تنظیم نشده است. آن را در تنظیمات «ذخیره روی هارد» لابراتوار مشخص کن.');
  directory=root;bootstrap=data;
 }catch(e){loadError=e;}
 finally{opening=false;if(launch){launch.disabled=false;launch.textContent='ثبت سفارش عکس حضوری';}}
 const modal=node('dialog',null,'pb1137Intake');modal.setAttribute('dir','rtl');modal.setAttribute('aria-label','ثبت سفارش عکس حضوری');active=modal;
 const head=node('header');head.append(node('h2','ثبت سفارش عکس حضوری'));const close=node('button','بستن');close.type='button';head.append(close);modal.append(head);
 const previews=[];
 const message=node('p','عکس‌ها روی هارد اصلی ذخیره می‌شوند.');modal.append(message);
 const form=node('form');form.method='dialog';modal.append(form);
 const error=node('p',null,'pb1137Error');error.setAttribute('role','status');form.append(error);
 const closeModal=()=>{previews.forEach(url=>URL.revokeObjectURL(url));modal.close();modal.remove();active=null;};close.onclick=closeModal;modal.addEventListener('cancel',e=>{if(form.dataset.busy){e.preventDefault();return;}previews.forEach(url=>URL.revokeObjectURL(url));active=null;modal.remove();});document.body.append(modal);
 if(loadError){error.textContent=loadError.message;modal.showModal();return;}
 const settings=node('div',null,'pb1137Settings pb1139EntryRow');form.append(settings);
 const newFields=node('div',null,'pb1137Settings');newFields.hidden=true;form.append(newFields);
 const customers=customerMenu(settings,[...(bootstrap.customers||[]).map(c=>[c.id,`${c.name} · ${c.mobile}`]),['new','مشتری جدید']],value=>{newFields.hidden=value!=='new';});
 const name=field(newFields,'نام مشتری / عکاسی',node('input'));name.maxLength=140;
 const mobile=field(newFields,'شماره موبایل',node('input'));mobile.inputMode='tel';mobile.dir='ltr';mobile.placeholder='09xxxxxxxxx';
 const sizes=(bootstrap.printSizes||[]).map(s=>[s.id,s.label]);
 const defaultSize=field(settings,'سایز چاپ',select([['','انتخاب سایز'],...sizes]));
 const paperOptions=[['luster','لاستر'],['silk','سیلک'],['metallic','متالیک']];
 const defaultPaper=field(settings,'کاغذ',select(paperOptions));
 const fileInput=node('input');fileInput.type='file';fileInput.accept='image/jpeg,image/png,image/tiff,image/webp';fileInput.multiple=true;fileInput.hidden=true;form.append(fileInput);
 const choose=node('button','انتخاب عکس‌ها');choose.type='button';choose.setAttribute('aria-label','انتخاب عکس‌ها');field(settings,'عکس‌ها',choose);choose.onclick=()=>fileInput.click();
 const add=node('button','＋ افزودن','pb1139Add');add.type='button';add.setAttribute('aria-label','افزودن گروه عکس');field(settings,' ',add);
 const list=node('div',null,'pb1137Files pb1139Groups');form.append(list);
 const empty=node('p','سایز و کاغذ را انتخاب کن، عکس‌ها را اضافه کن و برای سایز بعدی همین کار را تکرار کن.','pb1139Empty');list.append(empty);
 let entries=[],groups=[],pendingFiles=[],order=null,submitting=false,locked=false,startedAt=null;
 fileInput.onchange=()=>{pendingFiles=[...fileInput.files];choose.textContent=pendingFiles.length?`${pendingFiles.length.toLocaleString('fa-IR')} عکس انتخاب شد`:'انتخاب عکس‌ها';};
 function syncEntries(){entries=groups.flatMap(x=>x.items);}
 function makeItems(files,size,paper){return [...files].map(file=>{const preview=URL.createObjectURL(file);previews.push(preview);return{file,id:crypto.randomUUID(),size,paper,preview};});}
 function renderGroups(){
  list.replaceChildren();if(!groups.length){list.append(empty);return;}
  for(const group of groups){
   const card=node('section',null,'pb1139Group');card.dataset.groupId=group.id;
   const head=node('div',null,'pb1139GroupHead');head.append(node('b',`${group.label} · ${group.paperLabel}`),node('span',`${group.items.length.toLocaleString('fa-IR')} عکس`));
   const toggle=node('button',group.collapsed?'باز کردن':'جمع کردن');toggle.type='button';toggle.setAttribute('aria-expanded',String(!group.collapsed));toggle.onclick=()=>{group.collapsed=!group.collapsed;renderGroups();};head.append(toggle);
   const input=node('input');input.type='file';input.accept=fileInput.accept;input.multiple=true;input.hidden=true;
   const more=node('button','افزودن عکس');more.type='button';more.onclick=()=>input.click();input.onchange=()=>{if(locked||submitting)return;group.items.push(...makeItems(input.files,group.size,group.paper));syncEntries();renderGroups();};head.append(more,input);
   const remove=node('button','حذف گروه');remove.type='button';remove.onclick=()=>{if(locked||submitting)return;groups=groups.filter(x=>x!==group);group.items.forEach(x=>URL.revokeObjectURL(x.preview));syncEntries();renderGroups();};head.append(remove);card.append(head);
   const photos=node('div',null,'pb1139GroupPhotos');photos.hidden=!!group.collapsed;
   for(const item of group.items){
    const photo=node('figure');const image=node('img');image.src=item.preview;image.alt=item.file.name;photo.append(image,node('figcaption',item.file.name));
    const paper=field(photo,'کاغذ عکس',select(paperOptions));paper.value=item.paper;paper.onchange=()=>{if(!locked&&!submitting)item.paper=paper.value;};
    const del=node('button','حذف عکس');del.type='button';del.onclick=()=>{if(locked||submitting)return;URL.revokeObjectURL(item.preview);group.items=group.items.filter(x=>x!==item);if(!group.items.length)groups=groups.filter(x=>x!==group);syncEntries();renderGroups();};photo.append(del);photos.append(photo);
   }card.append(photos);list.append(card);
  }
 }
 add.onclick=()=>{
  if(locked||submitting)return;
  if(!defaultSize.value||!pendingFiles.length){error.textContent='سایز چاپ و عکس‌های این گروه را انتخاب کن.';return;}
  const items=pendingFiles.map(file=>{const preview=URL.createObjectURL(file);previews.push(preview);return{file,id:crypto.randomUUID(),size:defaultSize.value,paper:defaultPaper.value,preview};});
  groups.push({size:defaultSize.value,paper:defaultPaper.value,id:crypto.randomUUID(),label:sizes.find(x=>x[0]===defaultSize.value)?.[1]||'',paperLabel:paperOptions.find(x=>x[0]===defaultPaper.value)[1],items});entries=groups.flatMap(x=>x.items);pendingFiles=[];fileInput.value='';choose.textContent='انتخاب عکس‌ها';error.textContent='';renderGroups();
 };
 const submit=node('button','ثبت سفارش و صدور فاکتور', 'pb1137Submit');submit.type='submit';form.append(submit);
 const clientOrderId=crypto.randomUUID();
 function busy(value){submitting=value;form.dataset.busy=value?'1':'';for(const control of modal.querySelectorAll('button,input,select'))control.disabled=value||locked&&control!==submit&&control!==close;}
 form.onsubmit=async e=>{
  e.preventDefault();if(submitting)return;
  if(!customers.value||customers.value==='new'&&(!name.value.trim()||!/^09\d{9}$/.test(mobile.value.trim()))){error.textContent='مشتری و شماره موبایل معتبر را مشخص کن.';return;}
  if(pendingFiles.length){error.textContent='عکس‌های انتخاب‌شده را با دکمهٔ افزودن به سفارش اضافه کن.';return;}
  if(!entries.length||entries.some(x=>!x.size||x.file.size<=0)){error.textContent='عکس‌ها و سایز چاپ هر عکس را مشخص کن.';return;}
  busy(true);error.textContent='در حال ذخیره روی هارد و ثبت سفارش…';
  try{
   if(!await provider.permission(directory))throw Error('اجازهٔ نوشتن در مسیر همیشگی داده نشد؛ سفارش ارسال نشد.');
   // Reserve the existing draft first so the normal folders include the real order number.
   locked=true;startedAt ||= new Date().toISOString();
   if(!order)order=await api('/api/lab/delegated-orders',{clientOrderId,localOnly:true,mode:'print',delivery:'pickup',priority:'normal',...(customers.value==='new'?{studioName:name.value.trim(),mobile:mobile.value.trim()}:{customerId:customers.value})});
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
 modal.showModal();
}
function mount(){
 const provider=storage();
 const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain');
 const old=document.getElementById('pb1137LocalIntakeButton');
 if(host){const intro=host.querySelector('.labQueueQuickIntroV464 button');if(intro&&intro.textContent!=='دسترسی سریع')intro.textContent='دسترسی سریع';}
 if(!/^\/lab(?:\/|$)/.test(location.pathname)||!host||!provider||!provider.deviceId()){old?.remove();return;}
 if(primaryState===null){checkPrimary();return;}if(!primaryState){old?.remove();return;}
 const target=host.querySelector('.mainQueueFilters')||host.querySelector('.ordersWorkspace');if(!target){old?.remove();return;}
 if(old){if(old.parentElement!==target)target.append(old);return;}const button=node('button','ثبت سفارش عکس حضوری','pb1137Launch');button.id='pb1137LocalIntakeButton';button.type='button';button.onclick=open;
 target.append(button);
}
let primaryState=null,checking=false;
async function checkPrimary(){if(checking)return;checking=true;try{const state=await api('/api/lab/download-device');primaryState=state.registered&&state.isThisDevice;}catch{primaryState=false;}finally{checking=false;schedule();}}
window.addEventListener('photobridge-auth-session-changed',()=>{primaryState=null;schedule();});
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount();});}
function boot(){mount();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener('popstate',schedule);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
