'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const test=require('node:test');
const web=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const api=fs.readFileSync('dist/api/server.js','utf8');
const header=fs.readFileSync('dist/web/photobridge-r1372-third-header.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1379-album-matrix.css','utf8');

test('R1379: album has three independent catalog toggles persisted in lab preferences',()=>{
 for(const key of ['coverCatalogEnabled','packageCatalogEnabled','extrasCatalogEnabled']){
  assert.ok(web.includes('["'+key+'",'),key+' switch');
  assert.ok(api.includes('album'+(key==='coverCatalogEnabled'?'Cover':key==='packageCatalogEnabled'?'Package':'Extras')+'CatalogEnabled'),key+' persistence');
 }
 assert.match(web,/pb1379Toggle\(flag,ne\.target\.checked\)/);
 assert.match(header,/pb1379ThirdToggles/);
 assert.match(css,/margin-inline-start:auto/);
});
test('R1379: size/type matrices share a price across every matching color',()=>{
 assert.match(web,/function PB1379AlbumPriceMatrix\(/);
 assert.match(web,/pb1379CoverColumns/);
 assert.match(web,/pb1379PackageColumns/);
 assert.match(web,/Wn\(column\.id,size,value,!0\)/);
 assert.match(web,/Vt\(column\.id,size,value,!0\)/);
 assert.match(web,/bindingPrice\|\|0\)>0/);
});
test('R1379: toggles alter photographer order options and preserve optional free-text package',()=>{
 assert.match(web,/Ye=!ye/);
 assert.match(web,/l\.packageCatalogEnabled===!1&&e\.jsxs/);
 assert.match(web,/l\.extrasCatalogEnabled!==!1&&\(l\.extras\|\|\[\]\)\.length>0/);
 assert.match(web,/packageRequest:l\.packageCatalogEnabled===!1\?pb1379PackageRequest\.trim\(\):""/);
 assert.match(api,/catalog\.extrasCatalogEnabled === false \? \[\] :/);
 assert.match(api,/const packageCatalogEnabled = catalog\.packageCatalogEnabled !== false/);
});
test('R1379: unpriced colors remain selectable but require explicit lab invoice price',()=>{
 assert.match(api,/const manualPackageRequired = Boolean\(packageRequest \|\| \(albumPackage/);
 assert.match(api,/album-custom-package/);
 assert.match(api,/currentPricing\.manualPackagePrice = rounded/);
 assert.match(api,/manualPackageRequired/);
 assert.match(api,/for \(const rawSizeLabel of sizeIdsByLabel\.keys\(\)\)/);
 assert.match(api,/const available = chosen\.map\(draftColorId/);
});
test('R1379: deployment assets are linked',()=>{
 assert.ok(html.includes('/photobridge-r1379-album-matrix.css?v=r1379'));
 assert.ok(html.includes('&albumMatrix=r1379'));
});
