/* PhotoBridge v699 — canonical invite content + desktop Instagram navigation fallback. */
(()=>{
  'use strict';
  if(window.__PB704_ACTIVE__)return;
  const MOBILE='(max-width: 820px)';
  const isMobile=()=>{try{return matchMedia(MOBILE).matches}catch{return innerWidth<=820}};
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  let raf=0;
  const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync()})};

  function canonicalInvite(row){
    if(!row)return;
    let invites=qsa('.mobileHeaderInvite',row);
    let invite=invites.shift()||null;
    invites.forEach(x=>x.remove());
    if(!invite){
      invite=document.createElement('button');
      invite.type='button';
      invite.className='mobileHeaderInvite';
      invite.title='دعوت همکار';
      invite.setAttribute('aria-label','دعوت همکار');
      invite.addEventListener('click',e=>{e.preventDefault();location.href='/photographer/settings/invites'});
    }
    invite.id='pb699HeaderInviteButton';
    /* Keep pb698InviteLabel too so the older synchronizer recognizes this as its canonical label
       and does not rewrite the button on its next observer pass. */
    let label=qs('.pb699InviteLabel',invite);
    if(!label || invite.childNodes.length!==1){
      label=document.createElement('span');
      label.className='pb698InviteLabel pb699InviteLabel';
      label.textContent='دعوت همکار';
      invite.replaceChildren(label);
    }else{
      label.classList.add('pb698InviteLabel');
      if(label.textContent!=='دعوت همکار')label.textContent='دعوت همکار';
      [...invite.childNodes].forEach(n=>{if(n!==label)n.remove()});
    }
    const bell=qs('.mobileNotificationBell',row);
    const power=qs('.mobileHeaderPower',row);
    const settings=qs('.mobileHeaderSettings',row);
    const wallet=qs('.mobileHeaderWallet',row);
    const desired=[bell,power,settings,invite,wallet].filter(Boolean);
    const current=Array.from(row.children).filter(el=>desired.includes(el));
    if(current.length!==desired.length||desired.some((el,i)=>current[i]!==el))desired.forEach(el=>row.append(el));
  }

  function syncMobileHeader(){
    if(!isMobile())return;
    qsa('.photographerMobileAiInviteRow').forEach(x=>x.remove());
    qsa('.photographerMobileHeaderQuickActions').forEach(canonicalInvite);
  }

  function makeDesktopInstagram(nav){
    if(!nav||isMobile())return;
    const exact=qs('button[data-main-href="/photographer/album-design?pb_mode=instagram"]',nav);
    if(exact)return;
    let b=qs('.pb699DesktopInstagramNav',nav);
    if(!b){
      b=document.createElement('button');
      b.type='button';
      b.className='rolePrimaryAction photographerInstagramDesignEntry pb699DesktopInstagramNav';
      b.textContent='طراحی اینستاگرام';
      b.addEventListener('click',()=>location.assign('/photographer/album-design?pb_mode=instagram'));
      const store=qs('.photographerStoreEntry,.storeDesktopPrimary',nav);
      if(store)nav.insertBefore(b,store);else nav.append(b);
    }
    const active=location.pathname.startsWith('/photographer/album-design')&&new URLSearchParams(location.search).get('pb_mode')==='instagram';
    b.classList.toggle('active',active);
  }

  function syncDesktopNav(){
    if(isMobile())return;
    qsa('.photographerHomeModeNav').forEach(makeDesktopInstagram);
  }

  function sync(){syncMobileHeader();syncDesktopNav()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('popstate',schedule);
  setTimeout(sync,80);setTimeout(sync,350);setTimeout(sync,1000);
})();
