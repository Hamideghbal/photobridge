/* PhotoBridge R100F43 — fit long Store photographer names on mobile without truncation. */
(()=>{
  'use strict';
  if(window.__PB_R100F43_STORE_HEADER_FIT__)return;
  window.__PB_R100F43_STORE_HEADER_FIT__=true;
  const mobile=()=>matchMedia('(max-width:820px)').matches;
  const text=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  function fit(){
    if(!mobile())return;
    const h=document.querySelector('#photographerStoreRoleHeader .workspaceIdentityCopy>h1');
    if(!h)return;
    if(document.body.classList.contains('frameCustomerStore')){for(const [key,value]of Object.entries({'font-size':'13px','line-height':'20px','max-height':'20px',overflow:'hidden','text-overflow':'ellipsis','white-space':'nowrap'}))h.style.setProperty(key,value,'important');return;}
    const len=[...text(h)].length;
    const size=len>58?9.2:len>48?9.8:len>38?10.5:len>30?11.2:len>24?12:13;
    h.style.setProperty('font-size',size+'px','important');
    h.style.setProperty('line-height','1.17','important');
    h.style.setProperty('max-height','none','important');
    h.style.setProperty('overflow','visible','important');
    h.style.setProperty('text-overflow','clip','important');
    h.style.setProperty('white-space','normal','important');
  }
  let raf=0;
  const queue=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;fit()})};
  function start(){
    fit();
    const root=document.querySelector('#photographerStoreRoleHeader')||document.documentElement;
    new MutationObserver(queue).observe(root,{childList:true,subtree:true,characterData:true});
    new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['class']});
    addEventListener('resize',queue,{passive:true});
    addEventListener('pageshow',queue,{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

