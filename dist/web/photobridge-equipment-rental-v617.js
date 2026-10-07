/* PhotoBridge v0.17.617 — equipment rental discovery + photographer access */
(function(){
  'use strict';
  function addStyle(){if(document.getElementById('pbRental617Style'))return;var s=document.createElement('style');s.id='pbRental617Style';s.textContent=`
    .pbRental617NavLink{position:relative}.pbRental617NavLink:after{content:"جدید";font-size:6.5px;font-weight:950;margin-right:3px;padding:1px 4px;border-radius:999px;background:#eef2ff;color:#315efb}
    #pbCanonicalHeaderV584.pbScrolled .pbRental617NavLink:after{background:rgba(255,255,255,.18);color:#fff}
    .pbRental617HeaderBtn{display:inline-flex!important;align-items:center!important;gap:4px!important}
    .pbRental617HeaderBtn:before{content:"◫";font-size:13px}
    @media(max-width:760px){
      .photographerBottomAppNavGrid:not(.labBottomAppNavGrid){grid-template-columns:repeat(5,minmax(0,1fr))!important}
      .photographerBottomAppNavGrid .pbRental617MobileBtn .pbRental617GearIcon{position:relative;width:25px!important;height:25px!important;display:grid!important;place-items:center!important}
      .photographerBottomAppNavGrid .pbRental617MobileBtn .pbRental617GearIcon:before{content:"";width:18px;height:13px;border:1.8px solid currentColor;border-radius:3px;display:block}
      .photographerBottomAppNavGrid .pbRental617MobileBtn .pbRental617GearIcon:after{content:"";position:absolute;top:2px;width:8px;height:4px;border:1.8px solid currentColor;border-bottom:0;border-radius:3px 3px 0 0}
      .photographerBottomAppNavGrid .pbRental617MobileBtn em{font-size:8.4px!important}
    }
  `;document.head.appendChild(s)}
  function addPublic(){var h=document.getElementById('pbCanonicalHeaderV584');if(!h)return;var nav=h.querySelector('.pbCanonicalDesktopNav');if(nav&&!nav.querySelector('.pbRental617NavLink')){var a=document.createElement('a');a.href='/equipment-rental';a.textContent='اجاره تجهیزات';a.className='pbCanonicalNavLink pbRental617NavLink';nav.appendChild(a)}var other=h.querySelector('.pbMobileOtherLinks');if(other&&!other.querySelector('a[href="/equipment-rental"]')){var a2=document.createElement('a');a2.href='/equipment-rental';a2.textContent='اجاره تجهیزات';other.appendChild(a2)}var acc=h.querySelector('.pbCanonicalAccounts');if(acc&&!acc.querySelector('a[href="/rental"]')){var a3=document.createElement('a');a3.href='/rental';a3.textContent='فروشگاه تجهیزات';acc.insertBefore(a3,acc.lastElementChild||null)}var footer=document.getElementById('pbCanonicalFooterV584');if(footer){var c=footer.querySelector('.pbFooterCenter');if(c&&!c.querySelector('a[href="/equipment-rental"]')){var f=document.createElement('a');f.href='/equipment-rental';f.textContent='اجاره تجهیزات';c.appendChild(f)}}}
  function addPhotographer(){if(!location.pathname.startsWith('/photographer'))return;var grid=document.querySelector('.photographerBottomAppNavGrid:not(.labBottomAppNavGrid)');if(grid&&!grid.querySelector('.pbRental617MobileBtn')){var b=document.createElement('button');b.type='button';b.className='pbRental617MobileBtn';b.setAttribute('aria-label','اجاره تجهیزات');b.innerHTML='<span class="photographerBottomNavIcon pbRental617GearIcon" aria-hidden="true"></span><em>تجهیزات</em>';b.addEventListener('click',function(){location.href='/equipment-rental/book'});grid.appendChild(b)}var tools=document.querySelector('.photographerHeaderTools .roleHeaderToolButtons');if(tools&&!tools.querySelector('.pbRental617HeaderBtn')){var d=document.createElement('button');d.type='button';d.className='headerUtilityBtn secondaryHeaderUtility pbRental617HeaderBtn';d.textContent='تجهیزات';d.title='اجاره تجهیزات';d.addEventListener('click',function(){location.href='/equipment-rental/book'});tools.insertBefore(d,tools.firstChild)}}
  function mount(){addStyle();addPublic();addPhotographer()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  var n=0,t=setInterval(function(){mount();if(++n>80)clearInterval(t)},750);
  window.addEventListener('popstate',mount,{passive:true});
})();
