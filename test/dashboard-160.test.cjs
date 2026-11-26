'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
test('first finance paint has a separate dashboard-only route and does not launch secondary reads',()=>{
 const host=read('local-business-host.cjs'),start=host.indexOf("['dashboard','customers'].includes(url.searchParams.get('pbNativeOverview'))"),end=host.indexOf("if(!offline&&req.method",start),body=host.slice(start,end);
 assert(start>=0&&end>start);assert(body.includes('summary:result.summary'));assert(!body.includes('void refreshFinance('));assert(!body.includes('await refreshFinance('));
 const renderer=read('finance-dashboard-160.cjs');assert(renderer.includes('pb160Ready.overview'));assert(renderer.includes('pb160Load(name,false)'));assert(renderer.includes('pb160Photographers'));assert(!read('desktop-overlay.js').includes('setInterval(keepOrderViewsWarm'));
});
test('transient order read failures retain skeleton cards, without retry buttons or false empty list',()=>{
 const queue=read('native-queue-presentation.cjs');assert(queue.includes('||!pbNativePageResult?.ok'));assert(!queue.includes('const failurePanel='));assert(queue.includes('children:pbNativePageLoading?${skeleton}:Be.length?Nt.map('));assert(queue.includes('setInterval(()=>{if(document.hasFocus())void refresh();},3000)'));
});
test('offline detail prefetch is interruptible by visible requests, with one worker',async()=>{
 const {prepareOfflineData}=require('../prepare-offline-data.cjs');let calls=0,allowed=true;
 const cached={body:Buffer.from(JSON.stringify({customers:[{id:'one'},{id:'two'}]})).toString('base64')};
 const store={get:k=>k==='labId'?'a':{user:'a'},cached:k=>k==='/api/lab/finance/summary'?cached:null,cache:()=>{}};
 await prepareOfflineData(store,async()=>{calls++;allowed=false;return Response.json({rows:[]})},{canContinue:()=>allowed});
 assert.equal(calls,1);
});

test('customer picker has a snapshot-first path distinct from reconciliation',()=>{const s=read('finance-dashboard-160.cjs');assert(s.includes('name===\\\"customers\\\"?\\\"customers\\\":\\\"live\\\"'));assert(s.includes('pb160Load(\\\"customers\\\",false)'));assert(s.includes('pb160Load(\\\"reconcile\\\",true)'));});
