(()=>{
 'use strict';
 if(window.__PB_LAB_DESKTOP_OVERLAY__)return;
 window.__PB_LAB_DESKTOP_OVERLAY__=true;
 // All sync/update information stays in the optional diagnostics dialog and Windows tray.
 // Windows tray contains manual sync/update; Ctrl+Shift+S/U offer optional status.
 const style=document.createElement('style');
 style.textContent=`
 .pbLabDesktopConflicts{position:fixed;inset:12%;z-index:2147483646;overflow:auto;
   background:#fff;border:1px solid #d0d5dd;border-radius:16px;padding:20px;
   direction:rtl;font:12px/1.9 Vazirmatn,Tahoma;color:#344054;
   box-shadow:0 15px 60px rgba(0,0,0,.14)}
 .pbLabDesktopConflicts button{margin:4px;border:0;border-radius:8px;padding:6px 10px;
   background:#eef2ff;color:#315efb;font:inherit;cursor:pointer}
 .pbLabDesktopConflicts button:focus-visible{outline:2px solid #315efb}
 `;
 document.head.append(style);
 let state=null,loading=false,busy=false;
 const date=v=>v?new Date(v).toLocaleString('fa-IR'):'ثبت نشده';
 async function refresh(){
   if(loading)return state;loading=true;
   try{
     const response=await fetch('/desktop/status',{cache:'no-store'});
     if(response.ok)state=await response.json();
   }catch{}finally{loading=false}
   return state;
 }
 function element(tag,value,parent){const node=document.createElement(tag);node.textContent=value;parent.append(node);return node}
 function button(value,parent,action){const b=element('button',value,parent);b.type='button';b.onclick=action;return b}
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
   try{await fetch('/desktop/sync',{method:'POST'});}
   catch{}finally{busy=false;await refresh()}
 }
 async function openSync(){
   await refresh();const panel=dialog('وضعیت همگام‌سازی لابراتوار');
   const s=state||{};
   element('p',s.signedIn?'اتصال و همگام‌سازی در پس‌زمینه بررسی می‌شود.':'برای همگام‌سازی ابتدا وارد حساب لابراتوار شوید.',panel);
   element('p','عملیات در صف: '+Number(s.pending||0).toLocaleString('fa-IR'),panel);
   element('p','موارد نیازمند بررسی: '+Number(s.conflicts?.length||0).toLocaleString('fa-IR'),panel);
   element('p','آخرین همگام‌سازی: '+date(s.lastSync),panel);
   if(s.error)element('p','خطای اتصال: '+s.error,panel);
   if(s.report)element('p','آخرین تلاش: '+date(s.report.finishedAt)+' · ارسال موفق: '+Number(s.report.sent||0).toLocaleString('fa-IR'),panel);
   if(s.signedIn)button('بررسی همگام‌سازی',panel,async()=>{await syncNow();if(panel.isConnected){panel.remove();void openSync()}});
   for(const x of (s.conflicts||[]).slice(0,20)){
     const area=document.createElement('div');panel.append(area);
     element('strong','عملیات نیازمند بررسی',area);
     element('p',String(x.method||'')+' '+String(x.url||'')+' — '+String(x.error?.message||x.error?.error||'اختلاف با سرور'),area);
     button('ارسال مجدد با تأیید',area,async()=>{
       if(!confirm('ممکن است این عملیات قبلاً به سرور رسیده باشد. ابتدا وضعیت سفارش یا پرداخت را بررسی کرده‌ای؟'))return;
       await fetch('/desktop/retry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:x.id})});
       panel.remove();await refresh();void openSync();
     });
     button('کنار گذاشتن عملیات محلی',area,async()=>{
       if(!confirm('این تغییر محلی دیگر ارسال نمی‌شود. فقط وقتی از ثبت آن در سرور مطمئن هستی ادامه بده.'))return;
       await fetch('/desktop/discard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:x.id})});
       panel.remove();await refresh();void openSync();
     });
   }
   if((s.conflicts||[]).length>20)element('p','۲۰ مورد اول نمایش داده شده است.',panel);
 }
 async function openUpdate(){
   await refresh();const s=state||{};const panel=dialog('به‌روزرسانی ظاهر برنامه');
   const compactHash=v=>/^[a-f0-9]{64}$/.test(String(v||''))?String(v).slice(0,12):'نامشخص';
   for(const line of [
     'نسخهٔ برنامه: '+(s.nativeVersion||'در این نسخه گزارش نمی‌شود'),
     'بستهٔ رابط دریافت‌شده: '+compactHash(s.uiBuild),
     'آخرین بررسی: '+date(s.uiLastCheckedAt),
     'آخرین دریافت: '+date(s.uiDownloadedAt),
     'آخرین اعمال: '+date(s.uiAppliedAt)
   ])element('p',line,panel);
   const serverLine=element('p','نسخه رابط روی سرور: در حال بررسی…',panel);
   // R1955: Compare the local *downloaded* hash with the public remote
   // manifest. Do not confuse program-installer version with native UI version.
   void (async()=>{
     let last='';
     for(const url of ['/api/desktop-ui/lab-manifest','/api/lab/desktop-ui-manifest']){
       try{
         const r=await fetch(url+'?pb1955='+Date.now(),{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
         if(!r.ok)throw Error('HTTP '+r.status);
         const manifest=await r.json();
         if(!/^[a-f0-9]{64}$/.test(manifest.build))throw Error('invalid_manifest');
         if(!serverLine.isConnected)return;
         const same=manifest.build===s.uiBuild;
         serverLine.textContent='بستهٔ رابط روی سرور: '+compactHash(manifest.build)+(same?' · بسته دریافت شده است':' · نسخه جدیدتر قابل بررسی است');
         if(same)element('p','اگر هنوز تغییرات را نمی‌بینی، احتمالاً رابط جدید فعال نشده است؛ برنامه را پس از پایان کارها کاملاً ببند و دوباره باز کن.',panel);
         else element('p','برای دریافت رابط، گزینه «به‌روزرسانی سریع ظاهر» کنار ساعت را اجرا کن؛ «به‌روزرسانی برنامه» فقط نسخهٔ نصبی را بررسی می‌کند.',panel);
         return;
       }catch(error){last=String(error.message||error)}
     }
     if(serverLine.isConnected)serverLine.textContent='نسخه رابط روی سرور قابل بررسی نبود: '+last;
   })();
   element('p',s.updateError?'به‌روزرسانی کامل نشده است: '+s.updateError:'بررسی و دریافت تغییرات ظاهر خودکار انجام می‌شود؛ نسخه نصبی و بسته رابط مستقل بررسی می‌شوند.',panel);
   element('p','برای بررسی دستی از منوی آیکون PhotoBridge کنار ساعت ویندوز گزینه «به‌روزرسانی سریع ظاهر» را استفاده کن.',panel);
   const link=element('a','صفحهٔ دانلود برنامهٔ ویندوز لابراتوار',panel);
   link.href='https://photobridge.ir/lab-windows-download.html';link.target='_blank';link.rel='noopener noreferrer';
 }
 document.addEventListener('keydown',event=>{
   if(!event.ctrlKey||!event.shiftKey||event.altKey||event.metaKey)return;
   if(event.key.toLowerCase()==='s'){event.preventDefault();void openSync()}
   else if(event.key.toLowerCase()==='u'){event.preventDefault();void openUpdate()}
 });
 window.addEventListener('online',()=>{void syncNow()});
 window.addEventListener('offline',()=>{void refresh()});
 void refresh();setInterval(()=>void refresh(),10000);
})();