const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const read=p=>fs.readFileSync(p,'utf8');
test('manual price confirmation issues exactly once through the existing transaction-scoped idempotent creator',async()=>{
 const {pricedLedgerInvoiceAllowed:allowed,issueAfterManualPriceConfirmation:issue}=await import(pathToFileURL(path.resolve('dist/api/lab-priced-invoice-policy.js')));
 const normal={id:'order1',status:'downloaded',invoice_required:true,settlement_mode:'ledger'};
 assert.equal(allowed(normal,[]),true);
 for(const row of [
  {...normal,invoice_required:false},
  {...normal,settlement_mode:'prepaid'},
  {...normal,status:'cancelled'},
  {...normal,status:'uploading'}
 ])assert.equal(allowed(row,[]),false);
 assert.equal(allowed(normal,[{key:'missing'}]),false);
 let calls=0,selects=0;
 const db={query:async(sql,values)=>{
  assert.match(sql,/SELECT \* FROM orders WHERE id=\$1 AND lab_id=\$2/);
  assert.deepEqual(values,['order1','lab1']);selects++;
  return{rows:[{...normal,invoice_id:'inv187'}]};
 }};
 const creator=async(_db,labId,orderId)=>{calls++;assert.equal(_db,db);assert.equal(labId,'lab1');assert.equal(orderId,'order1');return{id:'inv187',number:187}};
 const created=await issue(db,'lab1','order1',normal,[],creator);
 assert.equal(created.invoice.id,'inv187');
 assert.equal(created.order.invoice_id,'inv187');
 assert.equal(calls,1);assert.equal(selects,1);
 await issue(db,'lab1','order1',{...normal,invoice_required:false},[],creator);
 await issue(db,'lab1','order1',normal,[{key:'missing'}],creator);
 assert.equal(calls,1,'never issue excluded or incompletely priced invoices');
});
test('ready is allowed to reach the original transactional invoice creator; prepaid and final delivery stay protected',async()=>{
 const {labOrderStageInvoiceGuard:guard}=await import(pathToFileURL(path.resolve('dist/api/lab-invoice-stage-guard.js')));
 let inv=false,lookups=0;
 const db={query:async()=>{lookups++;return{rowCount:inv?1:0}}};
 const ledger={id:'order',invoice_required:true,settlement_mode:'ledger'};
 for(const stage of ['downloaded','printing','reviewing','ready_print','printed','binding','ready'])
  assert.equal(await guard(db,'lab',ledger,stage),null);
 assert.equal(lookups,0,'after-print flow must not require invoice before ready');
 assert.equal((await guard(db,'lab',ledger,'completed')).error,'order_invoice_required');
 inv=true;
 assert.equal(await guard(db,'lab',ledger,'completed'),null);
 inv=false;
 assert.equal((await guard(db,'lab',{...ledger,settlement_mode:'prepaid'},'printing')).error,'order_invoice_required');
 assert.equal(await guard(db,'lab',{...ledger,invoice_required:false},'completed'),null);
});
test('native invoice PDF worker cannot auto-open a previous invoice after update or retry',()=>{
 const src=read('scripts/r1581-download-feedback.js.txt'),a=src.indexOf('function pb1581OpenInvoice('),b=src.indexOf("\naddEventListener('photobridge-auth-session-changed'",a);
 assert(a>=0&&b>a);
 const items=[],set=new Set(),sandbox={
  window:{pbNativeStorage:true,pbDesktopEvents:{}},pb1581Invoices:items,pb1581Shown:set,
  location:{pathname:'/lab/finance'},
  Dn(){throw Error('background navigation is forbidden')},
  dispatchEvent(){throw Error('background invoice preview event forbidden')},
  CustomEvent:function(){},console
 };
 vm.runInNewContext(src.slice(a,b),sandbox);
 sandbox.pb1581OpenInvoice({id:'invoice187',number:187},'order','lab');
 sandbox.pb1581OpenInvoice({id:'invoice187',number:187},'order','lab');
 assert.equal(items.length,0,'background event must not queue an invoice modal');
 assert.equal(set.size,1,'background dedupe recorded');
});
test('user price save preserves R1577 pending/refresh and previews only the newly confirmed invoice',async()=>{
 const snippet=read('scripts/r1613-on-pricing-saved.js.txt');
 const events=[],order={id:'order-42',number:42,customer_name:'Customer',downloaded_at:'2026-11-05'};
 const invoice={id:'invoice-new',number:188,pdf_ready:false};
 const sandbox={
  Se:{order,resume:'none'},Fe:value=>events.push(['closePricing',value]),
  C:value=>events.push(['pending',value]),
  f:fn=>events.push(['rowsUpdated',!!fn]),
  Me:async(url)=>{events.push(['getOrder',url]);return{order:{...order,invoice_id:invoice.id}}},
  ye:async()=>events.push(['reloadOrders']),h:null,Tt:async()=>{},
  un:async()=>events.push(['resumeReady']),
  P:message=>events.push(['notice',message]),
  V:value=>String(value),
  pb1547CompletePdf:async()=>events.push(['pdf',invoice.id]),
  pb1568AfterManualDownload:async()=>{throw Error('must not retry when server issued invoice')},
  pb1547Notice:()=>{},
  Qn:async id=>events.push(['preview',id]),
  ai:()=>false,t:{name:'Lab'},
  window:{setTimeout(callback){events.push(['schedule']);callback()}},
 };
 vm.runInNewContext(snippet+';',sandbox);
 await sandbox.Nn({invoice,ready:true,order});
 assert.equal(events.filter(v=>v[0]==='pdf').length,1);
 assert.deepEqual(events.filter(v=>v[0]==='preview'),[['preview',invoice.id]]);
 assert.deepEqual(events.filter(v=>v[0]==='pending').map(x=>x[1]),[order.id,'']);
 assert.equal(events.some(v=>v[0]==='schedule'),false,'do not replay unrelated stage');
 assert.ok(events.some(v=>v[0]==='reloadOrders'),'old refresh behavior must be retained');
});
test('R1613 appears in site/Windows, with middle column headings centered, active badge pulse and sorted manifest',()=>{
 const server=read('dist/api/server.js');
 assert.match(server,/R1613 manual priced invoice/);
 assert.match(server,/issueAfterManualPriceConfirmation/);
 const build=read('scripts/liara-fast-build.mjs');
 assert.ok(build.indexOf("enable-r1613-lab-invoice-ui.mjs")>build.indexOf("enable-r1612-lab-spinner-discount-modal.mjs"));
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const file=root+'/assets/index-UIRefine-v655-r84.js',bundle=read(file),index=read(root+'/index.html');
  const css=read(root+'/photobridge-r1613-lab-stage-table.css');
  assert.match(bundle,/PB1613 manual pricing completion/);
  assert.match(bundle,/await Qn\(issued\.id/);
  const guardSource=bundle.match(/function pb1603InvoicePending\(order\)\{[^}]+\}/)?.[0];
  const stageSource=bundle.match(/function pb1603StageInvoicePending\(order,stage\)\{[^}]+\}/)?.[0];
  assert.ok(guardSource&&stageSource,'stage UI guards are present in generated bundle');
  const context={};
  vm.runInNewContext(guardSource+'\n'+stageSource,context);
  const pending={id:'order',status:'downloaded',downloaded_at:'2026-11-05',invoice_required:true,settlement_mode:'ledger'};
  assert.equal(context.pb1603StageInvoicePending(pending,'print'),false);
  assert.equal(context.pb1603StageInvoicePending(pending,'ready'),false);
  assert.equal(context.pb1603StageInvoicePending(pending,'completed'),true);
  assert.match(index,/pricedInvoice=r1613/);
  assert.match(index,/photobridge-r1613-lab-stage-table\.css\?v=r1613/);
  assert.match(css,/thead th:nth-child\(n\+2\)/);
  assert.match(css,/tbody td/);
  assert.match(css,/pb1613BadgeHeartbeat/);
  assert.match(css,/pb1613InnerSpin/);
  const a=css.indexOf('> .timelineDot {'),b=css.indexOf('> .timelineDot::after {',a),badges=css.slice(a,b);
  assert.doesNotMatch(badges,/transform:rotate/);
  assert.doesNotMatch(badges,/left:|right:|top:|bottom:/,'badge CSS never repositions the circle');
 }
 const native='dist/web/lab-desktop-ui',manifest=JSON.parse(read(native+'/manifest.json'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-r1613-lab-stage-table.css']){
  const item=manifest.files.find(f=>f.name===name);
  assert(item,'missing '+name);
  assert.equal(item.sha256,crypto.createHash('sha256').update(fs.readFileSync(native+'/'+name)).digest('hex'));
 }
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
});
