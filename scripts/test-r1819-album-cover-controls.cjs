
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const css=read('dist/web/photobridge-r1819-album-cover-controls.css');
const component=root=>{
 const source=read(root+'/assets/index-UIRefine-v655-r84.js');
 assert.doesNotThrow(()=>new vm.Script(source),root+' JavaScript should compile');
 const a=source.indexOf('function Kv('),b=source.indexOf('function ',a+12);
 assert(a>=0&&b>a,'album submission component should exist');
 return source.slice(a,b);
};
test('R1819: album-size custom select chevron stays inline with text on desktop and mobile',()=>{
 assert(css.includes('.pb1818AlbumCoreThree>label .pbSelect>.pbSelectTrigger'));
 assert(css.includes('display:flex!important'));
 assert(css.includes('flex-direction:row!important'));
 assert(css.includes('flex-wrap:nowrap!important'));
 assert(css.includes('align-items:center!important'));
 assert(css.includes('justify-content:space-between!important'));
 assert(css.includes('.pbSelect>.pbSelectTrigger>i'));
 assert(css.includes('flex:0 0 auto!important'));
 assert(css.includes('@media(max-width:760px)'));
 assert(css.includes('height:34px!important'));
});
test('R1819: cover has a single selected preview, model dropdown next to material/color, no duplicate photo grid',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=component(root);
  const controls=js.indexOf('className:"albumCoverOrderMaterialColorRowV409 pb1818CoverControls"');
  const model=js.indexOf('className:"pb1819CoverModelField"',controls);
  const preview=js.indexOf('className:"pb1818CoverPreview"',controls);
  assert(controls>=0&&model>controls&&preview>model,'model select and preview should follow controls');
  assert(js.includes('className:"pb1818CoverFieldLabel",children:"مدل جلد"'));
  assert(js.includes('options:Ot.map(item=>({value:String(item.id),label:String(item.modelName||item.name||"مدل جلد")})'));
  assert(js.includes('onChange:id=>{Ma(String(id)),F(!0)}'),'model dropdown must update cover selection');
  assert(js.includes('className:"pb1818CoverPreviewImage"'),'selected preview remains visible');
  assert(!js.includes('className:"albumCoverOrderModels pb1818CoverModelBrowser"'),'duplicate image selection gallery removed');
  assert(!js.includes('className:"albumCoverOrderModelGrid"'),'duplicate cover thumbnail grid removed');
  assert(js.includes('onClick:()=>Aa(gt)'),'cover color selection remains');
  assert(js.includes('onChange:Ka'),'cover material selection remains');
 }
 assert(css.includes('.pb1819CoverModelField'));
 assert(css.includes('.pb1818CoverPicker'));
 assert(css.includes('grid-template-rows:auto!important'));
});
test('R1819: no album-page selection controls remain; single removal, per-page paper and multi-upload stay',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=component(root);
  assert(!js.includes('className:"albumFileSelect '),'per-page selection checkbox removed');
  assert(!js.includes('albumFileActionSelectAll'),'select-all control removed');
  assert(!js.includes('albumFileActionDelete'),'bulk delete control removed');
  assert(!js.includes('"aria-pressed":ot.has(String($e.id))'),'album page is not selectable');
  assert(js.includes('className:"albumFileRemove"'),'individual delete button remains');
  assert(js.includes('onClick:()=>Ga($e.id)'),'individual delete still wired');
  assert(js.includes('className:"albumFilePaperSelect"'),'per-page paper choice remains');
  assert(js.includes('onChange:ht=>qt(String($e.id),ht.target.value)'),'paper change still works');
  assert(js.includes('multiple:!0'),'adding multiple files at once is still supported');
  assert(js.includes('className:"albumFileActionFile"')||js.includes('albumFileActionFile'));
  assert(js.includes('albumFileActionFolder'));
 }
 assert(css.includes('.albumFileToolbarActions'));
 assert(css.includes('grid-template-columns:none!important'));
 assert(css.includes('display:flex!important'));
});
test('R1819: web and Windows UI agree and Windows update manifest hashes are current',()=>{
 const name='photobridge-r1819-album-cover-controls.css';
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  assert.equal(read(root+'/'+name),css,root+' CSS mismatch');
  const html=read(root+'/index.html');
  assert(html.includes(name+'?v=r1819'));
  assert(html.includes('albumEditor=r1819'));
  assert(html.indexOf('photobridge-r1818-album-form-professional.css')<html.indexOf(name));
 }
 const native='dist/web/lab-desktop-ui',manifest=JSON.parse(read(native+'/manifest.json'));
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 for(const name of ['assets/index-UIRefine-v655-r84.js','photobridge-r1819-album-cover-controls.css','index.html']){
  const row=manifest.files.find(x=>x.name===name);
  assert(row,'missing Windows manifest entry for '+name);
  assert.equal(row.sha256,hash(fs.readFileSync(native+'/'+name)));
 }
 assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
});
