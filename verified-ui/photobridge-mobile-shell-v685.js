/* PhotoBridge v0.17.685 — deterministic mobile route bridge; no nav injection, polling or observers. */
(function(){
  'use strict';
  const INTERNAL='/photographer/album-design';
  function sync(){
    if(location.pathname!==INTERNAL)return;
    const instagram=new URLSearchParams(location.search).get('pb_mode')==='instagram';
    window.__PB_PUBLIC_DESIGN_MODE__=instagram?'instagram':'';
    document.body&&document.body.classList.toggle('pbInstagramDesignRoute',instagram);
  }
  sync();
  window.addEventListener('popstate',sync,{passive:true});
  window.addEventListener('pageshow',sync,{passive:true});
})();
