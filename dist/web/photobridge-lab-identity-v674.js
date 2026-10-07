/* PhotoBridge v0.17.674 — mobile lab identity + detached print tabs; lightweight, no document observer */
(()=>{
  const BAR_ID='pb674PhotographerLabIdentityBar';
  const OLD_BAR_ID='pb673PhotographerLabIdentityBar';
  const mq=window.matchMedia('(max-width:820px)');
  let timer=0,headerObserver=null,observedHeader=null;
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
  function observeHeader(header){
    if(observedHeader===header)return;
    headerObserver?.disconnect();headerObserver=null;observedHeader=header||null;
    if(header&&window.ResizeObserver){headerObserver=new ResizeObserver(()=>schedule(20));headerObserver.observe(header)}
  }
  function cleanup(r){
    document.getElementById(BAR_ID)?.remove();
    document.getElementById(OLD_BAR_ID)?.remove();
    observeHeader(null);
    if(r){
      r.classList.remove('pb673HasLabIdentityBar','pb674HasLabIdentityBar');
      r.style.removeProperty('--pb674-lab-header-bottom');
    }
  }
  function sync(){
    timer=0;
    const r=root();
    const printHeader=r?.querySelector('.photographerPrintModeHeader');
    const active=!!r&&!!printHeader&&mq.matches&&r.classList.contains('photographerLabWorkspaceMode');
    if(!active){cleanup(r);return}
    observeHeader(printHeader);
    r.classList.remove('pb673HasLabIdentityBar');
    r.classList.add('pb674HasLabIdentityBar');
    let bar=document.getElementById(BAR_ID);
    if(!bar){
      document.getElementById(OLD_BAR_ID)?.remove();
      bar=document.createElement('div');
      bar.id=BAR_ID;
      bar.setAttribute('aria-live','polite');
      bar.innerHTML='<span>لابراتوار</span><b></b>';
      document.body.appendChild(bar);
    }
    const name=labName(r)||'لابراتوار فعال';
    const b=bar.querySelector('b');
    if(b&&b.textContent!==name)b.textContent=name;
    const bottom=Math.max(0,Math.ceil(printHeader.getBoundingClientRect().bottom||Number.parseFloat(getComputedStyle(r).getPropertyValue('--pb-role-header-h'))||64));
    const px=bottom+'px';
    if(bar.style.top!==px)bar.style.top=px;
    if(r.style.getPropertyValue('--pb674-lab-header-bottom')!==px)r.style.setProperty('--pb674-lab-header-bottom',px);
  }
  function schedule(delay=40){clearTimeout(timer);timer=window.setTimeout(sync,delay)}
  function burst(){schedule(20);window.setTimeout(sync,130);window.setTimeout(sync,340)}
  const wrapHistory=name=>{const orig=history[name];if(typeof orig!=='function')return;history[name]=function(...args){const out=orig.apply(this,args);burst();return out}};
  wrapHistory('pushState');wrapHistory('replaceState');
  window.addEventListener('popstate',burst,{passive:true});
  window.addEventListener('resize',()=>schedule(60),{passive:true});
  window.addEventListener('focus',burst,{passive:true});
  document.addEventListener('click',e=>{if(e.target?.closest?.('.photographerPrintModeNav,.photographerPrintModeHeader,.photographerLabContextRail,.photographerBottomAppNav,.photographerMobileLabChooser,.photographerSelectedLabControl'))burst()},{capture:true,passive:true});
  mq.addEventListener?.('change',burst);
  window.setInterval(()=>{if(!document.hidden)sync()},2200);
  burst();
})();
