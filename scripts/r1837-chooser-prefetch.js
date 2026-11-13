/* R1837: start the chooser request while its embedded document assets load. */
(()=>{
 const q=new URLSearchParams(location.search);
 if(location.pathname!=='/equipment-rental/book'||window===window.top&&!q.has('pbDesktopContent')&&!q.has('pbEmbeddedStore')&&q.get('pbOfficeLogin')!=='1')return;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 window.__PB1837ShopsRequest=fetch('/api/customer/equipment-rental/shops',{credentials:'same-origin',signal:controller.signal}).catch(()=>null).finally(()=>clearTimeout(timer));
})();
