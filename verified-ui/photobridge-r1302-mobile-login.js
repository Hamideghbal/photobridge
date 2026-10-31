/* Keep only login surfaces inside the keyboard's visible viewport. */
(()=>{
  const root=document.documentElement;
  const login='.unifiedLoginPage,#loginView.rentalLoginOverlay,body.pbR100F28PortalLogin .authBg';
  function update(){
    const mobile=window.matchMedia('(max-width: 767px)').matches;
    const field=document.activeElement;
    const focused=mobile&&Boolean(field?.matches('input:not([type="checkbox"]):not([type="radio"]),textarea')&&field.closest(login));
    root.classList.toggle('pbR1302LoginFocus',focused);
    const viewport=window.visualViewport;
    // Pinch zoom should retain the browser's own panning behavior.
    const fit=mobile&&(!viewport||Math.abs(viewport.scale-1)<0.05);
    root.style.setProperty('--pb-login-height',(fit?(viewport?.height||window.innerHeight):window.innerHeight)+'px');
    root.style.setProperty('--pb-login-top',(fit?(viewport?.offsetTop||0):0)+'px');
  }
  window.addEventListener('resize',update,{passive:true});
  window.visualViewport?.addEventListener('resize',update,{passive:true});
  window.visualViewport?.addEventListener('scroll',update,{passive:true});
  document.addEventListener('focusin',update);
  document.addEventListener('focusout',()=>requestAnimationFrame(update));
  update();
})();
