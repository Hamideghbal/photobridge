/* Only the public phone UI calls this branch; the verified Windows bundle is frozen before it is inserted. */
function pb1483Phone() {
  return !window.pbNativeStorage && !/Windows|Electron/i.test(navigator.userAgent||'') && /Android|iPhone|iPod|iPad/i.test(navigator.userAgent||'') && window.matchMedia('(max-width:820px)').matches && document.documentElement.classList.contains('pb1482LabPhoneMode');
}
async function pb1483AllowRemoteStage(order) {
  try {
    // Download stays on the primary computer. Mobile only advances an already downloaded order.
    const detail = await Me(`/api/lab/orders/${order.id}`), fresh = detail?.order;
    if(!pb1483Phone())return false;
    if(!fresh || String(fresh.id)!==String(order.id) || (order.lab_id && String(fresh.lab_id)!==String(order.lab_id)))throw Error('وضعیت سفارش تغییر کرده است؛ صفحه را تازه‌سازی کنید.');
    if(['cancelled','uploading'].includes(String(fresh.status)))throw Error('این سفارش در حال حاضر قابل تغییر مرحله نیست.');
    if(!fresh.downloaded_at)throw Error('ابتدا فایل‌های این سفارش را روی سیستم اصلی لابراتوار کامل دانلود کنید؛ سپس مراحل بعدی از موبایل قابل ثبت است.');
    if(fresh.settlement_mode==='prepaid' && fresh.payment_status!=='paid')throw Error('پرداخت سفارش هنوز تأیید نشده است.');
    return true;
  } catch(error) { alert(error?.message||'بررسی وضعیت سفارش انجام نشد؛ دوباره تلاش کنید.'); return false; }
}
