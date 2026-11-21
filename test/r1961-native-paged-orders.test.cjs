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

test('pager buttons follow the tab total while the search and summary are always rendered',()=>{
 const toolbar='const tools=(r1944Total)=>[e.jsx("input",{className:"r1944Search"}),e.jsx("span",{className:"r1944PageSummary"}),e.jsxs("div",{className:"r1944Pager",children:[]})];';
 const context={e:{jsx:(_tag,props)=>props.className,jsxs:(_tag,props)=>props.className}};
 const view=vm.runInNewContext(patchOrderLive(source+'\n'+toolbar)+'\ntools',context);
 for(const total of [0,9])assert.deepEqual(Array.from(view(total)),['r1944Search','r1944PageSummary',false]);
 for(const total of [10,11,37])assert.deepEqual(Array.from(view(total)),['r1944Search','r1944PageSummary','r1944Pager']);
});

test('changing only the page poll timestamp reuses the cache and preserves distinct page rows',async()=>{
 const {createHost}=require('../host.cjs');
 const {LabStore}=require('../store.cjs');
 const requests=[],store=new LabStore(':memory:');
 let writes=0,online=true;
 store.set('auth',{});store.set('labId','lab-1');store.set('deviceId','device-1');
 const cache=store.cache.bind(store);
 store.cache=(...args)=>{writes++;return cache(...args);};
 const server=createHost({store,sync:{},token:'test-desktop-token',isOnline:()=>online,request:async url=>{
  requests.push(url);
  const page=new URL(url,'http://localhost').searchParams.get('page');
  return Response.json({orders:[{id:'order-page-'+page}],total:15,pages:2,counts:{flow:15}});
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const origin='http://127.0.0.1:'+server.address().port;
  const read=async (page,stamp)=>{
   const response=await fetch(origin+'/api/lab/orders?paged=1&mode=print&stage=flow&page='+page+'&pbNativeLiveStatus='+stamp,{
    headers:{Cookie:'desktop=test-desktop-token'},
   });
   assert.equal(response.status,200,await response.clone().text());
   return response.json();
  };
  const first=await read(1,100),again=await read(1,200);
  store.set('localBusinessActive:lab-1',true);
  const second=await read(2,300);
  assert.deepEqual(again,first);
  assert.notDeepEqual(second.orders,first.orders);
  assert.equal(writes,2);
  assert(requests[1].endsWith('pbNativeLiveStatus=200'));
  online=false;
  const response=await fetch(origin+'/api/lab/orders?paged=1&page=2',{
   headers:{Cookie:'desktop=test-desktop-token'},
  });
  assert.equal(response.status,503,'allow the renderer to use its legacy offline list with locally created orders');
  assert.equal((await response.json()).error,'online_connection_required');
 }finally{
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
  store.db.close();
 }
});

test('overlapping identical page requests share one upstream read while another tab stays independent',async()=>{
 const {createHost}=require('../host.cjs');
 const {LabStore}=require('../store.cjs');
 const store=new LabStore(':memory:');
 store.set('auth',{});store.set('labId','lab-1');store.set('deviceId','device-1');
 const calls=[];
 let release;
 const pending=new Promise(resolve=>{release=resolve;});
 const phases=new Map();
 const server=createHost({store,sync:{},token:'test',request:async route=>{
  const stage=new URL(route,'http://127.0.0.1').searchParams.get('stage');
  calls.push(stage);phases.get(stage)?.();await pending;
  return Response.json({orders:[{id:stage}],counts:{flow:1,ready:1,completed:0},pages:1,total:1});
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const request=(stage,tag)=>fetch('http://127.0.0.1:'+server.address().port+'/api/lab/orders?paged=1&mode=print&stage='+stage+'&page=1&pbNativeLiveStatus='+tag,{headers:{Cookie:'desktop=test'}});
 try{
  const first=new Promise(resolve=>phases.set('flow',resolve));
  const one=request('flow',1);await first;
  const two=request('flow',2);
  const another=new Promise(resolve=>phases.set('ready',resolve));
  const three=request('ready',3);await another;
  await new Promise(resolve=>setTimeout(resolve,30));
  assert.deepEqual(calls,['flow','ready']);
  release();
  const bodies=await Promise.all([one,two,three].map(async response=>(await response).json()));
  assert.deepEqual(bodies.map(body=>body.orders[0].id),['flow','flow','ready']);
 }finally{
  release();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));store.db.close();
 }
});
