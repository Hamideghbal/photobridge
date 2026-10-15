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
    // R1222: the legacy frame-only branch forced a single-line ellipsis
    // AFTER the R1222 header painted, causing a late truncation/flash. Let
    // frame stores use the same full-name wrapping with compact adaptive type.
    const frame=document.body.classList.contains('frameCustomerStore');
    const len=[...text(h)].length;
    const size=frame?(len>50?9:len>38?9.7:len>27?10.5:11.5):(len>58?9.2:len>48?9.8:len>38?10.5:len>30?11.2:len>24?12:13);
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

