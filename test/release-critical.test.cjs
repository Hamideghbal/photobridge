'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {Sync}=require('../sync.cjs'),{createUpdateInstallGate,beginHostWrite}=require('../update-install-gate.cjs');
test('release invariant: passive reads cannot lock installation; real writes remain protected',async()=>{
 const sync=new Sync({store:{get:()=>null},request:async()=>{throw Error('unexpected network')}});sync.flight=new Promise(()=>{});sync.phase='download';
 const nativeStorage={writers:new Map(),selection:null},gate=createUpdateInstallGate({nativeStorage,sync,getWindow:()=>({webContents:{executeJavaScript:async()=>null}})});
 const release=gate.hold();try{assert.equal(await gate.canInstall({waitMs:0}),true);assert.equal((await sync.run()).error,'update_in_progress');sync.mutating=true;assert.equal(await gate.canInstall({waitMs:0}),false);sync.mutating=false;nativeStorage.writers.set('copy',{});assert.equal(await gate.canInstall({waitMs:0}),false);nativeStorage.writers.clear();assert.throws(()=>beginHostWrite(sync,'POST','/api/lab/invoices/manual'),/update_in_progress/);}finally{release()}
 assert.equal(sync.updateHolds,0);
});
test('release invariant: visible user forms are never bypassed by the updater',async()=>{
 const sync={holdForUpdate:()=>()=>{},mutating:false},gate=createUpdateInstallGate({nativeStorage:{writers:new Map()},sync,getWindow:()=>({webContents:{executeJavaScript:async()=> 'open_form'}})});
 assert.equal(await gate.canInstall({waitMs:0}),false);assert.equal(gate.reason(),'open_form');
});

test('scheduled bulk sync stays quiet in the background and foreground refresh resumes',async()=>{
 const {Sync}=require('../sync.cjs');
 const store={get:key=>key==='labId'?'A':key==='auth'?{}:null};
 const sync=new Sync({store,request:async()=>{throw Error('unexpected HTTP call');}});
 const calls=[];
 sync.run=()=>{calls.push('bulk');return Promise.resolve();};
 await sync.runScheduled({foreground:true,now:1000});
 for(let now=31000;now<301000;now+=30000)await sync.runScheduled({foreground:false,now});
 assert.equal(calls.length,1);
 await sync.runScheduled({foreground:false,now:301000});
 assert.equal(calls.length,2);
 await sync.runScheduled({foreground:true,now:331000});
 assert.equal(calls.length,3);
 sync.nativeDownloadPriorityUntil=Date.now()+10000;
 await sync.runScheduled({foreground:true,now:361000});
 assert.equal(calls.length,3);
 sync.updateHolds=1;
 sync.nativeDownloadPriorityUntil=0;
 await sync.runScheduled({foreground:true,now:361000});
 assert.equal(calls.length,3);
 sync.updateHolds=0;
 await sync.run();
 assert.equal(calls.length,4);
});
