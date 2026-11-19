'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {signalOrderEvent}=require('../realtime-order-wake.cjs');
test('new order signal reaches renderer even if sync.live never settles',async()=>{
 let account='lab-1',messages=0,wakes=0,polls=0;
 const never=new Promise(()=>{});
 const started=Date.now();
 assert.equal(signalOrderEvent({account:'lab-1',getAccount:()=>account,
  notify:()=>{messages++},wake:()=>{wakes++},poll:()=>{polls++;return never},live:()=>never}),true);
 assert.equal(messages,1);assert.equal(wakes,1);assert.equal(polls,1);
 assert(Date.now()-started<100,'a blocked sync must not delay renderer wake');
 account='lab-2';
 assert.equal(signalOrderEvent({account:'lab-1',getAccount:()=>account,
  notify:()=>{messages++},wake:()=>{wakes++},poll:()=>{polls++},live:()=>never}),false);
 assert.equal(messages,1);assert.equal(wakes,1);
});
test('sync failure never turns an order event into rejected delivery',async()=>{
 let calls=0;
 assert.equal(signalOrderEvent({account:'a',getAccount:()=>'a',notify:()=>calls++,
  wake:()=>{throw Error('offline')},poll:()=>Promise.reject(Error('timeout')),live:()=>Promise.reject(Error('sync'))}),true);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls,1);
});
