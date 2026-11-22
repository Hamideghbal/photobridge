'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {LabStore}=require('../store.cjs'),{NativeStorage}=require('../native-storage.cjs'),{createHost}=require('../host.cjs');
test('R1912: a disconnected WAN with a still-active network adapter opens a cached manual order quickly and locally',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pb-r1912-')),store=new LabStore(':memory:');
 const customer=crypto.randomUUID(),lab='lab-r1912',now=Date.now();let attempts=0;
 store.set('labId',lab);store.set('deviceId','r1912-device');store.set('auth',{user:{labRole:'lab_admin'},lab:{id:lab,name:'Lab Test'}});
 store.set('nativeStorageRoot:'+lab,{id:'root',path:dir});
 store.cache('/api/lab/delegated-orders/bootstrap?mode=print',200,'application/json',Buffer.from(JSON.stringify({lab:{id:lab},customers:[{id:customer,name:'Local customer',mobile:'09120000000'}],printSizes:[{id:'13x18',label:'13x18',luster:100}]})).toString('base64'));
 store.set('writeAccess:'+lab,{labId:lab,allowed:true,serverTime:now,receivedAt:now,highWater:now,activeUntil:new Date(now+86400000).toISOString()});
 const request=async(_url,{signal}={})=>{attempts++;return new Promise((_,reject)=>{if(!signal)return reject(Error('unexpected_unbounded_WAN_call'));if(signal.aborted)return reject(signal.reason);signal.addEventListener('abort',()=>reject(signal.reason),{once:true});})};
 const storage=new NativeStorage({store,getAccount:()=>store.get('labId'),request});
 const server=createHost({store,nativeStorage:storage,request,roots:()=>[],isOnline:()=>true,token:'test',sync:{status:()=>store.status(),wake(){}}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  const call=async(u,options={})=>{const response=await fetch(base+u,{...options,headers:{Cookie:'desktop=test','Content-Type':'application/json'}});return {status:response.status,value:await response.json()}};
  const started=Date.now(),device=await call('/api/lab/download-device');
  assert.equal(device.status,200);
  assert.equal(device.value.isThisDevice,true);
  assert(Date.now()-started<2700,'offline local preflight must not wait for the full remote timeout');
  const bootstrap=await call('/api/lab/delegated-orders/bootstrap?mode=print');
  assert.equal(bootstrap.status,200);
  assert.equal(bootstrap.value.customers[0].id,customer);
  assert.equal(bootstrap.value.printSizes[0].id,'13x18');
  const id=crypto.randomUUID();
  const draft=await call('/api/lab/delegated-orders',{method:'POST',body:JSON.stringify({clientOrderId:id,localOnly:true,customerId:customer,mode:'print'})});
  assert.equal(draft.status,200);
  assert.equal(draft.value.localCommitted,true);
  assert.equal(attempts,1,'offline order creation and bootstrap must not retry the disconnected WAN');
 }finally{await new Promise(resolve=>server.close(resolve));store.db.close();fs.rmSync(dir,{recursive:true,force:true})}
});

test('R1912: submitting the first manual order after a long offline editing session uses stored subscription approval',async()=>{
 const store=new LabStore(':memory:'),lab=crypto.randomUUID(),customer=crypto.randomUUID(),now=Date.now();let attempts=0;
 store.set('labId',lab);store.set('auth',{user:{labRole:'lab_admin'},lab:{id:lab,name:'Offline Lab'}});
 store.set('writeAccess:'+lab,{labId:lab,allowed:true,serverTime:now,receivedAt:now,highWater:now,activeUntil:new Date(now+86400000).toISOString()});
 store.cache('/api/lab/delegated-orders/bootstrap?mode=print',200,'application/json',Buffer.from(JSON.stringify({lab:{id:lab},customers:[{id:customer,name:'Customer'}],printSizes:[{id:'13x18',label:'13x18',luster:100}]})).toString('base64'));
 const request=async(_url,{signal}={})=>{attempts++;return new Promise((_,reject)=>{if(!signal)return reject(Error('unbounded_WAN_call'));if(signal.aborted)return reject(signal.reason);signal.addEventListener('abort',()=>reject(signal.reason),{once:true});})};
 const server=createHost({store,request,roots:()=>[],token:'test',isOnline:()=>true,sync:{status:()=>store.status(),wake(){}}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const id=crypto.randomUUID(),started=Date.now();
  const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/lab/delegated-orders',{method:'POST',headers:{Cookie:'desktop=test','Content-Type':'application/json'},body:JSON.stringify({clientOrderId:id,localOnly:true,customerId:customer,mode:'print'})});
  const body=await response.json();
  assert.equal(response.status,200,JSON.stringify(body));
  assert.equal(body.localCommitted,true);
  assert(Date.now()-started<2700,'manual intake should fall back to confirmed cached authorization instead of hanging on WAN');
  assert.equal(attempts,1,'only a bounded authorization probe may reach WAN');
 }finally{await new Promise(resolve=>server.close(resolve));store.db.close()}
});

test('native intake binds its opening device check to the current session and keeps live submission server-verified',async()=>{
 const store=new LabStore(':memory:'), lab='lab-device', user='user-device';
 store.set('labId',lab);store.set('deviceId','machine');
 store.set('auth',{user:{userId:user,labRole:'lab_admin'},lab:{id:lab}});
 store.set('nativeStorageRoot:'+lab,{id:'root',localStandalone:true});
 const traffic=[];
 let upstream={registered:true,isThisDevice:false};
 const server=createHost({store,roots:()=>[],isOnline:()=>true,token:'test',sync:{},
  nativeStorage:{device:async()=>({registered:true,isThisDevice:true,scope:'local-device'})},
  request:async path=>{traffic.push(path);return Response.json(upstream);},
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const call=async query=>{
   const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/lab/intake-live/download/device'+query,{headers:{Cookie:'desktop=test',Connection:'close'}});
   return {status:response.status,data:await response.json()};
  };
  assert.deepEqual(await call('?purpose=open'),{status:200,data:{registered:true,isThisDevice:true,scope:'local-device',labId:lab,userId:user}});
  assert.deepEqual(traffic,[]);
  assert.deepEqual(await call('?check=1'),{status:200,data:{registered:true,isThisDevice:false,labId:lab,userId:user}});
  assert.deepEqual(traffic,['/api/lab/download-device']);
  upstream={registered:true,isThisDevice:true,labId:'other-lab',userId:user};
  assert.deepEqual(await call('?check=1'),{status:401,data:{error:'account_changed'}});
 }finally{await new Promise(resolve=>server.close(resolve));store.db.close();}
});
