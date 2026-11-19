'use strict';
// Native-origin order IDs are not dependent on a 45s web scan or finance sync.
// Hold arrivals until the renderer registers, but never deliver across lab sessions.
const ORDER_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function createFastOrderWake({getAccount,send,now=()=>Date.now(),limit=200}){
 const pending=new Map();let ready=false;
 function flush(){
  if(!ready)return;
  for(const [key,value] of pending){
   if(getAccount()!==value.labId){pending.delete(key);continue}
   try{send(value);pending.delete(key)}catch{return}
  }
 }
 return {
  notify(labId,orderId){
   if(!labId||getAccount()!==labId||!ORDER_ID.test(String(orderId||'')))return false;
   const key=String(labId)+':'+String(orderId);
   if(!pending.has(key))pending.set(key,{labId:String(labId),orderId:String(orderId),notifiedAt:now()});
   while(pending.size>limit)pending.delete(pending.keys().next().value);
   flush();return true;
  },
  ready(){ready=true;flush()},
  reset(){ready=false},
  clear(){pending.clear();ready=false},
  pending:()=>pending.size
 };
}
module.exports={createFastOrderWake};
