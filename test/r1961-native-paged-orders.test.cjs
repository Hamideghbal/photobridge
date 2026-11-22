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
test('the native paged enhancement also attaches to UI already carrying the legacy document marker',()=>{
 const result=patchOrderLive('/* PB1468 shared document isolation */\n'+source+'\nfunction pb1468BrowserEvents(){}');
 assert.match(result,/PB1961 preserve native Lab server pagination/);
 assert.equal(result.split('function pb1468BrowserEvents').length,2);
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
  server.closeAllConnections?.();
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
  release();server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));store.db.close();
 }
});

test('a prepared first page responds immediately while live and other-account reads still go upstream',async()=>{
 const {createHost}=require('../host.cjs'),{LabStore}=require('../store.cjs');
 const store=new LabStore(':memory:');
 store.set('auth',{user:{id:'first'}});store.set('labId','lab');
 const requests=[];
 const server=createHost({store,token:'test',sync:{},request:async route=>{
  const query=new URL(route,'http://localhost').searchParams;
  const mode=query.get('mode'),user=store.get('auth').user.id;
  requests.push({mode,live:query.has('pbNativeLiveStatus'),user});
  return Response.json({orders:[{id:user+'-'+mode+'-'+requests.length}],total:1,pages:1,counts:{flow:1,ready:0,completed:0}});
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port,headers={Cookie:'desktop=test'};
 const page=(mode,open)=>fetch(origin+'/api/lab/orders?paged=1&mode='+mode+'&stage=flow&page=1&q=&pbNativeLiveStatus=100'+(open?'&pbNativeOpen=1':''),{headers}).then(r=>r.json());
 try{
  assert.equal((await fetch(origin+'/desktop/warm-view?view=print')).status,403);
  assert.equal((await fetch(origin+'/desktop/warm-view?view=archive',{headers})).status,400);
  for(const mode of ['print','album'])assert.equal((await fetch(origin+'/desktop/warm-view?view='+mode,{headers})).status,204);
  assert.equal((await page('print',true)).orders[0].id,'first-print-1');
  assert.equal((await page('album',true)).orders[0].id,'first-album-2');
  assert.deepEqual(requests.map(r=>r.live),[false,false]);
  assert.equal((await page('print',false)).orders[0].id,'first-print-3');
  assert.equal((await page('print',true)).orders[0].id,'first-print-3');
  store.set('auth',{user:{id:'second'}});
  assert.equal((await page('print',true)).orders[0].id,'second-print-4');
  assert.deepEqual(requests.map(r=>r.live),[false,false,true,true]);
 }finally{
  server.closeAllConnections?.();
  await new Promise(resolve=>server.close(resolve));
  store.db.close();
 }
});

test('short search text reaches the server and a default page cannot masquerade as search results',async()=>{
 const {createHost}=require('../host.cjs'),{LabStore}=require('../store.cjs');
 const store=new LabStore(':memory:');
 store.set('auth',{});store.set('labId','A');
 const seen=[];
 const server=createHost({store,token:'test',sync:{},request:async url=>{
  const q=new URL(url,'http://localhost').searchParams.get('q');
  seen.push(q);
  return Response.json({orders:[{id:'one'}],pages:1,total:1,counts:{flow:1},query:q==='ا'?'':q});
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const headers={Cookie:'desktop=test',Connection:'close'},root='http://127.0.0.1:'+server.address().port;
 try{
  const first=await fetch(root+'/api/lab/orders?paged=1&mode=print&q='+encodeURIComponent('ا'),{headers});
  assert.equal(first.status,502);
  assert.equal((await first.json()).error,'invalid_paged_orders');
  for(const q of ['نی','72']){
   const response=await fetch(root+'/api/lab/orders?paged=1&mode=album&q='+encodeURIComponent(q),{headers});
   assert.equal(response.status,200);
   assert.equal((await response.json()).query,q);
  }
  assert.deepEqual(seen,['ا','نی','72']);
 }finally{await new Promise(resolve=>server.close(resolve));store.db.close();}
});

test('a click loads its ten-order page while a warm-up and a poll are blocked',async()=>{
 const {createHost}=require('../host.cjs'),{LabStore}=require('../store.cjs');
 const store=new LabStore(':memory:');
 store.set('auth',{});store.set('labId','A');
 let release,notifyPoll;
 const held=new Promise(resolve=>{release=resolve;});
 const pollStarted=new Promise(resolve=>{notifyPoll=resolve;});
 const seen=[];
 const server=createHost({store,token:'test',sync:{},request:async(route,{signal})=>{
  assert(signal);
  const stamp=new URL(route,'http://localhost').searchParams.get('pbNativeLiveStatus');
  seen.push(stamp);
  if(stamp==='poll')notifyPoll();
  if(stamp!=='click')await held;
  return Response.json({orders:[{id:stamp}],total:1,pages:1,counts:{flow:1}});
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const headers={Cookie:'desktop=test',Connection:'close'},origin='http://127.0.0.1:'+server.address().port;
 const path=origin+'/api/lab/orders?paged=1&mode=print&stage=flow&page=1&q=&pbNativeLiveStatus=';
 let poll;
 try{
  await fetch(origin+'/desktop/warm-view?view=print',{headers});
  poll=fetch(path+'poll',{headers});
  await pollStarted;
  const response=await fetch(path+'click&pbNativeOpen=1',{headers,signal:AbortSignal.timeout(1500)});
  assert.equal(response.status,200);
  assert.equal((await response.json()).orders[0].id,'click');
  assert.deepEqual(seen,[null,'poll','click']);
 }finally{release();if(poll)await poll;await new Promise(resolve=>server.close(resolve));store.db.close();}
});
