'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const css=fs.readFileSync('dist/web/photobridge-r1726-mobile-login.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const app=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');

test('R1726 mobile login input shorthand is superseded specifically for the password field',()=>{
 const mobile=css.indexOf('padding:5px 10px!important;');
 const marker=css.indexOf('/* R1729:');
 assert(mobile>0&&marker>mobile,'R1729 override must follow the R1726 10px shorthand');
 const fix=css.slice(marker);
 assert.match(fix,/@media screen and \(max-width:767px\)/);
 assert.match(fix,/\.unifiedLoginPage form\.unifiedLoginCard \.passwordField > input/);
 assert.match(fix,/form\.rentalUnifiedLogin \.passwordField > input/);
 assert.match(fix,/form\.labLogin \.passwordField > input/);
 assert.match(fix,/padding-left:76px!important/);
 assert.match(fix,/padding-right:12px!important/);
 assert.match(fix,/box-sizing:border-box!important/);
 assert(!fix.includes('input[type="password"]'),'padding must persist after clicking نمایش');
 assert(!fix.includes('.passwordToggle {'),'do not reposition or change show/hide button');
 assert(!fix.includes('.unifiedLoginShell {'),'do not change the mobile top-aligned login layout');
});

test('first masked and shown characters start clear of the left-side Show/Hide button',()=>{
 // Measured from original login CSS at its narrow desktop/mobile breakpoints:
 // Show/Hide control begins 7px from the left edge, with max width 54px.
 const buttonLeft=7,buttonWidth=54,minimumGap=12,inputTextStart=76;
 assert(inputTextStart>=buttonLeft+buttonWidth+minimumGap,
   'the typed text must start after the entire button and clear gap');
 assert(app.includes('className:"passwordField"'));
 assert(app.includes('className:"passwordToggle"'));
 assert(app.includes('type:h?"text":"password"'));
 assert(app.includes('dir:l,readOnly:m'),'login uses LTR password input; reserve left padding');
});

test('cache-busted mobile login stylesheet is linked only once',()=>{
 const ref='/photobridge-r1726-mobile-login.css?v=r1729';
 assert.equal(html.split(ref).length-1,1);
 assert(!html.includes('/photobridge-r1726-mobile-login.css?v=r1726'));
 for(const page of ['dist/api/equipment-rental-portal.html']){
  if(!fs.existsSync(page))continue;
  const content=fs.readFileSync(page,'utf8');
  if(!content.trim())continue;
  assert.equal(content.split(ref).length-1,1);
 }
});

test('the R1727 header and R1726 keyboard/install behavior remain unchanged',()=>{
 assert(css.includes('html.pbR1302LoginFocus #pbR1726InstallBanner{display:none!important}'));
 assert(html.includes('/photobridge-r1727-mobile-login-header.css?v=r1727'));
 assert(html.includes('/photobridge-r1726-login-install.js?v=r1726'));
});
