
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const css=read('dist/web/photobridge-r1818-album-form-professional.css');
const kv=root=>{
 const code=read(root+'/assets/index-UIRefine-v655-r84.js');
 assert.doesNotThrow(()=>new vm.Script(code));
 const a=code.indexOf('function Kv('),b=code.indexOf('function ',a+20);
 assert(a>=0&&b>a,'album editor missing '+root);
 return code.slice(a,b);
};
test('R1818: actual binding, size and paper JSX are 3 siblings, no legacy grid2',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const s=kv(root),a=s.indexOf('className:"albumCoreFields pb1818AlbumCoreThree"'),
        b=s.indexOf('className:"albumConfigBlock albumCoverConfigBlock',a);
  assert(a>0&&b>a);
  const group=s.slice(a,b);
  assert(!s.includes('className:"grid2 albumCoreFields"'),'old 2-column class survives');
  const positions=[
   group.indexOf('className:"pb1539BindingField"'),
   group.indexOf('"سایز آلبوم"'),
   group.indexOf('className:"albumPaperField"')
  ];
  assert(positions[0]>0&&positions[1]>positions[0]&&positions[2]>positions[1],
   'binding, size, paper must appear in that order');
  assert(group.includes('className:"albumPaperNativeSelect"'));
  assert(group.includes('onChange:Wa'),'size remains selectable');
  assert(group.includes('onChange:$e=>J($e.target.value)'),'paper remains selectable');
  assert(group.includes('pb1539SetBinding(id)'),'binding still selectable');
 }
});
test('R1818: three selectors stay horizontal even at old 1100, 760 and 520 breakpoints',()=>{
 assert(css.includes('.albumCoreFields.pb1818AlbumCoreThree'));
 assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))!important'));
 assert(css.includes('grid-row:1!important'));
 assert(css.includes('@media(max-width:760px)'));
 const mobile=css.slice(css.indexOf('@media(max-width:760px)'));
 assert(mobile.includes('grid-template-columns:repeat(3,minmax(0,1fr))!important'));
 assert(!mobile.includes('grid-template-columns:minmax(0,1fr)!important;'),'do not stack the three menu labels');
 assert(css.includes('pb1802CompactAlbum.pb1802CompactAlbum.pb1802CompactAlbum'),'specificity defeats old responsive overrides');
 assert(css.includes('text-overflow:ellipsis!important'),'narrow labels must not overlap');
});
test('R1818: cover UI follows material/color > live preview > thumbnail selection',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const s=kv(root);
  const i=s.indexOf('className:"albumCoverOrderSteps albumCoverOrderStepsCompactV409 pb1818CoverPicker"');
  const controls=s.indexOf('className:"albumCoverOrderMaterialColorRowV409 pb1818CoverControls"',i);
  const preview=s.indexOf('className:"pb1818CoverPreview"',i);
  const models=s.indexOf('className:"albumCoverOrderModels pb1818CoverModelBrowser"',i);
  assert(i>0&&controls>i&&preview>controls&&models>preview,
   'cover controls, current preview and model selection must be distinct components');
  assert(s.includes('className:"pb1818CoverFieldLabel",children:"جنس جلد"'));
  assert(s.includes('className:"pb1818CoverFieldLabel",children:"رنگ جلد"'));
  assert(s.includes('className:"pb1818CoverPreviewImage",children:It?e.jsx("img"'),
   'selected cover preview must use existing resolved image source');
  assert(s.includes('className:"pb1818CoverPreviewCaption"'));
  assert(s.includes('children:"مدل جلد را انتخاب کنید"'));
  assert(s.includes('onClick:()=>{Ma(String($e.id)),F(!0)}'),
   'photo cards still select the requested cover');
  assert(s.includes('className:"albumCoverOrderColorChoices"'));
  assert(s.includes('onClick:()=>Aa(gt)'),'color changes still work');
  assert(s.includes('onChange:Ka'),'material selector still works');
 }
});
test('R1818: cover design has large contained preview, selected-thumbnail state and compact title',()=>{
 for(const value of ['.pb1818CoverPicker','.pb1818CoverControls','.pb1818CoverPreview',
  '.pb1818CoverPreviewImage','.pb1818CoverModelBrowser','.albumCoverOrderModelGrid>button.selected'])
  assert(css.includes(value),'missing '+value);
 assert(css.includes('grid-area:1 / 1 / 2 / 2!important'));
 assert(css.includes('grid-area:1 / 2 / 2 / 3!important'));
 assert(css.includes('grid-area:2 / 1 / 3 / 3!important'));
 assert(css.includes('object-fit:contain!important'));
 assert(css.includes('content:"✓"!important'));
 assert(css.includes('.albumCoverConfigBlock>label>input'));
 assert(css.includes('max-height:38px!important'));
 assert(css.includes('grid-template-columns:minmax(0,1fr)!important'),'mobile cover picker becomes stacked');
 assert(css.includes('overflow:hidden!important'),'cards should remain contained');
});
test('R1818: exact web/Windows style and manifest hashes',()=>{
 const name='photobridge-r1818-album-form-professional.css';
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  assert.equal(read(root+'/'+name),css);
  const html=read(root+'/index.html');
  assert(html.includes(name+'?v=r1818'));
  assert(html.includes('albumCover=r1818'));
  assert(html.indexOf('photobridge-r1817-album-submit-layout.css')<html.indexOf(name));
 }
 const native='dist/web/lab-desktop-ui',m=JSON.parse(read(native+'/manifest.json'));
 const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
 for(const name of ['assets/index-UIRefine-v655-r84.js','photobridge-r1818-album-form-professional.css','index.html']){
  const entry=m.files.find(x=>x.name===name);
  assert(entry,name+' missing in Windows hot-update manifest');
  assert.equal(entry.sha256,hash(fs.readFileSync(native+'/'+name)));
 }
 assert.equal(m.build,hash(JSON.stringify(m.files)));
});
