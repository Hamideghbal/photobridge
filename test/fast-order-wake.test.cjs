'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createFastOrderWake}=require('../fast-order-wake.cjs');
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
test('native order notification queues immediately even before the web worker registers',()=>{
 let account='lab-1';const sent=[];
 const wake=createFastOrderWake({getAccount:()=>account,send:x=>sent.push(x),now:()=>123456});
 assert.equal(wake.notify('lab-1',A),true);
 assert.equal(wake.notify('lab-1',A),true);
 assert.equal(wake.pending(),1);assert.equal(sent.length,0);
 wake.ready();assert.equal(sent.length,1);assert.deepEqual(sent[0],{labId:'lab-1',orderId:A,notifiedAt:123456});
 assert.equal(wake.pending(),0);
 assert.equal(wake.notify('lab-1',B),true);assert.equal(sent.length,2);
});
test('never send another account order, and reject malformed notification IDs',()=>{
 let account='lab-1';const sent=[];
 const wake=createFastOrderWake({getAccount:()=>account,send:x=>sent.push(x)});
 assert.equal(wake.notify('lab-2',A),false);
 assert.equal(wake.notify('lab-1','../../../order'),false);
 wake.notify('lab-1',A);
 account='lab-2';wake.ready();assert.equal(sent.length,0);assert.equal(wake.pending(),0);
 wake.reset();wake.notify('lab-2',B);wake.clear();wake.ready();assert.equal(sent.length,0);
});
test('temporary renderer send failure retains notification until next ready handshake',()=>{
 let fail=true;const sent=[];
 const wake=createFastOrderWake({getAccount:()=>'lab-1',send:value=>{if(fail)throw Error('not_loaded');sent.push(value)}});
 wake.ready();wake.notify('lab-1',A);assert.equal(wake.pending(),1);
 fail=false;wake.ready();assert.equal(wake.pending(),0);assert.equal(sent.length,1);
});
test('real native source wires exact order metadata to ready-gated IPC',()=>{
 const fs=require('node:fs');
 const main=fs.readFileSync(require('node:path').join(__dirname,'..','main.cjs'),'utf8');
 const preload=fs.readFileSync(require('node:path').join(__dirname,'..','main-preload.cjs'),'utf8');
 assert(main.includes('onOrderNotice:(account,items)=>orderDispatch.accept(account,items)'));
 assert(main.includes('orderDispatch.accept(account,message?.items||[])'));
 assert(main.includes("ipcMain.on('lab-fast-order-ready'"));
 assert(preload.includes("ipcRenderer.on('lab-order-arrived'"));
 assert(preload.includes("ipcRenderer.send('lab-fast-order-ready')"));
});
