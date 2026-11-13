/* R1836: overlap mobile first-entry data with application assets; no persistent identity cache. */
(()=>{
 'use strict';
 if(window!==window.top||!matchMedia('(max-width:820px)').matches)return;
 const path=location.pathname.replace(/\/+$/,'')||'/',q=new URLSearchParams(location.search);
 if(path!=='/photographer'||['logged_out','walletPayment','pbEntryDone','token','invite','reset','code','redirect','maintenance_preview'].some(key=>q.has(key))||q.get('workspace')==='print'||q.get('pbLabChooser')==='1')return;
 window.__PB1836EntryRequest=fetch('/api/customer/entry-context',{credentials:'include',cache:'no-store'}).catch(()=>null);
})();
