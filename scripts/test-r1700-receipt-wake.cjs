'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('R1700 compact templates clearly separate free customer from studio and identify photographic laboratory',()=>{
 const source=fs.readFileSync('scripts/r1698-approved-site-thermal.js.txt','utf8');
 const context={vh:t=>t.items||[],ph:item=>item.description};
 vm.createContext(context);vm.runInContext(source,context);
 const invoice={number:73,customer_name:'استودیو سپید',photographer_mobile:'09351234567',customer_mobile:'09129999999',direct_customer_name:'نگار',direct_customer_mobile:'09120000000',lab_name:'قصر عکس',lab_phone:'02632223344',lab_address:'فردیس',total:60000,paid:0,customer_total_debt:95000,items:[{description:'چاپ',quantity:2,unitPrice:30000,lineTotal:60000}]};
 const free=context.pbR1698ApprovedThermal(invoice,true);
 const studio=context.pbR1698ApprovedThermal(invoice,false);
 for(const page of [free,studio]){
  assert(page.includes('لابراتوار عکاسی'));assert(page.includes('قصر عکس'));assert(page.includes('02632223344'));assert(page.includes('فردیس'));assert(page.includes('class="frame"'));
 }
 assert(free.includes('رسید مشتری'));assert(free.includes('شماره مشتری'));assert(free.includes('09120000000'));
 assert(!free.includes('شماره عکاسی'));assert(!free.includes('مانده کل حساب شما'));
 assert(studio.includes('رسید عکاسی'));assert(studio.includes('شماره عکاسی'));assert(studio.includes('09351234567'));
 assert(!studio.includes('شماره مشتری'));assert(!studio.includes('09129999999'));assert(studio.includes('مانده کل حساب شما'));
});
test('R1700 busy native download worker re-arms the already-coalesced R1586 notification wake',()=>{
 const worker=fs.readFileSync('scripts/r1568-native-worker.js.txt','utf8'),wake=fs.readFileSync('scripts/r1586-download-wake.js.txt','utf8');
 assert(worker.includes("pb1568Work.running=false;"));
 assert(worker.includes("typeof pb1586WakeDownloads==='function'"));
 assert(worker.includes("pb1586WakePending)pb1586WakeDownloads();"));
 assert(wake.includes('if(pb1586WakeTimer!==null||pb1568Work.running)return'));
 assert(wake.includes('pb1568AutoTick()'));
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.indexOf("await deployStep('./enable-r1698-approved-receipts.mjs')")<build.indexOf("runR1314(process.execPath,['--test','scripts/test-r1700-receipt-wake.cjs']"));
});
