'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {manualIntakePreflight}=require('../manual-intake-preflight.cjs');
const {LabStore}=require('../store.cjs');
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};}
function setup(){
 const store=new LabStore(':memory:'),lab='123e4567-e89b-12d3-a456-426614174000';
 const now=Date.now();store.set('labId',lab);store.set('deviceId','local-1');store.set('auth',{lab:{id:lab}});
 store.set('writeAccess:'+lab,{labId:lab,allowed:true,serverTime:now,receivedAt:now,highWater:now,activeUntil:new Date(now+3600000).toISOString()});
 return{store,lab,close:()=>store.db.close()};
}
test('R1919: independent subscription, native disk and remote-primary probes begin concurrently',async()=>{
 const {store,lab,close}=setup();
 const d=deferred(),p=deferred(),calls=[];
 const work=manualIntakePreflight({store,nativeStorage:{status:()=>{calls.push('disk');return d.promise;}},request:(url)=>{calls.push(url);if(url==='/api/lab/write-access')throw Error('offline');if(url==='/api/lab/download-device')return p.promise;throw Error('unexpected');}});
 try{
  for(let i=0;i<20&&calls.length<3;i++)await Promise.resolve();
  assert.deepEqual([...calls].sort(),['/api/lab/download-device','/api/lab/write-access','disk'].sort());
  d.resolve({permission:'granted',root:{rootId:'root'}});
  p.resolve({ok:true,status:200,json:async()=>({registered:true,isThisDevice:false})});
  const result=await work;assert.equal(result.allowed,true);assert.equal(result.localOnly,true);
  assert.equal(store.get('manualIntakeFallback:'+lab+':local-1'),true);
 }finally{close();}
});
test('R1919: offline cached approval cannot bypass revoked subscription or missing disk',async()=>{
 const f=setup();f.store.set('writeAccess:'+f.lab,{allowed:false,highWater:Date.now(),serverTime:Date.now(),receivedAt:Date.now()});
 try{
  const result=await manualIntakePreflight({store:f.store,nativeStorage:{status:async()=>({permission:'granted',root:{rootId:'root'}})},request:async()=>{throw Error('offline')}});
  assert.equal(result.allowed,false);assert.equal(result.status,403);
  assert.equal(f.store.get('manualIntakeFallback:'+f.lab+':local-1'),null);
 }finally{f.close();}
});
