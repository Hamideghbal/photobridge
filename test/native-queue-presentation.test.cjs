'use strict';

const assert=require('node:assert/strict');
const {test}=require('node:test');
const vm=require('node:vm');
const {patchNativeQueuePresentation,removeConfirmedOrderExitWait}=require('../native-queue-presentation.cjs');

const queue=`function Uf(t,o,T,r1944Page,r1944DebouncedQuery){
 /* PB1944 server-paged lab queue */
 const pbLiveOrders=x.useRef({seq:0,active:true}),ye=()=>{
  const seq=++pbLiveOrders.current.seq;
  const query=String(r1944DebouncedQuery||"").trim();
  const uri="/api/lab/orders?paged=1&mode="+o+"&stage="+T+"&page="+r1944Page+"&q="+encodeURIComponent(query)+"&pbNativeLiveStatus="+Date.now();
  return Me(uri).then(data=>{
   if(!pbLiveOrders.current.active||seq!==pbLiveOrders.current.seq)return;
   f(data.orders);
   r1944SetCounts(old=>old);
  }).catch(()=>{
   if(seq===pbLiveOrders.current.seq)r1944SetError("failed");
  });
 };
 const Be=rows,Nt=rows;
 return {load:ye,view:e.jsx("div",{children:Be.length?Nt.map(row=>row.id):"empty"})};
}`;
test('both modes and page transitions render placeholders until the matching response arrives',async()=>{
 let state=null, rows=[];
 const requests=[], ref={current:{seq:0,active:true}};
 const render=vm.runInNewContext(patchNativeQueuePresentation(queue)+'\nUf',{
  x:{useState:()=>[state,apply=>{state=typeof apply==="function"?apply(state):apply;}],useRef:value=>typeof value==="string"?{current:value}:ref},
  e:{jsx:(_type,props)=>props,jsxs:(_type,props)=>props},
  get rows(){return rows;},
  f:value=>{rows=value;},
  Me:key=>new Promise((resolve,reject)=>requests.push({key,resolve,reject})),
  r1944SetCounts(){},r1944SetError(){},
 });
 const show=(mode,page,lab='lab')=>render({id:lab},mode,'flow',page,'');
 const placeholders=view=>{assert.equal(view['aria-busy'],true);assert.equal(view.children.length,6);
  for(const card of view.children){assert.match(card.className,/pbNativeQueueSkeleton.*labOrderCard/);assert.equal(card['aria-hidden'],true);}};
 placeholders(show('print',1).view);
 assert.deepEqual(show('print',1).view.children,show('album',1).view.children);
 const a=show('print',1).load();
 const b=show('album',1).load();
 assert(requests[0].key.includes('mode=print&stage=flow&page=1'));
 assert(requests[0].key.endsWith('&pbNativeOpen=1'));
 assert(requests[1].key.endsWith('&pbNativeOpen=1'));
 requests[0].resolve({orders:[{id:'old-print'}]});
 await a;
 placeholders(show('album',1).view);
 requests[1].resolve({orders:[{id:'album-one'}]});
 await b;
 assert.equal(show('album',1).view.children[0],'album-one');
 placeholders(show('album',2).view);
 placeholders(show('album',1,'other').view);
 const c=show('album',2).load();
 assert(requests[2].key.endsWith('&pbNativeOpen=1'));
 requests[2].resolve({orders:[]});
 await c;
 assert.equal(show('album',2).view.children,'empty');
 const d=show('album',3).load();
 requests[3].reject(Error('unavailable'));
 await d;
 assert.equal(show('album',3).view.children.className,'pbNativeQueueError');
 const retry=show('album',3).view.children.children[1];
 retry.onClick();
 placeholders(show('album',3).view);
 requests[4].resolve({orders:[{id:'retried'}]});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(show('album',3).view.children[0],'retried');
});

test('an order change waits for confirmation but does not wait for the exit animation',async()=>{
 let reply;
 const flow=vm.runInNewContext(removeConfirmedOrderExitWait(`(async(le,nt,T)=>{
   const Mt=await send();
   if(Mt.order){await window.pb1631ExitOrder?.(le.id,nt,T);update(Mt.order);}
 })`),{
  send:()=>new Promise(resolve=>{reply=resolve;}),
  window:{pb1631ExitOrder:()=>assert.fail('visual transition delayed confirmed state')},
  update:order=>updates.push(order.id),
 });
 const updates=[], flight=flow({id:'order'},'ready','flow');
 assert.deepEqual(updates,[]);
 reply({order:{id:'order'}});
 await flight;
 assert.deepEqual(updates,['order']);
});


test('confirmed moves close the gap on the current page without removing an unconfirmed or same-tab card',async()=>{
 for(const [T,status,expected] of [['flow','ready',['other']],['ready','ready',['order','other']],['flow','printing',['order','other']]]){
  let rows=[{id:'order'},{id:'other'}],animations=0;
  const source=`(async(le,nt,T)=>{
   const result=await send();
   if(result.order){await window.pb1631ExitOrder?.(le.id,nt,T);f(rows=>rows.map(row=>row.id===le.id?{...row,...result.order}:row));}
  })`;
  const run=vm.runInNewContext(removeConfirmedOrderExitWait(source),{
   send:async()=>({order:{id:'order',status}}),
   window:{pb1631ExitOrder:()=>{animations++;return new Promise(()=>{});}},
   f:apply=>{rows=apply(rows);},
  });
  await run({id:'order'},'ready',T);
  assert.deepEqual(rows.map(row=>row.id),expected);
  assert.equal(animations,expected.length===1?1:0);
 }
});

test('one- and two-character queries keep their value and Persian numbers use the server format',()=>{
 const {normalizeQueueSearch}=require('../native-queue-presentation.cjs');
 assert.deepEqual(['ع','عل','علی',' ۹ ','٩٨','۹۸۷'].map(normalizeQueueSearch),['ع','عل','علی','9','98','987']);
 const input=queue.replace('return Me([o,T,r1944Page])',
  'const query=String(r1944DebouncedQuery||"").trim();return Me([o,T,r1944Page,query])')
  .replace('const Be=', 'const update=()=>window.setTimeout(()=>r1944SetDebouncedQuery(String(r1944Query||"")),270);const Be=');
 const patched=patchNativeQueuePresentation(input);
 assert.match(patched,/const query=pbNativeRequestQuery/);
 assert.match(patched,/r1944SetDebouncedQuery\(pbNativeQueueSearch\(r1944Query\)\),110/);
 new vm.Script(patched);
});
