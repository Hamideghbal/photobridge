/* PhotoBridge v0.17.671 — exact photographer store dock + print-only tariff settings */
(function(){
  'use strict';
  var access={checkedAt:0,connected:false,loading:null};
  function addStyle(){
    if(document.getElementById('pbRental671Style'))return;
    var s=document.createElement('style');s.id='pbRental671Style';s.textContent=`
      .pbRental656NavLink{position:relative}.pbRental656NavLink:after{content:"جدید";font-size:6.5px;font-weight:950;margin-right:3px;padding:1px 4px;border-radius:999px;background:#eef2ff;color:#315efb}
      #pbCanonicalHeaderV584.pbScrolled .pbRental656NavLink:after,#pbCanonicalHeaderV624.pbScrolled .pbRental656NavLink:after{background:rgba(255,255,255,.18);color:#fff}
      .pbRental656DesktopShopBtn{white-space:nowrap}
      @media(max-width:820px){
        .photographerBottomAppNavGrid.pbRental656Connected{grid-template-columns:repeat(6,minmax(0,1fr))!important}
        .pbRental656DesktopShopBtn{display:none!important}
        .photographerBottomAppNav .photographerBottomNavIcon.store::before{
          -webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M4.5%208.2h15l-1%2011.3h-13l-1-11.3Z%22%2F%3E%3Cpath%20d%3D%22M7.5%208.2V6.7A4.5%204.5%200%200%201%2012%202.5a4.5%204.5%200%200%201%204.5%204.2v1.5M8.3%2012.2h7.4%22%2F%3E%3C%2Fsvg%3E")!important;
          mask-image:url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M4.5%208.2h15l-1%2011.3h-13l-1-11.3Z%22%2F%3E%3Cpath%20d%3D%22M7.5%208.2V6.7A4.5%204.5%200%200%201%2012%202.5a4.5%204.5%200%200%201%204.5%204.2v1.5M8.3%2012.2h7.4%22%2F%3E%3C%2Fsvg%3E")!important
        }
        .pb671PrintSettingsQuickAction{position:absolute!important;left:auto!important;right:10px!important;inset-inline-start:auto!important;inset-inline-end:10px!important;top:10px!important;z-index:90!important;display:flex!important}
        .pb671PrintSettingsQuickAction .mobileHeaderSettings{position:relative!important;width:32px!important;min-width:32px!important;height:32px!important;min-height:32px!important;padding:0!important;border:1px solid #d8dee9!important;border-radius:9px!important;background:#fff!important;color:#475467!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font:inherit!important}
        .pb671PrintSettingsQuickAction .mobileHeaderSettings>span{font-size:15px!important;line-height:1!important}
      }
      @media(min-width:821px){.pbRental656MobileBtn{display:none!important}.pb671PrintSettingsQuickAction{display:none!important}}
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
  function isPrintSettingsContext(){return new URLSearchParams(location.search).get('context')==='print'}
  function isolateLabSettings(){
    var inLab=/^\/lab(?:\/|$)/.test(location.pathname||'');
    document.querySelectorAll('[title="تنظیمات لابراتوار"],[aria-label="تنظیمات لابراتوار"]').forEach(function(el){
      if(inLab){if(el.dataset.pbLabSettingsRouteHidden==='1'){el.style.removeProperty('display');delete el.dataset.pbLabSettingsRouteHidden}}
      else{el.style.setProperty('display','none','important');el.dataset.pbLabSettingsRouteHidden='1'}
    })
  }
  function scopePhotographerTariffSettings(){
    if(!/^\/photographer\/settings(?:\/|$)/.test(location.pathname||''))return;
    var allow=isPrintSettingsContext();
    var priceButton=[].slice.call(document.querySelectorAll('.photographerSettingsTabs button')).find(function(b){return String(b.textContent||'').trim()==='تعرفه و سرویس'});
    if(priceButton){
      priceButton.style.setProperty('display',allow?'':'none',allow?'':'important');
      if(allow&&priceButton.dataset.pb671PrintContextBound!=='1'){
        priceButton.dataset.pb671PrintContextBound='1';
        priceButton.addEventListener('click',function(e){
          if(!isPrintSettingsContext())return;
          e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
          location.href='/photographer/settings/prices?context=print';
        },true);
      }
    }
    if(!allow&&/^\/photographer\/settings\/prices(?:\/|$)/.test(location.pathname||'')){
      var locationButton=[].slice.call(document.querySelectorAll('.photographerSettingsTabs button')).find(function(b){return /موقعیت/.test(String(b.textContent||''))});
      if(locationButton&&!locationButton.dataset.pb671Redirecting){locationButton.dataset.pb671Redirecting='1';setTimeout(function(){try{locationButton.click()}catch{}},0)}
    }
  }
  function mountPrintSettings(){
    document.querySelectorAll('.pb671PrintSettingsQuickAction').forEach(function(n){if(!document.querySelector('.photographerPrintModeHeader'))n.remove()});
    if(!isPhotographerArea()||!document.querySelector('.photographerPrintModeHeader'))return;
    var header=document.querySelector('.photographerPrintModeHeader');if(!header)return;if(header.querySelector('.photographerPrintModeUtilityCluster .mobileHeaderSettings')){header.querySelectorAll('.pb671PrintSettingsQuickAction').forEach(function(n){n.remove()});return}if(header.querySelector('.photographerPrintSettingsQuickAction')){header.querySelectorAll('.pb671PrintSettingsQuickAction').forEach(function(n){n.remove()});return}if(header.querySelector('.pb671PrintSettingsQuickAction'))return;
    var wrap=document.createElement('div');wrap.className='mobileHeaderQuickActions photographerMobileHeaderQuickActions pb671PrintSettingsQuickAction';
    var b=document.createElement('button');b.type='button';b.className='mobileHeaderSettings';b.title='تنظیمات چاپ';b.setAttribute('aria-label','تنظیمات چاپ');b.innerHTML='<span aria-hidden="true">⚙</span>';b.addEventListener('click',function(){location.href='/photographer/settings/prices?context=print'});wrap.appendChild(b);header.appendChild(wrap)
  }
  function cleanupOld(){
    document.querySelectorAll('#pbRental632MobileBtn,#pbRental632DesktopShopBtn,.pbRental618MobileBtn,.pbRental618HeaderBtn').forEach(function(n){n.remove()});
    ['pbRental632Style','pbRental618Style','pbRental656Style'].forEach(function(id){var old=document.getElementById(id);if(old)old.remove()})
  }
  function removeConnectedButtons(){
    document.querySelectorAll('.pbRental656MobileBtn,.pbRental656DesktopShopBtn').forEach(function(n){n.remove()});
    document.querySelectorAll('.photographerBottomAppNavGrid.pbRental656Connected').forEach(function(n){n.classList.remove('pbRental656Connected')})
  }
  function openStore(){location.href='/equipment-rental/book'}
  function mountConnectedButtons(){
    if(!isPhotographerArea()){removeConnectedButtons();return}
    access.connected=true;
    var desktop=document.querySelector('.photographerHomeModeNav');
    if(desktop&&!desktop.querySelector('.pbRental656DesktopShopBtn')){var d=document.createElement('button');d.type='button';d.className='rolePrimaryAction pbRental656DesktopShopBtn';d.textContent='فروشگاه تجهیزات';d.setAttribute('aria-label','فروشگاه تجهیزات');d.addEventListener('click',openStore);desktop.appendChild(d)}
    var grid=document.querySelector('.photographerBottomAppNavGrid:not(.labBottomAppNavGrid)');
    if(grid){grid.classList.add('pbRental656Connected');if(!grid.querySelector('.pbRental656MobileBtn')){var b=document.createElement('button');b.type='button';b.className='pbRental656MobileBtn';b.setAttribute('aria-label','فروشگاه تجهیزات');b.innerHTML='<span class="photographerBottomNavIcon store pbRental656MobileIcon" aria-hidden="true"></span><em>فروشگاه</em>';b.addEventListener('click',openStore);grid.appendChild(b)}}
  }
  function checkConnected(force){if(!isPhotographerArea()){access.connected=false;removeConnectedButtons();return Promise.resolve(false)}access.connected=true;access.checkedAt=Date.now();mountConnectedButtons();return Promise.resolve(true)}
  function rentalInviteCopy(){
    if(location.pathname!='/photographer/signup')return;var q=new URLSearchParams(location.search),code=q.get('invite');if(!code)return;
    if(document.documentElement.dataset.pbRentalInviteChecked===code)return;document.documentElement.dataset.pbRentalInviteChecked=code;
    fetch('/api/public/photographer-invites/'+encodeURIComponent(code),{credentials:'same-origin'}).then(function(r){return r.ok?r.json():null}).then(function(d){if(!d||!d.invite||d.invite.issuerType!=='rental')return;document.documentElement.dataset.pbRentalInvite='1';function fix(root){var w=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT),n;while(n=w.nextNode()){var t=n.nodeValue||'',u=t.replace(/لابراتوار دعوت‌کننده/g,'فروشگاه دعوت‌کننده').replace(/اتصال حساب به لابراتوار/g,'اتصال حساب به فروشگاه').replace(/تأیید اتصال حساب به لابراتوار/g,'تأیید اتصال حساب به فروشگاه').replace(/اضافه‌شدن به لابراتوار/g,'اتصال به فروشگاه').replace(/عضو همین لابراتوار/g,'متصل به همین فروشگاه').replace(/لابراتوار صادرکننده دعوتنامه/g,'فروشگاه صادرکننده دعوتنامه');if(/^لابراتوار\s/.test(u))u=u.replace(/^لابراتوار\s/,'فروشگاه ');if(u!==t)n.nodeValue=u}}fix(document.body);var o=new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)fix(n);else if(n.nodeType===3&&n.parentNode)fix(n.parentNode)})})});o.observe(document.body,{childList:true,subtree:true});setTimeout(function(){o.disconnect()},30000)}).catch(function(){})
  }
  function mount(){addStyle();cleanupOld();addPublic();rentalInviteCopy();isolateLabSettings();scopePhotographerTariffSettings();mountPrintSettings();if(isPhotographerArea()){checkConnected(false);mountConnectedButtons()}else removeConnectedButtons()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  var observer=new MutationObserver(function(){isolateLabSettings();scopePhotographerTariffSettings();mountPrintSettings();if(isPhotographerArea())mountConnectedButtons()});observer.observe(document.documentElement,{childList:true,subtree:true});
  var n=0,t=setInterval(function(){mount();if(++n>120)clearInterval(t)},750);
  window.addEventListener('popstate',function(){access.checkedAt=0;setTimeout(mount,0)},{passive:true});window.addEventListener('focus',function(){checkConnected(true);scopePhotographerTariffSettings();mountPrintSettings()},{passive:true});
})();
