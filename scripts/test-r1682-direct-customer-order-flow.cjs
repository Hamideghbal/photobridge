'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const direct={id:'22222222-2222-4222-8222-222222222222',number:591,source:'walkin',
 walkin_customer_name:'مشتری آزاد',walkin_customer_mobile:'09120000000',
 invoice_required:false,mode:'print',status:'downloaded',downloaded_at:'2026-11-07T12:00:00.000Z',
 settlement_mode:'prepaid',payment_status:'unpaid'};

test('direct-customer orders are eligible for their own invoice even without a photographer account flag',async()=>{
 const api=await import('../dist/api/lab-auto-processing.js');
 const policy=await import('../dist/api/lab-priced-invoice-policy.js');
 assert.equal(api.isDirectCustomerInvoiceOrder(direct),true);
 assert.equal(api.isDirectCustomerInvoiceOrder({...direct,source:'photographer',walkin_customer_name:null}),false);
 assert.equal(policy.pricedLedgerInvoiceAllowed(direct,[]),true);
 assert.equal(policy.pricedLedgerInvoiceAllowed({...direct,source:'photographer',walkin_customer_name:null},[]),false);
 assert.equal(policy.pricedLedgerInvoiceAllowed(direct,[{key:'missing'}]),false);
 assert.equal(policy.pricedLedgerInvoiceAllowed({...direct,source:'photographer',walkin_customer_name:null,invoice_required:true,settlement_mode:'prepaid'},[]),false);
});

test('manual pricing confirmation creates exactly one invoice for direct customers and keeps missing tariffs blocked',async()=>{
 const {issueAfterManualPriceConfirmation}=await import('../dist/api/lab-priced-invoice-policy.js');
 let issued=0;
 const db={query:async()=>({rows:[{...direct,invoice_id:'invoice-591'}],rowCount:1})};
 const creator=async()=>{issued++;return{id:'invoice-591',number:591,total:85000}};
 const result=await issueAfterManualPriceConfirmation(db,'lab',direct.id,direct,[],creator);
 assert.equal(issued,1);
 assert.equal(result.invoice.id,'invoice-591');
 assert.equal(result.order.invoice_id,'invoice-591');
 const blocked=await issueAfterManualPriceConfirmation(db,'lab',direct.id,direct,[{key:'20x30'}],creator);
 assert.equal(blocked.invoice,null);
 assert.equal(issued,1);
});

test('verified-download invoice helper does not skip direct customers with invoice_required=false',async()=>{
 const {invoiceAfterVerifiedDownload}=await import('../dist/api/verified-download-invoice.js');
 let issued=0;
 const db={query:async(sql)=>sql.startsWith('SELECT * FROM orders')?{rows:[{...direct,invoice_id:'invoice-591'}]}:{rows:[]}};
 const result=await invoiceAfterVerifiedDownload(db,'lab',direct,async()=>{issued++;return{id:'invoice-591',number:591}});
 assert.equal(issued,1);
 assert.equal(result.invoice.id,'invoice-591');
 assert.equal(result.order.invoice_id,'invoice-591');
});

test('direct-customer automation invoice bypasses only photographer-account and prepayment gates',async()=>{
 const {handleLabAutomation}=await import('../dist/api/lab-auto-processing.js');
 const {downloadManifestFingerprint}=await import('../dist/api/lab-download-receipt.js');
 const deviceId='pblab-local-test';
 const file={id:'33333333-3333-4333-8333-333333333333',original_name:'one.jpg',print_name:null,bytes:123,print_bytes:null};
 const proof={fileCount:1,manifest:downloadManifestFingerprint([file]),deviceId,verifiedAt:new Date().toISOString()};
 let issued=0,reply;
 const db={
  query:async(sql)=>{
   if(sql==='BEGIN'||sql==='COMMIT'||sql==='ROLLBACK')return{rows:[],rowCount:0};
   if(sql.includes('SELECT * FROM orders WHERE lab_id=$1 AND id=$2 FOR UPDATE'))return{rows:[direct]};
   if(sql.includes('FROM labs WHERE id='))return{rows:[{ui_preferences:null,primary_download_device_id:deviceId}]};
   if(sql.includes('FROM order_files'))return{rows:[file]};
   if(sql.includes('FROM platform_settings'))return{rows:[{value:proof}]};
   if(sql.includes('SELECT id FROM invoices'))return{rows:[],rowCount:0};
   throw Error('unexpected SQL '+sql);
  },
  release(){}
 };
 const pool={
  query:async()=>({rows:[{value:{invoiceTiming:'after_verified_download'}}]}),
  connect:async()=>db
 };
 const handled=await handleLabAutomation({
  req:{method:'POST'},res:{setHeader(){}},
  url:{pathname:'/api/lab/orders/'+direct.id+'/automation-invoice'},
  labId:'11111111-1111-4111-8111-111111111111',deviceId,pool,
  bodyJson:async()=>({}),sendJson:(_res,code,data)=>{reply={code,data}},
  issueInvoice:async()=>{issued++;return{id:'invoice-591',number:591,total:85000}},
  invoiceRequirements:async()=>[],storageConfigured:false,storagePresign:async()=>null,
  audit:async()=>{},actorId:'test'
 });
 assert.equal(handled,true);
 assert.equal(reply.code,200);
 assert.equal(issued,1);
 assert.equal(reply.data.invoice.id,'invoice-591');
});

test('direct customers cannot enter Ready or Delivered without an invoice; photographer after-print flow is preserved',async()=>{
 const {labOrderStageInvoiceGuard}=await import('../dist/api/lab-invoice-stage-guard.js');
 let exists=false;
 const db={query:async()=>({rowCount:exists?1:0,rows:exists?[{id:'invoice'}]:[]})};
 assert.equal((await labOrderStageInvoiceGuard(db,'lab',direct,'ready')).error,'order_invoice_required');
 assert.equal((await labOrderStageInvoiceGuard(db,'lab',direct,'completed')).error,'order_invoice_required');
 exists=true;
 assert.equal(await labOrderStageInvoiceGuard(db,'lab',direct,'ready'),null);
 exists=false;
 const photographer={...direct,source:'photographer',walkin_customer_name:null,invoice_required:true,settlement_mode:'ledger'};
 assert.equal(await labOrderStageInvoiceGuard(db,'lab',photographer,'ready'),null);
 assert.equal((await labOrderStageInvoiceGuard(db,'lab',photographer,'completed')).error,'order_invoice_required');
 const noInvoiceRequired={...photographer,invoice_required:false};
 assert.equal(await labOrderStageInvoiceGuard(db,'lab',noInvoiceRequired,'completed'),null);
});

test('website and Windows UI identify direct customers, expose pricing, and do not resume Ready before invoice',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const bundle=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(bundle.includes('function pb1682DirectCustomer(order)'));
  assert(fs.readFileSync(root+'/index.html','utf8').includes('directCustomerFlow=r1682'));
  const directFn=bundle.match(/function pb1682DirectCustomer\(order\)\{[^}]+\}/)?.[0];
  const pending=bundle.match(/function pb1603InvoicePending\(order\)\{[^}]+\}/)?.[0];
  const stage=bundle.match(/function pb1603StageInvoicePending\(order,stage\)\{[^}]+\}/)?.[0];
  assert(directFn&&pending&&stage,'direct-customer invoice helpers are present');
  const context={};
  vm.runInNewContext([directFn,pending,stage].join('\n'),context);
  assert.equal(context.pb1682DirectCustomer({...direct,invoice_id:null}),true);
  assert.equal(context.pb1603InvoicePending({...direct,invoice_id:null}),true);
  assert.equal(context.pb1603StageInvoicePending({...direct,invoice_id:null},'ready'),true);
  assert.equal(context.pb1603StageInvoicePending({...direct,invoice_id:'inv'},'ready'),false);
  assert.equal(context.pb1603StageInvoicePending({...direct,source:'photographer',walkin_customer_name:null,invoice_required:true},'ready'),false);
  assert(bundle.includes('قیمت‌گذاری اختصاصی این سفارش'));
  assert(bundle.includes('مبالغ واردشده فقط برای همین سفارش ثبت می‌شوند'));
  assert(!bundle.includes('این سفارش سایز بدون تعرفه دارد'));
  const a=bundle.indexOf('Nn=async saved=>'),b=bundle.indexOf(';x.useEffect(()=>{const lab=t?.id;',a);
  assert(a>0&&b>a);
  const handler=bundle.slice(a,b);
  assert(handler.includes('saved?.invoice?.id'));
  assert(handler.includes('await Qn(invoice.id'));
  assert(!handler.includes('pb1568AfterManualDownload'));
  assert(!handler.includes('un(order)'));
 }
});

test('manual price callback opens the invoice returned by the pricing transaction instead of waiting for auto-invoice timing',async()=>{
 const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 const a=bundle.indexOf('Nn=async saved=>'),b=bundle.indexOf(';x.useEffect(()=>{const lab=t?.id;',a);
 const code=bundle.slice(a,b);
 const events=[],rows=[{...direct}],ctx={
  Se:{order:{...direct},resume:'ready'},Fe:v=>events.push(['close',v]),C:v=>events.push(['busy',v]),
  f:fn=>{rows.splice(0,rows.length,...fn(rows))},P:v=>events.push(['notice',v]),V:String,
  Me:async path=>{events.push(['get',path]);return{order:{...direct,invoice_id:'invoice-591'}}},
  pb1568Save:()=>events.push(['checkpoint']),pb1547CompletePdf:async()=>events.push(['pdf']),
  ai:()=>false,Qn:async(id)=>events.push(['preview',id]),t:{id:'lab',name:'Lab'},h:null,
  Tt:async()=>{},ye:async()=>{},pb1547Notice:message=>events.push(['warning',message]),console
 };
 vm.createContext(ctx);
 vm.runInNewContext('globalThis.run='+code,ctx);
 await ctx.run({ready:true,missing:[],order:{...direct},invoice:{id:'invoice-591',number:591,pdf_ready:true}});
 assert(events.some(row=>row[0]==='preview'&&row[1]==='invoice-591'));
 assert(events.some(row=>row[0]==='checkpoint'));
 assert(!events.some(row=>row[0]==='get'&&row[1].includes('automation-invoice')));
});

test('R1586 receives its expected initial worker timer before R1683 makes downloads faster',()=>{
 const worker=fs.readFileSync('scripts/r1568-native-worker.js.txt','utf8');
 const originalPatch=fs.readFileSync('scripts/enable-r1586-opening-debt-history.mjs','utf8');
 const latePatch=fs.readFileSync('scripts/enable-r1682-direct-customer-order-flow.mjs','utf8');
 assert(worker.includes('setTimeout(()=>void pb1568AutoTick(),12000);'));
 assert(worker.includes('setInterval(()=>void pb1568AutoTick(),45000);'));
 assert(originalPatch.includes("source=replace(source,'setTimeout(()=>void pb1568AutoTick(),12000);'"));
 assert(latePatch.includes("nativeJs=one(nativeJs,'setInterval(()=>void pb1568AutoTick(),45000);'"));
 assert(latePatch.includes("/* R1586: the event scheduler starts the worker immediately. */"));
});

test('native auto-download keeps R1586 instant notification wake and uses 10-second safety polling',()=>{
 const native=fs.readFileSync('dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js','utf8');
 assert(native.includes('function pb1586WakeDownloads()'));
 assert(native.includes('function pb1586NoticeWake('));
 assert(native.includes('/* R1683 preserved R1586 download wake */'));
 assert(native.includes('setInterval(()=>void pb1568AutoTick(),10000);'));
 assert(native.includes('window.addEventListener("focus",pb1586WakeDownloads);'));
 assert(!native.includes('setInterval(()=>void pb1568AutoTick(),45000);'));
 assert(!native.includes('setTimeout(()=>void pb1568AutoTick(),12000);'));
});
