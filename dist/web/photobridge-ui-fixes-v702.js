/* PhotoBridge v702 — deterministic desktop store rail state + mobile invite dedupe safety. */
(()=>{
  'use strict';
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const isMobile=()=>{try{return matchMedia('(max-width: 820px)').matches}catch{return innerWidth<=820}};
  let raf=0;
  const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync()})};

  function mobileInviteSafety(){
    if(!isMobile())return;
    qsa('.photographerMobileHeaderQuickActions').forEach(row=>{
      const invites=qsa('.mobileHeaderInvite',row);
      if(!invites.length)return;
      const keep=invites[0];
      invites.slice(1).forEach(x=>x.remove());
      let label=qs('.pb700InviteLabel,.pb699InviteLabel,.pb698InviteLabel',keep);
      if(!label){label=document.createElement('span');label.className='pb698InviteLabel pb699InviteLabel pb700InviteLabel'}
      label.textContent='دعوت همکار';
      keep.replaceChildren(label);
      keep.title='دعوت همکار';
      keep.setAttribute('aria-label','دعوت همکار');
    });
  }

  function desktopStoreRail(){
    if(isMobile())return;
    const nav=qs('#storeSectionNavV673');
    if(!nav)return;
    nav.classList.add('pb702DesktopStoreRail');
    const buttons=qsa('[data-store-panel]',nav);
    if(!buttons.length)return;
    const panels=buttons.map(b=>qs('#'+b.dataset.storePanel)).filter(Boolean);
    const activate=id=>buttons.forEach(b=>b.classList.toggle('active',b.dataset.storePanel===id));
    buttons.forEach(b=>{
      if(b.dataset.pb702Bound==='1')return;
      b.dataset.pb702Bound='1';
      b.addEventListener('click',()=>activate(b.dataset.storePanel),{capture:true});
    });
    if(!buttons.some(b=>b.classList.contains('active')))activate('equipmentPanel');

    if(!nav._pb702Observer && 'IntersectionObserver' in window && panels.length){
      nav._pb702Observer=new IntersectionObserver(entries=>{
        if(isMobile())return;
        const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
        if(visible?.target?.id)activate(visible.target.id);
      },{root:null,rootMargin:'-150px 0px -55% 0px',threshold:[0,.05,.2,.5]});
      panels.forEach(p=>nav._pb702Observer.observe(p));
    }
  }

  function sync(){mobileInviteSafety();desktopStoreRail()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('popstate',schedule);
  setTimeout(sync,80);setTimeout(sync,350);setTimeout(sync,1000);
  console.info('[PhotoBridge] v702 hard-linked mobile invite / desktop store rail active');
})();
