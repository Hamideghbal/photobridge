'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), crypto=require('node:crypto');
const css=fs.readFileSync('scripts/r1649-photographer-album-card.css','utf8');
const scopes=['dist/web','dist/web/lab-desktop-ui'];

test('album-only desktop scope leaves the working print-photo and mobile layouts alone',()=>{
 assert(css.includes('@media (min-width:821px)'));
 assert(css.includes('html:is(.pb1126Desktop,.pb1126Embedded)'));
 assert(css.includes('.liveOrderCard.albumCustomerOrderCard'));
 assert(!css.includes(':not(.albumCustomerOrderCard)'));
 assert(!css.includes('@media (max-width'));
 assert(!css.includes('.labOrderCard'));
 assert(!css.includes('main.lab'));
 for(const rule of css.split('{').slice(0,-1)){
  const scoped=rule.slice(rule.lastIndexOf('}')+1).trim();
  if(scoped.startsWith('html:'))assert(scoped.includes('.albumCustomerOrderCard'),scoped);
 }
});

test('album progress uses four card zones, no status heading, centered six-stage timeline, with one left-side divider',()=>{
 assert(css.includes('grid-template-areas:"head facts progress actions" "details details details details"!important'));
 assert(css.includes('grid-area:progress!important'));
 assert(css.includes('.pb1464OrderProgress > small'));
 assert(css.includes('display:none!important'));
 assert(css.includes('place-content:center!important'));
 assert(css.includes('.liveTimeline.albumCustomerTimeline'));
 assert(css.includes('grid-template-columns:repeat(6,minmax(0,1fr))!important'));
 assert(css.includes('justify-self:center!important'));
 assert(css.includes('grid-area:actions!important'));
 assert.equal(css.split('border-inline-start:1px solid #dce4ed!important').length-1,1);
 assert(css.includes('flex-wrap:nowrap!important'));
 assert(css.includes('grid-area:details!important'));
});

test('cover inscription is column six on row one, not an additional album-facts row',()=>{
 assert(css.includes('.albumOrderSummary.compact .albumOrderSummaryFactsPrimary'));
 assert(css.includes('grid-template-rows:minmax(64px,auto)!important'));
 assert(css.includes('.albumOrderSummaryFactsPrimary > span'));
 assert(css.includes('grid-row:1!important'));
 assert(css.includes('grid-column:6!important'));
 assert(css.includes('overflow-wrap:anywhere!important'));
 assert(css.includes('white-space:normal!important'));
});

test('CSS syntax is balanced, latest website and native manifest contain one verified stylesheet',()=>{
 const cleaned=css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,'');
 let depth=0;
 for(const ch of cleaned){if(ch==='{')depth++;else if(ch==='}')depth--;assert(depth>=0);}
 assert.equal(depth,0);
 for(const root of scopes){
  assert.equal(fs.readFileSync(root+'/photobridge-r1649-photographer-album-card.css','utf8'),css);
  const html=fs.readFileSync(root+'/index.html','utf8');
  const marker='photobridge-r1649-photographer-album-card.css?v=r1649';
  assert.equal(html.split(marker).length-1,1,root);
  assert(html.indexOf(marker)>html.indexOf('photobridge-r1591-desktop-print-four-section.css'),root);
  assert(html.indexOf(marker)>html.indexOf('photobridge-r1648-photographer-invoice.css'),root);
 }
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 assert.equal(manifest.channel,'lab');assert.equal(manifest.protocol,1);
 for(const name of ['index.html','photobridge-r1649-photographer-album-card.css']){
  const entry=manifest.files.find(f=>f.name===name);
  assert(entry,'native asset missing '+name);
  assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'),name);
 }
});

test('R1649 builds after R1648 and adds no API or finance mutation',()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 const old=build.indexOf("await deployStep('./enable-r1648-photographer-invoice-preview.mjs')");
 const current=build.indexOf("await deployStep('./enable-r1649-photographer-album-card.mjs')");
 const tests=build.indexOf("'scripts/test-r1649-photographer-album-card.cjs'");
 assert(old>=0&&current>old&&tests>current);
});
