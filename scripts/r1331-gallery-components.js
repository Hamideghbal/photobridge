function PB1331smsError(code){return ({service_wallet_insufficient:'اعتبار کیف پول کافی نیست؛ ابتدا کیف پول را شارژ کن.',gallery_customer_mobile_required:'ابتدا شماره موبایل مشتری را در تنظیمات گالری وارد و ذخیره کن.',gallery_not_published:'گالری را فعال کن تا لینک برای مشتری قابل استفاده باشد.',gallery_approval_not_ready:'ابتدا عکس‌های روتوش‌شده را بارگذاری و برای تأیید مشتری ارسال کن.',gallery_sms_price_changed:'تعرفه پیامک تغییر کرده است؛ هزینه جدید را بررسی و دوباره اقدام کن.',gallery_sms_already_attempted:'این ارسال قبلاً پردازش شده است؛ قبل از ارسال مجدد نتیجه را بررسی کن.',gallery_sms_unavailable:'سرویس پیامک عکاس یا درگاه پیامکی فعال نیست.',gallery_customer_sms_disabled:'ابتدا پیامک مشتری را در همین بخش فعال کن.'})[code]||'ارسال پیامک انجام نشد. نتیجه و اعتبار کیف پول را بررسی کن.'}
function PB1331GallerySms({galleryId,orderStatus,updatedAt}){
 const [data,setData]=x.useState(null),[busy,setBusy]=x.useState(false),[message,setMessage]=x.useState('');
 const current=x.useRef(0),prefix=`/api/customer/client-galleries/${galleryId}/sms`;
 const load=async()=>{const id=++current.current;try{const value=await Me(prefix);if(current.current===id)setData(value)}catch{if(current.current===id)setMessage('اطلاعات پیامک دریافت نشد؛ دوباره تلاش کن.')}};
 x.useEffect(()=>{setData(null);setMessage('');load();return()=>{current.current++}},[galleryId,orderStatus,updatedAt]);
 const save=async(key,checked)=>{
  const previous=data.preferences;setData(d=>({...d,preferences:{...previous,[key]:checked}}));setBusy(true);setMessage('');try{const result=await Me(prefix+'/settings',{method:'PUT',body:JSON.stringify({...data.preferences,[key]:checked})});setData(d=>({...d,preferences:result.preferences}));setMessage('تنظیم پیامک ذخیره شد.')}catch{setData(d=>({...d,preferences:previous}));setMessage('تنظیم پیامک ذخیره نشد؛ دوباره تلاش کن.')}finally{setBusy(false)}
 };
 const send=async kind=>{
  if(!data||busy)return;setBusy(true);setMessage('');
  try{
   const latest=await Me(prefix);setData(latest);
   if(!latest.available)throw {data:{error:'gallery_sms_unavailable'}};
   if(latest.balance<latest.unitPrice)throw {data:{error:'service_wallet_insufficient'}};
   if(!await window.pb1113GalleryConfirm(`لینک ${kind==='approval'?'تأیید روتوش':'انتخاب عکس'} برای ${latest.customerMobile} ارسال شود؟ هزینه ${Number(latest.unitPrice).toLocaleString('fa-IR')} تومان از کیف پول کسر می‌شود.`))return;
   const result=await Me(prefix+'/send',{method:'POST',body:JSON.stringify({kind,requestId:crypto.randomUUID(),quotedPrice:latest.unitPrice})});
   setMessage(result.alreadySent?'این پیامک قبلاً ارسال شده است.':'پیامک ارسال شد.');await load();
  }catch(error){setMessage(PB1331smsError(error?.data?.error))}finally{setBusy(false)}
 };
 const ready=data?.available,hasMobile=/^09\d{9}$/.test(data?.customerMobile||''),afford=data&&data.balance>=data.unitPrice,canSend=ready&&hasMobile&&afford&&data?.published&&data?.preferences?.customerEnabled;
 return e.jsxs('section',{className:'pb1331GallerySms',dir:'rtl',children:[
  e.jsxs('header',{children:[e.jsx('strong',{children:'اطلاع‌رسانی پیامکی گالری'}),data&&e.jsx('small',{children:`هر ارسال: ${Number(data.unitPrice).toLocaleString('fa-IR')} تومان · اعتبار: ${Number(data.balance).toLocaleString('fa-IR')} تومان`})]}),
  !data?e.jsx('button',{type:'button',onClick:load,children:message?'تلاش دوباره':'در حال دریافت اطلاعات پیامک…'}):e.jsxs(e.Fragment,{children:[
   !ready&&e.jsx('p',{children:data.serviceEnabled?'درگاه پیامک هنوز آماده نیست.':'ادمین باید سرویس پیامک را برای عکاسان فعال کند.'}),
   e.jsxs('label',{children:[e.jsx('input',{type:'checkbox',checked:data.preferences.ownerEnabled,disabled:busy||!ready,onChange:event=>save('ownerEnabled',event.target.checked)}),e.jsx('span',{children:'اطلاع به من بعد از ثبت انتخاب‌ها یا تأیید نهایی مشتری'})]}),
   e.jsxs('label',{children:[e.jsx('input',{type:'checkbox',checked:data.preferences.customerEnabled,disabled:busy||!ready||!hasMobile,onChange:event=>save('customerEnabled',event.target.checked)}),e.jsx('span',{children:'ارسال خودکار لینک تأیید به مشتری پس از آماده‌شدن روتوش'})]}),
   e.jsx('small',{children:'هر پیامک ارسالی از اعتبار کیف پول عکاس کسر می‌شود. اعلان داخل برنامه همیشه برقرار است؛ پیامک به خودت وقتی ارسال می‌شود که اعلان را دریافت یا مشاهده نکرده باشی.'}),
   !hasMobile&&e.jsx('p',{children:'برای پیامک مشتری، شماره موبایل او را در تنظیمات گالری وارد و ذخیره کن.'}),
   !afford&&e.jsx('p',{children:'اعتبار کیف پول برای ارسال پیامک کافی نیست.'}),
   e.jsxs('div',{className:'pb1331SmsActions',children:[e.jsx('button',{type:'button',disabled:busy||!canSend,onClick:()=>send('selection'),children:'ارسال لینک انتخاب عکس'}),e.jsx('button',{type:'button',disabled:busy||!canSend||orderStatus!=='awaiting_approval',onClick:()=>send('approval'),children:'ارسال دوباره لینک تأیید روتوش'})]})
  ]}),
  message&&e.jsx('p',{role:'status',children:message})
 ]});
}
