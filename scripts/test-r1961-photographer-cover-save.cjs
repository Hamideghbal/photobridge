// R1961 — cover pricing editor, catalog and photographer order share active binding size scope.
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const server=read('dist/api/server.js');
const routeStart=server.indexOf("if (req.method === 'PUT' && url.pathname === '/api/lab/album-settings')");
const routeEnd=routeStart<0?-1:server.indexOf("\n        if (req.method",routeStart+70);
assert(routeStart>=0&&routeEnd>routeStart,'Album settings save route must exist');
const route=server.slice(routeStart,routeEnd);

test('R1961: lab cover price editing accepts the same active sizes as R1960 sync',()=>{
 assert(route.includes('(albumBase.sizes || []).filter((x) => x.active !== false)'));
 assert(!route.includes('(albumBase.sizes || []).filter((x) => x.active !== false && Number(x.bindingPrice || 0) > 0)'));
 assert(route.includes('SELECT id,label FROM lab_album_sizes WHERE lab_id=$1 AND active=true ORDER BY sort_order,label'));
 assert(!route.includes('SELECT id,label FROM lab_album_sizes WHERE lab_id=$1 AND active=true AND binding_price>0'));
 assert(route.includes('sizeIdsByLabel.get(cleanText(pr.sizeLabel))'));
 assert(route.includes('INSERT INTO lab_album_cover_variant_prices'));
 assert(route.includes('albumMoney(pr.price)'),'persist exact user-entered cover tariff');
 assert(server.includes('pb1803RecoverPricedCovers(cq.rows.map('),'customer catalog recovers priced cover choices');
 assert(server.includes("return sendJson(res, 200, { settings: await albumCatalogForLab(labId, false) });"),'photographer API uses same catalog');
});
const helper=read('scripts/r1803-album-cover-helper.js.txt');
const context=vm.createContext({});
vm.runInContext(helper,context);
const recover=(legacy,catalog,sizes)=>Array.from(context.pb1803RecoverPricedCovers(legacy,catalog,sizes));
const fixtures=price=>({
 materials:[{id:'m',name:'چرم',active:true}],
 types:[{id:'t',name:'سفارشی',active:true}],
 colors:[{id:'c',name:'زرشکی',colorValue:'#AA1122',active:true}],
 variants:[{id:'v',materialId:'m',typeId:'t',active:true,colorIds:['c'],prices:[{sizeId:'size-custom',colorId:'c',price}]}]
});
test('R1961: newly priced cover is selectable for a size whose legacy binding price remains zero',()=>{
 const sized=[{id:'size-custom',label:'25×50',binding_price:0,active:true}];
 const found=recover([],fixtures(185000),sized);
 assert.equal(found.length,1);
 assert.equal(found[0].sizeId,'size-custom');
 assert.equal(found[0].price,185000);
 assert.equal(found[0].colors[0].price,185000);
 assert.equal(found[0].id,'catalog:v:size-custom');
 assert.equal(recover([],fixtures(0),sized).length,0,'nonpriced cover must remain unavailable');
 assert.equal(recover([],fixtures(185000),[{...sized[0],active:false}]).length,0,'inactive album size must remain unavailable');
 assert.equal(recover([],fixtures(185000),[{id:'other',label:'20×30',active:true,binding_price:200}]).length,0,'never substitute another size');
});
