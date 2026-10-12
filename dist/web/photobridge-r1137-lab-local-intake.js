/* Laboratory intake: original photos stay in the selected local directory. */
(()=>{
'use strict';
if(window.pb1137LocalIntake)return;window.pb1137LocalIntake=true;
let active=null,opening=false;
const q=(s,r=document)=>r.querySelector(s);
function node(tag,text,cls){const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}
const storage=()=>window.pbLabLocalIntakeStorage;
const errors={customer_temporary_name_required:'نام موقت مشتری را وارد کنید.',customer_already_registered:'این شماره قبلاً عضو مجموعه شما شده است. از فهرست مشتری‌ها انتخابش کنید.',customer_already_preregistered:'این شماره قبلاً پیش‌ثبت‌نام شده است. از فهرست مشتری‌ها انتخابش کنید یا دعوت‌نامه را مجدداً ارسال کنید.',invalid_initial_debt:'مبلغ بدهی قبلی معتبر نیست.',initial_debt_already_recorded:'بدهی قبلی این مشتری قبلاً ثبت شده است؛ مبلغ بدهی قبلی را صفر کن و دوباره ثبت کن.',invalid_print_copies:'تعداد چاپ باید بین ۱ تا ۹۹ باشد.',download_device_not_registered:'کامپیوتر اصلی لابراتوار هنوز مشخص نشده است.',not_primary_download_device:'ثبت حضوری فقط روی کامپیوتر اصلی ذخیرهٔ فایل‌های لابراتوار انجام می‌شود.',files_not_ready:'فایل‌ها هنوز آماده نیستند.',print_selection_required:'سایز و نوع چاپ را انتخاب کن.',invalid_delegated_order:'اطلاعات مشتری کامل نیست.',stock_unavailable:'موجودی شاسی یا قاب کافی نیست.'};
async function api(url,body){try{return await storage().request(url,{...(body?{method:'POST',body:JSON.stringify(body)}:{})});}catch(e){throw Error(e.data?.message||errors[e.data?.error||e.message]||'ثبت سفارش انجام نشد. دوباره تلاش کن.');}}

function field(parent,label,input){if(['INPUT','SELECT','TEXTAREA'].includes(input.tagName))input.setAttribute('aria-label',label);const wrapper=node('label');wrapper.append(node('span',label),input);parent.append(wrapper);return input;}
function select(options){const el=node('select');for(const [value,label] of options){const o=node('option',label);o.value=value;el.append(o);}return el;}
function customerMenu(parent,customers,registerCustomer,resendInvitation){
 const wrapper=node('div',null,'pb1139Customer');wrapper.append(node('span','عکاس / مشتری'));
 const button=node('button','انتخاب عکاس ▾');button.type='button';button.setAttribute('aria-label','عکاس / مشتری');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
 const menu=node('div',null,'pb1139PickerMenu');menu.hidden=true;
 const search=node('input');search.type='search';search.placeholder='جستجوی نام یا موبایل';search.setAttribute('aria-label','جستجوی عکاس');search.autocomplete='off';
 const list=node('div',null,'pb1139PickerOptions');list.setAttribute('role','listbox');list.setAttribute('aria-label','انتخاب عکاس');
 const panel=node('section',null,'pb1143NewCustomer');panel.hidden=true;
 const newTitle=node('strong','پیش‌ثبت‌نام مشتری');panel.append(newTitle);
 const fields=node('div',null,'pb1143NewGrid');panel.append(fields);
 const temporaryName=field(fields,'نام موقت مشتری',node('input'));temporaryName.autocomplete='off';temporaryName.maxLength=140;temporaryName.placeholder='نام مشتری یا آتلیه';
 const number=field(fields,'شماره موبایل',node('input'));number.inputMode='tel';number.dir='ltr';number.placeholder='09xxxxxxxxx';number.autocomplete='off';
 const debt=field(fields,'بدهی قبلی (تومان)',node('input'));debt.type='text';debt.inputMode='numeric';debt.dir='ltr';debt.value='0';debt.autocomplete='off';
 const actions=node('div',null,'pb1143NewActions');panel.append(actions);
 const smsLabel=field(actions,'ارسال پیامک دعوتنامه',node('input'));smsLabel.type='checkbox';
 const addCustomer=node('button','افزودن','pb1143CustomerAdd');addCustomer.type='button';actions.append(addCustomer);
 const back=node('button','← بازگشت به فهرست','pb1144PickerBack');back.type='button';back.hidden=true;
 const notice=node('p',null,'pb1143PickerNotice');notice.setAttribute('role','status');menu.append(back,search,list,panel,notice);
 function positionMenu(){
  if(menu.hidden)return;const r=button.getBoundingClientRect(),width=Math.min(435,innerWidth-24);
  const availableBelow=innerHeight-r.bottom-14,availableAbove=r.top-14;
  const estimated=panel.hidden?320:260,above=availableBelow<estimated&&availableAbove>availableBelow;
  menu.style.width=width+'px';menu.style.left=Math.max(12,Math.min(innerWidth-width-12,r.right-width))+'px';
  menu.style.top=above?'auto':Math.max(8,r.bottom+5)+'px';
  menu.style.bottom=above?Math.max(8,innerHeight-r.top+5)+'px':'auto';
  menu.style.maxHeight=Math.max(145,Math.min(520,(above?availableAbove:availableBelow)-12))+'px';
 }
 function showNew(value){
  panel.hidden=!value;search.hidden=value;list.hidden=value;back.hidden=!value;
  menu.classList.toggle('pb1144Creating',value);
  if(value){const typed=mobileValue(search.value);if(/^09\d{9}$/.test(typed))number.value=typed;}
  positionMenu();
 }
 back.onclick=()=>{showNew(false);render();};
 wrapper.append(button,menu);parent.append(wrapper);
 const model={value:'',button};
 const digits=text=>String(text||'').replace(/[۰-۹]/g,x=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[٠-٩]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(x)));
 const normalize=text=>digits(text).toLocaleLowerCase('fa-IR');
 const mobileValue=text=>{let d=digits(text).replace(/\D/g,'');if(d.startsWith('0098'))d='0'+d.slice(4);else if(d.startsWith('98')&&d.length===12)d='0'+d.slice(2);else if(/^9\d{9}$/.test(d))d='0'+d;return d;};
 const moneyValue=text=>digits(text).replace(/[^0-9]/g,'');
 const formatMoney=text=>{const x=moneyValue(text);return x?Number(x).toLocaleString('en-US'):'0';};
 debt.oninput=()=>{debt.value=formatMoney(debt.value);};
 const itemLabel=c=>[c.name!==c.mobile?c.name:null,c.mobile,c.registrationPending?'پیش‌ثبت‌نام':null].filter(Boolean).join(' · ');
 function selectCustomer(c){model.value=c.id;model.registrationPending=!!c.registrationPending;button.textContent=itemLabel(c)+' ▾';showNew(false);menu.hidden=true;button.setAttribute('aria-expanded','false');notice.textContent='';}
 function render(){
  list.replaceChildren();const term=normalize(search.value.trim());
  for(const c of customers){if(term&&!normalize(itemLabel(c)).includes(term))continue;
   const row=node('div',null,'pb1143ChoiceRow');
   const option=node('button',itemLabel(c));option.type='button';option.setAttribute('role','option');option.setAttribute('aria-selected',String(model.value===c.id));option.onclick=()=>selectCustomer(c);row.append(option);
   if(c.registrationPending){const resend=node('button','ارسال مجدد','pb1143Resend');resend.type='button';resend.setAttribute('aria-label','ارسال مجدد دعوت‌نامه برای '+c.mobile);resend.title='ارسال مجدد دعوت‌نامه';resend.onclick=async()=>{
    resend.disabled=true;notice.textContent='در حال ارسال دعوت‌نامه…';
    try{const response=await resendInvitation(c.id);notice.textContent=response.invitationSmsSent?'پیامک دعوت‌نامه مجدداً ارسال شد.':'ارسال پیامک انجام نشد.';}
    catch(e){notice.textContent=e.message;}finally{resend.disabled=false;}
   };row.append(resend);}
   list.append(row);
  }
  const newRow=node('button','＋ مشتری جدید');newRow.type='button';newRow.setAttribute('role','option');newRow.onclick=()=>{showNew(true);notice.textContent='';};list.append(newRow);
 }
 addCustomer.onclick=async()=>{
  const name=temporaryName.value.trim().replace(/\s+/g,' '),mobile=mobileValue(number.value),rawDebt=moneyValue(debt.value),openingDebt=Number(rawDebt||0);
  if(!name){notice.textContent='نام موقت مشتری را وارد کنید.';return;}
  if(!/^09\d{9}$/.test(mobile)){notice.textContent='شماره موبایل ۱۱ رقمی معتبر وارد کن.';return;}
  if(!Number.isSafeInteger(openingDebt)||openingDebt<0||openingDebt>1_000_000_000_000){notice.textContent='مبلغ بدهی قبلی معتبر نیست.';return;}
  addCustomer.disabled=true;notice.textContent='در حال افزودن مشتری…';
  try{
   const created=await registerCustomer({name,mobile,initialDebt:openingDebt,sendInvitation:smsLabel.checked});
   const c=created.customer;if(!c?.id)throw Error('ثبت مشتری انجام نشد.');
   const previous=customers.findIndex(x=>x.id===c.id);
   if(previous>=0)customers[previous]=c;else customers.push(c);
   search.value='';render();selectCustomer(c);
   if(smsLabel.checked&&c.registrationPending&&!created.invitationSmsSent){
    menu.hidden=false;button.setAttribute('aria-expanded','true');notice.textContent='مشتری اضافه شد اما پیامک ارسال نشد. از گزینهٔ «ارسال مجدد» استفاده کن.';
   }
  }catch(e){notice.textContent=e.message;}finally{addCustomer.disabled=false;}
 };
 button.onclick=()=>{menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden){showNew(false);render();positionMenu();}else showNew(false);};
 search.oninput=render;search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();list.querySelector('[role=option]')?.click();}});
 wrapper.addEventListener('keydown',e=>{if(!menu.hidden&&(e.key==='ArrowDown'||e.key==='ArrowUp')){const options=[...list.querySelectorAll('[role=option]')];if(!options.length)return;e.preventDefault();const index=options.indexOf(document.activeElement);const current=index<0?(e.key==='ArrowDown'?-1:0):index;options[(current+(e.key==='ArrowDown'?1:-1)+options.length)%options.length]?.focus();}if(e.key==='Escape'&&!menu.hidden){e.preventDefault();e.stopPropagation();menu.hidden=true;showNew(false);button.setAttribute('aria-expanded','false');button.focus();}});
 parent.closest('dialog').addEventListener('click',e=>{if(!wrapper.contains(e.target)){menu.hidden=true;showNew(false);button.setAttribute('aria-expanded','false');}});
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
 const customers=customerMenu(settings,[...(bootstrap.customers||[])],
  payload=>api('/api/lab/delegated-customers',payload),
  customerId=>api('/api/lab/delegated-customers/'+customerId+'/resend-invitation',{}));
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
 async function appendFiles(group,files,size,paper){
  const additions=[];
  for(const file of files){const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');const item=group.items.find(x=>x.hash===hash)||additions.find(x=>x.hash===hash);if(item){additions.push({existing:item});}else additions.push({file,hash,size,paper,copies:1});}
  const counts=new Map();for(const item of additions){const target=item.existing||item;counts.set(target,(counts.get(target)||target.copies||1)+(item.existing?1:0));}for(const count of counts.values())if(count>99)throw Error('تعداد چاپ هر عکس حداکثر ۹۹ است.');
  for(const item of additions){if(item.existing){item.existing.copies++;continue;}item.id=crypto.randomUUID();item.preview=URL.createObjectURL(item.file);previews.push(item.preview);group.items.push(item);}
 }
 function renderGroups(){
  list.replaceChildren();if(!groups.length){list.append(empty);return;}
  for(const group of groups){
   const card=node('section',null,'pb1139Group');card.dataset.groupId=group.id;
   const head=node('div',null,'pb1139GroupHead');head.append(node('b',`${group.label} · ${group.paperLabel}`),node('span',`${group.items.length.toLocaleString('fa-IR')} عکس`));
   const toggle=node('button',group.collapsed?'▾':'▴','pb1141Collapse');toggle.type='button';toggle.setAttribute('aria-label',group.collapsed?'باز کردن':'جمع کردن');toggle.setAttribute('aria-expanded',String(!group.collapsed));toggle.onclick=()=>{group.collapsed=!group.collapsed;renderGroups();};head.append(toggle);
   const input=node('input');input.type='file';input.accept=fileInput.accept;input.multiple=true;input.hidden=true;
   const more=node('button','افزودن عکس');more.type='button';more.onclick=()=>input.click();input.onchange=async()=>{if(locked||submitting)return;busy(true);try{await appendFiles(group,input.files,group.size,group.paper);syncEntries();renderGroups();error.textContent='';}catch(e){error.textContent=e.message;}finally{busy(false);}};head.append(more,input);
   const remove=node('button','حذف گروه');remove.type='button';remove.onclick=()=>{if(locked||submitting)return;groups=groups.filter(x=>x!==group);group.items.forEach(x=>URL.revokeObjectURL(x.preview));syncEntries();renderGroups();};head.append(remove);card.append(head);
   const photos=node('div',null,'pb1139GroupPhotos');photos.hidden=!!group.collapsed;
   for(const item of group.items){
    const photo=node('figure');const image=node('img');image.src=item.preview;image.alt=item.file.name;photo.append(image,node('figcaption',item.file.name));
    const actions=node('div',null,'pb1141PhotoActions');photo.append(actions);const paper=field(actions,'کاغذ عکس',select(paperOptions));paper.value=item.paper;paper.onchange=()=>{if(!locked&&!submitting)item.paper=paper.value;};
    const del=node('button',null,'pb1141DeletePhoto');del.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/></svg>';del.type='button';del.setAttribute('aria-label','حذف عکس');del.title='حذف عکس';del.onclick=()=>{if(locked||submitting)return;URL.revokeObjectURL(item.preview);group.items=group.items.filter(x=>x!==item);if(!group.items.length)groups=groups.filter(x=>x!==group);syncEntries();renderGroups();};actions.append(del);
    const quantity=node('div',null,'pb1142Quantity');quantity.append(node('span','تعداد'));
    const minus=node('button','−'),count=node('input'),plus=node('button','＋');minus.type=plus.type='button';minus.setAttribute('aria-label','کم کردن تعداد چاپ');plus.setAttribute('aria-label','افزایش تعداد چاپ');count.type='number';count.min='1';count.max='99';count.step='1';count.value=item.copies;count.setAttribute('aria-label','تعداد چاپ');
    const setCopies=value=>{if(locked||submitting)return;const n=Number(value);if(Number.isInteger(n)&&n>=1&&n<=99)item.copies=n;count.value=item.copies;};minus.onclick=()=>setCopies(item.copies-1);plus.onclick=()=>setCopies(item.copies+1);count.onchange=()=>setCopies(count.value);quantity.append(minus,count,plus);photo.append(quantity);photos.append(photo);
   }card.append(photos);list.append(card);
  }
 }
 add.onclick=async()=>{
  if(locked||submitting)return;
  if(!defaultSize.value||!pendingFiles.length){error.textContent='سایز چاپ و عکس‌های این گروه را انتخاب کن.';return;}
  busy(true);
  try{
   let group=groups.find(x=>x.size===defaultSize.value);const fresh=!group;
   group ||= {size:defaultSize.value,paper:defaultPaper.value,id:crypto.randomUUID(),label:sizes.find(x=>x[0]===defaultSize.value)?.[1]||'',paperLabel:paperOptions.find(x=>x[0]===defaultPaper.value)[1],items:[]};
   await appendFiles(group,pendingFiles,defaultSize.value,defaultPaper.value);if(fresh)groups.push(group);group.collapsed=false;syncEntries();pendingFiles=[];fileInput.value='';choose.textContent='انتخاب عکس‌ها';error.textContent='';renderGroups();
  }catch(e){error.textContent=e.message;}finally{busy(false);}
 };
 const submit=node('button','ثبت سفارش و صدور فاکتور', 'pb1137Submit');submit.type='submit';form.append(submit);
 const clientOrderId=crypto.randomUUID();
 function busy(value){submitting=value;form.dataset.busy=value?'1':'';for(const control of modal.querySelectorAll('button,input,select'))control.disabled=value||locked&&control!==submit&&control!==close;}
 form.onsubmit=async e=>{
  e.preventDefault();if(submitting)return;
  if(!customers.value){error.textContent='مشتری و شماره موبایل معتبر را مشخص کن.';return;}
  if(pendingFiles.length){error.textContent='عکس‌های انتخاب‌شده را با دکمهٔ افزودن به سفارش اضافه کن.';return;}
  if(!entries.length||entries.some(x=>!x.size||x.file.size<=0)){error.textContent='عکس‌ها و سایز چاپ هر عکس را مشخص کن.';return;}
  busy(true);error.textContent='در حال ذخیره روی هارد و ثبت سفارش…';
  try{
   if(!await provider.permission(directory))throw Error('اجازهٔ نوشتن در مسیر همیشگی داده نشد؛ سفارش ارسال نشد.');
   // Reserve the existing draft first so the normal folders include the real order number.
   locked=true;startedAt ||= new Date().toISOString();
   if(!order)order=await api('/api/lab/delegated-orders',{clientOrderId,localOnly:true,mode:'print',delivery:'pickup',priority:'normal',customerId:customers.value});
   for(const item of entries){if(item.registered)continue;const result=await api('/api/lab/delegated-orders/'+order.orderId+'/files/presign',{clientFileId:item.id,name:item.file.name,relativePath:item.file.name,bytes:item.file.size,contentType:item.file.type,printSizeId:item.size,printType:item.paper,printCopies:item.copies,localOnly:true});if(result.storageMode!=='device-local'||result.uploadUrl)throw Error('سفارش محلی تأیید نشد؛ هیچ عکسی به سرور ارسال نشد.');item.registered=true;item.fileId=result.fileId;}
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
 const desktopQueue=window.matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)').matches&&/^\/lab\/(?:orders(?:\/|$)|album(?:s|[-/]|$)|print(?:\/|$))/.test(location.pathname);
 const header=desktopQueue?host.querySelector('.pb1148SecondaryHeader.pb1174QueueNav'):null;
 const target=header||host.querySelector('.mainQueueFilters')||host.querySelector('.ordersWorkspace');if(!target){old?.remove();return;}
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
