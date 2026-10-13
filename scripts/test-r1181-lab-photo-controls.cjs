const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const intake=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const api=fs.readFileSync('dist/api/server.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1181-lab-photo-controls.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
test('walk-in delete sits on photo rather than below paper; paper and chassis share a row',()=>{
 assert.match(intake,/pb1181IntakeFrame/);
 assert.match(intake,/pb1181DeleteOverlay/);
 assert.match(intake,/frame\.append\(del\)/);
 assert.doesNotMatch(intake,/actions\.append\(del\)/);
 assert.match(intake,/pb1181ChassisToggle/);
 assert.match(intake,/actions\.append\(chassisLabel\)/);
 assert.doesNotMatch(intake,/quantity\.append\(node\('span','تعداد'\)\)/);
});
test('local intake chassis is included in proforma and file registration',()=>{
 assert.match(intake,/chassisPrice=chassis==='1'\?prices\?\.chassis:0/);
 assert.match(intake,/printCopies:item\.copies,chassis:!!item\.chassis,localOnly:true/);
 assert.match(intake,/item\.chassis=chassisInput\.checked;refreshInvoice/);
});
test('details mirror paper, chassis and quantity; no gear or quantity label',()=>{
 assert.match(bundle,/PB1181 same compact photo controls/);
 assert.match(bundle,/className:"pb1181DeleteOverlay"/);
 assert.match(bundle,/pb1181RemoveFile\(file\)/);
 assert.match(bundle,/className:"pb1181ChassisToggle"/);
 assert.match(bundle,/pb1180Patch\(file,\{chassis:event\.target\.checked\}\)/);
 assert.doesNotMatch(bundle,/className:"pb1180Settings"/);
 assert.doesNotMatch(bundle,/className:"pb1180Remove"/);
 assert.doesNotMatch(bundle,/e\.jsx\("span",\{children:"تعداد"\}\),\s*e\.jsx\("button",\{type:"button",disabled:!canEdit/);
});
test('print settings must not reject missing paper or chassis tariff; invoice pricing remains deferred',()=>{
 assert.match(api,/PB1181 defer unpriced print edits/);
 assert.match(api,/const pricingPending = quoteQ\.rows\.some/);
 assert.match(api,/total=CASE WHEN \$4 THEN total ELSE \$3 END/);
 assert.match(api,/pricingRequired: pricingPending/);
 const route=api.slice(api.indexOf('const labFilePrintSettings'),api.indexOf('const labFilePreview'));
 assert.doesNotMatch(route,/error: 'print_price_unavailable'/);
 assert.doesNotMatch(route,/error: 'addon_unavailable'/);
 assert.match(api,/invoice_pricing_required/);
});
test('delete requires preprint state, protects issued invoice/last file, returns reserved stock',()=>{
 assert.match(api,/PB1181 mark removed photos before printing/);
 assert.match(api,/issued_invoice_locked/);
 assert.match(api,/last_print_photo_required/);
 assert.match(api,/original_state='deleted'/);
 assert.match(api,/chassis_stock=CASE WHEN chassis_stock IS NULL THEN NULL ELSE chassis_stock\+\$3 END/);
 assert.match(bundle,/\/api\/lab\/order-files\/'\+file\.id/);
});
test('local image rename uses photo file name, not invoice PDF writer',()=>{
 assert.match(bundle,/getFileHandle\(Ya\(updated\.original_name,"file"\)/);
 assert.match(bundle,/writer\.write\(original\.file\)/);
 assert.doesNotMatch(bundle,/await jc\(target\.dir,updated\.original_name,original\.file\)/);
});
test('new stylesheet and asset cache are mounted',()=>{
 assert.match(html,/photobridge-r1181-lab-photo-controls\.css\?v=r1181/);
 assert.match(html,/photo=r1181/);
 assert.match(css,/pb1181DeleteOverlay/);
 assert.match(css,/pb1181ChassisToggle/);
});
