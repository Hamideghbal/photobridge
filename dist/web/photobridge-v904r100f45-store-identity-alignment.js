/* PhotoBridge R100F45 — keep Store identity styling stable against legacy appearance scripts. */
(()=>{
  'use strict';
  if(window.__PB_R100F45_STORE_IDENTITY__)return;
  window.__PB_R100F45_STORE_IDENTITY__=true;
  const bar=()=>document.querySelector('#storePhotographerWorkspace>#photographerStoreIdentityBar');
  function sync(){
    const b=bar();if(!b||!matchMedia('(max-width:820px)').matches)return;
    const h=document.querySelector('#photographerStoreRoleHeader');
    const top=Math.ceil(h?.getBoundingClientRect().height||90);
    for(const [name,value] of Object.entries({
      position:'fixed',top:`${top}px`,left:'0px',right:'0px',width:'100%',height:'42px',
      'min-height':'42px','max-height':'42px',background:'#fff','background-color':'#fff',
      'background-image':'none',color:'#101828',border:'0px', 'box-shadow':'none',filter:'none',
    }))if(b.style.getPropertyValue(name)!==value||b.style.getPropertyPriority(name)!=='important')b.style.setProperty(name,value,'important');
    const toggle=b.querySelector('#storeIdentityToggle');
    if(toggle&&toggle.style.getPropertyValue('color')!=='#101828')toggle.style.setProperty('color','#101828','important');
  }
  let raf=0;const queue=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync()})};
  const start=()=>{
    sync();
    const target=bar()||document.documentElement;
    new MutationObserver(queue).observe(target,{attributes:true,attributeFilter:['style','class']});
    addEventListener('resize',queue,{passive:true});
    addEventListener('pageshow',queue,{passive:true});
    for(const ms of [100,500,1100])setTimeout(queue,ms);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
