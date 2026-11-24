'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('dist/api/equipment-rental-book.html','utf8');
const beforeBody=html.slice(0,html.indexOf('</head>'));
const css=beforeBody.match(/<style id="pbR1994StoreChooserFilterFlow">([\s\S]*?)<\/style>/)?.[1];
test('R1994: desktop embedded Store chooser filters occupy a distinct row BELOW blue title',()=>{
 assert(css,'dedicated desktop CSS must be present inside the served Store HTML head');
 assert.match(css,/@media\(min-width:821px\)/);
 assert.match(css,/html\.pb1126Embedded body\.pbR96ChoosingStore/,'do not modify mobile or Store manager screens');
 assert.match(css,/#storeChooserPanelR96 > \.pbR96StoreChooser/);
 assert.match(css,/\.pbR96StoreChooser > \.pbR96StoreChooserHead\s*\{[^}]*order:0!important/);
 assert.match(css,/\.pbR96StoreChooser > #storeChooserFiltersR1231\s*\{[^}]*order:1!important/);
 assert.match(css,/\.pbR96StoreChooser > #storeChooserListR96\s*\{[^}]*order:2!important/);
 assert.match(css,/#storeChooserFiltersR1231\s*\{[^}]*position:relative!important/);
 assert.match(css,/#storeChooserFiltersR1231\s*\{[^}]*margin:0 0 15px!important/);
 assert.match(css,/#storeChooserFiltersR1231\s*\{[^}]*inset:auto!important/);
});
test('R1994: the real chooser still creates each category filter next to the card list with original clicks',()=>{
 assert.match(html,/function ensureStoreChooserFiltersR1231\(root\)/);
 assert.match(html,/const box=root\.closest\('\.pbR96StoreChooser'\)/);
 assert.match(html,/root\.before\(filters\)/);
 assert.match(html,/filters\.addEventListener\('click',event=>/);
 assert.match(html,/data-store-filter="all"/);
 assert.match(html,/data-store-filter="camera"/);
 assert.match(html,/data-store-filter="frames"/);
 assert.match(html,/function applyStoreChooserKindR1231\(\)/);
});
