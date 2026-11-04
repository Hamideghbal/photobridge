'use strict';const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
for(const native of [false,true]){
 const root=native?'dist/web/lab-desktop-ui':'dist/web',source=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
 function fixture({downloaded=true,fail=false,incomplete=false}={}){
  const calls=[],invoice={id:'invoice',number:7},order={id:'order',lab_id:'lab',number:5,downloaded_at:downloaded?'now':null,document_revision:2,invoice_required:true};let rows=[order],checkpoint={phase:'waiting_for_pricing'};
  const context={Se:{order,resume:'ready'},t:{id:'lab'},h:null,Fe:value=>calls.push(['modal',value]),C:value=>calls.push(['busy',value]),f:update=>rows=update(rows),V:String,P:message=>calls.push(['notice',message]),pb1547Notice:message=>calls.push(['warning',message]),ye:()=>new Promise(()=>{}),Tt:()=>assert.fail('no unrelated detail reload'),un:()=>assert.fail('must not resume at Ready'),ai:()=>true,window:{pbNativeStorage:native},fetch:async()=>{calls.push(['thermal']);return{ok:true}},pb1547CompletePdf:async()=>calls.push(['pdf']),pb1576QueuePrice:()=>calls.push(['price-dialog']),console,
   Me:async path=>{if(path==='/api/lab/automation')return{settings:{invoiceTiming:'after_verified_download',autoPrintInvoice:true}};if(path.endsWith('/automation-invoice')){calls.push(['invoice']);if(fail)throw Error('network');if(incomplete)throw{data:{error:'invoice_pricing_required'}};return{invoice}}calls.push(['fresh']);return{order:{...order,invoice_id:invoice.id,document_revision:3}}}};
  if(native)context.pb1568Save=(_,__,value)=>{checkpoint=value;calls.push(['checkpoint'])};
  const a=source.indexOf('async function pb1568AfterManualDownload('),b=source.indexOf('\n}\n',a);vm.runInNewContext(source.slice(a,b+2),context);
  const begin=source.indexOf('Nn=async saved=>'),end=source.indexOf(';x.useEffect(()=>{const lab=t?.id;',begin);assert(begin>0&&end>begin);vm.runInNewContext('globalThis.run='+source.slice(begin+3,end),context);
  return{context,calls,order,rows:()=>rows,checkpoint:()=>checkpoint};
 }
 test(root+': saving complete prices finishes the verified-download invoice/PDF/optional print and never reopens Ready pricing',async()=>{
  const f=fixture();await Promise.race([f.context.run({order:f.order,ready:true,missing:[]}),new Promise((_,reject)=>setTimeout(()=>reject(Error('waited for list refresh')),500))]);
  assert.equal(f.calls.filter(x=>x[0]==='invoice').length,1);assert(f.calls.some(x=>x[0]==='pdf'));assert.equal(f.calls.filter(x=>x[0]==='thermal').length,native?1:0);assert(!f.calls.some(x=>x[0]==='price-dialog'));assert.equal(f.rows()[0].document_revision,3);assert.equal(f.rows()[0].invoice_id,'invoice');if(native)assert.equal(f.checkpoint().phase,'complete');assert.deepEqual(f.calls.filter(x=>x[0]==='busy').map(x=>x[1]),['order','']);
 });
 test(root+': incomplete prices and pre-download pricing do not issue the production invoice',async()=>{
  for(const args of [{downloaded:false},{}]){const f=fixture(args);await f.context.run({order:f.order,ready:args.downloaded===false,missing:[]});assert(!f.calls.some(x=>x[0]==='invoice'));if(args.downloaded!==false)assert(!f.calls.some(x=>x[0]==='modal'));}
 });
 test(root+': failed continuation keeps its retry checkpoint and missing pricing can reopen now, never at Ready',async()=>{
  const failed=fixture({fail:true});await failed.context.run({order:failed.order,ready:true});assert(failed.calls.some(x=>x[0]==='warning'));assert.equal(failed.checkpoint().phase,'waiting_for_pricing');
  const missing=fixture({incomplete:true});await missing.context.run({order:missing.order,ready:true});assert(missing.calls.some(x=>x[0]==='price-dialog'));assert.equal(missing.checkpoint().phase,'waiting_for_pricing');
 });
}
