'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve('dist/api/print-addon-selection.js')));
test('R1780: selected chassis/frame/colour and immutable per-audience model prices',async()=>{
 const {snapshotPrintAddons}=await load();
 const catalog={types:[
  {id:'chassis',kind:'chassis',name:'شاسی معمولی',legacy:true,active:true},
  {id:'frame',kind:'frame',name:'قاب معمولی',legacy:true,active:true},
  {id:'c1',kind:'chassis',name:'شاسی ۴۰۰۰',active:true},
  {id:'f1',kind:'frame',name:'قاب گرد',active:true,colors:[{id:'gold',name:'طلایی',available:true},{id:'black',name:'مشکی',available:false}]}
 ],rates:{size1:{c1:101000,f1:32000}},walkinRates:{size1:{c1:121000,f1:42000}}};
 const chosen={chassis:true,frame:true,chassisModelId:'c1',frameModelId:'f1',frameColorId:'gold'};
 const coworker=snapshotPrintAddons(catalog,chosen,{sizeId:'size1',audience:'colleague'});
 const walkin=snapshotPrintAddons(catalog,chosen,{sizeId:'size1',audience:'walkin'});
 assert.deepEqual(coworker.chassis,{id:'c1',name:'شاسی ۴۰۰۰',unitPrice:101000});
 assert.deepEqual(coworker.frame,{id:'f1',name:'قاب گرد',unitPrice:32000,colorId:'gold',colorName:'طلایی'});
 assert.equal(walkin.chassis.unitPrice,121000);
 assert.equal(walkin.frame.unitPrice,42000);
 assert.throws(()=>snapshotPrintAddons(catalog,chosen,{sizeId:'not-priced',audience:'colleague'}),/addon_model_price_unavailable/);
 assert.throws(()=>snapshotPrintAddons(catalog,{frame:true,frameModelId:'f1',frameColorId:'black'},{sizeId:'size1'}),/invalid_frame_color/);
 assert.deepEqual(snapshotPrintAddons(catalog,{chassis:false,frame:false}),{});
});
test('R1780: invoice and presign handlers read immutable prices and explicit no-paper orders',()=>{
 const server=fs.readFileSync('dist/api/server.js','utf8');
 assert(server.includes("url.pathname === '/api/customer/print-addon-catalog'"));
 assert(server.includes("addonCatalog, lab:"));
 assert(server.includes("f.chassis,f.frame,f.addon_selection,COALESCE(f.print_copies"));
 assert(server.includes("addon.chassis?.unitPrice"));
 assert(server.includes("addon.frame?.unitPrice"));
 assert(server.includes("print_type<>'none'"));
 assert(server.includes("withoutPrint=b.withoutPrint===true"));
 assert(server.includes("chassisModelName:addon.chassis?.name"));
 assert(server.includes("frameColorName:addon.frame?.colorName"));
 assert(server.includes("none:'بدون چاپ عکس'"));
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.includes("await deployStep('./enable-r1780-model-selection-billing.mjs')"));
 assert.equal(build.split("enable-r1779-addon-selection-snapshot.mjs").length-1,1,'must not re-run non-idempotent R1779 installer');
});
