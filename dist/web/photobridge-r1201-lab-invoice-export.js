/* R1201 — Print and Save as PDF from the EXACT invoice preview DOM.
   No alternative invoice template or stale cloud PDF is involved. */
(() => {
  'use strict';
  if (window.pb1201InvoiceExport) return;
  window.pb1201InvoiceExport = function(mode) {
    const root = document.querySelector('.globalInvoicePreviewLayer .invoicePaper');
    if (!root) return false;
    const windowRef = window.open('', '_blank', 'width=980,height=900');
    if (!windowRef) { alert('پنجره چاپ مسدود است؛ اجازه باز شدن پنجره را فعال کنید.'); return true; }
    const copy = root.cloneNode(true);
    copy.style.zoom = '1';
    copy.style.transform = 'none';
    copy.removeAttribute('id');
    // Keep the complete CSS of the preview. All resources are same-origin.
    const css = Array.from(document.querySelectorAll('link[rel="stylesheet"],style'))
      .filter(node => node.tagName === 'STYLE' || (node.href && new URL(node.href).origin === location.origin))
      .map(node => node.outerHTML).join('\n');
    const title = document.querySelector('.globalInvoicePreviewLayer .invoicePreviewHead h3')?.textContent?.trim() || 'فاکتور PhotoBridge';
    const heading = mode === 'pdf' ? 'برای ذخیره PDF، در پنجره چاپ مقصد «Save as PDF» را انتخاب کنید.' : 'نسخه چاپی همین پیش‌نمایش';
    windowRef.document.open();
    windowRef.document.write('<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<title>'+title.replace(/[<>&"]/g,'')+'</title>'+css+
      '<style>html,body{background:white!important;color:#101828!important;margin:0!important;padding:0!important;direction:rtl!important}'+
      '.pb1201ExportShell{width:190mm;max-width:100%;margin:0 auto;padding:0!important}'+
      '.pb1201ExportTools{padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;font:700 12px Tahoma,sans-serif}'+
      '.pb1201ExportTools button{background:#315efb;color:white;border:0;padding:9px 16px;border-radius:8px;cursor:pointer}'+
      '.pb1201ExportShell .invoicePaper{display:block!important;position:static!important;transform:none!important;zoom:1!important;'+
      'width:100%!important;max-width:none!important;min-height:0!important;max-height:none!important;overflow:visible!important;box-shadow:none!important;'+
      'margin:0!important;box-sizing:border-box!important}'+
      '.invoicePaperViewport{width:100%!important;height:auto!important;overflow:visible!important;max-height:none!important}'+
      '@page{size:A4;margin:10mm}@media print{.pb1201ExportTools{display:none!important}.pb1201ExportShell{width:100%!important}'+
      'body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}'+
      '.invoicePaper{break-inside:auto!important}.invoicePaperRow{break-inside:avoid!important}}'+
      '</style></head><body><div class="pb1201ExportShell"><div class="pb1201ExportTools"><span>'+heading+'</span>'+
      '<button onclick="window.print()" type="button">چاپ / ذخیره PDF</button></div>'+
      '<div class="invoicePreviewBack globalInvoicePreviewLayer"><div class="invoicePreviewModal invoiceFitModal labInvoicePreview"><div class="invoicePaperViewport">'+copy.outerHTML+
      '</div></div></div></div></body></html>');
    windowRef.document.close();
    // The print dialog can produce a PDF directly, preserving the exact same
    // invoice DOM and stylesheet, unlike the legacy canvas/cloud PDF template.
    const printWhenReady = () => Promise.resolve(windowRef.document.fonts?.ready).then(() => {
      if (!windowRef.closed) { windowRef.focus(); windowRef.print(); }
    }).catch(() => { if (!windowRef.closed) windowRef.print(); });
    if (windowRef.document.readyState === 'complete') setTimeout(printWhenReady, 180);
    else windowRef.addEventListener('load', () => setTimeout(printWhenReady, 180), {once:true});
    return true;
  };
})();
