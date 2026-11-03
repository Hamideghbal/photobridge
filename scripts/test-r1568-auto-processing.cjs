'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const LAB='11111111-1111-4111-8111-111111111111',ORDER='22222222-2222-4222-8222-222222222222',DEVICE='pblab-local-test';
const row={id:'33333333-3333-4333-8333-333333333333',original_name:'one.jpg',print_name:null,bytes:123,print_bytes:null};
let cache;
async function api(){
 if(cache)return cache;
 const a=await import('../dist/api/lab-auto-processing.js');
 const receipt=await import('../dist/api/lab-download-receipt.js');
 return cache={...a,...receipt};
}
test('settings default to disabled automation and current after-print accounting',async()=>{
 const m=await api();
 assert.deepEqual(m.normalizeAutomation(),{autoDownloadEnabled:false,invoiceTiming:'after_print',autoPrintInvoice:false,autoPrintMissingPriceTicket:true,receiptWidthMm:80});
 assert(m.validateAutomation({autoDownloadEnabled:true,invoiceTiming:'after_verified_download',autoPrintInvoice:true,autoPrintMissingPriceTicket:true,receiptWidthMm:58}));
 assert(!m.validateAutomation({autoDownloadEnabled:'true',invoiceTiming:'after_print',autoPrintInvoice:false,autoPrintMissingPriceTicket:true,receiptWidthMm:80}));
 assert(!m.validateAutomation({autoDownloadEnabled:false,invoiceTiming:'before_download',autoPrintInvoice:false,autoPrintMissingPriceTicket:true,receiptWidthMm:80}));
});
test('verified receipt proof binds one physical device and exact manifest',async()=>{
 const m=await api(),proof={fileCount:1,manifest:m.downloadManifestFingerprint([row]),deviceId:DEVICE,verifiedAt:new Date().toISOString()};
 assert(m.verifiedReceiptMatches(proof,[row],DEVICE));
 assert(!m.verifiedReceiptMatches(proof,[row],'other-device'));
 assert(!m.verifiedReceiptMatches(proof,[{...row,bytes:999}],DEVICE));
 assert(!m.verifiedReceiptMatches(proof,[],DEVICE));
});
function setup({proof=true,missing=false,timing='after_verified_download'}={}){
 let issued=0,reply;
 const order={id:ORDER,status:'downloaded',downloaded_at:new Date().toISOString(),settlement_mode:'ledger',payment_status:'unpaid'};
 const receipt={fileCount:1,manifest:null,deviceId:DEVICE,verifiedAt:new Date().toISOString()};
 const invoice={id:'44444444-4444-4444-8444-444444444444',number:100,items:[],total:1};
 const c={
  query:async(sql,args)=>{
    if(sql.startsWith('SELECT * FROM orders'))return {rows:[order]};
    if(sql.includes('FROM labs WHERE id='))return {rows:[{ui_preferences:null,primary_download_device_id:DEVICE}]};
    if(sql.includes('FROM order_files'))return {rows:[row]};
    if(sql.includes('FROM platform_settings'))return {rows:proof?[{value:receipt}]:[]};
    if(sql.includes('FROM invoices'))return {rowCount:0,rows:[]};
    return {rows:[],rowCount:0};
  },release:()=>{}
 };
 const pool={query:async sql=>({rows:[{value:{invoiceTiming:timing}}]}),connect:async()=>c};
 const deps={
  req:{method:'POST'},res:{setHeader(){}},url:{pathname:'/api/lab/orders/'+ORDER+'/automation-invoice'},
  labId:LAB,deviceId:DEVICE,pool,
  bodyJson:async()=>({}),sendJson:(res,code,data)=>{reply={code,data}},
  issueInvoice:async()=>{issued++;return invoice},
  invoiceRequirements:async()=>missing?[{resolved:false,key:'size-20x30'}]:[],
  storageConfigured:false,storagePresign:async()=>null,
  audit:async()=>{},actorId:'test'
 };
 return {deps,receipt,setReceipt:f=>receipt.manifest=f,issued:()=>issued,reply:()=>reply};
}
test('early invoice refuses unverified or changed local downloads',async()=>{
 const m=await api(),f=setup({proof:false});
 await m.handleLabAutomation(f.deps);
 assert.equal(f.reply().data.error,'download_proof_expired_or_missing');
 assert.equal(f.issued(),0);
});
test('missing print tariff returns actionable requirements, not financial invoice',async()=>{
 const m=await api(),f=setup({missing:true});
 f.setReceipt(m.downloadManifestFingerprint([row]));
 await m.handleLabAutomation(f.deps);
 assert.equal(f.reply().code,409);
 assert.equal(f.reply().data.error,'invoice_pricing_required');
 assert.equal(f.issued(),0);
});
test('verified paid-eligible order issues invoice without changing print/status state',async()=>{
 const m=await api(),f=setup();
 f.setReceipt(m.downloadManifestFingerprint([row]));
 await m.handleLabAutomation(f.deps);
 assert.equal(f.reply().code,200);
 assert.equal(f.reply().data.invoice.number,100);
 assert.equal(f.issued(),1);
});
test('compiled site and native UI carry automation settings and a native-only worker',()=>{
 const site=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 const native=fs.readFileSync('dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js','utf8');
 assert(site.includes('PB1568AutomationSettings'));
 assert(!site.includes('/* R1568 native auto worker */'));
 assert(native.includes('/* R1568 native auto worker */'));
 assert(native.includes('pb1568AutoTick'));
 const manifest=JSON.parse(fs.readFileSync('dist/web/lab-desktop-ui/manifest.json','utf8'));
 assert(manifest.files.some(f=>f.name==='photobridge-r1568-auto.css'));
});
