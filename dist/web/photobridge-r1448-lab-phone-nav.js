/* PB1448 — Lab MANAGER phone navigation only. No Electron/Windows/Desktop DOM changes. */
(function(){
  'use strict';
  const ua=String(navigator.userAgent||'');
  // Never run in Windows desktop/Electron, even when its window is narrow or touch-enabled.
  if(/Windows|Electron/i.test(ua)||!/Android|iPhone|iPod|iPad/i.test(ua))return;
  if(typeof window.matchMedia!=='function')return;
  const phone=window.matchMedia('(max-width: 820px) and (pointer: coarse)');
  let dock=null,scheduled=false;
  const modes=[
    {key:'print',label:'چاپ',icon:'print',selector:'.labRoleWorkspace .labSingleHeader .labPrintTopNav'},
    {key:'finance',label:'امور مالی',icon:'labFinance',selector:'.labRoleWorkspace .labSingleHeader .labFinanceHeaderBtn'},
    {key:'archive',label:'آرشیو',icon:'labArchive',selector:'.labRoleWorkspace .labSingleHeader .labArchiveHeaderBtn'}
  ];
  function currentMode(){
    const path=String(window.location.pathname||'');
    if(/^\/lab\/finance(?:\/|$)/.test(path))return 'finance';
    if(/^\/lab\/archive(?:\/|$)/.test(path))return 'archive';
    if(/^\/lab\/(?:orders|album)(?:\/|$)/.test(path)||path==='/lab')return 'print';
    return '';
  }
  function buildDock(){
    const nav=document.createElement('nav');
    nav.className='mobileRoleUtilityRail labMobileUtilityRail mobileRoleUtilityRailGrouped photographerBottomAppNav labBottomAppNav pb1448LabPhoneDock';
    nav.setAttribute('aria-label','ناوبری پایین لابراتوار');
    nav.innerHTML='<div class="mobileRailPrimaryGroup photographerBottomAppNavGrid labBottomAppNavGrid pb1448LabPhoneDockGrid">'+
      modes.map(mode=>'<button type="button" data-pb1448-mode="'+mode.key+'" aria-label="'+(mode.key==='print'?'چاپ و سفارش‌های آلبوم':mode.label)+'">'+
      '<span class="photographerBottomNavIcon '+mode.icon+'" aria-hidden="true"></span><em>'+mode.label+'</em></button>').join('')+
      '</div>';
    nav.addEventListener('click',function(event){
      const button=event.target.closest('button[data-pb1448-mode]');
      if(!button||!nav.contains(button))return;
      const mode=modes.find(item=>item.key===button.getAttribute('data-pb1448-mode'));
      if(!mode)return;
      // Forward to the ORIGINAL React handler so routes, state, history,
      // queue alerts, permissions and finance sub-tabs keep working.
      const original=document.querySelector(mode.selector);
      if(original)original.click();
      schedule();
    });
    document.body.appendChild(nav);
    return nav;
  }
  function sync(){
    const root=document.querySelector('.labRoleWorkspace main.appWorkspacePage .labSingleHeader');
    const enabled=!!(phone.matches&&root);
    document.documentElement.classList.toggle('pb1448LabPhoneMode',enabled);
    if(!enabled){
      if(dock){dock.remove();dock=null;}
      return;
    }
    if(!dock)dock=buildDock();
    const selected=currentMode();
    dock.querySelectorAll('button[data-pb1448-mode]').forEach(button=>{
      const active=selected===button.getAttribute('data-pb1448-mode');
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active?'true':'false');
      if(active)button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    window.requestAnimationFrame(function(){scheduled=false;sync();});
  }
  function init(){
    const observer=new MutationObserver(schedule);
    observer.observe(document.body,{subtree:true,childList:true});
    window.addEventListener('popstate',schedule);
    window.addEventListener('hashchange',schedule);
    window.addEventListener('pageshow',schedule);
    if(typeof phone.addEventListener==='function')phone.addEventListener('change',schedule);
    else if(typeof phone.addListener==='function')phone.addListener(schedule);
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();