(()=>{
 'use strict';
 if(window.__PB_LAB_DESKTOP_OVERLAY__)return;
 window.__PB_LAB_DESKTOP_OVERLAY__=true;
 // R1356: No persistent floating status/sync/update bar over the native Lab UI.
 // Tray already has manual sync/update. The optional keyboard diagnostics stay
 // available, and only actual conflict records surface a small corner flag.
 const style=document.createElement('style');
 style.textContent=`
 #pbLabDesktopConflictFlag{position:fixed;left:20px;bottom:20px;top:auto;z-index:2147483000;
   min-width:48px;height:28px;padding:0 9px;border-radius:999px;border:1px solid #f0c8bc;
   background:#fff8f5;color:#aa4328;box-shadow:0 3px 14px rgba(0,0,0,.08);
   font:700 12px Vazirmatn,Tahoma,sans-serif;cursor:pointer}
 #pbLabDesktopConflictFlag[hidden]{display:none!important}
 .pbLabDesktopConflicts{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483646;
   width:min(760px,calc(100vw - 40px));max-height:min(78dvh,700px);box-sizing:border-box;overflow:auto;
   background:#fff;border:1px solid #d0d5dd;border-radius:16px;padding:22px;
   direction:rtl;font:13px/1.9 Vazirmatn,Tahoma,sans-serif;color:#344054;text-align:right;
   box-shadow:0 15px 60px rgba(0,0,0,.18)}
 .pbLabDesktopConflicts>*{direction:rtl;text-align:right}
 .pbLabDesktopConflicts h3{margin:0 0 8px;font-size:18px;color:#1d2939}
 .pbLabDesktopConflicts .pbSyncIntro{padding:12px 14px;border:1px solid #dbe7fb;border-radius:11px;background:#f5f8ff;color:#344054}
 .pbLabDesktopConflicts .pbSyncConflict{margin:12px 0;padding:12px 14px;border:1px solid #e5eaf2;border-radius:11px;background:#fbfcfe}
 .pbLabDesktopConflicts .pbSyncConflict p{margin:4px 0}
 .pbLabDesktopConflicts button{margin:4px;border:0;border-radius:8px;padding:8px 12px;
   background:#eef2ff;color:#315efb;font:inherit;cursor:pointer}
 .pbLabDesktopConflicts button:focus-visible,#pbLabDesktopConflictFlag:focus-visible{outline:2px solid #315efb}
 .pbLabDesktopConflicts{padding:0 22px 22px;border-color:#e1e7f2;background:#fff;isolation:isolate}
 .pbLabDesktopConflicts .pbSyncHeader{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:16px;background:#fff;padding:18px 0 14px;border-bottom:1px solid #edf0f6;margin-bottom:14px}
 .pbLabDesktopConflicts .pbSyncHeader h3{margin:0;font-weight:800}
 .pbLabDesktopConflicts .pbSyncConflict{padding:18px;margin-top:16px;overflow-wrap:anywhere}
 .pbLabDesktopConflicts .pbSyncConflict strong{font-size:15px;color:#213451}
 .pbLabDesktopConflicts .pbSyncActions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;padding-top:12px;border-top:1px solid #e7edf7}
 .pbLabDesktopConflicts .pbSyncActions button{margin:0;min-height:40px;padding:9px 14px}
 .pbSyncArchiveConfirm{direction:rtl;text-align:right;font:13px/2 Vazirmatn,Tahoma,sans-serif;color:#243650;width:min(480px,calc(100vw - 32px));border:1px solid #e1e7f2;border-radius:20px;padding:24px;box-shadow:0 24px 80px #162b4a30}
 .pbSyncArchiveConfirm::backdrop{background:#12233f66;backdrop-filter:blur(3px)}
 .pbSyncArchiveConfirm h3{margin:0 0 12px;font-size:18px}.pbSyncArchiveConfirm p{color:#65758e;margin:8px 0}
 .pbSyncArchiveConfirm footer{display:flex;gap:10px;margin-top:22px}.pbSyncArchiveConfirm button{flex:1;font:700 13px Vazirmatn,Tahoma,sans-serif;border:0;border-radius:11px;min-height:44px;padding:8px 12px;cursor:pointer;background:#f0f3f9;color:#53647e}.pbSyncArchiveConfirm .primary{background:#315efb;color:#fff}
 body:has(.pb1137Intake) #pbLabDesktopConflictFlag,body:has(.pbLabDesktopConflicts) #pbLabDesktopConflictFlag{display:none!important}
 /* Keep the website's photo-card controls; only constrain the native layout. */
 .pb1137Intake .pb1139GroupPhotos figure{box-sizing:border-box!important;min-width:0!important}
 .pb1137Intake .pb1142Quantity{display:flex!important;align-items:center!important;gap:4px!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
 .pb1137Intake .pb1142Quantity>span{flex:1 1 auto!important;min-width:0!important}
 .pb1137Intake .pb1142Quantity input{flex:0 1 44px!important;width:44px!important;min-width:24px!important;box-sizing:border-box!important}
 .pb1137Intake .pb1142Quantity button{flex:0 0 28px!important;width:28px!important;min-width:28px!important;padding:0!important;box-sizing:border-box!important}
 .pbLabIntakeActionBadge{display:none!important}
 .pb1137Intake.pbLabDesktopIntakeDone{width:min(540px,calc(100vw - 32px))!important;height:auto!important;max-height:78dvh!important;min-height:0!important;overflow:auto!important;padding:16px!important;gap:8px!important;background:#fff!important;border-radius:16px!important}
 .pb1137Intake.pbLabDesktopIntakeDone>header{padding-bottom:8px!important}
 .pb1137Intake.pbLabDesktopIntakeDone>p,.pb1137Intake.pbLabDesktopIntakeDone .pb1178IntakeWorkspace{display:none!important}
 .pb1137Intake.pbLabDesktopIntakeDone>form{flex:0 1 auto!important;min-height:0!important;overflow:visible!important;margin:0!important;gap:8px!important}
 .pb1137Intake.pbLabDesktopIntakeDone>form>h3{margin:0;padding:11px 12px;border:1px solid #cdebd6;border-radius:11px;background:#f2fbf5;color:#17663a;font-size:15px;line-height:1.7}
 .pb1137Intake.pbLabDesktopIntakeDone>form>p,.pb1137Intake.pbLabDesktopIntakeDone .pb1466MoveResult{margin:0;padding:9px 11px;border:1px solid #e4eaf3;border-radius:10px;background:#f8faff;font-size:11px;line-height:1.7}
 .pb1137Intake.pbLabDesktopIntakeDone>form>button{min-height:38px;margin:0!important;border-radius:10px;background:#315efb;color:white;font-weight:800}
 `;
 document.head.append(style);

 // A single manual order can be assembled from both pickers. Keep each
 // selection and its copy/move action until the operator adds the batch.
 const pickedModes=new WeakMap(),previewModes=new Map();let selectionBatch=[],selectionScope=false;
 const nativeCreateObjectURL=URL.createObjectURL.bind(URL);
 URL.createObjectURL=function(value){const url=nativeCreateObjectURL(value),mode=value&&pickedModes.get(value);if(mode)previewModes.set(url,mode);return url;};
 function installIntakePicker(){
   const picker=window.pb1466IntakeMove;if(!picker||picker.__pbDesktopBatchPatch)return;
   const original=picker.pick.bind(picker);
   picker.pick=async mode=>{const combine=selectionScope;selectionScope=false;const files=await original(mode);if(!files?.length)return files;
     for(const file of files){if(!pickedModes.has(file))pickedModes.set(file,mode==='move'?'move':'copy');}
     if(combine){selectionBatch.push(...files);return selectionBatch.slice();}
     return files;
   };
   Object.defineProperty(picker,'__pbDesktopBatchPatch',{value:true});
 }
 function decorateIntake(root=document){
   installIntakePicker();
   for(const modal of root.querySelectorAll?.('.pb1137Intake')||[]){
     if(modal.querySelector('form>h3'))modal.classList.add('pbLabDesktopIntakeDone');
     modal.querySelectorAll('.pbLabIntakeActionBadge').forEach(badge=>badge.remove());
   }
 }
 document.addEventListener('click',event=>{
   installIntakePicker();const button=event.target?.closest?.('button');if(!button)return;
   if(button.closest('.pb1468FileActions'))selectionScope=true;
   else if(button.classList.contains('pb1139Add')||button.closest('.pb1139GroupHead')&&/^(کپی عکس|انتقال عکس)$/.test(button.textContent.trim())){selectionBatch=[];selectionScope=false;}
 },true);
 document.addEventListener('click',async event=>{
   const control=event.target?.closest?.('button');
   if(!window.pbNativeFolder||!control||!/^انتخاب مسیر$|^تغییر مسیر$/.test(control.textContent.trim()))return;
   event.preventDefault();event.stopImmediatePropagation();
   try{const root=await window.pbNativeFolder.choose();document.querySelectorAll('span,p,small').forEach(el=>{if(el.childElementCount===0&&/هنوز پوشه.*انتخاب نشده/.test(el.textContent))el.textContent=root.displayPath||root.name;if(el.childElementCount===0&&el.textContent.trim()==='download_device_registration_offline'){el.textContent='مسیر محلی فعال است.';el.style.color='#18875a';}});const panel=dialog('پوشهٔ محلی ذخیره شد');element('p',root.displayPath||root.name,panel);element('p','مسیر محلی فعال است و همین حالا برای ذخیرهٔ عکس‌ها قابل استفاده است. تنظیم سیستم اصلی سایت مستقل از کار محلی است.',panel);}
   catch(error){if(error.name!=='AbortError'){const panel=dialog('انتخاب پوشه انجام نشد');element('p',error.message,panel);}}
 },true);
 const intakeObserver=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes||[]){if(node.nodeType===1)decorateIntake(node)}decorateIntake();});
 intakeObserver.observe(document.documentElement,{childList:true,subtree:true});
 decorateIntake();
 const indicator=document.createElement('button');
 indicator.id='pbLabDesktopConflictFlag';indicator.type='button';
 indicator.textContent='بررسی همگام‌سازی';indicator.hidden=true;
 indicator.setAttribute('aria-label','بررسی همگام‌سازی سفارش‌ها و اطلاعات مالی');
 indicator.title='بررسی وضعیت سفارش‌ها و امور مالی — Ctrl+Shift+S';
 document.body.append(indicator);
 let state=null,loading=false,busy=false,lastOrderRevision=null,orderRefreshTimer=null;
 function refreshOrders(){clearTimeout(orderRefreshTimer);orderRefreshTimer=setTimeout(()=>window.dispatchEvent(new CustomEvent('photobridge-lab-orders-changed')),100);}
 const statusRow=document.createElement('div');statusRow.id='pbLabDesktopStatusRow';const statusStyle=document.createElement('style');statusStyle.textContent='#pbLabDesktopStatusRow{display:flex;justify-content:center;align-items:center;flex:1 1 auto;min-width:0;box-sizing:border-box;padding:2px 6px;position:relative}.pb1148SecondaryHeader:has(>#pbLabDesktopStatusRow){flex-wrap:wrap}.pbLabConnectionHeader{display:flex;align-items:center;justify-content:center;min-height:42px;width:100%;box-sizing:border-box;background:white;border-bottom:1px solid #edf0f7}';document.head.append(statusStyle);const connection=document.createElement('span');statusRow.append(connection);connection.id='pbLabDesktopConnection';connection.setAttribute('role','status');connection.style.cssText='font:700 12px Vazirmatn,Tahoma;white-space:nowrap;padding:6px 10px;border-radius:9px;flex-shrink:0';
 function showConnection(){const allowed=/^\/lab\/(?:orders(?:\/|$)|print(?:\/|$)|albums?(?:[-/]|$)|archive(?:\/|$)|finance(?:\/|$))/.test(location.pathname);let header=allowed?document.querySelector('.labRoleWorkspace .pb1148SecondaryHeader'):null;let fallback=document.querySelector('.pbLabConnectionHeader');if(allowed&&!header){const first=document.querySelector('.labRoleWorkspace .labSingleHeader');if(first){if(!fallback){fallback=document.createElement('nav');fallback.className='pbLabConnectionHeader';fallback.setAttribute('aria-label','وضعیت اتصال برنامه');first.after(fallback);}header=fallback;}}else fallback?.remove();if(header){if(statusRow.parentElement!==header)header.append(statusRow);}else statusRow.remove();const connected=state?.internetConnected;const label='PhotoBridge Lab '+(state?.nativeVersion||'')+' · '+(connected===true?'آنلاین · متصل به اینترنت':connected===false?'آفلاین · بدون اتصال به اینترنت':'در حال بررسی اتصال');if(connection.textContent!==label)connection.textContent=label;connection.style.background=connected?'#e8f7ee':'#fff3e7';connection.style.color=connected?'#17653b':'#9a4700';}
 new MutationObserver(showConnection).observe(document.body,{childList:true,subtree:true});window.addEventListener('popstate',showConnection);
 const date=v=>v?new Date(v).toLocaleString('fa-IR'):'ثبت نشده';
 function refreshIndicator(){
   const n=(state?.conflicts?.length||0)+(state?.localOrders?.length||0)+(state?.pending||0)+(state?.localBusiness?.pending||0);
   indicator.hidden=!state?.signedIn||!n;
   indicator.textContent='بررسی همگام‌سازی';
   indicator.title=n.toLocaleString('fa-IR')+' تغییر سفارش یا مالی نیازمند بررسی — Ctrl+Shift+S';
 }
 async function refresh(){
   if(loading)return state;loading=true;
   try{
     const response=await fetch('/desktop/status',{cache:'no-store'});
     if(response.ok){state=await response.json();const revision=String(state.revision??'')+'|'+String(state.report?.finishedAt||'');if(lastOrderRevision!==null&&revision!==lastOrderRevision)refreshOrders();lastOrderRevision=revision;showConnection();}
   }catch{}finally{loading=false;refreshIndicator()}
   return state;
 }
 function element(tag,text,parent){const node=document.createElement(tag);node.textContent=text;parent.append(node);return node}
 function button(text,parent,action){const b=element('button',text,parent);b.type='button';b.onclick=action;return b}
 function dialog(title){
   document.querySelectorAll('.pbLabDesktopConflicts').forEach(p=>p.remove());
   const panel=document.createElement('section');panel.className='pbLabDesktopConflicts';
   panel.setAttribute('role','dialog');panel.setAttribute('aria-label',title);
   panel.tabIndex=-1;
   const header=element('header','',panel);header.className='pbSyncHeader';
   element('h3',title,header);
   button('بستن',header,()=>panel.remove());
   document.body.append(panel);panel.focus();return panel;
 }
 function confirmArchive(context){
   return new Promise(resolve=>{
     const previous=document.activeElement,modal=document.createElement('dialog');modal.className='pbSyncArchiveConfirm';modal.setAttribute('aria-labelledby','pbSyncArchiveTitle');
     element('h3','بایگانی مورد بررسی‌شده',modal).id='pbSyncArchiveTitle';
     element('p',context?.title||'تغییر سفارش یا امور مالی',modal);
     element('p','آیا نتیجهٔ این تغییر را در صفحهٔ مربوط بررسی کرده‌اید؟',modal);
     element('p','این کار فقط هشدار را بایگانی می‌کند؛ سابقه حفظ می‌شود و هیچ تغییری روی سرور ثبت یا لغو نمی‌شود. اگر تغییر ثبت نشده، آن را از صفحهٔ مربوط دوباره انجام دهید.',modal);
     const footer=element('footer','',modal);let settled=false;
     const finish=value=>{if(settled)return;settled=true;modal.close();modal.remove();previous?.focus?.();resolve(value);};
     button('بله، بررسی کردم؛ بایگانی',footer,()=>finish(true)).className='primary';
     const cancel=button('بازگشت',footer,()=>finish(false));
     modal.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
     document.body.append(modal);modal.showModal();cancel.focus();
   });
 }
 async function syncNow(){
   if(busy)return;busy=true;
   try{const response=await fetch('/desktop/sync',{method:'POST',cache:'no-store'});const result=await response.json().catch(()=>({error:'server_unavailable'}));if(result&&typeof result==='object')state={...(state||{}),report:result};}
   catch{state={...(state||{}),report:{ok:false,error:'server_unavailable'}}}
   finally{busy=false;await refresh()}
 }
 function syncErrorText(code){return ({legacy_policy_review:'این تغییر از نسخهٔ قبلی باقی مانده است؛ برای جلوگیری از بازنویسی سند مشترک، ارسال خودکار آن متوقف است و باید با سایت تطبیق داده شود.',shared_document_requires_online:'سند مشترک در حالت آفلاین فقط قابل مشاهده و چاپ است.',offline_import_pending:'نتیجهٔ انتقال هنوز مشخص نیست؛ تا بررسی آنلاین، سند قفل می‌ماند.',login_required:'نشست ورود برنامه معتبر نیست؛ خارج شو و دوباره وارد شو تا اتصال همگام‌سازی تازه شود.',internet_offline:'اینترنت در دسترس نیست؛ با وصل‌شدن دوباره، همگام‌سازی خودکار شروع می‌شود.',server_unavailable:'سرور پاسخ نداده است؛ برنامه با تلاش بعدی دوباره همگام می‌کند.',sync_no_data:'اتصال برقرار شد، اما هیچ‌کدام از اطلاعات برای همگام‌سازی دریافت نشد. اتصال سرور را بررسی کن؛ تاریخ موفق قبلی حفظ شده است.',partial_sync:'بخشی از اطلاعات دریافت شد و بخشی پاسخ نداد؛ برنامه دوباره تلاش می‌کند.',sync_internal_error:'همگام‌سازی در برنامه با خطای داخلی متوقف شد؛ برنامه را یک‌بار ببند و دوباره باز کن.',subscription_unverified:'اعتبار برنامه هنوز از سرور تأیید نشده است؛ اتصال اینترنت را بررسی کن.'})[code]||'همگام‌سازی کامل نشد؛ برنامه دوباره تلاش می‌کند.'}
 function conflictTitle(x){
   const u=String(x.url||'');
   if(/\/invoices\/manual(?:\?|$)/.test(u))return 'ثبت فاکتور';
   if(/\/finance\/payments(?:\?|$)/.test(u))return 'ثبت دریافت';
   if(/\/customer-adjustments(?:\?|$)/.test(u))return 'اصلاح بدهی یا اعتبار';
   if(/\/finance\/(?:expenses|corrections)(?:\?|$)/.test(u))return 'ثبت عملیات مالی';
   if(/\/orders(?:\/|\?|$)/.test(u))return 'ثبت یا تغییر سفارش';
   return 'تغییر سفارش یا امور مالی';
 }
 function retryIsSafe(x){
   const u=String(x.url||''),m=String(x.method||'').toUpperCase();
   return m==='POST'&&/^\/api\/lab\/(?:invoices\/manual|finance\/(?:payments|customer-adjustments|expenses|corrections))$/.test(u)
     ||m==='PUT'&&(/^\/api\/lab\/finance\/customer-settings$/.test(u)||/^\/api\/lab\/orders\/[0-9a-f-]{36}\/invoice-pricing$/i.test(u));
 }
 function conflictHelp(x){
   if(x.error?.error==='delivery_unknown')return 'ارتباط هنگام ارسال قطع شده و برنامه مطمئن نیست سرور این تغییر را ثبت کرده یا نه. برای جلوگیری از ثبت تکراری، این مورد خودکار دوباره ارسال نمی‌شود. ابتدا صفحهٔ مربوط به سفارش یا امور مالی را بازخوانی کنید.';
   if(Number(x.error?.httpStatus)===409)return 'اطلاعاتی که روی سرور ثبت شده با این تغییر همزمان نیست. صفحهٔ مربوط به سفارش یا امور مالی را بازخوانی کنید تا وضعیت قطعی را ببینید.';
   return 'سرور این تغییر را نپذیرفته است. جزئیات را از صفحهٔ مربوط به سفارش یا امور مالی بررسی کنید؛ برنامه آن را بی‌صدا حذف یا دوباره ثبت نمی‌کند.';
 }
 async function openSync(){
   await refresh();const panel=dialog('وضعیت سفارش‌ها و همگام‌سازی');
   const s=state||{},conflicts=Array.isArray(s.conflicts)?s.conflicts:[];
   if(s.localBusiness){element('p','اسناد مستقل آفلاین روی دستگاه قابل استفاده‌اند؛ اسناد مشترک هنگام قطع اینترنت فقط قابل مشاهده و چاپ‌اند. '+Number(s.localBusiness.pending||0).toLocaleString('fa-IR')+' عملیات هنوز با سایت همگام نشده است.',panel).className='pbSyncIntro';
    for(const event of s.localBusiness.syncIssues||s.localBusiness.conflicts||[]){const area=element('section','',panel);area.className='pbSyncConflict';const c=event.context||{};element('strong',(c.title||'سند محلی')+(c.number?' · '+c.number:''),area);if(c.customer)element('p','طرف حساب: '+c.customer,area);if(c.amount!=null)element('p','مبلغ: '+Number(c.amount).toLocaleString('fa-IR')+' تومان',area);const code=event.error?.code||'sync_failed';element('p',event.id?.startsWith('storage:')?'تطبیق پوشهٔ محلی با شمارهٔ سایت کامل نشده است. اتصال هارد و مسیر را بررسی کنید. فایل موجود با محتوای متفاوت بازنویسی نمی‌شود.':code==='invoice_amount_conflict'?'مبلغ سند محلی با فاکتور سایت تفاوت دارد. هر دو را بررسی کنید؛ ثبت محلی تغییر نکرده است.':['download_device_not_registered','not_primary_download_device'].includes(code)?'برای همگام‌سازی، این کامپیوتر را آنلاین به‌عنوان سیستم اصلی سایت ثبت کنید. کار محلی متوقف نیست.':'همگام‌سازی این مورد انجام نشد؛ سند محلی معتبر و قابل استفاده است.',area);element('p','جزئیات ارتباط با سایت: '+code,area);const link=element('a','بازکردن بخش مربوط در سایت برای مقایسه',area);link.href='https://photobridge.ir'+(c.section||'/lab');link.target='_blank';link.rel='noopener noreferrer';button('سایت را بررسی کردم؛ تلاش دوباره',area,async()=>{const r=await fetch('/desktop/local-business/retry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:event.id,reviewed:true})});if(r.ok){panel.remove();await refresh();void openSync();}else element('p','تلاش دوباره ثبت نشد؛ دوباره وارد حساب شوید.',area);});}
   }
   if(!s.localBusiness)element('p','این پنجره فقط تغییرهای سفارش و مالی را نشان می‌دهد که سرور هنوز نتیجه‌شان را تأیید نکرده است. تغییرهای معمولی در صورت قطع اینترنت در برنامه می‌مانند و با برگشت اینترنت خودکار ارسال می‌شوند. اعلان‌ها و بررسی‌های داخلی برنامه اینجا نمایش داده نمی‌شوند.',panel).className='pbSyncIntro';
   if(!s.localBusiness)element('p',s.pending?Number(s.pending).toLocaleString('fa-IR')+' تغییر منتظر اتصال است؛ برنامه خودش دوباره تلاش می‌کند.':'تغییر منتظر اتصالی وجود ندارد.',panel);
   element('p','آخرین همگام‌سازی موفق: '+date(s.lastSync),panel);
   const syncError=s.report?.error||s.error;if(syncError)element('p',syncErrorText(syncError),panel);
   if(s.report?.finishedAt)element('p','نتیجهٔ آخرین تلاش: '+date(s.report.finishedAt)+(Number.isFinite(Number(s.report.pulledCount))?' · دریافت '+Number(s.report.pulledCount).toLocaleString('fa-IR')+' بخش':''),panel);
   if(s.report&&Number(s.report.sent||0))element('p','در آخرین تلاش '+Number(s.report.sent).toLocaleString('fa-IR')+' تغییر با موفقیت ارسال شد.',panel);
   for(const item of s.localOrders||[]){const area=element('section','',panel);area.className='pbSyncConflict';element('strong','سفارش '+item.number+' — در انتظار تأیید سرور',area);element('p','عکس‌ها: '+Number(item.files).toLocaleString('fa-IR')+' · زمان: '+date(item.createdAt),area);element('p',item.state==='editing'?'ذخیرهٔ عکس‌ها یا تکمیل سفارش هنوز تمام نشده؛ این مورد خودکار ارسال نمی‌شود.':item.state==='conflict'?'سرور این سفارش را نپذیرفته؛ عکس‌های محلی حفظ شده‌اند.':'سفارش و عکس‌ها روی دستگاه نگهداری می‌شوند؛ پس از اتصال برای تأیید سرور ارسال می‌شوند.',area);if(item.proforma){element('p','پیش‌فاکتور محلی (قطعی نیست): '+String(item.proforma.customer||''),area);element('p',String(item.proforma.rows||''),area);element('p',String(item.proforma.total||''),area);}if(item.error)element('p','جزئیات ارسال: '+item.error.code,area);}
   for(const item of s.pendingOperations||[]){const area=element('section','',panel);area.className='pbSyncConflict';element('strong',(item.context?.title||'تغییر سفارش')+' — در انتظار تأیید سرور',area);for(const f of item.context?.fields||[])element('p',f.label+': '+f.value,area);}
   if(!conflicts.length&&!s.localBusiness?.syncIssues?.length)element('p','موردی که نیاز به تصمیم شما داشته باشد وجود ندارد.',panel);
   if(s.signedIn)button('تلاش دوباره برای همگام‌سازی',panel,async()=>{await syncNow();if(panel.isConnected){panel.remove();void openSync()}});
   for(const x of conflicts.slice(0,20)){
     const area=document.createElement('section');area.className='pbSyncConflict';panel.append(area);
     element('strong',x.context?.title||conflictTitle(x),area);
     if(x.context){
       element('p','محل بررسی: '+x.context.section,area);
       for(const field of x.context.fields||[])element('p',field.label+': '+field.value,area);
       element('p','نتیجهٔ ارسال: '+x.context.reason,area);
       element('p',x.context.instruction,area);
       const link=element('a','رفتن به '+x.context.section,area);
       if(/^\/lab(?:\/|$)/.test(x.context.href||''))link.href=x.context.href;
     }
     element('p',conflictHelp(x),area);
     element('p','زمان تغییر: '+date(x.createdAt)+' · شناسهٔ پیگیری: '+String(x.id||'').slice(0,8),area);
     const details=document.createElement('details');area.append(details);element('summary','جزئیات خطا',details);
     element('p','کد پاسخ سرور: '+(x.error?.httpStatus||'پاسخی دریافت نشد')+' · کد خطا: '+String(x.error?.error||'نامشخص'),details);
     const actions=element('div','',area);actions.className='pbSyncActions';
     button('بررسی کردم؛ بایگانی این مورد',actions,async()=>{
       if(!await confirmArchive(x.context))return;
       try{const response=await fetch('/desktop/archive-conflict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:x.id,reviewed:true})});if(!response.ok)throw Error('archive_failed');panel.remove();await refresh();void openSync();}
       catch{element('p','بایگانی انجام نشد. وارد حساب شوید و دوباره وضعیت را بررسی کنید.',area);}
     });
     if(retryIsSafe(x))button('تلاش دوباره امن',actions,async()=>{
       await fetch('/desktop/retry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:x.id})});
       panel.remove();await refresh();void openSync();
     });
   }
   if(conflicts.length>20)element('p','موارد بیشتری برای بررسی وجود دارد؛ برای جلوگیری از شلوغی، اینجا فقط ۲۰ مورد نشان داده شده است.',panel);
 }
 async function openUpdate(){
   await refresh();const s=state||{};const panel=dialog('به‌روزرسانی ظاهر برنامه');
   for(const line of [
     'نسخهٔ برنامه: '+(s.nativeVersion||'در این نسخه گزارش نمی‌شود'),
     'آخرین بررسی: '+date(s.uiLastCheckedAt),
     'آخرین دریافت: '+date(s.uiDownloadedAt),
     'آخرین اعمال: '+date(s.uiAppliedAt)
   ])element('p',line,panel);
   element('p',s.updateError?'به‌روزرسانی کامل نشده است: '+s.updateError:'بررسی و دریافت تغییرات ظاهر خودکار انجام می‌شود.',panel);
   element('p','برای بررسی دستی از منوی آیکون PhotoBridge کنار ساعت ویندوز استفاده کن.',panel);
   const link=element('a','صفحهٔ دانلود برنامهٔ ویندوز لابراتوار',panel);
   link.href='https://photobridge.ir/lab-windows-download.html';link.target='_blank';link.rel='noopener noreferrer';
 }
 window.addEventListener('photobridge-local-committed',event=>{document.getElementById('pbOfflinePendingNotice')?.remove();if(/\/api\/lab\/(?:delegated-orders|orders)(?:\/|$)/.test(event.detail?.url||''))refreshOrders();void refresh();});
 window.addEventListener('photobridge-native-pending',()=>{
   let notice=document.getElementById('pbOfflinePendingNotice');if(!notice){notice=element('button','روی این دستگاه ذخیره شد؛ در انتظار تأیید سرور — مشاهده',document.body);notice.id='pbOfflinePendingNotice';notice.type='button';notice.style.cssText='position:fixed;bottom:72px;left:20px;max-width:calc(100vw - 40px);z-index:2147483000;padding:12px 16px;border:1px solid #bcd0fa;border-radius:12px;background:#eef3ff;color:#254bc5;font:700 12px Vazirmatn,Tahoma;direction:rtl;cursor:pointer';notice.onclick=()=>{notice.remove();void openSync();};}void refresh();
 });
 indicator.addEventListener('click',openSync);
 document.addEventListener('keydown',event=>{
   if(!event.ctrlKey||!event.shiftKey||event.altKey||event.metaKey)return;
   if(event.key.toLowerCase()==='s'){event.preventDefault();void openSync()}
   else if(event.key.toLowerCase()==='u'){event.preventDefault();void openUpdate()}
 });
 window.addEventListener('online',()=>{void syncNow()});
 window.addEventListener('offline',()=>{void refresh()});
 void refresh();setInterval(()=>void refresh(),3000);
})();
