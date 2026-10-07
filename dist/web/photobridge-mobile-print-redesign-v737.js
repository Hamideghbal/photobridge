/* PhotoBridge v737 — mobile print composer dock.
   React-safe: this script never reparents or replaces React-owned nodes. It creates one
   independent dock outside #root and delegates clicks to the real React buttons. */
(()=>{
  'use strict';
  const DOCK_ID='pb737-mobile-print-dock';
  const ACTIVE_CLASS='pb737-mobile-print-active';
  const REDESIGN_CLASS='pb737MobilePrintRedesign';
  const mq=window.matchMedia('(max-width: 820px)');
  let scheduled=false;

  const text=(node)=>String(node?.textContent||'').replace(/\s+/g,' ').trim();
  const visible=(node)=>Boolean(node&&node.isConnected);

  function findPilot(){
    const workspace=document.querySelector('.photographerMain.simplePrintPilotWorkspaceMode');
    if(!workspace)return null;
    const pilot=workspace.querySelector('.simplePrintPilot');
    return pilot||null;
  }

  function findRealAdd(pilot){
    const buttons=[...pilot.querySelectorAll('button.simplePrintPilotPrimaryAdd')];
    return buttons.find(visible)||buttons[0]||null;
  }

  function findRealSend(pilot){
    return pilot.querySelector('button.simplePrintPilotQuoteSubmit')
      ||pilot.querySelector('button.simplePrintPilotHeaderSubmit')
      ||null;
  }

  function findPriceCard(pilot){
    return pilot.querySelector('.simplePrintPilotQuote');
  }

  function ensureDock(){
    let dock=document.getElementById(DOCK_ID);
    if(dock)return dock;
    dock=document.createElement('section');
    dock.id=DOCK_ID;
    dock.setAttribute('aria-label','کنترل‌های ثابت ارسال فایل چاپ');
    dock.innerHTML=`
      <div class="pb737DockSummary">
        <div>
          <span>جمع سفارش چاپ</span>
          <strong class="pb737DockTotal">هنوز عکسی انتخاب نشده</strong>
        </div>
        <button type="button" class="pb737DockPriceJump">ریز قیمت</button>
      </div>
      <div class="pb737DockActions">
        <button type="button" class="pb737DockAdd">＋ انتخاب سایز و عکس</button>
        <button type="button" class="pb737DockSend" disabled>ارسال برای چاپ</button>
      </div>`;
    document.body.appendChild(dock);

    dock.querySelector('.pb737DockAdd')?.addEventListener('click',()=>{
      const pilot=findPilot();
      const target=pilot&&findRealAdd(pilot);
      if(target&&!target.disabled)target.click();
    });
    dock.querySelector('.pb737DockSend')?.addEventListener('click',()=>{
      const pilot=findPilot();
      const target=pilot&&findRealSend(pilot);
      if(target&&!target.disabled)target.click();
    });
    dock.querySelector('.pb737DockPriceJump')?.addEventListener('click',()=>{
      const pilot=findPilot();
      const target=pilot&&findPriceCard(pilot);
      if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
    });
    return dock;
  }

  function removeDock(){
    document.getElementById(DOCK_ID)?.remove();
    document.body.classList.remove(ACTIVE_CLASS);
    document.querySelectorAll('.'+REDESIGN_CLASS).forEach(node=>node.classList.remove(REDESIGN_CLASS));
  }

  function sync(){
    scheduled=false;
    if(!mq.matches){removeDock();return;}
    const pilot=findPilot();
    if(!pilot){removeDock();return;}

    document.body.classList.add(ACTIVE_CLASS);
    pilot.classList.add(REDESIGN_CLASS);
    const priceCard=findPriceCard(pilot);
    if(priceCard){
      priceCard.id='pb737-print-price-breakdown';
      priceCard.setAttribute('aria-label','ریز قیمت سفارش چاپ');
    }

    const dock=ensureDock();
    const add=findRealAdd(pilot);
    const send=findRealSend(pilot);
    const addProxy=dock.querySelector('.pb737DockAdd');
    const sendProxy=dock.querySelector('.pb737DockSend');
    const totalNode=dock.querySelector('.pb737DockTotal');
    const jump=dock.querySelector('.pb737DockPriceJump');

    if(addProxy)addProxy.disabled=Boolean(!add||add.disabled);
    if(sendProxy){
      sendProxy.disabled=Boolean(!send||send.disabled);
      const label=text(send);
      sendProxy.textContent=label||'ارسال برای چاپ';
    }

    const quoteTotal=pilot.querySelector('.simplePrintPilotQuote .simplePrintQuoteTotal b');
    const photoCount=pilot.querySelectorAll('.simplePrintPhotoCard').length;
    const totalText=text(quoteTotal);
    if(totalNode){
      totalNode.textContent=photoCount
        ?`${photoCount.toLocaleString('fa-IR')} عکس${totalText?` · ${totalText}`:''}`
        :'هنوز عکسی انتخاب نشده';
    }
    if(jump)jump.disabled=!priceCard;
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(sync);
  }

  const observer=new MutationObserver(schedule);
  const start=()=>{
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled','aria-hidden']});
    mq.addEventListener?.('change',schedule);
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('popstate',schedule);
    document.addEventListener('click',()=>setTimeout(schedule,0),true);
    schedule();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
