const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.css','utf8');
const intake=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const snapp=fs.readFileSync('dist/web/photobridge-r1179-lab-order-actions.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const server=fs.readFileSync('dist/api/server.js','utf8');
const bundlePatch=fs.readFileSync('scripts/enable-r1179-lab-walkin-invoice-view.mjs','utf8');

test('walk-in editor is wider and the proforma is narrow and remains on the left',()=>{
 const section=css.slice(css.indexOf('/* PB1179 –'));
 assert(section.length>5000);
 assert(section.includes('grid-template-columns:minmax(0,2.35fr) minmax(285px,.93fr)!important'));
 assert(css.includes('grid-template-areas:"editor bill"'));
 assert(section.includes('.pb1178IntakeBill'));
 assert(section.includes('.pb1178BillRow'));
 assert(section.includes('.pb1178BillFoot'));
});
test('five walk-in selectors fit in one line and customer chevron scales with the text',()=>{
 const section=css.slice(css.indexOf('/* PB1179 –'));
 assert(section.includes('grid-template-columns:minmax(165px,1.65fr)'));
 assert(section.includes('minmax(85px,.75fr)!important'));
 assert(section.includes('minmax(74px,.7fr)!important'));
 assert(section.includes('grid-column:auto!important'));
 assert(intake.includes("selectionValue=node('span','انتخاب عکاس','pb1179CustomerValue')"));
 assert(intake.includes("selectionChevron=node('span','▾','pb1179CustomerChevron')"));
 assert(intake.includes('selectionValue.textContent=itemLabel(c)'));
 assert(section.includes('.pb1179CustomerChevron'));
});
test('added photo groups never clip and only the list scrolls, with several compact groups visible',()=>{
 const section=css.slice(css.indexOf('/* PB1179 –'));
 assert(section.includes('.pb1137Files.pb1139Groups'));
 assert(section.includes('overflow-y:auto!important;overflow-x:hidden!important'));
 assert(section.includes('scrollbar-gutter:auto!important'));
 assert(section.includes('.pb1139GroupPhotos'));
 assert(section.includes('height:49px!important'));
 assert(section.includes('flex:0 0 auto!important'));
 assert(section.includes('min-height:0!important;max-height:none!important'));
 assert(intake.includes('function renderGroups()'));
 assert(intake.includes('renderGroups();'));
});
test('Snapp send and other mini actions wrap without overflow in the ready card',()=>{
 assert(snapp.includes('.labOrderCard .labOrderMiniActions'));
 assert(snapp.includes('flex-flow:row wrap!important'));
 assert(snapp.includes('max-width:100%!important'));
 assert(snapp.includes('.miniCourierBtn'));
 assert(snapp.includes('font:850 9px/1.25'));
 assert(ui.includes('className:"miniCourierBtn"'));
 assert(ui.includes('children:"ارسال با اسنپ"'));
});
test('print and album ready states open the issued invoice in the existing lab preview',()=>{
 const token='/* PB1179 show ready invoice */await Qn(Zt.invoice.id';
 assert.equal(ui.split(token).length-1,2);
 assert(ui.includes('xt&&await Qn(xt.id,{...xt,customer_name:le.customer_name'));
 assert(ui.includes('nt==="ready"&&xt&&await Qn(xt.id'));
 assert(ui.includes('body:JSON.stringify({status:"ready"})'));
 assert(ui.includes('body:JSON.stringify({stage:nt})'));
 assert(ui.includes('Qn=async(le,nt)=>'));
 assert(ui.includes('O({...Mt,lab_name:Mt.lab_name||t.name})'));
 assert(!bundlePatch.includes('/invoices/manual'));
});
test('local intake remains a proforma and files are marked downloaded by server',()=>{
 assert(server.includes('PB1178 deferred delegated proforma'));
 assert(server.includes('submitted._invoice = null'));
 assert(server.includes("const status = localIntake ? 'downloaded'"));
 assert(server.includes('downloaded_at=CASE WHEN $4 THEN COALESCE(downloaded_at,now()) ELSE downloaded_at END'));
 assert(server.includes("if (status === 'ready') {"));
 assert(server.includes('invoice = await createOrGetInvoice(c, labId, labOrder[1])'));
 assert(intake.includes('provider.saveResume(order.orderId'));
 assert(intake.includes('const saved=await provider.write'));
 assert(intake.includes('ثبت سفارش و ذخیره پیش‌فاکتور'));
});
test('browser syntax and r1179 cache for native UI and styles',()=>{
 new Function(intake);
 assert(html.includes('photobridge-r1137-lab-local-intake.css?v=r1179'));
 assert(html.includes('photobridge-r1137-lab-local-intake.js?v=r1179'));
 assert(html.includes('photobridge-r1179-lab-order-actions.css?v=r1179'));
 assert(html.includes('&ready=r1179'));
});
