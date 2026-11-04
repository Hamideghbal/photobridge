/* R1593 lab-only: animate successful stage change without switching queue tab. */
(()=>{'use strict';
if(window.PB1593LabFlight)return;window.PB1593LabFlight=true;
let last=null;
const clean=s=>String(s||'').replace(/[\s\u200c\-۰-۹0-9]/g,'');
const names={ready:'آماده تحویل',completed:'تحویل شده'};
document.addEventListener('pointerdown',ev=>{
 if(!/^\/lab\/(?:orders|album)(?:\/|$)/.test(location.pathname))return;
 const b=ev.target.closest('button');if(!b)return;
 const card=b.closest('.labOrderCard');if(!card)return;
 last={node:card,number:(card.textContent.match(/#\s*([۰-۹0-9]+)/)||[])[1],time:Date.now()};
 if(/چاپ/.test(b.textContent||'')&& !b.disabled){
   b.classList.add('pb1593PrintPending');
   setTimeout(()=>b.classList.remove('pb1593PrintPending'),2000);
 }
},true);
function destination(to){
 const root=document.querySelector('.labRoleWorkspace');if(!root)return null;
 return [...root.querySelectorAll('.pb1148SecondaryHeader button,.mainQueueFilters button')]
 .find(b=>b.getClientRects().length&&clean(b.textContent)===clean(names[to]));
}
addEventListener('photobridge-lab-card-flight',ev=>{
 const to=ev.detail?.to,tab=destination(to),snapshot=last;
 if(!tab||!snapshot||Date.now()-snapshot.time>15000)return;
 const card=snapshot.node;
 if(!card?.isConnected||matchMedia('(prefers-reduced-motion: reduce)').matches){tab.classList.add('pb1593Receive');setTimeout(()=>tab.classList.remove('pb1593Receive'),650);return;}
 const a=card.getBoundingClientRect(),b=tab.getBoundingClientRect();
 if(a.width<70||a.height<20)return;
 const ghost=card.cloneNode(true);ghost.setAttribute('aria-hidden','true');
 ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
 Object.assign(ghost.style,{position:'fixed',top:a.top+'px',left:a.left+'px',width:a.width+'px',height:a.height+'px',margin:'0',zIndex:'2147483000',pointerEvents:'none',overflow:'hidden',transformOrigin:'center center',background:'#fff',borderRadius:'12px',boxShadow:'0 18px 40px #28528a40'});
 document.body.appendChild(ghost);
 const dx=b.left+b.width/2-a.left-a.width/2,dy=b.top+b.height/2-a.top-a.height/2;
 const finish=()=>{ghost.remove();tab.classList.add('pb1593Receive');setTimeout(()=>tab.classList.remove('pb1593Receive'),650)};
 if(typeof ghost.animate!=='function'){finish();return;}
 const motion=ghost.animate([{transform:'translate(0,0) scale(1)',opacity:1},{offset:.35,transform:'translate('+dx*.22+'px,'+(dy*.2-18)+'px) scale(.83)',opacity:.94},{transform:'translate('+dx+'px,'+dy+'px) scale(.15)',opacity:0}],{duration:720,easing:'cubic-bezier(.22,.84,.22,1)'});
 motion.addEventListener('finish',finish,{once:true});motion.addEventListener('cancel',finish,{once:true});
 last=null;
});
})();