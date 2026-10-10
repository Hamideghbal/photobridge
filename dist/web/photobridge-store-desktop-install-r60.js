(()=>{
 if(location.hostname==='127.0.0.1')return;
 let busy=false;
 const candidateUrl='/downloads/store-desktop/PhotoBridge-Store-R1089-Setup-1.0.3-x64.exe';
 function candidate(target){
  if(document.getElementById('pbStoreDesktopCandidate'))return;
  const box=document.createElement('section');box.id='pbStoreDesktopCandidate';box.className='panel';
  box.style.cssText='display:block;box-sizing:border-box;max-width:100%;margin:14px 0;padding:16px;border:1px solid #d0d5dd;border-radius:12px;direction:rtl;overflow-wrap:anywhere';
  const title=document.createElement('h3');title.textContent='نسخه آزمایشی برنامه ویندوز فروشگاه · ۱.۰.۳ (R1089)';
  const text=document.createElement('p');
  text.textContent='این نصاب دارای رابط فروشگاه در زمان ساخت و اصلاحات چاپ تعهدنامه و تفکیک حساب‌های فروشگاه است. حجم تقریبی ۱۲۸ مگابایت؛ دانلود از خود سرور انجام می‌شود. نسخه آزمایشی و بدون امضای دیجیتال است.';
  text.style.cssText='font-size:12px;line-height:1.9;color:#667085';
  const link=document.createElement('a');link.className='btn secondary';link.textContent='دانلود مستقیم برنامه ویندوز ۱.۰.۳ از فوتوبریج';
  link.href=candidateUrl;link.setAttribute('download','PhotoBridge-Store-R1089-Setup-1.0.3-x64.exe');
  const note=document.createElement('small');note.textContent='دانلود مستقیم از سرور فوتوبریج، بدون نیاز به گیت‌هاب. این فایل در بسته انتشار نگهداری می‌شود و با دیپلوی بعدی حذف نخواهد شد. نسخه آزمایشی و بدون امضای دیجیتال است؛ قبل از نصب از اطلاعات محلی نسخه پشتیبان تهیه کنید.';
  note.style.cssText='display:block;margin-top:9px;font-size:11px;line-height:1.9;color:#667085';
  box.append(title,text,link,note);target.appendChild(box);
 }
 async function mount(){
  const target=document.getElementById('settings');
  if(!target||target.classList.contains('hidden')||busy)return;
  candidate(target);
  if(document.getElementById('pbStoreDesktopInstall'))return;
  busy=true;
  try{
   const r=await fetch('/api/rental/desktop-release');
   if(!r.ok)return;const release=await r.json();if(!release.available||!release.url)return;
   const box=document.createElement('div');box.id='pbStoreDesktopInstall';box.className='panel';
   box.style.cssText='display:block;margin:16px 0;padding:18px;border:1px solid #e4e7ec;border-radius:12px';
   const title=document.createElement('h3');title.textContent='برنامهٔ رسمی فروشگاه برای ویندوز';
   const info=document.createElement('p');info.textContent='نسخه رسمی ثبت‌شده توسط مدیر سیستم؛ با امکان آفیش آفلاین، همگام‌سازی و دریافت تغییرات سایت.';
   const a=document.createElement('a');a.className='btn';a.textContent='دانلود برنامه رسمی ویندوز ۶۴ بیتی';a.href=release.url;a.setAttribute('download','');
   box.append(title,info,a);target.append(box);
  }catch{}finally{busy=false}
 }
 document.addEventListener('click',e=>{if(e.target.closest('[data-rental-desktop-tab="settings"],[data-rental-tab="settings"],[data-rental-bottom-tab="settings"]'))setTimeout(mount,150)});
 setTimeout(mount,2000);
})();
