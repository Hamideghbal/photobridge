/* v770: update the label in the deployed album composer, including after React rerenders. */
(()=>{
  'use strict';
  document.documentElement.dataset.photobridgeUi='770';
  let pending=false;
  function patch(){
    pending=false;
    for(const button of document.querySelectorAll('.albumFilesCompact .albumFileActionFile')){
      if(button.textContent?.includes('افزودن فایل')){
        button.textContent='＋ افزودن برگ آلبوم';
        button.title='افزودن برگ آلبوم';
        button.setAttribute('aria-label','افزودن برگ آلبوم');
      }
    }
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(patch)}}
  const root=document.getElementById('root');
  if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  schedule();
})();
