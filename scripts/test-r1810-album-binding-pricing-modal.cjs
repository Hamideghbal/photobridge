
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const read=p=>fs.readFileSync(p,'utf8');
const api=read('dist/api/server.js');
const printApi=()=>import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')));
const baseCatalog={
 albumPricingMode:'combined',
 types:[{id:'album_binding_price',name:'صحافی اصلی',kind:'binding',legacy:true,active:true},{id:'c_12345678-1234-4123-8123-123456789abc',name:'شاسی مدل اول',kind:'chassis',active:true},{id:'c_22345678-1234-4123-8123-123456789abc',name:'قاب مدل اول',kind:'frame',active:true}],
 rates:{p:{'c_12345678-1234-4123-8123-123456789abc':300}},walkinRates:{p:{'c_22345678-1234-4123-8123-123456789abc':400}},
 albumCombinedRates:{p:{luster:100,silk:200,metallic:300}},
 walkinAlbumCombinedRates:{p:{luster:11,silk:22,metallic:33}},
 walkinAlbumBindingRates:{p:{album_binding_price:55}}
};
test('R1810: both audience matrices normalize independently, never changing original photo print prices',async()=>{
 const mod=await printApi();
 const catalog=mod.normalizePrintCatalog(baseCatalog);
 assert.equal(catalog.albumPricingMode,'combined');
 assert.equal(catalog.albumCombinedRates.p.luster,100);
 assert.equal(catalog.walkinAlbumCombinedRates.p.luster,11);
 assert.equal(catalog.walkinAlbumBindingRates.p.album_binding_price,55);
 assert.equal(catalog.rates.p['c_12345678-1234-4123-8123-123456789abc'],300);
 assert.equal(catalog.walkinRates.p['c_22345678-1234-4123-8123-123456789abc'],400);
});
const getHandler=()=>{
 const begin=api.indexOf('async function pb1810SaveAlbumBindingPrices('),end=api.indexOf('async function albumOrderSnapshot(',begin+20);
 assert(begin>=0&&end>begin,'R1810 handler boundaries');
 return api.slice(begin,end);
};
async function call(audience,mode,prices){
 const mod=await printApi();
 const original=mod.normalizePrintCatalog({...baseCatalog,albumPricingMode:mode});
 const saved={catalog:null,labBinding:undefined,sql:[]};
 const connection={
  query:async(sql,args)=>{
   saved.sql.push(sql);
   if(sql==='BEGIN'||sql==='COMMIT'||sql==='ROLLBACK')return {rowCount:1,rows:[]};
   if(sql.startsWith('SELECT ui_preferences'))return {rowCount:1,rows:[{ui_preferences:{printTariffCatalog:original}}]};
   if(sql.startsWith('UPDATE labs SET ui_preferences')){saved.catalog=JSON.parse(args[1]);return {rowCount:1,rows:[]}};
   if(sql.startsWith('INSERT INTO lab_prices')){saved.labBinding=args[2];return {rowCount:1,rows:[]}};
   throw Error('Unexpected query '+sql.slice(0,100));
  },
  release:()=>{}
 };
 const context={
  normalizePrintCatalog:mod.normalizePrintCatalog,applyPrintRates:mod.applyPrintRates,
  labCanUsePrintSize:async(_c,_lab,id)=>id==='p',syncLabAlbumSizesFromPrintTariffs:async()=>{},
  Object,Math,Number,JSON,Set,String,Error
 };
 const handler=vm.runInNewContext('('+getHandler()+')',context);
 const output=await handler({
  req:{},res:{},pool:{connect:async()=>connection},labId:'lab',bodyJson:async()=>({audience,rows:[{sizeId:'p',...prices}]}),
  sendJson:(_res,status,obj)=>({status,obj}),audit:async()=>{},userId:'user'
 });
 return {output,saved,original};
}
test('R1810: colleague combined modal writes ONLY colleague binding rates',async()=>{
 const {output,saved}=await call('colleague','combined',{combinedAlbumRates:{luster:101,silk:202,metallic:303}});
 assert.equal(output.status,200);
 assert.equal(saved.catalog.albumCombinedRates.p.silk,202);
 assert.equal(saved.catalog.walkinAlbumCombinedRates.p.silk,22);
 assert.equal(saved.catalog.walkinRates.p['c_22345678-1234-4123-8123-123456789abc'],400);
 assert.equal(saved.labBinding,undefined);
});
test('R1810: walk-in combined rates remain separate from colleague catalog',async()=>{
 const {output,saved}=await call('walkin','combined',{combinedAlbumRates:{luster:111,silk:222,metallic:333}});
 assert.equal(output.status,200);
 assert.equal(saved.catalog.walkinAlbumCombinedRates.p.metallic,333);
 assert.equal(saved.catalog.albumCombinedRates.p.metallic,300);
 assert.equal(saved.labBinding,undefined);
});
test('R1810: colleague separate writes only the album-binding SQL field',async()=>{
 const {output,saved}=await call('colleague','separate',{basePrice:95,customRates:{}});
 assert.equal(output.status,200);
 assert.equal(saved.labBinding,95);
 assert(saved.sql.some(s=>s.includes('INSERT INTO lab_prices(lab_id,size_id,album_binding_price,updated_at)')));
 assert(saved.sql.every(s=>!s.includes('UPDATE SET luster=')));
 assert.equal(saved.catalog.walkinAlbumBindingRates.p.album_binding_price,55);
});
test('R1810: walk-in separate prices persist without touching colleague binding',async()=>{
 const {output,saved}=await call('walkin','separate',{basePrice:75,customRates:{}});
 assert.equal(output.status,200);
 assert.equal(saved.catalog.walkinAlbumBindingRates.p.album_binding_price,75);
 assert.equal(saved.catalog.albumCombinedRates.p.luster,100);
 assert.equal(saved.labBinding,undefined);
});
test('R1810: main grids keep photo-print columns and both open the modal independently',()=>{
 const helper=read('scripts/r1805-combined-album-ui.js.txt');
 assert(helper.includes("return fields.filter"));
 assert(!helper.includes("if(['luster','silk','metallic'].includes(key))continue"));
 const s=read('scripts/r1810-album-binding-modal.js.txt');
 const ctx={};
 vm.runInNewContext(s,ctx);
 const catalog={types:[{id:'album_binding_price',kind:'binding'},{id:'c_123',kind:'binding'}],albumPricingMode:'combined'};
 const result=ctx.pb1810BindingFields([['luster','چاپ'],['silk','چاپ'],['metallic','چاپ'],['album_binding_price','صحافی'],['pb1539_c_123','مدل'],['chassis','شاسی'],['frame','قاب']],catalog);
 assert.deepEqual(JSON.parse(JSON.stringify(result.map(x=>x[0]))),['luster','silk','metallic','chassis','frame']);
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const ui=read(root+'/assets/index-UIRefine-v655-r84.js');
  assert.doesNotThrow(()=>new vm.Script(ui));
  const a=ui.indexOf('function tw('),b=ui.indexOf('function Na(t)',a),tw=ui.slice(a,b),q=ui.slice(ui.indexOf('function Qj('),ui.indexOf('function Zj('));
  assert(tw.includes('pb1810Open&&e.jsx(PB1810AlbumBindingPriceModal,{audience:"colleague"'));
  assert(q.includes('pb1810Open&&e.jsx(PB1810AlbumBindingPriceModal,{audience:"walkin"'));
  assert(tw.includes('ثبت قیمت صحافی'));
  assert(q.includes('ثبت قیمت صحافی'));
  assert(ui.includes('function PB1810AlbumBindingPriceModal('));
 }
});
test('R1810: album configurator is compact and vertically ordered, quote stays left',()=>{
 const css=read('dist/web/photobridge-r1810-album-tariff-modal.css');
 assert(css.includes('>.albumConfigurator.albumConfigurator>*{'));
 assert(css.includes('grid-column:1!important;grid-row:auto!important;order:0!important'));
 const previous=read('dist/web/photobridge-r1804-album-order-layout.css');
 assert(previous.includes('>.albumQuoteCard{grid-column:2!important;grid-row:1!important'));
});
test('R1810: web and Windows assets, modal CSS and hot manifest are consistent',()=>{
 const name='photobridge-r1810-album-tariff-modal.css';
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const html=read(root+'/index.html');
  assert(html.includes(name+'?v=r1810'));
  assert(html.indexOf('photobridge-r1804-album-order-layout.css')<html.indexOf(name));
  assert.equal(read(root+'/'+name),read('dist/web/'+name));
 }
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(read(root+'/manifest.json'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-r1810-album-tariff-modal.css']){
  const row=manifest.files.find(f=>f.name===name);
  assert(row,'missing '+name);
  assert.equal(row.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
});
