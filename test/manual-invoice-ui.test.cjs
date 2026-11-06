'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createManualInvoiceFlow,patchManualInvoiceUI}=require('../manual-invoice-ui.cjs');
function fixture({offline=false,missing=false,existing=false,printerFails=false}={}){
 const calls=[],queue=[],events=[];let issued=existing?{id:'invoice',pdf_ready:true}:null,prints=0;
 const flow=createManualInvoiceFlow({
  request:async(url,options={})=>{calls.push({url,options});if(url==='/api/lab/orders/order')return{order:{id:'order',lab_id:'lab',downloaded_at:'now',origin_offline:offline,document_authority:offline?'offline':'shared'},files:[{id:'file',original_name:'photo.jpg',bytes:12}],invoice:issued};
   if(url.endsWith('/download-receipt/download'))return{verifiedFiles:1};
   if(url.endsWith('/automation-invoice')){if(missing)throw{data:{error:'invoice_pricing_required'}};issued={id:'invoice',pdf_ready:true};return{invoice:issued};}throw Error('unexpected route '+url);},
  pdf:async()=>{calls.push({url:'pdf'});},print:async()=>{prints++;if(printerFails)throw Error('printer_offline_or_missing');},queuePrice:(...v)=>queue.push(v),changed:id=>events.push(id)
 });
 return{flow,calls,queue,events,get prints(){return prints;}};
}
test('online manual registration acknowledges saved file metadata before issuing one invoice and printing',async()=>{
 const f=fixture();const [a,b]=await Promise.all([f.flow.complete('order','lab'),f.flow.complete('order','lab')]);
 assert.equal(a.invoice.id,b.invoice.id);assert.equal(f.calls.filter(c=>c.url.endsWith('automation-invoice')).length,1);
 const receipt=f.calls.findIndex(c=>c.url.endsWith('download-receipt/download')),issue=f.calls.findIndex(c=>c.url.endsWith('automation-invoice'));assert(receipt<issue);assert.equal(f.prints,1);assert.equal(f.queue.length,0);
 assert.deepEqual(JSON.parse(f.calls[receipt].options.body).files,[{id:'file',name:'photo.jpg',bytes:12}]);
});
test('offline invoice completes without remote receipt or automation-settings requests',async()=>{
 const f=fixture({offline:true});const result=await f.flow.complete('order','lab');assert.equal(result.completed,true);assert.equal(f.prints,1);assert(!f.calls.some(c=>c.url.includes('download-receipt')||c.url.includes('/automation?')||c.url==='/api/lab/automation'));assert.equal(f.queue.length,0);
});
test('only genuine missing pricing opens the operator price queue; no invoice or print is claimed',async()=>{
 const f=fixture({offline:true,missing:true});const result=await f.flow.complete('order','lab');assert.equal(result.pricingRequired,true);assert.deepEqual(f.queue,[['lab','order']]);assert.equal(f.prints,0);assert.equal(f.events.length,0);
});
test('printer failure keeps the issued invoice and retry reuses the invoice instead of issuing twice',async()=>{
 const f=fixture({offline:true,printerFails:true});const first=await f.flow.complete('order','lab');assert.equal(first.completed,true);assert.match(first.warning,/printer_offline_or_missing/);const second=await f.flow.complete('order','lab');assert.equal(second.invoice.id,first.invoice.id);assert.equal(f.calls.filter(c=>c.url.endsWith('automation-invoice')).length,1);
});
test('the empty pricing window is replaced by issuance, while local documents suppress the network dialog',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../verified-ui/assets/index-UIRefine-v655-r84.js'),'utf8'),patched=patchManualInvoiceUI(source);

 assert(patched.includes('createManualInvoiceDialog')||patched.includes('pbCreateManualInvoiceDialog'));assert(patched.includes('window.pbManualInvoiceFlow.open({orderId:le.id'));assert.equal(patchManualInvoiceUI(patched),patched);
 const modern=patchManualInvoiceUI(source+'\nfunction pb1586ShowNetworkProblem(order,stage){return stage;}');assert(modern.includes('pb1642CloudNetworkProblem'));assert(modern.includes('isIndependent(order?.id)'));
});

test('offline-owned order does not open the cloud network warning, shared order still can',()=>{
 const source='let on;const Fe=()=>{};on=(le,nt="none")=>{Fe({order:le,resume:nt})};function pb1586ShowNetworkProblem(order,stage){globalThis.prompts++;}';
 const context={window:{},prompts:0};vm.runInNewContext(patchManualInvoiceUI(source),context);
 context.pb1586ShowNetworkProblem({origin_offline:true},'invoice');context.pb1586ShowNetworkProblem({document_authority:'offline'},'invoice');assert.equal(context.prompts,0);
 context.pb1586ShowNetworkProblem({document_authority:'shared'},'download');assert.equal(context.prompts,1);
});

test('offline host background warning does not interrupt a manual invoice even when the queued record lacks origin metadata',async()=>{
 const source='let on;const Fe=()=>{};on=(le,nt="none")=>{Fe({order:le,resume:nt})};function pb1586ShowNetworkProblem(order,stage){globalThis.prompts++;}';
 const context={window:{pbManualInvoiceFlow:{isIndependent:async()=>false,isHostOffline:async()=>true}},document:{querySelector:()=>null},prompts:0};vm.runInNewContext(patchManualInvoiceUI(source),context);context.pb1586ShowNetworkProblem({id:'old-shared-queue-row'},'invoice');await new Promise(r=>setImmediate(r));assert.equal(context.prompts,0);
});
