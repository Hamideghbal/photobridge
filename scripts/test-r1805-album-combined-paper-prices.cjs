
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url'),path=require('node:path');
const read=p=>fs.readFileSync(p,'utf8'),plain=x=>JSON.parse(JSON.stringify(x));
const server=read('dist/api/server.js');
const extract=name=>{
 const start=server.indexOf('async function '+name+'(');
 assert(start>=0,name+' start');
 const next=/\n(?:async )?function /.exec(server.slice(start+18));
 assert(next,name+' end');
 return server.slice(start,start+18+next.index);
};
const base={
 enabled:true,
 printTariffCatalog:{
  albumPricingMode:'separate',
  types:[{id:'album_binding_price',kind:'binding',name:'صحافی اصلی',active:true},{id:'c_12345678-1234-4123-8123-123456789abc',kind:'binding',name:'صحافی دوم',active:true}],
  rates:{p:{'c_12345678-1234-4123-8123-123456789abc':170}},
  albumCombinedRates:{p:{luster:100,silk:200,metallic:300}}
 },
 sizes:[{id:'s',printSizeId:'p',label:'20×30',widthCm:20,heightCm:30,active:true,bindingPrice:80,luster:15,silk:20,metallic:35,minSpreads:1,maxSpreads:500}],
 covers:[{id:'cover',name:'جلد آلبوم',price:50,colors:[]}],packages:[],extras:[]
};
const input={sizeId:'s',spreads:3,paperType:'luster',paperCounts:{luster:2,silk:1,metallic:0},coverId:'cover'};
const makeSnapshot=catalog=>vm.runInNewContext('('+extract('albumOrderSnapshot')+')',{albumCatalogForLab:async()=>catalog,albumMoney:n=>Math.max(0,Math.round(Number(n||0))),invoicePrintTypeLabel:p=>({luster:'گلاسه',silk:'سیلک',metallic:'متالیک'}[p]||p),Date});
const combined=()=>({...base,printTariffCatalog:{...base.printTariffCatalog,albumPricingMode:'combined'}});
test('R1805: separate remains the default and multiple binding models stay intact',async()=>{
 const mod=await import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')));
 const empty=mod.normalizePrintCatalog({});
 assert.equal(empty.albumPricingMode,'separate');
 assert.equal(empty.types.filter(t=>t.kind==='binding'&&t.active).length,1);
 const multiple=mod.normalizePrintCatalog(base.printTariffCatalog);
 assert.equal(multiple.albumPricingMode,'separate');
 assert.equal(multiple.types.filter(t=>t.kind==='binding'&&t.active).length,2);
 assert.equal(multiple.albumCombinedRates.p.silk,200);
 const separate=await makeSnapshot(base)('lab',input);
 assert.equal(separate.pricing.albumPricingMode,'separate');
 assert.equal(separate.pricing.printTotal,50);
 assert.equal(separate.pricing.bindingTotal,240);
 assert.equal(separate.pricing.total,340);
});
test('R1805: three paper tariff values survive a validated atomic price save',async()=>{
 const mod=await import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')));
 let c=mod.normalizePrintCatalog({...base.printTariffCatalog,albumPricingMode:'combined'});
 c=mod.applyPrintRates(c,[{sizeId:'p',customRates:{},combinedAlbumRates:{luster:110,silk:220,metallic:330}}],['p']);
 assert.deepEqual(plain(c.albumCombinedRates.p),{luster:110,silk:220,metallic:330});
 const roundTrip=mod.normalizePrintCatalog(c);
 assert.deepEqual(plain(roundTrip.albumCombinedRates.p),{luster:110,silk:220,metallic:330});
 assert.throws(()=>mod.applyPrintRates(c,[{sizeId:'p',combinedAlbumRates:{silk:-1}}],['p']),/album_combined_price_invalid/);
 assert.throws(()=>mod.applyPrintRates(c,[{sizeId:'p',combinedAlbumRates:{unknown:99}}],['p']),/album_combined_prices_invalid/);
 assert.throws(()=>mod.addPrintType(c,{kind:'binding',name:'مدل جدید'}),/album_binding_model_locked/);
 const separate=mod.normalizePrintCatalog({...c,albumPricingMode:'separate'});
 assert.doesNotThrow(()=>mod.addPrintType(separate,{kind:'binding',name:'مدل جدید'}));
});
test('R1805: mixed paper combined order uses each saved rate, not the previous single price',async()=>{
 const snapshot=await makeSnapshot(combined())('lab',{...input,bindingTypeId:'c_12345678-1234-4123-8123-123456789abc'});
 assert.equal(snapshot.pricing.albumPricingMode,'combined');
 assert.equal(snapshot.binding.id,'album_binding_price');
 assert.equal(snapshot.pricing.printTotal,0);
 assert.equal(snapshot.pricing.bindingTotal,400);
 assert.equal(snapshot.pricing.total,450);
 assert.equal(snapshot.pricing.manualBindingRequired,false);
 assert.deepEqual(plain(snapshot.pricing.combinedPaperBreakdown.map(x=>[x.paperType,x.count,x.unitPrice,x.lineTotal])),[['luster',2,100,200],['silk',1,200,200]]);
});
test('R1805: missing combined paper tariff never borrows the old default single rate',async()=>{
 const c=combined();c.printTariffCatalog={...c.printTariffCatalog,albumCombinedRates:{p:{luster:100,silk:null,metallic:300}}};
 const snapshot=await makeSnapshot(c)('lab',input);
 assert.equal(snapshot.pricing.manualBindingRequired,true);
 assert.equal(snapshot.pricing.manualReason,'missing_combined_paper_tariff');
 assert.equal(snapshot.pricing.total,null);
 const good=await makeSnapshot(c)('lab',{...input,paperCounts:{luster:3,silk:0,metallic:0}});
 assert.equal(good.pricing.manualBindingRequired,false);
 assert.equal(good.pricing.bindingTotal,300);
});
test('R1805: actual issued invoice is itemized by combined paper and old snapshots remain readable',async()=>{
 const snapshot=await makeSnapshot(combined())('lab',input);
 const order={id:'ord',customer_id:'customer',mode:'album',album_data:snapshot,number:10};
 let saved;
 const c={query:async(sql,args)=>{
  if(sql.includes('FROM invoices i JOIN'))return {rowCount:0,rows:[]};
  if(sql.includes('FROM orders o JOIN')||sql.startsWith('SELECT mode,album_data'))return {rowCount:1,rows:[order]};
  if(sql.includes('pg_advisory_xact_lock'))return {rows:[]};
  if(sql.startsWith('INSERT INTO invoices')){saved={id:'inv',items:JSON.parse(args[3]),subtotal:args[4],total:args[4],pdf_ready:true,account_balance_at_issue:0};return {rows:[saved]}}
  if(sql.startsWith('UPDATE invoices'))return {rows:[saved]};
  if(sql.startsWith('UPDATE orders'))return {rows:[order]};
  throw Error('unexpected '+sql.slice(0,110));
 }};
 const context={labFinanceCustomerNameSql:()=>"'Customer'",storageConfigured:false,invoicePrintTypeLabel:p=>({luster:'گلاسه',silk:'سیلک',metallic:'متالیک'}[p]||p),postInvoiceFinance:async()=>{},maybeApplyLabBirthdayDiscount:async()=>{},maybeApplyCustomerBatchDiscount:async()=>{},customerReceivableBalance:async()=>0,invoicePricingRequiredError:rows=>Object.assign(Error('invoice_pricing_required'),{rows})};
 context.orderInvoicePriceRequirements=vm.runInNewContext('('+extract('orderInvoicePriceRequirements')+')',context);
 const fn=vm.runInNewContext('('+extract('createOrGetInvoice')+')',context);
 const invoice=await fn(c,'lab','ord');
 const rows=invoice.items.filter(x=>x.kind==='album_binding');
 assert.equal(rows.length,2);
 assert.deepEqual(plain(rows.map(x=>[x.quantity,x.unitPrice,x.lineTotal])),[[2,100,200],[1,200,200]]);
 assert(rows.every(row=>row.description.includes('چاپ و صحافی')));
 assert(!invoice.items.some(row=>row.kind==='album_print'));
 assert.equal(invoice.total,450);
});
test('R1805: single-model combined UI, mode chooser only in album settings and preview marked per paper',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const s=read(root+'/assets/index-UIRefine-v655-r84.js');
  assert.doesNotThrow(()=>new vm.Script(s));
  const a=s.indexOf('function tw('),b=s.indexOf('function Na(t)',a),tariff=s.slice(a,b);
  assert(a>=0&&b>a);
  assert(!tariff.includes('PB1795BindingPricingSettings,{onSaved:'));
  assert(tariff.includes('pb1805TariffFields(pb1800TariffFields('));
  assert(tariff.includes('pb1539.albumPricingMode!=="combined"&&e.jsx("button"'));
  assert(tariff.includes('combinedAlbumRates:Object.fromEntries('));
  assert(s.includes('PB1795BindingPricingSettings,{settings,onSaved:'));
  assert(s.includes('pb1805Missing=pb1795Combined'));
  assert(s.includes('pb1805CombinedAlbum'));
  const css=read(root+'/photobridge-r1805-combined-album.css');
  assert(css.includes('.pb1805CombinedAlbum .pb1539BindingField{display:none'));
 }
});
test('R1805: walk-in quote uses per-paper weighted combined price and one model',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const s=read(root+'/photobridge-r1137-lab-local-intake.js');
  assert.doesNotThrow(()=>new vm.Script(s));
  assert(s.includes("if(bindingCatalog.albumPricingMode==='combined'){if(!files.length)return null;"));
  assert(s.includes('const binding=pb1551BindingPrice(size,list);'));
  assert(s.includes("bindingCatalog.albumPricingMode!=='combined'||type.id==='album_binding_price'"));
 }
});
test('R1805: Windows Lab hot-update checksums match all modified final assets',()=>{
 const root='dist/web/lab-desktop-ui',m=JSON.parse(read(root+'/manifest.json'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','photobridge-r1137-lab-local-intake.js','photobridge-r1805-combined-album.css','index.html']){
  const entry=m.files.find(e=>e.name===name);assert(entry,'missing manifest '+name);
  assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'),name);
 }
 assert.equal(m.build,crypto.createHash('sha256').update(JSON.stringify(m.files)).digest('hex'));
});

test('R1805b install guard hides binding creation regardless of its historical button label',()=>{
 const installer=read('scripts/enable-r1805-album-combined-ui.mjs');
 const begin=installer.indexOf('  const pb1805CreateButton='),end=installer.indexOf('\n  s=s.replace(pb1805CreateButton,',begin);
 assert(begin>=0&&end>begin,'combined-mode binding action guard is present');
 const sample=read('scripts/enable-r1777-chassis-frame-model-pricing.mjs').match(/const button='([^']+)'/);
 assert(sample,'R1777 changed the binding action');
 const action=installer.slice(begin,end);
 const testAction=label=>vm.runInNewContext('(function(s){'+action+';return [...s.matchAll(pb1805CreateButton)].length})('+JSON.stringify(label)+')');
 assert.equal(testAction(sample[1]),1,'new button label matches');
 assert.equal(testAction(sample[1].replace('children:"صحافی جدید"','children:"+ مدل صحافی جدید"')),1,'legacy button label matches');
 assert(installer.includes("s=s.replace(pb1805CreateButton,full=>'pb1539.albumPricingMode!==\"combined\"&&'+full)"));
});
