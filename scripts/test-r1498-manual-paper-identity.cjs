const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {invoiceAction,forwardLiveFinance}=require('../apps/lab-desktop/live-finance.cjs');

test('a selected photo is a separate print row when its paper type changes',()=>{
 const source=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
 const declaration=source.match(/function sameIntakeCopyTarget\([^\n]+\}/)?.[0];
 assert(declaration,'paper-aware photo identity helper is installed');
 const same=new Function(`${declaration};return sameIntakeCopyTarget;`)();
 const luster={hash:'same-photo',paper:'luster'};
 assert.equal(same(luster,{hash:'same-photo',paper:'luster'},false,'luster'),true);
 assert.equal(same(luster,{hash:'same-photo',paper:'metallic'},false,'luster'),false);
 assert.equal(same(luster,{hash:'same-photo',paper:'silk'},false,'luster'),false);
 assert.equal(same(luster,{hash:'same-photo',paper:'metallic'},true,'luster'),true);
});

test('print-ready passes the server missing-tariff response unchanged',async()=>{
 const url='/api/lab/orders/11111111-1111-4111-8111-111111111111';
 const payload={status:'ready'};
 assert.equal(invoiceAction('PATCH',url,payload),true);
 let result,calls=0;
 const handled=await forwardLiveFinance({req:{url,method:'PATCH'},res:{writeHead:status=>result={status},end:body=>result.body=JSON.parse(body)},bytes:Buffer.from(JSON.stringify(payload)),contentType:'application/json',store:{rows:()=>[{state:'pending',url:'/api/lab/prices'}]},request:async()=>{calls++;return new Response(JSON.stringify({error:'invoice_pricing_required',missingSizes:['30×40']}),{status:409})},json:(_,status,body)=>{result={status,body}}});
 assert(handled);assert.equal(calls,1);assert.equal(result.status,409);assert.deepEqual(result.body,{error:'invoice_pricing_required',missingSizes:['30×40']});
});

test('album-ready and explicit price writes use live confirmation too',()=>{
 const id='11111111-1111-4111-8111-111111111111';
 assert.equal(invoiceAction('PUT',`/api/lab/orders/${id}/album-stage`,{stage:'ready'}),true);
 assert.equal(invoiceAction('PUT',`/api/lab/orders/${id}/invoice-pricing`,{price:100}),true);
});

test('queued order edits block invoice generation and offline ready is never queued',async()=>{
 const url='/api/lab/orders/11111111-1111-4111-8111-111111111111',payload={status:'ready'};
 const run=async(offline)=>{let result;await forwardLiveFinance({req:{url,method:'PATCH'},res:{writeHead:status=>result={status},end:body=>result.body=JSON.parse(body)},bytes:Buffer.from(JSON.stringify(payload)),store:{rows:()=>offline?[]:[{state:'pending',url:url+'/print-settings'}]},request:async()=>{if(offline)throw Error('offline');return new Response('{}')},json:(_,status,body)=>{result={status,body}}});return result};
 const pending=await run(false),offline=await run(true);
 assert.equal(pending.body.error,'order_sync_pending');
 assert.equal(offline.status,503);assert.equal(offline.body.error,'invoice_live_connection_required');
});
