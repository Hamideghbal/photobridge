'use strict';
(()=>{
 const $=id=>document.getElementById(id),title=$('title'),message=$('message'),version=$('version'),progress=$('progress'),bar=$('bar'),info=$('progressInfo'),bytes=$('bytes'),percent=$('percent'),note=$('note'),actions=$('actions'),primary=$('primary'),later=$('later');
 let current=null;
 const fa=n=>Math.max(0,Number(n)||0).toLocaleString('fa-IR');
 function size(value){const n=Math.max(0,Number(value)||0);if(n<1024)return fa(n)+' بایت';if(n<1048576)return (n/1024).toLocaleString('fa-IR',{maximumFractionDigits:1})+' کیلوبایت';return (n/1048576).toLocaleString('fa-IR',{maximumFractionDigits:1})+' مگابایت';}
 function setState(next){
  if(!next||typeof next!=='object')return;current=next;const stage=String(next.state||'available');
  version.hidden=!next.version;version.textContent=next.version?'نسخهٔ '+next.version:'';
  const stepStage=stage==='verifying'?'downloading':stage;
  document.querySelectorAll('[data-step]').forEach(el=>{const name=el.dataset.step;el.classList.toggle('done',stepStage==='downloading'?name==='available':stepStage==='ready'?name==='available'||name==='downloading':stepStage==='installing'?name!=='ready':stepStage==='error'&&next.retryStage==='install'?name==='available'||name==='downloading':false);el.classList.toggle('active',name===stepStage||stepStage==='error'&&name===(next.retryStage==='install'?'ready':'downloading'));});
  progress.classList.remove('indeterminate','connecting');
  actions.hidden=true;note.hidden=false;info.hidden=true;progress.hidden=true;
  if(stage==='connecting'){
   title.textContent='در حال اتصال برای دریافت به‌روزرسانی';message.textContent='در حال برقراری اتصال امن با سرور؛ پس از شروع انتقال، درصد و حجم دریافت‌شده نمایش داده می‌شود.';progress.hidden=false;info.hidden=false;progress.classList.add('connecting');bar.style.width='8%';progress.setAttribute('aria-valuenow',String(Math.max(0,Math.min(100,Number(next.percent)||0))));percent.textContent=fa(Math.max(0,Math.min(100,Number(next.percent)||0)))+'٪';bytes.textContent='در حال اتصال به سرور…';
  }else if(stage==='available'){
   title.textContent='نسخهٔ جدید آمادهٔ دریافت است';message.textContent='نسخهٔ '+(next.version||'جدید')+' PhotoBridge منتشر شده. دریافت فایل نصب را از همین پنجره شروع کن.';actions.hidden=false;primary.textContent='دریافت به‌روزرسانی';primary.dataset.action='download';later.hidden=false;
  }else if(stage==='downloading'){
   title.textContent='در حال دریافت به‌روزرسانی';message.textContent='فایل نصب در حال دریافت است. برای لغو امن دریافت، پنجره را ببند.';progress.hidden=false;info.hidden=false;const p=Math.max(0,Math.min(100,Number(next.percent)||0));bar.style.width=p+'%';progress.setAttribute('aria-valuenow',String(p));percent.textContent=fa(p)+'٪';bytes.textContent=size(next.loadedBytes)+' از '+size(next.totalBytes);
  }else if(stage==='verifying'){
   title.textContent='در حال بررسی فایل';message.textContent='دریافت کامل شد؛ امضا و سلامت فایل در حال بررسی است.';progress.hidden=false;info.hidden=false;bar.style.width='100%';progress.setAttribute('aria-valuenow','100');percent.textContent='۱۰۰٪';bytes.textContent='بررسی امنیتی فایل';
  }else if(stage==='ready'){
   title.textContent='دانلود و بررسی کامل شد';message.textContent='فایل نسخهٔ '+(next.version||'جدید')+' دریافت و صحت آن تأیید شد. برای شروع نصب، دکمهٔ زیر را بزن.';progress.hidden=false;info.hidden=false;bar.style.width='100%';progress.setAttribute('aria-valuenow','100');percent.textContent='۱۰۰٪';bytes.textContent='فایل کامل و تأیید شده است';actions.hidden=false;primary.textContent='نصب و اجرای مجدد';primary.dataset.action='install';later.hidden=false;note.querySelector('span:last-child').textContent='پیش از نصب، فرم‌های باز را تمام کن. با نصب، برنامه بسته می‌شود و پس از پایان دوباره اجرا خواهد شد.';
  }else if(stage==='installing'){
   title.textContent='در حال نصب نسخهٔ جدید';message.textContent='نصب‌کننده اجرا شده است. برنامه برای تکمیل به‌روزرسانی بسته و دوباره باز می‌شود.';progress.hidden=false;bar.style.width='100%';progress.setAttribute('aria-valuenow','100');percent.textContent='۱۰۰٪';bytes.textContent='آماده‌سازی نصب';note.querySelector('span:last-child').textContent='این مرحله ممکن است چند لحظه طول بکشد. پنجرهٔ برنامه بسته می‌شود و نسخهٔ جدید اجرا خواهد شد.';
  }else if(stage==='error'){
   title.textContent='به‌روزرسانی کامل نشد';message.textContent=String(next.message||'برنامهٔ فعلی حفظ شده است. می‌توانی دوباره تلاش کنی.');actions.hidden=false;primary.textContent='تلاش دوباره';primary.dataset.action='retry';later.hidden=false;note.querySelector('span:last-child').textContent='نسخهٔ فعلی و اطلاعات ذخیره‌شده دست‌نخورده باقی مانده‌اند.';
  }
 }
 primary.addEventListener('click',()=>{const action=primary.dataset.action;if(!action)return;primary.disabled=true;later.disabled=true;window.pbUpdateProgress?.action(action);});
 later.addEventListener('click',()=>{later.disabled=true;primary.disabled=true;window.pbUpdateProgress?.action('later');});
 window.pbUpdateProgress?.onState(setState);
})();
