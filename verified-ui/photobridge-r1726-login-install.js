/* R1726 — nonintrusive browser-only PhotoBridge login install invitation. */
(()=>{
  'use strict';
  const id='pbR1726InstallBanner';
  const mobile=()=>window.matchMedia('(max-width:767px)').matches;
  const standalone=()=>{
    try{return window.matchMedia('(display-mode:standalone)').matches||
      window.matchMedia('(display-mode:fullscreen)').matches||
      navigator.standalone===true}catch{return navigator.standalone===true}
  };
  const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent||'')||
    (/macintosh/i.test(navigator.userAgent||'')&&navigator.maxTouchPoints>1);
  const route=()=>/^\/(?:photographer(?:\/login)?|lab(?:\/login)?|rental(?:\/login)?|login)\/?$/.test(location.pathname);
  const onLogin=()=>Boolean(document.querySelector('#root .unifiedLoginPage form.unifiedLoginCard,body.pbR100F28PortalLogin form.unifiedLoginCard:not(.hidden),#loginView.rentalLoginOverlay:not(.hidden) form'));
  let promptEvent=null,frame=0,dismissed=false;
  try{dismissed=sessionStorage.getItem('pbR1726InstallDismissed')==='1'}catch{}
  function sync(){
    frame=0;
    const enabled=mobile()&&!standalone()&&!dismissed&&route()&&onLogin();
    let el=document.getElementById(id);
    if(!enabled){if(el)el.hidden=true;return}
    if(!el){
      el=document.createElement('aside');el.id=id;
      el.setAttribute('aria-label','نصب برنامه فوتوبریج');
      el.innerHTML='<div class="pbR1726InstallCopy"><strong>نصب PhotoBridge روی گوشی</strong><span>ورود سریع‌تر، مستقیم از صفحه اصلی گوشی</span></div><button type="button" class="pbR1726InstallAction">نصب برنامه</button><button type="button" class="pbR1726InstallClose" aria-label="بستن پیشنهاد نصب">×</button>';
      el.querySelector('.pbR1726InstallClose').addEventListener('click',()=>{
        dismissed=true;try{sessionStorage.setItem('pbR1726InstallDismissed','1')}catch{}
        el.hidden=true;
      });
      el.querySelector('.pbR1726InstallAction').addEventListener('click',async()=>{
        if(standalone()){el.hidden=true;return}
        const native=promptEvent;
        if(native){
          promptEvent=null;
          try{await native.prompt();const choice=await native.userChoice;
            if(choice?.outcome==='accepted'){el.hidden=true;return}
          }catch{}
        }
        // iOS and browsers without install-prompt support need explicit user steps.
        let help=el.querySelector('.pbR1726Help');
        if(!help){help=document.createElement('div');help.className='pbR1726Help';el.appendChild(help)}
        help.textContent=isIOS()
          ?'در Safari روی اشتراک‌گذاری بزن و «افزودن به صفحه اصلی» (Add to Home Screen) را انتخاب کن.'
          :'از منوی مرورگر، «نصب برنامه» (Install app) یا «افزودن به صفحه اصلی» را انتخاب کن.';
        el.classList.add('pbR1726HelpVisible');
      });
      document.body.appendChild(el);
    }
    el.hidden=false;
  }
  function schedule(){if(frame)return;frame=requestAnimationFrame(sync)}
  window.addEventListener('beforeinstallprompt',event=>{
    if(!mobile())return;
    event.preventDefault();
    promptEvent=event;
    schedule();
  });
  window.addEventListener('appinstalled',()=>{promptEvent=null;dismissed=true;schedule()});
  window.addEventListener('pageshow',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('focusin',schedule,{passive:true});
  document.addEventListener('focusout',schedule,{passive:true});
  const observer=new MutationObserver(schedule);
  function start(){
    observer.observe(document.getElementById('root')||document.body,{childList:true,subtree:true});
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
