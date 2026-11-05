'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {patchEarlyNotice,marker}=require('./r1597-early-download-notice.cjs');
const sample=[
"Vn=async(le,options={})=>{",
" if(E)return;",
" C(le.id);",
" try{",
"   const detail=await Me('/api/lab/orders/'+le.id);",
"   const result=await Dg(detail,()=>{},options);",
"   /* PB1530 website verified-download stage revision */",
"   const acknowledgement=await pb1451AcknowledgeDownload(detail);",
"   const acknowledgedOrder={...detail.order,...(acknowledgement?.order||{})};",
"   let warning='';",
"   if(!['downloaded','printing','reviewing','ready_print','printed','ready','completed'].includes(String(acknowledgedOrder.status||''))){",
"     try{await It(acknowledgedOrder,'downloaded')}",
"     catch(error){warning='ثبت مرحله دانلود در سرور انجام نشد'}",
"   }",
"   B(value=>value+1);await ye();",
"   if(!warning)await pb1568AfterManualDownload(le.id,detail.order.lab_id||t.id).catch(error=>pb1547Notice('فاکتور نیازمند بررسی است','warning'));",
"   pb1547DownloadDialog(warning||(result.alreadyComplete?'همه '+V(result.done)+' فایل سفارش در پوشه درست و کامل‌اند؛ دریافت دوباره لازم نبود.':V(result.done)+' فایل سفارش کامل دریافت و با فهرست سرور تطبیق داده شد.'));",
" }catch(error){pb1450Notify(error)}",
" finally{C('');F(null)}",
"},un=async le=>{}"
].join('\n');
test('R1597 opens verified notice before invoice completion and refresh',async()=>{
 const patched=patchEarlyNotice(sample);
 assert.ok(patched.includes(marker));
 assert.ok(patched.indexOf('await pb1451AcknowledgeDownload(detail)')<patched.indexOf('pb1547DownloadDialog('));
 assert.ok(patched.indexOf('pb1547DownloadDialog(')<patched.indexOf('await ye()'));
 assert.ok(patched.indexOf('pb1547DownloadDialog(')<patched.indexOf('await pb1568AfterManualDownload(le.id,detail.order.lab_id||t.id)'));
 assert.equal((patched.match(/pb1547DownloadDialog\(/g)||[]).length,1);
 assert.match(patched,/if\(!warning\)await pb1568AfterManualDownload\(le\.id,detail\.order\.lab_id\|\|t\.id\)/);
 assert.equal(patchEarlyNotice(patched),patched);
 let finishInvoice;
 const invoice=new Promise(resolve=>finishInvoice=resolve);
 const events=[];
 const notice=(message,kind)=>events.push('notice:'+message+(kind?':'+kind:''));
 const context={
  E:false,t:{id:'lab1'},C:()=>{},F:()=>{},B:()=>{},V:n=>String(n),
  Me:async()=>({order:{id:'o1',status:'sent'}}),
  Dg:async()=>({done:3,alreadyComplete:false}),
  pb1451AcknowledgeDownload:async()=>({order:{status:'downloaded'}}),
  It:async()=>{},ye:async()=>{events.push('refresh')},
  pb1568AfterManualDownload:async()=>{events.push('invoice-start');await invoice;events.push('invoice-finish')},
  pb1547DownloadDialog:message=>events.push('notice:'+message),
  pb1547Notice:notice,pb1450Notify:err=>{throw err},
  document:{querySelector:()=>null}
 };
 const params=Object.keys(context),args=Object.values(context);
 const run=new Function(...params,'let Vn,un;'+patched+';return Vn;')(...args);
 const pending=run({id:'o1'});
 for(let turn=0;turn<12&&events.length<3;turn++)await Promise.resolve();
 assert.match(events[0],/^notice:3 فایل سفارش کامل دریافت/);
 assert.ok(events.includes('invoice-start'));
 assert.ok(!events.includes('invoice-finish'));
 finishInvoice();
 await pending;
 assert.equal(events.filter(e=>e.startsWith('notice:')).length,1);
});
test('R1597 preserves warning path and never announces success without server acknowledgement',()=>{
 assert.throws(()=>patchEarlyNotice(sample.replace('const acknowledgement=await pb1451AcknowledgeDownload(detail);','const acknowledgement=await Promise.resolve({});')),/server verification anchor missing/);
 const patched=patchEarlyNotice(sample);
 assert.match(patched,/if\(warning\)\{const existing=/);
 assert.match(patched,/else pb1547Notice\(warning,'warning'\)/);
});
test('R1597 retains R1596 startup rollback and native update hashing',()=>{
 const builder=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert.doesNotMatch(builder,/await deployStep\(['"]\.\/enable-r1593-lab-card-flight\.mjs['"]\)/);
 const patch=fs.readFileSync('scripts/enable-r1597-early-download-notice.mjs','utf8');
 assert.match(patch,/dist\/web\/lab-desktop-ui/);
 assert.match(patch,/noticeFast=r1597/);
 assert.match(patch,/sha256/);
});
