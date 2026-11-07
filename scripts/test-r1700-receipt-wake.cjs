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
test('R1700 wake preserves R1583 retry patch and R1586 immediate coalesced wake in correct build order',()=>{
 const worker=fs.readFileSync('scripts/r1568-native-worker.js.txt','utf8');
 const retry=fs.readFileSync('scripts/enable-r1583-download-retry.mjs','utf8');
 const after=fs.readFileSync('scripts/enable-r1586-opening-debt-history.mjs','utf8');
 const wake=fs.readFileSync('scripts/r1586-download-wake.js.txt','utf8');
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 const anchor=' finally{pb1568Work.running=false}';
 const retryPatched=' finally{pb1568Work.running=false;if(typeof pb1583DrainRetries==="function")void pb1583DrainRetries()}';
 const wakePatched='finally{pb1568Work.running=false;if(typeof pb1583DrainRetries==="function")void pb1583DrainRetries();if(typeof pb1586WakeDownloads==="function"&&pb1586WakePending)pb1586WakeDownloads()}';
 assert.equal(worker.split(anchor).length-1,1,'R1568 must preserve early R1583 anchor');
 assert(retry.includes("once(' finally{pb1568Work.running=false}'"));
 const next=worker.replace(anchor,retryPatched);
 assert.equal(next.split(retryPatched.trimStart()).length-1,1,'R1583 installs retry drain');
 assert(after.includes(wakePatched),'R1586 installs pending wake after retry drain');
 assert(next.includes('pb1583DrainRetries()'));
 assert(wake.includes('if(pb1586WakeTimer!==null||pb1568Work.running)return'));
 assert(wake.includes('pb1568AutoTick()'));
 const stages=[
  "await deployStep('./enable-r1568-auto-processing.mjs')",
  "await deployStep('./enable-r1583-download-retry.mjs')",
  "await deployStep('./enable-r1586-opening-debt-history.mjs')",
  "await deployStep('./enable-r1682-direct-customer-order-flow.mjs')",
  "runR1314(process.execPath,['--test','scripts/test-r1700-receipt-wake.cjs']"
 ];
 let previous=-1;for(const stage of stages){const index=build.indexOf(stage);assert(index>previous,stage);previous=index;}
});
