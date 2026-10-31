/* PhotoBridge v0.17.670 — stable photographer store entry + lab-settings route isolation */
(function(){
  'use strict';
  var access={checkedAt:0,connected:false,loading:null};
  function addStyle(){
    if(document.getElementById('pbRental656Style'))return;
    var s=document.createElement('style');s.id='pbRental656Style';s.textContent=`
      .pbRental656NavLink{position:relative}.pbRental656NavLink:after{content:"جدید";font-size:6.5px;font-weight:950;margin-right:3px;padding:1px 4px;border-radius:999px;background:#eef2ff;color:#315efb}
      #pbCanonicalHeaderV584.pbScrolled .pbRental656NavLink:after,#pbCanonicalHeaderV624.pbScrolled .pbRental656NavLink:after{background:rgba(255,255,255,.18);color:#fff}
      .pbRental656DesktopShopBtn{white-space:nowrap}
      .pbRental656MobileBtn .pbRental656MobileIcon{width:24px;height:24px;border-radius:9px;display:grid;place-items:center;background:#f1f5f9;color:#475467}
      .pbRental656MobileBtn .pbRental656MobileIcon svg{width:19px;height:19px;display:block}
      @media(max-width:820px){.photographerBottomAppNavGrid.pbRental656Connected{grid-template-columns:repeat(5,minmax(0,1fr))!important}.pbRental656DesktopShopBtn{display:none!important}}
      @media(min-width:821px){.pbRental656MobileBtn{display:none!important}}
    `;document.head.appendChild(s)
  }
  function addPublic(){
    var h=document.getElementById('pbCanonicalHeaderV584')||document.getElementById('pbCanonicalHeaderV624');if(!h)return;
    var nav=h.querySelector('.pbCanonicalDesktopNav');
    if(nav&&!nav.querySelector('.pbRental656NavLink')){var a=document.createElement('a');a.href='/equipment-rental';a.textContent='اجاره تجهیزات';a.className='pbCanonicalNavLink pbRental656NavLink';nav.appendChild(a)}
    var other=h.querySelector('.pbMobileOtherLinks');if(other&&!other.querySelector('a[href="/equipment-rental"]')){var a2=document.createElement('a');a2.href='/equipment-rental';a2.textContent='اجاره تجهیزات';other.appendChild(a2)}
    var acc=h.querySelector('.pbCanonicalAccounts');if(acc&&!acc.querySelector('a[href="/rental"]')){var a3=document.createElement('a');a3.href='/rental';a3.textContent='فروشگاه تجهیزات';acc.insertBefore(a3,acc.lastElementChild||null)}
    var footer=document.getElementById('pbCanonicalFooterV584');if(footer){var c=footer.querySelector('.pbFooterCenter');if(c&&!c.querySelector('a[href="/equipment-rental"]')){var f=document.createElement('a');f.href='/equipment-rental';f.textContent='اجاره تجهیزات';c.appendChild(f)}}
  }
  function isPhotographerArea(){return /^\/photographer(?:\/|$)/.test(location.pathname||'')}
  function isolateLabSettings(){
    var inLab=/^\/lab(?:\/|$)/.test(location.pathname||'');
    document.querySelectorAll('[title="تنظیمات لابراتوار"],[aria-label="تنظیمات لابراتوار"]').forEach(function(el){
      if(inLab){if(el.dataset.pbLabSettingsRouteHidden==='1'){el.style.removeProperty('display');delete el.dataset.pbLabSettingsRouteHidden}}
      else{el.style.setProperty('display','none','important');el.dataset.pbLabSettingsRouteHidden='1'}
    })
  }
  function cleanupOld(){
    document.querySelectorAll('#pbRental632MobileBtn,#pbRental632DesktopShopBtn,.pbRental618MobileBtn,.pbRental618HeaderBtn').forEach(function(n){n.remove()});
    var old632=document.getElementById('pbRental632Style');if(old632)old632.remove();var old618=document.getElementById('pbRental618Style');if(old618)old618.remove();
  }
  function removeConnectedButtons(){
    document.querySelectorAll('.pbRental656MobileBtn,.pbRental656DesktopShopBtn').forEach(function(n){n.remove()});
    document.querySelectorAll('.photographerBottomAppNavGrid.pbRental656Connected').forEach(function(n){n.classList.remove('pbRental656Connected')});
  }
  function openStore(){location.href='/equipment-rental/book'}
  function mountConnectedButtons(){
    if(!isPhotographerArea()){removeConnectedButtons();return}
    access.connected=true
    var desktop=document.querySelector('.photographerHomeModeNav');
    if(desktop&&!desktop.querySelector('.pbRental656DesktopShopBtn')){
      var d=document.createElement('button');d.type='button';d.className='rolePrimaryAction pbRental656DesktopShopBtn';d.textContent='فروشگاه تجهیزات';d.setAttribute('aria-label','فروشگاه تجهیزات');d.addEventListener('click',openStore);desktop.appendChild(d)
    }
    var grid=document.querySelector('.photographerBottomAppNavGrid:not(.labBottomAppNavGrid)');
    if(grid){grid.classList.add('pbRental656Connected');if(!grid.querySelector('.pbRental656MobileBtn')){var b=document.createElement('button');b.type='button';b.className='pbRental656MobileBtn';b.setAttribute('aria-label','فروشگاه تجهیزات');b.innerHTML='<span class="pbRental656MobileIcon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4.5 8.2h15l-1 11.3h-13l-1-11.3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.5 8.2V6.7A4.5 4.5 0 0 1 12 2.5a4.5 4.5 0 0 1 4.5 4.2v1.5M8.3 12.2h7.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span><em>فروشگاه</em>';b.addEventListener('click',openStore);grid.appendChild(b)}}
  }
  function checkConnected(force){
    if(!isPhotographerArea()){access.connected=false;removeConnectedButtons();return Promise.resolve(false)}
    access.connected=true;access.checkedAt=Date.now();mountConnectedButtons();return Promise.resolve(true)
  }
  function rentalInviteCopy(){
    if(location.pathname!='/photographer/signup')return;var q=new URLSearchParams(location.search),code=q.get('invite');if(!code)return;
    if(document.documentElement.dataset.pbRentalInviteChecked===code)return;document.documentElement.dataset.pbRentalInviteChecked=code;
    fetch('/api/public/photographer-invites/'+encodeURIComponent(code),{credentials:'same-origin'}).then(function(r){return r.ok?r.json():null}).then(function(d){if(!d||!d.invite||d.invite.issuerType!=='rental')return;document.documentElement.dataset.pbRentalInvite='1';function fix(root){var w=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT),n;while(n=w.nextNode()){var t=n.nodeValue||'',u=t.replace(/لابراتوار دعوت‌کننده/g,'فروشگاه دعوت‌کننده').replace(/اتصال حساب به لابراتوار/g,'اتصال حساب به فروشگاه').replace(/تأیید اتصال حساب به لابراتوار/g,'تأیید اتصال حساب به فروشگاه').replace(/اضافه‌شدن به لابراتوار/g,'اتصال به فروشگاه').replace(/عضو همین لابراتوار/g,'متصل به همین فروشگاه').replace(/لابراتوار صادرکننده دعوتنامه/g,'فروشگاه صادرکننده دعوتنامه');if(/^لابراتوار\s/.test(u))u=u.replace(/^لابراتوار\s/,'فروشگاه ');if(u!==t)n.nodeValue=u}}fix(document.body);var o=new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)fix(n);else if(n.nodeType===3&&n.parentNode)fix(n.parentNode)})})});o.observe(document.body,{childList:true,subtree:true});setTimeout(function(){o.disconnect()},30000)}).catch(function(){})
  }
  function mount(){addStyle();cleanupOld();addPublic();rentalInviteCopy();isolateLabSettings();if(isPhotographerArea()){checkConnected(false);mountConnectedButtons()}else removeConnectedButtons()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  var observer=new MutationObserver(function(){isolateLabSettings();if(isPhotographerArea())mountConnectedButtons()});observer.observe(document.documentElement,{childList:true,subtree:true});
  var n=0,t=setInterval(function(){mount();if(++n>120)clearInterval(t)},750);
  window.addEventListener('popstate',function(){access.checkedAt=0;mount()},{passive:true});window.addEventListener('focus',function(){checkConnected(true)},{passive:true});
})();
