'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
test('R1963 native: downloaded worker gate never depends on obsolete EXE numbers alone',()=>{
 const {eligible}=require('../r1963-fast-worker-gate.cjs');
 const worker='function pb1908FastArrival(){};window.pbDesktopEvents.onOrderArrived(()=>{})';
 assert(eligible(worker,'1.0.121'));assert(!eligible('no worker','1.0.121'));
 assert(read('host.cjs').includes("eligible(source,require('./package.json').version)"));
});
test('R1963 native: background refresh will not delay priority downloads',()=>{
 const main=read('main.cjs'),sync=read('sync.cjs');
 assert(main.includes('R1963_NATIVE_DOWNLOAD_PRIORITY'));
 assert(main.includes("void sync.live()},12000)"));
 assert(sync.includes('nativeDownloadPriorityUntil'));
 assert(read('read-cache.cjs').includes('cached.body!==body)store.cache'));
});
test('R1963 native: invoice and account gates remain after overlapping read-only preflight',()=>{
 assert(read('host.cjs').includes('await checkWriteAccess(store,'));
 assert(read('local-business-host.cjs').includes('requiresInvoice(detail)'));
 assert(read('local-business-host.cjs').includes('R1963_STAGE_PREFETCH_CONSUME'));
});
test('R1963 native: no manual walk-in button outside print/album',()=>{
 const {scopeManualButton}=require('../r1963-intake-route.cjs');
 const src="function mount(){if(!/^\\/lab(?:\\/|$)/.test(location.pathname)||!host){old?.remove();return;}const button=document.getElementById('pb1137LocalIntakeButton');}";
 const updated=scopeManualButton(src);assert(updated.includes('R1963_NATIVE_PRINT_TAB_ONLY'));
 assert(updated.includes('orders|print|albums?'));
});
