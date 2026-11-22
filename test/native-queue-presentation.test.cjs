'use strict';

const assert=require('node:assert/strict');
const {test}=require('node:test');
const vm=require('node:vm');
const {patchNativeQueuePresentation,removeConfirmedOrderExitWait}=require('../native-queue-presentation.cjs');

const queue=`function Uf(t,o,T,r1944Page,r1944DebouncedQuery){
 /* PB1944 server-paged lab queue */
 const pbLiveOrders=x.useRef({seq:0,active:true}),ye=()=>{
  const seq=++pbLiveOrders.current.seq;
  return Me([o,T,r1944Page]).then(data=>{
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
  x:{useState:()=>[state,apply=>{state=apply(state);}],useRef:()=>ref},
  e:{jsx:(_type,props)=>props,jsxs:(_type,props)=>props},
  get rows(){return rows;},
  f:value=>{rows=value;},
  Me:key=>new Promise((resolve,reject)=>requests.push({key,resolve,reject})),
  r1944SetCounts(){},r1944SetError(){},
 });
 const show=(mode,page,lab='lab')=>render({id:lab},mode,'flow',page,'');
 const placeholders=view=>{assert.equal(view['aria-busy'],true);assert.equal(view.children.children.length,6);};
 placeholders(show('print',1).view);
 const a=show('print',1).load();
 const b=show('album',1).load();
 requests[0].resolve({orders:[{id:'old-print'}]});
 await a;
 placeholders(show('album',1).view);
 requests[1].resolve({orders:[{id:'album-one'}]});
 await b;
 assert.equal(show('album',1).view.children[0],'album-one');
 placeholders(show('album',2).view);
 placeholders(show('album',1,'other').view);
 const c=show('album',2).load();
 requests[2].resolve({orders:[]});
 await c;
 assert.equal(show('album',2).view.children,'empty');
 const d=show('album',3).load();
 requests[3].reject(Error('unavailable'));
 await d;
 assert.equal(show('album',3).view.children,null);
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
