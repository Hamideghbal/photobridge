'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const guide=read('dist/web/photobridge-workflow-guides-v572.js');
const css=read('dist/web/photobridge-r1987-model3-guide.css');
const html=read('dist/web/index.html');
test('R1988: selected original numbered model 3 is loaded, never the stale guide assets',()=>{
  assert.match(html,/photobridge-workflow-guides-v572\.js\?v=r1988&pb=original-numbered-model-three/);
  assert.match(html,/photobridge-r1987-model3-guide\.css\?v=r1988-original-numbered-model-three/);
  assert.match(guide,/USER-SELECTED ORIGINAL numbered model 3/);
  assert.doesNotThrow(()=>new (require('node:vm').Script)(guide));
});
test('R1988: in the RTL secondary bar, both tutorials follow their own main tab',()=>{
  assert.match(guide,/Visual order in RTL: \[چاپ عکس\] \[ویدیوی چاپ\] \[صحافی آلبوم\] \[ویدیوی آلبوم\]/);
  assert.match(guide,/if\(button\.parentElement!==nav\|\|button\.previousElementSibling!==target\)/);
  assert.match(guide,/target\.insertAdjacentElement\('afterend',button\)/);
  assert.doesNotMatch(guide,/pointGuideArrow/);
  assert.match(guide,/aria-hidden="true">▶<\/span>/);
  assert.match(guide,/pointGuideIcon\(printGuide\);pointGuideIcon\(albumGuide\)/);
});
test('R1988: real-desktop-header-specific selected visual matches the reference',()=>{
  const block=css.slice(css.indexOf('R1988 — faithful selected original image model 3'));
  assert.ok(block.length>2000);
  assert.match(block,/#pb1126ChromeHost #pb1126DesktopHeader \.pb1126Secondary \.pb1127PrintModes > button/);
  assert.match(block,/background:#2460db!important/);
  assert.match(block,/background:#fff!important/);
  assert.match(block,/background:#f4f7fc!important/);
  assert.match(block,/border-radius:50%!important/);
  assert.match(block,/margin-inline-end:16px!important/);
  assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'CSS must parse balanced rules');
});
test('R1988: video window title remains above, never on top of the video picture',()=>{
  assert.match(css,/\.pb567GuideDialog > header\.pb567GuideDialogHead/);
  assert.match(css,/\.pb567GuideDialog > \.pb567GuideVideoFrame/);
  assert.match(css,/position:relative!important; display:flex!important; flex-direction:column!important/);
  assert.match(guide,/const title=document\.createElement\('h2'\)/);
});
