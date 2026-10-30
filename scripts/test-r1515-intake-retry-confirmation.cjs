'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');

test('every pre-commit failure unlocks the existing draft and retries current per-photo settings',()=>{
 const patch=fs.readFileSync('scripts/enable-r1515-intake-retry-confirmation.mjs','utf8');
 assert.ok(patch.includes('let committed=false;const clientOrderId'));
 assert.ok(patch.includes("/submit',{sendInvoiceSms:customers.sendInvoiceSms===true});committed=true;"));
 assert.ok(patch.includes('if(!committed)locked=false'));
 assert.ok(patch.includes("e.name==='NotFoundError'||e.code==='ENOENT'"));
 assert.ok(patch.includes('فایل یا پوشه پیدا نشد؛ عکس را حذف و دوباره انتخاب کنید'));
 assert.ok(patch.includes('for(const item of entries){const result=await api('));
 assert.ok(patch.includes('UPDATE order_files SET print_size_id=$4,print_type=$5,chassis=$6,frame=$7,print_copies=$8'));
 assert.ok(patch.includes("WHERE id=$1 AND lab_id=$2 AND order_id=$3"));
 assert.ok(patch.includes("problem.code=code"));
 const r1467=fs.readFileSync('scripts/enable-r1467-lab-switch-intake.mjs','utf8');
 assert.ok(r1467.includes('/* PB1467 live intake requests */'));
 assert.ok(patch.includes("catch(e){throw Error(e.data?.message||errors[e.data?.error||e.message]"));
 assert.ok(!patch.includes('async function api(url,body){try{return await storage().request'));
 assert.ok(patch.includes("intakeRetry=r1518"));
});

test('browser and Windows use one shared post-submit confirmation dialog',()=>{
 const patch=fs.readFileSync('scripts/enable-r1515-intake-retry-confirmation.mjs','utf8');
 for(const token of ['pb1515ShowIntakeConfirmation','pb1515IntakeConfirmation','تأیید ثبت سفارش',"سفارش شمارهٔ '+number+' ثبت شد.",'pb1515ConfirmActions','box.showModal()'])assert.ok(patch.includes(token),token);
 for(const token of ['width:min(360px,calc(100vw - 32px))!important','inset:50% auto auto 50%!important','height:auto!important','max-height:calc(100dvh - 32px)!important'])assert.ok(patch.includes(token),token);
 assert.ok(!patch.includes('__PB_NATIVE_ORDER_ALERTS__'));
 const pipeline=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 const r1502=pipeline.indexOf('await deployStep("./enable-r1502-web-intake-card-layout.mjs")');
 const r1515=pipeline.indexOf('await deployStep("./enable-r1515-intake-retry-confirmation.mjs")');
 const snapshot=pipeline.indexOf('await deployStep("./prepare-lab-desktop-ui.mjs?final-after-r1344")');
 assert.ok(r1502>=0&&r1515>r1502&&snapshot>r1515);
});
