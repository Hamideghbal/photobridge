'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const read=p=>fs.readFileSync(p,'utf8');
const api=read('dist/api/server.js');
const extract=name=>{const a=api.indexOf('async function '+name+'(');assert(a>=0,name);const next=/\n(?:async )?function /.exec(api.slice(a+18));assert(next,name+' end');return api.slice(a,a+18+next.index)};
const plain=value=>JSON.parse(JSON.stringify(value));
const customId='c_12345678-1234-4123-8123-123456789abc';
const base={enabled:true,printTariffCatalog:{albumPricingMode:'separate',types:[{id:'album_binding_price',kind:'binding',name:'صحافی آلبوم',active:true},{id:customId,kind:'binding',name:'فلت ضخیم',active:true}],rates:{print1:{[customId]:200}}},sizes:[{id:'size1',printSizeId:'print1',label:'20x30',widthCm:20,heightCm:30,minSpreads:1,maxSpreads:300,bindingPrice:100,luster:10,silk:20,metallic:30}],covers:[{id:'cover',name:'جلد',price:50,colors:[]}],packages:[],extras:[{id:'extra',name:'خدمت اضافه',price:5,pricingMode:'per_spread'}]};
const input={sizeId:'size1',spreads:3,paperType:'luster',paperCounts:{luster:2,silk:1,metallic:0},coverId:'cover',extraIds:['extra']};
function snapshot(catalog){return vm.runInNewContext('('+extract('albumOrderSnapshot')+')',{albumCatalogForLab:async()=>catalog,albumMoney:n=>Math.max(0,Math.round(Number(n||0))),invoicePrintTypeLabel:s=>s,Date})}
const combined=()=>({...base,printTariffCatalog:{...base.printTariffCatalog,albumPricingMode:'combined'}});

test('R1795 mode defaults to separate and persists per lab without changing models, stock, or other preferences',async()=>{
 const mod=await import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')));
 assert.equal(mod.normalizePrintCatalog().albumPricingMode,'separate');
 assert.equal(mod.normalizePrintCatalog({albumPricingMode:'forged'}).albumPricingMode,'separate');
 const labs=new Map([['A',{printTariffCatalog:mod.normalizePrintCatalog({albumPricingMode:'separate',rates:{},stocks:{}}),otherSetting:true}],['B',{printTariffCatalog:mod.normalizePrintCatalog()}]]);
 const pool={async query(sql,args){const prefs=labs.get(args[0]);return {rowCount:1,rows:[{ui_preferences:prefs}]}},async connect(){return {query:async(sql,args)=>{if(sql==='BEGIN'||sql==='COMMIT'||sql==='ROLLBACK')return {rows:[]};if(sql.includes('FOR UPDATE'))return pool.query(sql,args);if(sql.startsWith('UPDATE labs SET ui_preferences=jsonb_set')){labs.get(args[0]).printTariffCatalog=JSON.parse(args[1]);return {rowCount:1,rows:[]}}throw Error(sql)},release(){}}}};
 async function request(labId,body){let response;await mod.handleLabPrintCatalog({req:{method:'PATCH'},res:{},url:{pathname:'/api/lab/print-catalog/type'},pool,labId,bodyJson:async()=>body,sendJson:(res,status,data)=>{response={status,data}},audit:async()=>{},userId:'manager'});return response}
 const original=plain(labs.get('A'));
 assert.equal((await request('A',{albumPricingMode:'combined'})).status,200);
 assert.equal(labs.get('A').printTariffCatalog.albumPricingMode,'combined');
 assert.equal(labs.get('B').printTariffCatalog.albumPricingMode,'separate');
 assert.deepEqual(labs.get('A'),{...original,printTariffCatalog:{...original.printTariffCatalog,albumPricingMode:'combined'}});
 assert.equal((await request('A',{albumPricingMode:'invalid'})).status,400);
 assert.equal(labs.get('A').printTariffCatalog.albumPricingMode,'combined');
 const rates=mod.applyPrintRates(labs.get('A').printTariffCatalog,[],[]);
 assert.equal(mod.normalizePrintCatalog(rates).albumPricingMode,'combined','saving tariff rates must retain mode');
});
test('R1795 mixed papers charge separately by default, but combined mode uses only the per-leaf binding rate',async()=>{
 const separate=await snapshot(base)('lab',input),bundle=await snapshot(combined())('lab',input);
 assert.equal(separate.pricing.printTotal,40);
 assert.equal(separate.pricing.total,405);
 assert.equal(bundle.pricing.albumPricingMode,'combined');
 assert.equal(bundle.pricing.bindingTotal,300);
 assert.equal(bundle.pricing.printTotal,0);
 assert.equal(bundle.pricing.total,365);
 assert.equal(bundle.pricing.manualPrintRequired,false);
 assert.equal(bundle.paperBreakdown.length,2,'production paper choices remain recorded');
 assert(bundle.paperBreakdown.every(p=>p.unitPrice===0&&p.lineTotal===0));
 const custom=await snapshot(combined())('lab',{...input,bindingTypeId:customId,albumPricingMode:'separate'});
 assert.equal(custom.pricing.bindingTotal,600);
 assert.equal(custom.pricing.total,665);
 assert.equal(custom.binding.name,'فلت ضخیم');
 const missingPaper={...combined(),sizes:base.sizes.map(s=>({...s,luster:null,silk:null}))};
 assert.equal((await snapshot(missingPaper)('lab',input)).pricing.total,365);
 assert.equal((await snapshot({...missingPaper,printTariffCatalog:base.printTariffCatalog})('lab',input)).pricing.manualPrintRequired,true);
});

async function invoice(ad,existing){
 const order={id:'order1',customer_id:'customer1',mode:'album',album_data:ad,lab_name:'Lab',customer_name:'Customer',number:123};
 let saved,queries=0;
 const c={async query(sql,args){queries++;if(sql.includes('FROM invoices i JOIN'))return {rowCount:existing?1:0,rows:existing?[existing]:[]};if(sql.includes('FROM orders o JOIN')||sql.startsWith('SELECT mode,album_data'))return {rowCount:1,rows:[order]};if(sql.includes('pg_advisory_xact_lock'))return {rows:[]};if(sql.startsWith('INSERT INTO invoices')){saved={id:'inv',items:JSON.parse(args[3]),subtotal:args[4],total:args[4],pdf_ready:true,account_balance_at_issue:0};return {rows:[saved]}}if(sql.startsWith('UPDATE invoices'))return {rows:[saved]};if(sql.startsWith('UPDATE orders'))return {rows:[order]};throw Error(sql)}};
 const context={labFinanceCustomerNameSql:()=>"'Customer'",storageConfigured:false,invoicePrintTypeLabel:x=>x,postInvoiceFinance:async()=>{},maybeApplyLabBirthdayDiscount:async()=>{},maybeApplyCustomerBatchDiscount:async()=>{},customerReceivableBalance:async()=>0,invoicePricingRequiredError:rows=>Object.assign(Error('invoice_pricing_required'),{rows})};
 context.orderInvoicePriceRequirements=vm.runInNewContext('('+extract('orderInvoicePriceRequirements')+')',context);
 const fn=vm.runInNewContext('('+extract('createOrGetInvoice')+')',context);
 return {result:await fn(c,'lab','order1'),queries};
}
test('R1795 actual invoices have one combined line, preserve custom model names, and leave existing invoices intact',async()=>{
 const ad=await snapshot(combined())('lab',input);
 const bundled=(await invoice(ad)).result;
 assert.equal(bundled.total,365);
 assert(!bundled.items.some(i=>i.kind==='album_print'));
 const line=bundled.items.find(i=>i.kind==='album_binding');
 assert.equal(line.unitPrice,100);assert.equal(line.quantity,3);assert.match(line.description,/چاپ و صحافی/);
 assert.equal((await invoice(await snapshot(base)('lab',input))).result.total,405);
 const custom=await snapshot(combined())('lab',{...input,bindingTypeId:customId});
 assert.match((await invoice(custom)).result.items.find(i=>i.kind==='album_binding').description,/فلت ضخیم/);
 const prior={id:'old',total:123,items:[{description:'original'}],pdf_ready:true,account_balance_at_issue:0};
 const old=await invoice(ad,prior);assert.equal(old.queries,1);assert.equal(old.result.total,123);assert.deepEqual(old.result.items,prior.items);
});
test('R1795 unpriced/custom-size combined albums ask for one combined manual price, never another print price',async()=>{
 const ad=await snapshot(combined())('lab',{...input,sizeId:'__custom__',customSize:{widthCm:21,heightCm:31}});
 assert.equal(ad.pricing.manualPrintRequired,false);assert.equal(ad.pricing.manualBindingRequired,true);assert.equal(ad.pricing.total,null);
 let rows;
 const req=vm.runInNewContext('('+extract('orderInvoicePriceRequirements')+')',{});
 rows=await req({query:async()=>({rowCount:1,rows:[{mode:'album',album_data:ad}]})},'lab','order');
 assert.deepEqual(Array.from(rows,r=>r.key),['album-custom-binding','album-custom-cover']);
 assert.match(rows[0].printTypeLabel,/چاپ و صحافی/);
 ad.pricing.manualBindingPrice=120;
 ad.pricing.manualCoverPrice=50;
 const inv=(await invoice(ad)).result;assert.equal(inv.total,425);assert(!inv.items.some(i=>i.kind==='album_print'));
});
test('R1795 editing an existing draft uses its frozen mode, including pre-feature separate drafts',async()=>{
 const start=api.indexOf("        if (cancelCustomerDraft && req.method === 'PATCH')"),end=api.indexOf("        if (cancelCustomerDraft && req.method === 'DELETE')",start);
 assert(start>=0&&end>start);
 async function patch(savedMode,currentCatalog){let response,updated;
  const order={mode:'album',album_data:{pricing:savedMode?{albumPricingMode:savedMode}:{}}};
  const pool={query:async(sql,args)=>sql.startsWith('SELECT')?{rowCount:1,rows:[order]}:(updated=JSON.parse(args[5]),{rowCount:1,rows:[{...order,album_data:updated}]})};
  const context={req:{method:'PATCH'},cancelCustomerDraft:['','order'],pool,labId:'lab',a:{userId:'user'},bodyJson:async()=>({delivery:'pickup',priority:'normal',albumData:{...input,albumPricingMode:'forged'}}),albumOrderSnapshot:snapshot(currentCatalog),audit:async()=>{},sendJson:(res,status,data)=>{response={status,data}},res:{}};
  await vm.runInNewContext('(async()=>{'+api.slice(start,end)+'})()',context);
  assert.equal(response.status,200);return updated;
 }
 assert.equal((await patch('combined',base)).pricing.albumPricingMode,'combined');
 assert.equal((await patch(undefined,combined())).pricing.albumPricingMode,'separate');
});
test('R1795 web and Windows install the setting, matching estimates, and valid update checksums',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const ui=read(root+'/assets/index-UIRefine-v655-r84.js'),intake=read(root+'/photobridge-r1137-lab-local-intake.js');
  assert.doesNotThrow(()=>new vm.Script(ui));assert.doesNotThrow(()=>new vm.Script(intake));
  assert(ui.includes('PB1795BindingPricingSettings,{settings,onSaved:'));
  assert(ui.includes('ma=Tt||pb1795Combined?0:yt.reduce'));
  assert(ui.includes('!pb1795Combined&&yt.map'));
  assert(intake.includes('if(!count||album.printTariffCatalog?.albumPricingMode==="combined")continue'));
  assert(read(root+'/index.html').includes('bindingMode=r1795'));
 }
 const root='dist/web/lab-desktop-ui',m=JSON.parse(read(root+'/manifest.json'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','photobridge-r1137-lab-local-intake.js','index.html','photobridge-r1795-binding-pricing.css'])assert.equal(m.files.find(f=>f.name===name).sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 assert.equal(m.build,crypto.createHash('sha256').update(JSON.stringify(m.files)).digest('hex'));
});
