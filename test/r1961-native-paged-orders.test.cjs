'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {patchOrderLive}=require('../live-order-patch.cjs');
const source=`function Uf(){
/* PB1944 server-paged lab queue */
const pbLiveOrders=x.useRef({seq:0,active:true}),ye=()=>Me("/api/lab/orders?paged=1&mode="+o+"&stage="+T+"&page="+r1944Page).then(data=>{
 f(data.orders);r1944SetCounts(data.counts);r1944SetPages(data.pages);r1944SetTotal(data.total);
});
const Ye=le=>le.status;
const stage=JSON.stringify({status:nt,note:xt||null});
const invoice=JSON.stringify({stage:nt});
return ye;
}`;
test('R1961 native keeps the real paged route, total pages and three status counts',()=>{
 const result=patchOrderLive(source);
 assert.match(result,/PB1961 preserve native Lab server pagination/);
 for(const tag of ['paged=1&mode=','r1944SetCounts(data.counts)','r1944SetPages(data.pages)','r1944SetTotal(data.total)'])
  assert(result.includes(tag),'native patch removed '+tag);
 assert(!result.includes("return Me('/api/lab/orders'+(recovery?"),'legacy full-order replacement was injected');
 new vm.Script(result);
});
test('R1961 retains document concurrency guards and finance browser listeners',()=>{
 const result=patchOrderLive(source);
 assert(result.includes('expectedUpdatedAt:le.updated_at'));
 assert(result.includes('expectedRevision:le.document_revision'));
 assert(result.includes('function pb1468BrowserEvents'));
});
test('R1961 fails closed on a malformed paged bundle, not a silent one-page list',()=>{
 assert.throws(()=>patchOrderLive('/* PB1944 server-paged lab queue */ const pbLiveOrders=x.useRef({}),ye=()=>0;const Ye=le=>le;'),/native_paged_order_contract_missing/);
});

test('native paged queue uses the returned rows, counts and page totals on the requested page',async()=>{
 const data={orders:[{id:'page-two-order'}],counts:{new:13,downloaded:5,ready:2},pages:3,total:20};
 const requests=[],state={};
 const context={
  x:{useRef:value=>({current:value})},o:'print',T:'flow',r1944Page:2,nt:'ready',xt:'',le:{},
  Me:async url=>{requests.push(url);return data;},
  f:rows=>{state.orders=rows;},r1944SetCounts:counts=>{state.counts=counts;},
  r1944SetPages:pages=>{state.pages=pages;},r1944SetTotal:total=>{state.total=total;},
 };
 await vm.runInNewContext(patchOrderLive(source)+'\nUf()()',context);
 assert.deepEqual(requests,['/api/lab/orders?paged=1&mode=print&stage=flow&page=2']);
 assert.deepEqual(state,data);
});
