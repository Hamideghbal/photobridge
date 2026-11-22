// R1961 — prevent the album-cover save path from dropping size-specific priced models.
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const api=fs.readFileSync('dist/api/server.js','utf8');
const syncStart=api.indexOf('async function syncLabAlbumSizesFromPrintTariffs(');
const syncEnd=api.indexOf('\nasync function ',syncStart+30);
const routeStart=api.indexOf("if (req.method === 'PUT' && url.pathname === '/api/lab/album-settings')");
const routeEnd=api.indexOf('\n        if (req.method',routeStart+30);
test('cover variant prices and photographer cover rows use all active synchronized album sizes',()=>{
 assert(syncStart>=0&&syncEnd>syncStart,'R1960 album-size sync must exist');
 assert(routeStart>=0,'album-settings PUT route exists');
 const route=api.slice(routeStart,routeEnd<0?undefined:routeEnd);
 assert.match(route,/await syncLabAlbumSizesFromPrintTariffs\(c, labId\)/);
 assert.match(route,/SELECT id,label FROM lab_album_sizes WHERE lab_id=\$1 AND active=true ORDER BY sort_order,label/);
 assert.doesNotMatch(route,/active=true AND binding_price>0/);
 assert.match(route,/sizeIdsByLabel\.get\(cleanText\(pr\.sizeLabel\)\)/);
 assert.match(route,/INSERT INTO lab_album_cover_variant_prices/);
 assert.match(route,/INSERT INTO lab_album_covers/);
 assert.match(route,/INSERT INTO lab_album_cover_colors/);
});
test('the order route validates chosen cover against the same album-size ID',()=>{
 const start=api.indexOf('async function albumOrderSnapshot(');
 const end=api.indexOf('\nasync function ',start+30);
 assert(start>=0&&end>start);
 const snapshot=api.slice(start,end);
 assert.match(snapshot,/catalog\.covers\.find\(/);
 assert.match(snapshot,/String\(x\.sizeId\) === String\(size\.id\)/);
});
