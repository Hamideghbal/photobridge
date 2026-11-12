
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const read=path=>fs.readFileSync(path,'utf8');
const src=read('scripts/r1811-album-binding-modal.js.txt');
const first=src.indexOf('function pb1811AlbumPaperPrices(');
const last=src.indexOf('function PB1811AlbumBindingPriceModal(',first);
const helpers=src.slice(first,last)+'\n'+read('scripts/r1812-album-quote-helper.js.txt');
const model='c_12345678-1234-4123-8123-123456789abc';
const catalog={
 albumCombinedRates:{p:{luster:100,silk:200,metallic:300}},
 albumCombinedModelRates:{p:{[model]:{luster:111,silk:222,metallic:333}}}
};
const quote=(type,paper,count,source=catalog)=>{
 const ctx={catalog:source,type,paper,count};
 return JSON.parse(JSON.stringify(vm.runInNewContext(helpers+
  '\npb1812BundledPaperLine(catalog,"p",type,paper,count)',ctx)));
};
test('R1812: combined paper line is inclusive, model aware, and counted ONCE',()=>{
 assert.deepEqual(quote(model,'luster',2),{known:true,total:222,unitPrice:111});
 assert.deepEqual(quote(model,'silk',1),{known:true,total:222,unitPrice:222});
 assert.equal(quote(model,'luster',2).total+quote(model,'silk',1).total,444);
 assert.deepEqual(quote('album_binding_price','silk',1),{known:true,total:200,unitPrice:200});
 assert.deepEqual(quote(model,'metallic',0),{known:false,total:null,unitPrice:null});
 assert.deepEqual(quote(model,'metallic',1,{albumCombinedRates:{},albumCombinedModelRates:{}}),
  {known:false,total:null,unitPrice:null});
});
test('R1812: no standalone binding fee displayed or added in combined photographer quote',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const source=read(root+'/assets/index-UIRefine-v655-r84.js');
  assert.doesNotThrow(()=>new vm.Script(source));
  const a=source.indexOf('function Kv('),b=source.indexOf('function ',a+20);
  assert(a>0&&b>a);
  const album=source.slice(a,b);
  assert(album.includes('ma=Tt||pb1795Combined?0:yt.reduce('),'combined print fee must be zero');
  assert(album.includes('_a=pb1795Combined?yt.reduce('),'combined price is once per selected paper');
  assert(album.includes('pb1795Combined&&yt.map($e=>{const pb1812Line=pb1812BundledPaperLine('));
  assert(album.includes('!pb1795Combined&&yt.map($e=>'));
  assert(album.includes('!pb1795Combined&&e.jsxs("div",{children:[e.jsxs("span",{children:["صحافی "'));
  assert(album.includes('children:["چاپ و صحافی ",$e.label'));
  assert(source.includes('function pb1812BundledPaperLine('));
 }
});
test('R1812: album step cards stack without grid-row collision on desktop and phone',()=>{
 const css=read('dist/web/photobridge-r1812-album-steps-quote.css');
 assert(css.includes('display:flex!important'));
 assert(css.includes('flex-direction:column!important'));
 assert(css.includes('gap:18px!important'));
 for(const kind of ['albumConfigBlockCompactV409','albumCoverConfigBlock','albumLabInstructions','albumFilesQcBlock'])
  assert(css.includes('> .'+kind+'{order:'),'missing ordered section '+kind);
 assert(css.includes('grid-template-columns:minmax(0,1fr)!important'));
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  assert.equal(read(root+'/photobridge-r1812-album-steps-quote.css'),css);
  const html=read(root+'/index.html');
  assert(html.includes('photobridge-r1812-album-steps-quote.css?v=r1812'));
  assert(html.includes('albumQuote=r1812'));
  assert(html.indexOf('photobridge-r1811-album-binding-modal.css')<html.indexOf('photobridge-r1812-album-steps-quote.css'));
 }
});
test('R1812: Windows hot-update manifest matches modified assets',()=>{
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(read(root+'/manifest.json'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','photobridge-r1812-album-steps-quote.css','index.html']){
  const item=manifest.files.find(x=>x.name===name);
  assert(item,name+' is missing');
  assert.equal(item.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
});
