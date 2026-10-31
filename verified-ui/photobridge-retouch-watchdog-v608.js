/* PhotoBridge v0.17.608 — /ai boot watchdog. Keeps the public retouch route from failing as a blank page. */
(function(){
  'use strict';
  if(location.pathname!=='/ai')return;
  var captured=[];
  function remember(kind,value){
    try{var text=String(value&&value.message||value&&value.reason||value||kind);if(text)captured.push(kind+': '+text.slice(0,420));}catch{}
  }
  window.addEventListener('error',function(e){remember('error',e&&e.error||e&&e.message)},true);
  window.addEventListener('unhandledrejection',function(e){remember('promise',e&&e.reason)},true);
  function healthy(){return !!document.querySelector('#root .publicAiPage,#root .publicAiOrderCard,#root [class*="publicAiHero"]')}
  function showRecovery(){
    if(healthy()||document.getElementById('pb608RetouchBootRecovery'))return;
    var root=document.getElementById('root');if(!root)return;
    var box=document.createElement('main');box.id='pb608RetouchBootRecovery';box.dir='rtl';
    box.style.cssText='min-height:calc(100dvh - 70px);display:grid;place-items:start center;padding:32px 16px 110px;background:#f7f8fb;color:#172033;font-family:Vazirmatn,Tahoma,Arial,sans-serif';
    var detail=captured.length?'<details style="margin-top:12px"><summary style="cursor:pointer;color:#64748b;font-size:11px">جزئیات فنی</summary><pre style="white-space:pre-wrap;word-break:break-word;font-size:10px;color:#667085;background:#f8fafc;border-radius:10px;padding:10px">'+captured.join('\n').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})+'</pre></details>':'';
    box.innerHTML='<section style="width:min(520px,94vw);margin-top:28px;background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:20px;box-shadow:0 16px 42px rgba(15,23,42,.08)"><b style="display:block;font-size:18px;margin-bottom:7px">صفحه روتوش کامل بارگذاری نشد</b><span style="display:block;color:#64748b;line-height:1.9;font-size:12px">نسخه پایدار روتوش فعال شده است. یک‌بار «بارگذاری دوباره» را بزن؛ اگر خطای شبکه موقت بوده باشد صفحه برمی‌گردد.</span><button type="button" id="pb608RetouchReload" style="margin-top:14px;min-height:42px;border:0;border-radius:11px;padding:0 16px;background:#315efb;color:#fff;font:800 12px inherit;cursor:pointer">بارگذاری دوباره</button>'+detail+'</section>';
    root.replaceChildren(box);
    var b=document.getElementById('pb608RetouchReload');if(b)b.onclick=function(){location.reload()};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(showRecovery,2600)},{once:true});
  else setTimeout(showRecovery,2600);
})();
