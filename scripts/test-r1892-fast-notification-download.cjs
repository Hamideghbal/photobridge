'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const helper=fs.readFileSync('scripts/r1892-fast-notification-download.js.txt','utf8');
function fixture({native=true,online=true}={}){
 const timers=new Map(),events={};let now=1000,next=0,baseCalls=0,wakes=0,sse;
 const ctx={
  window:{pbNativeStorage:native?{}:null,pbDesktopEvents:{onChange:fn=>sse=fn}},
  navigator:{onLine:online},Date:{now:()=>now},
  pb1586WakeDownloads:()=>{wakes++},
  pb1586NoticeWake:()=>{baseCalls++},
  addEventListener:(event,fn)=>events[event]=fn,
  setTimeout:(fn,ms)=>{const id=++next;timers.set(id,{fn,ms});return id},
  clearTimeout:id=>timers.delete(id),Set
 };
 vm.runInNewContext(helper,ctx);
 return {
  ctx,timers,events,triggerSse:()=>sse?.(),
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
 assert.deepEqual([...f.timers.values()].map(x=>x.ms),[800,2400,5600,11000]);
 f.notice({notifications:[{id:'order-1'}]});
 assert.equal(f.timers.size,4,'notification bursts coalesce');
 assert(f.runDelay(800));assert.equal(f.stats().wakes,1);
 assert(f.runDelay(2400));assert.equal(f.stats().wakes,2);
 assert(f.runDelay(5600));assert.equal(f.stats().wakes,3);
 assert(f.runDelay(11000));assert.equal(f.stats().wakes,4);
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
test('native release serves the fast wake without altering public website worker',()=>{
 const root='dist/web/lab-desktop-ui/',name='assets/index-UIRefine-v655-r84.js';
 const native=fs.readFileSync(root+name,'utf8');
 assert(native.includes('/* PB1892: follow a desktop order notice'));
 assert(native.includes('function pb1586WakeDownloads()'));
 assert(native.includes('async function pb1568AutoTick()'));
 const normal=fs.readFileSync('dist/web/'+name,'utf8');
 assert(!normal.includes('/* PB1892: follow a desktop order notice'));
 const html=fs.readFileSync(root+'index.html','utf8');
 assert(html.includes('nativeWake=r1892'));
 const m=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));
 for(const file of [name,'index.html']){
  assert.equal(m.files.find(f=>f.name===file)?.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+file)).digest('hex'));
 }
});
