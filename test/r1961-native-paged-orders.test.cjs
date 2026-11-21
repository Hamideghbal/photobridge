'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {patchOrderLive}=require('../live-order-patch.cjs');
const source=`function Uf(){
/* PB1944 server-paged lab queue */
const pbLiveOrders=x.useRef({seq:0,active:true}),ye=()=>Me("/api/lab/orders?paged=1&mode="+o+"&stage="+T+"&page="+r1944Page).then(data=>{
 r1944SetCounts(data.counts);r1944SetPages(data.pages);r1944SetTotal(data.total);
});
const Ye=le=>le.status;
const stage=JSON.stringify({status:nt,note:xt||null});
const invoice=JSON.stringify({stage:nt});
return Ye;
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
