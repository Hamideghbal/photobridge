'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {submit}=require('./test-r1796-print-submit-terms.cjs');
test('R1799 ledger goods invoice is returned during checkout, before any packing click',async()=>{
 const r=await submit({pure:true});if(r.error)throw r.error;
 assert.equal(r.response.status,200);assert.equal(r.invoiceCount,1);assert.equal(r.response.body.invoice.id,'invoice');assert.equal(r.saved.status,'sent');
 for(const opts of [{pure:false},{pure:true,missingPrice:true},{pure:true,exempt:true}]){const r=await submit(opts);if(r.error)throw r.error;assert.equal(r.invoiceCount,0)}
 const prepaid=await submit({pure:true,live:'prepaid'});if(prepaid.error)throw prepaid.error;assert.equal(prepaid.invoiceCount,1);assert.equal(prepaid.saved.payment_status,'awaiting_receipt');
});
const worker=fs.readFileSync('scripts/r1799-product-worker.js.txt','utf8');
function harness({failPrint=false,unpriced=false}={}){
 const states=new Map(),calls=[];let fail=failPrint;
 const ctx={Date,encodeURIComponent,pb1568State:(_,id)=>states.get(id),pb1568Save:(_,id,t)=>states.set(id,t),
  Me:async(url)=>{calls.push(url);if(unpriced)throw {data:{error:'invoice_pricing_required'}};return {invoice:{id:'invoice'}}},
  pb1568PersistPdf:async()=>calls.push('pdf'),pb1568Thermal:async(...args)=>{calls.push(args);if(fail){fail=false;throw Error('printer_offline')}},
  pb1568Problem:e=>e?.data?.error||e.message,pb1568Work:{},pb1576QueuePrice:()=>calls.push('pricing')};
 vm.createContext(ctx);vm.runInContext(worker,ctx);return {ctx,states,calls,run:(order={})=>ctx.pb1799ProcessProduct('lab',{id:'order',status:'sent',...order},{autoPrintInvoice:true})};
}
test('R1799 native goods issue invoice, persist PDF and thermal print once without any download',async()=>{
 const h=harness();await h.run();await h.run();
 assert.deepEqual(h.calls,['/api/lab/orders/order/automation-invoice','pdf',['invoice','order','invoice']]);assert(h.states.get('order').productReceiptDone);
});
test('R1799 product retries recover after printer failure and prompt missing prices once',async()=>{
 const h=harness({failPrint:true});await h.run();assert(!h.states.get('order').productReceiptDone);assert.equal(h.states.get('order').error,'printer_offline');
 await h.run();assert.equal(h.calls.length,3,'backoff prevents repeated printer requests');h.states.get('order').retryAt=0;await h.run();assert(h.states.get('order').productReceiptDone);
 const p=harness({unpriced:true});await p.run();p.states.get('order').retryAt=0;await p.run();assert.equal(p.calls.filter(x=>x==='pricing').length,1);assert(!p.calls.includes('pdf'));
});
test('R1799 unpaid and cancelled product orders never spool, mixed orders retain existing worker',async()=>{
 const h=harness();await h.run({status:'cancelled'});await h.run({settlement_mode:'prepaid',payment_status:'awaiting_receipt'});assert.equal(h.calls.length,0);
 const ui=fs.readFileSync('dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js','utf8');assert(ui.includes('if(pb1798NoPrintOrder(order))return pb1799ProcessProduct(lab,order,settings)'));assert(ui.includes("pb1798NoPrintOrder(order)&&settings.autoPrintInvoice&&['sent','received']"));assert(ui.includes('await pb1450Download(detail'));
});
async function automation({product=true,device='primary',paid=true,missing=false,existing=false,exempt=false}={}){
 const {handleLabAutomation}=await import('../dist/api/lab-auto-processing.js');let count=0,response,released=false;const queries=[];
 const order={id:'11111111-1111-4111-8111-111111111111',status:'sent',mode:'print',invoice_required:!exempt,customer_kind:'coworker',settlement_mode:paid?'ledger':'prepaid',payment_status:paid?'not_required':'awaiting_receipt'};
 const c={async query(sql){queries.push(sql);
  if(['BEGIN','COMMIT','ROLLBACK'].includes(sql))return {rows:[]};
  if(sql.startsWith('SELECT * FROM orders'))return {rows:[order]};
  if(sql.includes(' no_print_order FROM orders'))return {rows:[{no_print_order:product}]};
  if(sql.includes('primary_download_device_id FROM labs'))return {rows:[{primary_download_device_id:'primary'}]};
  if(sql.startsWith('SELECT id FROM invoices'))return {rowCount:existing?1:0,rows:existing?[{id:'invoice'}]:[]};
  throw Error('unexpected query: '+sql);
 },release(){released=true}};
 const pool={query:async()=>({rows:[{value:{invoiceTiming:'after_verified_download'}}]}),connect:async()=>c};
 await handleLabAutomation({req:{method:'POST'},res:{},url:new URL('https://example.org/api/lab/orders/'+order.id+'/automation-invoice'),labId:'lab',deviceId:device,pool,sendJson:(_,status,body)=>response={status,body},issueInvoice:async()=>{count++;return {id:'invoice'}},invoiceRequirements:async()=>missing?[{resolved:false}]:[],storageConfigured:false});
 return {response,count,queries,released};
}
test('R1799 actual automation endpoint invoices goods without a photo receipt but preserves all guards',async()=>{
 const goods=await automation();assert.equal(goods.response.status,200);assert.equal(goods.count,1);assert(goods.released);assert(!goods.queries.some(s=>s.includes('print_bytes')));
 for(const [opts,error] of [[{product:false},'download_not_verified'],[{device:'secondary'},'not_primary_download_device'],[{paid:false},'payment_required'],[{missing:true},'invoice_pricing_required'],[{exempt:true},'early_invoice_not_allowed']]){
  const r=await automation(opts);assert.equal(r.response.body.error,error);assert.equal(r.count,0);assert(r.released);
 }
 const reused=await automation({existing:true,missing:true});assert.equal(reused.response.status,200);assert.equal(reused.response.body.existing,true);
});
test('R1799 real native polling picks up goods when auto-download is disabled',async()=>{
 const ui=fs.readFileSync('dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js','utf8'),a=ui.indexOf('async function pb1568AutoTick(){'),b=ui.indexOf("if(typeof window!=='undefined'&&window.pbNativeStorage)",a);
 assert(a>=0&&b>a);const called=[],store=new Map(),orders=[{id:'goods',no_print_order:true,status:'sent',created_at:'2020-01-01'},{id:'photo',no_print_order:false,status:'sent',created_at:'2020-01-01'}];
 const ctx={Date,window:{pbNativeStorage:true},document:{visibilityState:'visible'},pb1568Work:{},fetch:async()=>({ok:true,json:async()=>({supported:true})}),Me:async(url)=>url==='/api/auth/me'?{lab:{id:'lab'}}:url==='/api/lab/automation'?{settings:{autoPrintInvoice:true,autoDownloadEnabled:false,invoiceTiming:'after_verified_download'}}:{orders},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},pb1568State:()=>null,pb1798NoPrintOrder:o=>o.no_print_order===true,pb1568ProcessOrder:async(_,o)=>called.push(o.id),pb1568Problem:e=>e.message};
 vm.createContext(ctx);vm.runInContext(ui.slice(a,b),ctx);await ctx.pb1568AutoTick();assert.deepEqual(called,['goods']);
 assert(ui.includes(worker.trim()),'the tested product worker is the delivered Windows code');
});
test('R1799 lab local intake invoices goods on submit and does not mark the job card as photo-downloaded',async()=>{
 const source=fs.readFileSync('dist/api/server.js','utf8'),a=source.indexOf("        if (req.method === 'POST' && submitDelegatedOrder)"),b=source.indexOf("        if (req.method === 'POST' && url.pathname === '/api/lab/push/subscribe')",a);
 assert(a>=0&&b>a);const hs=source.indexOf('async function pb1799ProductInvoice('),he=source.indexOf('async function financeDocumentsForCustomer(',hs);
 for(const product of [true,false]){
  let response,saved,invoiceCount=0,primaryChecks=0;const queries=[],order={id:'order',status:'uploading',mode:'print',customer_id:'customer',settlement_mode:'ledger'};
  const c={async query(sql,args){queries.push(sql);
   if(['BEGIN','COMMIT','ROLLBACK'].includes(sql))return {rows:[]};
   if(sql.startsWith('SELECT o.*'))return {rows:[order],rowCount:1};
   if(sql.startsWith('SELECT id,print_size_id'))return {rows:[{id:'file',original_state:'active',object_key:'client-local-recovery/file'}],rowCount:1};
   if(sql.includes('GROUP BY print_size_id'))return {rows:[],rowCount:0};
   if(sql.startsWith('UPDATE orders SET status=')){saved={...order,status:args[1],payment_status:args[2],downloaded_at:args[3]?'verified':null};return {rows:[saved]}}
   throw Error('unexpected delegated query: '+sql);
  },release(){}};
  const ctx={req:{method:'POST'},res:{},submitDelegatedOrder:['','order'],bodyJson:async()=>({}),pool:{connect:async()=>c},labId:'lab',a:{userId:'admin'},
   productInvoiceRequired:()=>true,isNoPrintOrder:async()=>product,orderInvoicePriceRequirements:async()=>[],createOrGetInvoice:async()=>{invoiceCount++;return {id:'invoice'}},
   requireLocalIntakePrimary:async()=>{primaryChecks++;return true},statusEvent:async()=>{},recordIntakeInvoiceSms:async()=>{},audit:async()=>{},publishLabEvent:()=>{},notifyLabCustomerForStatus:async()=>{},
   dispatchIntakeInvoiceSms:async()=>({}),sendSms:async()=>{},normalizeMobile:x=>x,sendJson:(_,status,body)=>response={status,body}};
  ctx.pb1799ProductInvoice=vm.runInNewContext('('+source.slice(hs,he)+')',ctx);await vm.runInNewContext('(async()=>{'+source.slice(a,b)+'})()',ctx);
  assert.equal(response.status,200);assert.equal(primaryChecks,1);assert.equal(invoiceCount,product?1:0);assert.equal(saved.status,product?'sent':'downloaded');assert.equal(saved.downloaded_at,product?null:'verified');
  assert(queries.includes('COMMIT'));
 }
});
