/* PhotoBridge R100F43 — fit long Store photographer names on mobile without truncation. */
(()=>{
  'use strict';
  if(window.__PB_R100F43_STORE_HEADER_FIT__)return;
  window.__PB_R100F43_STORE_HEADER_FIT__=true;
  const mobile=()=>matchMedia('(max-width:820px)').matches;
  const text=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim();
  let lastFrameName='',lastFrameElement=null;
  function fit(){
    if(!mobile())return;
    // The shared header owns equipment typography too; never compete with its fitter.
    if(window.PBStorePhotographerHeaderCore?.version==='R100F44'&&!document.body.classList.contains('frameCustomerStore'))return;
    const h=document.querySelector('#photographerStoreRoleHeader .workspaceIdentityCopy>h1');
    if(!h)return;
    // R1222: the legacy frame-only branch forced a single-line ellipsis
    // AFTER the R1222 header painted, causing a late truncation/flash. Let
    // frame stores use the same full-name wrapping with compact adaptive type.
    const frame=document.body.classList.contains('frameCustomerStore');
    const name=text(h);
    // R1223: the unified-header fitter used a different font-size than this
    // fitter and changed it again on every click or 15-second clock update.
    // In frame mode the shopper stylesheet owns sizing. Don't rewrite it.
    if(frame){
      if(lastFrameElement===h&&lastFrameName===name)return;
      lastFrameElement=h;lastFrameName=name;
      for(const [key,value] of Object.entries({
        'font-size':'11px','line-height':'1.23','max-height':'none',
        overflow:'visible','text-overflow':'clip','white-space':'normal'
      }))if(h.style.getPropertyValue(key)!==value||h.style.getPropertyPriority(key)!=='important')h.style.setProperty(key,value,'important');
      return;
    }
    lastFrameElement=null;lastFrameName='';
    const len=[...name].length;
    const size=len>58?9.2:len>48?9.8:len>38?10.5:len>30?11.2:len>24?12:13;
    for(const [key,value] of Object.entries({
      'font-size':size+'px','line-height':'1.17','max-height':'none',
      overflow:'visible','text-overflow':'clip','white-space':'normal'
    }))if(h.style.getPropertyValue(key)!==value||h.style.getPropertyPriority(key)!=='important')h.style.setProperty(key,value,'important');
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

