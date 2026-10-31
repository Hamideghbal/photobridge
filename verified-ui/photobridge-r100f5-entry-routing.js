(()=>{
  'use strict';
  if(window.__PB_R100F5_ENTRY_ROUTING__)return;window.__PB_R100F5_ENTRY_ROUTING__=true;
  let busy=false,done=false;
  const path=()=>location.pathname.replace(/\/+$/,'')||'/';
  async function route(){
    if(done||busy||path()!=='/photographer')return;
    const q=new URLSearchParams(location.search);if(q.has('pbEntryDone')||q.get('pbLabChooser')==='1'||q.get('workspace')==='print')return;
    busy=true;
    try{
      const r=await fetch('/api/customer/entry-context',{credentials:'include',cache:'no-store'});if(!r.ok)return;
      // Gallery is the default entry tab for every photographer account.
      done=true;location.replace('/photographer/gallery');
    }catch{}finally{busy=false}
  }
  addEventListener('photobridge-auth-session-changed',e=>{if(e?.detail?.labRole==='customer')setTimeout(route,20)});
  addEventListener('pageshow',()=>setTimeout(route,80));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(route,100),{once:true});else setTimeout(route,100);
  setTimeout(route,700);
})();
