/* R1761 — one CRM entry in the existing mobile dock, and lab desktop header.
   Each lab/photographer stays within its own authenticated portal. */
(()=>{
  'use strict';
  if(window.pb1761CrmNavigation)return;
  window.pb1761CrmNavigation=true;
  const media=matchMedia('(max-width:820px)');
  const path=()=>location.pathname;
  const lab=()=>/^\/lab(?:\/|$)/.test(path())&&!/^\/lab\/(?:login|signup|register)(?:\/|$)/.test(path())&&!!document.querySelector('#root .labRoleWorkspace .labSingleHeader');
  const photo=()=>(
    /^\/photographer(?:\/|$)/.test(path())&&!/^\/photographer\/(?:login|signup|register|invite)(?:\/|$)/.test(path())&&
    (!!document.querySelector('#root main.photographerMain')||document.body.classList.contains('pbAuthenticatedPhotographerPortal'))
  )||(path()==='/equipment-rental/book'&&document.body.classList.contains('rentalPhotographerMode')&&!!document.querySelector('#photographerStoreBottomNav'));
  function make(portal,desktop){
    const b=document.createElement('button');
    b.type='button';
    b.className=desktop?'pb1761CrmDesktopTab':'pb1761CrmMobileTab';
    b.dataset.pb1761Crm=portal;
    b.setAttribute('aria-label','مشتریان');
    if(desktop){
      // Match the existing lab header tab styling, without claiming a native tab source.
      b.dataset.source='.pb1761CrmNotANativeTab';
      const label=document.createElement('span');
      label.className='pb1149NavLabel';
      label.textContent='مشتریان';
      b.append(label);
    }else{
      b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3.5 19v-1.2A5.8 5.8 0 0 1 9.3 12h.4a5.8 5.8 0 0 1 5.8 5.8V19"/><path d="M16.8 5.5a3 3 0 0 1 0 5.7M18 13a5.3 5.3 0 0 1 2.5 4.5V19"/></svg><em>مشتریان</em>';
    }
    b.addEventListener('click',()=>location.assign('/customer-crm.html?portal='+portal));
    return b;
  }
  function ensureMobile(grid,portal){
    if(!grid||grid.querySelector(':scope > button[data-pb1761-crm]'))return;
    grid.append(make(portal,false));
    // The photographer dock owns its own tab-count CSS variable; preserve one row.
    if(portal==='photographer'){
      const count=[...grid.children].filter(el=>!el.hidden&&el.dataset.pb1099Hidden!=='1'&&getComputedStyle(el).display!=='none').length;
      if(count)grid.style.setProperty('--pb1099-tabs',String(count));
    }
  }
  function render(){
    pending=false;
    if(media.matches){
      if(lab()){
        const grids=[...document.querySelectorAll('#root .labRoleWorkspace .labBottomAppNavGrid')];
        ensureMobile(grids.at(-1),'lab');
      }else if(photo()){
        const grids=[...document.querySelectorAll('#root .photographerBottomAppNav:not(.labBottomAppNav) .photographerBottomAppNavGrid')]
          .filter(el=>!el.closest('[data-pb1318-stale]'));
        ensureMobile(grids.at(-1),'photographer');
      }
      return;
    }
    if(lab()){
      const nav=document.querySelector('#root .labRoleWorkspace .pb1147LabNav');
      if(nav&&!nav.querySelector(':scope > button[data-pb1761-crm]')){
        const button=make('lab',true);
        const album=nav.querySelector('button[data-source=".albumTopNav"]');
        if(album)album.after(button);else nav.insertBefore(button,nav.firstElementChild);
      }
    }
  }
  let pending=false;
  function schedule(){if(!pending){pending=true;requestAnimationFrame(render);}}
  function boot(){
    schedule();
    const root=document.getElementById('root')||document.body;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    window.addEventListener('popstate',schedule);
    window.addEventListener('pageshow',schedule);
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('photobridge-auth-session-changed',schedule);
    media.addEventListener('change',schedule);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();