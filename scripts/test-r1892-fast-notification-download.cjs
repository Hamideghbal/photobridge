'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const helper=fs.readFileSync('scripts/r1892-fast-notification-download.js.txt','utf8');
function fixture({native=true,online=true}={}){
 const timers=new Map(),events={},intervals=[];let now=1000,next=0,baseCalls=0,wakes=0,sse;
 const work={running:false,checkedAt:0,autoDownloadEnabled:false};
 const ctx={
  window:{pbNativeStorage:native?{}:null,pbDesktopEvents:{onChange:fn=>sse=fn}},
  navigator:{onLine:online},Date:{now:()=>now},
  pb1568Work:work,
  pb1586WakeDownloads:()=>{wakes++},
  pb1586NoticeWake:()=>{baseCalls++},
  addEventListener:(event,fn)=>events[event]=fn,
  setTimeout:(fn,ms)=>{const id=++next;timers.set(id,{fn,ms});return id},
  clearTimeout:id=>timers.delete(id),setInterval:(fn,ms)=>intervals.push({fn,ms}),Set
 };
 vm.runInNewContext(helper,ctx);
 return {
  ctx,timers,events,intervals,work,triggerSse:()=>sse?.(),
  notice:(data,url='/api/lab/notifications?limit=20')=>ctx.pb1586NoticeWake(url,data),
  runDelay:delay=>{for(const [id,t]of [...timers])if(t.ms===delay){timers.delete(id);t.fn();return true}return false},
  after:n=>now+=n,
  stats:()=>({baseCalls,wakes})
 };
}
test('fast wake schedules bounded readiness probes only after a fresh notification',()=>{
 const f=fixture();
 f.notice({notifications:[{id:'order-1'}]});
 assert.equal(f.stats().baseCalls,1);
 assert.equal(f.stats().wakes,1,'first notification triggers immediate serialized worker');
 assert.deepEqual([...f.timers.values()].map(x=>x.ms),[800,2400,5600,11000]);
 f.notice({notifications:[{id:'order-1'}]});
 assert.equal(f.timers.size,4,'notification bursts coalesce');
 assert(f.runDelay(800));assert.equal(f.stats().wakes,2);
 assert(f.runDelay(2400));assert.equal(f.stats().wakes,3);
 assert(f.runDelay(5600));assert.equal(f.stats().wakes,4);
 assert(f.runDelay(11000));assert.equal(f.stats().wakes,5);
 assert.equal(f.timers.size,0);
 f.after(4700);f.triggerSse();assert.equal(f.timers.size,4,'later event gets a new bounded window');
 f.events['photobridge-auth-session-changed']();
 assert.equal(f.timers.size,0,'logout clears stale download probes');
 assert.equal(f.ctx.window.pb1892DownloadWakeState().pending,0);
});
test('non-notification requests and explicitly offline clients start no probes',()=>{
 const f=fixture();
 f.notice({notifications:[{id:'a'}]},'/api/lab/orders');
 assert.equal(f.timers.size,0);
 const offline=fixture({online:false});
 offline.notice({notifications:[{id:'a'}]});
 assert.equal(offline.timers.size,0);
 const web=fixture({native:false});
 assert.equal(web.ctx.window.pb1892DownloadWakeState,undefined);
});
test('R2074 a newly visible live order wakes now even during the first notification window',()=>{
 const f=fixture();
 f.notice({notifications:[{id:'first'}]});
 const url='/api/lab/orders?paged=1&pbNativeLiveStatus=123';
 const ready=id=>({id,status:'sent',file_count:3});
 f.notice({orders:[ready('next')]},url);
 assert.equal(f.stats().wakes,2,'different order does not wait for old SSE debounce');
 f.notice({orders:[ready('next')]},url);
 assert.equal(f.stats().wakes,2,'same live row does not trigger a loop');
 f.notice({orders:[ready('worker')]},'/api/lab/orders?pbNativeLiveStatus=123&pb2074AutoScan=1');
 assert.equal(f.stats().wakes,2,'worker scan never wakes itself');
 f.notice({orders:[{...ready('prepaid'),settlement_mode:'prepaid',payment_status:'pending'},{...ready('empty'),file_count:0},{...ready('done'),downloaded_at:'now'}]},url);
 assert.equal(f.stats().wakes,2,'ineligible rows never wake');
 f.notice({orders:[{...ready('prepaid'),settlement_mode:'prepaid',payment_status:'paid'}]},url);
 assert.equal(f.stats().wakes,3);
 f.events['photobridge-auth-session-changed']();
 f.notice({orders:[ready('next')]},url);
 assert.equal(f.stats().wakes,4,'new account starts with clean observation state');
});
test('R2074 missed SSE uses short backup only when enabled, online and idle',()=>{
 const f=fixture(),poll=f.intervals.find(i=>i.ms===5000);
 assert(poll);
 f.after(5000);poll.fn();assert.equal(f.stats().wakes,0);
 f.work.autoDownloadEnabled=true;poll.fn();assert.equal(f.stats().wakes,1);
 poll.fn();assert.equal(f.stats().wakes,1,'same tick is coalesced');
 f.after(5000);f.work.running=true;poll.fn();assert.equal(f.stats().wakes,1);
 f.work.running=false;f.work.checkedAt=11000;poll.fn();assert.equal(f.stats().wakes,1,'fresh completed scan suppresses backup');
 f.after(5000);poll.fn();assert.equal(f.stats().wakes,2);
 f.ctx.navigator.onLine=false;f.after(5000);poll.fn();assert.equal(f.stats().wakes,2);
 f.events['photobridge-auth-session-changed']();assert.equal(f.work.autoDownloadEnabled,false);
});
test('R2074 manifest readiness retry stays short, other errors retain normal backoff',async()=>{
 const worker=fs.readFileSync('scripts/r1568-native-worker.js.txt','utf8');
 const saved=new Map(),requests=[];
 let error='download_manifest_incomplete';
 const ctx={window:{},document:{visibilityState:'visible'},Date,Map,
  localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},
  Me:async url=>{requests.push(url);if(url==='/api/auth/me')return {lab:{id:'lab'}};if(url==='/api/lab/automation')return {settings:{autoDownloadEnabled:true}};if(url.startsWith('/api/lab/orders?'))return {orders:[]};if(url.startsWith('/api/lab/orders/'))throw Error(error);throw Error('unexpected '+url)},
  fetch:async()=>({ok:true,json:async()=>({supported:true})}),
  console:{warn(){}},setTimeout(){},setInterval(){}
 };
 vm.createContext(ctx);vm.runInContext(worker,ctx);
 ctx.window.pbNativeStorage={};
 await ctx.pb1568AutoTick();
 assert(requests.some(url=>/^\/api\/lab\/orders\?pbNativeLiveStatus=\d+&pb2074AutoScan=1$/.test(url)));
 assert.equal(vm.runInContext('pb1568Work.autoDownloadEnabled',ctx),true);
 for(const [id,reason,max,min] of [['race','download_manifest_incomplete',3000,0],['integrity','download_size_mismatch',61000,59000]]){
  error=reason;const before=Date.now();
  await ctx.pb1568ProcessOrder('lab',{id,status:'sent',file_count:3},{autoDownloadEnabled:true});
  const task=ctx.pb1568State('lab',id);
  assert.equal(task.phase,'pending_download');assert.equal(task.error,reason);
  assert(task.retryAt-before>=min&&task.retryAt-before<=max);
  assert(requests.some(url=>url.startsWith('/api/lab/orders/'+id+'?pbNativeLiveStatus=')));
 }
});
test('native release serves the fast wake without altering public website worker',()=>{
 const root='dist/web/lab-desktop-ui/',name='assets/index-UIRefine-v655-r84.js';
 const native=fs.readFileSync(root+name,'utf8');
 assert(native.includes('/* PB1892: follow a desktop order notice'));
 assert(native.includes('function pb1586WakeDownloads()'));
 assert(native.includes('async function pb1568AutoTick()'));
 const normal=fs.readFileSync('dist/web/'+name,'utf8');
 assert(!normal.includes('/* PB1892: follow a desktop order notice'));
 const html=fs.readFileSync(root+'index.html','utf8');
 assert(html.includes('nativeWake=r1892')&&html.includes('nativeWakeFast=r2074'));
 assert(native.includes('pb2074AutoScan=1')&&native.includes('const readinessRace=current.phase'));
 assert(!normal.includes('pb2074AutoScan=1'));
 const m=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));
 for(const file of [name,'index.html']){
  assert.equal(m.files.find(f=>f.name===file)?.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+file)).digest('hex'));
 }
});
