(()=>{
  'use strict';
  if(window.__PB_LAB_BIRTHDAY_774__)return;window.__PB_LAB_BIRTHDAY_774__=true;
  const css=document.createElement('style');css.textContent=`
    #pb774BirthdayEntry{position:fixed;right:18px;bottom:105px;z-index:10020;border:1px solid #bed0ed;border-radius:12px;background:#fff;color:#3157c8;padding:11px 15px;font:800 13px Vazirmatn,Tahoma,sans-serif;box-shadow:0 5px 15px #1e3a8a24;cursor:pointer}
    #pb774BirthdayShade{position:fixed;inset:0;z-index:2147482001;background:#0f1e3388;display:grid;place-items:center;padding:16px;direction:rtl;font:13px Vazirmatn,Tahoma,sans-serif}
    #pb774BirthdayShade *{box-sizing:border-box}#pb774BirthdayShade form{width:min(620px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:16px;padding:20px;color:#24344e;box-shadow:0 18px 42px #0003}
    #pb774BirthdayShade h2{margin:0 0 10px;font-size:19px}#pb774BirthdayShade p{line-height:1.7;color:#64748b}
    #pb774BirthdayShade label{display:block;margin:10px 0;font-weight:700}#pb774BirthdayShade label.check{display:flex;gap:7px;align-items:center}
    #pb774BirthdayShade input:not([type=checkbox]),#pb774BirthdayShade textarea{display:block;width:100%;margin-top:4px;padding:9px;border:1px solid #cad6e5;border-radius:9px;font:inherit}
    #pb774BirthdayShade .row{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}#pb774BirthdayShade footer{display:flex;gap:8px;margin-top:18px}
    #pb774BirthdayShade button{padding:9px 15px;border:1px solid #a9c1f3;border-radius:9px;background:#fff;color:#3157c8;font:inherit;cursor:pointer}
    #pb774BirthdayShade button[type=submit]{background:#315efb;color:white}
  `;document.head.append(css);
  let shade=null;
  function eligible(){return location.pathname.startsWith('/lab/settings')&&!!document.querySelector('.pageMain')}
  function mount(){let b=document.getElementById('pb774BirthdayEntry');if(!eligible()){b?.remove();return}if(b)return;
    b=document.createElement('button');b.id='pb774BirthdayEntry';b.type='button';b.textContent='🎂 پیام و هدیهٔ تولد عکاس‌ها';b.onclick=open;document.body.append(b)}
  async function open(){if(shade)return;shade=document.createElement('div');shade.id='pb774BirthdayShade';shade.innerHTML=`<form aria-label="تنظیم هدیه تولد"><h2>تبریک و هدیهٔ تولد عکاس‌ها</h2><p>تخفیف روی ماندهٔ حساب فاکتورهای چاپ یا صحافی در بازهٔ انتخابی اعمال می‌شود. پیامک در روز تولد ارسال می‌شود.</p>
    <label class="check"><input type="checkbox" name="discountEnabled"> تخفیف تولد فعال</label><div class="row"><label>درصد<input type="number" name="discountPercent" min="0" max="100" step="0.5"></label><label>روز قبل<input type="number" name="daysBefore" min="0" max="60"></label><label>روز بعد<input type="number" name="daysAfter" min="0" max="60"></label></div>
    <label class="check"><input type="checkbox" name="printEnabled"> چاپ عکس</label><label class="check"><input type="checkbox" name="albumEnabled"> صحافی آلبوم</label><label class="check"><input type="checkbox" name="smsEnabled"> ارسال پیامک تبریک در روز تولد</label>
    <label>متن تبریک اختصاصی<textarea name="greeting" maxlength="280" rows="3" placeholder="تولدت مبارک! ..."></textarea></label><p id="pb774BirthdayStatus" role="status"></p><footer><button type="submit">ذخیره تنظیمات</button><button type="button" data-close>بستن</button></footer></form>`;document.body.append(shade);
    const form=shade.querySelector('form'),status=shade.querySelector('#pb774BirthdayStatus');shade.querySelector('[data-close]').onclick=close;
    shade.addEventListener('mousedown',e=>{if(e.target===shade)close()});
    try{const r=await fetch('/api/lab/birthday-campaign',{credentials:'include',headers:{'x-photobridge-portal':'lab'}});if(!r.ok)throw new Error('دریافت تنظیمات انجام نشد');const c=(await r.json()).campaign||{};
      for(const [name,key] of Object.entries({discountEnabled:'discount_enabled',discountPercent:'discount_percent',daysBefore:'days_before',daysAfter:'days_after',printEnabled:'print_enabled',albumEnabled:'album_enabled',smsEnabled:'sms_enabled',greeting:'greeting'})){const field=form.elements[name];if(field.type==='checkbox')field.checked=Boolean(c[key]);else field.value=c[key]??''}
    }catch(e){status.textContent=e.message}
    form.onsubmit=async e=>{e.preventDefault();const f=form.elements,body={discountEnabled:f.discountEnabled.checked,discountPercent:Number(f.discountPercent.value||0),daysBefore:Number(f.daysBefore.value||0),daysAfter:Number(f.daysAfter.value||0),printEnabled:f.printEnabled.checked,albumEnabled:f.albumEnabled.checked,smsEnabled:f.smsEnabled.checked,greeting:f.greeting.value};
      status.textContent='در حال ذخیره…';try{const r=await fetch('/api/lab/birthday-campaign',{method:'PUT',credentials:'include',headers:{'content-type':'application/json','x-photobridge-portal':'lab'},body:JSON.stringify(body)});if(!r.ok)throw new Error((await r.json()).error||'ذخیره انجام نشد');status.textContent='تنظیمات ذخیره شد.'}catch(error){status.textContent=error.message}};
  }
  function close(){shade?.remove();shade=null}
  setInterval(mount,900);mount();
})();
