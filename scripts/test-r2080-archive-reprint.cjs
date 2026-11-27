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
