'use strict';
// R1597: show the existing download-confirmation dialog immediately after the
// server has verified the complete local file manifest. Do not move invoice work.
const marker='/* R1597 verified-download notice before invoice and queue refresh */';
const receipt="const acknowledgedOrder={...detail.order,...(acknowledgement?.order||{})};";
const successMessage="result.alreadyComplete?'همه '+V(result.done)+' فایل سفارش در پوشه درست و کامل‌اند؛ دریافت دوباره لازم نبود.':V(result.done)+' فایل سفارش کامل دریافت و با فهرست سرور تطبیق داده شد.";
const oldLate='pb1547DownloadDialog(warning||('+successMessage+'))';
const early="pb1547DownloadDialog("+successMessage+")";
const warnings="if(warning){const existing=document.querySelector('dialog.pb1547Notice[open] .pb1547NoticeMessage');if(existing)existing.textContent+=' '+warning;else pb1547Notice(warning,'warning')}";
function replaceOnce(value,from,to,label){
  if(value.split(from).length!==2)throw new Error('R1597 changed anchor '+label);
  return value.replace(from,to);
}
function patchEarlyNotice(source){
  if(source.includes(marker))return source;
  const from=source.indexOf('Vn=async(le,options={})=>');
  const end=source.indexOf(',un=async le=>',from);
  if(from<0||end<=from)throw new Error('R1597 manual verified-download handler missing');
  let handler=source.slice(from,end);
  if(!handler.includes('const acknowledgement=await pb1451AcknowledgeDownload(detail);'))throw new Error('R1597 server verification anchor missing');
  if(!handler.includes('if(!warning)await pb1568AfterManualDownload(le.id)'))throw new Error('R1597 existing invoice continuation changed');
  handler=replaceOnce(handler,receipt,
    receipt+'\n   '+marker+'\n   '+early+';',
    'verified-receipt placement');
  handler=replaceOnce(handler,oldLate,warnings,'duplicate late success dialog');
  if(handler.indexOf(early)>handler.indexOf('if(!warning)await pb1568AfterManualDownload(le.id)'))throw new Error('R1597 notice still delayed behind invoice');
  // Explicitly preserve server stage updates, invoice issuance, React refresh,
  // and error messages. Only notice timing changes.
  return source.slice(0,from)+handler+source.slice(end);
}
module.exports={patchEarlyNotice,marker};