(()=>{
 'use strict';
 if(window.__PB_LAB_DESKTOP_OVERLAY__)return;
 window.__PB_LAB_DESKTOP_OVERLAY__=true;
 // R1356: No persistent floating status/sync/update bar over the native Lab UI.
 // Tray already has manual sync/update. The optional keyboard diagnostics stay
 // available, and only actual conflict records surface a small corner flag.
 const style=document.createElement('style');
 style.textContent=`
 #pbLabDesktopConflictFlag{position:fixed;left:12px;top:74px;z-index:2147483000;
   min-width:48px;height:28px;padding:0 9px;border-radius:999px;border:1px solid #f0c8bc;
   background:#fff8f5;color:#aa4328;box-shadow:0 3px 14px rgba(0,0,0,.08);
   font:bold 12px Tahoma;cursor:pointer}
 #pbLabDesktopConflictFlag[hidden]{display:none!important}
 .pbLabDesktopConflicts{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483646;
   width:min(760px,calc(100vw - 40px));max-height:min(78dvh,700px);box-sizing:border-box;overflow:auto;
   background:#fff;border:1px solid #d0d5dd;border-radius:16px;padding:22px;
   direction:ltr;font:13px/1.9 Vazirmatn,Tahoma;color:#344054;text-align:right;
   box-shadow:0 15px 60px rgba(0,0,0,.18)}
 .pbLabDesktopConflicts>*{direction:rtl;text-align:right}
 .pbLabDesktopConflicts h3{margin:0 0 8px;font-size:18px;color:#1d2939}
 .pbLabDesktopConflicts .pbSyncIntro{padding:12px 14px;border:1px solid #dbe7fb;border-radius:11px;background:#f5f8ff;color:#344054}
 .pbLabDesktopConflicts .pbSyncConflict{margin:12px 0;padding:12px 14px;border:1px solid #e5eaf2;border-radius:11px;background:#fbfcfe}
 .pbLabDesktopConflicts .pbSyncConflict p{margin:4px 0}
 .pbLabDesktopConflicts button{margin:4px;border:0;border-radius:8px;padding:8px 12px;
   background:#eef2ff;color:#315efb;font:inherit;cursor:pointer}
 .pbLabDesktopConflicts button:focus-visible,#pbLabDesktopConflictFlag:focus-visible{outline:2px solid #315efb}
 /* Make the manual-order photo and paper controls legible on the Windows app. */
 .pb1137Intake .pb1139GroupPhotos{gap:10px!important;padding:10px!important}
 .pb1137Intake .pb1139GroupPhotos{max-height:min(340px,42dvh)!important;overflow-x:auto!important;overflow-y:auto!important;scrollbar-width:thin!important;align-items:flex-start!important}
 .pb1137Intake .pb1139GroupPhotos figure{flex-basis:150px!important;width:150px!important}
 .pb1137Intake .pb1181IntakeFrame{height:148px!important;min-height:148px!important;flex:none!important}
 .pb1137Intake .pb1181IntakeFrame img{width:100%!important;height:100%!important;object-fit:contain!important}
 .pb1137Intake .pb1141PhotoActions{height:auto!important;min-height:34px!important;max-height:none!important;gap:6px!important;align-items:center!important}
 .pb1137Intake .pb1141PhotoActions>.pb1180IntakePaper{height:34px!important;min-height:34px!important;max-height:34px!important;font-size:11px!important;padding:4px 6px!important}
 .pb1137Intake .pb1141PhotoActions>.pb1181ChassisToggle{height:32px!important;min-height:32px!important;max-height:32px!important;padding-inline:6px!important}
 .pb1137Intake .pb1139GroupPhotos .pb1142Quantity{display:flex!important;visibility:visible!important;opacity:1!important;position:static!important;flex:0 0 36px!important;min-height:36px!important;height:36px!important;margin:2px 0 0!important;overflow:visible!important;align-items:center!important;justify-content:center!important;gap:5px!important}
 .pb1137Intake .pb1139GroupPhotos .pb1142Quantity input{width:46px!important;min-width:46px!important;height:30px!important;min-height:30px!important;font-size:12px!important}
 .pb1137Intake .pb1139GroupPhotos .pb1142Quantity button{width:28px!important;min-width:28px!important;height:30px!important;min-height:30px!important;flex:0 0 28px!important;font-size:15px!important;padding:0!important}
 .pb1137Intake .pbLabIntakeActionBadge{position:absolute!important;z-index:3;top:6px;right:6px;max-width:calc(100% - 42px);padding:3px 9px;border:1px solid #d7e2f5;border-radius:999px;background:#fffef2eF;color:#1d4d80;box-shadow:0 2px 7px #162b4a24;font:800 11px/1.5 Vazirmatn,Tahoma,sans-serif;white-space:nowrap}
 .pb1137Intake .pbLabIntakeActionBadge[data-mode="move"]{background:#e7f8ee;border-color:#9bd8af;color:#16703a}
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
     for(const figure of modal.querySelectorAll('.pb1139GroupPhotos figure')){
       const frame=figure.querySelector('.pb1181IntakeFrame'),image=frame?.querySelector('img');if(!frame||!image||frame.querySelector('.pbLabIntakeActionBadge'))continue;
       const mode=previewModes.get(image.src)||'copy';const badge=document.createElement('span');badge.className='pbLabIntakeActionBadge';badge.dataset.mode=mode;badge.textContent=mode==='move'?'انتقال':'کپی';badge.setAttribute('aria-label',mode==='move'?'این عکس منتقل می‌شود':'این عکس کپی می‌شود');frame.append(badge);
     }
   }
 }
 document.addEventListener('click',event=>{
   installIntakePicker();const button=event.target?.closest?.('button');if(!button)return;
   if(button.closest('.pb1468FileActions'))selectionScope=true;
   else if(button.classList.contains('pb1139Add')||button.closest('.pb1139GroupHead')&&/^(کپی عکس|انتقال عکس)$/.test(button.textContent.trim())){selectionBatch=[];selectionScope=false;}
 },true);
 const intakeObserver=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes||[]){if(node.nodeType===1)decorateIntake(node)}decorateIntake();});
 intakeObserver.observe(document.documentElement,{childList:true,subtree:true});
 decorateIntake();
 const indicator=document.createElement('button');
 indicator.id='pbLabDesktopConflictFlag';indicator.type='button';
 indicator.textContent='بررسی';indicator.hidden=true;
 indicator.setAttribute('aria-label','بررسی همگام‌سازی سفارش‌ها و اطلاعات مالی');
 indicator.title='بررسی وضعیت سفارش‌ها و امور مالی — Ctrl+Shift+S';
 document.body.append(indicator);
 let state=null,loading=false,busy=false;
 const date=v=>v?new Date(v).toLocaleString('fa-IR'):'ثبت نشده';
 function refreshIndicator(){
   const n=Array.isArray(state?.conflicts)?state.conflicts.length:0;
   indicator.hidden=!state?.signedIn||!n;
   indicator.textContent='بررسی';
   indicator.title=n.toLocaleString('fa-IR')+' تغییر سفارش یا مالی نیازمند بررسی — Ctrl+Shift+S';
 }
 async function refresh(){
   if(loading)return state;loading=true;
   try{
     const response=await fetch('/desktop/status',{cache:'no-store'});
     if(response.ok)state=await response.json();
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
   element('h3',title,panel);
   button('بستن',panel,()=>panel.remove());
   document.body.append(panel);panel.focus();return panel;
 }
 async function syncNow(){
   if(busy)return;busy=true;
   try{const response=await fetch('/desktop/sync',{method:'POST',cache:'no-store'});const result=await response.json().catch(()=>({error:'server_unavailable'}));if(result&&typeof result==='object')state={...(state||{}),report:result};}
   catch{state={...(state||{}),report:{ok:false,error:'server_unavailable'}}}
   finally{busy=false;await refresh()}
 }
 function syncErrorText(code){return ({login_required:'نشست ورود برنامه معتبر نیست؛ خارج شو و دوباره وارد شو تا اتصال همگام‌سازی تازه شود.',internet_offline:'اینترنت در دسترس نیست؛ با وصل‌شدن دوباره، همگام‌سازی خودکار شروع می‌شود.',server_unavailable:'سرور پاسخ نداده است؛ برنامه با تلاش بعدی دوباره همگام می‌کند.',sync_no_data:'اتصال برقرار شد، اما هیچ‌کدام از اطلاعات برای همگام‌سازی دریافت نشد. اتصال سرور را بررسی کن؛ تاریخ موفق قبلی حفظ شده است.',partial_sync:'بخشی از اطلاعات دریافت شد و بخشی پاسخ نداد؛ برنامه دوباره تلاش می‌کند.',sync_internal_error:'همگام‌سازی در برنامه با خطای داخلی متوقف شد؛ برنامه را یک‌بار ببند و دوباره باز کن.',subscription_unverified:'اعتبار برنامه هنوز از سرور تأیید نشده است؛ اتصال اینترنت را بررسی کن.'})[code]||'همگام‌سازی کامل نشد؛ برنامه دوباره تلاش می‌کند.'}
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
   element('p','این پنجره فقط تغییرهای سفارش و مالی را نشان می‌دهد که سرور هنوز نتیجه‌شان را تأیید نکرده است. تغییرهای معمولی در صورت قطع اینترنت در برنامه می‌مانند و با برگشت اینترنت خودکار ارسال می‌شوند. اعلان‌ها و بررسی‌های داخلی برنامه اینجا نمایش داده نمی‌شوند.',panel).className='pbSyncIntro';
   element('p',s.pending?Number(s.pending).toLocaleString('fa-IR')+' تغییر منتظر اتصال است؛ برنامه خودش دوباره تلاش می‌کند.':'تغییر منتظر اتصالی وجود ندارد.',panel);
   element('p','آخرین همگام‌سازی موفق: '+date(s.lastSync),panel);
   const syncError=s.report?.error||s.error;if(syncError)element('p',syncErrorText(syncError),panel);
   if(s.report?.finishedAt)element('p','نتیجهٔ آخرین تلاش: '+date(s.report.finishedAt)+(Number.isFinite(Number(s.report.pulledCount))?' · دریافت '+Number(s.report.pulledCount).toLocaleString('fa-IR')+' بخش':''),panel);
   if(s.report&&Number(s.report.sent||0))element('p','در آخرین تلاش '+Number(s.report.sent).toLocaleString('fa-IR')+' تغییر با موفقیت ارسال شد.',panel);
   if(!conflicts.length)element('p','موردی که نیاز به تصمیم شما داشته باشد وجود ندارد.',panel);
   if(s.signedIn)button('تلاش دوباره برای همگام‌سازی',panel,async()=>{await syncNow();if(panel.isConnected){panel.remove();void openSync()}});
   for(const x of conflicts.slice(0,20)){
     const area=document.createElement('section');area.className='pbSyncConflict';panel.append(area);
     element('strong',conflictTitle(x),area);
     element('p',conflictHelp(x),area);
     element('p','زمان تغییر: '+date(x.createdAt)+' · شناسهٔ پیگیری: '+String(x.id||'').slice(0,8),area);
     const details=document.createElement('details');area.append(details);element('summary','جزئیات خطا',details);
     element('p','کد پاسخ سرور: '+(x.error?.httpStatus||'پاسخی دریافت نشد')+' · کد خطا: '+String(x.error?.error||'نامشخص'),details);
     button('بررسی کردم؛ بایگانی این مورد',area,async()=>{
       if(!window.confirm('آیا وضعیت این تغییر را در صفحهٔ سفارش یا امور مالی بررسی کرده‌اید؟\nاین کار فقط هشدار را از فهرست فعال خارج می‌کند و سابقهٔ محلی را نگه می‌دارد؛ هیچ تغییری روی سرور ثبت یا لغو نمی‌شود. اگر تغییر ثبت نشده، باید آن را از صفحهٔ مربوط دوباره انجام دهید.'))return;
       try{const response=await fetch('/desktop/archive-conflict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:x.id,reviewed:true})});if(!response.ok)throw Error('archive_failed');panel.remove();await refresh();void openSync();}
       catch{element('p','بایگانی انجام نشد. وارد حساب شوید و دوباره وضعیت را بررسی کنید.',area);}
     });
     if(retryIsSafe(x))button('تلاش دوباره امن',area,async()=>{
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
 indicator.addEventListener('click',openSync);
 document.addEventListener('keydown',event=>{
   if(!event.ctrlKey||!event.shiftKey||event.altKey||event.metaKey)return;
   if(event.key.toLowerCase()==='s'){event.preventDefault();void openSync()}
   else if(event.key.toLowerCase()==='u'){event.preventDefault();void openUpdate()}
 });
 window.addEventListener('online',()=>{void syncNow()});
 window.addEventListener('offline',()=>{void refresh()});
 void refresh();setInterval(()=>void refresh(),10000);
})();
