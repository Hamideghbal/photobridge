'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');

test('R1876: Store chooser uses the shared second header, not a redundant title card',()=>{
 const core=read('dist/web/photobridge-v904r100f41-header-date-name-fit.js');
 const css=read('dist/web/photobridge-v904r100f41-header-date-name-fit.css');
 const store=read('dist/api/equipment-rental-book.html');
 assert.doesNotThrow(()=>new vm.Script(core));
 assert.match(core,/classList\\.contains\\('pbR96ChoosingStore'\\)\\?'storechooser':'store'/);
 assert.match(core,/if\\(m==='storechooser'\\)return\\{title:'انتخاب فروشگاه'/);
 assert.match(core,/pbF37StoreChooserMode/);
 assert.match(core,/let wasChoosingStore=document\\.body\\.classList\\.contains\\('pbR96ChoosingStore'\\)/);
 assert.match(css,/pbF37StoreChooserMode #pbF37Subheader/);
 assert.match(css,/pbF37StoreChooserMode #storeChooserPanelR96 \\.pbR96StoreChooserHead/);
 assert.match(css,/pbF37StoreChooserMode #storePhotographerWorkspace>\\.shell/);
 assert.match(store,/class="pbR96StoreChooserHead"/);
 assert.match(store,/id="storeChooserListR96"/);
 assert.match(store,/id="storeChooserFiltersR1231"/);
});

test('R1876: Print chooser keeps lab choices and removes only redundant mobile intro',()=>{
 const css=read('dist/web/photobridge-v904r100f41-header-date-name-fit.css');
 const js=read('dist/web/photobridge-v904r99-lab-chooser.js');
 const core=read('dist/web/photobridge-v904r100f41-header-date-name-fit.js');
 assert.match(core,/if\\(m==='labchooser'\\)return\\{title:'انتخاب لابراتوار'/);
 assert.match(css,/pbF37ChooserMode #pbR99LabChooser \\.pbR99LabIntro\\{\\s*display:none!important/);
 assert.match(js,/pbR99LabBoard/);
 assert.match(js,/pbR99LabList/);
 assert.match(js,/data-select/);
});

test('R1876: release suffix refreshes the existing header asset cache',()=>{
 const rev=read('DEPLOY_REVISION.txt').trim();
 const finalizer=read('scripts/enable-r1873-gallery-header-all-tabs.mjs');
 assert.match(rev,/r1875-mobile-header/);
 assert.match(rev,/r1876-chooser-compact/);
 assert.match(finalizer,/encodeURIComponent\\(revision\\)/);
});
