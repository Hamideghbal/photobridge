/* Laboratory intake: original photos stay in the selected local directory. */
(()=>{
'use strict';
if(window.pb1137LocalIntake)return;window.pb1137LocalIntake=true;
let active=null,opening=false;
const q=(s,r=document)=>r.querySelector(s);
function node(tag,text,cls){const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}
const storage=()=>window.pbLabLocalIntakeStorage;
const errors={customer_not_pending:'عضویت این عکاسی کامل شده است؛ بدهی اولیه از این بخش قابل ویرایش نیست.',customer_temporary_name_required:'نام موقت مشتری را وارد کنید.',customer_already_registered:'این شماره قبلاً عضو مجموعه شما شده است. از فهرست مشتری‌ها انتخابش کنید.',customer_already_preregistered:'این شماره قبلاً پیش‌ثبت‌نام شده است. از فهرست مشتری‌ها انتخابش کنید یا دعوت‌نامه را مجدداً ارسال کنید.',invalid_initial_debt:'مبلغ بدهی قبلی معتبر نیست.',initial_debt_already_recorded:'بدهی قبلی این مشتری قبلاً ثبت شده است؛ مبلغ بدهی قبلی را صفر کن و دوباره ثبت کن.',initial_debt_locked_after_invoice:'برای این مشتری فاکتور صادر شده و بدهی اولیه دیگر قابل تغییر نیست.',initial_debt_changed:'بدهی اولیه تغییر کرده؛ اطلاعات حساب را دوباره بررسی کن.',invalid_print_copies:'تعداد چاپ باید بین ۱ تا ۹۹ باشد.',download_device_not_registered:'کامپیوتر اصلی لابراتوار هنوز مشخص نشده است.',not_primary_download_device:'ثبت حضوری فقط روی کامپیوتر اصلی ذخیرهٔ فایل‌های لابراتوار انجام می‌شود.',files_not_ready:'فایل‌ها هنوز آماده نیستند.',print_selection_required:'سایز و نوع چاپ را انتخاب کن.',invalid_delegated_order:'اطلاعات مشتری کامل نیست.',stock_unavailable:'موجودی شاسی یا قاب کافی نیست.'};
/* PB1467 live intake requests */
async function api(url,body){try{
 const live=/^\/api\/lab\/delegated-orders(?:\/[0-9a-f-]+\/(?:files\/presign|submit))?$/.test(url)||/^\/api\/lab\/orders\/[0-9a-f-]+$/.test(url);
 const result=await storage().request(live?url+'/download':url,{...(body?{method:'POST',body:JSON.stringify(body)}:{})});
 if(result?.queued||result?.operationId)throw Object.assign(Error('intake_requires_live_connection'),{data:{message:'ثبت سفارش حضوری به ارتباط زنده با سرور نیاز دارد. اتصال را بررسی و دوباره تلاش کنید؛ فایل مبدأ حذف نشده است.'}});
 return result;
}catch(e){throw Error(e.data?.message||errors[e.data?.error||e.message]||'ثبت سفارش انجام نشد. دوباره تلاش کن.');}}

function field(parent,label,input){if(['INPUT','SELECT','TEXTAREA'].includes(input.tagName))input.setAttribute('aria-label',label);const wrapper=node('label');wrapper.append(node('span',label),input);parent.append(wrapper);return input;}
function select(options){const el=node('select');for(const [value,label] of options){const o=node('option',label);o.value=value;el.append(o);}return el;}
function customerMenu(parent,customers,registerCustomer,resendInvitation,accountSummary,adjustInitialDebt,sendInvoiceSms){
 const wrapper=node('div',null,'pb1139Customer');wrapper.append(node('span','عکاس / مشتری'));
 const button=node('button');button.type='button';
 const selectionValue=node('span','انتخاب عکاس','pb1179CustomerValue');
 const selectionChevron=node('span','▾','pb1179CustomerChevron');
 button.append(selectionValue,selectionChevron);button.setAttribute('aria-label','عکاس / مشتری');
 button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
 const menu=node('div',null,'pb1139PickerMenu');menu.hidden=true;
 const search=node('input');search.type='search';search.placeholder='جستجوی شماره یا نام';
 search.setAttribute('aria-label','جستجوی عکاس');search.autocomplete='off';
 const list=node('div',null,'pb1139PickerOptions');list.setAttribute('role','listbox');
 list.setAttribute('aria-label','انتخاب عکاس');
 const panel=node('section',null,'pb1143NewCustomer');panel.hidden=true;
 panel.append(node('strong','پیش‌ثبت‌نام مشتری'));
 const fields=node('div',null,'pb1143NewGrid');panel.append(fields);
 const temporaryName=field(fields,'نام موقت مشتری',node('input'));
 temporaryName.autocomplete='off';temporaryName.maxLength=140;temporaryName.placeholder='نام مشتری یا آتلیه';
 const number=field(fields,'شماره موبایل',node('input'));
 number.inputMode='tel';number.dir='ltr';number.placeholder='09xxxxxxxxx';number.autocomplete='off';
 const debt=field(fields,'بدهی اولیه (تومان)',node('input'));
 debt.type='text';debt.inputMode='numeric';debt.dir='ltr';debt.value='0';debt.autocomplete='off';
 const actions=node('div',null,'pb1143NewActions');panel.append(actions);
 const smsLabel=field(actions,'ارسال پیامک دعوتنامه',node('input'));smsLabel.type='checkbox';
 const addCustomer=node('button','افزودن','pb1143CustomerAdd');addCustomer.type='button';actions.append(addCustomer);
 const back=node('button','← بازگشت به فهرست','pb1144PickerBack');back.type='button';back.hidden=true;
 const notice=node('p',null,'pb1143PickerNotice');notice.setAttribute('role','status');
 menu.append(back,search,list,panel,notice);
 wrapper.append(button,menu);parent.append(wrapper);
 const details=node('section',null,'pb1294SelectedDetails');details.hidden=true;
 details.setAttribute('aria-label','اطلاعات حساب مشتری انتخاب‌شده');
 const accountRow=node('div',null,'pb1365CustomerAccountRow');wrapper.replaceWith(accountRow);accountRow.append(wrapper,details);
 const model={value:'',button,sendInvoiceSms:false},digits=text=>String(text||'').replace(/[۰-۹]/g,x=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[٠-٩]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(x)));
 const normalize=text=>digits(text).toLocaleLowerCase('fa-IR');
 const mobileValue=text=>{let d=digits(text).replace(/\D/g,'');if(d.startsWith('0098'))d='0'+d.slice(4);else if(d.startsWith('98')&&d.length===12)d='0'+d.slice(2);else if(/^9\d{9}$/.test(d))d='0'+d;return d;};
 const moneyValue=text=>digits(text).replace(/[^0-9]/g,'');
 const formatMoney=text=>{const x=moneyValue(text);return x?Number(x).toLocaleString('en-US'):'0';};
 const money=n=>Number(n||0).toLocaleString('fa-IR')+' تومان';
 const date=value=>{if(!value)return 'ثبت نشده';const d=new Date(value);return Number.isNaN(d.getTime())?'ثبت نشده':new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Tehran'}).format(d);};
 const itemLabel=c=>[c.mobile,c.name!==c.mobile?c.name:null,c.registrationPending?'پیش‌عضویت':'عضویت کامل'].filter(Boolean).join(' · ');
 debt.oninput=()=>{debt.value=formatMoney(debt.value);};
 let selected=null,selectionVersion=0;
 function positionMenu(){
  if(menu.hidden)return;
  const r=button.getBoundingClientRect(),width=Math.min(365,innerWidth-24);
  const below=innerHeight-r.bottom-14,aboveSpace=r.top-14;
  const above=below<(panel.hidden?260:290)&&aboveSpace>below;
  menu.style.width=width+'px';
  menu.style.left=Math.max(12,Math.min(innerWidth-width-12,r.right-width))+'px';
  menu.style.top=above?'auto':Math.max(8,r.bottom+5)+'px';
  menu.style.bottom=above?Math.max(8,innerHeight-r.top+5)+'px':'auto';
  menu.style.maxHeight=Math.max(145,Math.min(520,(above?aboveSpace:below)-12))+'px';
 }
 function showNew(value){
  panel.hidden=!value;search.hidden=value;list.hidden=value;back.hidden=!value;
  menu.classList.toggle('pb1144Creating',value);
  if(value){const typed=mobileValue(search.value);if(/^09\d{9}$/.test(typed))number.value=typed;}
  positionMenu();
 }
 back.onclick=()=>{showNew(false);render();};
 function showDetails(c,data,message=''){
  if(!selected||selected.id!==c.id)return;
  details.replaceChildren();
  const summary=node('div',null,'pb1294AccountSummary');
  const addMeta=(label,text,cls='')=>{const cell=node('div',null,'pb1294Meta '+cls);cell.append(node('span',label),node('strong',text));summary.append(cell);};
  const recent=(data.invoices||[])[0];
  addMeta('مانده',money(data.balance),'pb1294Balance');
  summary.title='آخرین تغییر: '+date(data.balanceUpdatedAt)+' · '+(recent?'آخرین فاکتور: '+recent.number+' · '+date(recent.issuedAt):'فاکتوری صادر نشده');
  addMeta('بدهی اولیه',money(data.initialDebt));
  details.append(summary);
  const controls=node('div',null,'pb1294AccountActions');
  const localNotice=node('span',message,'pb1294ActionNotice');
  localNotice.setAttribute('role','status');
  const smsChoice=node('label',null,'pb1365SmsChoice'),sms=node('input');sms.type='checkbox';
  sms.setAttribute('aria-label','ارسال پیامک فاکتور همین سفارش');
  sms.checked=model.sendInvoiceSms===true;sms.disabled=!data.smsEnabled;
  smsChoice.title=data.smsEnabled?'پس از ثبت سفارش، پیامک فاکتور همین سفارش بعد از صدور ارسال می‌شود.':'ارسال پیامک برای این لابراتوار غیرفعال است';
  smsChoice.append(sms,node('span','پیامک'));controls.append(smsChoice);
  sms.onchange=()=>{model.sendInvoiceSms=sms.checked;};
  if(data.canEditInitialDebt){
   const toggle=node('button','اصلاح بدهی اولیه','pb1294Edit');toggle.type='button';
   const editPanel=node('div',null,'pb1294InitialEdit');editPanel.hidden=true;
   const amount=node('input');amount.type='text';amount.inputMode='numeric';amount.dir='ltr';
   amount.value=Number(data.initialDebt||0).toLocaleString('en-US');amount.setAttribute('aria-label','مبلغ بدهی اولیه عضویت');
   amount.oninput=()=>{amount.value=formatMoney(amount.value);};
   const reason=node('input');reason.maxLength=500;reason.placeholder='توضیح اصلاح (اختیاری)';
   reason.setAttribute('aria-label','دلیل اصلاح بدهی اولیه');
   const save=node('button','ثبت اصلاح');save.type='button';
   const cancel=node('button','انصراف');cancel.type='button';cancel.onclick=()=>{editPanel.hidden=true;};
   toggle.onclick=()=>{editPanel.hidden=!editPanel.hidden;};
   save.onclick=async()=>{
    const raw=moneyValue(amount.value),target=Number(raw);
    if(!raw||!Number.isSafeInteger(target)||target>1_000_000_000_000){localNotice.textContent='مبلغ معتبر وارد کن.';return;}
    if(!confirm('بدهی اولیه '+c.name+' به '+money(target)+' تغییر کند؟'))return;
    save.disabled=true;localNotice.textContent='در حال ثبت اصلاح بدهی اولیه…';
    try{
     const result=await adjustInitialDebt(c.id,{initialDebt:target,expectedInitialDebt:data.initialDebt,note:reason.value.trim()});
     if(!result.ok||!Number.isFinite(result.initialDebt)||!Number.isFinite(result.balance))throw Error('اصلاح بدهی از سرور تأیید نشد.');
     if(window.pbNativeStorage){if(selected?.id===c.id){selectionVersion++;showDetails(c,{...data,...result},'اصلاح بدهی اولیه ثبت شد.');}}else await refreshDetails(c,result.balanceUpdatedAt?'اصلاح بدهی اولیه ثبت شد.':'بدهی اولیه به‌روز شد.'); /* PB1472 immediate confirmed debt */
    }catch(e){localNotice.textContent=e.message;if(/فاکتور|invoice|تغییر/.test(e.message))refreshDetails(c,e.message);}
    finally{save.disabled=false;}
   };
   editPanel.append(amount,reason,save,cancel);
   controls.append(toggle,editPanel);
  }else if(data.hasInvoice){summary.title+=' · بدهی اولیه پس از صدور فاکتور قفل است';}
  const actionRow=node('div',null,'pb1467AccountActionRow');for(const control of [...controls.children])if(!control.classList.contains('pb1294InitialEdit'))actionRow.append(control);controls.prepend(actionRow);controls.append(localNotice);details.append(controls);
 }
 async function refreshDetails(c,message=''){
  if(!c||selected?.id!==c.id)return;
  const token=++selectionVersion;
  details.hidden=false;details.replaceChildren(node('span','در حال دریافت اطلاعات حساب…','pb1294Loading'));
  try{
   const data=await accountSummary(c.id);
   if(token===selectionVersion&&selected?.id===c.id)showDetails(c,data,message);
  }catch(e){
   if(token===selectionVersion&&selected?.id===c.id){
    details.replaceChildren(node('p','اطلاعات حساب در دسترس نیست: '+e.message,'pb1294ActionNotice'));
   }
  }
 }
 function selectCustomer(c){
  if(selected?.id!==c.id)model.sendInvoiceSms=false;
  selected=c;model.value=c.id;model.registrationPending=!!c.registrationPending;
  selectionValue.textContent=itemLabel(c);showNew(false);menu.hidden=true;
  button.setAttribute('aria-expanded','false');notice.textContent='';
  model.onChange?.(c);refreshDetails(c);
 }
 function render(){
  list.replaceChildren();const term=normalize(search.value.trim());
  for(const c of customers){
   if(term&&!normalize(itemLabel(c)).includes(term))continue;
   const row=node('div',null,'pb1143ChoiceRow');
   const option=node('button',itemLabel(c),'pb1294SimpleChoice');option.type='button';
   option.setAttribute('role','option');option.setAttribute('aria-selected',String(model.value===c.id));
   option.onclick=()=>selectCustomer(c);row.append(option);list.append(row);
  }
  const newRow=node('button','＋ مشتری جدید');newRow.type='button';
  newRow.setAttribute('role','option');newRow.onclick=()=>{showNew(true);notice.textContent='';};
  list.append(newRow);
 }
 addCustomer.onclick=async()=>{
  const name=temporaryName.value.trim().replace(/\s+/g,' '),mobile=mobileValue(number.value);
  const rawDebt=moneyValue(debt.value),openingDebt=Number(rawDebt||0);
  if(!name){notice.textContent='نام موقت مشتری را وارد کنید.';return;}
  if(!/^09\d{9}$/.test(mobile)){notice.textContent='شماره موبایل ۱۱ رقمی معتبر وارد کن.';return;}
  if(!Number.isSafeInteger(openingDebt)||openingDebt<0||openingDebt>1_000_000_000_000){notice.textContent='مبلغ بدهی اولیه معتبر نیست.';return;}
  addCustomer.disabled=true;notice.textContent='در حال افزودن مشتری…';
  try{
   const created=await registerCustomer({name,mobile,initialDebt:openingDebt,sendInvitation:smsLabel.checked});
   const c=created.customer;if(!c?.id)throw Error('ثبت مشتری انجام نشد.');
   const previous=customers.findIndex(x=>x.id===c.id);
   if(previous>=0)customers[previous]=c;else customers.push(c);
   search.value='';render();selectCustomer(c);
   if(smsLabel.checked&&c.registrationPending&&!created.invitationSmsSent){
    menu.hidden=false;button.setAttribute('aria-expanded','true');
    notice.textContent='مشتری اضافه شد اما پیامک دعوت‌نامه ارسال نشد؛ از بخش دعوت‌نامه‌ها دوباره ارسال کنید.';
   }
  }catch(e){notice.textContent=e.message;}finally{addCustomer.disabled=false;}
 };
 button.onclick=()=>{
  menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));
  if(!menu.hidden){showNew(false);render();positionMenu();}else showNew(false);
 };
 search.oninput=render;
 search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();list.querySelector('[role=option]')?.click();}});
 wrapper.addEventListener('keydown',e=>{
  if(!menu.hidden&&(e.key==='ArrowDown'||e.key==='ArrowUp')){
   const options=[...list.querySelectorAll('[role=option]')];if(!options.length)return;
   e.preventDefault();const index=options.indexOf(document.activeElement);
   const current=index<0?(e.key==='ArrowDown'?-1:0):index;
   options[(current+(e.key==='ArrowDown'?1:-1)+options.length)%options.length]?.focus();
  }
  if(e.key==='Escape'&&!menu.hidden){
   e.preventDefault();e.stopPropagation();menu.hidden=true;showNew(false);
   button.setAttribute('aria-expanded','false');button.focus();
  }
 });
 parent.closest('dialog').addEventListener('click',e=>{
  if(!wrapper.contains(e.target)){menu.hidden=true;showNew(false);button.setAttribute('aria-expanded','false');}
 });
 return model;
}
function pb1184AlbumConfigurator(editor,settings,album,sizeSelect,entriesFn){
 const panel=node('section',null,'pb1184AlbumPanel');panel.setAttribute('aria-label','تنظیمات سفارش آلبوم');
 panel.append(node('h3','مشخصات آلبوم'));
 const grid=node('div',null,'pb1184AlbumGrid');panel.append(grid);
 const covers=Array.isArray(album.covers)?album.covers:[];
 const sizeOptions=Array.isArray(album.sizes)?album.sizes:[];
 const packages=Array.isArray(album.packages)?album.packages:[];
 const extras=album.extrasEnabled===false?[]:Array.isArray(album.extras)?album.extras:[];
 const cover=field(grid,'جلد آلبوم',select([['','انتخاب جلد'],...covers.map(x=>[String(x.id),[x.materialName,x.modelName,x.name].filter(Boolean).join(' · ')]),...(album.coverCatalogEnabled===false?[['__custom__','جلد سفارشی']]:[])]));
 const color=field(grid,'رنگ جلد',select([['','انتخاب رنگ']]));
 const coverRequest=field(grid,'توضیحات جلد سفارشی',node('textarea'));coverRequest.rows=2;coverRequest.placeholder='جنس، مدل، رنگ و جزئیات جلد را وارد کن';
 const coverText=field(grid,'متن روی جلد',node('input'));coverText.maxLength=160;coverText.placeholder='متن یا نام روی جلد (اختیاری)';
 const albumPackage=field(grid,'باکس / کیف آلبوم',select([['','بدون باکس']]));
 albumPackage.parentElement.hidden=album.packageCatalogEnabled===false;
 const orderMode=field(grid,'ترتیب چاپ صفحات',select([['backprint','براساس بک‌پرینت'],['manual','ترتیب دستی']]));
 const orderNotes=field(grid,'توضیح ترتیب دستی',node('textarea'));orderNotes.rows=2;orderNotes.maxLength=2000;orderNotes.placeholder='ترتیب فایل‌ها و توضیح مونتاژ';
 const generalNotes=field(grid,'یادداشت سفارش آلبوم',node('textarea'));generalNotes.rows=2;generalNotes.maxLength=2500;
 const extraSection=node('div',null,'pb1184AlbumExtras');panel.append(extraSection);
 if(extras.length){extraSection.append(node('strong','خدمات اضافه'));for(const item of extras){const choice=node('label',null,'pb1184Extra');const box=node('input');box.type='checkbox';box.value=String(item.id);choice.append(box,node('span',String(item.name)));extraSection.append(choice)}}
 const small=node('p','هر فایل یک لت است. همه فایل‌ها یک سایز آلبوم دارند؛ تعداد لت به‌صورت خودکار از عکس‌ها محاسبه می‌شود.','pb1184AlbumHint');panel.append(small);
 function showOptions(){
  cover.parentElement.hidden=album.coverCatalogEnabled===false;
  const currentSize=String(sizeSelect.value);
  const active=covers.filter(x=>!x.sizeId||String(x.sizeId)===currentSize);
  const oldCover=cover.value;
  cover.replaceChildren(...[['','انتخاب جلد'],...active.map(x=>[String(x.id),[x.materialName,x.modelName,x.name].filter(Boolean).join(' · ')]),...(album.coverCatalogEnabled===false?[['__custom__','جلد سفارشی']]:[])].map(([id,label])=>{const opt=node('option',label);opt.value=id;return opt}));
  if([...cover.options].some(x=>x.value===oldCover))cover.value=oldCover;else if(album.coverCatalogEnabled===false)cover.value='__custom__';
  const selected=active.find(x=>String(x.id)===String(cover.value));
  const oldColor=color.value;
  color.replaceChildren(...[['','انتخاب رنگ'],...(selected?.colors||[]).filter(x=>x.active!==false).map(x=>[String(x.id),String(x.name||x.colorValue||'رنگ')])].map(([id,label])=>{const opt=node('option',label);opt.value=id;return opt}));
  if([...color.options].some(x=>x.value===oldColor))color.value=oldColor;
  color.parentElement.hidden=!(selected&&(selected.colors||[]).some(x=>x.active!==false));
  coverRequest.parentElement.hidden=cover.value!=='__custom__';
  const selectedPack=albumPackage.value;
  albumPackage.replaceChildren(...[['','بدون باکس'],...packages.filter(x=>String(x.sizeId)===currentSize).map(x=>[String(x.id),[x.modelName,x.colorName].filter(Boolean).join(' · ')])].map(([id,label])=>{const opt=node('option',label);opt.value=id;return opt}));
  if([...albumPackage.options].some(x=>x.value===selectedPack))albumPackage.value=selectedPack;
  orderNotes.parentElement.hidden=orderMode.value!=='manual';
 }
 cover.onchange=showOptions;
 sizeSelect.addEventListener('change',showOptions);
 orderMode.onchange=showOptions;
 editor.insertBefore(panel,settings.nextSibling);
 showOptions();
 function collect(){
  const size=sizeOptions.find(x=>String(x.id)===String(sizeSelect.value));
  if(!size)throw Error('سایز آلبوم را مشخص کن.');
  const entries=entriesFn();
  if(entries.length<Math.max(1,Number(size.minSpreads||1))||entries.length>Math.min(500,Number(size.maxSpreads||500)))throw Error('تعداد لت‌های آلبوم باید بین '+String(size.minSpreads||1)+' و '+String(size.maxSpreads||500)+' باشد.');
  const paperCounts={luster:0,silk:0,metallic:0};
  for(const item of entries){if(!Object.hasOwn(paperCounts,item.paper))throw Error('کاغذ یکی از لت‌ها معتبر نیست.');paperCounts[item.paper]++}
  const picked=covers.find(x=>String(x.id)===String(cover.value));
  const customCover=album.coverCatalogEnabled===false;
  if(!customCover&&!picked)throw Error('مدل جلد آلبوم را انتخاب کن.');
  const colors=(picked?.colors||[]).filter(x=>x.active!==false);
  if(!customCover&&colors.length&&!colors.some(x=>String(x.id)===String(color.value)))throw Error('رنگ جلد آلبوم را انتخاب کن.');
  if(customCover&&!coverRequest.value.trim())throw Error('مشخصات جلد سفارشی را وارد کن.');
  if(orderMode.value==='manual'&&!orderNotes.value.trim())throw Error('ترتیب دستی فایل‌ها را توضیح بده.');
  return{sizeId:size.id,spreads:entries.length,paperType:entries[0]?.paper||'luster',paperCounts,coverId:customCover?null:picked.id,colorId:customCover?null:color.value||null,customCover,coverRequest:customCover?coverRequest.value.trim():'',coverText:coverText.value.trim(),packageRequest:'',packageId:album.packageCatalogEnabled===false?null:albumPackage.value||null,extraIds:[...extraSection.querySelectorAll('input:checked')].map(x=>x.value),printOrderMode:orderMode.value,printOrderNotes:orderNotes.value.trim(),generalNotes:generalNotes.value.trim()};
 }
 function estimate(){
  const list=entriesFn(),size=sizeOptions.find(x=>String(x.id)===String(sizeSelect.value));
  const rows=[],paperCounts={luster:0,silk:0,metallic:0};
  list.forEach(x=>{if(Object.hasOwn(paperCounts,x.paper))paperCounts[x.paper]++});
  let total=0,missing=false;
  for(const [paper,count] of Object.entries(paperCounts)){if(!count)continue;
   const value=size?.[paper];if(value==null){missing=true;rows.push([count+' لت '+(paper==='luster'?'لاستر':paper==='silk'?'سیلک':'متالیک'),'تعرفه نامشخص']);}
   else{const amount=Number(value)*count;total+=amount;rows.push([count+' لت چاپ',amount.toLocaleString('fa-IR')+' تومان']);}}
  const binding=size?.bindingPrice;if(binding==null){missing=true;}else total+=Number(binding)*list.length;
  if(list.length)rows.push(['صحافی '+list.length+' لت',binding==null?'تعرفه نامشخص':(Number(binding)*list.length).toLocaleString('fa-IR')+' تومان']);
  const picked=covers.find(x=>String(x.id)===String(cover.value));const chosenColor=(picked?.colors||[]).find(x=>String(x.id)===String(color.value));
  const coverPrice=cover.value==='__custom__'?null:chosenColor?.price??picked?.price;
  if(cover.value){if(coverPrice==null||Number(coverPrice)<=0){missing=true;rows.push(['جلد','قیمت در فاکتور']);}else{total+=Number(coverPrice);rows.push(['جلد',Number(coverPrice).toLocaleString('fa-IR')+' تومان'])}}
  const pkg=packages.find(x=>String(x.id)===String(albumPackage.value));if(pkg){total+=Number(pkg.price||0);rows.push(['باکس آلبوم',Number(pkg.price||0).toLocaleString('fa-IR')+' تومان'])}
  for(const input of extraSection.querySelectorAll('input:checked')){const item=extras.find(x=>String(x.id)===input.value);if(!item)continue;const price=Number(item.price||0)*(item.pricingMode==='per_spread'?list.length:1);total+=price;rows.push([item.name,price.toLocaleString('fa-IR')+' تومان'])}
  return{rows,total,missing,count:list.length,sizeLabel:size?.label||'سایز انتخاب نشده'};
 }
 panel.addEventListener('change',()=>panel.dispatchEvent(new CustomEvent('pb1184-estimate',{bubbles:false})));
 panel.addEventListener('input',()=>panel.dispatchEvent(new CustomEvent('pb1184-estimate',{bubbles:false})));
 return{panel,collect,estimate};
}
/* PB1184 album walk-in configurator */
async function open(mode="print"){const albumMode=mode==="album";
 if(active||opening)return;
 opening=true;
 const launch=document.getElementById('pb1137LocalIntakeButton');const intakeTitle=albumMode?'ثبت سفارش آلبوم حضوری':'ثبت سفارش عکس حضوری';if(launch){launch.disabled=true;launch.textContent='در حال آماده‌سازی…';}
 const provider=storage();let directory,bootstrap,loadError;
  // R1201: immediate response, even on a cold local-device bootstrap.
  let prepCancelled=false;
  const prep=node('dialog',null,'pb1201IntakeLoading');
  prep.setAttribute('dir','rtl');prep.setAttribute('aria-label',intakeTitle);
  const prepBox=node('div',null,'pb1201IntakeLoadingInner');
  prepBox.append(node('h2',intakeTitle),node('p','در حال بررسی کامپیوتر اصلی و دریافت اطلاعات سفارش…'));
  const prepCancel=node('button','انصراف');prepCancel.type='button';
  prepCancel.onclick=()=>{prepCancelled=true;prep.close();};
  prep.addEventListener('cancel',()=>{prepCancelled=true;});
  prepBox.append(prepCancel);prep.append(prepBox);document.body.append(prep);prep.showModal();
 try{
  // The toolbar already checked this device. Reuse the recent result instead of a second network round-trip.
  const cachedPrimary=primaryState===true&&Date.now()-primaryCheckedAt<45000;
  const [primary,root,data]=await Promise.all([
    cachedPrimary?Promise.resolve({registered:true,isThisDevice:true}):api('/api/lab/download-device'),
    provider.root(),api('/api/lab/delegated-orders/bootstrap'+(/^\/lab\/album(?:s|[-/]|$)/.test(location.pathname)?'':'?mode=print'))
  ]);
  primaryState=!!(primary.registered&&primary.isThisDevice);primaryCheckedAt=Date.now();
  if(!primary.registered||!primary.isThisDevice)throw Error(primary.registered?errors.not_primary_download_device:errors.download_device_not_registered);
  if(!root)throw Error('مسیر همیشگی ذخیره هنوز تنظیم نشده است. آن را در تنظیمات «ذخیره روی هارد» لابراتوار مشخص کن.');
  directory=root;bootstrap=data;
 }catch(e){loadError=e;}
 finally{if(prep.open)prep.close();prep.remove();opening=false;if(launch){launch.disabled=false;launch.textContent=intakeTitle;}}
  if(prepCancelled)return;
 const modal=node('dialog',null,'pb1137Intake');if(albumMode)modal.classList.add('pb1184AlbumMode');modal.setAttribute('dir','rtl');modal.setAttribute('aria-label',intakeTitle);active=modal;
 const head=node('header');head.append(node('h2',intakeTitle));const close=node('button','×','pb1469IntakeClose');close.type='button';close.setAttribute('aria-label','بستن پنجره');close.title='بستن پنجره';head.append(close);modal.append(head);
 const previews=[];
 const message=node('p','کپی عکس: مبدأ باقی می‌ماند. انتقال عکس: فقط پس از ذخیرهٔ کامل و ثبت موفق سفارش، عکس‌های انتخاب‌شده از مبدأ حذف می‌شوند.');modal.append(message);
 const form=node('form');form.method='dialog';modal.append(form);
 const error=node('p',null,'pb1137Error');error.setAttribute('role','status');form.append(error);
 const workspace=node('div',null,'pb1178IntakeWorkspace'),editor=node('section',null,'pb1178IntakeEditor'),bill=node('aside',null,'pb1178IntakeBill');
 editor.setAttribute('aria-label','مشخصات سفارش و عکس‌ها');bill.setAttribute('aria-label','پیش‌فاکتور سفارش');
 workspace.append(editor,bill);form.append(workspace);
 const billTitle=node('div',null,'pb1178BillTitle');billTitle.append(node('strong','پیش‌فاکتور'),node('small','صرفاً برآورد؛ فاکتور قطعی در آماده تحویل صادر می‌شود.'));
 const billCustomer=node('p','عکاسی انتخاب نشده','pb1178BillCustomer');
 const billRows=node('div',null,'pb1178BillRows');billRows.setAttribute('aria-live','polite');
 const billFoot=node('div',null,'pb1178BillFoot');const billTotals=node('div',null,'pb1178BillTotals');
 const billNotice=node('p','مبلغ نهایی پس از تعیین تعرفه و انتخاب «آماده تحویل» قطعی می‌شود.','pb1178BillNotice');
 billFoot.append(billTotals,billNotice);bill.append(billTitle,billCustomer,billRows,billFoot);
 const closeModal=()=>{previews.forEach(url=>URL.revokeObjectURL(url));modal.close();modal.remove();active=null;};close.onclick=closeModal;modal.addEventListener('cancel',e=>{if(form.dataset.busy){e.preventDefault();return;}previews.forEach(url=>URL.revokeObjectURL(url));active=null;modal.remove();});document.body.append(modal);
 if(loadError){error.textContent=loadError.message;modal.showModal();return;}
 const settings=node('div',null,'pb1137Settings pb1139EntryRow');editor.append(settings);
 // Opening the order form must not wait for a lab-wide accounting aggregation.
 const customers=customerMenu(settings,bootstrap.customers||(bootstrap.customers=[]),
  payload=>api('/api/lab/delegated-customers',payload),
  customerId=>api('/api/lab/delegated-customers/'+customerId+'/resend-invitation',{}),
  customerId=>api('/api/lab/delegated-customers/'+customerId+'/account-summary'),
  (customerId,payload)=>api('/api/lab/delegated-customers/'+customerId+'/adjust-initial-debt',payload),
  (customerId,payload)=>api('/api/lab/delegated-customers/'+customerId+'/send-invoice-sms',payload));
 const sizes=(albumMode?(bootstrap.album?.sizes||[]):(bootstrap.printSizes||[])).map(s=>[s.id,s.label]);
 const defaultSize=field(settings,albumMode?'سایز آلبوم':'سایز چاپ',select([['','انتخاب سایز'],...sizes]));
 const paperOptions=[['luster','لاستر'],['silk','سیلک'],['metallic','متالیک']];
 const defaultPaper=field(settings,albumMode?'کاغذ لت‌ها':'کاغذ',select(paperOptions));
 const fileInput=node('input');fileInput.type='file';fileInput.accept='image/jpeg,image/png,image/tiff,image/webp';fileInput.multiple=true;fileInput.hidden=true;form.append(fileInput);
 const choose=node('button','انتخاب عکس‌ها');choose.type='button';choose.setAttribute('aria-label','انتخاب عکس‌ها');field(settings,'عکس‌ها',choose);choose.textContent='کپی عکس';choose.setAttribute('aria-label','کپی عکس');const movePhotos=node('button','انتقال عکس');movePhotos.type='button';movePhotos.setAttribute('aria-label','انتقال عکس');const fileActions=node('div',null,'pb1468FileActions');choose.replaceWith(fileActions);fileActions.append(choose,movePhotos);const selectPhotos=async mode=>{if(locked||submitting)return;error.textContent='';try{const files=await window.pb1466IntakeMove.pick(mode);if(files?.length){pendingFiles=files;choose.textContent='کپی عکس';movePhotos.textContent='انتقال عکس';error.textContent=files.length.toLocaleString('fa-IR')+' عکس برای '+(mode==='move'?'انتقال':'کپی')+' انتخاب شد؛ «افزودن» را بزنید.';}}catch(e){error.textContent=e.message;}};choose.onclick=()=>selectPhotos('copy');movePhotos.onclick=()=>selectPhotos('move');
 const add=node('button','＋ افزودن','pb1139Add');add.type='button';add.setAttribute('aria-label','افزودن گروه عکس');field(settings,' ',add);
 const list=node('div',null,'pb1137Files pb1139Groups');editor.append(list);
 const empty=node('p',albumMode?'سایز آلبوم را انتخاب کن و همه لت‌های آلبوم را برای همان سایز اضافه کن.':'سایز و کاغذ را انتخاب کن، عکس‌ها را اضافه کن و برای سایز بعدی همین کار را تکرار کن.','pb1139Empty');list.append(empty);
 let entries=[],groups=[],pendingFiles=[],order=null,submitting=false,locked=false,startedAt=null;
 const priceBySize=new Map((bootstrap.printSizes||[]).map(row=>[String(row.id),row]));const albumForm=albumMode?pb1184AlbumConfigurator(editor,settings,bootstrap.album||{},defaultSize,()=>entries):null;albumForm?.panel.addEventListener('pb1184-estimate',()=>refreshInvoice());
 const paperName=key=>paperOptions.find(x=>x[0]===key)?.[1]||key;
 const money=value=>Math.round(Number(value||0)).toLocaleString('fa-IR');
 function refreshInvoice(){
  billRows.replaceChildren();
  const client=bootstrap.customers?.find(c=>String(c.id)===String(customers.value));
  billCustomer.textContent=client?String(client.name||client.mobile||'عکاسی'):'عکاسی انتخاب نشده';
  if(albumMode){const q=albumForm.estimate();for(const [label,amount] of q.rows){const row=node('div',null,'pb1178BillRow');row.append(node('b',label),node('strong',amount));billRows.append(row)}if(!q.rows.length)billRows.append(node('p','فایل‌های لت آلبوم را انتخاب کن.','pb1178BillEmpty'));billTotals.replaceChildren(node('span',q.count.toLocaleString('fa-IR')+' لت · '+q.sizeLabel),node('strong',(q.missing?'جمع مبالغ مشخص: ':'برآورد: ')+money(q.total)+' تومان'));billNotice.textContent='تعرفه‌های نامشخص هنگام صدور فاکتور نهایی توسط اپراتور تعیین می‌شوند.';return;}
  let total=0,missing=0,totalPrints=0;
  for(const group of groups){
   const byPaper=new Map();
   for(const item of group.items){const k=String(item.paper||group.paper)+'|'+(item.chassis?'1':'0');byPaper.set(k,(byPaper.get(k)||0)+Math.max(1,Number(item.copies||1)));}
   for(const [key,count] of byPaper){
    const [paper,chassis]=key.split('|');const prices=priceBySize.get(String(group.size));
    const price=prices?.[paper],chassisPrice=chassis==='1'?prices?.chassis:0;
    const valid=price!=null&&Number.isFinite(Number(price))&&Number(price)>=0&&chassisPrice!=null&&Number.isFinite(Number(chassisPrice));
    const amount=valid?(Number(price)+Number(chassisPrice))*count:0;
    total+=amount;totalPrints+=count;if(!valid)missing++;
    const row=node('div',null,'pb1178BillRow');row.append(node('b',String(group.label)+' · '+paperName(paper)+(chassis==='1'?' · شاسی':'')),node('span',count.toLocaleString('fa-IR')+' چاپ'),node('strong',valid?money(amount)+' تومان':'تعرفه نامشخص'));billRows.append(row);
   }
  }
  if(!groups.length)billRows.append(node('p','هنوز عکس یا سایزی به سفارش اضافه نشده است.','pb1178BillEmpty'));
  const count=node('span','تعداد فایل: '+entries.length.toLocaleString('fa-IR')+' · تعداد چاپ: '+totalPrints.toLocaleString('fa-IR'));
  const amount=node('strong',(missing?'جمع قیمت‌های مشخص: ':'جمع پیش‌فاکتور: ')+money(total)+' تومان');
  billTotals.replaceChildren(count,amount);
  billNotice.textContent=missing?'برای '+missing.toLocaleString('fa-IR')+' ردیف هنوز تعرفه مشخص نیست؛ قیمت نهایی در آماده تحویل تعیین می‌شود.':'این مبلغ پیش‌فاکتور است؛ فاکتور قطعی فقط بعد از «آماده تحویل» صادر می‌شود.';
 }
 customers.onChange=refreshInvoice;
 fileInput.onchange=()=>{pendingFiles=[...fileInput.files];choose.textContent=pendingFiles.length?`${pendingFiles.length.toLocaleString('fa-IR')} عکس انتخاب شد`:'انتخاب عکس‌ها';};
 function syncEntries(){entries=groups.flatMap(x=>x.items);refreshInvoice();}
 async function appendFiles(group,files,size,paper){
  const additions=[];
  for(const file of files){const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');const item=group.items.find(x=>x.hash===hash)||additions.find(x=>x.hash===hash);if(item){if(albumMode)throw Error('این فایل قبلاً به لت‌های آلبوم اضافه شده است.');additions.push({existing:item,sourceFile:file});}else additions.push({file,hash,size,paper,copies:1});}
  const counts=new Map();for(const item of additions){const target=item.existing||item;counts.set(target,(counts.get(target)||target.copies||1)+(item.existing?1:0));}for(const count of counts.values())if(count>99)throw Error('تعداد چاپ هر عکس حداکثر ۹۹ است.');
  for(const item of additions){if(item.existing){window.pb1466IntakeMove.track(item.existing,item.sourceFile);item.existing.copies++;continue;}item.id=crypto.randomUUID();item.preview=URL.createObjectURL(item.file);previews.push(item.preview);group.items.push(item);}
 }
 function renderGroups(){
  list.replaceChildren();defaultSize.disabled=albumMode&&groups.length>0;if(!groups.length){list.append(empty);refreshInvoice();return;}
  for(const group of groups){
   const card=node('section',null,'pb1139Group');card.dataset.groupId=group.id;
   const head=node('div',null,'pb1139GroupHead');head.append(node('b',`${group.label} · ${group.paperLabel}`),node('span',`${group.items.length.toLocaleString('fa-IR')} عکس`));
   const toggle=node('button',group.collapsed?'▾':'▴','pb1141Collapse');toggle.type='button';toggle.setAttribute('aria-label',group.collapsed?'باز کردن':'جمع کردن');toggle.setAttribute('aria-expanded',String(!group.collapsed));toggle.onclick=()=>{group.collapsed=!group.collapsed;renderGroups();};head.append(toggle);
   const input=node('input');input.type='file';input.accept=fileInput.accept;input.multiple=true;input.hidden=true;
   const more=node('button','افزودن عکس');more.type='button';more.textContent='کپی عکس';const moveMore=node('button','انتقال عکس');moveMore.type='button';const addMore=async mode=>{if(locked||submitting)return;try{const files=await window.pb1466IntakeMove.pick(mode);if(!files?.length)return;busy(true);await appendFiles(group,files,group.size,group.paper);syncEntries();renderGroups();error.textContent='';}catch(e){error.textContent=e.message;}finally{busy(false);}};more.onclick=()=>addMore('copy');moveMore.onclick=()=>addMore('move');head.append(moveMore);input.onchange=async()=>{if(locked||submitting)return;busy(true);try{await appendFiles(group,input.files,group.size,group.paper);syncEntries();renderGroups();error.textContent='';}catch(e){error.textContent=e.message;}finally{busy(false);}};head.append(more,input);
   const remove=node('button','حذف گروه');remove.type='button';remove.onclick=()=>{if(locked||submitting)return;groups=groups.filter(x=>x!==group);group.items.forEach(x=>URL.revokeObjectURL(x.preview));syncEntries();renderGroups();};head.append(remove);card.append(head);
   const photos=node('div',null,'pb1139GroupPhotos');photos.hidden=!!group.collapsed;
   for(const item of group.items){
    const photo=node('figure');const frame=node('div',null,'pb1181IntakeFrame');const image=node('img');image.src=item.preview;image.alt=item.file.name;frame.append(image);photo.append(frame,node('figcaption',item.file.name));
    const actions=node('div',null,'pb1141PhotoActions');photo.append(actions);const paper=select(paperOptions);paper.className='pb1180IntakePaper';paper.setAttribute('aria-label','نوع کاغذ عکس');actions.append(paper);paper.value=item.paper;paper.onchange=()=>{if(!locked&&!submitting){item.paper=paper.value;refreshInvoice();}};
    const del=node('button',null,'pb1141DeletePhoto');del.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/></svg>';del.type='button';del.setAttribute('aria-label','حذف عکس');del.title='حذف عکس';del.onclick=()=>{if(locked||submitting)return;URL.revokeObjectURL(item.preview);group.items=group.items.filter(x=>x!==item);if(!group.items.length)groups=groups.filter(x=>x!==group);syncEntries();renderGroups();};del.classList.add('pb1181DeleteOverlay');frame.append(del);
    const chassisLabel=node('label',null,'pb1181ChassisToggle');const chassisInput=node('input');chassisInput.type='checkbox';chassisInput.checked=!!item.chassis;chassisInput.setAttribute('aria-label','شاسی');chassisInput.onchange=()=>{if(locked||submitting)return;item.chassis=chassisInput.checked;refreshInvoice();};chassisLabel.append(chassisInput,node('span','شاسی'));if(!albumMode)actions.append(chassisLabel);
    const quantity=node('div',null,'pb1142Quantity');
    const minus=node('button','−'),count=node('input'),plus=node('button','＋');minus.type=plus.type='button';minus.setAttribute('aria-label','کم کردن تعداد چاپ');plus.setAttribute('aria-label','افزایش تعداد چاپ');count.type='number';count.min='1';count.max='99';count.step='1';count.value=item.copies;count.setAttribute('aria-label','تعداد چاپ');
    const setCopies=value=>{if(locked||submitting)return;const n=Number(value);if(Number.isInteger(n)&&n>=1&&n<=99)item.copies=n;count.value=item.copies;refreshInvoice();};minus.onclick=()=>setCopies(item.copies-1);plus.onclick=()=>setCopies(item.copies+1);count.onchange=()=>setCopies(count.value);quantity.append(minus,count,plus);if(!albumMode)photo.append(quantity);photos.append(photo);
   }card.append(photos);list.append(card);
  }
  refreshInvoice();
 }
 add.onclick=async()=>{
  if(locked||submitting)return;
  if(!defaultSize.value||!pendingFiles.length){error.textContent='سایز چاپ و عکس‌های این گروه را انتخاب کن.';return;}
  busy(true);
  try{
   if(albumMode&&groups.length&&groups[0].size!==defaultSize.value)throw Error('برای هر سفارش آلبوم فقط یک سایز مجاز است.');let group=groups.find(x=>x.size===defaultSize.value);const fresh=!group;
   group ||= {size:defaultSize.value,paper:defaultPaper.value,id:crypto.randomUUID(),label:sizes.find(x=>x[0]===defaultSize.value)?.[1]||'',paperLabel:paperOptions.find(x=>x[0]===defaultPaper.value)[1],items:[]};
   await appendFiles(group,pendingFiles,defaultSize.value,defaultPaper.value);if(fresh)groups.push(group);group.collapsed=false;syncEntries();pendingFiles=[];fileInput.value='';choose.textContent='انتخاب عکس‌ها';error.textContent='';renderGroups();
  }catch(e){error.textContent=e.message;}finally{busy(false);}
 };
 const submit=node('button','ثبت سفارش و ذخیره پیش‌فاکتور', 'pb1137Submit');submit.type='submit';form.append(submit);
 const clientOrderId=crypto.randomUUID();
 function busy(value){submitting=value;form.dataset.busy=value?'1':'';for(const control of modal.querySelectorAll('button,input,select'))control.disabled=value||locked&&control!==submit&&control!==close;if(albumMode&&groups.length)defaultSize.disabled=true;}
 form.onsubmit=async e=>{
  e.preventDefault();if(submitting)return;
  if(!customers.value){error.textContent='مشتری و شماره موبایل معتبر را مشخص کن.';return;}
  if(pendingFiles.length){error.textContent='عکس‌های انتخاب‌شده را با دکمهٔ افزودن به سفارش اضافه کن.';return;}
  if(!entries.length||entries.some(x=>!x.size||x.file.size<=0)){error.textContent='عکس‌ها و سایز چاپ هر عکس را مشخص کن.';return;}
  let albumData=null;if(albumMode)try{albumData=albumForm.collect()}catch(e){error.textContent=e.message;return;}
  busy(true);error.textContent='در حال ذخیره روی هارد و ثبت سفارش…';
  try{
   if(!await provider.permission(directory))throw Error('اجازهٔ نوشتن در مسیر همیشگی داده نشد؛ سفارش ارسال نشد.');
   // Reserve the existing draft first so the normal folders include the real order number.
   locked=true;startedAt ||= new Date().toISOString();
   if(!order)order=await api('/api/lab/delegated-orders',{clientOrderId,localOnly:true,mode:albumMode?'album':'print',albumData,delivery:'pickup',priority:'normal',customerId:customers.value});
   for(const item of entries){if(item.registered)continue;const result=await api('/api/lab/delegated-orders/'+order.orderId+'/files/presign',{clientFileId:item.id,name:item.file.name,relativePath:item.file.name,bytes:item.file.size,contentType:item.file.type,printSizeId:item.size,printType:item.paper,printCopies:item.copies,chassis:!!item.chassis,localOnly:true});if(result.storageMode!=='device-local'||result.uploadUrl)throw Error('سفارش محلی تأیید نشد؛ هیچ عکسی به سرور ارسال نشد.');item.registered=true;item.fileId=result.fileId;}
   const detail=await api('/api/lab/orders/'+order.orderId);
   detail.order._local_download_started_at=startedAt;
   const targets=[],names=new Set();
   for(const item of entries){const file=detail.files.find(f=>f.id===item.fileId);if(!file)throw Error('اطلاعات عکس در سفارش پیدا نشد.');const target=await provider.target(directory,detail,file);const key=target.dir.name+'/'+provider.fileName(file.original_name,'file');if(names.has(key))throw Error('نام دو عکس در مسیر چاپ یکسان است. نام فایل‌ها را متفاوت انتخاب کن.');names.add(key);targets.push({item,file,target});}
   await window.pb1466IntakeMove.prepare(targets);
   for(const {item,file,target} of targets){if(item.saved)continue;const saved=await provider.write(target.dir,file.original_name,item.file);item.saved=true;item.localName=saved.name;}
   await window.pb1466IntakeMove.verify(targets);
   provider.saveResume(order.orderId,{startedAt,done:entries.length,total:entries.length,loadedBytes:entries.reduce((n,x)=>n+x.file.size,0),totalBytes:entries.reduce((n,x)=>n+x.file.size,0),completedIds:entries.map(x=>x.fileId),remaining:0,lastError:null,localComplete:true});
   const result=await api('/api/lab/delegated-orders/'+order.orderId+'/submit',{sendInvoiceSms:customers.sendInvoiceSms===true});
   /* PB1465 intake submitted event */window.dispatchEvent(new CustomEvent('photobridge-lab-orders-changed',{detail:{orderId:order.orderId,labId:bootstrap.lab?.id,mode:albumMode?'album':'print'}}));
   const moveResult=await window.pb1466IntakeMove.finish(targets);
   form.replaceChildren(node('h3','سفارش شمارهٔ '+order.orderNumber+' ثبت شد.'),node('p',albumMode?'لت‌های آلبوم و مشخصات جلد و صحافی ثبت شد. فایل‌ها روی هارد اصلی قرار گرفتند.':'عکس‌ها در مسیر سفارش روی هارد ثبت شدند. وضعیت سفارش دانلودشده است؛ پیش‌فاکتور تا زمان «آماده تحویل» قطعی نمی‌شود.'));
   window.pb1466IntakeMove.report(form,targets,moveResult);
   const smsResult=result.invoiceSms;
   if(smsResult?.requested)form.append(node('p',smsResult.status==='sent'?'پیامک فاکتور همین سفارش ارسال شد.':smsResult.status==='failed'?'سفارش ثبت شد، اما پیامک فاکتور ارسال نشد؛ وضعیت پیامک را بررسی کنید.':smsResult.status==='dispatching'?'سفارش ثبت شد؛ نتیجهٔ ارسال پیامک هنوز در حال بررسی است.':'درخواست پیامک ذخیره شد؛ پس از صدور فاکتور همین سفارش ارسال می‌شود.','pb1367InvoiceSmsResult'));
   const done=node('button','نمایش سفارش');done.type='button';done.onclick=()=>{closeModal();location.assign(albumMode?'/lab/album':'/lab/orders');};form.append(done);close.disabled=false;form.dataset.busy='';submitting=false;
  }catch(e){busy(false);error.textContent=e.name==='NotAllowedError'?'اجازهٔ ذخیره روی هارد داده نشد؛ سفارش ارسال نشد.':e.message;}
 };
 refreshInvoice();
 modal.showModal();
}
function mount(){
 const provider=storage();
 const host=document.querySelector('.labRoleWorkspace main')||document.querySelector('main.labMain');
 const old=document.getElementById('pb1137LocalIntakeButton');
 if(host){const intro=host.querySelector('.labQueueQuickIntroV464 button');if(intro&&intro.textContent!=='دسترسی سریع')intro.textContent='دسترسی سریع';}
 /* PB1188 browser entry point stays visible; submitting still requires primary device */
 if(!/^\/lab(?:\/|$)/.test(location.pathname)||!host||!provider){old?.remove();return;}
 if(primaryState===null&&provider.deviceId())checkPrimary();
 const desktopQueue=window.matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)').matches&&/^\/lab\/(?:orders(?:\/|$)|album(?:s|[-/]|$)|print(?:\/|$))/.test(location.pathname);
 /* PB1186 native stable header target */const header=desktopQueue?document.querySelector('.labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav'):null;
 const target=header||host.querySelector('.mainQueueFilters')||host.querySelector('.ordersWorkspace');if(!target){old?.remove();return;}
 const albumTab=/^\/lab\/album(?:s|[-/]|$)/.test(location.pathname);const text=albumTab?'ثبت سفارش آلبوم حضوری':'ثبت سفارش عکس حضوری';if(old){if(old.parentElement!==target)target.append(old);if(old.textContent!==text)old.textContent=text;old.onclick=()=>open(albumTab?'album':'print');return;}const button=node('button',text,'pb1137Launch');button.id='pb1137LocalIntakeButton';button.type='button';button.onclick=()=>open(albumTab?'album':'print');
 target.append(button);
}
let primaryState=null,checking=false,primaryCheckedAt=0;
async function checkPrimary(){if(checking)return;checking=true;try{const state=await api('/api/lab/download-device');primaryState=state.registered&&state.isThisDevice;primaryCheckedAt=Date.now();}catch{primaryState=false;}finally{checking=false;schedule();}}
window.addEventListener('photobridge-auth-session-changed',()=>{primaryState=null;primaryCheckedAt=0;schedule();});
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount();});}
function boot(){mount();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener('popstate',schedule);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();



/* PB1379 walkin selection */

/* PB1379 hide disabled cover menu */

/* PB1380 no manual package */

/* PB1466 verified move intake */

/* PB1468 two explicit file actions */

/* PB1469 intake native errors */

/* PB1473 optional correction note */
