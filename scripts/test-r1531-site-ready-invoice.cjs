'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {patchSiteReadyInvoice,marker}=require('./r1531-site-ready-invoice.cjs');
const source=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
function run({mode='print',alreadyReady=false,invoiceRequired=true}={}){
 const le={id:'00000000-0000-4000-8000-000000000001',number:12,invoice_required:invoiceRequired,mode};
 const order={...le,status:alreadyReady?'ready':'printing',document_revision:27,updated_at:'2026-11-01T12:34:56Z',invoice_id:alreadyReady?'invoice-123':null};
 const calls=[],messages=[],invoice={id:'invoice-123',number:99,total:250000};
 const context={
  E:'',pb1450AllowStage:async()=>true,C(){},ye:async()=>{},Gt:async()=>{},P:m=>messages.push(m),alert:m=>messages.push(m),V:String,
  Me:async(path,opts)=>{
   calls.push({path,method:opts?.method||'GET',body:opts?.body?JSON.parse(opts.body):null});
   if(path==='/api/lab/orders/'+le.id&&(!opts||!opts.method))return{order};
   if(path==='/api/lab/invoices')return{invoices:[invoice]};
   if(opts?.method)return{order:{...order,status:'ready'},invoice:invoiceRequired?invoice:null};
   throw Error('unexpected_request');
  },
  Wu:async()=>{throw Error('stop_after_invoice_creation');},ai:()=>false,
  t:{name:'Lab'},Qn:async()=>{},on(){},k(){},b(){},Ef(){},jc(){},FileReader:function(){}
 };
 const a=mode==='album'?source.indexOf(',Cn=async(le,nt)=>'):source.indexOf('un=async le=>');
 const b=mode==='album'?source.indexOf(',aa=async(le,nt)=>',a):source.indexOf(',Cn=async(le,nt)=>',a);
 assert(a>=0&&b>a);
 const prefix=mode==='album'?',Cn=':'un=';
 vm.runInNewContext('globalThis.invoke='+source.slice(a+prefix.length,b),context);
 return context.invoke(le,...(mode==='album'?['ready']:[])).then(()=>({calls,messages}));
}
test('R1531 is website-only, idempotent, and cache-busted',()=>{
 assert(source.includes(marker));
 assert.equal(patchSiteReadyInvoice(source),source);
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('&siteInvoice=r1531'));
 const pipeline=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(pipeline.indexOf('enable-r1531-site-ready-invoice.mjs')>pipeline.indexOf('verify-lab-desktop-ui-freshness.mjs'));
});
test('new print invoice includes latest concurrency revision',async()=>{
 const {calls}=await run();assert.deepEqual(calls.slice(0,2).map(c=>c.method),['GET','PATCH']);
 assert.deepEqual(calls[1].body,{status:'ready',expectedRevision:27,expectedUpdatedAt:'2026-11-01T12:34:56Z'});
});
test('already-ready print invoice uses the existing invoice without another mutation',async()=>{
 const {calls}=await run({alreadyReady:true});
 assert.deepEqual(calls.map(c=>c.method),['GET','GET']);assert.equal(calls[1].path,'/api/lab/invoices');
});
test('already-ready invoice-free order does not issue a new invoice',async()=>{
 const {calls}=await run({alreadyReady:true,invoiceRequired:false});
 assert.deepEqual(calls.map(c=>c.method),['GET']);
});
test('album ready invoice uses revision precondition',async()=>{
 const {calls}=await run({mode:'album'});const changed=calls.find(c=>c.method==='PUT');
 assert(changed);assert.deepEqual(changed.body,{stage:'ready',expectedRevision:27,expectedUpdatedAt:'2026-11-01T12:34:56Z'});
});
test('already-ready album does not duplicate its invoice',async()=>{
 const {calls}=await run({mode:'album',alreadyReady:true});
 assert.deepEqual(calls.map(c=>c.method),['GET','GET']);
});
