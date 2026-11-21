'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {localBusinessHost}=require('../local-business-host.cjs');
const {isPagedOrderRequest,validServerPage}=require('../r1964-native-paged-route.cjs');
const {patchOrderLive}=require('../live-order-patch.cjs');
test('R1964: native paged Lab orders must never pass through local legacy orders',async()=>{
 const store={get:key=>key==='auth'?{user:1}:key==='labId'?'lab-a':null,set(){throw Error('unexpected_store_write')},db:{exec(){throw Error('unexpected_local_sqlite')}}};
 const req={method:'GET',url:'/api/lab/orders?paged=1&mode=print&stage=ready&page=4'};
 const url=new URL('http://localhost'+req.url);
 assert(isPagedOrderRequest(req,url));
 assert.equal(await localBusinessHost({req,res:{},url,store,offline:false,request:()=>{throw Error('unexpected_legacy_request')}}),false);
 assert.equal(await localBusinessHost({req,res:{},url,store,offline:true}),false);
 assert(!isPagedOrderRequest(req,new URL('http://localhost/api/lab/orders')));
 assert(!isPagedOrderRequest({method:'PATCH'},url));
});
test('R1964: verified count/page response requires all three stage totals',()=>{
 const good={orders:[{id:'a',number:221,customer_name:'Studio',invoice_number:24}],counts:{flow:45,ready:31,completed:19},total:31,page:2,pages:4,pageSize:10};
 assert(validServerPage(JSON.stringify(good)));
 for(const bad of [{orders:good.orders},{...good,counts:{flow:45}}, {...good,page:0},{...good,pages:0},{...good,pageSize:300},{...good,orders:Array.from({length:11},(_,i)=>({id:i}))}]){
  assert.equal(validServerPage(JSON.stringify(bad)),false);
 }
});
test('R1964: a new R1944 bundle with a legacy PB1468 marker retains the paged API/fields',()=>{
 const source='/* PB1468 shared document isolation */ /* PB1944 server-paged lab queue */ const pbLiveOrders=x.useRef({seq:0,active:true}),ye=()=>Me("/api/lab/orders?paged=1&mode="+o).then(data=>{r1944SetCounts(data.counts);r1944SetPages(data.pages);r1944SetTotal(data.total)});const Ye=le=>le.status;';
 const result=patchOrderLive(source);
 for(const name of ['paged=1&mode=','r1944SetCounts','r1944SetPages','r1944SetTotal'])assert(result.includes(name));
 assert(!result.includes("return Me('/api/lab/orders'+(recovery?"));
});
test('R1964: native host cannot cache each timestamped paged URL in SQLite',()=>{
 const s=fs.readFileSync(path.join(__dirname,'..','host.cjs'),'utf8');
 assert(s.includes('R1964_NONCACHE_PAGES'));
 assert(s.includes('paged_orders_contract_invalid'));
 assert(s.includes('R1964_CACHED_FALLBACK_LEGACY_ONLY'));
});
