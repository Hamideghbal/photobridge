'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Script}=require('node:vm');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const css=read('dist/web/photobridge-r1989-model2-segmented.css');
const guide=read('dist/web/photobridge-workflow-guides-v572.js');
const desktop=read('dist/web/photobridge-r1126-desktop-navigation.js');
const html=read('dist/web/index.html');
const writer=read('scripts/enable-r1966-desktop-calendar-store-chooser.mjs');
test('R1989: load the approved model 2 CSS and JS with new uncached URLs',()=>{
  const {verifyModelTwoCssDelivery}=require('./verify-r1992-model2-css-delivery.cjs');
  assert(['direct','bundled'].includes(verifyModelTwoCssDelivery().mode),'model 2 CSS must actually be served');
  assert.match(html,/photobridge-workflow-guides-v572\.js\?v=r1989/);
  assert.match(writer,/\['photobridge-workflow-guides-v572\.js','v','r1989'\]/);
  assert.doesNotThrow(()=>new Script(guide));
  assert.doesNotThrow(()=>new Script(desktop));
});
test('R1989: the four controls stay in the single segmented capsule',()=>{
  assert.match(css,/\.pb1127PrintModes\.pb1989ModelTwo/);
  assert.match(css,/\.photographerPrintModeNav\.pb1989ModelTwo/);
  assert.match(css,/flex-wrap:nowrap!important/);
  assert.match(css,/border-radius:18px!important/);
  assert.match(css,/gap:0!important/);
  assert.match(guide,/nav\.classList\.remove\('pb1983ModelThree'\)/);
  assert.match(guide,/nav\.classList\.contains\('pb1989ModelTwo'\)/);
});
test('R1989: main buttons are actual blue/white pill controls rather than text underline tabs',()=>{
  assert.match(css,/background:#fff!important; color:#1b2e48!important/);
  assert.match(css,/background:var\(--pb1989-blue\)!important; border-color:var\(--pb1989-blue\)!important/);
  assert.match(css,/color:#fff!important; box-shadow:none!important/);
  assert.match(css,/\.pb1131MovingIndicator/);
  assert.match(css,/content:none!important; opacity:0!important/);
  assert.match(css,/button:is\(\.photographerPrintPhotoTab,\.photographerPrintAlbumTab\)::after/);
});
test('R1989: active mode changes synchronously and keeps original React click behavior',()=>{
  assert.match(desktop,/button\.classList\.toggle\('active',selected\)/);
  assert.match(desktop,/button\.classList\.toggle\('selected',selected\)/);
  assert.match(desktop,/button\.setAttribute\('aria-pressed',String\(selected\)\)/);
  assert.match(desktop,/button\.dataset\.pb1989Active=String\(selected\)/);
  // Prebuild: direct React source click. Docker R1307: live replacement-node proxy.
  assert(desktop.includes('press(copy);original.click()')||desktop.includes('press(copy);target.click()'));
  if(desktop.includes('function livePrintControl(key)')){
    assert(desktop.includes('const target=printKey?livePrintControl(printKey):original'));
  }
  assert.match(css,/data-pb1989-active="true"/);
});
test('R1989: both muted video tutorials follow the correct matching mode in RTL',()=>{
  assert.match(guide,/target\.insertAdjacentElement\('afterend',button\)/);
  assert.match(guide,/pointGuideIcon\(printGuide\);pointGuideIcon\(albumGuide\)/);
  assert.match(guide,/window\.addEventListener\('click',onDelegatedVideoGuideClick,true\)/);
  assert.match(css,/\.pb1978VideoGuideButton/);
  assert.match(css,/var\(--pb1989-guide-bg\)/);
  assert.match(css,/border-radius:50%!important/);
});
test('R1989: mobile stays one row, styled independently from the desktop chrome',()=>{
  assert.match(css,/@media\(max-width:820px\)/);
  assert.match(css,/width:min\(100%,calc\(100vw - 12px\)\)!important/);
  assert.match(css,/flex:1 1 26%!important/);
  assert.match(css,/flex:1 1 21%!important/);
});
test('R1989: existing video-modal title stays outside the picture',()=>{
  const old=read('dist/web/photobridge-r1987-model3-guide.css');
  assert.match(old,/\.pb567GuideDialog > header\.pb567GuideDialogHead/);
  assert.match(old,/\.pb567GuideDialog > \.pb567GuideVideoFrame/);
  assert.match(guide,/const title=document\.createElement\('h2'\)/);
});

test('R1993: selected Print/Album label and nested text are always white, inactive remains dark',()=>{
 const patch=css.slice(css.indexOf('/* R1993: active blue Print/Album controls'));
 assert(patch.length>1000,'R1993 CSS loaded');
 assert.match(patch,/\.pb1127PrintModes\.pb1989ModelTwo > button:is\(\.photographerPrintPhotoTab,\.photographerPrintAlbumTab\):is\(\.active,/);
 assert.match(patch,/\.photographerPrintModeNav\.pb1989ModelTwo > button:is\(\.photographerPrintPhotoTab,\.photographerPrintAlbumTab\):is\(\.active,/);
 assert.match(patch,/:is\(span,strong,em,b,i,small,label\)/,'nested typography inherits active color even if app CSS pins it');
 assert.match(patch,/color:#fff!important/);
 assert.match(patch,/-webkit-text-fill-color:#fff!important/);
 assert.match(css,/background:#fff!important; color:#1b2e48!important/,'inactive remains white/dark');
});
test('R1993: Finance and last tutorial are separated by one edge, not two',()=>{
 const patch=css.slice(css.indexOf('/* R1993: active blue Print/Album controls'));
 assert.match(patch,/:has\(\+ \.pb1127PrintUtilities > button\)/,'desktop adjacent Finance utility boundary');
 assert.match(patch,/border-inline-end:0!important/,'the overlapping second edge is removed');
 assert.match(css,/background:#e1e6ee!important/,'internal segment dividers remain in place');
});
