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
 assert.match(auto,/if\(order\.recovered_from_order_id&&order\.invoice_required===false\)throw Object.assign\(Error\('early_invoice_not_allowed'\)/);
 assert(auto.indexOf('if(order.recovered_from_order_id&&order.invoice_required===false)')<auto.indexOf('const product=await isNoPrintOrder(c,labId,id);'));
 assert.match(auto,/if\(product\?!productInvoiceRequired\(order\):order\.invoice_required===false&&!isDirectCustomerInvoiceOrder\(order\)\)/);
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

test('R2083: late product/album eligibility variants do not break archive invoice guard',async()=>{
 const {patchInvoicePolicy}=await import('./r2080-archive-reprint.mjs');
 const row="order=oq.rows[0];if(!order)throw Object.assign(Error('not_found'),{status:404});";
 const conditions=["if(order.invoice_required===false&&!isDirectCustomerInvoiceOrder(order))","if(product?!productInvoiceRequired(order):order.invoice_required===false&&!isDirectCustomerInvoiceOrder(order))"];
 for(const condition of conditions){
  const fixture="export async function handleLabAutomation(){"+row+"\n"+condition+"throw Error('existing_policy');}";
  const patched=patchInvoicePolicy(fixture);
  assert(patched.includes(condition),'ordinary product/print invoice rules unchanged');
  assert(patched.indexOf("if(order.recovered_from_order_id&&order.invoice_required===false)")<patched.indexOf(condition));
  assert.equal(patchInvoicePolicy(patched),patched);
  const check=new Function('order','try{'+patched.slice(patched.indexOf("if(order.recovered_from_order_id"),patched.indexOf(condition))+'return 200}catch(e){return e.status}');
  assert.equal(check({recovered_from_order_id:'old',invoice_required:false}),409);
  assert.equal(check({recovered_from_order_id:'old',invoice_required:true}),200);
  assert.equal(check({invoice_required:false}),200);
 }
});

test('R2084: final web and Windows archive functions compile, each browser recovery uses exactly one receipt and its revision',()=>{
 const vm=require('node:vm');
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const s=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  const i=s.indexOf('async function pb1451RestoreLocal('),j=s.indexOf('function pb1451RecoveryMessage(',i);
  assert(i>=0&&j>i,root);
  const part=s.slice(i,j),browser=part.slice(part.indexOf('async function pb1451RecoverOrder('));
  new vm.Script(part);
  assert.equal([...browser.matchAll(/const receipt=await pb1451AcknowledgeDownload\(prepared\);/g)].length,1,root);
  assert.match(browser,/result\.order\.id,\{status:'downloaded',expectedRevision:receipt\.order\.document_revision/);
  assert.match(browser,/return \{\.\.\.result,receipt,order:confirmed\.order/);
 }
});

test('R2085: archive cache key preserves the existing finance/album/stage chain and is idempotent',async()=>{
 const {archiveCacheUrl}=await import('./r2080-archive-reprint.mjs');
 const tail='&labPrintFinance=r2047&labStatement=r2048&labFinanceCache=r2049&albumSizes=r1960';
 for(const url of ['index-UIRefine-v655-r84.js?v=r1159'+tail,'index-UIRefine-v655-r84.js?v=r1159&labStage=r1894'+tail+'&archiveReprint=r2080','index-UIRefine-v655-r84.js?v=r1159&archiveReprint=r2080'+tail+'&labStage=r1956']){
  const next=archiveCacheUrl(url),final=next.replace(/&labStage=r\d+/g,'')+'&labStage=r1956';
  assert.equal(archiveCacheUrl(next),next);
  assert.deepEqual(new URL(final,'https://photobridge.ir/').searchParams.getAll('archiveReprint'),['r2085']);
  assert(final.endsWith(tail+'&labStage=r1956'));
 }
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const html=fs.readFileSync(root+'/index.html','utf8'),url=html.match(/index-UIRefine-v655-r84\.js\?[^"'\s>]+/)[0];
  assert.deepEqual(new URL(url,'https://photobridge.ir/').searchParams.getAll('archiveReprint'),['r2085']);
  assert(url.includes(tail),root);
 }
});
