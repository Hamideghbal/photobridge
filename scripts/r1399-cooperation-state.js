function pb1399WatchPending({request,onPending,events=window,interval=8000}){
 let alive=true,epoch=0,timer,rows=[],dismissed='',reviewed=new Map();
 const key=list=>list.map(r=>r.id+':'+(r.requested_at||'')).sort().join('|');
 const paint=()=>{const pending=rows.filter(r=>r.status==='pending'&&(!reviewed.has(r.id)||reviewed.get(r.id)!==String(r.requested_at||'')));const signature=key(pending);if(!pending.length){onPending(previous=>previous?.accepted||previous?.removed?previous:null);return}if(signature===dismissed)return;const first=pending[0];onPending({requestId:first.id,photographerName:first.name||'عکاس جدید',pendingCount:pending.length,persistent:true})};
 const load=async()=>{clearTimeout(timer);const generation=++epoch;try{const data=await request('/api/lab/collaboration-settings');if(!alive||generation!==epoch)return;rows=Array.isArray(data.requests)?data.requests:[];paint()}catch{}finally{if(alive&&generation===epoch)timer=setTimeout(load,interval)}};
 const review=event=>{const id=event.detail?.requestId;if(!id)return;const row=rows.find(r=>r.id===id);reviewed.set(id,String(row?.requested_at||event.detail?.requestedAt||''));rows=rows.filter(r=>r.id!==id);paint();void load()};
 const dismiss=()=>{dismissed=key(rows.filter(r=>r.status==='pending'))};
 events.addEventListener('photobridge-collaboration-reviewed',review);events.addEventListener('photobridge-lab-pending-dismiss',dismiss);events.addEventListener('photobridge-lab-pending-refresh',load);events.addEventListener('focus',load);void load();
 return()=>{alive=false;epoch++;clearTimeout(timer);events.removeEventListener('photobridge-collaboration-reviewed',review);events.removeEventListener('photobridge-lab-pending-dismiss',dismiss);events.removeEventListener('photobridge-lab-pending-refresh',load);events.removeEventListener('focus',load)};
}
function pb1399WatchDirectory({request,onData,events=window,interval=8000}){
 let alive=true,epoch=0,timer;
 const load=async()=>{clearTimeout(timer);const generation=++epoch;try{const data=await request('/api/customer/labs');if(alive&&generation===epoch)onData(data)}catch{}finally{if(alive&&generation===epoch)timer=setTimeout(load,interval)}};
 const review=event=>{const data=event.detail||{},id=String(data.labId||data.lab_id||'');if(!id||!['approved','rejected','cancelled'].includes(data.status))return;onData(previous=>previous?({...previous,labs:(previous.labs||[]).map(lab=>String(lab.id)===id?({...lab,request_status:data.status,connected:data.status==='approved'}):lab)}):previous);void load()};
 events.addEventListener('photobridge-collaboration-review',review);events.addEventListener('focus',load);void load();
 return()=>{alive=false;epoch++;clearTimeout(timer);events.removeEventListener('photobridge-collaboration-review',review);events.removeEventListener('focus',load)};
}
