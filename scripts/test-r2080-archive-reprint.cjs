const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('R2080: archive reprint suppresses customer notice only for invoice-free recovery and verifies receipt',()=>{
 const s=fs.readFileSync('dist/api/server.js','utf8');
 assert.match(s,/if\(invoiceRequired\)publishCustomerEvent\(labId, String\(newOrder.customer_id\), 'archive_order_recovered'/);
 assert.match(s,/if\(order.invoice_required!==false\)publishCustomerEvent\(labId, String\(ready.customer_id\), 'archive_order_recovered'/);
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const ui=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(!ui.includes('className:"primary compactArchiveDownload"'));
  assert.match(ui,/const receipt=await pb1451AcknowledgeDownload\(prepared\);\s*const downloaded=/);
  assert.match(ui,/صدور فاکتور تأیید نشد/);
 }
});
test('R2080: invoice-free recovered direct customers never invoke invoice issuer',async()=>{
 const {invoiceAfterVerifiedDownload}=await import('../dist/api/verified-download-invoice.js');
 const got=await invoiceAfterVerifiedDownload({query:()=>assert.fail('unexpected DB call')},'lab',{invoice_required:false,recovered_from_order_id:'old',customer_kind:'customer'},()=>assert.fail('unexpected invoice'));
 assert.deepEqual(got,{});
 const {pricedLedgerInvoiceAllowed}=await import('../dist/api/lab-priced-invoice-policy.js');
 assert.equal(pricedLedgerInvoiceAllowed({invoice_required:false,recovered_from_order_id:'old',customer_kind:'customer'},[]),false);
});

test('R2080: all direct-customer stage/automation policies preserve explicit free reprints',async()=>{
 const {labOrderStageInvoiceGuard}=await import('../dist/api/lab-invoice-stage-guard.js');
 const db={query:()=>assert.fail('free reprint must not require an invoice')};
 for(const stage of ['printing','ready','completed'])assert.equal(await labOrderStageInvoiceGuard(db,'lab',{invoice_required:false,recovered_from_order_id:'old',customer_kind:'customer'},stage),null);
 const auto=fs.readFileSync('dist/api/lab-auto-processing.js','utf8');
 assert.match(auto,/if\(order\.invoice_required===false&&\(order\.recovered_from_order_id\|\|!isDirectCustomerInvoiceOrder\(order\)\)\)/);
});
test('R2080: archive copy, invoice success, pricing error and invoice failure messages stay distinct',async()=>{
 const {patchUi}=await import('./r2080-archive-reprint.mjs');
 const vm=require('node:vm');
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 const i=ui.indexOf('function pb1451RecoveryMessage('),j=ui.indexOf('function pb1451RecoveryError(',i);
 const body=ui.slice(i,j).replace(/async\s*$/,'');
 const ctx={V:String,pb2080Receipts:new Map()};
 vm.runInNewContext(body,ctx);
 const message=(order,receipt,localPrepared=true)=>ctx.pb1451RecoveryMessage({order:{id:'x',number:23,mode:'print',...order},receipt,localPrepared});
 assert.match(message({invoice_required:false}),/بدون فاکتور/);
 assert.match(message({invoice_required:true},{invoice:{id:'invoice',number:42}}),/42/);
 assert.match(message({invoice_required:true},{invoiceError:'invoice_pricing_required'}),/تعرفه ناقص/);
 assert.match(message({invoice_required:true},{invoiceError:'invoice_issuance_failed'}),/صدور فاکتور تأیید نشد/);
 assert.match(message({invoice_required:false},null,false),/هنوز روی هارد تأیید نشده/);
});
