/* PhotoBridge v0.17.576 — consistent public header active state */
(function(){
  'use strict';
  function normalize(path){
    path=String(path||'/').split('?')[0].split('#')[0]||'/';
    if(path.length>1) path=path.replace(/\/+$/,'');
    return path;
  }
  function activeRoot(path){
    path=normalize(path);
    if(path==='/ai'||path.indexOf('/retouch-photo')===0) return '/retouch-photo';
    if(path.indexOf('/album-design')===0) return '/album-design';
    if(path.indexOf('/photo-lab-print')===0) return '/photo-lab-print';
    if(path.indexOf('/instagram-post-design')===0) return '/instagram-post-design';
    if(path.indexOf('/photo-selection-gallery')===0) return '/photo-selection-gallery';
    if(path.indexOf('/guide')===0) return '/guide';
    return '';
  }
  function sync(){
    var root=activeRoot(location.pathname);
    var links=document.querySelectorAll('.publicNavLinks a.publicFeatureLink,.publicSeoHeader nav a,.seoSafeNav a');
    for(var i=0;i<links.length;i++){
      var a=links[i];
      a.classList.remove('publicRetouchNavHighlight');
      var href=normalize(a.getAttribute('href')||'');
      var active=!!root && href===root;
      a.classList.toggle('pbPublicNavActive',active);
      a.classList.toggle('active',active);
      if(active) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    }
  }
  var queued=false;
  function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;sync()})}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',sync,{once:true}); else sync();
  try{new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true})}catch(_){ }
  addEventListener('popstate',sync);addEventListener('hashchange',sync);
})();
