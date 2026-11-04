(()=>{'use strict';if(window.pb1578TransferIndicator)return;window.pb1578TransferIndicator=true;document.documentElement.classList.add('pb1578FeedbackEnabled');
const labels={flow:'در جریان',ready:'آماده تحویل',completed:'تحویل‌شده'};let timer,target,animation,generation=0,active=false;
const normalize=text=>String(text||'').replace(/[\s\u200c\-0-9۰-۹٠-٩]/g,'');
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const inQueue=()=>/^\/lab\/(?:orders|album)(?:\/|$)/.test(location.pathname);
function clear(){clearTimeout(timer);animation?.cancel();animation=null;target?.classList.remove('pb1578Destination');target=null;active=false;generation++}
function highlight(to){
 const root=document.querySelector('.labRoleWorkspace');if(!root)return;
 const buttons=[...root.querySelectorAll('.pb1148SecondaryHeader button,.mainQueueFilters button')];
 const button=buttons.find(node=>node.getClientRects().length&&normalize(node.textContent)===normalize(labels[to]));
 if(!button)return;if(target!==button){target?.classList.remove('pb1578Destination');target=button;button.classList.add('pb1578Destination')}
 const nav=button.closest('.pb1148SecondaryHeader,.mainQueueFilters');if(nav&&nav.scrollWidth>nav.clientWidth){const item=button.getBoundingClientRect(),bounds=nav.getBoundingClientRect();if(item.left<bounds.left||item.right>bounds.right)nav.scrollBy({left:item.left+item.width/2-bounds.left-bounds.width/2,behavior:reduced()?'auto':'smooth'})}
}
function turn(){
 if(reduced())return;
 const sheet=document.querySelector('.labRoleWorkspace .labOrderScrollArea');if(!sheet)return;
 animation?.cancel();
 const old=sheet.style.getPropertyValue('translate'),priority=sheet.style.getPropertyPriority('translate');
 const width=sheet.getBoundingClientRect().width;let frame=0,start=null,cancelled=false;
 const restore=()=>{if(old)sheet.style.setProperty('translate',old,priority);else sheet.style.removeProperty('translate')};
 animation={cancel(){cancelled=true;cancelAnimationFrame(frame);restore()}};
 // The legacy styles force both transform AND translate:none!important.
 // A bounded compositor-only slide overrides that rule only while navigating.
 const tick=now=>{if(cancelled)return;if(start===null)start=now;const progress=Math.min(1,(now-start)/520),eased=1-Math.pow(1-progress,3);sheet.style.setProperty('translate',(-width*(1-eased))+'px 0','important');if(progress<1)frame=requestAnimationFrame(tick);else restore()};
 sheet.style.setProperty('translate',-width+'px 0','important');frame=requestAnimationFrame(tick);
}
function show(event){
 const to=event.detail?.to;if(!labels[to]||!inQueue()||!document.querySelector('.labRoleWorkspace'))return;
 clear();active=true;const run=generation;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{if(run!==generation||!inQueue())return;highlight(to);turn()}));
 timer=setTimeout(clear,1800);
}
addEventListener('photobridge-queue-transfer',show);
addEventListener('popstate',()=>{if(active&&!inQueue())clear()});
addEventListener('photobridge-auth-session-changed',clear);
})();
