'use strict';const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const helpers=fs.readFileSync('scripts/r1802-invoice-album-ui.js.txt','utf8');
const items=[{componentKind:'chassis',description:'۲۰×۳۰ · شاسی مدل ضخیم',quantity:2,unitPrice:50000,lineTotal:100000}];
function context(extra={}){const c={vh:i=>Array.isArray(i?.items)?i.items:[],ci:c=>c.name,...extra};vm.createContext(c);vm.runInContext(helpers,c);return c}
test('R1802 summary invoice fetches original component details rather than inventing a total-only line',async()=>{
 let path;const c=context({Me:async url=>{path=url;return {invoice:{id:'invoice',items,total:100000}}}}),summary={id:'invoice',order_id:'order',total:100000};
 const full=await c.pb1802CompleteInvoice(summary);assert.equal(path,'/api/lab/orders/order');assert.equal(full.items[0].description,items[0].description);assert.equal(full.items[0].quantity,2);assert.equal(full.items[0].unitPrice,50000);assert.equal(summary.items,undefined);
 const kept=c.pb1802MergeInvoice(full,summary);assert.equal(kept.items.length,1);assert.equal(c.pb1802MergeInvoice(full,{...summary,total:200000}).items,undefined);
 c.Me=async()=>({invoice:{id:'different',items}});assert.equal(await c.pb1802CompleteInvoice(summary),summary);
});
test('R1802 covers without color variants remain orderable; disabled colors do not become selectable',()=>{
 const c=context(),plain={id:'plain',colors:[]},blue={id:'blue',colors:[{name:'blue',active:true}]},off={id:'off',colors:[{name:'blue',active:false}]};
 assert.deepEqual(Array.from(c.pb1802CoversForColor([plain,blue,off],'blue'),v=>v.id),['plain','blue']);assert.deepEqual(Array.from(c.pb1802CoversForColor([plain,blue,off],''),v=>v.id),['plain']);
});
test('R1802 album receipt uses separate persistent state and never changes design-file download state',async()=>{
 const store=new Map(),calls=[];const c=context({Date,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},pb1568State:()=>null,pb1568Work:{},pb1568Problem:e=>e.message,pb1576QueuePrice:()=>{},Me:async url=>{calls.push(url);return {invoice:{id:'invoice',items}}},pb1568PersistPdf:async()=>calls.push('pdf'),pb1568Thermal:async(...args)=>calls.push(args)});
 const order={id:'order',mode:'album',status:'sent'},settings={autoPrintInvoice:true,autoDownloadEnabled:false};await c.pb1802AlbumReceipt('lab',order,settings);await c.pb1802AlbumReceipt('lab',order,settings);
 assert.deepEqual(calls,['/api/lab/orders/order/automation-invoice','pdf',['invoice','order','invoice']]);assert.equal([...store.keys()][0],'pb1802-album-receipt:lab:order');
 for(const o of [{...order,status:'cancelled'},{...order,id:'unpaid',settlement_mode:'prepaid',payment_status:'awaiting_receipt'}])await c.pb1802AlbumReceipt('lab',o,settings);assert.equal(calls.length,3);
});
const {submit}=require('./test-r1796-print-submit-terms.cjs');
test('R1802 priced album submission issues its invoice; unresolved prices and exemptions still block it',async()=>{
 for(const opts of [{album:true},{album:true,missingPrice:true},{album:true,exempt:true}]){const r=await submit(opts);if(r.error)throw r.error;assert.equal(r.response.status,200);assert.equal(r.invoiceCount,opts.missingPrice||opts.exempt?0:1)}
});
test('R1802 composed preview and PDF use authoritative rows and refreshed summaries preserve full details',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){const s=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');assert(s.includes('async function Wu(t){t=await pb1802CompleteInvoice'));assert(s.includes('order_id:le.id'));assert(s.includes('pb1802MergeInvoice(old,fresh)'));assert(s.includes('Ot=pb1802CoversForColor(ea,Je)'));assert(s.includes('albumOrderGrid pb1802CompactAlbum'));assert.doesNotThrow(()=>new vm.Script(s))}
});
test('R1802 unpriced album prints one nonfinancial ticket, then its financial invoice after pricing',async()=>{
 const store=new Map(),printed=[];let missing=true;const c=context({Date,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},pb1568State:()=>({phase:'complete'}),pb1568Work:{},pb1568Problem:e=>e.message,pb1576QueuePrice:()=>{},Me:async()=>{if(missing)throw Error('invoice_pricing_required');return {invoice:{id:'invoice',items}}},pb1568PersistPdf:async()=>{},pb1568Thermal:async kind=>printed.push(kind)});
 const order={id:'album',mode:'album',status:'sent'},settings={autoPrintInvoice:true,autoPrintMissingPriceTicket:true};await c.pb1802AlbumReceipt('lab',order,settings);c.pb1802ReceiptSave('lab','album',{...c.pb1802ReceiptState('lab','album'),retryAt:0});await c.pb1802AlbumReceipt('lab',order,settings);assert.deepEqual(printed,['ticket']);missing=false;await c.pb1802AlbumReceipt('lab',{...order,invoice_id:'invoice'},settings);assert.deepEqual(printed,['ticket','invoice']);
});
test('R1802 cover disable checkbox persists explicit menu setting without discarding the models',async()=>{
 const settings={coverCatalogEnabled:true,covers:[{id:'kept'}]};let state=settings,request;const c=context({x:{},e:{jsx:(tag,p)=>({tag,...p}),jsxs:(tag,p)=>({tag,...p})},Me:async(url,opt)=>{request={url,body:JSON.parse(opt.body)};return {ok:true,key:'coverCatalogEnabled',enabled:false}}});
 const view=c.PB1802CoverCatalogSetting({settings,setSettings:fn=>state=fn(state),busy:false,setBusy:()=>{},setNotice:()=>{},setError:()=>{}});assert.equal(view.children[0].checked,false);await view.children[0].onChange({target:{checked:true}});assert.equal(request.body.key,'coverCatalogEnabled');assert.equal(request.body.enabled,false);assert.equal(state.coverCatalogEnabled,false);assert.equal(state.covers[0].id,'kept');
});
test('R1802 the actual PDF renderer draws description, quantity, fee and amount from a hydrated goods invoice',async()=>{
 const s=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),a=s.indexOf('async function Wu('),b=s.indexOf('function ',a+25),texts=[],g=new Proxy({fillText:text=>texts.push(String(text))},{get:(o,k)=>o[k]||(()=>{})});
 const c=context({Me:async()=>({invoice:{id:'invoice',items,total:100000,subtotal:100000}}),oh:()=> 'lab',pb1674DirectCustomer:()=>false,document:{fonts:{ready:Promise.resolve()},createElement:()=>({getContext:()=>g})},V:v=>String(v),ph:i=>i.description,vn:()=>'',mh:async()=>new Uint8Array([1]),hh:()=>new Uint8Array([1]),Blob});
 vm.runInContext(s.slice(a,b),c);await c.Wu({id:'invoice',order_id:'order',total:100000});for(const text of [items[0].description,'2','50000','100000'])assert(texts.includes(text),text);
});
async function albumAutomation({device='primary',active=2,pending=0,paid=true,missing=false,existing=false}={}){
 const {handleLabAutomation}=await import('../dist/api/lab-auto-processing.js');let response,issued=0;const queries=[];
 const order={id:'11111111-1111-4111-8111-111111111111',mode:'album',status:'sent',invoice_required:true,settlement_mode:paid?'ledger':'prepaid',payment_status:paid?'not_required':'awaiting_receipt'};
 const c={query:async sql=>{queries.push(sql);if(['BEGIN','COMMIT','ROLLBACK'].includes(sql))return {rows:[]};if(sql.startsWith('SELECT * FROM orders'))return {rows:[order]};if(sql.includes(' no_print_order FROM orders'))return {rows:[{no_print_order:false}]};if(sql.includes('active_files'))return {rows:[{active_files:active,pending_files:pending}]};if(sql.includes('primary_download_device_id FROM labs'))return {rows:[{primary_download_device_id:'primary'}]};if(sql.startsWith('SELECT id FROM invoices'))return {rows:existing?[{id:'invoice'}]:[],rowCount:existing?1:0};throw Error(sql)},release(){}};
 await handleLabAutomation({req:{method:'POST'},res:{},url:new URL('http://localhost/api/lab/orders/'+order.id+'/automation-invoice'),labId:'lab',deviceId:device,pool:{connect:async()=>c,query:async()=>({rows:[{value:{}}]})},sendJson:(_,status,body)=>response={status,body},issueInvoice:async()=>{issued++;return {id:'invoice',items}},invoiceRequirements:async()=>missing?[{resolved:false,label:'جلد سفارشی'}]:[],storageConfigured:false});return {response,issued,queries};
}
test('R1802 actual album automation accepts fully uploaded sheets without advancing photo stages and keeps guards',async()=>{
 const existing=await albumAutomation({active:0,existing:true});assert.equal(existing.response.status,200);
 const ok=await albumAutomation();assert.equal(ok.response.status,200);assert.equal(ok.issued,1);assert(!ok.queries.some(q=>q.includes('UPDATE orders')));
 for(const [opts,error] of [[{active:0},'album_files_not_ready'],[{pending:1},'album_files_not_ready'],[{device:'secondary'},'not_primary_download_device'],[{paid:false},'payment_required'],[{missing:true},'invoice_pricing_required']]){const r=await albumAutomation(opts);assert.equal(r.response.body.error,error);assert.equal(r.issued,0)}
});
test('R1802 disabled cover catalog accepts text and freezes deferred pricing rather than a zero-priced cover',async()=>{
 const s=fs.readFileSync('dist/api/server.js','utf8'),a=s.indexOf('async function albumOrderSnapshot('),b=s.indexOf('\nasync function ',a+20);
 const catalog={enabled:true,coverCatalogEnabled:false,packageCatalogEnabled:false,extrasEnabled:false,sizes:[{id:'s',label:'20×30',bindingPrice:5000,luster:1000,minSpreads:1,maxSpreads:500}],covers:[],extras:[],packages:[]};
 const fn=vm.runInNewContext('('+s.slice(a,b)+')',{albumCatalogForLab:async()=>catalog,albumMoney:n=>Number(n||0),invoicePrintTypeLabel:t=>t,Date});
 const snapshot=await fn('lab',{sizeId:'s',spreads:2,paperType:'luster',coverRequest:'چرم مشکی با نوشته طلایی'});assert.equal(snapshot.cover.customRequest,'چرم مشکی با نوشته طلایی');assert.equal(snapshot.pricing.manualCoverRequired,true);assert.equal(snapshot.pricing.coverPrice,null);
});
