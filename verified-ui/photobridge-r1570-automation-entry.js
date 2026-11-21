/* R1570: visible settings entry for Lab automated download and thermal receipts.
   Add a discoverable entry in print orders and in Lab settings, without touching
   the orders/finance/printing action handlers or re-rendering their contents. */
(()=>{'use strict';
 if(window.pb1570AutomationEntry)return;window.pb1570AutomationEntry=true;
 const target='/lab/settings/automation',selector='a[data-pb1570-automation-entry]';
 const enabled=()=>/^\/lab\/(?:orders|settings)(?:\/|$)/.test(location.pathname);
 function anchor(){
  const a=document.createElement('a');
  a.href=target;a.dataset.pb1570AutomationEntry='1';a.className='pb1570AutomationEntry';
  a.textContent='دانلود و چاپ خودکار';
  a.setAttribute('aria-label','تنظیم دانلود خودکار سفارش و چاپ فاکتور حرارتی');
  return a;
 }
 function mount(){
  const prior=document.querySelector(selector);
  if(!enabled()){prior?.remove();return;}
  if(location.pathname.replace(/\/$/,'')===target){prior?.remove();return;}
  // The settings tabs are stable; the print-order header is the entrypoint to
  // the order workspace. Never insert inside a photo grid or a payment form.
  const settings=document.querySelector('.labSettingsSectionTabs');
  const orderHead=/^\/lab\/orders(?:\/|$)/.test(location.pathname)
    ?document.querySelector('.labRoleWorkspace .labRolePageScrollArea')||document.querySelector('.labRoleWorkspace')
    :null;
  const dest=settings||orderHead;
  if(!dest){prior?.remove();return;}
  if(prior&&prior.parentElement===dest)return;
  prior?.remove();
  const a=anchor();
  if(settings)settings.appendChild(a);
  else dest.prepend(a);
 }
 let queued=false;
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount()})}
 document.addEventListener('DOMContentLoaded',schedule,{once:true});
 addEventListener('popstate',schedule);addEventListener('hashchange',schedule);
 const obs=new MutationObserver(records=>{
  if(records.some(record=>[...record.addedNodes,...record.removedNodes].some(node=>
    node.nodeType===1&&(node.matches?.('.labSettingsSectionTabs,.labRoleWorkspace,.labRolePageScrollArea')||
    node.querySelector?.('.labSettingsSectionTabs,.labRoleWorkspace,.labRolePageScrollArea')))))schedule();
 });
 obs.observe(document.documentElement,{childList:true,subtree:true});
 schedule();
})();
