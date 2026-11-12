
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const style=read('dist/web/photobridge-r1817-album-submit-layout.css');
test('R1817: three album parameters fit in one desktop row with safe mobile fallback',()=>{
 assert(style.includes('> .albumConfigurator .albumConfigBlockCompactV409 .albumCoreFields'));
 assert(style.includes('grid-template-columns:repeat(3,minmax(0,1fr))!important'));
 assert(style.includes('@media(max-width:760px)'));
 assert(style.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'));
 assert(style.includes('@media(max-width:520px)'));
 assert(style.includes('grid-template-columns:minmax(0,1fr)!important'));
 assert(style.includes('.albumCustomSizeEdit'));
});
test('R1817: cover material+colors are right, model photographs left, title compact',()=>{
 for(const term of ['.albumCoverOrderStepsCompactV409','.albumCoverOrderMaterialColorRowV409',
  '.albumCoverOrderColorChoices','.albumCoverOrderModels','.albumCoverOrderModelGrid',
  '.albumCoverConfigBlock>label>input','.albumCustomCoverRequest textarea'])
  assert(style.includes(term),'missing cover style for '+term);
 assert(style.includes('grid-template-columns:minmax(195px,.78fr) minmax(0,1.22fr)!important'));
 assert(style.includes('grid-column:1!important')&&style.includes('grid-column:2!important'));
 assert(style.includes('grid-template-rows:68px auto auto!important'));
 assert(style.includes('object-fit:contain!important'));
 assert(style.includes('height:35px!important'),'title text field should not be tall');
 assert(style.includes('width:min(390px,100%)!important'),'title field should be compact');
 assert(style.includes('overflow-wrap:anywhere')===false,'do not modify shared typography');
});
test('R1817: form contains the real binding, size and paper selectors, cover photos and title',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=read(root+'/assets/index-UIRefine-v655-r84.js');
  const a=js.indexOf('function Kv('),b=js.indexOf('function ',a+12);
  assert(a>=0&&b>a);
  const album=js.slice(a,b);
  for(const term of ['className:"grid2 albumCoreFields"',
   'className:"pb1539BindingField"',
   'className:"albumPaperField"',
   'className:"albumCoverOrderSteps albumCoverOrderStepsCompactV409"',
   'className:"albumCoverOrderMaterialColorRowV409"',
   'className:"albumCoverOrderModelGrid"',
   'نوشته روی جلد (اختیاری)'])
    assert(album.includes(term),root+' missing '+term);
  assert(album.includes('pb1795Combined?pb1811AlbumPaperPrices('),
   'R1815 combined selected binding price behavior must be preserved');
 }
});
test('R1817: web and Windows styles, HTML order and native hashes stay consistent',()=>{
 const css='photobridge-r1817-album-submit-layout.css';
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  assert.equal(read(root+'/'+css),style,root+' CSS differs');
  const html=read(root+'/index.html');
  assert(html.includes(css+'?v=r1817'));
  assert(html.indexOf('photobridge-r1815-album-order-repair.css')<html.indexOf(css));
  assert(html.indexOf('photobridge-r1816-album-pricing-compact.css')<html.indexOf(css));
 }
 const native='dist/web/lab-desktop-ui';
 const m=JSON.parse(read(native+'/manifest.json'));
 for(const name of [css,'index.html']){
  const item=m.files.find(x=>x.name===name);
  assert(item,name+' missing in Windows update manifest');
  assert.equal(item.sha256,crypto.createHash('sha256').update(fs.readFileSync(native+'/'+name)).digest('hex'));
 }
 assert.equal(m.build,crypto.createHash('sha256').update(JSON.stringify(m.files)).digest('hex'));
});
