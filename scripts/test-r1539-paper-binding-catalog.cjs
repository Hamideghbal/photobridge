'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const {pathToFileURL}=require('node:url'),path=require('node:path');
async function catalog(){return import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')))}
test('lab-specific catalog offers defaults and multiple named binding and paper models',async()=>{
 const {normalizePrintCatalog,addPrintType,renamePrintType,applyPrintRates}=await catalog();
 const original=normalizePrintCatalog();
 assert.equal(original.types.length,4);assert(original.types.some(t=>t.id==='album_binding_price'&&t.name==='صحافی آلبوم'));
 const withOne=addPrintType(original,{kind:'binding',name:'صحافی ضخیم ۳۰۰ گرم'});
 const withTwo=addPrintType(withOne,{kind:'binding',name:'صحافی سیلک نازک'});
 const withPaper=addPrintType(withTwo,{kind:'paper',name:'فتوگلاسه صدفی'});
 assert.equal(withPaper.types.filter(t=>t.kind==='binding').length,3);
 assert.equal(withPaper.types.filter(t=>t.kind==='paper').length,4);
 const renamed=renamePrintType(withPaper,'album_binding_price','صحافی فلت حرفه‌ای');
 assert.equal(renamed.types.find(t=>t.id==='album_binding_price').name,'صحافی فلت حرفه‌ای');
 assert.equal(original.types.find(t=>t.id==='album_binding_price').name,'صحافی آلبوم');
 const id=withPaper.types.at(-1).id;
 const priced=applyPrintRates(renamed,[{sizeId:'s1',customRates:{[id]:123456}}],['s1']);
 assert.equal(priced.rates.s1[id],123456);
 assert.equal(renamed.rates.s1,undefined);
 assert.throws(()=>addPrintType(withPaper,{kind:'binding',name:'صحافی سیلک نازک'}),/print_catalog_duplicate_name/);
 assert.throws(()=>applyPrintRates(renamed,[{sizeId:'s1',customRates:{fake:100}}],['s1']),/print_catalog_unknown_type/);
 assert.throws(()=>applyPrintRates(renamed,[{sizeId:'s1',customRates:{[id]:-100}}],['s1']),/print_catalog_invalid_price/);
});
test('catalog HTML and UI expose new actions, label editing, custom prices, and export',()=>{
 const bundle=read('dist/web/assets/index-UIRefine-v655-r84.js');
 assert.doesNotThrow(()=>new vm.Script(bundle));
 assert(bundle.includes('/* PB1539 lab paper and binding pricing */'));
 for(const t of ['+ کاغذ جدید','+ صحافی جدید','pb1539Rename','pb1539Custom','customRates:Object.fromEntries','pb1539Reload','pb1539.rates?.[k.id]'])assert(bundle.includes(t),t);
 const server=read('dist/api/server.js');
 for(const marker of ['/* PB1539 paper and binding catalogs */','handleLabPrintCatalog({req,res,url,pool,labId','applyPrintRates(normalizePrintCatalog','if(pb1539Catalog)await c.query('])assert(server.includes(marker),marker);
 const html=read('dist/web/index.html');
 assert(html.includes('&printCatalog=r1539'));
 assert(html.includes('photobridge-r1539-print-catalog.css?v=r1539'));
});
