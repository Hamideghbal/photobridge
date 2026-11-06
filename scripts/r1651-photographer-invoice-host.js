/* R1651: desktop photographer invoice iframe visibility.
 * No compiled React/minifier anchors: works on both old and new order bundles.
 * This script is loaded by the customer content frame, not by the host only.
 */
(()=>{
  'use strict';
  if(window.parent===window || new URLSearchParams(location.search).get('pbDesktopContent')!=='1')return;
  if(!/^\/photographer\//.test(location.pathname))return;
  let panel;
  try{
    if(!window.parent.document.documentElement.classList.contains('pb1126Desktop'))return;
    panel=window.frameElement?.closest('.pb1126ContentPanel');
  }catch{ return; }
  if(!panel || panel.dataset.panel!=='print')return;

  let open=false;
  const sync=()=>{
    const layer=document.querySelector('.globalInvoicePreviewLayer.invoicePreviewBack,.modalBack.invoicePreviewBack');
    const visible=Boolean(layer && layer.getAttribute('aria-hidden')!=='true' &&
      getComputedStyle(layer).display!=='none' && getComputedStyle(layer).visibility!=='hidden');
    if(visible===open)return;
    open=visible;
    panel.classList.toggle('pb1651InvoiceOpen',visible);
    panel.dataset.pb1651InvoiceOpen=visible?'1':'0';
  };
  const run=()=>{
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','style','class','aria-hidden']});
    sync();
    window.addEventListener('pagehide',()=>{
      observer.disconnect();
      panel.classList.remove('pb1651InvoiceOpen');
      delete panel.dataset.pb1651InvoiceOpen;
    },{once:true});
  };
  if(document.body)run();else document.addEventListener('DOMContentLoaded',run,{once:true});
})();
