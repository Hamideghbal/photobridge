'use strict';
/* R1965 Windows-only: bounded account-scoped server page cache, no SQLite writes. */
const crypto=require('node:crypto');
const {isPagedOrderRequest,validServerPage}=require('./r1964-native-paged-route.cjs');
const fail=(code,status=503)=>Object.assign(Error(code),{status,code});
function canonical(url){
 const u=new URL(url,'http://localhost');if(!isPagedOrderRequest({method:'GET'},u))throw fail('not_paged',400);
 const mode=u.searchParams.get('mode')||'print',stage=u.searchParams.get('stage')||'flow';
 if(!['print','album'].includes(mode)||!['flow','ready','completed'].includes(stage))throw fail('invalid_paged_params',400);
 const page=Number(u.searchParams.get('page')||1);if(!Number.isSafeInteger(page)||page<1||page>100000)throw fail('invalid_paged_page',400);
 return JSON.stringify({mode,stage,page,q:String(u.searchParams.get('q')||'').trim().slice(0,100)});
}
function create({now=()=>Date.now(),maxEntries=48,maxBytes=12*1024*1024,freshMs=900,staleMs=30000,onRefresh=()=>{},onMetric=()=>{}}={}){
 let activeAccount=null,bytes=0,generation=0;const entries=new Map(),flights=new Map();
 function reset(){generation++;entries.clear();flights.clear();bytes=0;activeAccount=null;}
 function sameAccount(account){if(!account)throw fail('not_authenticated',401);if(activeAccount&&activeAccount!==account)reset();activeAccount=account;}
 function put(account,key,body){
  if(account!==activeAccount)return false;
  const size=Buffer.byteLength(body);if(size>400*1024||size>maxBytes)return false;
  const old=entries.get(key);if(old){bytes-=old.size;entries.delete(key);}
  const signature=crypto.createHash('sha256').update(body).digest('hex');
  entries.set(key,{body,at:now(),size,signature});bytes+=size;
  while(entries.size>maxEntries||bytes>maxBytes){const first=entries.keys().next().value;bytes-=entries.get(first).size;entries.delete(first);}
  return !!old&&old.signature!==signature;
 }
 async function getOrFetch({account,url,load,validAccount=()=>true}){
  sameAccount(account);if(!validAccount())throw fail('account_changed',401);const identity=canonical(url),key=account+'|'+identity;
  const current=entries.get(key),age=current?now()-current.at:Infinity;
  async function begin(){
   if(flights.has(key))return flights.get(key);
   const started=now(),savedGeneration=generation;
   const promise=(async()=>{
    const packet=await load();if(!packet||Number(packet.status)!==200)throw fail('server_paged_status',Number(packet?.status)||503);
    const body=Buffer.isBuffer(packet.body)?packet.body.toString('utf8'):String(packet.body||'');
    if(!validServerPage(body))throw fail('paged_orders_contract_invalid',502);
    if(activeAccount!==account||!validAccount())throw fail('account_changed',401);
    if(savedGeneration!==generation)throw fail('page_invalidated_during_request',409);
    const changed=put(account,key,body);
    try{onMetric('paged_network_ms',now()-started)}catch{}
    if(changed&&current)try{onRefresh({account})}catch{}
    return body;
   })().finally(()=>{if(flights.get(key)===promise)flights.delete(key)});
   flights.set(key,promise);return promise;
  }
  if(current&&age>=0&&age<staleMs){
   if(age>freshMs&&!flights.has(key))void begin().catch(()=>{});
   try{onMetric('paged_memory_hit_ms',0)}catch{}
   entries.delete(key);entries.set(key,current);return{body:current.body,source:age>freshMs?'stale':'memory'};
  }
  return{body:await begin(),source:'network'};
 }
 function invalidate(account){if(account!==activeAccount)return;generation++;flights.clear();for(const key of [...entries.keys()])if(key.startsWith(account+'|')){bytes-=entries.get(key).size;entries.delete(key)}}
 return{getOrFetch,invalidate,reset,stats:()=>({entries:entries.size,inFlight:flights.size,bytes})};
}
module.exports={create,canonical};
