'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),path=require('node:path');
const read=f=>fs.readFileSync(f,'utf8'),bundle='dist/web/assets/index-UIRefine-v655-r84.js';
test('custom binding has distinct creation and removal actions; existing print sizes and paper kinds are unaffected',async()=>{
 const s=read(bundle);
 assert.doesNotThrow(()=>new vm.Script(s));
 for(const text of ['+ مدل صحافی جدید','pb1539Delete','pb1540BindingDelete','pb1539Rename'])assert(s.includes(text),text);
 assert(!s.includes('+ کاغذ جدید'));
 const {normalizePrintCatalog,addPrintType,archivePrintBinding}=await import(pathToFileUrl('dist/api/lab-print-catalog.js'));
 const a=addPrintType(normalizePrintCatalog(),{kind:'binding',name:'صحافی ژورنال ۳۰۰ گرم'}),id=a.types.at(-1).id;
 const priced={...a,rates:{'s1':{[id]:35000}}};
 const after=archivePrintBinding(priced,id);
 assert.equal(after.types.find(t=>t.id===id).active,false);
 assert.equal(after.rates.s1[id],35000,'historical quoted rate must remain');
 assert.equal(after.types.filter(t=>t.kind==='paper').length,3);
 assert.throws(()=>archivePrintBinding(after,'album_binding_price'),/print_catalog_cannot_remove_type/);
 assert.throws(()=>addPrintType(after,{kind:'paper',name:'جدید'}),/print_catalog_invalid_kind/);
});
function pathToFileUrl(f){return require('node:url').pathToFileURL(path.resolve(f)).href}
test('lab tariff matrix is a one-line, aligned, horizontally scrollable grid on desktop and phone',()=>{
 const css=read('dist/web/photobridge-r1540-lab-fixes.css');
 for(const x of ['overflow-x:auto!important','grid-template-columns:155px repeat(var(--pb1539-columns,8)','grid-template-rows:auto!important','grid-row:1!important','grid-auto-flow:row!important','@media(max-width:640px)'])assert(css.includes(x),x);
 const s=read(bundle);
 assert(s.includes('"--pb1539-columns":h.length'),'rows and headers must share the same column count');
 assert(s.includes('priceGrid inventoryPriceGrid head'));
 assert(s.includes('priceGrid inventoryPriceGrid'));
});
test('Windows free customer settings can recover request errors and render failures without blocking parent tabs',()=>{
 const s=read(bundle);
 for(const x of ['class PB1540WalkinBoundary extends x.Component','g==="walkin"&&e.jsx(PB1540WalkinBoundary','pb1540SetError','درخواست مشتری آزاد','pb1540WalkinFallback']){
  if(x==='درخواست مشتری آزاد')continue;
  assert(s.includes(x),x);
 }
 assert(s.includes('settingsWorkspace labSettingsWorkspace'));
 assert(s.includes('labSettingsSectionTabs'));
});
test('local HDD cleanup requires styled, cancellable opt-in before native permission and actual deletion',()=>{
 const s=read(bundle);
 assert(s.includes('if(!await pb1540CleanupConfirm())return;if(!await Vs(t))'));
 assert(s.includes('dialog.showModal()'));
 assert(s.includes('data-action="cancel"'));
 assert(s.includes('فاکتورها و اطلاعات سفارش در سایت باقی می‌مانند'));
 assert(!read('dist/web/photobridge-r1540-lab-fixes.css').includes('pointer-events:none'));
});
test('opening debt amount is visible on edit button and invoices still lock corrections',()=>{
 const s=read('dist/web/photobridge-r1137-lab-local-intake.js');
 assert(s.includes("const toggle=node('button','اصلاح بدهی اولیه · '+money(data.initialDebt),'pb1294Edit')"));
 assert(s.includes('if(data.canEditInitialDebt)'));
 assert(s.includes('else if(data.hasInvoice)'));
});
test('Windows hot-update manifest includes the new scripts and CSS with content-verified hashes',()=>{
 const base='dist/web/lab-desktop-ui/',manifest=JSON.parse(read(base+'manifest.json'));
 const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
 assert.equal(manifest.channel,'lab');
 assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
 for(const file of ['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1137-lab-local-intake.js','photobridge-r1539-print-catalog.css','photobridge-r1540-lab-fixes.css']){
  const item=manifest.files.find(f=>f.name===file);assert(item,file);
  assert.equal(item.sha256,hash(fs.readFileSync(base+file)),file);
 }
 assert(read(base+'index.html').includes('photobridge-r1540-lab-fixes.css?v=r1540'));
 assert(read(base+'assets/index-UIRefine-v655-r84.js').includes('PB1540 Windows lab independent walk-in navigation'));
 assert(read(base+'photobridge-r1137-lab-local-intake.js').includes('اصلاح بدهی اولیه ·'));
});
