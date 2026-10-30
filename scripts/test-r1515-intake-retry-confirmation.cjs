'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');

test('stock failure unlocks the existing draft and retries current per-photo settings',()=>{
 const patch=fs.readFileSync('scripts/enable-r1515-intake-retry-confirmation.mjs','utf8');
 assert.ok(patch.includes("if(e.code==='stock_unavailable')locked=false"));
 assert.ok(patch.includes('for(const item of entries){const result=await api('));
 assert.ok(patch.includes('UPDATE order_files SET print_size_id=$4,print_type=$5,chassis=$6,frame=$7,print_copies=$8'));
 assert.ok(patch.includes("WHERE id=$1 AND lab_id=$2 AND order_id=$3"));
 assert.ok(patch.includes("problem.code=code"));
});

test('browser and Windows use one shared post-submit confirmation dialog',()=>{
 const patch=fs.readFileSync('scripts/enable-r1515-intake-retry-confirmation.mjs','utf8');
 for(const token of ['pb1515ShowIntakeConfirmation','pb1515IntakeConfirmation','تأیید ثبت سفارش',"سفارش شمارهٔ '+number+' ثبت شد.",'pb1515ConfirmActions','box.showModal()'])assert.ok(patch.includes(token),token);
 assert.ok(!patch.includes('__PB_NATIVE_ORDER_ALERTS__'));
 const pipeline=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 const r1502=pipeline.indexOf('await deployStep("./enable-r1502-web-intake-card-layout.mjs")');
 const r1515=pipeline.indexOf('await deployStep("./enable-r1515-intake-retry-confirmation.mjs")');
 const snapshot=pipeline.indexOf('await deployStep("./prepare-lab-desktop-ui.mjs?final-after-r1344")');
 assert.ok(r1502>=0&&r1515>r1502&&snapshot>r1515);
});
