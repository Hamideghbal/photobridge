'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'r1907-native-download-scheduler.js.txt'),'utf8');
function context(processOrder){
 const listeners={};
 const env={Map,Promise,window:{pbNativeStorage:{}},pb1568Work:{labId:'lab-A',lastError:''},
 pb1568Problem:e=>e.message,pb1568ProcessOrder:processOrder,pb1568AutoTick:()=>{},addEventListener:(n,f)=>listeners[n]=f};
 vm.createContext(env);vm.runInContext(source,env);
 return {...env,listeners,
 schedule:(...args)=>vm.runInContext('pb1907ScheduleOrder',env)(...args),
 setTick:fn=>{env.pb1568AutoTick=fn},
 preview:(...args)=>vm.runInContext('pb1907PreviewKick',env)(...args),
 slot:f=>vm.runInContext('pb1907WithDownloadSlot',env)(f)};
}
test('order B begins file request while order A invoice remains unresolved',async()=>{
 let releaseA;const blockedInvoice=new Promise(resolve=>releaseA=resolve),starts=[],invoices=[];
 const ctx=context(async(_lab,order)=>{
  await ctx.slot(async()=>{starts.push(order.id)});
  invoices.push(order.id);
  if(order.id==='A')await blockedInvoice;
 });
 const a=ctx.schedule('lab-A',{id:'A'},{});
 await Promise.resolve();await Promise.resolve();await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(starts,['A']);
 const b=ctx.schedule('lab-A',{id:'B'},{});
 await b;
 assert.deepEqual(starts,['A','B']);
 assert.deepEqual(invoices,['A','B']);
 releaseA();await a;
});
test('repeated order wake creates one flight and transfer pool is bounded',async()=>{
 let releaseA;const block=new Promise(resolve=>releaseA=resolve);let executions=0;
 const ctx=context(async()=>{executions++;await block});
 const order={id:'A'},a=ctx.schedule('lab-A',order,{}),b=ctx.schedule('lab-A',order,{});
 assert.equal(a,b);await Promise.resolve();assert.equal(executions,1);
 releaseA();await a;assert.equal(executions,1);
 let active=0,max=0,release=[];const jobs=[0,1,2,3].map(()=>ctx.slot(async()=>{
  active++;max=Math.max(max,active);await new Promise(resolve=>release.push(resolve));active--;
 }));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(max,2);assert.equal(release.length,2);
 release.splice(0).forEach(f=>f());
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(release.length,2);release.splice(0).forEach(f=>f());await Promise.all(jobs);
 assert.equal(max,2);
});
test('pending scheduled work from previous account never starts',async()=>{
 let called=0;const ctx=context(async()=>called++);
 const a=ctx.schedule('lab-A',{id:'A'},{});ctx.listeners['photobridge-auth-session-changed']();
 await a;assert.equal(called,0);
});

test('opening a new order preview wakes scan instantly, dedupes and ignores other lab',()=>{
 const ctx=context(async()=>{});let wakes=0;
 ctx.setTick(()=>{wakes++});
 const id='12345678-1234-4123-8123-123456789abc';
 const path='/api/lab/orders/'+id;
 ctx.preview(path,{order:{id,lab_id:'lab-A',status:'sent',downloaded_at:null}});
 assert.equal(wakes,1);
 ctx.preview(path,{order:{id,lab_id:'lab-A',status:'sent'}});assert.equal(wakes,1);
 ctx.preview(path,{order:{id,lab_id:'lab-other',status:'sent'}});assert.equal(wakes,1);
 ctx.preview(path,{order:{id,lab_id:'lab-A',status:'downloaded',downloaded_at:'2026-11-19T00:00:00Z'}});assert.equal(wakes,1);
});
