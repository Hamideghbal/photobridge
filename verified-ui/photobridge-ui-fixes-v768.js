/* PhotoBridge v768 — repair the actual v765 composer back button and entry animation. */
(()=>{
  'use strict';
  const mq=matchMedia('(max-width:820px)');
  const workspace=()=>document.querySelector('.photographerMain.photographerPrintWorkspace');
  let previous=null,wasComposing=false,entryDueUntil=0,entryTimer=0,raf=0;
  const composing=w=>!!w?.classList.contains('pb765Composing');

  function patchBack(w){
    const back=w.querySelector('#pb765-back');
    const lab=w.querySelector('.photographerPrintModeNav>.photographerPrintTopLab');
    if(!back||!lab)return;
    if(composing(w)&&back.parentElement!==lab)lab.append(back);
    if(back.dataset.pb768Label!=='1'){
      back.innerHTML='<span aria-hidden="true">←</span><span>بازگشت</span>';
      back.setAttribute('aria-label','بازگشت');back.title='بازگشت';
      back.dataset.pb768Label='1';
    }
  }

  function bindPlus(){
    const add=document.getElementById('pb765-add');
    if(!add||add.dataset.pb768Bound==='1')return;
    add.dataset.pb768Bound='1';
    add.addEventListener('click',()=>{
      if(mq.matches&&!add.disabled)entryDueUntil=Date.now()+1500;
    },true);
  }

  function animateEntry(w){
    if(w!==previous){previous=w;wasComposing=false}
    const now=composing(w);
    if(now&&!wasComposing&&mq.matches&&Date.now()<entryDueUntil){
      entryDueUntil=0;
      w.classList.remove('pb768ComposerEnter');
      requestAnimationFrame(()=>{
        w.classList.add('pb768ComposerEnter');
        clearTimeout(entryTimer);
        entryTimer=setTimeout(()=>w.classList.remove('pb768ComposerEnter'),260);
      });
    }
    wasComposing=now;
  }

  function run(){
    raf=0;const w=workspace();
    bindPlus();
    if(!w){previous=null;wasComposing=false;return}
    patchBack(w);animateEntry(w);
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(run)}
  const root=document.getElementById('root');
  if(root)new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','disabled']});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('pageshow',schedule,{passive:true});
  schedule();setTimeout(schedule,100);
})();
