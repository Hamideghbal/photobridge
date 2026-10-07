/* PhotoBridge v700 — desktop photographer header parity + strict mobile invite geometry + stale print-guide cleanup. */
(()=>{
  'use strict';
  const MOBILE='(max-width: 820px)';
  const isMobile=()=>{try{return matchMedia(MOBILE).matches}catch{return innerWidth<=820}};
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  let raf=0;
  const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync()})};

  function ensureSingleInvite(row){
    if(!row)return null;
    const invites=qsa('.mobileHeaderInvite',row);
    let invite=invites.shift()||null;
    invites.forEach(x=>x.remove());
    if(!invite){
      invite=document.createElement('button');
      invite.type='button';
      invite.className='mobileHeaderInvite';
      invite.title='دعوت همکار';
      invite.setAttribute('aria-label','دعوت همکار');
      invite.addEventListener('click',e=>{e.preventDefault();location.href='/photographer/settings/invites'});
      row.appendChild(invite);
    }
    invite.id='pb700HeaderInviteButton';
    invite.title='دعوت همکار';
    invite.setAttribute('aria-label','دعوت همکار');
    let label=qs(':scope > .pb700InviteLabel',invite);
    if(!label){
      label=document.createElement('span');
      label.className='pb698InviteLabel pb699InviteLabel pb700InviteLabel';
    }
    label.textContent='دعوت همکار';
    invite.replaceChildren(label);
    return invite;
  }

  function normalizeMobileQuickActions(row){
    if(!row)return;
    const invite=ensureSingleInvite(row);
    const bell=qs('.mobileNotificationBell',row);
    const power=qs('.mobileHeaderPower',row);
    const settings=qs('.mobileHeaderSettings',row);
    const wallet=qs('.mobileHeaderWallet',row);
    const desired=[bell,power,settings,invite,wallet].filter(Boolean);
    desired.forEach(el=>row.appendChild(el));
    row.classList.add('pb700MobileQuickActions');
    // Inline !important values make the final geometry independent of older mobile shell patches.
    if(invite){
      for(const [k,v] of Object.entries({display:'inline-flex',width:'var(--pb700-pill)',minWidth:'var(--pb700-pill)',maxWidth:'var(--pb700-pill)',height:'32px',minHeight:'32px',maxHeight:'32px',flex:'0 0 var(--pb700-pill)',aspectRatio:'auto',padding:'0 6px',whiteSpace:'nowrap',overflow:'hidden',alignItems:'center',justifyContent:'center'})) invite.style.setProperty(k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),v,'important');
      const label=qs('.pb700InviteLabel',invite);
      if(label){
        label.style.setProperty('font-size','9px','important');
        label.style.setProperty('font-weight','900','important');
        label.style.setProperty('line-height','1','important');
        label.style.setProperty('white-space','nowrap','important');
        label.style.setProperty('letter-spacing','-.08px','important');
      }
    }
    if(wallet){
      for(const [k,v] of Object.entries({display:'inline-flex',width:'var(--pb700-pill)',minWidth:'var(--pb700-pill)',maxWidth:'var(--pb700-pill)',height:'32px',minHeight:'32px',maxHeight:'32px',flex:'0 0 var(--pb700-pill)',padding:'0 6px',whiteSpace:'nowrap',overflow:'hidden',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:'900'})) wallet.style.setProperty(k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),v,'important');
      const b=qs('b',wallet);if(b){b.style.setProperty('font-size','8.8px','important');b.style.setProperty('font-weight','950','important')}
    }
  }

  function syncMobile(){
    if(!isMobile())return;
    qsa('.photographerMobileAiInviteRow').forEach(x=>x.remove());
    qsa('.photographerMobileHeaderQuickActions').forEach(normalizeMobileQuickActions);
  }

  function dedupeDesktopInstagram(nav){
    if(!nav)return;
    const buttons=qsa('.photographerInstagramDesignEntry',nav);
    if(buttons.length<=1)return;
    const keep=buttons.find(x=>!x.classList.contains('pb699DesktopInstagramNav'))||buttons[0];
    buttons.forEach(x=>{if(x!==keep)x.remove()});
  }

  function decorateDesktopHeader(header){
    if(!header||header.classList.contains('photographerPrintModeHeader'))return;
    const identity=qs(':scope > .photographerHeaderIdentity',header)||qs(':scope > .workspaceIdentity',header);
    const nav=qs(':scope > .photographerHomeModeNav',header)||qs(':scope > .photographerHeaderNav',header);
    const tools=qs(':scope > .photographerHeaderTools',header)||qs(':scope > .roleHeaderCenter',header);
    if(!identity||!nav||!tools)return;
    dedupeDesktopInstagram(nav);
    header.classList.add('pb700DesktopPhotographerHeader');
    nav.classList.add('pb700DesktopPrimaryNav');
    tools.classList.add('pb700DesktopTools');
    let sep=qs(':scope > .pb700DesktopHeaderSeparator',header);
    if(!sep){sep=document.createElement('span');sep.className='pb700DesktopHeaderSeparator';sep.setAttribute('aria-hidden','true')}
    if(sep.parentElement!==header)header.appendChild(sep);
  }

  function syncDesktop(){
    if(isMobile())return;
    qsa('.photographerMain>.photographerHeaderRefined:not(.photographerPrintModeHeader)').forEach(decorateDesktopHeader);
    const store=qs('#photographerStoreRoleHeader');if(store)decorateDesktopHeader(store);
  }

  function cleanupStaleGuideButtons(){
    const printNav=qs('.photographerPrintWorkspace .photographerPrintModeNav');
    qsa('.pb569WorkflowGuideButton').forEach(btn=>{if(!printNav||!printNav.contains(btn))btn.remove()});
    if(!printNav){
      qsa('.photographerHeaderNav.pb699DesktopGuideNav,.photographerHeaderNav.pb569WorkflowGuideNavReady,.photographerHeaderNav.pb692InlineGuideReady').forEach(nav=>nav.classList.remove('pb699DesktopGuideNav','pb569WorkflowGuideNavReady','pb692InlineGuideReady'));
    }
  }

  function sync(){syncMobile();syncDesktop();cleanupStaleGuideButtons()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('popstate',()=>{schedule();setTimeout(schedule,60);setTimeout(schedule,220)});
  setTimeout(sync,80);setTimeout(sync,350);setTimeout(sync,1000);
  console.info('[PhotoBridge] v700 desktop/mobile header cleanup active');
})();
