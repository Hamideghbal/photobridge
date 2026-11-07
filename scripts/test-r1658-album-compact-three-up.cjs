'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const roots=['dist/web','dist/web/lab-desktop-ui'];
const bundle='assets/index-UIRefine-v655-r84.js';
const stylesheet='photobridge-r1658-album-compact-three-up.css';
test('R1658: compact page cards use three visible columns even at mobile widths',()=>{
 const css=fs.readFileSync('scripts/r1658-album-compact-three-up.css','utf8');
 assert.match(css,/\.albumOrderWorkspaceNoHero \.albumFilesCompact \.albumFileGrid\.albumFileQcGrid\s*\{[\s\S]*?grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
 assert.match(css,/@media\(max-width:820px\)[\s\S]*?grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
 assert.match(css,/object-fit:contain!important/);
 assert(!css.includes('.albumQuoteCard'),'price sidebar should keep its own layout and sticky position');
});
test('R1658: one Add Album Page, no Add Folder, warning inside configuration',()=>{
 for(const root of roots){
  const js=fs.readFileSync(root+'/'+bundle,'utf8');
  assert.equal(js.split('className:"albumFileToolAction add albumFileActionFile"').length-1,1,root);
  assert(!js.includes('className:"albumFileToolAction add albumFileActionFolder"'),root);
  assert.match(js,/افزودن برگه آلبوم/);
  const config=js.indexOf('className:"card panel albumConfigurator"');
  const header=js.indexOf('className:"albumOrderEmbeddedHeader"',config);
  const warning=js.indexOf('className:"albumUploadResumeNotice"',config);
  const firstFields=js.indexOf('className:"albumConfigBlock albumConfigBlockCompactV409"',config);
  const quote=js.indexOf('className:"card panel albumQuoteCard"',config);
  assert(config>=0&&header>config&&warning>header&&firstFields>warning&&quote>firstFields,
    root+' warning belongs to left config before fields, not outer price grid');
  assert.match(js,/className:"albumQuoteRows"/,root);
  assert.doesNotThrow(()=>new Function(js),root);
 }
});
test('R1658: site and native resources are cached and integrity verified',()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.indexOf("await deployStep('./enable-r1658-album-compact-three-up.mjs')")>
        build.indexOf("await deployStep('./enable-r1657-photographer-finance-mobile-tab.mjs')"));
 for(const root of roots){
  const html=fs.readFileSync(root+'/index.html','utf8');
  assert.equal(html.split('/'+stylesheet+'?v=r1658').length-1,1,root);
  assert.equal(html.split('albumThreeUp=r1658').length-1,1,root);
  assert.equal(fs.readFileSync(root+'/'+stylesheet,'utf8'),
               fs.readFileSync('scripts/r1658-album-compact-three-up.css','utf8'),root);
  if(root.endsWith('lab-desktop-ui')){
   const m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
   for(const name of ['index.html',bundle,stylesheet]){
    const entry=m.files.find(row=>row.name===name);
    assert(entry,'missing native asset '+name);
    assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
   }
  }
 }
});
