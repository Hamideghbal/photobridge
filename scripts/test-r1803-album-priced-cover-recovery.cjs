'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const helper=fs.readFileSync('scripts/r1803-album-cover-helper.js.txt','utf8');
const ctx=vm.createContext({});vm.runInContext(helper,ctx);
const sizes=[{id:'s',label:'20×30',binding_price:35000,active:true},{id:'other',label:'30×40',binding_price:35000,active:true}];
function fixture(price=125000){return {materials:[{id:'m',name:'چرم',active:true}],types:[{id:'t',name:'طرح سفارشی',imageData:'photo',active:true}],colors:[{id:'c',name:'سفید',colorValue:'#FFFFFF',active:true}],variants:[{id:'v',materialId:'m',typeId:'t',active:true,colorIds:['c'],prices:[{sizeId:'s',colorId:'c',price}]}]}}
const recover=(rows,cat=fixture(),sz=sizes)=>Array.from(ctx.pb1803RecoverPricedCovers(rows,cat,sz));
test('R1803: existing priced bespoke cover appears for the requested binding size even with no legacy projection',()=>{
 const rows=recover([]);assert.equal(rows.length,1);const row=rows[0];assert.equal(row.sizeId,'s');assert.equal(row.price,125000);assert.equal(row.colors[0].price,125000);assert.equal(row.modelName,'طرح سفارشی');assert.equal(row.imageData,'photo');assert(row.id.startsWith('catalog:'));
 assert.deepEqual(recover([]).map(v=>v.id),rows.map(v=>v.id));
});
test('R1803: reject missing/zero/negative prices and refuse to synthesize the wrong size',()=>{
 assert.equal(recover([],fixture(0)).length,0);assert.equal(recover([],fixture(-1)).length,0);
 assert.equal(recover([],fixture(125000),[{id:'other',active:true,binding_price:35000}]).length,0);
 assert.equal(recover([],fixture(125000),[{id:'s',active:false,binding_price:35000}]).length,0);
 assert.equal(recover([],fixture(125000),[{id:'s',active:true,binding_price:0}]).length,0);
});
test('R1803: inactive variants, types, materials and colors remain unavailable',()=>{
 for(const k of ['variants','types','materials','colors']) {const cat=fixture();cat[k][0].active=false;assert.equal(recover([],cat).length,0,k)}
 const disabled=fixture();disabled.variants[0].colorIds=[];assert.equal(recover([],disabled).length,0);
 const palette=fixture();palette.types[0].name='__PB_COLOR_PALETTE__';assert.equal(recover([],palette).length,0);
});
test('R1803: keep already-projected catalog rows and their prices without duplicate or overwrite',()=>{
 const legacy={id:'saved-id',sizeId:'s',materialName:'چرم',modelName:'طرح سفارشی',price:125000,colors:[{colorValue:'#FFFFFF',price:125000}]};
 const result=recover([legacy]);assert.equal(result.length,1);assert.equal(result[0].id,'saved-id');assert.equal(result[0].price,125000);
});
test('R1803: the fallback never mutates catalog pricing or legacy row objects',()=>{
 const cat=fixture(), legacy=[];const before=JSON.stringify(cat);recover(legacy,cat);assert.equal(JSON.stringify(cat),before);assert.equal(legacy.length,0);
});
test('R1803: actual composed catalog and invoice snapshot use authoritative saved cover price',async()=>{
 const server=fs.readFileSync('dist/api/server.js','utf8');const originalMark='async function albumCatalogForLabOriginal(';
 const start=server.indexOf(originalMark);
 const wrapperStart=server.indexOf('\nasync function albumCatalogForLab(',start+originalMark.length);
 const snapshotStart=server.indexOf('\nasync function albumOrderSnapshot(',wrapperStart);
 assert(start>=0&&wrapperStart>start&&snapshotStart>wrapperStart,'R1539 wrapper and original must both exist');
 assert(server.slice(start,wrapperStart).includes('covers: pb1803RecoverPricedCovers(cq.rows.map('));
 const cat=fixture();const pool={query:async sql=>{
  if(sql.includes('FROM labs WHERE id'))return {rows:[{album_enabled:true,ui_preferences:{albumCoverCatalogEnabled:true}}]};
  if(sql.includes('FROM lab_album_sizes a'))return {rows:[{id:'s',print_size_id:'p',label:'20×30',binding_price:35000,luster:8000,silk:8000,metallic:8000,min_spreads:1,max_spreads:500,active:true,width_cm:20,height_cm:30}]};
  if(sql.includes('FROM lab_album_covers c'))return {rows:[]};
  return {rows:[]};
 }};
 // The real catalog calls this image-enrichment helper; include it in the VM just as the live server does.
 const {applyAlbumColorImages}=await import('../dist/api/album-color-images.js');
 const shared={pool,syncLabAlbumSizesFromPrintTariffs:async()=>{},albumCoverCatalogV2ForLab:async()=>cat,pb1803RecoverPricedCovers:ctx.pb1803RecoverPricedCovers,applyAlbumColorImages,albumMoney:n=>Number(n||0),invoicePrintTypeLabel:t=>t,Date};
 const originalFn=vm.runInNewContext('('+server.slice(start,wrapperStart).trim()+')',shared);
 const fn=vm.runInNewContext('('+server.slice(wrapperStart,snapshotStart).trim()+')',{pool,albumCatalogForLabOriginal:originalFn,normalizePrintCatalog:()=>({types:[{id:'album_binding_price',kind:'binding',name:'صحافی آلبوم',active:true}],rates:{}})});
 const result=await fn('lab');assert.equal(result.covers.length,1);assert.equal(result.covers[0].price,125000);
 const sStart=server.indexOf('async function albumOrderSnapshot('),sEnd=server.indexOf('\nasync function ',sStart+20);
 assert(sStart>=0&&sEnd>sStart);const orderSnapshot=vm.runInNewContext('('+server.slice(sStart,sEnd)+')',{albumCatalogForLab:fn,albumMoney:n=>Number(n||0),invoicePrintTypeLabel:t=>t,Date});
 const cover=result.covers[0];const snap=await orderSnapshot('lab',{sizeId:'s',spreads:2,paperType:'luster',coverId:cover.id,colorId:cover.colors[0].id});
 assert.equal(snap.pricing.manualCoverRequired,false);assert.equal(snap.pricing.coverPrice,125000);assert.equal(snap.pricing.total,211000);
});
