(()=>{
 if(location.hostname==='127.0.0.1')return;
 let busy=false;
 const candidateUrl='https://github.com/Hamideghbal/photobridge/actions/runs/38084340638/artifacts/11681820634';
 function candidate(target){
  if(document.getElementById('pbStoreDesktopCandidate'))return;
  const box=document.createElement('section');box.id='pbStoreDesktopCandidate';box.className='panel';
  box.style.cssText='display:block;box-sizing:border-box;max-width:100%;margin:14px 0;padding:16px;border:1px solid #d0d5dd;border-radius:12px;direction:rtl;overflow-wrap:anywhere';
  const title=document.createElement('h3');title.textContent='نسخه آزمایشی برنامه ویندوز فروشگاه · ۱.۰.۳ (R1089)';
  const text=document.createElement('p');
  text.textContent='این نسخه با رابط فعلی سایت بسته‌بندی شده و اصلاحات چاپ مستقیم تعهدنامه و جداسازی حساب‌ها را دارد. نصاب آزمایشی و بدون امضای دیجیتال است؛ قبل از جایگزینی نسخه فعلی، از داده‌های برنامه نسخه پشتیبان داشته باشید.';
  text.style.cssText='font-size:12px;line-height:1.9;color:#667085';
  const link=document.createElement('a');link.className='btn secondary';link.textContent='دریافت نصاب آزمایشی ویندوز (GitHub)';
  link.href=candidateUrl;link.target='_blank';link.rel='noopener noreferrer';
  const note=document.createElement('small');note.textContent='در گیت‌هاب وارد حساب خود شوید، فایل Artifacts را دریافت و از ZIP خارج کنید. اعتبار لینک تا ۲ آبان ۱۴۰۵ است. این نسخه هنوز جایگزین دانلود رسمی نشده است.';
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
