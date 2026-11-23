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
 for(let now=31000;now<901000;now+=30000)await sync.runScheduled({foreground:false,now});
 assert.equal(calls.length,1);

 await sync.runScheduled({foreground:true,now:901000});
 assert.equal(calls.length,2);
 sync.nativeDownloadPriorityUntil=Date.now()+10000;
 await sync.runScheduled({foreground:true,now:931000});
 assert.equal(calls.length,2);
 sync.updateHolds=1;
 sync.nativeDownloadPriorityUntil=0;
 await sync.runScheduled({foreground:true,now:931000});
 assert.equal(calls.length,2);
 sync.updateHolds=0;
 await sync.run();
 assert.equal(calls.length,3);
});

test('background Lab host serves cached workspace reads while the order worker stays online',async t=>{
 const {createHost}=require('../host.cjs'),{LabStore}=require('../store.cjs');
 const store=new LabStore(':memory:');
 store.set('labId','A');
 store.set('auth',{user:{labRole:'lab_admin'}});
 const dashboard='/api/lab/dashboard';
 store.cache(dashboard,200,'application/json',Buffer.from('{"source":"cache"}').toString('base64'));
 const requests=[];
 let foreground=false;
 const server=createHost({
  store,sync:{},token:'background-test',roots:()=>[],foreground:()=>foreground,
  request:async path=>{requests.push(path);return Response.json({source:'server'});}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));store.db.close();});
 const fetchPath=path=>fetch('http://127.0.0.1:'+server.address().port+path,{headers:{Cookie:'desktop=background-test'}});
 assert.deepEqual(await (await fetchPath(dashboard)).json(),{source:'cache'});
 assert.equal((await fetchPath('/api/lab/orders?paged=1&mode=print')).status,503);
 assert.equal((await fetchPath('/api/lab/events')).status,503);
 assert.deepEqual(requests,[]);
 const order='/api/lab/orders/56a39ce3-011a-4a20-a8dd-fa6fab338aa6';
 assert.equal((await fetchPath(order)).status,200);
 assert.equal((await fetchPath('/api/lab/automation')).status,200);
 foreground=true;
 assert.deepEqual(await (await fetchPath(dashboard)).json(),{source:'server'});
 assert.deepEqual(requests,[order,'/api/lab/automation',dashboard]);
});

test('background notification poll wakes new orders without fetching chat history',async()=>{
 const {NativeAlerts}=require('../native-alerts.cjs');
 const values=new Map(),requests=[],notices=[];
 const store={get:key=>values.get(key),set:(key,value)=>values.set(key,value)};
 const order={id:'88624d1f-d121-462a-b264-6cea6ade44d2',event_key:'order_created',title:'سفارش جدید'};
 const alerts=new NativeAlerts({
  store,foreground:()=>false,getAccount:()=> 'A',getUserId:()=> 'user',
  request:async path=>{requests.push(path);return Response.json({notifications:[order]});},
  onOrderNotice:(_account,items)=>notices.push(...items),notify:async()=>{}
 });
 await alerts.poll();
 assert.deepEqual(notices,[order]);
 assert.deepEqual(requests,['/api/lab/notifications?limit=200&pending=']);
});
