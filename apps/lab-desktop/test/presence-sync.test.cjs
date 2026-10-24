'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHost}=require('../host.cjs');
const path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const {LabStore}=require('../store.cjs');
async function fixture(request){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pb-lab-presence-test-'));
 const store=new LabStore(path.join(dir,'lab.sqlite'));
 store.set('auth',{user:{id:'lab'}});store.set('labId','lab-a');
 store.set('writeAccess:lab-a',{labId:'lab-a',allowed:true,activeUntil:new Date(Date.now()+3600000).toISOString(),serverTime:Date.now(),receivedAt:Date.now(),highWater:Date.now()});
 const token='testing',sync={status:()=>({signedIn:true,pending:store.status().pending,conflicts:store.status().conflicts}),run:async()=>({ok:true})};
 const server=createHost({store,sync,request,roots:()=>[],token,onLogin:async()=>{},onLogout:async()=>{}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const post=(route,body={})=>fetch(origin+route,{method:'POST',headers:{'Content-Type':'application/json',Cookie:'desktop='+token,Origin:origin},body:JSON.stringify(body)});
 return {store,post,close:async()=>{await new Promise(resolve=>server.close(resolve));store.db.close();fs.rmSync(dir,{recursive:true,force:true})}};
}
test('offline presence heartbeat never becomes a queued order or conflict',async()=>{
 const f=await fixture(async()=>{throw Error('offline')});
 try{
  const response=await f.post('/api/lab/print-alert/presence',{present:true});
  assert.equal(response.status,503);
  assert.equal(f.store.db.prepare('SELECT COUNT(*) AS n FROM outbox').get().n,0);
 }finally{await f.close()}
});
test('presence bypasses historical conflicts and forwards server results without queueing',async()=>{
 const f=await fixture(async()=>({status:200,headers:{get:()=> 'application/json'},arrayBuffer:async()=>Buffer.from('{"present":true}')}));
 try{
  f.store.enqueue('POST','/api/lab/orders',{ref:'customer-order'});
  const r=await f.post('/api/lab/print-alert/presence',{present:true});
  assert.equal(r.status,200);
  assert.equal((await r.json()).present,true);
  assert.equal(f.store.db.prepare('SELECT COUNT(*) AS n FROM outbox').get().n,1);
  assert.equal(f.store.status().pending,1);
 }finally{await f.close()}
});
test('real business edits retain offline queue fallback; never falsely succeed',async()=>{
 const f=await fixture(async()=>{throw Error('offline')});
 try{
  const r=await f.post('/api/lab/finance/payments',{amount:100});
  assert.equal(r.status,202);
  assert.equal(f.store.db.prepare('SELECT COUNT(*) AS n FROM outbox').get().n,1);
 }finally{await f.close()}
});
test('primary registration bypasses unrelated pending orders and requires a server response',async()=>{
 let received;const f=await fixture(async(route,options)=>{received={route,options};return{status:200,headers:{get:()=> 'application/json'},arrayBuffer:async()=>Buffer.from('{"registered":true,"isThisDevice":true}')}});
 try{f.store.enqueue('POST','/api/lab/orders',{ref:'pending'});const r=await f.post('/api/lab/download-device',{force:true,label:'Windows'});assert.equal(r.status,200);assert.equal((await r.json()).isThisDevice,true);assert.equal(received.route,'/api/lab/download-device');assert.equal(JSON.parse(received.options.body).force,true);assert.equal(f.store.rows().length,1);}finally{await f.close()}
});
test('offline primary registration reports an error and is never falsely queued as success',async()=>{
 const f=await fixture(async()=>{throw Error('offline')});try{const r=await f.post('/api/lab/download-device',{force:true});assert.equal(r.status,503);assert.equal((await r.json()).error,'download_device_registration_offline');assert.equal(f.store.rows().length,0);}finally{await f.close()}
});
test('server rejection of primary registration is preserved without a queued takeover',async()=>{
 const f=await fixture(async()=>({status:409,headers:{get:()=> 'application/json'},arrayBuffer:async()=>Buffer.from('{"error":"primary_device_exists"}')}));try{const r=await f.post('/api/lab/download-device',{force:true});assert.equal(r.status,409);assert.equal((await r.json()).error,'primary_device_exists');assert.equal(f.store.rows().length,0);}finally{await f.close()}
});
