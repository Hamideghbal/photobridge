/* R1767: one shared admin-controlled Customers tab for both Photographer and Lab.
   Enabled/disabled together. Fail closed while loading; never create duplicate docks. */
(()=>{
  'use strict';
  if(window.pb1761CrmNavigation)return;
  window.pb1761CrmNavigation=true;
  const media=matchMedia('(max-width:820px)');
  const path=()=>location.pathname;
  const lab=()=>/^\/lab(?:\/|$)/.test(path())&&!/^\/lab\/(?:login|signup|register)(?:\/|$)/.test(path())&&!!document.querySelector('#root .labRoleWorkspace .labSingleHeader');
  const photo=()=>(/^\/photographer(?:\/|$)/.test(path())&&!/^\/photographer\/(?:login|signup|register|invite)(?:\/|$)/.test(path())&&
    (!!document.querySelector('#root main.photographerMain')||document.body.classList.contains('pbAuthenticatedPhotographerPortal'))
  )||(path()==='/equipment-rental/book'&&document.body.classList.contains('rentalPhotographerMode')&&!!document.querySelector('#photographerStoreBottomNav'));
  const activePortal=()=>lab()?'lab':photo()?'photographer':null;
  let enabled=null,fetchedPortal=null,loading=false,epoch=0,pending=false;

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

  function recount(grid){
    if(!grid||!grid.classList.contains('photographerBottomAppNavGrid'))return;
    const count=[...grid.children].filter(el=>!el.hidden&&el.dataset.pb1099Hidden!=='1'&&getComputedStyle(el).display!=='none').length;
    if(count)grid.style.setProperty('--pb1099-tabs',String(count));
  }
  function removeButton(button){
    const parent=button.parentElement;
    button.remove();
    recount(parent);
  }
  function clearButtons(){
    document.querySelectorAll('button[data-pb1761-crm]').forEach(removeButton);
  }
  async function loadVisibility(portal){
    if(!portal||loading)return;
    loading=true;
    const requestEpoch=epoch;
    try{
      let token='';try{token=sessionStorage.getItem('lablink_test_session')||''}catch{}
      const response=await fetch('/api/photographer/navigation-tabs',{
        credentials:'include',cache:'no-store',
        headers:{'x-photobridge-portal':portal,...(token?{authorization:'Bearer '+token}:{})}
      });
      if(!response.ok)throw Error('tab-settings-unavailable');
      const data=await response.json();
      if(requestEpoch!==epoch)return;
      enabled=data?.tabs?.customers===true;
      fetchedPortal=portal;
    }catch{
      if(requestEpoch!==epoch)return;
      // Never display a disabled or unverified tab during a network/auth error.
      enabled=false;
      fetchedPortal=portal;
    }finally{
      loading=false;
      schedule();
    }
  }
  function refresh(){
    epoch++;
    fetchedPortal=null;
    enabled=null;
    clearButtons();
    schedule();
  }
  function targetFor(portal){
    if(media.matches){
      if(portal==='lab')return [...document.querySelectorAll('#root .labRoleWorkspace .labBottomAppNavGrid')].at(-1)||null;
      return [...document.querySelectorAll('#root .photographerBottomAppNav:not(.labBottomAppNav) .photographerBottomAppNavGrid')]
        .filter(el=>!el.closest('[data-pb1318-stale]')).at(-1)||null;
    }
    if(portal==='lab')return document.querySelector('#root .labRoleWorkspace .pb1147LabNav');
    return document.querySelector('#root .photographerHomeModeNav')||document.querySelector('#root .photographerHeaderNav');
  }
  function render(){
    pending=false;
    const portal=activePortal();
    if(!portal){clearButtons();return;}
    if(fetchedPortal!==portal){clearButtons();void loadVisibility(portal);return;}
    if(enabled!==true){clearButtons();return;}
    const target=targetFor(portal),kind=media.matches?'pb1761CrmMobileTab':'pb1761CrmDesktopTab';
    // Remove stale or differently sized copies before inserting the current one.
    for(const button of document.querySelectorAll('button[data-pb1761-crm]')){
      if(button.parentElement!==target||button.dataset.pb1761Crm!==portal||!button.classList.contains(kind))removeButton(button);
    }
    if(!target||target.querySelector(':scope > button[data-pb1761-crm]'))return;
    const button=make(portal,!media.matches);
    if(portal==='lab'&&!media.matches){
      const album=target.querySelector('button[data-source=".albumTopNav"]');
      if(album)album.after(button);else target.insertBefore(button,target.firstElementChild);
    }else target.append(button);
    recount(target);
  }
  function schedule(){
    if(pending)return;
    pending=true;
    requestAnimationFrame(render);
  }
  function boot(){
    const root=document.getElementById('root')||document.body;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    schedule();
    window.addEventListener('popstate',refresh);
    window.addEventListener('pageshow',refresh);
    window.addEventListener('focus',refresh);
    window.addEventListener('photobridge-auth-session-changed',refresh);
    window.addEventListener('resize',schedule,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
    if(media.addEventListener)media.addEventListener('change',schedule);
    else if(media.addListener)media.addListener(schedule);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
