/* PhotoBridge v0.17.682 — keep Instagram design inside the authenticated photographer portal. */
(function(){
  'use strict';
  var INTERNAL_PATH='/photographer/album-design';
  var INTERNAL_URL=INTERNAL_PATH+'?pb_mode=instagram';
  function isInstagramRoute(){
    try{return location.pathname===INTERNAL_PATH && new URLSearchParams(location.search).get('pb_mode')==='instagram'}catch{return false}
  }
  function syncDesignMode(){
    if(isInstagramRoute()) window.__PB_PUBLIC_DESIGN_MODE__='instagram';
    else if(location.pathname===INTERNAL_PATH) window.__PB_PUBLIC_DESIGN_MODE__='';
  }
  // Runs before the React bundle so direct refresh on the internal Instagram URL opens the right mode.
  syncDesignMode();
  window.addEventListener('popstate',syncDesignMode);

  function openInstagram(ev){
    if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}
    window.__PB_PUBLIC_DESIGN_MODE__='instagram';
    if(location.pathname===INTERNAL_PATH && new URLSearchParams(location.search).get('pb_mode')==='instagram') return;
    history.pushState(null,'',INTERNAL_URL);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  function isMobile(){return window.matchMedia ? window.matchMedia('(max-width:820px)').matches : window.innerWidth<=820;}
  function ensureInstagram(){
    if(!isMobile() || !document.body.classList.contains('pbAuthenticatedPhotographerPortal')) return;
    document.querySelectorAll('.photographerBottomAppNavGrid:not(.labBottomAppNavGrid)').forEach(function(grid){
      var button=grid.querySelector('.photographerInstagramMobileNav,.pb682InstagramMobileBtn');
      if(!button){
        button=document.createElement('button');
        button.type='button';
        button.className='photographerInstagramMobileNav pb682InstagramMobileBtn';
        button.setAttribute('aria-label','اینستاگرام');
        button.innerHTML='<span class="photographerBottomNavIcon instagram" aria-hidden="true"></span><em>اینستاگرام</em>';
        var store=grid.querySelector('.pbRental656MobileBtn');
        if(store) grid.insertBefore(button,store); else grid.appendChild(button);
      }
      if(button.getAttribute('data-pb682-route')!=='1'){
        button.setAttribute('data-pb682-route','1');
        button.addEventListener('click',openInstagram,true);
      }
      button.classList.toggle('active',isInstagramRoute());
      var album=grid.querySelector('.albumDesignMobileNav');
      if(album && isInstagramRoute()) album.classList.remove('active');
    });
  }
  // Clear the special mode before the native Album button changes route.
  document.addEventListener('click',function(ev){
    var target=ev.target && ev.target.closest ? ev.target.closest('.photographerAlbumDesignEntry,.albumDesignMobileNav') : null;
    if(target && !target.classList.contains('photographerInstagramMobileNav')) window.__PB_PUBLIC_DESIGN_MODE__='';
  },true);
  function soon(){syncDesignMode();setTimeout(ensureInstagram,20);setTimeout(ensureInstagram,180);}
  window.addEventListener('load',soon,{once:true});
  window.addEventListener('resize',soon,{passive:true});
  window.addEventListener('popstate',soon);
  document.addEventListener('click',function(ev){
    var btn=ev.target && ev.target.closest ? ev.target.closest('.photographerInstagramMobileNav') : null;
    if(btn) openInstagram(ev);
    else setTimeout(ensureInstagram,20);
  },true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',soon,{once:true}); else soon();
  setInterval(ensureInstagram,1600);
})();
