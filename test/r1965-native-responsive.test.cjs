'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
const {create,canonical}=require('../r1965-page-cache.cjs');
const valid=(n=1)=>JSON.stringify({orders:[{id:'00000000-0000-4000-8000-000000000001',number:n,customer_name:'Studio',file_count:4}],counts:{flow:80,ready:17,completed:25},total:80,page:1,pages:8,pageSize:10});
const url='/api/lab/orders?paged=1&mode=print&stage=flow&page=1&pbNativeLiveStatus=1';
test('R1965 account-isolated page memory cache does not re-download on repeated tab open',async()=>{
 let requests=0;const cache=create(),load=async()=>{requests++;return{status:200,body:valid()}};
 const a=await cache.getOrFetch({account:'lab-a',url,load});
 const b=await cache.getOrFetch({account:'lab-a',url:url.replace('=1','=12'),load});
 assert.equal(a.source,'network');assert.equal(b.source,'memory');assert.equal(requests,1);
 cache.invalidate('lab-a');assert.equal(cache.stats().entries,0);
});
test('R1965 invalid/missing counts are never cached as one page',async()=>{
 const cache=create();await assert.rejects(cache.getOrFetch({account:'lab-a',url,load:async()=>({status:200,body:'{"orders":[]}'})}),/paged_orders_contract_invalid/);assert.equal(cache.stats().entries,0);
});
test('R1965 native host has per-account page route, confirmed-only status event and no SQLite paging writes',()=>{
 const host=read('host.cjs'),local=read('local-business-host.cjs'),main=read('main.cjs');
 for(const key of ['R1965_FAST_PAGED_VIEW','r1965-page-cache.cjs','nativeForegroundUntil','R1964_NONCACHE_PAGES'])assert(host.includes(key));
 assert(local.includes('if(stageRequest&&response.ok)try{onStageConfirmed()}catch{}'));
 assert(main.includes("send('lab-queue-page-refreshed')"));assert(!main.includes('void sync.live()},60000'));
});
test('R1965 safe UI update has lower priority than native photo writers',()=>{
 assert(read('main.cjs').includes('R1965_LOW_PRIORITY_UI_UPDATE'));
 assert(read('sync.cjs').includes('R1965_BACKGROUND_READ_PRIORITY'));
 assert(read('sync.cjs').includes('this.nativeDownloading?.()'));
});
test('R1965 anonymous desktop instrumentation uses scoped preload channel only',()=>{
 assert(read('main-preload.cjs').includes('onQueuePageRefresh'));
 assert(read('host.cjs').includes('/desktop/perf-sample'));
 assert(!read('r1965-perf-client.js').includes('textContent'));
 const {createRecorder}=require('../r1965-perf.cjs');const perf=createRecorder({schedule:false});assert(!perf.record('order_id',7));assert(perf.record('tab_first_paint_ms',24));assert.equal(perf.report().timings.tab_first_paint_ms.count,1);perf.stop();
});
