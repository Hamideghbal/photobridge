'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url'),path=require('node:path');
const read=p=>fs.readFileSync(p,'utf8');
const load=()=>import(pathToFileURL(path.resolve('dist/api/no-print-workflow.js')));
async function transition({status='received',pure=true,paid=true,existingInvoice=false,missing=false,revision=1,exempt=false}={}){
 const mod=await load(),guard=await import(pathToFileURL(path.resolve('dist/api/lab-invoice-stage-guard.js')));
 const source=read('dist/api/server.js'),a=source.indexOf("if (labOrder && req.method === 'PATCH')"),b=source.indexOf('// PB1181 mark removed photos',a);assert(a>=0&&b>a);
 let response,updated,invoiceCount=0,rollbacks=0,committed=false,released=false;const events=[],queries=[];
 const before={id:'order',mode:'print',status:'sent',invoice_required:!exempt,document_revision:1,customer_id:'customer',settlement_mode:paid?'ledger':'prepaid',payment_status:paid?'not_required':'awaiting_receipt'};
 const c={async query(sql,args){queries.push({sql,args});if(sql==='BEGIN')return {rows:[]};if(sql==='ROLLBACK'){rollbacks++;return {rows:[]}}if(sql==='COMMIT'){committed=true;return {rows:[]}}if(sql.includes('no_print_order FROM orders'))return {rows:[{no_print_order:pure}]};if(sql.startsWith('SELECT * FROM orders'))return {rowCount:1,rows:[before]};if(sql.startsWith('SELECT id FROM invoices'))return {rowCount:existingInvoice?1:0,rows:existingInvoice?[{id:'invoice'}]:[]};if(sql.startsWith('UPDATE orders SET status=')){updated={...before,status:args[2],printed_at:null};return {rows:[updated]}}if(sql.startsWith('UPDATE order_files'))return {rows:[]};throw Error(sql)},release(){released=true}};
 const env={req:{method:'PATCH'},bodyJson:async()=>({status,expectedRevision:revision}),labOrder:['','order'],labId:'lab',a:{userId:'manager'},pool:{connect:async()=>c},res:{},sendJson:(res,status,body)=>{response={status,body};return response},getOriginalRetentionDays:async()=>7,labOrderStageInvoiceGuard:guard.labOrderStageInvoiceGuard,...mod,orderInvoicePriceRequirements:async()=>missing?[{resolved:false}]:[],createOrGetInvoice:async()=>{invoiceCount++;return {id:'invoice',total:100}},statusEvent:async(c,order,status)=>events.push(status),audit:async()=>{},publishCustomerEvent(){},notifyLabCustomerForStatus:async()=>{},console};
 await vm.runInNewContext('(async()=>{'+source.slice(a,b)+'})()',env);
 return {response,updated,invoiceCount,rollbacks,committed,released,events,queries};
}
test('R1798 no-print classification is scoped to actual products, not a supplied flag or price',async()=>{
 const {noPrintOrderSql,isNoPrintOrder}=await load();const sql=noPrintOrderSql('o');assert(sql.includes("COALESCE(f.print_type,'')<>'none'"));assert(sql.includes('f.lab_id=o.lab_id'));assert(sql.includes('EXISTS'));assert.throws(()=>noPrintOrderSql('o;DROP'),/invalid_order_alias/);
 let args;assert.equal(await isNoPrintOrder({query:async(s,p)=>{args=p;return {rows:[{no_print_order:true}]}}},'lab','order'),true);assert.deepEqual(args,['order','lab']);assert.equal(await isNoPrintOrder({query:async()=>({rows:[]})},'other','order'),false);
});
test('R1798 product packing creates an invoice without downloading or activating print stages',async()=>{
 const r=await transition();assert.equal(r.response.status,200);assert.equal(r.response.body.order.no_print_order,true);assert.equal(r.updated.status,'received');assert.equal(r.updated.printed_at,null);assert.equal(r.invoiceCount,1);assert(r.committed&&r.released);assert.deepEqual(r.events,['received']);
});
test('R1798 direct print-stage calls are rejected for products while ordinary/mixed orders retain them',async()=>{
 for(const status of ['printing','reviewing','needs_fix','ready_print','printed','ready']){const r=await transition({status});assert.equal(r.response.status,409,status);assert.equal(r.response.body.error,'no_print_order_stage');assert.equal(r.updated,undefined);assert.equal(r.invoiceCount,0);assert.equal(r.rollbacks,1)}
 const mixed=await transition({status:'printing',pure:false});assert.equal(mixed.response.status,200);assert.equal(mixed.updated.status,'printing');
 const legacy=await transition({status:'downloaded'});assert.equal(legacy.updated.status,'received');assert.deepEqual(legacy.events,['received']);
});
test('R1798 packing/delivery preserve invoice, payment, revision and exemption safeguards',async()=>{
 assert.equal((await transition({paid:false})).response.body.error,'payment_required');assert.equal((await transition({revision:0})).response.body.error,'shared_document_changed');
 const blocked=await transition({status:'completed'});assert.equal(blocked.response.body.error,'order_invoice_required');assert.equal(blocked.updated,undefined);
 const done=await transition({status:'completed',existingInvoice:true});assert.equal(done.response.status,200);assert.equal(done.updated.status,'completed');assert.equal(done.updated.printed_at,null);assert(done.queries.some(q=>q.sql.startsWith('UPDATE order_files')));
 const unpriced=await transition({missing:true});assert.equal(unpriced.response.status,200);assert.equal(unpriced.invoiceCount,0,'unpriced goods can be packed but not falsely invoiced');
 const exempt=await transition({exempt:true});assert.equal(exempt.invoiceCount,0);
});
test('R1798 product-only receipts differ from photo receipts, including legacy no-paper invoice rows',()=>{
 const ui=read('dist/web/assets/index-UIRefine-v655-r84.js'),a=ui.indexOf('function pbR1698Words('),b=ui.indexOf('function Vy(',a),ctx={vh:i=>i.items,ph:i=>i.description};vm.createContext(ctx);vm.runInContext(read('scripts/r1798-no-print-ui.js.txt')+ui.slice(a,b),ctx);
 const product={items:[{componentKind:'frame',description:'قاب چوبی',quantity:2,unitPrice:50000,lineTotal:100000}],total:100000};
 const html=ctx.pbR1698ApprovedThermal(product,false);assert(html.includes('DO NOT PRINT PHOTO'));assert(html.includes('سفارش شاسی / قاب'));assert(html.includes('رسید سفارش کالا'));assert(html.includes('<th class="price">فی</th>'));
 assert(!ctx.pbR1698ApprovedThermal({...product,items:[...product.items,{componentKind:'print',description:'چاپ رایگان',quantity:1,unitPrice:0,lineTotal:0}]},false).includes('DO NOT PRINT PHOTO'));
 assert(ctx.pb1798NoPrintInvoice({items:JSON.stringify([{printType:'none',chassis:true}])}));assert(!ctx.pb1798NoPrintInvoice({items:[]}));
});
test('R1798 web/native expose only product stages, settings fee preview and valid native checksums',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){const s=read(root+'/assets/index-UIRefine-v655-r84.js');assert.doesNotThrow(()=>new vm.Script(s));assert(s.includes('pb1798NoPrintOrder(le)?[{key:"received",label:"بسته‌بندی"},{key:"completed",label:"تحویل"}]:mn'));assert(s.includes('e.jsx(PB1798ThermalColumnsPreview,{})'));assert(s.includes('const pt=pb1798NoPrintOrder(De)?'));assert(read(root+'/index.html').includes('noPrint=r1798'))}
 const root='dist/web/lab-desktop-ui',s=read(root+'/assets/index-UIRefine-v655-r84.js');assert(s.includes('async function pb1568ProcessOrder(lab,order,settings){\n if(pb1798NoPrintOrder(order))return;'));assert(s.includes('pb1798ProductProgress'));assert(read('dist/web/photobridge-r1798-no-print.css').includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
 const m=JSON.parse(read(root+'/manifest.json'));for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-r1798-no-print.css'])assert.equal(m.files.find(f=>f.name===name).sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));assert.equal(m.build,crypto.createHash('sha256').update(JSON.stringify(m.files)).digest('hex'));
});
