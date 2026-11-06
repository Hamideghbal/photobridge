'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const css=fs.readFileSync('scripts/r1652-photographer-settings-archive.css','utf8');

test('R1652 embedded photographer location and lab tariff pages have a real vertical scroller',()=>{
 assert.match(css,/html\.pb1126Embedded/);
 assert.match(css,/standalonePhotographerSettings/);
 assert.match(css,/photographerPricingSettings/);
 assert.match(css,/photographerLocationSettings/);
 assert.match(css,/photographerLabDirectory/);
 assert.match(css,/\.rolePageScrollArea:has\(>\.photographerLabDirectory\)/);
 assert.match(css,/settingsWorkspace\.photographerSettings > \.settingsBody/);
 assert.match(css,/overflow-y:auto!important/);
 assert.match(css,/flex:1 1 auto!important/);
 assert.match(css,/min-height:0!important/);
 assert.match(css,/overscroll-behavior-y:contain!important/);
 assert.match(css,/padding-bottom:48px!important/);
 assert.doesNotMatch(css,/html\.pb1126Desktop body #root main\.lab/);
});
test('R1652 photographer archive matches laboratory calendar dimensions without changing the lab archive',()=>{
 assert.match(css,/\.photographerArchiveWorkspace \.archiveLayout/);
 assert.match(css,/grid-template-columns:minmax\(330px,\.8fr\) minmax\(420px,1\.2fr\)!important/);
 assert.match(css,/\.photographerArchiveWorkspace :is\(\.persianCalendarCard,\.archiveDayCard\)/);
 assert.match(css,/padding:12px!important/);
 assert.match(css,/min-height:45px!important/);
 assert.match(css,/font-size:12px!important/);
 assert.match(css,/font-size:8\.5px!important/);
 assert.match(css,/max-width:1050px/);
 assert(!css.includes('labArchiveWorkspace'));
});
test('R1652 is the last CSS installed after invoice R1651 and album R1649 for both web and Windows',()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 const a=build.indexOf("await deployStep('./enable-r1648-photographer-invoice-preview.mjs')");
 const b=build.indexOf("await deployStep('./enable-r1649-photographer-album-card.mjs')");
 const c=build.indexOf("await deployStep('./enable-r1652-photographer-settings-archive.mjs')");
 const d=build.indexOf("'scripts/test-r1652-photographer-settings-archive.cjs'");
 assert(a>=0&&b>a&&c>b&&d>c);
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const html=fs.readFileSync(root+'/index.html','utf8');
  assert.equal(html.split('photobridge-r1652-photographer-settings-archive.css?v=r1652').length-1,1);
  assert(html.indexOf('photobridge-r1652-photographer-settings-archive.css')>
   html.indexOf('photobridge-r1649-photographer-album-card.css'));
  assert.equal(fs.readFileSync(root+'/photobridge-r1652-photographer-settings-archive.css','utf8'),css);
 }
 const root='dist/web/lab-desktop-ui',m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 assert.equal(m.channel,'lab');assert.equal(m.protocol,1);
 for(const name of ['index.html','photobridge-r1652-photographer-settings-archive.css']){
  const r=m.files.find(f=>f.name===name);assert(r,'native '+name);
  assert.equal(r.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
});