/* R1292: one clearly labeled Windows installer shortcut for laboratory managers. */
(()=>{'use strict';
  if(window.pb1292LabWindowsShortcut)return;
  window.pb1292LabWindowsShortcut=true;
  const id='pb1292LabWindowsShortcut';
  function shouldShow(){
    return /^\/lab(?:\/?$|\/orders(?:\/|$)|\/settings(?:\/|$))/.test(location.pathname);
  }
  function mount(){
    const root=document.querySelector('.labRoleWorkspace');
    let banner=document.getElementById(id);
    if(!shouldShow()||!root){
      banner?.remove();
      return;
    }
    const parent=root.querySelector('.labRolePageScrollArea')
      ||root.querySelector('main')
      ||root.querySelector('.labMain');
    if(!parent)return;
    if(!banner){
      banner=document.createElement('aside');
      banner.id=id;
      banner.className='pb1292LabWindowsShortcut';
      banner.setAttribute('aria-label','دانلود برنامه ویندوز لابراتوار');
      const body=document.createElement('div');
      body.className='pb1292LabWindowsText';
      const label=document.createElement('strong');
      label.textContent='برنامه ویندوز لابراتوار';
      const subtitle=document.createElement('span');
      subtitle.textContent='دانلود نسخه فعال برای کامپیوتر لابراتوار';
      body.append(label,subtitle);
      const link=document.createElement('a');
      link.href='/lab-windows-download.html';
      link.className='pb1292LabWindowsLink';
      link.textContent='دانلود برنامه ویندوز';
      banner.append(body,link);
    }
    if(banner.parentElement!==parent)parent.prepend(banner);
  }
  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;mount();});
  }
  function start(){
    schedule();
    new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true});
    addEventListener('popstate',schedule);
    addEventListener('photobridge-auth-session-changed',schedule);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();