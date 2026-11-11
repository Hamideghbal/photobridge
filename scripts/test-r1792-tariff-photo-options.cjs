'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
test('R1792: model-only toggle belongs to size group, never individual photo card',()=>{
 const ui=read('dist/web/assets/index-UIRefine-v655-r84.js');
 const a=ui.indexOf('function ej('),b=ui.indexOf('function vh(',a);
 assert(a>=0&&b>a);
 const part=ui.slice(a,b);
 assert(!part.includes('className:"pb1781WithoutPrint"'));
 const idx=part.indexOf('className:"simplePrintPhotoGrid",children:[');
 assert(idx>=0);
 const map=part.indexOf('ue.files.map(Be=>{',idx);
 assert(map>idx&&part.slice(idx,map).includes('pb1792AddonOnlyGroup'));
 assert(part.slice(idx,map).includes('withoutPrint:ev.target.checked'));
 assert(part.includes('withoutPrint:!!(tt.withoutPrint&&(yt||Tt))'),'unchanged persisted no-paper selection');
});
test('R1792: customer columns and horizontal scroll match colleague physical grid',()=>{
 const css=read('dist/web/photobridge-r1792-tariff-photo-options.css');
 assert(css.includes('grid-template-columns:148px repeat(var(--pb1777-columns,8),minmax(0,1fr))'));
 assert(css.includes('overflow-x:auto!important'));
 assert(css.includes('width:max(100%,calc(148px + var(--pb1777-columns,8)*110px))'));
 assert(css.includes('simplePrintPhotoAddonOverrides')&&css.includes('grid-column:1/-1'));
 assert.equal(read('dist/web/lab-desktop-ui/photobridge-r1792-tariff-photo-options.css'),css);
 for(const root of ['dist/web','dist/web/lab-desktop-ui'])assert(read(root+'/index.html').includes('photobridge-r1792-tariff-photo-options.css'));
});
test('R1792: Windows Lab stylesheet checksum stays accurate',()=>{
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(read(root+'/manifest.json'));
 for(const name of ['photobridge-r1792-tariff-photo-options.css','index.html']){
  const f=manifest.files.find(v=>v.name===name);
  assert(f,'missing '+name);
  assert.equal(f.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
});
