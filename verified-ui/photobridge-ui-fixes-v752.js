/* PhotoBridge v752 — restored mobile order-status controls without moving React-owned nodes. */
(()=>{
  'use strict';
  const mq=matchMedia('(max-width:820px)');
  let raf=0;

  const text=node=>(node?.textContent||'').replace(/\s+/g,' ').trim();

  function sourceButtons(workspace, album){
    const selectors=album
      ? [
          '.photographerAlbumHeaderStatusMobile .albumHeaderStatuses>button',
          '.photographerAlbumHeaderStatusDesktop .albumHeaderStatuses>button'
        ]
      : [
          '.photographerContextStatusesMobile>button',
          '.photographerContextStatusesDesktop>button'
        ];
    for(const selector of selectors){
      const buttons=[...workspace.querySelectorAll(selector)];
      if(buttons.length)return buttons;
    }
    return [];
  }

  function syncBar(workspace, orders){
    const launch=orders.querySelector(':scope>.photographerMobileOrderLaunch');
    if(!launch)return;

    const album=launch.classList.contains('album') ||
      !!orders.closest('.photographerAlbumListFlush') ||
      workspace.classList.contains('photographerAlbumWorkspaceMode');

    const source=sourceButtons(workspace, album);
    let bar=orders.querySelector(':scope>.pb752OrderStatuses');

    if(!mq.matches || !source.length){
      bar?.remove();
      return;
    }

    if(!bar){
      bar=document.createElement('div');
      bar.className='pb752OrderStatuses';
      bar.setAttribute('aria-label','وضعیت سفارش‌ها');
      launch.insertAdjacentElement('afterend',bar);
    }

    while(bar.children.length<source.length){
      const button=document.createElement('button');
      button.type='button';
      button.addEventListener('click',()=>{
        const index=[...bar.children].indexOf(button);
        const current=sourceButtons(workspace, album)[index];
        if(current && !current.disabled) current.click();
      });
      bar.append(button);
    }
    while(bar.children.length>source.length)bar.lastElementChild.remove();

    [...bar.children].forEach((button,index)=>{
      const original=source[index];
      button.innerHTML=original.innerHTML;
      button.classList.toggle('active',original.classList.contains('active'));
      button.disabled=!!original.disabled;
      button.setAttribute('aria-pressed',original.classList.contains('active')?'true':'false');
      const label=text(original);
      if(label)button.setAttribute('aria-label',label);
    });
  }

  function alignAlbumList(workspace){
    if(!mq.matches)return;
    const albumList=workspace.querySelector(
      '.photographerRolePageScrollArea>.photographerAlbumListFlush'
    );
    if(!albumList)return;
    albumList.style.setProperty('padding-left','0','important');
    albumList.style.setProperty('padding-right','0','important');
  }

  function run(){
    raf=0;
    const workspace=document.querySelector('.photographerMain.photographerPrintWorkspace');
    if(!workspace)return;
    alignAlbumList(workspace);
    workspace.querySelectorAll('.ordersWorkspace.liveCustomerOrders').forEach(
      orders=>syncBar(workspace,orders)
    );
  }

  function schedule(){
    if(!raf)raf=requestAnimationFrame(run);
  }

  function start(){
    const root=document.getElementById('root');
    if(root){
      new MutationObserver(schedule).observe(root,{
        subtree:true,
        childList:true,
        attributes:true,
        characterData:true,
        attributeFilter:['class','disabled']
      });
    }
    document.addEventListener('click',()=>setTimeout(schedule,0),true);
    window.addEventListener('resize',schedule,{passive:true});
    window.visualViewport?.addEventListener('resize',schedule,{passive:true});
    mq.addEventListener?.('change',schedule);
    schedule();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
