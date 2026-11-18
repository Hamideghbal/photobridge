'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {installConfiguredStorage}=require('../apps/lab-desktop/configured-storage.cjs');

test('offline configured-root read aborts network quickly and returns only the already saved root',async()=>{
 const saved={id:'existing',path:'C:\\PhotoBridge\\Photos',configurationBlocked:false};
 const values=new Map([['nativeStorageRoot:lab',saved]]);
 let liveQueries=0,signalSeen=false;
 const storage={
  account:()=> 'lab',
  key:account=>'nativeStorageRoot:'+account,
  store:{get:key=>values.get(key),set:(key,value)=>values.set(key,value)},
  checkAccount:account=>assert.equal(account,'lab'),
  record:async()=>values.get('nativeStorageRoot:lab'),
  status:async()=>({root:saved,permission:'granted'}),
  request:(_url,options={})=>{
   liveQueries++;
   if(!options.signal)return Promise.resolve({ok:true,status:200,json:async()=>({configured:false})});
   signalSeen=true;
   return new Promise((_,reject)=>{
    if(options.signal.aborted)return reject(Error('offline'));
    options.signal.addEventListener('abort',()=>reject(Error('offline')),{once:true});
   });
  }
 };
 installConfiguredStorage(storage);
 const start=Date.now();
 const state=await storage.status();
 const elapsed=Date.now()-start;
 assert.equal(state.permission,'granted');
 assert.equal(state.root.id,'existing');
 assert.equal(signalSeen,true);
 assert.equal(liveQueries,1);
 assert(elapsed<1500,'offline root read took '+elapsed+'ms');
 const live=await storage.target();
 assert.equal(live.configured,false,'explicit target/activation remains a live request');
 assert.equal(liveQueries,2);
 values.set('nativeStorageRoot:lab',{...saved,configurationBlocked:true});
 await assert.rejects(storage.record(),e=>e.code==='storage_activation_required');
});
