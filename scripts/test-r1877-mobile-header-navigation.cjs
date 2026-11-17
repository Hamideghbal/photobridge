'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');

test('R1877: mobile dock reveals once after both navigation providers settle',()=>{
 const features=read('dist/web/photobridge-r1099-photographer-tabs.js');
 const crm=read('dist/web/photobridge-r1761-crm-nav.js');
 assert.doesNotThrow(()=>new vm.Script(features));
 assert.doesNotThrow(()=>new vm.Script(crm));
 assert(features.includes('window.pbR1877FeatureNavReady=true'));
 assert(features.includes('window.pbR1877CrmNavReady'));
 assert(features.includes("classList.remove('pbR1877DockPending')"));
 assert(crm.includes('window.pbR1877CrmNavReady=true'));
 assert(crm.includes("new Event('pb-r1877-crm-ready')"));
 for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
  const html=read(file);
  assert(html.includes('pbR1877DockPrepaint'),file);
  assert(html.includes('photographerBottomAppNav:not(.labBottomAppNav)'),file);
 }
});

test('R1877: lab city choices stay fixed above scrolling cards with no dead white gap',()=>{
 const picker=read('dist/web/photobridge-v904r99-lab-chooser.js');
 const css=read('dist/web/photobridge-v904r100f41-header-date-name-fit.css');
 assert.doesNotThrow(()=>new vm.Script(picker));
 assert(picker.includes('class="pbR99LabCities"'));
 assert(picker.includes("selectedCityKey=key;paint(currentData)"));
 assert(picker.includes('function cityGrouping(all,active,primary)'));
 assert(picker.includes('/* PB1722 city filters */'));
 assert(picker.includes('listedConnected'));
 assert(css.includes('pbF37ChooserMode #pbR99LabChooser .pbR99LabCities:not([hidden])'));
 assert(css.includes('pbF37ChooserMode #pbR99LabChooser .pbR99LabBoard'));
 assert(css.includes('height:auto!important;max-height:none!important'));
});

test('R1877: Store has stationary third category row and CRM gets compact white headers',()=>{
 const store=read('dist/api/equipment-rental-book.html');
 const css=read('dist/web/photobridge-v904r100f41-header-date-name-fit.css');
 const crm=read('dist/web/customer-crm.html');
 assert(store.includes("chrome.appendChild(filters)"));
 assert(store.includes("filters.parentElement!==box)root.before(filters)"));
 assert(css.includes('pbF37StoreChooserMode #storeChooserFiltersR1231'));
 assert(css.includes('top:186px!important'));
 assert(css.includes('pbF37CrmMode #pbF37Subheader'));
 assert(crm.includes('grid-template-columns:minmax(0,1fr) minmax(0,1fr)'));
 assert(crm.includes('#customers>.panel:last-child'));
 assert(crm.includes('flex:1 1 auto!important;min-height:0!important'));
});

test('R1877: the deployed build pins updated selectors and navigation scripts',()=>{
 const rev=read('DEPLOY_REVISION.txt').trim();
 const fin=read('scripts/enable-r1873-gallery-header-all-tabs.mjs');
 assert(rev.includes('r1875-mobile-header'));
 assert(rev.includes('r1876-chooser-compact'));
 assert(rev.includes('r1877-mobile-nav-header-scroll'));
 assert(fin.includes('photobridge-v904r99-lab-chooser.js'));
 assert(fin.includes('photobridge-r1099-photographer-tabs.js'));
 assert(fin.includes('photobridge-r1761-crm-nav.js'));
});
