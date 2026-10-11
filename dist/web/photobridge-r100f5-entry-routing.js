(()=>{
  'use strict';
  if(window.__PB_R100F5_ENTRY_ROUTING__)return;window.__PB_R100F5_ENTRY_ROUTING__=true;
  let busy=false,done=false;
  const path=()=>location.pathname.replace(/\/+$/,'')||'/';
  async function route(){
    if(done||busy||path()!=='/photographer')return;
    const q=new URLSearchParams(location.search);if(q.has('pbEntryDone')||q.get('pbLabChooser')==='1')return;
    busy=true;
    try{
      const r=await fetch('/api/customer/entry-context',{credentials:'include',cache:'no-store'});if(r.status===401||r.status===403)return;const d=await r.json();if(!r.ok)return;
      if(d.destination==='rental'&&Number(d.connectedCount||0)>0){done=true;location.replace('/equipment-rental/book?entry=1');return}
      if(d.destination==='lab'&&Number(d.connectedCount||0)>0){
        if(Number(d.connectedCount||0)>1){done=true;location.replace('/photographer?pbLabChooser=1&pbEntryDone=lab');return}
        if(d.primaryLabId){await fetch('/api/customer/labs/'+encodeURIComponent(d.primaryLabId)+'/select',{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:'{}'}).catch(()=>{})}
        done=true;location.replace('/photographer?pbEntryDone=lab');return
      }
      // Use an available destination directly; returning to this entry route loops when AI is disabled.
      let destination='/photographer/gallery';
      try{const tabsResponse=await fetch('/api/photographer/navigation-tabs',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}});if(tabsResponse.ok){const tabs=await tabsResponse.json();if(tabs.tabs?.ai!==false)destination='/photographer/ai/retouch'}}catch{}
      done=true;location.replace(destination);
    }catch{}finally{busy=false}
  }
  addEventListener('photobridge-auth-session-changed',e=>{if(e?.detail?.labRole==='customer')setTimeout(route,20)});
  addEventListener('pageshow',()=>setTimeout(route,80));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(route,100),{once:true});else setTimeout(route,100);
  setTimeout(route,700);
})();
