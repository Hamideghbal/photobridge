/* R1162: hide stale, text-only gallery deletion controls without touching React-owned nodes. */
(()=>{
  'use strict';
  const galleryCardSelector='.clientGalleryCard';
  const extraDeleteLabel=/^\s*حذف\s+گالری\s*$/u;
  function reconcileGalleryCard(card){
    // R1161 defines the only valid deletion control: the compact SVG trash button.
    const trash=card.querySelector('.pb1160GalleryDelete:has(svg)');
    if(!trash)return;
    for(const button of card.querySelectorAll('button')){
      if(button===trash || !extraDeleteLabel.test(String(button.textContent||'').trim()))continue;
      button.hidden=true;
      button.tabIndex=-1;
      button.setAttribute('aria-hidden','true');
      button.style.setProperty('display','none','important');
    }
  }
  function reconcile(){
    document.querySelectorAll(galleryCardSelector).forEach(reconcileGalleryCard);
  }
  function relevant(record){
    if(record.type!=='childList'||!record.addedNodes.length)return false;
    if(record.target.nodeType===1&&record.target.closest?.(galleryCardSelector))return true;
    return Array.from(record.addedNodes).some(node=>
      node.nodeType===1 && (node.matches?.(galleryCardSelector) || !!node.querySelector?.(galleryCardSelector))
    );
  }
  function start(){
    const root=document.getElementById('root');
    if(!root)return;
    reconcile();
    new MutationObserver(records=>{
      if(records.some(relevant))reconcile();
    }).observe(root,{subtree:true,childList:true});
    window.addEventListener('pageshow',reconcile);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
