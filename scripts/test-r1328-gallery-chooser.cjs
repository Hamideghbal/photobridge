const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const gallery=fs.readFileSync('dist/web/photobridge-r1310-layout.css','utf8');
const chooser=fs.readFileSync('dist/web/photobridge-v904r99-lab-chooser.js','utf8');
test('desktop gallery cards are full-width but intro stays compact',()=>{
  assert.match(gallery,/html\.pb1310GalleryHome body #root \.clientGalleryWorkspace\{[^}]*max-width:none!important/);
  assert.match(gallery,/html\.pb1310GalleryHome body #root \.clientGalleryWorkspace \.clientGalleryIntro\.pb1159Intro\{[^}]*max-width:760px!important/);
  assert.doesNotMatch(gallery,/clientGalleryWorkspace\{[^}]*max-width:760px!important/);
});
test('mobile chooser hides print receipt without hiding bottom dock',()=>{
  assert.match(chooser,/body\.pbR100F14ChoosingLab #root\{visibility:hidden!important;pointer-events:none!important\}/);
  assert.match(chooser,/body\.pbR100F14ChoosingLab #root \.photographerBottomAppNav \*\{visibility:visible!important;pointer-events:auto!important\}/);
  assert.match(chooser,/body\.pbR100F14ChoosingLab :is\(\.prepayOrderCard,\.prepayUploadBox,\.prepayUploadRow\)\{visibility:hidden!important/);
  assert.match(chooser,/document\.body\.classList\.remove\('pbR100F14ChoosingLab'\)/);
});
