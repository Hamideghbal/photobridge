'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseFreshOrderId,parseFreshOrderNotice,subscribeLabEvents}=require('../lab-realtime.cjs');
const {createOrderAlertDispatch}=require('../order-alert-dispatch.cjs');
const ID='11111111-2222-4333-8444-555555555555';
const now=Date.parse('2026-11-19T17:00:00Z');
const packet=(data)=>'event: order_submitted\ndata: '+JSON.stringify(data)+'\n\n';
test('R1915: fresh numbered SSE notice is accepted before notification polling; other labs and stale data are rejected',()=>{
 const notice={type:'order_submitted',labId:'lab-a',orderNumber:'۴۲',createdAt:new Date(now).toISOString()};
 const parsed=parseFreshOrderNotice(packet(notice),'lab-a',now);
 assert.deepEqual(parsed,{orderId:null,orderNumber:'42',createdAt:notice.createdAt});
 assert.equal(parseFreshOrderId(packet(notice),'lab-a',now),null);
 assert.equal(parseFreshOrderNotice(packet(notice),'lab-other',now),null);
 assert.equal(parseFreshOrderNotice(packet({...notice,type:'invoice_issued'}),'lab-a',now),null);
 assert.equal(parseFreshOrderNotice(packet({...notice,createdAt:new Date(now-11*60*1000).toISOString()}),'lab-a',now),null);
 assert.equal(parseFreshOrderNotice(packet({...notice,orderNumber:'not-a-number'}),'lab-a',now),null);
});
test('R1915: numeric SSE dispatch fetches exact lab order before stalled generic refresh, without crossing lab',async()=>{
 let called=false,refresh=false;const sent=[];
 const dispatcher=createOrderAlertDispatch({getAccount:()=> 'lab-a',now:()=>now,
  deliver:(account,id)=>sent.push({account,id}),
  request:async pathname=>{called=true;assert.equal(pathname,'/api/lab/orders');return {ok:true,json:async()=>({orders:[{id:ID,number:42,lab_id:'lab-a',status:'sent'}]})}}});
 let first=true;
 const body={getReader:()=>({read:async()=>first?(first=false,{done:false,value:Buffer.from(packet({type:'order_submitted',labId:'lab-a',orderNumber:42,createdAt:new Date(now).toISOString()}))}):new Promise(()=>{}),
  cancel:async()=>{}})};
 const sub=subscribeLabEvents({
  request:async()=>({ok:true,body}),getAccount:()=> 'lab-a',
  onOrderNotice:(notice,account)=>{
   dispatcher.accept(account,[{event_key:'order_submitted',order_number:notice.orderNumber,created_at:notice.createdAt}]);
  },
  onEvent:async()=>{refresh=true;await new Promise(()=>{})},
  onOrderId:()=>{throw Error('incorrect exact-id path')}
 });
 for(let i=0;i<40&&!sent.length;i++)await new Promise(resolve=>setTimeout(resolve,5));
 sub.stop();dispatcher.reset();
 assert(called,'must start lookup without waiting for notification poll');
 assert(refresh,'normal fallback still receives the event');
 assert.deepEqual(sent,[{account:'lab-a',id:ID}]);
});
