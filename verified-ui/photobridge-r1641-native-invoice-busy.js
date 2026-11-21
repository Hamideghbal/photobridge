/* PB1641: On native Lab invoice progress dialogs, recovery actions belong to errors only. */
(()=>{
 'use strict';
 if(window.pb1641InvoiceBusyActions)return;
 window.pb1641InvoiceBusyActions=true;
 const retryLabel=/^تلاش\s*مجدد(?:\s|$)/,cancelLabel=/^انصراف$/;
 const progress=/در\s*حال.{0,70}فاکتور|فاکتور.{0,35}(?:در\s*حال|صادر\s*می)|داره.{0,35}فاکتور.{0,25}صادر/;
 const failure=/خطا(?:یی)?\s*(?:در|هنگام|رخ)?|ناموفق|ناموفقیت|صادر\s*نشد|انجام\s*نشد|مشکل\s*(?:در|هنگام)|اتصال\s*قطع/;
 const hidden=new Set();
 const label=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
 function sync(){
  const shouldHide=new Set();
  for(const retry of document.querySelectorAll('button')){
   if(!retryLabel.test(label(retry)))continue;
   let panel=retry.parentElement;
   for(let depth=0;panel&&panel!==document.body&&depth<8;depth++,panel=panel.parentElement){
    const text=label(panel);
    if(text.length>3200||!text.includes('فاکتور'))continue;
    const cancel=[...panel.querySelectorAll('button')].find(btn=>cancelLabel.test(label(btn)));
    if(!cancel)continue;
    if(!progress.test(text))continue;
    const alerts=[...panel.querySelectorAll('[role="alert"],.error,.alert.error,[data-state="error"]')];
    const failed=failure.test(text)||alerts.some(el=>failure.test(label(el)));
    if(!failed){shouldHide.add(retry);shouldHide.add(cancel)}
    break;
   }
  }
  for(const button of hidden)if(!shouldHide.has(button)){
    button.classList.remove('pb1641HideRecovery');
    hidden.delete(button);
  }
  for(const button of shouldHide)if(!hidden.has(button)){
    hidden.add(button);button.classList.add('pb1641HideRecovery');
  }
 }
 let scheduled=false;
 function schedule(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;sync()});
 }
 const start=()=>{
  const css=document.createElement('style');
  css.id='pb1641-native-invoice-busy';
  css.textContent='.pb1641HideRecovery{display:none!important;visibility:hidden!important}';
  document.head.append(css);
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','hidden','style','aria-busy','data-state']});
  schedule();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
