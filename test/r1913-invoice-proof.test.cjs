'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createInvoiceProof}=require('../invoice-proof.cjs');
const {AlertWindow}=require('../alert-window.cjs');
const id='11111111-2222-4333-8444-555555555555';
test('R1913: invoice proof requires the same authenticated order and real issuance fields',async()=>{
 const getAccount=()=> 'lab-a';
 const issued={order:{id,invoice_id:'66666666-7777-4888-8999-000000000000',invoice_issued_at:'2026-11-19T15:00:00Z'}};
 const proof=createInvoiceProof({getAccount,request:async()=>({ok:true,json:async()=>issued})});
 assert.equal(await proof({account:'lab-a',orderId:id}),true);
 assert.equal(await proof({account:'another-lab',orderId:id}),false);
 assert.equal(await proof({account:'lab-a',orderId:'bad'}),false);
 issued.order.id='99999999-8888-4777-8666-555555555555';
 assert.equal(await proof({account:'lab-a',orderId:id}),false);
 issued.order.id=id;delete issued.order.invoice_issued_at;
 assert.equal(await proof({account:'lab-a',orderId:id}),false);
});
test('R1913: a completed download is not a proof; verified invoice upgrades its ORIGINAL status',async()=>{
 const data=new Map(),store={get:k=>data.get(k),set:(k,v)=>data.set(k,v)};
 let confirmed=false;
 const alert=new AlertWindow({ipcMain:{handle(){}},BrowserWindow:function(){},store,getAccount:()=> 'lab-a',open:async()=>{},
  verifyInvoice:async()=>confirmed});
 alert.updateDownload({orderId:id,number:'42',phase:'complete',downloadVerified:true,stage:'download'},'lab-a');
 assert.equal(alert.downloads.get(id).invoiceIssued,false);
 assert.equal(data.get('labAlertVerifiedCompleted:lab-a'),undefined);
 // Already running asynchronous check; confirmation can happen on the subsequent
 // real invoice_issued event, or after the bounded proof-poll retries.
 alert.updateDownload({orderId:id,number:'42',phase:'invoice_issued',stage:'invoice',downloadVerified:true},'lab-a');
 alert.updateDownload({orderId:id,number:'42',phase:'complete',stage:'invoice',downloadVerified:true},'lab-a');
 assert.equal(alert.downloads.get(id).invoiceIssued,true);
 assert.equal(data.get('labAlertVerifiedCompleted:lab-a')?.[0]?.orderId,id);
});
test('R1913: read-only invoice proof failures cannot turn a pending invoice into success',async()=>{
 const proof=createInvoiceProof({getAccount:()=> 'lab-a',request:async()=>{throw Error('offline')}});
 assert.equal(await proof({account:'lab-a',orderId:id}),false);
});
