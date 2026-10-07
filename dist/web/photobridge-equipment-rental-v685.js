/* PhotoBridge v0.17.685 — equipment links without React-nav mutation, observers or polling. */
(function(){
  'use strict';
  // v727: public equipment-store links are active again. Private test stores remain server-side admin-only.
  function addPublic(){
    var h=document.getElementById('pbCanonicalHeaderV584')||document.getElementById('pbCanonicalHeaderV624');if(!h)return;
    // The canonical public header owns both equipment links. Adding them here
    // created a second, vertically misaligned rental button on public pages.
    var footer=document.getElementById('pbCanonicalFooterV584');if(footer){var c=footer.querySelector('.pbFooterCenter');if(c&&!c.querySelector('a[href="/equipment-rental"]')){var f=document.createElement('a');f.href='/equipment-rental';f.textContent='اجاره تجهیزات';c.appendChild(f)}}
  }
  function rentalInviteCopy(){
    if(location.pathname!='/photographer/signup')return;
    var q=new URLSearchParams(location.search),code=q.get('invite');if(!code)return;
    fetch('/api/public/photographer-invites/'+encodeURIComponent(code),{credentials:'same-origin'}).then(function(r){return r.ok?r.json():null}).then(function(d){
      if(!d||!d.invite||d.invite.issuerType!=='rental')return;
      var replacements=[['لابراتوار دعوت‌کننده','فروشگاه دعوت‌کننده'],['اتصال حساب به لابراتوار','اتصال حساب به فروشگاه'],['تأیید اتصال حساب به لابراتوار','تأیید اتصال حساب به فروشگاه'],['اضافه‌شدن به لابراتوار','اتصال به فروشگاه'],['عضو همین لابراتوار','متصل به همین فروشگاه'],['لابراتوار صادرکننده دعوتنامه','فروشگاه صادرکننده دعوتنامه']];
      var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),n;while(n=w.nextNode()){var t=n.nodeValue||'',u=t;replacements.forEach(function(x){u=u.split(x[0]).join(x[1])});if(/^لابراتوار\s/.test(u))u=u.replace(/^لابراتوار\s/,'فروشگاه ');if(u!==t)n.nodeValue=u}
    }).catch(function(){});
  }
  function init(){addPublic();rentalInviteCopy()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
