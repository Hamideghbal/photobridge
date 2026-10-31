/* PhotoBridge v0.17.676 — mobile lab identity: no viewport geometry loop, no document observer */
(()=>{
  const BAR_ID='pb676PhotographerLabIdentityBar';
  const mq=window.matchMedia('(max-width:820px)');
  let timer=0;
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  function root(){return document.querySelector('.photographerMain.appWorkspacePage.pbFixedRoleHeader')}
  function labName(r){
    const selectors=['.photographerPrintTopLabStatic','.photographerMobileSingleLab span','.photographerSelectedLabNameButton b','.photographerLockedLabIdentity b','.photographerMobileLabChooser .pbSelectButton','.photographerMobileLabChooser button','.photographerPrintTopLabSelect .pbSelectButton','.photographerPrintTopLabSelect button'];
    for(const sel of selectors){
      const el=r?.querySelector(sel),t=clean(el?.textContent);
      if(t&&t!=='لابراتوار'&&t!=='انتخاب لابراتوار')return t.replace(/[⌄▾▼]+$/,'').trim();
    }
    return '';
  }
  function cleanup(r){
    document.getElementById(BAR_ID)?.remove();
    document.getElementById('pb674PhotographerLabIdentityBar')?.remove();
    document.getElementById('pb673PhotographerLabIdentityBar')?.remove();
    if(r){
      r.classList.remove('pb673HasLabIdentityBar','pb674HasLabIdentityBar','pb676HasLabIdentityBar');
    }
  }
  function sync(){
    timer=0;
    const r=root();
    const printHeader=r?.querySelector('.photographerPrintModeHeader');
    const active=!!r&&!!printHeader&&mq.matches&&r.classList.contains('photographerLabWorkspaceMode');
    if(!active){cleanup(r);return}
    r.classList.remove('pb673HasLabIdentityBar','pb674HasLabIdentityBar');
    r.classList.add('pb676HasLabIdentityBar');
    let bar=document.getElementById(BAR_ID);
    if(!bar){
      document.getElementById('pb674PhotographerLabIdentityBar')?.remove();
      document.getElementById('pb673PhotographerLabIdentityBar')?.remove();
      bar=document.createElement('div');
      bar.id=BAR_ID;
      bar.setAttribute('aria-live','polite');
      bar.innerHTML='<span>لابراتوار</span><b></b>';
      r.appendChild(bar);
    }else if(bar.parentElement!==r){
      r.appendChild(bar);
    }
    const name=labName(r)||'لابراتوار فعال';
    const b=bar.querySelector('b');
    if(b&&b.textContent!==name)b.textContent=name;
  }
  function schedule(delay=35){clearTimeout(timer);timer=window.setTimeout(sync,delay)}
  function burst(){schedule(15);window.setTimeout(sync,120);window.setTimeout(sync,320)}
  const wrapHistory=name=>{const orig=history[name];if(typeof orig!=='function')return;history[name]=function(...args){const out=orig.apply(this,args);burst();return out}};
  wrapHistory('pushState');wrapHistory('replaceState');
  window.addEventListener('popstate',burst,{passive:true});
  window.addEventListener('resize',()=>schedule(55),{passive:true});
  window.addEventListener('focus',burst,{passive:true});
  document.addEventListener('click',e=>{if(e.target?.closest?.('.photographerPrintModeNav,.photographerPrintModeHeader,.photographerLabContextRail,.photographerBottomAppNav,.photographerMobileLabChooser,.photographerSelectedLabControl'))burst()},{capture:true,passive:true});
  mq.addEventListener?.('change',burst);
  window.setInterval(()=>{if(!document.hidden)sync()},2400);
  burst();
})();
