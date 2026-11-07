'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const name='photobridge-r1660-mobile-lab-order-number.css';
const css=fs.readFileSync('scripts/r1660-mobile-lab-order-number.css','utf8');
test('R1660 lab phone order number never breaks the # and digits',()=>{
 assert.match(css,/@media\(max-width:820px\)/);
 assert.match(css,/\.labOrderHead>div:first-child>b\s*\{[^}]*white-space:nowrap!important/);
 assert.match(css,/\.labOrderHead>div:first-child>b\s*\{[^}]*word-break:keep-all!important/);
 assert.match(css,/\.labOrderHead>div:first-child>b\s*\{[^}]*overflow-wrap:normal!important/);
 assert.match(css,/\.labOrderHead>div:first-child>b\s*\{[^}]*width:max-content!important/);
});
test('R1660 prevents compressed lab card header even on narrow tablets',()=>{
 assert.match(css,/\.labOrderScrollArea \.labOrderCard\s*\{[^}]*display:block!important/);
 assert.match(css,/\.labOrderCard>\.labOrderHead\s*\{[^}]*display:flex!important/);
 assert.match(css,/\.labOrderCard>\.labOrderHead\s*\{[^}]*flex-wrap:wrap!important/);
 assert(!css.includes('.photographerMain')&&!css.includes('.albumQuoteCard'));
});
test('R1660 installs after R1659 and leaves the compiled order header unchanged',()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.indexOf("await deployStep('./enable-r1660-mobile-lab-order-number.mjs')")>
        build.indexOf("await deployStep('./enable-r1659-single-mobile-dock-settings-active.mjs')"));
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert.equal(html.split('/'+name+'?v=r1660').length-1,1);
 assert.equal(fs.readFileSync('dist/web/'+name,'utf8'),css);
 const compiled=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 assert(compiled.includes('className:"customerOrderHead labOrderHead"'));
 assert(compiled.includes('["#",V(le.number)]'));
});
