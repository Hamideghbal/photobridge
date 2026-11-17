'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');

test('R1875: mobile toolbar is route-owned, not inherited from Gallery',()=>{
 const js=read('dist/web/photobridge-v904r100f41-header-date-name-fit.js');
 const host=read('dist/web/customer-crm-host.js');
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.doesNotThrow(()=>new vm.Script(host));
 assert.match(js,/function crmPane\(\)/);
 assert.match(js,/if\(crm\)return crm;/);
 assert.match(js,/m==='customers'\)return \['customers','events','templates'\]/);
 assert.match(js,/مشتریان','مناسبت‌ها','قالب پیامک/);
 assert.match(js,/m==='calendar'\)return \[\{id:'crm:book'/);
 assert.match(js,/window\.pbCrmHeaderAction/);
 assert.match(host,/window\.pbCrmActivePane=pane/);
 assert.match(host,/window\.pbCrmActivePane=null/);
 assert.match(host,/const REV='r1875-mobile-header-layout'/);
});

test('R1875: Lab chooser gets visible account toolbar, Store content is below it',()=>{
 const js=read('dist/web/photobridge-v904r100f41-header-date-name-fit.js');
 const css=read('dist/web/photobridge-v904r100f41-header-date-name-fit.css');
 assert.match(js,/chooserVisible\(\)\|\|new URLSearchParams\(location.search\)\.get\('pbLabChooser'\)==='1'/);
 assert.match(js,/if\(chooserVisible\(\)\|\|new URLSearchParams\(location.search\)\.get\('pbLabChooser'\)==='1'\)return 'labchooser'/);
 assert.match(js,/previousMode!=='store'/);
 assert.match(css,/pbF37ChooserMode #pbR99LabChooser/);
 assert.match(css,/top:132px!important/);
 assert.match(css,/pbF37StoreMode #storePhotographerWorkspace>\.shell/);
 assert.match(css,/top:181px!important/);
});

test('R1875: CRM has one compact second row, iframe duplicates are suppressed',()=>{
 const css=read('dist/web/photobridge-v904r100f41-header-date-name-fit.css');
 const html=read('dist/web/customer-crm.html');
 assert.match(css,/pbF37CustomersMode #pbF37ContextTitle/);
 assert.match(css,/pbF37CalendarMode #pbF37ContextTitle/);
 assert.match(css,/pbF37CrmMode #pbCrmTabContent/);
 assert.match(css,/top:142px!important/);
 assert.match(html,/crmEmbedded\.crmMobile #nav\{display:none!important\}/);
 assert.match(html,/crmEmbedded\.crmMobile #calendar \.calHero\{display:none!important\}/);
});

test('R1875: delivery names a new cache revision',()=>{
 const revision=read('DEPLOY_REVISION.txt').trim();
 const finalizer=read('scripts/enable-r1873-gallery-header-all-tabs.mjs');
 assert.match(revision,/r1875-mobile-header/);
 assert.match(finalizer,/r1875-mobile-header/);
});
