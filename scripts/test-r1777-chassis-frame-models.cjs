'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')));
test('R1777: custom chassis/frame models and separate colleague/walk-in prices',async()=>{
 const {normalizePrintCatalog,addPrintType,renamePrintType,archivePrintBinding,applyPrintRates,applyWalkinPrintRates}=await load();
 const original=normalizePrintCatalog();
 assert(original.types.some(t=>t.kind==='chassis'&&t.id==='chassis'));
 assert(original.types.some(t=>t.kind==='frame'&&t.id==='frame'));
 let catalog=addPrintType(original,{kind:'chassis',name:'شاسی ۴۰۰۰'});
 catalog=addPrintType(catalog,{kind:'chassis',name:'شاسی ۸۰۰۰'});
 catalog=addPrintType(catalog,{kind:'frame',name:'قاب چوبی'});
 const chassis=catalog.types.find(t=>t.name==='شاسی ۸۰۰۰'),frame=catalog.types.find(t=>t.name==='قاب چوبی');
 const a=applyPrintRates(catalog,[{sizeId:'size-1',customRates:{[chassis.id]:240000,[frame.id]:190000}}],['size-1']);
 const b=applyWalkinPrintRates(a,[{sizeId:'size-1',customRates:{[chassis.id]:260000,[frame.id]:205000}}],['size-1']);
 assert.equal(b.rates['size-1'][chassis.id],240000);
 assert.equal(b.walkinRates['size-1'][chassis.id],260000);
 assert.equal(b.rates['size-1'][frame.id],190000);
 assert.equal(b.walkinRates['size-1'][frame.id],205000);
 assert.throws(()=>applyPrintRates(b,[{sizeId:'size-1',customRates:{unknown:2000}}],['size-1']),/print_catalog_unknown_type/);
 assert.throws(()=>addPrintType(catalog,{kind:'frame',name:'قاب چوبی'}),/print_catalog_duplicate_name/);
 const renamed=renamePrintType(b,chassis.id,'شاسی ۸۰۰۰ درجه یک');
 assert.equal(renamed.types.find(t=>t.id===chassis.id).name,'شاسی ۸۰۰۰ درجه یک');
 const retired=archivePrintBinding(renamed,frame.id);
 assert.equal(retired.types.find(t=>t.id===frame.id).active,false);
 assert.equal(retired.rates['size-1'][frame.id],190000,'historical rates remain');
});
test('R1777: frame images and palette colors are optional, sanitized, lab-specific',async()=>{
 const {normalizePrintCatalog,addPrintType,setPrintFrameImage,setPrintFrameColors}=await load();
 let c=addPrintType(normalizePrintCatalog(),{kind:'frame',name:'قاب کلاسیک'});
 const id=c.types.at(-1).id;
 const img='data:image/png;base64,'+Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]).toString('base64');
 c=setPrintFrameImage(c,id,img);
 c=setPrintFrameColors(c,id,[{id:'black',name:'مشکی',hex:'#111111',available:true,imageData:img},
   {id:'gold',name:'طلایی',hex:'#DCB665',available:false}]);
 const restored=normalizePrintCatalog(c);
 const frame=restored.types.find(t=>t.id===id);
 assert.equal(frame.imageData,img);
 assert.equal(frame.colors.length,2);
 assert.equal(frame.colors[0].imageData,img);
 assert.equal(frame.colors[1].available,false);
 assert.throws(()=>setPrintFrameColors(c,id,[{id:'x',name:'bad',hex:'red'}]),/print_frame_colors_invalid/);
 assert.throws(()=>setPrintFrameImage(c,id,'data:image/svg+xml;base64,PHN2Zz4='),/print_frame_image_invalid/);
 assert.throws(()=>setPrintFrameImage(c,'chassis','invalid'),/print_frame_model_not_found/);
});
test('R1777: server patches independent walk-in pricing after legacy binding catalog',()=>{
 const code=fs.readFileSync('dist/api/server.js','utf8');
 assert(code.includes('applyWalkinPrintRates'));
 assert(code.includes('pb1777Catalog=applyWalkinPrintRates'));
 assert(code.includes('pb1777Catalog)await c.query'));
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.includes("await deployStep('./enable-r1777-chassis-frame-model-pricing.mjs')"));
});

test('R1777: two tariffs expose separate model price columns and frame color-picture editor',()=>{
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 const html=fs.readFileSync('dist/web/index.html','utf8');
 const pricing=fs.readFileSync('scripts/r1539-pricing-react.js.txt','utf8');
 assert(ui.includes('function PB1777FrameModelEditor('));
 assert(ui.includes('function PB1777FrameSelector('));
 assert(ui.includes('pb1777Fields'));
 assert(ui.includes('pb1777Value'));
 assert(ui.includes('pb1777Create("chassis")'));
 assert(ui.includes('pb1777Create("frame")'));
 assert(ui.includes('pb1539Create("chassis")'));
 assert(ui.includes('pb1539Create("frame")'));
 assert(ui.includes('pb1777SetEdit'));
 assert(html.includes('/photobridge-r1777-frame-color-picker.css?v=r1777'));
 assert(pricing.includes('JSON.stringify({kind,name:name.trim()})'));
});

test('R1783: walk-in model catalog keeps R1540 loading errors and retry available',()=>{
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 assert(ui.includes('pb1540SetError'),'R1540 error state must remain intact');
 assert(ui.includes('if(!I||!I.lab)throw Error("walkin_data_incomplete")'),'walk-in payload validation must be retained');
 assert(ui.includes('Me("/api/lab/print-catalog").catch(()=>({catalog:{types:[],walkinRates:{}}}))'),'missing model catalog must not hide customer-free settings');
 assert(ui.includes('pb1777SetCatalog(K.catalog||{types:[],walkinRates:{}})'),'custom models must be loaded into the model selector');
});
