(()=>{
  'use strict';
  if(!matchMedia('(min-width:821px)').matches)return;
  let avatar='',scheduled=false;
  const header=()=>document.getElementById('photographerRoleHeaderV710');
  const source=(root,selector)=>root?.querySelector(selector);
  function render(){
    scheduled=false;
    const h=header();if(!h)return;
    const identity=source(h,'.photographerHeaderIdentity');if(!identity)return;
    let photo=source(identity,'.pb1124Avatar');
    if(!photo){photo=document.createElement('span');photo.className='pb1124Avatar';photo.setAttribute('aria-label','عکس پروفایل عکاسی');identity.prepend(photo)}
    if(avatar){if(photo.dataset.avatar!==avatar){photo.replaceChildren();const img=document.createElement('img');img.src=avatar;img.alt='عکس پروفایل عکاسی';photo.append(img);photo.dataset.avatar=avatar}}
    else if(!photo.firstChild){photo.textContent=(source(identity,'h1')?.textContent?.trim()?.[0]||'ع');}
    let actions=source(h,'.pb1124PrimaryActions');
    if(!actions){actions=document.createElement('div');actions.className='pb1124PrimaryActions';actions.innerHTML='<button class="pb1124Wallet" type="button">کیف پول</button><button class="pb1124Exit" type="button">خروج</button>';h.append(actions);
      actions.querySelector('.pb1124Wallet').addEventListener('click',()=>source(h,'.headerWalletBadge,.mobileHeaderWallet')?.click());
      actions.querySelector('.pb1124Exit').addEventListener('click',()=>source(h,'.headerLogoutBtn,.mobileHeaderPower')?.click());
    }
    const wallet=source(h,'.headerWalletBadge,.mobileHeaderWallet');const button=source(actions,'.pb1124Wallet');
    if(wallet&&button){const value=(wallet.textContent?.trim()||'').replace(/^اعتبار\s*/,'').replace(/^کیف پول\s*/,'');const label=`کیف پول · ${value||'۰'}`;if(button.textContent!==label)button.textContent=label;}
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(render)}
  async function loadAvatar(){try{const response=await fetch('/api/auth/me',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}});if(!response.ok)return;const data=await response.json();avatar=String(data?.user?.photographerAvatarData||'');schedule()}catch{}}
  function start(){schedule();void loadAvatar();const root=document.getElementById('root')||document.body;new MutationObserver(schedule).observe(root,{childList:true,subtree:true});addEventListener('photobridge-auth-session-changed',()=>void loadAvatar());}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
