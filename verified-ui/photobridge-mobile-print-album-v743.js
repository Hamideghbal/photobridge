/* v743: keep album content under the measured header and leave album mode
   when the newly selected laboratory does not offer album binding. */
(()=>{
  'use strict';
  const mq=matchMedia('(max-width:820px)');
  let scheduled=false;
  function update(){
    scheduled=false;
    const workspace=document.querySelector('.photographerMain.photographerPrintWorkspace');
    if(!workspace)return;
    const tabs=workspace.querySelector('.photographerPrintModeNav');
    if(!tabs)return;
    const album=workspace.classList.contains('photographerAlbumWorkspaceMode');
    if(album&&!tabs.querySelector('.photographerPrintAlbumTab')){
      // Click the real React tab so both the route and internal state advance.
      tabs.querySelector('.photographerPrintPhotoTab')?.click();
      return;
    }
    if(!mq.matches||!album)return;
    const edges=[workspace.querySelector('.unifiedRoleHeader.photographerHeaderRefined'),tabs,workspace.querySelector('.photographerPrintTopLab')]
      .map(node=>node?.getBoundingClientRect().bottom||0).filter(edge=>edge>0&&edge<innerHeight*.85);
    const top=Math.ceil(Math.max(0,...edges)+8);
    const nav=workspace.querySelector('.photographerBottomAppNav');
    const navTop=nav?.getBoundingClientRect().top;
    const bottom=navTop>0&&navTop<innerHeight&&navTop-top>120?Math.ceil(innerHeight-navTop):0;
    workspace.style.setProperty('--pb743-album-top',`${top}px`);
    workspace.style.setProperty('--pb743-album-bottom',`${bottom}px`);
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update)}}
  function start(){
    const root=document.getElementById('root');if(!root)return;
    new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    mq.addEventListener?.('change',schedule);
    window.addEventListener('resize',schedule,{passive:true});
    window.visualViewport?.addEventListener('resize',schedule,{passive:true});
    document.addEventListener('click',()=>setTimeout(schedule,0),true);
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
