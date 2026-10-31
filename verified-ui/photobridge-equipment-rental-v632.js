/* PhotoBridge v0.17.632 — desktop/mobile photographer shop shortcut; album routing stays in core photographer router */
(function(){
  'use strict';
  var MOBILE_QUERY='(max-width: 820px), (pointer: coarse)';
  function isMobile(){try{return !!window.matchMedia(MOBILE_QUERY).matches}catch{return window.innerWidth<=820}}
  function addStyle(){
    if(document.getElementById('pbRental632Style'))return;
    var s=document.createElement('style');s.id='pbRental632Style';s.textContent=`
      .pbRental632NavLink{position:relative}.pbRental632NavLink:after{content:"جدید";font-size:6.5px;font-weight:950;margin-right:3px;padding:1px 4px;border-radius:999px;background:#eef2ff;color:#315efb}
      #pbCanonicalHeaderV584.pbScrolled .pbRental632NavLink:after,#pbCanonicalHeaderV624.pbScrolled .pbRental632NavLink:after{background:rgba(255,255,255,.18);color:#fff}
      .pbRental632MobileBtn{display:none}
      .pbRental632DesktopShopBtn{display:inline-flex!important;align-items:center!important;justify-content:center!important}
      @media(max-width:820px){
        body.pbRental632PhotographerDock .photographerBottomAppNav .photographerBottomAppNavGrid:not(.labBottomAppNavGrid){
          width:80%!important;max-width:80%!important;margin-left:20%!important;margin-right:0!important;grid-template-columns:repeat(4,minmax(0,1fr))!important
        }
        .pbRental632MobileBtn{
          appearance:none!important;display:flex!important;position:fixed!important;left:8px!important;bottom:calc(7px + env(safe-area-inset-bottom,0px))!important;
          width:calc(20% - 10px)!important;height:52px!important;min-height:52px!important;margin:0!important;padding:4px 2px 3px!important;
          border:0!important;border-radius:13px!important;background:transparent!important;color:#667085!important;box-shadow:none!important;
          flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;font-family:inherit!important;line-height:1!important;
          z-index:365!important;-webkit-tap-highlight-color:transparent!important
        }
        .pbRental632MobileBtn:active{transform:scale(.97)!important}
        .pbRental632MobileBtn .pbRental632Icon{width:26px;height:25px;display:grid;place-items:center;border-radius:9px;background:#f1f5f9;color:#475467}
        .pbRental632MobileBtn .pbRental632Icon svg{width:19px;height:19px;display:block;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
        .pbRental632MobileBtn em{display:block;margin:0;padding:0;color:inherit;font-style:normal;font-size:8.6px;font-weight:850;line-height:1.25;white-space:nowrap}
      }
    `;document.head.appendChild(s)
  }
  function addPublic(){
    var h=document.getElementById('pbCanonicalHeaderV584')||document.getElementById('pbCanonicalHeaderV624');if(!h)return;
    var nav=h.querySelector('.pbCanonicalDesktopNav');
    if(nav&&!nav.querySelector('.pbRental632NavLink')){var a=document.createElement('a');a.href='/equipment-rental';a.textContent='اجاره تجهیزات';a.className='pbCanonicalNavLink pbRental632NavLink';nav.appendChild(a)}
    var other=h.querySelector('.pbMobileOtherLinks');if(other&&!other.querySelector('a[href="/equipment-rental"]')){var a2=document.createElement('a');a2.href='/equipment-rental';a2.textContent='اجاره تجهیزات';other.appendChild(a2)}
    var acc=h.querySelector('.pbCanonicalAccounts');if(acc&&!acc.querySelector('a[href="/rental"]')){var a3=document.createElement('a');a3.href='/rental';a3.textContent='فروشگاه تجهیزات';acc.insertBefore(a3,acc.lastElementChild||null)}
    var footer=document.getElementById('pbCanonicalFooterV584');if(footer){var c=footer.querySelector('.pbFooterCenter');if(c&&!c.querySelector('a[href="/equipment-rental"]')){var f=document.createElement('a');f.href='/equipment-rental';f.textContent='اجاره تجهیزات';c.appendChild(f)}}
  }
  function cleanupLegacyPhotographerInjection(){
    document.querySelectorAll('.pbRental618MobileBtn,.pbRental618HeaderBtn').forEach(function(n){n.remove()});
    var old=document.getElementById('pbRental618Style');if(old)old.remove();
  }
  function openRental(){location.assign('/equipment-rental/book')}
  function mountPhotographerShortcut(){
    var onPhotographer=location.pathname.indexOf('/photographer')===0;
    var mobileBtn=document.getElementById('pbRental632MobileBtn');
    var desktopBtn=document.getElementById('pbRental632DesktopShopBtn');
    if(!onPhotographer){
      document.body&&document.body.classList.remove('pbRental632PhotographerDock');
      if(mobileBtn)mobileBtn.remove();if(desktopBtn)desktopBtn.remove();return
    }
    cleanupLegacyPhotographerInjection();
    if(document.body)document.body.classList.add('pbRental632PhotographerDock');
    if(!isMobile()){
      if(mobileBtn)mobileBtn.remove();
      if(document.querySelector('.photographerShopEntry')){if(desktopBtn)desktopBtn.remove();return}
      var nav=document.querySelector('.photographerHomeModeNav');
      if(!nav){if(desktopBtn)desktopBtn.remove();return}
      if(!desktopBtn){
        desktopBtn=document.createElement('button');desktopBtn.id='pbRental632DesktopShopBtn';desktopBtn.type='button';desktopBtn.className='rolePrimaryAction pbRental632DesktopShopBtn';desktopBtn.textContent='شاپ تجهیزات';
        desktopBtn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();openRental()});
      }
      if(desktopBtn.parentNode!==nav)nav.insertBefore(desktopBtn,nav.firstChild||null);
      return
    }
    if(desktopBtn)desktopBtn.remove();
    var nav=document.querySelector('.photographerBottomAppNav:not(.labBottomAppNav)');
    if(!nav)return;
    var b=document.getElementById('pbRental632MobileBtn');
    if(!b){
      b=document.createElement('button');b.id='pbRental632MobileBtn';b.type='button';b.className='pbRental632MobileBtn';b.setAttribute('aria-label','اجاره تجهیزات');
      b.innerHTML='<span class="pbRental632Icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 7.5 9.4 5h5.2L16 7.5"/><rect x="3" y="7.5" width="18" height="12.5" rx="3"/><circle cx="12" cy="13.7" r="3.6"/><path d="M18 10.5h.01"/></svg></span><em>تجهیزات</em>';
      b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();openRental()});document.body.appendChild(b)
    }
  }
  function installAlbumGuard(){
    if(document.documentElement.dataset.pbRental632AlbumGuard==='1')return;document.documentElement.dataset.pbRental632AlbumGuard='1';
    document.addEventListener('click',function(ev){
      if(location.pathname.indexOf('/photographer')!==0||!isMobile())return;
      var t=ev.target&&ev.target.closest?ev.target.closest('.photographerBottomAppNavGrid button[aria-label="طراحی آلبوم"]'):null;
      if(!t)return;
      ev.preventDefault();ev.stopPropagation();if(typeof ev.stopImmediatePropagation==='function')ev.stopImmediatePropagation();
      if(location.pathname!=='/photographer/album-design')location.assign('/photographer/album-design');
    },true);
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
  function mount(){addStyle();addPublic();mountPhotographerShortcut();rentalInviteCopy()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  var n=0,t=setInterval(function(){mount();if(++n>80)clearInterval(t)},750);
  window.addEventListener('popstate',mount,{passive:true});
  window.addEventListener('resize',mount,{passive:true});
})();
