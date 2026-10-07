/* PhotoBridge v766 — back placement + animated plus navigation. */
(()=>{
  'use strict';
  const mobile=()=>matchMedia('(max-width:820px)').matches;
  const workspace=()=>document.querySelector('.photographerMain.photographerPrintWorkspace');
  let wasComposing=false,enterTimer=0;

  function composeState(w){return !!w?.classList.contains('pb765Composing')}
  function isAlbum(w){return !!w?.querySelector('.photographerPrintModeNav>.photographerPrintAlbumTab.active')||!!w?.classList.contains('photographerAlbumWorkspaceMode')}

  function placeBack(w){
    if(!w)return;
    const backs=[...w.querySelectorAll('#pb765-back')];
    const back=backs[0];
    const lab=w.querySelector('.photographerPrintModeNav>.photographerPrintTopLab');
    if(!back||!lab)return;
    for(const extra of backs.slice(1)) extra.remove();
    if(back.parentElement!==lab)lab.append(back);
    back.innerHTML='<span aria-hidden="true">←</span><span>بازگشت</span>';
    back.setAttribute('aria-label','بازگشت');
  }

  function animateComposerEntry(w){
    const now=composeState(w);
    if(now&&!wasComposing){
      w.classList.remove('pb766PageLeaving');
      w.classList.remove('pb766ComposerEnter');
      void w.offsetWidth;
      w.classList.add('pb766ComposerEnter');
      clearTimeout(enterTimer);enterTimer=setTimeout(()=>w.classList.remove('pb766ComposerEnter'),300);
    }
    wasComposing=now;
  }

  function patchPlus(w){
    const add=document.getElementById('pb765-add');
    if(!add||add.dataset.pb766Bound==='1')return;
    add.dataset.pb766Bound='1';
    add.addEventListener('click',e=>{
      if(!mobile())return;
      const ww=workspace();if(!ww||composeState(ww))return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      const mode=isAlbum(ww)?'album':'print';
      const source=document.querySelector(`.photographerMobileOrderLaunch.${mode} .photographerMobileOrderAction`);
      if(!source||source.disabled)return;
      ww.classList.add('pb766PageLeaving');
      const delay=matchMedia('(prefers-reduced-motion:reduce)').matches?0:155;
      setTimeout(()=>{
        window.PB765OpenComposerOnly=true;
        source.click();
        setTimeout(()=>{window.PB765OpenComposerOnly=false},260);
      },delay);
    },true);
  }

  function sync(){const w=workspace();if(!w)return;placeBack(w);patchPlus(w);animateComposerEntry(w)}
  const mo=new MutationObserver(()=>requestAnimationFrame(sync));
  mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  addEventListener('resize',sync,{passive:true});
  addEventListener('pageshow',sync,{passive:true});
  sync();
})();
