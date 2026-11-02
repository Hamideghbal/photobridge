'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {injectNativeFont,patchNativeFontCss}=require('../native-font.cjs');
test('native HTML preloads its bundled variable Vazirmatn without changing site font sizes',()=>{
 const html=injectNativeFont('<html><head><title>Lab</title></head><body></body></html>');assert(html.includes('as="font"'));assert(html.includes('font-weight:100 900'));assert(!html.includes('font-size:'));assert.equal(injectNativeFont(html),html);
 const css=fs.readFileSync(path.join(__dirname,'../verified-ui/assets/index-UIRefine-v586.css'),'utf8'),patched=patchNativeFontCss(css);assert(!patched.includes('@import"https://fonts.googleapis.com'));assert.equal(patched.slice(patched.indexOf('*{')),css.slice(css.indexOf('*{')));assert.equal(patchNativeFontCss('@import url("https://fonts.googleapis.com/css2?family=Other");'),'@import url("https://fonts.googleapis.com/css2?family=Other");');
});
