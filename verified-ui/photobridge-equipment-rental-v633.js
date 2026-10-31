/* PhotoBridge v0.17.633 — rental public links only; photographer Print/Album navigation is owned by core app */
(function(){
  'use strict';
  function addStyle(){
    if(document.getElementById('pbRental633Style'))return;
    var s=document.createElement('style');s.id='pbRental633Style';s.textContent=`
      .pbRental633NavLink{position:relative}.pbRental633NavLink:after{content:"جدید";font-size:6.5px;font-weight:950;margin-right:3px;padding:1px 4px;border-radius:999px;background:#eef2ff;color:#315efb}
      #pbCanonicalHeaderV584.pbScrolled .pbRental633NavLink:after,#pbCanonicalHeaderV624.pbScrolled .pbRental633NavLink:after{background:rgba(255,255,255,.18);color:#fff}
    `;document.head.appendChild(s)
  }
  function addPublic(){
    var h=document.getElementById('pbCanonicalHeaderV584')||document.getElementById('pbCanonicalHeaderV624');if(!h)return;
    var nav=h.querySelector('.pbCanonicalDesktopNav');
    if(nav&&!nav.querySelector('.pbRental633NavLink')){var a=document.createElement('a');a.href='/equipment-rental';a.textContent='اجاره تجهیزات';a.className='pbCanonicalNavLink pbRental633NavLink';nav.appendChild(a)}
    var other=h.querySelector('.pbMobileOtherLinks');if(other&&!other.querySelector('a[href="/equipment-rental"]')){var a2=document.createElement('a');a2.href='/equipment-rental';a2.textContent='اجاره تجهیزات';other.appendChild(a2)}
    var acc=h.querySelector('.pbCanonicalAccounts');if(acc&&!acc.querySelector('a[href="/rental"]')){var a3=document.createElement('a');a3.href='/rental';a3.textContent='فروشگاه تجهیزات';acc.insertBefore(a3,acc.lastElementChild||null)}
    var footer=document.getElementById('pbCanonicalFooterV584');if(footer){var c=footer.querySelector('.pbFooterCenter');if(c&&!c.querySelector('a[href="/equipment-rental"]')){var f=document.createElement('a');f.href='/equipment-rental';f.textContent='اجاره تجهیزات';c.appendChild(f)}}
  }
  function cleanupPhotographerRentalShortcuts(){
    document.querySelectorAll('#pbRental632MobileBtn,#pbRental632DesktopShopBtn,.pbRental618MobileBtn,.pbRental618HeaderBtn').forEach(function(n){n.remove()});
    if(document.body)document.body.classList.remove('pbRental632PhotographerDock');
    var old632=document.getElementById('pbRental632Style');if(old632)old632.remove();
    var old618=document.getElementById('pbRental618Style');if(old618)old618.remove();
  }
  function rentalInviteCopy(){
    if(location.pathname!='/photographer/signup')return;
    var q=new URLSearchParams(location.search),code=q.get('invite');if(!code)return;
    if(document.documentElement.dataset.pbRentalInviteChecked===code)return;document.documentElement.dataset.pbRentalInviteChecked=code;
    fetch('/api/public/photographer-invites/'+encodeURIComponent(code),{credentials:'same-origin'}).then(function(r){return r.ok?r.json():null}).then(function(d){
      if(!d||!d.invite||d.invite.issuerType!=='rental')return;document.documentElement.dataset.pbRentalInvite='1';
      function fix(root){var w=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT),n;while(n=w.nextNode()){var t=n.nodeValue||'',u=t.replace(/لابراتوار دعوت‌کننده/g,'فروشگاه دعوت‌کننده').replace(/اتصال حساب به لابراتوار/g,'اتصال حساب به فروشگاه').replace(/تأیید اتصال حساب به لابراتوار/g,'تأیید اتصال حساب به فروشگاه').replace(/اضافه‌شدن به لابراتوار/g,'اتصال به فروشگاه').replace(/عضو همین لابراتوار/g,'متصل به همین فروشگاه').replace(/لابراتوار صادرکننده دعوتنامه/g,'فروشگاه صادرکننده دعوتنامه');if(/^لابراتوار\s/.test(u))u=u.replace(/^لابراتوار\s/,'فروشگاه ');if(u!==t)n.nodeValue=u}}
      fix(document.body);var o=new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)fix(n);else if(n.nodeType===3&&n.parentNode)fix(n.parentNode)})})});o.observe(document.body,{childList:true,subtree:true});setTimeout(function(){o.disconnect()},30000)
    }).catch(function(){});
  }
  function mount(){addStyle();cleanupPhotographerRentalShortcuts();addPublic();rentalInviteCopy()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  var n=0,t=setInterval(function(){mount();if(++n>80)clearInterval(t)},750);
  window.addEventListener('popstate',mount,{passive:true});
})();
