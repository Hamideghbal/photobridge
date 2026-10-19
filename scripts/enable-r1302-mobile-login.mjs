import fs from 'node:fs';
const tags='<link rel="stylesheet" href="/photobridge-r1302-mobile-login.css?v=r1302"><script defer src="/photobridge-r1302-mobile-login.js?v=r1302"></script>';
for(const path of ['dist/web/index.html','dist/api/equipment-rental-portal.html']){
 let source=fs.readFileSync(path,'utf8');
 if(!source.includes('/photobridge-r1302-mobile-login.js')){
  if(!source.includes('</body>'))throw new Error('R1302 missing body: '+path);
  const end=source.lastIndexOf('</body>');
  source=source.slice(0,end)+tags+source.slice(end);
  fs.writeFileSync(path,source);
 }
}

const collaborationPatches=[["dist/api/equipment-rental-book.html", "alert('ارسال درخواست همکاری انجام نشد.')}}", "alert(({photographer_auth_required:'نشست عکاسی منقضی شده است؛ دوباره وارد حساب عکاسی شوید.',rental_shop_scope_forbidden:'این فروشگاه در محدودهٔ همکاری حساب شما قرار ندارد.',rental_shop_unavailable:'فروشگاه در حال حاضر فعال یا در دسترس نیست.',request_timeout:'پاسخ فروشگاه دیر رسید؛ وضعیت درخواست را با تازه‌سازی صفحه بررسی کنید.',network_error:'ارتباط با سرور برقرار نشد؛ اتصال اینترنت را بررسی کنید.'})[e?.error]||('ارسال درخواست همکاری انجام نشد. کد خطا: '+String(e?.error||e?.status||'unknown')))}}"], ["dist/api/equipment-rental-portal.html", "e.error==='invalid_sms_mobile'?'برای این عکاس شماره موبایل معتبری ثبت نشده است.':'بررسی درخواست همکاری یا ارسال پیامک انجام نشد.'", "e.error==='invalid_sms_mobile'?'برای این عکاس شماره موبایل معتبری ثبت نشده است.':e.error==='service_wallet_insufficient'?'اعتبار سرویس پیامک کافی نیست؛ درخواست در انتظار بررسی باقی مانده است.':e.error==='rental_auth_required'?'نشست فروشگاه منقضی شده است؛ دوباره وارد شوید.':e.error==='sms_not_configured'||e.error==='service_disabled'?'سرویس پیامک سامانه فعال نیست؛ درخواست در انتظار بررسی باقی مانده است.':'بررسی درخواست همکاری انجام نشد. کد خطا: '+String(e.error||e.status||'unknown')"]];
for(const [path,before,after] of collaborationPatches){
 const source=fs.readFileSync(path,'utf8');
 if(source.includes(before))fs.writeFileSync(path,source.replace(before,after));
 else if(!source.includes(after))throw new Error('R1302 collaboration anchor missing: '+path);
}
