'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseFreshOrderId,subscribeLabEvents}=require('../lab-realtime.cjs');
const id='11111111-2222-4333-8444-555555555555',now=Date.parse('2026-11-19T16:00:00Z');
const frame=(data,name='order_submitted')=>'event: '+name+'\ndata: '+JSON.stringify(data)+'\n\n';
test('R1913: only an authenticated, fresh exact new-order UUID can bypass slow list discovery',()=>{
 const n={type:'order_submitted',orderId:id,labId:'lab-a',createdAt:new Date(now).toISOString()};
 assert.equal(parseFreshOrderId(frame(n),'lab-a',now),id);
 assert.equal(parseFreshOrderId(frame(n),'lab-b',now),null);
 assert.equal(parseFreshOrderId(frame({...n,type:'invoice_issued'}),'lab-a',now),null);
 assert.equal(parseFreshOrderId(frame({...n,orderId:'invalid'}),'lab-a',now),null);
 assert.equal(parseFreshOrderId(frame({...n,createdAt:new Date(now-11*60000).toISOString()}),'lab-a',now),null);
 assert.equal(parseFreshOrderId('data: {"type":"order_submitted","orderId":','lab-a',now),null);
});
test('R1913: real SSE reader dispatches UUID BEFORE a stalled notification/sync callback',async()=>{
 let readOnce=false,firstWake=null,onEventStarted=false;
 const body={getReader:()=>({async read(){
  if(!readOnce){readOnce=true;return {done:false,value:Buffer.from(frame({type:'new_order',orderId:id,labId:'lab-a'}))}}
  return new Promise(()=>{});
 },async cancel(){}})};
 const sub=subscribeLabEvents({request:async()=>({ok:true,body}),getAccount:()=> 'lab-a',
  onOrderId:orderId=>{firstWake=orderId},onEvent:async()=>{onEventStarted=true;await new Promise(()=>{})},retryMs:900000});
 for(let i=0;i<50&&!firstWake;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(firstWake,id,'download wake must not wait for unrelated sync');
 assert.equal(onEventStarted,true);
 sub.stop();
});
