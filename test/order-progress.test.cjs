'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {normalizeProgress,installOrderProgress}=require('../order-progress.cjs');
test('progress is measured from bytes, never reports completion until verified, and rejects invalid phases',()=>{
 assert.equal(normalizeProgress({orderId:'order-1',phase:'downloading',loadedBytes:200,totalBytes:200}).percent,99);
 assert.equal(normalizeProgress({orderId:'order-1',phase:'downloading',loadedBytes:50,totalBytes:200}).percent,25);
 assert.equal(normalizeProgress({orderId:'order-1',phase:'verified'}).percent,100);
 assert.throws(()=>normalizeProgress({orderId:'../escape',phase:'downloading'}));assert.throws(()=>normalizeProgress({orderId:'order-1',phase:'invoice_paid'}));
});
test('progress IPC accepts only the authenticated main frame and current laboratory',()=>{
 let handler,account='A',updates=[];const frame={url:'http://127.0.0.1:43761/lab/orders'},contents={mainFrame:frame},win={webContents:contents,isDestroyed:()=>false};
 installOrderProgress({ipcMain:{handle:(name,fn)=>handler=fn},getWindow:()=>win,getAccount:()=>account,getOrigin:()=> 'http://127.0.0.1:43761',update:(...args)=>updates.push(args)});
 const event={sender:contents,senderFrame:frame},value={labId:'A',orderId:'order-1',phase:'downloading',done:1,total:2};handler(event,value);assert.equal(updates[0][0].percent,50);
 assert.throws(()=>handler({...event,senderFrame:{url:frame.url}},value),/invalid_sender/);assert.throws(()=>handler(event,{...value,labId:'B'}),/account_changed/);account=null;assert.throws(()=>handler(event,value),/account_changed/);assert.equal(updates.length,1);
});
test('notification progress is bounded, isolated by lab and cleared on dismissal',()=>{
 const {AlertWindow}=require('../alert-window.cjs');let account='A';const controller=new AlertWindow({ipcMain:{handle(){}},store:{get(){return null},set(){}},getAccount:()=>account});
 for(let i=0;i<25;i++)controller.updateDownload({orderId:'order-'+i,phase:'downloading',percent:25},'A');assert.equal(controller.state().downloads.length,20);
 account='B';assert.equal(controller.state().downloads.length,0);controller.updateDownload({orderId:'old'},'A');assert.equal(controller.state().downloads.length,0);controller.updateDownload({orderId:'new'},'B');assert.equal(controller.state().downloads[0].orderId,'new');controller.dismiss();assert.equal(controller.state().downloads.length,0);
});
