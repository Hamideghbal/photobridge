'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {patchSiteDownloadTransition,marker}=require('./r1530-site-download-transition.cjs');
const file='dist/web/assets/index-UIRefine-v655-r84.js';
const source=fs.readFileSync(file,'utf8');
function run({initial='received',ackStatus='received',downloadedAt=null,mode='print',race=false}={}){
 const initialOrder={id:'order-test',status:initial,mode,document_revision:7,updated_at:'old',downloaded_at:downloadedAt};
 let server={...initialOrder},calls=[],alerts=[],downloads=0,receipts=0,refresh=0;
 const context={
  E:'',C(){},F(){},B(){},V:String,
  Me:async(path,options)=>{
   if(options?.method==='POST'){calls.push(['album',path,JSON.parse(options.body)]);return {order:{...server}};}
   return{order:{...initialOrder},files:[{id:'photo',bytes:3}]};
  },
  Dg:async()=>{downloads++;return {done:1,alreadyComplete:!!downloadedAt}},
  pb1451AcknowledgeDownload:async()=>{
   receipts++;server={...server,status:ackStatus,downloaded_at:downloadedAt||'2026-11-01T13:00:00Z',document_revision:8,updated_at:'acknowledged'};
   if(race)server={...server,status:'printing',document_revision:9,updated_at:'newer'};
   return {order:{...server,...(race?{document_revision:8,updated_at:'acknowledged',status:ackStatus}:{})},verifiedFiles:1};
  },
  It:async(order,status)=>{calls.push(['status',status,order.document_revision,order.updated_at]);if(order.document_revision!==server.document_revision)throw Error('shared_document_changed');server={...server,status,document_revision:9};},
  ye:async()=>{refresh++},alert:m=>alerts.push(m),pb1450Notify:e=>{throw e}
 };
 const start=source.indexOf('Vn=async(le,options={})=>'),end=source.indexOf(',un=async le=>',start);
 assert(start>=0&&end>start);
 vm.runInNewContext('globalThis.download='+source.slice(start+3,end),context);
 return context.download({id:'order-test'}).then(()=>({server,calls,alerts,downloads,receipts,refresh}));
}
test('website contains the pinned post-acknowledgement fix, with stable cache bust and idempotent transform',()=>{
 assert(source.includes(marker));
 assert.equal(patchSiteDownloadTransition(source),source);
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('&siteDownload=r1530'));
});
test('a first verified internet download advances using the freshly acknowledged order revision',async()=>{
 const s=await run();
 assert.equal(s.server.status,'downloaded');
 assert.deepEqual(s.calls,[['status','downloaded',8,'acknowledged']]);
 assert.equal(s.receipts,1);assert.equal(s.downloads,1);assert.equal(s.refresh,1);
 assert(!s.alerts[0].includes('انجام نشد'));
});
test('timestamp-only downloaded order recovers without discarding its missing workflow transition',async()=>{
 const s=await run({downloadedAt:'2026-10-25T00:00:00Z'});
 assert.equal(s.server.status,'downloaded');
 assert.deepEqual(s.calls,[['status','downloaded',8,'acknowledged']]);
});
test('confirmed printing and ready stages are never downgraded by a late receipt',async()=>{
 for(const status of ['printing','ready','completed']){
  const s=await run({ackStatus:status});
  assert.equal(s.server.status,status);
  assert.deepEqual(s.calls,[]);
 }
});
test('concurrent progress rejects the stale revision; failure is visible, never treated as a successful stage change',async()=>{
 const s=await run({race:true});
 assert.equal(s.server.status,'printing');
 assert.deepEqual(s.calls,[['status','downloaded',8,'acknowledged']]);
 assert(s.alerts[0].includes('ثبت مرحله دانلود در سرور انجام نشد'));
});
test('album download completion sends acknowledged revision instead of empty body',async()=>{
 const s=await run({mode:'album'});
 assert.equal(s.calls.length,1);
 assert.equal(s.calls[0][0],'album');
 assert.deepEqual(s.calls[0][2],{expectedRevision:8,expectedUpdatedAt:'acknowledged'});
});
