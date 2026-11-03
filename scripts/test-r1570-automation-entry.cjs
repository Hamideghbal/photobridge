'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const name='photobridge-r1570-automation-entry.js';
test('all Lab site and native pages have direct automation entry with cache buster',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const html=fs.readFileSync(root+'/index.html','utf8'),js=fs.readFileSync(root+'/'+name,'utf8');
  assert(html.includes('/'+name+'?v=r1570'));
  assert(html.includes('photobridge-r1570-automation-entry.css?v=r1570'));
  assert.match(js,/\/lab\/settings\/automation/);
  assert.match(js,/labSettingsSectionTabs/);
  assert.match(js,/labRolePageScrollArea/);
  assert(!js.includes('fetch(')); // navigation only, no changes to finance/order data
 }
});
test('released component and API remain reachable in compiled site/native UI',()=>{
 const site=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 const native=fs.readFileSync('dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js','utf8');
 const server=fs.readFileSync('dist/api/server.js','utf8');
 for(const source of [site,native]){
  assert(source.includes('PB1568AutomationSettings'));
  assert(source.includes('دانلود و چاپ خودکار'));
  assert(source.includes('after_verified_download'));
 }
 assert(server.includes('handleLabAutomation'));
 const m=JSON.parse(fs.readFileSync('dist/web/lab-desktop-ui/manifest.json','utf8'));
 for(const file of [name,'photobridge-r1570-automation-entry.css','index.html']){
  const record=m.files.find(f=>f.name===file);
  assert(record, 'native manifest missing '+file);
  const hash=crypto.createHash('sha256').update(fs.readFileSync('dist/web/lab-desktop-ui/'+file)).digest('hex');
  assert.equal(record.sha256,hash);
 }
});
test('settings entry is visible only for Lab orders/settings, avoids duplicate insertion',()=>{
 const source=fs.readFileSync('scripts/r1570-automation-entry.js.txt','utf8');
 assert(source.includes("if(prior&&prior.parentElement===dest)return;"));
 assert(source.includes("if(!enabled()){prior?.remove();return;}"));
 assert(source.includes("obs.observe(document.documentElement"));
 assert(!source.includes('setInterval('));
});
