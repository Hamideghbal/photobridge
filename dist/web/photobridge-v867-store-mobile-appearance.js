/* PhotoBridge v867 — keep Store chrome synced to the three Admin appearance colors. */
(()=>{
  'use strict';
  const valid=x=>/^#[0-9a-f]{6}$/i.test(String(x||''));
  const contrast=hex=>{const n=parseInt(String(hex).slice(1),16),c=x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4};return .2126*c(n>>16&255)+.7152*c(n>>8&255)+.0722*c(n&255)<.18?'#fff':'#101828'};
  function apply(raw){
    const header=valid(raw?.headerColor)?String(raw.headerColor).toLowerCase():'#dff2f6';
    const subbar=valid(raw?.subbarColor)?String(raw.subbarColor).toLowerCase():header;
    const top=valid(raw?.topColor)?String(raw.topColor).toLowerCase():header;
    const root=document.documentElement;
    root.style.setProperty('--pb771-top',top,'important');
    root.style.setProperty('--pb718-header',header,'important');
    root.style.setProperty('--pb718-subbar',subbar,'important');
    root.style.setProperty('--pb769-header-ink',contrast(header),'important');
    root.style.setProperty('--pb718-subbar-text',contrast(subbar),'important');
    root.style.setProperty('--pb769-subbar-ink',contrast(subbar),'important');
    root.style.setProperty('background-color',top,'important');
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',top);
    const workspace=document.querySelector('#storePhotographerWorkspace');
    if(workspace)workspace.style.setProperty('--pb-store-role-header-h','90px','important');
  }
  async function sync(){
    let cached=null;try{cached=JSON.parse(localStorage.getItem('photobridge:appearance:all')||'null')}catch{}
    if(cached)apply(cached);
    try{const r=await fetch('/api/public/appearance',{credentials:'same-origin',cache:'no-store'});if(r.ok){const d=await r.json();apply(d);try{localStorage.setItem('photobridge:appearance:all',JSON.stringify(d));localStorage.setItem('photobridge:appearance:top',valid(d.topColor)?d.topColor:(d.headerColor||'#dff2f6'))}catch{}}}catch{}
  }
  const start=()=>{void sync();setTimeout(sync,350);setTimeout(sync,1200)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
