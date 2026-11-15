const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{pathToFileURL}=require('node:url'),path=require('node:path');
test('current invoice policy blocks delivery and prepaid production, permits ledger printing, and isolates laboratories',async()=>{
 const {labOrderStageInvoiceGuard:guard}=await import(pathToFileURL(path.resolve('dist/api/lab-invoice-stage-guard.js')));
 const {PGlite}=require(process.env.PB_PGLITE_PATH||'@electric-sql/pglite'),db=new PGlite();
 try{
  await db.exec("CREATE TABLE invoices(id text,lab_id text,order_id text);INSERT INTO invoices VALUES('other','B','order');");
  const order={id:'order',invoice_required:true,customer_kind:'coworker',settlement_mode:'ledger'};
  const production=['printing','reviewing','ready_print','printed','binding'];
  for(const stage of production){
   assert.equal(await guard(db,'A',order,stage),null,'ledger invoice may be issued after printing');
   assert.equal((await guard(db,'A',{...order,settlement_mode:'prepaid'},stage)).error,'order_invoice_required');
  }
  for(const [data,stages] of [[order,['completed']],[{...order,customer_kind:'customer'},['ready','completed']],[{...order,source:'walkin',customer_kind:''},['ready','completed']]])
   for(const stage of stages)assert.equal((await guard(db,'A',data,stage)).error,'order_invoice_required');
  for(const stage of ['downloaded','needs_fix','cancelled'])assert.equal(await guard(db,'A',order,stage),null);
  assert.equal(await guard(db,'A',{...order,invoice_required:false},'completed'),null);
  assert.equal((await guard(db,'A',{...order,customer_kind:'customer',invoice_required:false},'ready')).error,'order_invoice_required','direct customer still requires invoice');
  await db.exec("INSERT INTO invoices VALUES('invoice','A','order')");
  for(const stage of [...production,'ready','completed'])assert.equal(await guard(db,'A',{...order,customer_kind:'customer',settlement_mode:'prepaid'},stage),null);
  assert.equal((await db.query('SELECT count(*)::int count FROM invoices')).rows[0].count,2,'guard remains read-only');
 }finally{await db.close()}
});
test('the existing UI recognizes pending invoices, including native local invoice aliases and exemptions',()=>{const c={};vm.runInNewContext(fs.readFileSync('scripts/r1603-lab-invoice-ui.js.txt','utf8'),c);const order={id:'o',status:'downloaded',downloaded_at:'2026-11-05'};assert(c.pb1603InvoicePending(order));assert(c.pb1603StageInvoicePending(order,'print'));assert(!c.pb1603StageInvoicePending(order,'download'));for(const data of [{invoice_id:'i'},{invoiceId:'i'},{local_invoice_id:'i'},{invoice_required:false}])assert(!c.pb1603InvoicePending({...order,...data}))});
test('server blocks spec changes and checks invoice under the order lock before either stage update',()=>{const s=fs.readFileSync('dist/api/server.js','utf8');for(const [start,end,update] of [["if (labOrder && req.method === 'PATCH')",'const labInvoicePdfUpload','UPDATE orders SET status'],['const labAlbumStage','const labPlatformChat','UPDATE orders SET album_stage']]){const a=s.indexOf(start),b=s.indexOf(end,a),part=s.slice(a,b>a?b:a+16000);assert(part.indexOf('FOR UPDATE')<part.indexOf('labOrderStageInvoiceGuard'));assert(part.indexOf('labOrderStageInvoiceGuard')<part.indexOf(update));assert(part.includes("if(invoiceGate){await c.query('ROLLBACK');return sendJson(res,409,invoiceGate);}"))}const a=s.indexOf("if (labFilePrintSettings && req.method === 'PATCH')");assert(s.slice(a,a+250).includes("error:'order_details_read_only'"))});
