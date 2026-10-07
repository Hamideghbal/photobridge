(()=>{
  'use strict';
  if(window.__PB904R54_STABILITY__)return;window.__PB904R54_STABILITY__=true;
  const PRINT='.photographerMain.photographerPrintWorkspace';
  const SKIP=new Set(['SCRIPT','STYLE','PRE','CODE','TEXTAREA','NOSCRIPT']);
  let queued=false,observer=null,observed=null;
  function looksLikeSource(raw){
    const s=String(raw||'');if(s.length<160)return false;
    let score=0;
    if(/!important/.test(s))score++;
    if(/@media\s*\(/.test(s))score++;
    if(/(?:html\s+body\s+#root|\.customerOrder|\.mobileOrderDisclosure|\.photographerMain)/.test(s))score++;
    if(/(?:querySelector|MutationObserver|document\.|window\.|=>|function\s*\()/.test(s))score++;
    if(/[{}][^{}]{0,80}[{}]/.test(s))score++;
    return score>=2;
  }
  function scrub(root){
    if(!root)return;
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const bad=[];let n;
    while((n=w.nextNode())){
      const p=n.parentElement;if(!p||SKIP.has(p.tagName))continue;
      if(looksLikeSource(n.nodeValue))bad.push(n);
    }
    bad.forEach(n=>{n.nodeValue=''});
    root.querySelectorAll('[data-debug-source],.debugSource,.sourceDump,.cssDump,.codeDump').forEach(el=>el.remove());
  }
  function sync(){
    queued=false;
    const root=document.querySelector(PRINT);
    if(root!==observed){
      observer?.disconnect();observed=root;
      if(root){observer=new MutationObserver(schedule);observer.observe(root,{childList:true,subtree:true,characterData:true})}
    }
    scrub(root);
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}
  const outer=new MutationObserver(schedule);outer.observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('popstate',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()},{passive:true});
  schedule();
})();
