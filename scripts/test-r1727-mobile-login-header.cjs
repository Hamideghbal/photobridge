'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('dist/web/photobridge-r1727-mobile-login-header.css','utf8');
const old=fs.readFileSync('dist/web/photobridge-r1726-mobile-login.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');

test('login DOM keeps logo and English name before Persian portal title',()=>{
 const anchor=bundle.indexOf('className:"unifiedLoginBrand"');
 assert(anchor>0,'original PhotoBridge brand remains');
 const window=bundle.slice(anchor,anchor+460);
 assert(window.indexOf('className:"unifiedLoginLogo"')>=0,'logo remains');
 assert(window.indexOf('children:"PhotoBridge"')>window.indexOf('className:"unifiedLoginLogo"'),'logo before English name');
 assert(window.indexOf('className:"authTitle"')>window.indexOf('children:"PhotoBridge"'),'Persian portal title follows English name');
});
test('mobile header shares one RTL row in desired logo-English-Persian order',()=>{
 assert(css.includes('@media screen and (max-width:767px)'));
 assert(css.includes('grid-template-columns:max-content minmax(0,1fr)!important'));
 assert(css.includes('> .unifiedLoginBrand {\n    grid-column:1!important'));
 assert(css.includes('> .authTitle {\n    grid-column:2!important'));
 assert(css.includes('direction:rtl!important'));
 assert(css.includes('direction:ltr!important'));
 assert(css.includes('.unifiedLoginLogo {\n    order:0;'));
 assert(css.includes('.unifiedLoginBrand b {\n    order:1;'));
 assert(css.includes('font-size:15px!important'));
 assert(css.includes('white-space:normal!important'),'longer titles wrap instead of clipping');
});
test('card is a little taller without moving the keyboard-safe top anchor',()=>{
 assert(css.includes('padding:13px 14px!important'));
 assert(css.includes('row-gap:7px!important'));
 assert(css.includes('min-height:38px!important'));
 assert(css.includes('height:34px!important'));
 assert(old.includes('justify-content:flex-start!important'));
 assert(old.includes('height:var(--pb-login-height,100dvh)!important'));
 assert(old.includes('html.pbR1302LoginFocus #pbR1726InstallBanner{display:none!important}'));
 assert(!css.includes('position:fixed'),'header CSS must not override keyboard viewport positioning');
});
test('CSS is installed after R1726, exactly once, only on the web site',()=>{
 const oldRef='/photobridge-r1726-mobile-login.css?v=r1726';
 const newRef='/photobridge-r1727-mobile-login-header.css?v=r1727';
 assert.equal(html.split(newRef).length-1,1);
 assert(html.indexOf(newRef)>html.indexOf(oldRef));
 assert(!css.includes('min-width:768px'),'do not restyle desktop login');
 assert(!css.includes('pbR1726InstallBanner'),'do not modify PWA install banner');
});
