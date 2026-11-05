/* R1599: two explicit actions before a photographer sends mismatched crops.
   No upload/order is created until the user affirmatively chooses "send". */
function pb1599ConfirmCropSend(message) {
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');
  dialog.className='pb1599CropSendDialog';
  dialog.dir='rtl';
  dialog.setAttribute('aria-label','هشدار نیاز به کراپ قبل از ارسال');
  dialog.innerHTML='<div class="pb1599CropInner"><div class="pb1599CropTitle">نیاز به کراپ یا اصلاح کادر</div>'+
   '<p class="pb1599CropText"></p>'+
   '<p class="pb1599CropHint">می‌توانی ارسال را لغو کنی و ابتدا عکس‌ها را کراپ کنی؛ یا مسئولیت ارسال همین فایل‌ها را بپذیری.</p>'+
   '<div class="pb1599CropActions"><button type="button" class="pb1599CropCancel">لغو ارسال و برگشت برای کراپ</button>'+
   '<button type="button" class="pb1599CropProceed">ارسال با همین وضعیت</button></div></div>';
  dialog.querySelector('.pb1599CropText').textContent=String(message||'یک یا چند عکس با سایز انتخاب‌شده تطبیق ندارد.');
  let settled=false;
  const done=choice=>{
   if(settled)return;
   settled=true;
   if(dialog.open&&typeof dialog.close==='function')dialog.close();
   dialog.remove();
   resolve(Boolean(choice));
  };
  dialog.querySelector('.pb1599CropCancel').addEventListener('click',()=>done(false));
  dialog.querySelector('.pb1599CropProceed').addEventListener('click',()=>done(true));
  dialog.addEventListener('cancel',event=>{event.preventDefault();done(false)});
  dialog.addEventListener('click',event=>{if(event.target===dialog)done(false)});
  document.body.appendChild(dialog);
  try{dialog.showModal()}catch{ // Unsupported native dialog: do not silently approve.
   dialog.setAttribute('open','');dialog.classList.add('pb1599CropFallback');
  }
  dialog.querySelector('.pb1599CropCancel').focus();
 });
}
