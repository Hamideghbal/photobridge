const {test}=require('node:test'),assert=require('node:assert/strict'),{LabStore}=require('../store.cjs'),{Sync}=require('../sync.cjs');
function fixture(request){const store=new LabStore(':memory:');store.set('labId','A');store.set('auth',{user:{}});return{store,sync:new Sync({store,request,isOnline:()=>true})};}
test('live pull publishes only changed snapshots and never issues business writes',async()=>{let status='downloaded',calls=0;const f=fixture(async(url,options)=>{calls++;assert(!options?.method||options.method==='GET');return Response.json(url.endsWith('/orders')?{orders:[{id:'one',status}]}:{invoices:[]});});try{await f.sync.live();assert.equal(f.sync.revision,1);await f.sync.live();assert.equal(f.sync.revision,1);status='printing';await f.sync.live();assert.equal(f.sync.revision,2);assert.equal(calls,6);assert.equal(JSON.parse(Buffer.from(f.store.cached('/api/lab/orders').body,'base64')).orders[0].status,'printing');}finally{f.store.db.close()}});
test('in-flight live pull cannot leak account A data into account B',async()=>{const releases=[];let calls=0;const f=fixture(()=>{calls++;return new Promise(r=>releases.push(r))});try{const flight=f.sync.live();await f.sync.live();assert.equal(calls,2);f.store.set('labId','B');for(const release of releases)release(Response.json({orders:[{id:'private-A'}],invoices:[]}));await flight;assert.equal(f.store.cached('/api/lab/orders'),null);assert.equal(f.sync.revision,0);}finally{f.store.db.close()}});
test('local commits wake sync promptly and coalesce a burst',async()=>{const f=fixture(async()=>{throw Error('unused')});let runs=0;f.sync.run=async()=>{runs++};try{f.sync.wake();f.sync.wake();f.sync.wake();await new Promise(r=>setTimeout(r,200));assert.equal(runs,1);}finally{clearTimeout(f.sync.wakeTimer);f.store.db.close()}});
test('a long background sync does not block the small live status read',async()=>{const f=fixture(async url=>Response.json(url.endsWith('/orders')?{orders:[{id:'shared',status:'ready'}]}:{invoices:[]}));try{f.sync.running=true;await f.sync.live();assert.equal(JSON.parse(Buffer.from(f.store.cached('/api/lab/orders').body,'base64')).orders[0].status,'ready');assert.equal(f.sync.revision,1);}finally{f.store.db.close()}});

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
 await sync.run();
 assert.equal(calls.length,4);
});
