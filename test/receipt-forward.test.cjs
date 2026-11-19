'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{forwardReceipt}=require('../receipt-forward.cjs');
const url={pathname:'/api/lab/orders/12ab-34cd/download-receipt/download'};
function harness({status=200,data={order:{downloaded_at:'2026-11-19T00:00:00Z'},verifiedFiles:2},offline=false}={}){
 let account='A',calls=0,reply,options;
 const store={get:key=>key==='labId'?account:key==='deviceId'?'D1':{id:'auth'}},
 json=(_res,code,body)=>{reply={code,body}},
 request=async(_path,o)=>{calls++;options=o;return {ok:status>=200&&status<300,status,json:async()=>data}};
 const run=()=>forwardReceipt({req:{method:'POST',url:'/api/lab/orders/12ab-34cd/download-receipt/download'},res:{},url,bytes:Buffer.from('{}'),
 contentType:'application/json',store,request,offline:()=>offline,json,enabled:true});
 return {run,get reply(){return reply},get calls(){return calls},get options(){return options},switchAccount:()=>{account='B'}};
}
test('candidate receipt always passes server validation live and requests invoice-free option',async()=>{
 const h=harness();assert.equal(await h.run(),true);assert.equal(h.calls,1);
 assert.equal(h.reply.code,200);
 assert.equal(h.options.headers['x-photobridge-receipt-only'],'1');
});
test('offline and queued responses never claim verified receipt',async()=>{
 let h=harness({offline:true});await h.run();assert.equal(h.calls,0);assert.equal(h.reply.code,503);
 h=harness({status:202,data:{desktopPending:true}});await h.run();assert.equal(h.reply.code,503);
 h=harness({status:200,data:{order:{downloaded_at:null},verifiedFiles:2}});await h.run();assert.equal(h.reply.code,502);
});
test('account switch rejects late receipt response; older hosts do not opt in',async()=>{
 const h=harness();const before=await forwardReceipt({req:{method:'POST'},url,enabled:false});assert.equal(before,false);
 h.switchAccount(); // a new account is isolated before sending
 assert.equal(await h.run(),true);assert.equal(h.reply.code,200);
 let resolve;const pending=new Promise(r=>resolve=r);let account='A',result;
 const job=forwardReceipt({req:{method:'POST',url: url.pathname},res:{},url,bytes:Buffer.from('{}'),contentType:'application/json',enabled:true,offline:()=>false,
  store:{get:k=>k==='labId'?account:k==='deviceId'?'D':true},
  request:()=>pending,json:(_res,code,data)=>{result={code,data}}});
 account='B';resolve({ok:true,status:200,json:async()=>({order:{downloaded_at:'x'},verifiedFiles:2})});
 await job;assert.equal(result.code,401);
});
