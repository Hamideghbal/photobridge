'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'r1907-native-download-scheduler.js.txt'),'utf8');
function context(processOrder){
 const listeners={};
 const store=new Map(),requests=[],id='12345678-1234-4123-8123-123456789abc';
 const order={id,lab_id:'lab-A',status:'sent',file_count:1,created_at:new Date().toISOString(),settlement_mode:'postpaid'};
 const env={Map,Promise,Date,Number,String,Set,JSON,Math,Error,console,
  window:{pbNativeStorage:{},__PB_LAB104_NATIVE__:true},pb1568Work:{labId:'lab-A',lastError:'',running:false},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
  pb1568State:()=>null,
  Me:async route=>{requests.push(route);if(route==='/api/lab/automation')return {settings:{autoDownloadEnabled:true,invoiceTiming:'after_verified_download'}};if(route==='/api/auth/me')return {lab:{id:'lab-A'}};if(route==='/api/lab/orders/'+id)return {order:{...order},files:[{id:'file-1'}]};throw Error('unexpected route '+route)},
  pb1568Problem:e=>e.message,pb1568ProcessOrder:processOrder,pb1568AutoTick:()=>{},addEventListener:(n,f)=>listeners[n]=f};
 vm.createContext(env);vm.runInContext(source,env);
 return {...env,listeners,requests,store,order,
 schedule:(...args)=>vm.runInContext('pb1907ScheduleOrder',env)(...args),
 setTick:fn=>{env.pb1568AutoTick=fn},
 preview:(...args)=>vm.runInContext('pb1907PreviewKick',env)(...args),
 arrival:(...args)=>vm.runInContext('pb1908FastArrival',env)(...args),
 preflight:(...args)=>vm.runInContext('pb1908EmptyPreflight',env)(...args),
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

test('exact native notification directly launches the download worker without scanning order lists',async()=>{
 const started=[],ctx=context(async(lab,order)=>started.push({lab,id:order.id,at:Date.now()}));
 let scans=0;ctx.setTick(()=>scans++);
 const notifiedAt=Date.now();
 const ok=await ctx.arrival({labId:'lab-A',orderId:ctx.order.id,notifiedAt});
 assert.equal(ok,true);
 assert.equal(scans,0,'notification must not wait for scan');
 assert.equal(started.length,1);
 assert.equal(started[0].id,ctx.order.id);
 assert(ctx.requests.includes('/api/lab/orders/'+ctx.order.id));
 assert(ctx.requests.includes('/api/lab/automation'));
 assert(!ctx.requests.includes('/api/lab/orders'),'list endpoint is a known latency bottleneck');
 assert(!ctx.requests.includes('/api/auth/me'),'lab scope is established by verified native session');
 assert(Date.now()-notifiedAt<2000,'event should launch independent worker promptly');
});
test('opening a preview uses its ready detail and goes directly to worker',async()=>{
 const started=[],ctx=context(async(_lab,order)=>started.push(order.id));
 let scans=0;ctx.setTick(()=>scans++);
 const path='/api/lab/orders/'+ctx.order.id;
 ctx.preview(path,{order:{...ctx.order},files:[{id:'file-1'}]});
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(started,[ctx.order.id]);
 assert(!ctx.requests.includes('/api/lab/orders/'+ctx.order.id),'must reuse already fetched preview detail');
 assert.equal(scans,0);
 ctx.preview(path,{order:{...ctx.order,lab_id:'lab-other'},files:[{id:'file-1'}]});
 ctx.preview(path,{order:{...ctx.order,downloaded_at:'2026-11-19'},files:[{id:'file-1'}]});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(started.length,1);
});
test('notification honors automation opt-out, payment gate and session scope',async()=>{
 let started=0;const ctx=context(async()=>started++);
 const prev=ctx.Me;
 ctx.Me=async(route)=>route==='/api/lab/automation'?{settings:{autoDownloadEnabled:false}}:prev(route);
 assert.equal(await ctx.arrival({labId:'lab-A',orderId:ctx.order.id}),false);
 assert.equal(started,0);
 assert.equal(await ctx.arrival({labId:'lab-other',orderId:ctx.order.id}),false);
 assert.equal(started,0);
});
test('fast empty-folder preflight is safe: rejects existing partials, extra files, collisions and manifest mismatch',async()=>{
 const ctx=context(async()=>{}),id=ctx.order.id;
 const detail={order:{...ctx.order,file_count:2},files:[{id:'f1',original_name:'a.jpg'},{id:'f2',original_name:'b.jpg'}]};
 let contents=[];
 ctx.env.Uy=(_detail,file)=>'group';
 ctx.env.pb1450Target=async()=>({day:'today',dir:{entries:async function*(){for(const name of contents)yield [name,{kind:'file'}]}}});
 ctx.env.pb1769DownloadName=(_file,name)=>name;
 const root={name:'destination'};
 const empty=await ctx.preflight(detail,root,{});
 assert(empty&&empty.expected===2&&empty.valid===0&&empty.missing.length===2);
 contents=['partial.tmp'];
 assert.equal(await ctx.preflight(detail,root,{}),null,'existing temp must activate full verifier');
 contents=[];
 assert.equal(await ctx.preflight(detail,root,{f1:{name:'a.jpg'}}),null,'existing local receipt must use full verifier');
 assert.equal(await ctx.preflight({...detail,order:{...detail.order,file_count:3}},root,{}),null,'mismatched server manifest must use full verifier');
 assert.equal(await ctx.preflight({...detail,files:[detail.files[0],{id:'f2',original_name:'A.JPG'}]},root,{}),null,'Windows filename collision must use full verifier');
});
