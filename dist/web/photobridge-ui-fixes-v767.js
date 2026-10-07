/* PhotoBridge v767 — actual pb762 controls: one back button + instant slide entry. */
(()=>{
  'use strict';
  const mq=matchMedia('(max-width:820px)');
  const workspace=()=>document.querySelector('.photographerMain.photographerPrintWorkspace');
  let wasComposing=false;
  let entryTimer=0;

  function composing(w){return !!w?.classList.contains('pb762Composing')}

  function cleanStale(){
    document.querySelectorAll('#pb765-back,#pb766-back').forEach(n=>n.remove());
    const backs=[...document.querySelectorAll('#pb762-back')];
    backs.slice(1).forEach(n=>n.remove());
  }

  function patchBack(w){
    cleanStale();
    const back=document.getElementById('pb762-back');
    if(!back)return;
    const lab=w.querySelector('.photographerPrintModeNav>.photographerPrintTopLab');
    if(composing(w)&&lab&&back.parentElement!==lab)lab.append(back);
    back.innerHTML='<span aria-hidden="true">←</span><span>بازگشت</span>';
    back.setAttribute('aria-label','بازگشت');
    back.title='بازگشت';
  }

  function bindPlus(){
    const add=document.getElementById('pb762-add');
    if(!add||add.dataset.pb767Bound==='1')return;
    add.dataset.pb767Bound='1';
    add.addEventListener('click',()=>{
      if(!mq.matches)return;
      /* No delay and no preventDefault: v765 opens the composer immediately. */
      const w=workspace();
      if(w)w.dataset.pb767ExpectEntry='1';
    },true);
  }

  function animateEntry(w){
    const now=composing(w);
    const expected=w.dataset.pb767ExpectEntry==='1';
    if(now&&!wasComposing&&expected&&!mq.matches)return;
    if(now&&!wasComposing&&expected){
      delete w.dataset.pb767ExpectEntry;
      w.classList.remove('pb767ComposerEnter');
      requestAnimationFrame(()=>{
        w.classList.add('pb767ComposerEnter');
        clearTimeout(entryTimer);
        entryTimer=setTimeout(()=>w.classList.remove('pb767ComposerEnter'),220);
      });
    }
    if(!now)delete w.dataset.pb767ExpectEntry;
    wasComposing=now;
  }

  function sync(){
    const w=workspace();
    if(!w)return;
    patchBack(w);
    bindPlus();
    animateEntry(w);
  }

  let raf=0;
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;sync()})};
  const root=document.getElementById('root');
  if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','disabled']});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('pageshow',schedule,{passive:true});
  schedule();
})();
