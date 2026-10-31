/* PhotoBridge v0.17.681 — restore Instagram in photographer mobile navigation.
   Source JSX also contains this action; this runtime bridge keeps the deploy-lite prebuilt bundle in sync. */
(function(){
  function isMobile(){return window.matchMedia ? window.matchMedia('(max-width:820px)').matches : window.innerWidth<=820;}
  function ensureInstagram(){
    if(!isMobile() || !document.body.classList.contains('pbAuthenticatedPhotographerPortal')) return;
    document.querySelectorAll('.photographerBottomAppNavGrid:not(.labBottomAppNavGrid)').forEach(function(grid){
      if(grid.querySelector('.photographerInstagramMobileNav,.pb681InstagramMobileBtn')) return;
      var button=document.createElement('button');
      button.type='button';
      button.className='photographerInstagramMobileNav pb681InstagramMobileBtn';
      button.setAttribute('aria-label','اینستاگرام');
      button.innerHTML='<span class="photographerBottomNavIcon instagram" aria-hidden="true"></span><em>اینستاگرام</em>';
      button.addEventListener('click',function(){location.assign('/instagram-post-design/start');});
      var store=grid.querySelector('.pbRental656MobileBtn');
      if(store) grid.insertBefore(button,store); else grid.appendChild(button);
    });
  }
  function soon(){window.setTimeout(ensureInstagram,30);window.setTimeout(ensureInstagram,220);}
  window.addEventListener('load',soon,{once:true});
  window.addEventListener('resize',soon,{passive:true});
  window.addEventListener('popstate',soon);
  document.addEventListener('click',soon,true);
  ensureInstagram();
  window.setInterval(ensureInstagram,1500);
})();
