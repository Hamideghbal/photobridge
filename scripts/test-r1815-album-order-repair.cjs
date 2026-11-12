
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const source=read('dist/api/server.js');
const extract=name=>{
 const a=source.indexOf('async function '+name+'('),b=a<0?-1:source.indexOf('\nasync function ',a+20);
 assert(a>=0&&b>a,'missing server function '+name);
 return source.slice(a,b);
};
const custom='c_12345678-1234-4123-8123-123456789abc';
test('R1815 selected custom binding is never priced as the default binding',async()=>{
 const catalog={albumPricingMode:'combined',
  types:[{id:'album_binding_price',name:'صحافی اصلی',kind:'binding',legacy:true,active:true},{id:custom,name:'صحافی فلت',kind:'binding',active:true}],
  albumCombinedRates:{p:{luster:100,silk:200,metallic:300}},
  albumCombinedModelRates:{}};
 const album={enabled:true,printTariffCatalog:catalog,
  sizes:[{id:'s',printSizeId:'p',label:'20×30',active:true,bindingPrice:80,luster:15,silk:20,metallic:35,widthCm:20,heightCm:30,minSpreads:1,maxSpreads:500}],
  covers:[{id:'cover',name:'جلد',price:50}],packages:[],extras:[]};
 const fn=vm.runInNewContext('('+extract('albumOrderSnapshot')+')',{
  albumCatalogForLab:async()=>album,albumMoney:n=>Math.max(0,Math.round(Number(n||0))),
  invoicePrintTypeLabel:p=>({luster:'لاستر',silk:'سیلک',metallic:'متالیک'}[p]||p),Date
 });
 const snapshot=await fn('lab',{sizeId:'s',bindingTypeId:custom,spreads:2,paperType:'luster',paperCounts:{luster:2},coverId:'cover'});
 assert.equal(snapshot.binding.id,custom,'must not silently replace a valid custom model');
 assert.equal(snapshot.pricing.albumPricingMode,'combined');
 assert.equal(snapshot.pricing.manualBindingRequired,true,'missing custom rate requires manual tariff');
 assert.equal(snapshot.pricing.total,null,'never show the default model amount as a valid custom rate');
 assert.equal(snapshot.pricing.bindingTotal,null);
});
test('R1815 combined paper dropdown uses exact model size and paper, not old print tariff',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=read(root+'/assets/index-UIRefine-v655-r84.js');
  assert.doesNotThrow(()=>new vm.Script(js));
  const a=js.indexOf('function Kv('),b=js.indexOf('function ',a+20);
  assert(a>0&&b>a);
  const kv=js.slice(a,b);
  const start=kv.indexOf('e.jsx("select",{className:"albumPaperNativeSelect"');
  const end=kv.indexOf('children:"نوع کاغذ در دسترس نیست"',start);
  assert(start>0&&end>start);
  const selector=kv.slice(start,end);
  assert(selector.includes('pb1795Combined?pb1811AlbumPaperPrices(pb1539Catalog,"colleague",'));
  assert(selector.includes('String(pb1539Chosen.id))?.[$e.value]'));
  assert(selector.includes('pb1795Combined?"چاپ و صحافی ":""'));
  assert(!selector.includes('const gt=Q?null:Be==null?void 0:Be[$e.value]'));
  assert(kv.includes('pb1795Combined&&yt.map($e=>{const pb1812Line=pb1812BundledPaperLine('),
   'quote and selector both display model-specific bundled paper prices');
 }
});
test('R1815 keeps model-creation button visible in both modes and scroll contained',()=>{
 const modal=read('scripts/r1811-album-binding-modal.js.txt');
 assert.doesNotThrow(()=>new vm.Script(modal));
 const controls=modal.indexOf('className:"pb1811ModelBar"');
 const table=modal.indexOf('className:"pb1810AlbumModalScroll"');
 assert(controls>0&&table>controls,'model chooser must be above the scrollable price table');
 assert(modal.includes('onClick:()=>action("create")'));
 assert(modal.includes('allowCombinedModel:true'));
 assert(modal.includes('const combined=mode==="combined"'));
 assert(!modal.slice(table).includes('className:"pb1811ModelBar"'),'not hidden below long rates');
 const css=read('dist/web/photobridge-r1815-album-order-repair.css');
 assert(css.includes('.photographerAlbumCreateWorkspaceMode .albumOrderGrid.pb1802CompactAlbum > .albumConfigurator.albumConfigurator'));
 assert(css.includes('height:100%!important'));
 assert(css.includes('overflow-y:auto!important'),'restore scrolling inside bounded workspace');
 assert(css.includes('>.pb1811ModelBar')||css.includes('> .pb1811ModelBar'));
 assert(css.includes('pb1811AddModel'));
});
test('R1815 custom combined binding rates make otherwise unpriced album sizes usable',()=>{
 assert(source.includes('const pb1815CombinedModels=pbCatalog.albumPricingMode'));
 assert(source.includes('!pb1805Combined&&!pb1815CombinedModels'));
 assert(source.includes('albumBase.printTariffCatalog?.albumCombinedModelRates?.[String(x.printSizeId||"")]'));
});
test('R1815 both web/Windows assets include the new cache and matching native manifest',()=>{
 const css=read('dist/web/photobridge-r1815-album-order-repair.css');
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  assert.equal(read(root+'/photobridge-r1815-album-order-repair.css'),css);
  const html=read(root+'/index.html');
  assert(html.includes('photobridge-r1815-album-order-repair.css?v=r1815'));
  assert(html.includes('albumRates=r1815'));
 }
 const native='dist/web/lab-desktop-ui',manifest=JSON.parse(read(native+'/manifest.json'));
 for(const f of ['assets/index-UIRefine-v655-r84.js','photobridge-r1815-album-order-repair.css','index.html']){
  const item=manifest.files.find(x=>x.name===f);
  assert(item,f+' missing from manifest');
  assert.equal(item.sha256,crypto.createHash('sha256').update(fs.readFileSync(native+'/'+f)).digest('hex'));
 }
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
});
