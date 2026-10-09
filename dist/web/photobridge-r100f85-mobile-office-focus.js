/* R100F85: do not bring up a mobile keyboard while opening manual office/new photographer. */
(()=>{
  if(window.__PB_R100F85_MOBILE_OFFICE__)return;
  window.__PB_R100F85_MOBILE_OFFICE__=true;
  if(!window.matchMedia||!window.matchMedia('(max-width:700px)').matches)return;
  const modal=()=>document.querySelector('#pb892ManualBackdrop.open');
  const isTyping=el=>el?.matches?.('input:not([type=checkbox]):not([type=radio]),textarea,[contenteditable=true]');
  let suppressUntil=0;
  function blurUnrequested(){
    const active=document.activeElement;
    if(!modal()||!isTyping(active)||Date.now()>suppressUntil)return;
    try{active.blur()}catch{}
  }
  document.addEventListener('click',e=>{
    if(e.target.closest?.('#pb904r24NewPhotographerBtn,#pb892CalendarContinue,[data-pb843-office-tab="manual"]')){
      suppressUntil=Date.now()+650;
      if(isTyping(document.activeElement))document.activeElement.blur();
      queueMicrotask(blurUnrequested);
      requestAnimationFrame(blurUnrequested);
    }
    if(modal()&&isTyping(e.target))suppressUntil=0;
  },true);
  document.addEventListener('focusin',e=>{
    if(!modal()||!isTyping(e.target)||Date.now()>suppressUntil)return;
    // A real touch/click on an input clears suppression above.
    e.target.blur();
  },true);
  document.addEventListener('pointerdown',e=>{
    if(modal()&&isTyping(e.target))suppressUntil=0;
  },true);
})();
