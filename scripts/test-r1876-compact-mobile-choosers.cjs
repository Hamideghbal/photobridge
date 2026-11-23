'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');

test('R1876: Store chooser uses shared second header, preserving selection cards',()=>{
 const core=read('dist/web/photobridge-v904r100f41-header-date-name-fit.js');
 const css=read('dist/web/photobridge-v904r100f41-header-date-name-fit.css');
 const store=read('dist/api/equipment-rental-book.html');
 assert.doesNotThrow(()=>new vm.Script(core));
 for(const marker of ["?'storechooser':'store'","if(m==='storechooser')return{title:'انتخاب فروشگاه'","pbF37StoreChooserMode","wasChoosingStore=document.body.classList.contains('pbR96ChoosingStore')"]){
  assert(core.includes(marker),'missing Store header marker: '+marker);
 }
 for(const marker of ['pbF37StoreChooserMode #pbF37Subheader','pbF37StoreChooserMode #storeChooserPanelR96 .pbR96StoreChooserHead','pbF37StoreChooserMode #storePhotographerWorkspace>.shell']){
  assert(css.includes(marker),'missing Store CSS marker: '+marker);
 }
 assert(store.includes('class="pbR96StoreChooserHead"'));
 assert(store.includes('id="storeChooserListR96"'));
 assert(store.includes("filters.id='storeChooserFiltersR1231'"));
});

test('R1876: Print chooser hides only redundant blue explanation and retains labs',()=>{
 const css=read('dist/web/photobridge-v904r100f41-header-date-name-fit.css');
 const js=read('dist/web/photobridge-v904r99-lab-chooser.js');
 const core=read('dist/web/photobridge-v904r100f41-header-date-name-fit.js');
 assert(core.includes("if(m==='labchooser')return{title:'انتخاب لابراتوار'"));
 assert(css.includes('pbF37ChooserMode #pbR99LabChooser .pbR99LabIntro{\n    display:none!important'));
 for(const marker of ['pbR99LabBoard','pbR99LabList','data-select'])assert(js.includes(marker));
});

test('R1876: release suffix refreshes chooser assets',()=>{
 const rev=read('DEPLOY_REVISION.txt').trim();
 const finalizer=read('scripts/enable-r1873-gallery-header-all-tabs.mjs');
 assert.match(rev,/^\d{4}-\d{2}-\d{2}-r\d+-[a-z0-9-]+$/);
 assert(finalizer.includes('encodeURIComponent(revision)'));
 for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
  assert(read(file).includes('photobridge-v904r100f41-header-date-name-fit.js?rev='+rev),file+' must load the current header revision');
 }
});
