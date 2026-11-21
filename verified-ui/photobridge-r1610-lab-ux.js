/* R1610 lab archive and status-circle runtime; does not mutate order status. */
(()=>{'use strict';if(window.pb1610LabUx)return;window.pb1610LabUx=true;
let scheduled=false;
function paint(){scheduled=false;const lab=document.querySelector('#root .labRoleWorkspace');if(!lab)return;
 const archive=/^\/lab\/archive(?:\/|$)/.test(location.pathname)||!!lab.querySelector('.labArchiveHeaderBtn.active');
 const queue=/^\/lab\/(?:orders|album|print)(?:\/|$)/.test(location.pathname)||!!lab.querySelector('.labPrintTopNav.active,.albumTopNav.active');
 lab.classList.toggle('pb1610Archive',archive);
 lab.classList.toggle('pb1610NotQueue',!queue);
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(paint)}
document.addEventListener('click',event=>{if(!/^\/lab\/(?:orders|album|print)(?:\/|$)/.test(location.pathname))return;
 const btn=event.target?.closest?.('.labActionTimeline>button[data-pb1578-stage]');
 if(!btn||btn.disabled||btn.getAttribute('aria-busy')==='true')return;
 if(!['print','ready','completed','binding'].includes(btn.dataset.pb1578Stage))return;
 btn.classList.add('pb1610StageClicked');
 setTimeout(()=>btn.classList.remove('pb1610StageClicked'),1300);
},true);
function start(){schedule();const root=document.getElementById('root')||document.body;new MutationObserver(schedule).observe(root,{childList:true,subtree:true});addEventListener('popstate',schedule);addEventListener('hashchange',schedule);addEventListener('photobridge-auth-session-changed',schedule)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();