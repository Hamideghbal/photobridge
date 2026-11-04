'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');

const source='scripts/r1590-photographer-desktop-card-fit.css';
const delivered='dist/web/photobridge-r1590-photographer-desktop-card-fit.css';
const html='dist/web/index.html';
const css=fs.readFileSync(delivered,'utf8');

test('desktop styles are delivered once, after existing print/album styles',()=>{
  const page=fs.readFileSync(html,'utf8');
  const marker='/photobridge-r1590-photographer-desktop-card-fit.css?v=r1590';
  assert.equal(page.split(marker).length-1,1);
  assert(page.indexOf(marker)>page.indexOf('/assets/index-UIRefine-v586.css'));
  assert.equal(css,fs.readFileSync(source,'utf8'));
  assert(css.includes('html:is(.pb1126Desktop,.pb1126Embedded)'));
  assert(css.startsWith('/* R1590'));
});

test('print AND album timeline labels remain directly under centered circle',()=>{
  assert(css.includes('.pb1464OrderProgress .liveTimeline > div'));
  assert(css.includes('.liveTimeline.albumCustomerTimeline'));
  assert(css.includes('grid-template-columns:repeat(5,minmax(0,1fr))!important'));
  assert(css.includes('grid-template-columns:repeat(6,minmax(0,1fr))!important'));
  assert(css.includes('flex-direction:column!important'));
  assert(css.includes('.liveTimeline > div > .timelineDot'));
  assert(css.includes('position:static!important'));
  assert(css.includes('margin:0 auto 2px!important'));
  assert(css.includes('.liveTimeline > div > :is(b,small)'));
  assert(css.includes('text-align:center!important'));
  assert(css.includes('white-space:normal!important'));
});

test('album fact cards contain all text including longer material and package names',()=>{
  assert(css.includes('.albumCustomerOrderCard .albumOrderSummary.compact .albumOrderSummaryFactsPrimary'));
  assert(css.includes('grid-template-columns:minmax(0,1.1fr)'));
  assert(css.includes('.albumOrderSummaryFactsPrimary > span'));
  assert(css.includes('height:auto!important'));
  assert(css.includes('overflow-wrap:anywhere!important'));
  assert(css.includes('.albumSummaryPackageValue'));
  assert(css.includes('word-break:normal!important'));
});

test('stylesheet syntax and build application stay idempotent',()=>{
  // A CSS brace mismatch would cause browsers to silently drop an entire block.
  const clean=css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,'');
  let depth=0;
  for(const ch of clean){
    if(ch==='{')depth++;
    if(ch==='}')depth--;
    assert(depth>=0,'unexpected closing CSS brace');
  }
  assert.equal(depth,0,'unclosed CSS block');
  const prior=fs.readFileSync(html,'utf8');
  execFileSync(process.execPath,['scripts/enable-r1590-photographer-desktop-card-fit.mjs'],{stdio:'pipe'});
  assert.equal(fs.readFileSync(html,'utf8'),prior,'a repeated build must not add duplicate CSS links');
});
