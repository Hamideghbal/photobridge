// R1961 — the selected photographer cover must come from the priced variant catalog.
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const api=fs.readFileSync('dist/api/server.js','utf8');
const start=api.indexOf('function pb1961CoversFromPricedVariants(');
const end=api.indexOf('\nasync function albumCatalogForLab(',start);
assert(start>=0&&end>start,'R1961 catalog projection installed');
const resolve=vm.runInNewContext('('+api.slice(start,end)+')',{Object,String,Map,Set,Number,Math,Array});
const old=[{id:'old',name:'جلد قدیمی',material_name:'قدیمی',model_name:'استاندارد',
 size_id:'a',size_label:'20×30',active:true,price:50,colors:[{id:'old-color',price:50,active:true}]}];
const catalog={
 materials:[{id:'mat',name:'چرم',active:true}],
 types:[{id:'type',name:'طرح جدید',imageData:'/album-cover-samples/new.jpg',active:true}],
 colors:[{id:'red',name:'قرمز',colorValue:'#ff0000',active:true},
         {id:'blue',name:'آبی',colorValue:'#0000ff',active:true}],
 variants:[{id:'variant',materialId:'mat',typeId:'type',active:true,
 colorIds:['red'],prices:[
 {colorId:'red',sizeId:'a',price:250},
 {colorId:'red',sizeId:'b',price:330},
 {colorId:'blue',sizeId:'b',price:390},
 {colorId:'red',sizeId:'c',price:0}
 ]}]
};
const sizes=[{id:'a',label:'20×30',active:true},{id:'b',label:'30×40',active:true},{id:'c',label:'40×60',active:true}];
test('model-color-size prices override old cover choices for photographer',()=>{
 const covers=resolve(catalog,sizes,old,false);
 assert.equal(covers.length,2);
 assert.equal(covers[0].id,'catalog:variant:a');
 assert.equal(covers[1].id,'catalog:variant:b');
 assert.equal(covers[0].price,250);
 assert.equal(covers[1].price,330);
 assert.equal(covers[1].colors.length,1);
 assert.equal(covers[1].colors[0].id,'catalog-color:variant:b:red');
 assert.equal(covers[1].modelName,'طرح جدید');
 assert.equal(covers[1].sizeLabel,'30×40');
 assert.equal(covers[1].imageData,'/album-cover-samples/new.jpg');
 assert.ok(!covers.some(x=>x.id==='old'));
});
test('legacy covers remain available only when the new pricing matrix has no positive active prices',()=>{
 assert.equal(resolve({...catalog,variants:[]},sizes,old,false)[0].id,'old');
 assert.equal(resolve({...catalog,variants:catalog.variants.map(v=>({...v,active:false}))},sizes,old,false)[0].id,'old');
});
test('server snapshot validates chosen priced cover and size',()=>{
 const at=api.indexOf('async function albumOrderSnapshot('),until=api.indexOf('\nasync function ',at+30);
 const snapshot=api.slice(at,until);
 assert.match(snapshot,/catalog\.covers\.find\(/);
 assert.match(snapshot,/String\(x\.sizeId\) === String\(size\.id\)/);
 assert.match(api,/covers: pb1961CoversFromPricedVariants\(coverCatalog,sq\.rows,cq\.rows,includeInactive\)/);
});

test('lab cover catalog save retains active priced custom binding sizes even with zero legacy binding price',()=>{
 const start=api.indexOf("if (req.method === 'PUT' && url.pathname === '/api/lab/album-settings')");
 const end=api.indexOf("if (req.method === 'PUT'",start+10);
 const route=api.slice(start,end<0?undefined:end);
 assert(start>=0,'lab album settings save handler exists');
 assert(route.includes('sizes = (albumBase.sizes || []).filter((x) => x.active !== false)'),
   'active album sizes must not require legacy binding price');
 assert(route.includes('SELECT id,label FROM lab_album_sizes WHERE lab_id=$1 AND active=true ORDER BY sort_order,label'),
   'cover model tariff size map must not reject custom/combined binding sizes');
 assert(!route.includes('active=true AND binding_price>0 ORDER BY sort_order,label'));
});
