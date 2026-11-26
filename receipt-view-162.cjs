'use strict';
// Presentation only: preserve local identity and offline-only receipts. Never mutate the journal or baseline.
function receiptRows(snapshot,remoteRows){
 const local=Object.values(snapshot.payments||{}),index=new Map(),out=local.map(row=>({...row}));
 for(let i=0;i<out.length;i++){const row=out[i];if(row.id!=null)index.set(String(row.id),i);if(row.serverId!=null)index.set(String(row.serverId),i);}
 for(const remote of remoteRows||[]){
  if(!remote||remote.id==null)continue;
  const key=String(remote.id),i=index.get(key);
  if(i===undefined){index.set(key,out.length);out.push({...remote,remote:true});continue;}
  const row=out[i];
  if(row.remote||row.serverId||row.sharedAt)out[i]={...row,...remote,id:row.id,serverId:row.serverId,origin_offline:row.origin_offline,remote:row.remote};
 }
 return out.sort((a,b)=>(Date.parse(b.paid_at)||0)-(Date.parse(a.paid_at)||0)||String(b.id).localeCompare(String(a.id)));
}
module.exports={receiptRows};
