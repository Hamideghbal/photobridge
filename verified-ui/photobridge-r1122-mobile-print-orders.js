/* R1122 — keep the photographer's existing order-status controls usable
   when the R100 mobile shared header intentionally hides their React-owned rail.
   No independent order state, API request, or re-filtering is introduced. */
(()=>{
  'use strict';
  if(window.__PB_R1122_MOBILE_PRINT_ORDERS__)return;
  window.__PB_R1122_MOBILE_PRINT_ORDERS__=true;

  const id='pbR1122PrintOrderStatuses';
  const labels=['در جریان','نیازمند اصلاح','آماده تحویل','تحویل‌شده'];
  let scheduled=false;
  const nativeButtons=()=>Array.from(document.querySelectorAll(
    'main.photographerMain .photographerLabContextRail .photographerContextStatusesMobile > button'
  )).slice(0,4);

  function sync(){
    const old=document.getElementById(id);
    const main=document.querySelector('main.photographerMain.photographerPrintWorkspace');
    const workspace=main?.querySelector('.ordersWorkspace.liveCustomerOrders');
    const source=nativeButtons();
    const mobile=window.matchMedia?.('(max-width: 820px)').matches ?? window.innerWidth<=820;
    if(!mobile||!workspace||source.length!==4||!document.body.classList.contains('pbF37PrintMode')){
      old?.remove();
      return;
    }
    let bar=old;
    if(!bar){
      bar=document.createElement('nav');
      bar.id=id;
      bar.setAttribute('aria-label','وضعیت سفارش‌های چاپ');
      for(let i=0;i<4;i++){
        const btn=document.createElement('button');
        btn.type='button';
        btn.dataset.statusIndex=String(i);
        const label=document.createElement('span');
        label.textContent=labels[i];
        const count=document.createElement('b');
        count.textContent='۰';
        btn.append(label,count);
        btn.addEventListener('click',()=>{
          const current=nativeButtons()[i];
          current?.click(); // Reuse the existing React filter and route handler.
          window.setTimeout(schedule,60);
        });
        bar.appendChild(btn);
      }
    }
    if(bar.parentElement!==workspace)workspace.insertBefore(bar,workspace.firstChild);
    Array.from(bar.children).forEach((button,i)=>{
      const active=source[i].classList.contains('active');
      if(button.classList.contains('active')!==active)button.classList.toggle('active',active);
      const pressed=active?'true':'false';
      if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);
      const next=source[i].querySelector('b')?.textContent.trim()||'۰';
      const count=button.querySelector('b');
      if(count&&count.textContent!==next)count.textContent=next;
    });
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    window.requestAnimationFrame(()=>{
      scheduled=false;
      sync();
    });
  }
  function boot(){
    if(!document.body)return;
    const observer=new MutationObserver(schedule);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    window.addEventListener('popstate',schedule);
    window.addEventListener('resize',schedule,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
