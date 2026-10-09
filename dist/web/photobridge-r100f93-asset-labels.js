/* PhotoBridge R100F93: compact physical QR labels for individually tracked rental assets.
   A stable PB|system_code| QR is recognized by the existing pickup/return scanner.
   Manufacturer serial is metadata and never affects a printed sticker. */
(()=>{
 'use strict';
 if(window.__PB_R100F93_ASSET_LABELS__)return;
 window.__PB_R100F93_ASSET_LABELS__=true;
 const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const sizes={
   tiny:{qr:18,width:27,codeFont:7.4,nameFont:6.2,stripFont:6},
   standard:{qr:26,width:39,codeFont:9,nameFont:7.6,stripFont:7}
 };
 const qrSrc=code=>'https://api.qrserver.com/v1/create-qr-code/?size=340x340&margin=16&data='+encodeURIComponent('PB|'+code+'|');
 function label(asset,fullName,detail,phone){
   const code=String(asset.system_code||'').trim();
   const name=String(fullName||asset.item_title||'تجهیز').trim();
   const serial=String(asset.serial_number||'').trim();
   return '<article class="pb93Label">'+
     '<div class="pb93QrPatch"><img src="'+esc(qrSrc(code))+'" alt="QR '+esc(code)+'" loading="eager">'+
     '<b dir="ltr">'+esc(code)+'</b></div>'+
     (detail?'<div class="pb93CutStrip" title="این بخش را می‌توانید جداگانه برش بزنید و بچسبانید">'+
     '<strong>'+esc(name)+'</strong>'+
     '<span dir="ltr">کد: '+esc(code)+'</span>'+ (phone?'<small dir="ltr">تماس: '+esc(phone)+'</small>':'')+
     (serial?'<small dir="ltr">SN: '+esc(serial)+'</small>':'')+
     '</div>':'')+'</article>';
 }
 function pageStyle(size){
   const cfg=sizes[size]||sizes.tiny;
   return '@page{size:A4;margin:7mm}*{box-sizing:border-box}body{margin:0;color:#111;background:#fff;direction:rtl;font-family:Tahoma,Arial,sans-serif}'+
     '.pb93Toolbar{font:12px Tahoma;background:#f1f5f9;border-bottom:1px solid #cbd5e1;padding:9px 12px;margin-bottom:7mm;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}'+
     '.pb93Toolbar button{padding:7px 12px;font:bold 12px Tahoma;border:0;border-radius:6px;color:#fff;background:#315efb;cursor:pointer}'+
     '.pb93Warning{font:12px Tahoma;color:#b42318;padding:0 10px;margin:0 0 12px}'+
     '.pb93Sheet{display:grid;grid-template-columns:repeat(auto-fill,'+cfg.width+'mm);gap:2mm 2mm;justify-content:start;align-items:start;direction:rtl}'+
     '.pb93Label{width:'+cfg.width+'mm;display:flex;flex-direction:column;align-items:center;justify-content:start;break-inside:avoid;page-break-inside:avoid;border:1px dashed #9aa4b2;padding:1mm .5mm 1mm;text-align:center;min-width:0;background:#fff}'+
     '.pb93QrPatch{width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.35mm}'+
     '.pb93QrPatch img{display:block;width:'+cfg.qr+'mm;height:'+cfg.qr+'mm;object-fit:contain;image-rendering:auto;background:white}'+
     '.pb93QrPatch b{display:block;max-width:100%;font:900 '+cfg.codeFont+'pt/1.15 Consolas,monospace;letter-spacing:.1px;white-space:nowrap;direction:ltr}'+
     '.pb93CutStrip{display:flex;flex-direction:column;align-items:center;gap:.3mm;margin-top:.8mm;padding:1.3mm 1mm 0;width:100%;min-width:0;border-top:1px dashed #64748b}'+
     '.pb93CutStrip strong{font:700 '+cfg.nameFont+'pt/1.25 Tahoma,Arial,sans-serif;display:block;overflow-wrap:anywhere;width:100%;overflow-wrap:anywhere}'+
     '.pb93CutStrip span,.pb93CutStrip small{font:700 '+cfg.stripFont+'pt/1.15 Consolas,Tahoma,monospace;word-break:break-all;direction:ltr}'+
     '@media print{html,body{width:auto;height:auto;overflow:visible!important}.pb93Toolbar,.pb93Warning{display:none!important}.pb93Sheet{margin:0!important}.pb93Label{-webkit-print-color-adjust:exact;print-color-adjust:exact}}';
 }
 window.pbR100F93PrintAssetLabels=function(assets,fullName,options={}){
   const items=(Array.isArray(assets)?assets:[]).filter(x=>String(x?.system_code||'').trim());
   if(!items.length){window.storeNotice?.('کد واحدی برای چاپ پیدا نشد.','برچسب تجهیزات');return false}
   const size=options.size==='standard'?'standard':'tiny';
   const details=options.details!==false;
   const phone=String(options.phone||'').trim().slice(0,40);
   // Open on direct click, before any asynchronous asset/image work.
   const w=window.open('','_blank','width=1000,height=850');
   if(!w){window.storeNotice?.('برای چاپ برچسب، اجازه بازشدن پنجره جدید مرورگر را بدهید.','چاپ برچسب');return false}
   const title='برچسب تجهیزات · '+(size==='tiny'?'کوچک':'معمولی');
   const cards=items.map(item=>label(item,fullName,details,phone)).join('');
   w.document.open();
   w.document.write('<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">'+
     '<meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title><style>'+pageStyle(size)+'</style></head>'+
     '<body><div class="pb93Toolbar"><div><b>'+esc(title)+'</b> · '+items.length.toLocaleString('fa-IR')+
     ' برچسب · QR '+(sizes[size].qr)+' میلی‌متر'+
     (details?' · نام و کد در نوار قابل برش زیر QR':'')+
     '<div style="font-size:10px;margin-top:5px">برای حفظ اندازه واقعی چاپ، Scale را روی ۱۰۰٪ بگذارید و Fit to page را غیرفعال کنید.</div></div>'+
     '<button type="button" onclick="window.print()">چاپ برچسب‌ها</button></div>'+
     '<p class="pb93Warning" id="pb93Warning" hidden></p><div class="pb93Sheet">'+cards+'</div></body></html>');
   w.document.close();
   // Do not silently print blank QR images if the image provider is unreachable.
   const images=[...w.document.images];
   const ready=images.map(img=>img.complete?Promise.resolve(img.naturalWidth>0):new Promise(resolve=>{
     img.addEventListener('load',()=>resolve(img.naturalWidth>0),{once:true});
     img.addEventListener('error',()=>resolve(false),{once:true});
   }));
   Promise.all(ready).then(result=>{
     if(w.closed)return;
     if(result.every(Boolean)){w.focus();w.print();return}
     const warning=w.document.getElementById('pb93Warning');
     if(warning){warning.hidden=false;warning.textContent='تصویر بعضی QRها بارگذاری نشد؛ اتصال اینترنت را بررسی کنید و تا کامل شدن تصاویر چاپ نکنید.'}
   }).catch(()=>{});
   return true;
 };
})();