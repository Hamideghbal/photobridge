'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {AlertWindow}=require('../alert-window.cjs');
const {decoratePending,recordVerifiedStages}=require('../alert-order-status.cjs');
const ID='11111111-2222-4333-8444-555555555555';
const OTHER='22222222-3333-4444-8555-666666666666';
const alert={id:'notice-one',orderAlert:true,orderId:ID,orderNumber:'42',title:'سفارش جدید',created_at:'2026-11-19T15:00:00Z'};
function fixture(){
 const map=new Map(),store={get:k=>map.get(k),set:(k,v)=>map.set(k,JSON.parse(JSON.stringify(v)))};
 store.set('nativeAlertsPending:lab-a',[alert]);
 const aw=new AlertWindow({BrowserWindow:function(){},ipcMain:{handle(){}},store,getAccount:()=> 'lab-a',open:async()=>{}});
 return {map,store,aw};
}
test('R1915: each independently verified stage survives progress eviction and a minute of alert refreshes',()=>{
 const {store,aw}=fixture();
 aw.updateDownload({orderId:ID,number:'42',phase:'verified',downloadVerified:true},'lab-a');
 let item=store.get('nativeAlertsPending:lab-a')[0];
 assert.equal(item.downloadVerified,true);
 assert.notEqual(item.invoiceIssued,true,'download alone must not verify invoice');
 aw.updateDownload({orderId:ID,number:'42',phase:'invoice_issued',downloadVerified:true},'lab-a');
 item=store.get('nativeAlertsPending:lab-a')[0];
 assert.equal(item.downloadVerified,true);
 assert.equal(item.invoiceIssued,true);
 assert.equal(item.completionNote,undefined,'issuance is not proof that PDF/printing are complete');
 aw.downloads.clear();
 const later=Date.now()+65_000;
 item=decoratePending(store,'lab-a',[alert],later)[0];
 assert.equal(item.downloadVerified,true);
 assert.equal(item.invoiceIssued,true);
 assert.equal(decoratePending(store,'lab-b',[alert],later)[0].invoiceIssued,undefined,'never share lab status');
});
test('R1915: verified stages persist after the actual completion and never regress on late download progress',()=>{
 const {store,aw}=fixture();
 aw.updateDownload({orderId:ID,number:'42',phase:'invoice_issued',downloadVerified:true},'lab-a');
 aw.updateDownload({orderId:ID,number:'42',phase:'complete',downloadVerified:true,invoiceIssued:true},'lab-a');
 aw.updateDownload({orderId:ID,number:'42',phase:'downloading',downloadVerified:false},'lab-a');
 assert.equal(aw.downloads.get(ID).phase,'complete');
 assert.equal(aw.downloads.get(ID).invoiceIssued,true);
 const item=store.get('nativeAlertsPending:lab-a')[0];
 assert.equal(item.downloadVerified,true);
 assert.equal(item.invoiceIssued,true);
 assert.match(item.completionNote,/دانلود/);
});
test('R1915: archived/nonspecific notices cannot get another order invoice check',()=>{
 const {store}=fixture();
 recordVerifiedStages(store,'lab-a',{orderId:ID,number:'42',downloadVerified:true,invoiceIssued:true});
 assert.equal(decoratePending(store,'lab-a',[{...alert,orderId:OTHER}],Date.now())[0].invoiceIssued,undefined);
 const numberOnly={...alert,orderId:null};
 recordVerifiedStages(store,'lab-a',{orderId:OTHER,number:'42',downloadVerified:true,invoiceIssued:true});
 assert.equal(decoratePending(store,'lab-a',[numberOnly],Date.now())[0].invoiceIssued,undefined,'ambiguous order number cannot cross-correlate');
});
