/* PhotoBridge v0.17.618 — equipment rental discovery + photographer access */
(function(){
  'use strict';
  function addStyle(){if(document.getElementById('pbRental618Style'))return;var s=document.createElement('style');s.id='pbRental618Style';s.textContent=`
    .pbRental618NavLink{position:relative}.pbRental618NavLink:after{content:"جدید";font-size:6.5px;font-weight:950;margin-right:3px;padding:1px 4px;border-radius:999px;background:#eef2ff;color:#315efb}
    #pbCanonicalHeaderV584.pbScrolled .pbRental618NavLink:after{background:rgba(255,255,255,.18);color:#fff}
    .pbRental618HeaderBtn{display:inline-flex!important;align-items:center!important;gap:4px!important}
    .pbRental618HeaderBtn:before{content:"◫";font-size:13px}
    @media(max-width:760px){
      .photographerBottomAppNavGrid:not(.labBottomAppNavGrid){grid-template-columns:repeat(5,minmax(0,1fr))!important}
      .photographerBottomAppNavGrid .pbRental618MobileBtn .pbRental618GearIcon{position:relative;width:25px!important;height:25px!important;display:grid!important;place-items:center!important}
      .photographerBottomAppNavGrid .pbRental618MobileBtn .pbRental618GearIcon:before{content:"";width:18px;height:13px;border:1.8px solid currentColor;border-radius:3px;display:block}
      .photographerBottomAppNavGrid .pbRental618MobileBtn .pbRental618GearIcon:after{content:"";position:absolute;top:2px;width:8px;height:4px;border:1.8px solid currentColor;border-bottom:0;border-radius:3px 3px 0 0}
      .photographerBottomAppNavGrid .pbRental618MobileBtn em{font-size:8.4px!important}
    }
  `;document.head.appendChild(s)}
  function addPublic(){var h=document.getElementById('pbCanonicalHeaderV584');if(!h)return;var nav=h.querySelector('.pbCanonicalDesktopNav');if(nav&&!nav.querySelector('.pbRental618NavLink')){var a=document.createElement('a');a.href='/equipment-rental';a.textContent='اجاره تجهیزات';a.className='pbCanonicalNavLink pbRental618NavLink';nav.appendChild(a)}var other=h.querySelector('.pbMobileOtherLinks');if(other&&!other.querySelector('a[href="/equipment-rental"]')){var a2=document.createElement('a');a2.href='/equipment-rental';a2.textContent='اجاره تجهیزات';other.appendChild(a2)}var acc=h.querySelector('.pbCanonicalAccounts');if(acc&&!acc.querySelector('a[href="/rental"]')){var a3=document.createElement('a');a3.href='/rental';a3.textContent='فروشگاه تجهیزات';acc.insertBefore(a3,acc.lastElementChild||null)}var footer=document.getElementById('pbCanonicalFooterV584');if(footer){var c=footer.querySelector('.pbFooterCenter');if(c&&!c.querySelector('a[href="/equipment-rental"]')){var f=document.createElement('a');f.href='/equipment-rental';f.textContent='اجاره تجهیزات';c.appendChild(f)}}}
  function addPhotographer(){if(!location.pathname.startsWith('/photographer'))return;var grid=document.querySelector('.photographerBottomAppNavGrid:not(.labBottomAppNavGrid)');if(grid&&!grid.querySelector('.pbRental618MobileBtn')){var b=document.createElement('button');b.type='button';b.className='pbRental618MobileBtn';b.setAttribute('aria-label','اجاره تجهیزات');b.innerHTML='<span class="photographerBottomNavIcon pbRental618GearIcon" aria-hidden="true"></span><em>تجهیزات</em>';b.addEventListener('click',function(){location.href='/equipment-rental/book'});grid.appendChild(b)}var tools=document.querySelector('.photographerHeaderTools .roleHeaderToolButtons');if(tools&&!tools.querySelector('.pbRental618HeaderBtn')){var d=document.createElement('button');d.type='button';d.className='headerUtilityBtn secondaryHeaderUtility pbRental618HeaderBtn';d.textContent='تجهیزات';d.title='اجاره تجهیزات';d.addEventListener('click',function(){location.href='/equipment-rental/book'});tools.insertBefore(d,tools.firstChild)}}
  function rentalInviteCopy(){
    if(location.pathname!='/photographer/signup')return;
    var q=new URLSearchParams(location.search),code=q.get('invite');if(!code)return;
    if(document.documentElement.dataset.pbRentalInviteChecked===code)return;
    document.documentElement.dataset.pbRentalInviteChecked=code;
    fetch('/api/public/photographer-invites/'+encodeURIComponent(code),{credentials:'same-origin'}).then(function(r){return r.ok?r.json():null}).then(function(d){
      if(!d||!d.invite||d.invite.issuerType!=='rental')return;
      document.documentElement.dataset.pbRentalInvite='1';
      function fix(root){
        var w=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT),n;
        while(n=w.nextNode()){
          var t=n.nodeValue||'',u=t
            .replace(/لابراتوار دعوت‌کننده/g,'فروشگاه دعوت‌کننده')
            .replace(/اتصال حساب به لابراتوار/g,'اتصال حساب به فروشگاه')
            .replace(/تأیید اتصال حساب به لابراتوار/g,'تأیید اتصال حساب به فروشگاه')
            .replace(/اضافه‌شدن به لابراتوار/g,'اتصال به فروشگاه')
            .replace(/عضو همین لابراتوار/g,'متصل به همین فروشگاه')
            .replace(/لابراتوار صادرکننده دعوتنامه/g,'فروشگاه صادرکننده دعوتنامه');
          if(/^لابراتوار\s/.test(u))u=u.replace(/^لابراتوار\s/,'فروشگاه ');
          if(u!==t)n.nodeValue=u;
        }
      }
      fix(document.body);var o=new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)fix(n);else if(n.nodeType===3&&n.parentNode)fix(n.parentNode)})})});o.observe(document.body,{childList:true,subtree:true});setTimeout(function(){o.disconnect()},30000);
    }).catch(function(){});
  }
  function mount(){addStyle();addPublic();addPhotographer();rentalInviteCopy()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  var n=0,t=setInterval(function(){mount();if(++n>80)clearInterval(t)},750);
  window.addEventListener('popstate',mount,{passive:true});
})();
