'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const {pathToFileURL}=require('node:url'),path=require('node:path');
async function catalog(){return import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')))}
test('lab-specific catalog keeps paper defaults and permits multiple custom bindings only',async()=>{
 const {normalizePrintCatalog,addPrintType,renamePrintType,applyPrintRates}=await catalog();
 const original=normalizePrintCatalog();
 assert.equal(original.types.length,6);assert(original.types.some(t=>t.kind==='chassis'&&t.id==='chassis'));assert(original.types.some(t=>t.kind==='frame'&&t.id==='frame'));assert(original.types.some(t=>t.id==='album_binding_price'&&t.name==='صحافی آلبوم'));
 const withOne=addPrintType(original,{kind:'binding',name:'صحافی ضخیم ۳۰۰ گرم'});
 const withTwo=addPrintType(withOne,{kind:'binding',name:'صحافی سیلک نازک'});
 assert.throws(()=>addPrintType(withTwo,{kind:'paper',name:'فتوگلاسه صدفی'}),/print_catalog_invalid_kind/);
 assert.equal(withTwo.types.filter(t=>t.kind==='binding').length,3);
 assert.equal(withTwo.types.filter(t=>t.kind==='paper').length,3);
 const renamed=renamePrintType(withTwo,'album_binding_price','صحافی فلت حرفه‌ای');
 assert.equal(renamed.types.find(t=>t.id==='album_binding_price').name,'صحافی فلت حرفه‌ای');
 assert.equal(original.types.find(t=>t.id==='album_binding_price').name,'صحافی آلبوم');
 const id=withTwo.types.at(-1).id;
 const priced=applyPrintRates(renamed,[{sizeId:'s1',customRates:{[id]:123456}}],['s1']);
 assert.equal(priced.rates.s1[id],123456);
 assert.equal(renamed.rates.s1,undefined);
 assert.throws(()=>addPrintType(withTwo,{kind:'binding',name:'صحافی سیلک نازک'}),/print_catalog_duplicate_name/);
 assert.throws(()=>applyPrintRates(renamed,[{sizeId:'s1',customRates:{fake:100}}],['s1']),/print_catalog_unknown_type/);
 assert.throws(()=>applyPrintRates(renamed,[{sizeId:'s1',customRates:{[id]:-100}}],['s1']),/print_catalog_invalid_price/);
});
test('catalog HTML and UI expose new actions, label editing, custom prices, and export',()=>{
 const bundle=read('dist/web/assets/index-UIRefine-v655-r84.js');
 assert.doesNotThrow(()=>new vm.Script(bundle));
 assert(bundle.includes('/* PB1539 lab binding pricing with unchanged paper types */'));
 for(const t of ['+ مدل صحافی جدید','pb1539Rename','pb1539MobileRename','pb1539Custom','customRates:Object.fromEntries','pb1539Reload','pb1539.rates?.[k.id]'])assert(bundle.includes(t),t);
 assert(!bundle.includes('+ کاغذ جدید'));
 const server=read('dist/api/server.js');
 for(const marker of ['/* PB1539 paper and binding catalogs */','handleLabPrintCatalog({req,res,url,pool,labId','applyPrintRates(normalizePrintCatalog','if(pb1539Catalog)await c.query('])assert(server.includes(marker),marker);
 const html=read('dist/web/index.html');
 assert(html.includes('&printCatalog=r1539'));
 assert(html.includes('photobridge-r1539-print-catalog.css?v=r1539'));
});

test('authorized lab catalog API isolates data by lab and retains renamed default binding identity',async()=>{
 const {handleLabPrintCatalog}=await catalog();
 const preferences=new Map([['labA',{}],['labB',{}]]);
 const query=async(sql,args)=>{
  if(sql.startsWith('SELECT ui_preferences FROM labs'))return {rowCount:1,rows:[{ui_preferences:preferences.get(args[0])}]};
  if(sql.startsWith('UPDATE labs SET ui_preferences=')){
   const prefs=preferences.get(args[0]);prefs.printTariffCatalog=JSON.parse(args[1]);return {rowCount:1,rows:[]};
  }
  return {rows:[],rowCount:0};
 };
 const pool={query,connect:async()=>({query,release(){}})};
 const request=async(labId,method,url,body)=>{
  let res;
  const handled=await handleLabPrintCatalog({req:{method},res:{},url:{pathname:url},pool,labId,bodyJson:async()=>body,sendJson:(_,status,data)=>{res={status,...data}},audit:async()=>{},userId:'owner'});
  assert(handled);return res;
 };
 const created=await request('labA','POST','/api/lab/print-catalog',{kind:'binding',name:'صحافی کتان ضخیم'});
 assert.equal(created.status,200);
 const id=created.catalog.types.find(x=>x.name==='صحافی کتان ضخیم').id;
 const renamed=await request('labA','PATCH','/api/lab/print-catalog/type',{id:'album_binding_price',name:'صحافی ژورنال'});
 assert.equal(renamed.catalog.types.find(x=>x.id==='album_binding_price').name,'صحافی ژورنال');
 const other=await request('labB','GET','/api/lab/print-catalog',{});
 assert.equal(other.catalog.types.length,6);
 assert.equal(other.catalog.types.find(x=>x.id==='album_binding_price').name,'صحافی آلبوم');
 const found=await request('labA','GET','/api/lab/print-catalog',{});
 assert(found.catalog.types.some(x=>x.id===id));
});
