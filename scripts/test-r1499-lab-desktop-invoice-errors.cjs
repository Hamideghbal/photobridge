'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Windows lab UI snapshot is prepared after actionable live-invoice error handling is patched',()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 const patch=build.lastIndexOf('enable-r1499-lab-desktop-invoice-errors.mjs');
 const testRun=build.lastIndexOf('test-r1499-lab-desktop-invoice-errors.cjs');
 const prepare=build.lastIndexOf('prepare-lab-desktop-ui.mjs?final-after-r1344');
 assert(patch>=0&&testRun>patch&&prepare>testRun,'invoice handling must be patched and tested before the desktop UI snapshot is generated');
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 assert(ui.includes('PB1499 lab desktop invoice errors'));
 assert.match(ui,/error\)==="order_sync_pending"/);
 assert.match(ui,/error\)==="invoice_live_connection_required"/);
 assert.match(ui,/error\)==="invoice_pricing_required"/);
 assert.match(ui,/nt==="ready"&&Bt==="order_sync_pending"/);
 assert.match(ui,/nt==="ready"&&Bt==="invoice_live_connection_required"/);
 assert.match(ui,/nt==="ready"&&Bt==="invoice_pricing_required"/);
});
