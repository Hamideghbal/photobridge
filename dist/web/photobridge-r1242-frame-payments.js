(()=>{
 'use strict';
 const q=s=>document.querySelector(s),fa=n=>Math.round(Number(n)||0).toLocaleString('fa-IR'),money=n=>fa(n)+' تومان';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const request=(url,options={})=>typeof api==='function'?api(url,options):fetch(url,{credentials:'same-origin',...options,headers:{'content-type':'application/json',...options.headers}}).then(async r=>{const b=await r.json();if(!r.ok)throw b;return b;});
 const errors={invalid_card_number:'شماره کارت باید ۱۶ رقم باشد.',invalid_iban:'شماره شبا معتبر نیست.',account_holder_required:'نام صاحب حساب را وارد کنید.',bank_details_unavailable:'شماره حساب فروشگاه هنوز ثبت نشده است؛ با فروشگاه هماهنگ کنید.',receipt_not_replaceable:'رسید در حال بررسی یا تأیید شده است؛ امکان جایگزینی ندارد.',receipt_not_pending:'این رسید قبلاً بررسی شده است.',payment_group_changed:'وضعیت یکی از سفارش‌ها تغییر کرده است؛ پرداخت را با فروشگاه بررسی کنید.',invalid_receipt_image:'عکس رسید باید JPG، PNG یا WebP و حداکثر ۶ مگابایت باشد.',receipt_too_large:'حداکثر حجم رسید ۶ مگابایت است.',storage_not_configured:'ذخیره رسید فعلاً در دسترس نیست؛ دوباره تلاش کنید.'};
 const errorText=e=>errors[e?.error]||'انجام نشد؛ دوباره تلاش کنید.';
 let scheduled=false,settingsShop='',dialog=null;
 const owner=()=>typeof data!=='undefined'&&['frame','chassis','frame_chassis'].includes(data?.shop?.business_category)&&!data.staffMode;
 const customer=()=>document.body.classList.contains('frameCustomerStore');
 const statusText={awaiting_receipt:'در انتظار ارسال رسید',pending:'رسید در انتظار تأیید',approved:'پرداخت تأیید شده',rejected:'رسید رد شده؛ ارسال مجدد'};
 function paymentButton(card,order,isOwner){
  if(!order?.frame_payment_id)return;
  let button=card.querySelector('[data-frame-payment-open]');
  if(!button){button=document.createElement('button');button.type='button';button.className='pb1242PaymentButton';button.dataset.framePaymentOpen=order.frame_payment_id;card.append(button);}
  const status=order.receipt_status||'awaiting_receipt',label=(isOwner?'پرداخت / رسید · ':'')+(statusText[status]||'پرداخت سفارش');
  if(button.textContent!==label)button.textContent=label;
  button.dataset.frameReceiptStatus=status;
  button.dataset.framePaymentOwner=isOwner?'1':'0';
  const paid=order.payment_status==='paid',cancelled=order.status==='cancelled';
  const meta=card.querySelector('.salePaymentMeta span');
  const text=paid?(cancelled?'پرداخت‌شده · پیگیری استرداد با فروشگاه':'پرداخت‌شده'):statusText[status]||'پرداخت‌نشده';
  if(meta&&meta.textContent!==text)meta.textContent=text;
 }
 async function mountSettings(){
  const host=q('#settings');if(!host||!owner())return;
  const id=String(data.shop.id||'');if(!id||settingsShop===id)return;settingsShop=id;
  q('#pb1242BankSettings')?.remove();const form=document.createElement('form');form.id='pb1242BankSettings';form.className='box pb1242BankSettings';
  form.innerHTML='<h2>حساب بانکی فروشگاه</h2><p>مشتری به این حساب واریز می‌کند و رسید می‌فرستد. پرداخت پس از تأیید شما ثبت می‌شود.</p><div class="pb1242BankFields"><label>نام صاحب حساب<input name="accountHolder" maxlength="150" autocomplete="off"></label><label>شماره کارت<input name="cardNumber" dir="ltr" inputmode="numeric" maxlength="24" placeholder="۱۶ رقم"></label><label>شماره شبا<input name="iban" dir="ltr" maxlength="34" placeholder="IR…"></label></div><div class="pb1242BankFooter"><button class="btn" type="submit" disabled>ذخیره حساب بانکی</button><span role="status"></span></div>';
  host.prepend(form);const message=form.querySelector('[role=status]'),button=form.querySelector('button');
  form.addEventListener('submit',async event=>{event.preventDefault();button.disabled=true;message.textContent='در حال ذخیره…';try{await request('/api/rental/frame-payment-settings',{method:'PUT',body:JSON.stringify(Object.fromEntries(new FormData(form)))});message.textContent='اطلاعات حساب ذخیره شد.';}catch(e){message.textContent=errorText(e);}finally{button.disabled=false;}});
  try{const out=await request('/api/rental/frame-payment-settings');if(!form.isConnected||settingsShop!==id)return;for(const [key,value] of Object.entries(out.paymentSettings||{}))if(form.elements[key])form.elements[key].value=value||'';button.disabled=false;}catch{message.textContent='دریافت اطلاعات حساب انجام نشد؛ صفحه را دوباره باز کنید.';}
 }
 function mount(){
  scheduled=false;
  if(owner()){
   void mountSettings();
   const wallet=q('[name="salesWalletCheckoutEnabled"]');if(wallet)wallet.closest('label')?.setAttribute('hidden','');
   document.querySelectorAll('[data-production-order]').forEach(card=>paymentButton(card,(data.saleOrders||[]).find(o=>String(o.id)===card.dataset.productionOrder),true));
  }
  if(customer()&&typeof saleOrders!=='undefined')document.querySelectorAll('#saleOrders [data-frame-payment-id]').forEach(card=>paymentButton(card,saleOrders.find(o=>String(o.frame_payment_id)===card.dataset.framePaymentId),false));
  if(document.documentElement.classList.contains('pb1242UtilityWallet')){
   const wallet=q('.customerWalletPage');if(wallet&&!q('#pb1242WalletHistoryToggle')){const button=document.createElement('button');button.id='pb1242WalletHistoryToggle';button.className='pb1242WalletHistoryToggle';button.type='button';button.textContent='نمایش ریز تراکنش‌ها';button.setAttribute('aria-expanded','false');button.onclick=()=>{const open=document.documentElement.classList.toggle('pb1242HistoryOpen');button.textContent=open?'بستن ریز تراکنش‌ها':'نمایش ریز تراکنش‌ها';button.setAttribute('aria-expanded',String(open));};wallet.append(button);}
  }
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(mount);}}
 function bankMarkup(bank){return '<div class="pb1242BankAccount"><b>'+esc(bank.accountHolder||'حساب فروشگاه')+'</b>'+(bank.cardNumber?'<label>شماره کارت <span dir="ltr">'+esc(bank.cardNumber.replace(/(.{4})/g,'$1 ').trim())+'</span><button type="button" data-copy-bank="'+esc(bank.cardNumber)+'">کپی</button></label>':'')+(bank.iban?'<label>شبا <span dir="ltr">'+esc(bank.iban)+'</span><button type="button" data-copy-bank="'+esc(bank.iban)+'">کپی</button></label>':'')+'</div>';}
 async function openPayment(id,isOwner=false){
  if(dialog)dialog.close();
  const previous=document.activeElement,overflow=document.body.style.overflow,root=document.createElement('div');root.className='pb1242PaymentOverlay';root.innerHTML='<section class="pb1242PaymentDialog" role="dialog" aria-modal="true" aria-labelledby="pb1242PaymentTitle"><header><h2 id="pb1242PaymentTitle">'+(isOwner?'بررسی رسید پرداخت':'پرداخت سفارش')+'</h2><button type="button" data-close-payment aria-label="بستن">×</button></header><div class="pb1242PaymentBody">در حال دریافت…</div></section>';
  const close=()=>{root.querySelectorAll('[data-url]').forEach(el=>URL.revokeObjectURL(el.dataset.url));root.remove();document.body.style.overflow=overflow;document.removeEventListener('keydown',key);dialog=null;if(previous?.isConnected)previous.focus({preventScroll:true});};
  const key=e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const items=[...root.querySelectorAll('button,input,textarea')].filter(el=>!el.disabled&&el.getClientRects().length),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
  dialog={close};root.addEventListener('click',e=>{if(e.target===root||e.target.closest('[data-close-payment]'))close();});document.body.append(root);document.body.style.overflow='hidden';document.addEventListener('keydown',key);root.querySelector('[data-close-payment]').focus();
  const prefix=isOwner?'/api/rental/frame-payments/':'/api/customer/equipment-rental/frame-payments/',url=prefix+id,body=root.querySelector('.pb1242PaymentBody');
  const reload=async()=>{const out=await request(url);if(!root.isConnected)return;const p=out.payment,bank=out.paymentSettings||{},configured=Boolean(bank.cardNumber||bank.iban),canUpload=!isOwner&&['awaiting_receipt','rejected'].includes(p.status);
   body.innerHTML='<div class="pb1242PaymentAmount"><span>مبلغ کل سفارش‌های این پرداخت</span><b>'+money(p.totalAmount)+'</b></div><p class="pb1242PaymentStatus">'+esc(statusText[p.status]||p.status)+'</p>'+(p.reviewNote?'<p class="pb1242ReviewNote">'+esc(p.reviewNote)+'</p>':'')+(configured?bankMarkup(bank):'<p>شماره حساب فروشگاه هنوز ثبت نشده است؛ با فروشگاه هماهنگ کنید.</p>')+(p.hasReceipt?'<a class="pb1242ReceiptLink" href="'+url+'/receipt" target="_blank" rel="noopener"><img alt="رسید پرداخت" src="'+url+'/receipt?t='+encodeURIComponent(p.submittedAt||'')+'"><span>نمایش رسید در اندازه کامل ↗</span></a>':'')+(canUpload&&configured?'<form class="pb1242ReceiptForm"><label class="pb1242ReceiptPicker">انتخاب عکس رسید<input type="file" accept="image/jpeg,image/png,image/webp" required></label><small>JPG، PNG یا WebP · حداکثر ۶ مگابایت</small><img class="pb1242ReceiptPreview" alt="پیش‌نمایش رسید" hidden><button class="btn" type="submit">ارسال رسید برای تأیید فروشگاه</button></form>':'')+(isOwner&&p.status==='pending'?'<div class="pb1242ReceiptReview"><label>توضیح بررسی<textarea maxlength="500" rows="2" placeholder="دلیل رد رسید یا توضیح تأیید"></textarea></label><div><button class="btn" type="button" data-review-receipt="approve">تأیید دریافت وجه</button><button type="button" data-review-receipt="reject">رد رسید</button></div></div>':'')+'<p role="status" class="pb1242PaymentMessage"></p>';
   body.querySelectorAll('[data-copy-bank]').forEach(button=>button.onclick=async()=>{try{await navigator.clipboard.writeText(button.dataset.copyBank);button.textContent='کپی شد';}catch{body.querySelector('[role=status]').textContent='شماره را انتخاب و کپی کنید.';}});
   const form=body.querySelector('form');let selectedFile=null;
   if(form){const input=form.querySelector('input');input.onchange=()=>{selectedFile=input.files?.[0]||null;const preview=form.querySelector('img');if(preview.dataset.url)URL.revokeObjectURL(preview.dataset.url);preview.hidden=true;if(selectedFile&&selectedFile.size<=6*1024*1024){preview.src=URL.createObjectURL(selectedFile);preview.dataset.url=preview.src;preview.hidden=false;}};
    form.onsubmit=async event=>{event.preventDefault();const message=body.querySelector('[role=status]'),button=form.querySelector('button');if(!selectedFile||selectedFile.size>6*1024*1024||!['image/jpeg','image/png','image/webp'].includes(selectedFile.type)){message.textContent=errors.invalid_receipt_image;return;}button.disabled=true;message.textContent='در حال ارسال رسید…';try{const image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(selectedFile);});await request(url+'/receipt',{method:'POST',body:JSON.stringify({image,name:selectedFile.name})});await reload();if(typeof loadSales==='function')void loadSales();}catch(e){message.textContent=errorText(e);button.disabled=false;}};
   }
   body.querySelectorAll('[data-review-receipt]').forEach(button=>button.onclick=async()=>{const message=body.querySelector('[role=status]');body.querySelectorAll('[data-review-receipt]').forEach(b=>b.disabled=true);try{await request(url+'/review',{method:'POST',body:JSON.stringify({action:button.dataset.reviewReceipt,note:body.querySelector('textarea').value})});await reload();if(typeof load==='function')void load();}catch(e){message.textContent=errorText(e);body.querySelectorAll('[data-review-receipt]').forEach(b=>b.disabled=false);}});
  };
  try{await reload();}catch(e){if(root.isConnected)body.textContent=errorText(e);}
 }
 window.pb1242OpenPayment=id=>openPayment(id,false);
 document.addEventListener('click',event=>{const button=event.target.closest('[data-frame-payment-open]');if(button){event.preventDefault();void openPayment(button.dataset.framePaymentOpen,button.dataset.framePaymentOwner==='1');}});
 const start=()=>{schedule();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
