'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const crypto=require('node:crypto'),{fetch}=require('undici');
const {LabStore}=require('../store.cjs'),{LocalBusiness}=require('../local-business.cjs');
const {createHost}=require('../host.cjs'),{manualIntakePreflight}=require('../manual-intake-preflight.cjs');
const {routePolicy}=require('../document-policy.cjs');
const {patchOfflineIntake}=require('../offline-ui.cjs');
const fs=require('node:fs'),path=require('node:path');
const lab=crypto.randomUUID(),customer=crypto.randomUUID();
function setup({online=true,writeAllowed=true,rootAllowed=true,remotePrimary=false}={}){
 const store=new LabStore(':memory:'),now=Date.now(),calls=[];
 store.set('labId',lab);store.set('deviceId','machine-1');
 store.set('auth',{user:{labRole:'lab_admin'},lab:{id:lab}});
 store.set('writeAccess:'+lab,{labId:lab,allowed:writeAllowed,serverTime:now,receivedAt:now,highWater:now,activeUntil:new Date(now+86400000).toISOString()});
 const bootstrap={lab:{id:lab},customers:[{id:customer,name:'Walk-in customer',mobile:'09120000000'}],printSizes:[{id:'13x18',label:'13x18',luster:100}]};
 for(const suffix of ['/api/lab/delegated-orders/bootstrap','/api/lab/delegated-orders/bootstrap?mode=print']){
  store.cache(suffix,200,'application/json',Buffer.from(JSON.stringify(bootstrap)).toString('base64'));
 }
 const nativeStorage={status:async()=>rootAllowed?{permission:'granted',root:{rootId:'root'}}:{permission:'denied',root:null,message:'پوشه قابل نوشتن نیست.'}};
 const request=async(p,options={})=>{
  calls.push(p);
  if(p==='/api/lab/write-access')return{ok:writeAllowed,status:writeAllowed?200:403,json:async()=>({labId:lab,allowed:writeAllowed,serverNow:new Date().toISOString(),activeUntil:new Date(now+86400000).toISOString()})};
  if(p==='/api/lab/download-device')return{ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>({registered:true,isThisDevice:remotePrimary}),arrayBuffer:async()=>Buffer.from(JSON.stringify({registered:true,isThisDevice:remotePrimary}))};
  throw Error('other upstream not configured');
 };
 const server=createHost({store,nativeStorage,request,roots:()=>[],token:'test',isOnline:()=>online,sync:{status:()=>store.status(),wake(){}}});
 const run=async(path,body,method=body?'POST':'GET')=>{
  const response=await fetch('http://127.0.0.1:'+server.address().port+path,{method,headers:{Cookie:'desktop=test','Content-Type':'application/json',Connection:'close'},...(body?{body:JSON.stringify(body)}:{})});
  return{status:response.status,body:await response.json()};
 };
 return{store,server,calls,run,open:()=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)),close:async()=>{await new Promise(resolve=>server.close(resolve));store.db.close()}};
}
test('R1916: online local walk-in opens even if server says PC is not primary for remote downloads',async()=>{
 const f=setup();await f.open();
 try{
  const remote=await f.run('/api/lab/download-device');
  assert.equal(remote.body.isThisDevice,false,'remote download primary is never forged');
  const gate=await f.run('/api/lab/manual-intake/preflight');
  assert.equal(gate.status,200,JSON.stringify(gate.body));
  assert.equal(gate.body.scope,'manual-local-only');
  assert.equal(f.store.get('localBusinessActive:'+lab),true);
  const id=crypto.randomUUID();
  const created=await f.run('/api/lab/delegated-orders/download',{clientOrderId:id,localOnly:true,mode:'print',customerId:customer});
  assert.equal(created.status,200,JSON.stringify(created.body));
  assert.equal(created.body.localCommitted,true);
  const doc=new LocalBusiness(f.store).state().orders[id];
  assert.equal(doc.remote,false);
  assert.equal(doc.origin_offline,true);
  assert.equal(doc.localOnly,true);
  assert(!f.calls.includes('/api/lab/delegated-orders/download'),'a local manual order must not be remotely created before file proof');
 }finally{await f.close()}
});
test('R1916: a confirmed primary keeps the existing online server-authoritative intake',async()=>{
 const f=setup({remotePrimary:true});await f.open();
 try{
  const preflight=await f.run('/api/lab/manual-intake/preflight');
  assert.equal(preflight.status,200,JSON.stringify(preflight.body));
  assert.equal(preflight.body.remotePrimary,true);
  assert.equal(preflight.body.localOnly,false);
  const choice=routePolicy(f.store,'POST','/api/lab/delegated-orders',{clientOrderId:crypto.randomUUID(),localOnly:true,customerId:customer},false);
  assert.equal(choice.kind,'remote','already-working online orders must still reach the server');
 }finally{await f.close()}
});
test('R1916: disconnected WAN uses verified cached subscription without a remote primary probe',async()=>{
 const f=setup({online:false});await f.open();
 try{
  const gate=await f.run('/api/lab/manual-intake/preflight');
  assert.equal(gate.status,200,JSON.stringify(gate.body));
  assert.equal(f.calls.length,0);
  const result=await f.run('/api/lab/delegated-orders/download',{clientOrderId:crypto.randomUUID(),localOnly:true,mode:'print',customerId:customer});
  assert.equal(result.status,200,JSON.stringify(result.body));
  assert.equal(result.body.localCommitted,true);
 }finally{await f.close()}
});
test('R1916: no local folder or expired/unapproved account blocks manual order without promoting device',async()=>{
 for(const opts of [{rootAllowed:false},{writeAllowed:false}]){
  const f=setup(opts);await f.open();
  try{
   const gate=await f.run('/api/lab/manual-intake/preflight');
   assert([403,409].includes(gate.status),JSON.stringify(gate.body));
   assert.equal(gate.body.allowed,false);
   assert.equal(f.store.get('localBusinessActive:'+lab),null);
  }finally{await f.close()}
 }
});
test('R1916: changed account during asynchronous folder check is rejected',async()=>{
 const f=setup();let finish;
 const result=manualIntakePreflight({store:f.store,nativeStorage:{status:()=>new Promise(r=>{finish=r})},request:async()=>({ok:true,json:async()=>({labId:lab,allowed:true,serverNow:new Date().toISOString(),activeUntil:new Date(Date.now()+86400000).toISOString()})})});
 for(let i=0;i<30&&!finish;i++)await Promise.resolve();
 assert.equal(typeof finish,'function');
 f.store.set('labId',crypto.randomUUID());
 finish({permission:'granted',root:{}});
 const out=await result;
 assert.equal(out.status,401);
 assert(!f.store.get('localBusinessActive:'+lab));
 f.store.db.close();
});
test('R1916: shipped UI hook changes only local intake preflight, never download-primary status',()=>{
 const src=fs.readFileSync(path.join(__dirname,'../verified-ui/photobridge-r1137-lab-local-intake.js'),'utf8');
 const patched=patchOfflineIntake(src);
 assert(patched.includes("api('/api/lab/manual-intake/preflight')"));
 assert(!patched.includes('cachedPrimary?Promise.resolve({registered:true,isThisDevice:true})'));
 assert(patched.includes("async function checkPrimary()"));
 assert(patched.includes("api('/api/lab/download-device')"),'remote primary check stays in other UI');
 new Function(patched);
});
