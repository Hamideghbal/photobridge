'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');

const path='dist/web/photobridge-r1591-desktop-print-four-section.css';
const htmlPath='dist/web/index.html';
const css=fs.readFileSync(path,'utf8');
const base='html:is(.pb1126Desktop,.pb1126Embedded) body #root';

test('desktop print card uses exactly four zones with three separators',()=>{
 assert(css.includes('grid-template-areas:"head facts progress actions" "details details details details"'));
 assert(css.includes('column-gap:0!important'));
 assert.equal(css.split('border-inline-start:1px solid #dce4ed!important').length-1,3);
 for(const section of ['.customerOrderHead','.customerOrderFacts','.pb1464OrderProgress','.customerOrderQuickRail'])assert(css.includes(section),section);
 assert(css.includes('.liveOrderCard:not(.albumCustomerOrderCard)'));
 assert(css.includes(base),'mobile and lab views must be unaffected');
 assert(!css.includes('@media (max-width'));
});
test('headline hidden; right, middle, middle, left alignment enforced',()=>{
 assert(css.includes('.pb1464OrderProgress > small {')&&css.includes('display:none!important'),'progress heading hidden');
 assert(css.includes('text-align:right!important'),'first section right');
 assert(css.includes('justify-items:center!important'),'second section centered');
 assert(css.includes('justify-self:center!important'),'timeline centered within third section');
 assert(css.includes('align-items:flex-end!important'),'fourth section left');
 assert(css.includes('justify-content:flex-end!important'),'action buttons left in RTL');
});
test('stylesheet served once after previous R1590',()=>{
 const html=fs.readFileSync(htmlPath,'utf8');
 const marker='/photobridge-r1591-desktop-print-four-section.css?v=r1591';
 assert.equal(html.split(marker).length-1,1);
 assert(html.indexOf(marker)>html.indexOf('/photobridge-r1590-photographer-desktop-card-fit.css'));
 assert.equal(css,fs.readFileSync('scripts/r1591-desktop-print-four-section.css','utf8'));
});
test('stylesheet balanced and injection idempotent',()=>{
 const cleaned=css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,'');
 let depth=0;for(const c of cleaned){if(c==='{')depth++;else if(c==='}')depth--;assert(depth>=0,'CSS closing brace');}
 assert.equal(depth,0,'unclosed CSS');
 const original=fs.readFileSync(htmlPath,'utf8');
 execFileSync(process.execPath,['scripts/enable-r1591-desktop-print-four-section.mjs'],{stdio:'pipe'});
 assert.equal(original,fs.readFileSync(htmlPath,'utf8'),'re-run must not duplicate stylesheet');
});
