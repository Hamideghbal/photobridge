// R1568 lab automation controls, shared by website and installed Windows UI.
(()=>{'use strict';
const rootId='pb1568-automation-settings';
let cached=null,loading=false;
const api=async(method='GET',body)=>{
 const response=await fetch(window.pbNativeStorage?'/api/lab/automation-settings/download':'/api/lab/automation-settings',{method,credentials:'include',cache:'no-store',headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const json=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(json.error||'خطا در دریافت یا ذخیره تنظیمات');return json.settings;
};
function mount(){
 if(!/^\/lab\/settings(?:\/|$)/.test(location.pathname))return;
 if(document.getElementById(rootId))return;
 const parent=document.querySelector('.settingsBody,.labRolePageScrollArea,.labSettingsWorkspace,main .labRoleWorkspace,main');
 if(!parent)return;
 const box=document.createElement('section');box.id=rootId;box.dir='rtl';
 box.style.cssText='background:#fff;border:1px solid #d9e1ed;border-radius:16px;padding:18px;margin:18px auto;max-width:850px;box-shadow:0 4px 16px #0e376e0b;font:14px/2 Vazirmatn,Tahoma,sans-serif;color:#26384d';
 box.innerHTML='<h3 style="margin:0 0 8px">دریافت خودکار سفارش و فاکتور</h3><p style="margin:0 0 12px;color:#66758d">این تنظیمات برای همین لابراتوار ذخیره می‌شوند؛ دریافت فایل فقط در برنامه ویندوز روی سیستم اصلی و با مسیر ذخیره معتبر انجام می‌شود.</p><form style="display:grid;gap:12px"><label><input name="autoDownload" type="checkbox"> دانلود خودکار سفارش‌های جدید، بدون دستور اپراتور</label><label>زمان صدور فاکتور <select name="invoiceTiming" style="padding:6px;border:1px solid #cad4e0;border-radius:8px"><option value="after_print">بعد از چاپ عکس (وضعیت فعلی)</option><option value="before_print">بعد از دانلود و تطبیق فایل‌ها، قبل از چاپ عکس</option></select></label><label><input name="autoPrint" type="checkbox"> چاپ خودکار فاکتور یا برگهٔ نیازمند قیمت‌گذاری با چاپگر پیش‌فرض ویندوز</label><p style="margin:0;color:#795b18;background:#fff9e6;padding:7px 10px;border-radius:8px">اگر قیمت حتی یک سایز مشخص نباشد، فقط برگهٔ جزئیات سفارش با هشدار «نیازمند ثبت فاکتور دستی» چاپ می‌شود؛ فاکتور مالی ناقص صادر نمی‌شود. چاپ بدون پنجره به نسخهٔ مجهز برنامه ویندوز و چاپگر پیش‌فرض نصب‌شده نیاز دارد.</p><div style="display:flex;align-items:center;gap:10px"><button type="submit" style="border:0;border-radius:9px;background:#285c9f;color:#fff;padding:8px 20px;cursor:pointer;font:inherit">ذخیره تنظیمات</button><span role="status" data-status></span></div></form>';
 const form=box.querySelector('form'),status=box.querySelector('[data-status]');function fill(settings){cached=settings;form.elements.autoDownload.checked=settings.autoDownload;form.elements.invoiceTiming.value=settings.invoiceTiming;form.elements.autoPrint.checked=settings.autoPrint;}
 form.addEventListener('submit',async event=>{event.preventDefault();const b=form.querySelector('button[type=submit]');b.disabled=true;status.textContent='در حال ذخیره…';try{const settings=await api('PUT',{autoDownload:form.elements.autoDownload.checked,invoiceTiming:form.elements.invoiceTiming.value,autoPrint:form.elements.autoPrint.checked});fill(settings);status.textContent='تنظیمات ذخیره شد.';}catch(e){status.textContent='ذخیره نشد: '+e.message;}finally{b.disabled=false}});
 parent.append(box);if(cached)fill(cached);else if(!loading){loading=true;api().then(settings=>{cached=settings;if(box.isConnected)fill(settings)}).catch(e=>{status.textContent='دریافت تنظیمات ناموفق بود: '+e.message}).finally(()=>{loading=false});}
}
setInterval(mount,2300);document.addEventListener('DOMContentLoaded',mount);mount();
})();