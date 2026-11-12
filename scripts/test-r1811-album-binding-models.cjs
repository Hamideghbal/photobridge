
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const read=p=>fs.readFileSync(p,'utf8'),plain=x=>JSON.parse(JSON.stringify(x));
const custom='c_12345678-1234-4123-8123-123456789abc';
const source={
 albumPricingMode:'combined',
 types:[{id:'album_binding_price',name:'صحافی اصلی',kind:'binding',legacy:true,active:true},{id:custom,name:'صحافی فلت',kind:'binding',active:true}],
 albumCombinedRates:{p:{luster:100,silk:200,metallic:300}},
 walkinAlbumCombinedRates:{p:{luster:10,silk:20,metallic:30}},
 albumCombinedModelRates:{p:{[custom]:{luster:111,silk:222,metallic:333}}},
 walkinAlbumCombinedModelRates:{p:{[custom]:{luster:11,silk:22,metallic:33}}}
};
const api=read('dist/api/server.js');
function extract(name){
 const a=api.indexOf('async function '+name+'('),b=api.indexOf('\nasync function ',a+20);
 assert(a>=0&&b>a,'missing server function '+name);return api.slice(a,b);
}
test('R1811 catalog persists separate combined model/paper matrices without changing default prices',async()=>{
 const mod=await import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')));
 let value=mod.normalizePrintCatalog(source);
 assert.deepEqual(plain(value.albumCombinedModelRates.p[custom]),{luster:111,silk:222,metallic:333});
 assert.deepEqual(plain(value.walkinAlbumCombinedModelRates.p[custom]),{luster:11,silk:22,metallic:33});
 assert.equal(value.albumCombinedRates.p.silk,200);
 assert.equal(mod.normalizePrintCatalog(value).walkinAlbumCombinedModelRates.p[custom].silk,22);
 assert.throws(()=>mod.addPrintType(value,{kind:'binding',name:'بدون مجوز'}),/album_binding_model_locked/);
 assert.doesNotThrow(()=>mod.addPrintType(value,{kind:'binding',name:'صحافی جدید',allowCombinedModel:true}));
 assert.deepEqual(plain(mod.normalizePrintCatalog({...value,albumCombinedModelRates:{p:{[custom]:{luster:-1,silk:'NaN',metallic:50}}}}).albumCombinedModelRates.p[custom]),{metallic:50});
});
test('R1811 combined per-model write never changes default or walk-in tariffs',async()=>{
 const mod=await import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')));
 let updated,rawSql=[];
 const connection={
  query:async(sql,args=[])=>{
   rawSql.push(sql);
   if(['BEGIN','COMMIT','ROLLBACK'].includes(sql))return {rowCount:1,rows:[]};
   if(sql.startsWith('SELECT ui_preferences'))return {rowCount:1,rows:[{ui_preferences:{printTariffCatalog:source}}]};
   if(sql.startsWith('UPDATE labs SET ui_preferences')){updated=JSON.parse(args[1]);return{rowCount:1,rows:[]}};
   throw Error(sql.slice(0,150));
  },release:()=>{}
 };
 const fn=vm.runInNewContext('('+extract('pb1810SaveAlbumBindingPrices')+')',{
  normalizePrintCatalog:mod.normalizePrintCatalog,applyPrintRates:mod.applyPrintRates,
  labCanUsePrintSize:async()=>true,syncLabAlbumSizesFromPrintTariffs:async()=>{},
  Object,Math,Number,JSON,String,Set,Error
 });
 const result=await fn({req:{},res:{},pool:{connect:async()=>connection},labId:'lab',
  bodyJson:async()=>({audience:'colleague',rows:[{sizeId:'p',combinedModelRates:{[custom]:{luster:999,silk:888,metallic:777}}}]}),
  sendJson:(_r,status,obj)=>({status,obj}),audit:async()=>{},userId:'user'});
 assert.equal(result.status,200);
 assert.equal(updated.albumCombinedModelRates.p[custom].silk,888);
 assert.equal(updated.walkinAlbumCombinedModelRates.p[custom].silk,22);
 assert.equal(updated.albumCombinedRates.p.luster,100);
 assert.equal(updated.walkinAlbumCombinedRates.p.luster,10);
 assert(rawSql.every(s=>!s.includes('INSERT INTO lab_prices')));
});
test('R1811 album snapshot chooses priced custom model and freezes mixed-paper amounts',async()=>{
 const album={enabled:true,printTariffCatalog:source,
  sizes:[{id:'s',printSizeId:'p',label:'20×30',active:true,bindingPrice:80,luster:15,silk:20,metallic:35,widthCm:20,heightCm:30,minSpreads:1,maxSpreads:500}],
  covers:[{id:'cover',name:'جلد',price:50}],packages:[],extras:[]};
 const fn=vm.runInNewContext('('+extract('albumOrderSnapshot')+')',{
  albumCatalogForLab:async()=>album,
  albumMoney:n=>Math.max(0,Math.round(Number(n||0))),
  invoicePrintTypeLabel:p=>({luster:'لاستر',silk:'سیلک',metallic:'متالیک'}[p]||p),Date
 });
 const result=await fn('lab',{sizeId:'s',bindingTypeId:custom,spreads:3,paperCounts:{luster:2,silk:1},coverId:'cover'});
 assert.equal(result.binding.id,custom);
 assert.equal(result.pricing.albumPricingMode,'combined');
 assert.equal(result.pricing.bindingTotal,444);
 assert.deepEqual(plain(result.pricing.combinedPaperBreakdown.map(r=>[r.paperType,r.unitPrice,r.lineTotal])),[['luster',111,222],['silk',222,222]]);
 assert.equal(result.pricing.total,494);
});
test('R1811 both modals have correct Luster label, modes and selectable models',()=>{
 const helper=read('scripts/r1811-album-binding-modal.js.txt');
 assert(helper.includes('["luster","لاستر"]'));
 assert(!helper.includes('["luster","گلاسه"]'));
 assert(helper.includes('allowCombinedModel:true'));
 assert(helper.includes('combinedModelRates:{[activeId]:values}'));
 assert(helper.includes('pb1811ModelBar'));
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const ui=read(root+'/assets/index-UIRefine-v655-r84.js');
  assert.doesNotThrow(()=>new vm.Script(ui));
  assert.equal(ui.split('e.jsx(PB1811AlbumBindingPriceModal,').length-1,2);
  assert(!ui.includes('e.jsx(PB1795BindingPricingSettings,{settings,onSaved:'));
  const html=read(root+'/index.html');
  assert(html.includes('photobridge-r1811-album-binding-modal.css?v=r1811'));
  assert(read(root+'/photobridge-r1811-album-binding-modal.css').includes('top:max(104px'));
 }
});
test('R1811 hot-update includes new CSS and exact hashes for web/Windows',()=>{
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(read(root+'/manifest.json'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','photobridge-r1137-lab-local-intake.js','index.html','photobridge-r1811-album-binding-modal.css']){
  const item=manifest.files.find(row=>row.name===name);
  assert(item,'missing native manifest asset '+name);
  assert.equal(item.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'),name);
 }
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
});
