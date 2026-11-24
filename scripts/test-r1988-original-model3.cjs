'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const guide=fs.readFileSync('dist/web/photobridge-workflow-guides-v572.js','utf8');
const overlayCSS=fs.readFileSync('dist/web/photobridge-r1987-model3-guide.css','utf8');
const index=fs.readFileSync('dist/web/index.html','utf8');
// Historical R1988 tests now guard the guide functionality retained when the
// user deliberately replaced the model-three visuals with model TWO in R1989.
test('Guide JavaScript and event delegation remain valid after changing visual model',()=>{
  assert.doesNotThrow(()=>new vm.Script(guide));
  assert.match(guide,/window\.addEventListener\('click',onDelegatedVideoGuideClick,true\)/);
  assert.match(guide,/void openContextGuide\(kind,button\)/);
  assert.match(guide,/pointGuideIcon\(printGuide\);pointGuideIcon\(albumGuide\)/);
  assert.match(guide,/aria-hidden="true">▶<\/span>/);
});
test('Video modal retains separated header and video picture regardless of button theme',()=>{
  assert.match(guide,/const title=document\.createElement\('h2'\)/);
  assert.match(guide,/const frame=document\.createElement\('div'\);frame\.className='pb567GuideVideoFrame'/);
  assert.match(overlayCSS,/\.pb567GuideDialog > header\.pb567GuideDialogHead/);
  assert.match(overlayCSS,/\.pb567GuideDialog > \.pb567GuideVideoFrame/);
  assert.match(guide,/pb1986VideoError/);
});
test('Model TWO replaces model three and does not silently serve the cached old header',()=>{
  assert.match(index,/photobridge-workflow-guides-v572\.js\?v=r1989/);
  const {verifyModelTwoCssDelivery}=require('./verify-r1992-model2-css-delivery.cjs');
  assert(['direct','bundled'].includes(verifyModelTwoCssDelivery().mode),'model 2 CSS must actually be served');
  assert.match(guide,/nav\.classList\.remove\('pb1983ModelThree'\)/);
  assert.match(guide,/nav\.classList\.contains\('pb1989ModelTwo'\)/);
});
