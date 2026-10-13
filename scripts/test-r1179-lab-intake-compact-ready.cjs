const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('dist/web/photobridge-r1179-lab-intake-compact.css','utf8');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const walkin=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
const backend=fs.readFileSync('dist/api/server.js','utf8');
const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');

test('new intake layout gives a larger right editor and smaller proforma pane',()=>{
 assert.match(css,/grid-template-columns:minmax\(0,2\.65fr\) minmax\(265px,1fr\)/);
 assert(css.includes('.pb1178IntakeEditor'));
 assert(css.includes('.pb1178IntakeBill'));
 assert(css.includes('grid-template-columns:minmax(175px,1.65fr) minmax(90px,.9fr)'));
 assert(css.includes('.pb1137Settings>.pb1139Customer'));
 assert(css.includes('grid-column:auto!important'));
 assert(walkin.includes('workspace.append(editor,bill)'));
 assert(walkin.includes("editor.append(settings)"));
 assert(walkin.includes("editor.append(list)"));
});
test('the extra groups and many photos remain vertically scrollable, with submit pinned outside list',()=>{
 assert(css.includes('.pb1137Files.pb1139Groups'));
 assert(css.includes('overflow-y:auto!important;overflow-x:hidden!important;'));
 assert(css.includes('flex:1 1 0!important;min-height:0!important;height:0!important;'));
 assert(css.includes('overscroll-behavior-y:contain!important'));
 assert(css.includes('form>.pb1137Submit'));
 assert(walkin.includes("form.append(submit)"));
});
test('intake shows proforma only and local order immediately starts downloaded',()=>{
 assert(walkin.includes('پیش‌فاکتور'));
 assert(walkin.includes('ثبت سفارش و ذخیره پیش‌فاکتور'));
 assert(walkin.includes('function refreshInvoice()'));
 assert(backend.includes('PB1178 deferred delegated proforma'));
 assert(backend.includes("const status = localIntake ? 'downloaded'"));
 assert(backend.includes("submitted._invoice = null;"));
 assert(backend.includes("downloaded_at=CASE WHEN $4 THEN COALESCE(downloaded_at,now())"));
});
test('ready transition creates the invoice and opens its full existing React viewer immediately',()=>{
 assert(bundle.includes('pb1179InvoiceAutoPreview'));
 assert(bundle.includes('await ye(),await Gt(le,"ready"),qt=!0;/* pb1179InvoiceAutoPreview'));
 assert(bundle.includes('Qn(Zt.invoice.id,Zt.invoice).catch(()=>{})'));
 assert(bundle.includes('const Bt=await Wu(Zt.invoice)'));
 assert(backend.includes("if (status === 'ready') {"));
 assert(backend.includes('invoice = await createOrGetInvoice(c, labId, labOrder[1]);'));
});
test('Snapp button is contained in the card action area',()=>{
 assert(css.includes('.labOrderMiniActions>.miniCourierBtn'));
 assert(css.includes('flex-wrap:wrap!important'));
 assert(css.includes('max-width:100%!important'));
 assert(css.includes('flex:0 1 auto!important'));
 assert(css.includes('box-sizing:border-box!important'));
});
test('asset version and release script order will invalidate caches',()=>{
 assert(html.includes('/photobridge-r1179-lab-intake-compact.css?v=r1179'));
 for(const ext of ['js','css'])assert(html.includes('photobridge-r1137-lab-local-intake.'+ext+'?v=r1179'));
 assert(html.includes('&intake=r1179'));
 assert(build.indexOf('enable-r1179-lab-intake-compact-ready.mjs')>build.indexOf('enable-r1178-release.mjs'));
 new Function(bundle);
 new Function(walkin);
});
