'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
test('R1753: cancelled or deleted orders disappear from live site and Windows queues',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const file=root+'/assets/index-UIRefine-v655-r84.js',ui=fs.readFileSync(file,'utf8');
  assert(ui.includes("f(previous=>window.pb1631PreserveExits?.(pb1753VisibleLabOrders(data.orders||[],o),previous)||pb1753VisibleLabOrders(data.orders||[],o));"));
  assert(ui.includes('setInterval(refresh,3000)'));
  assert.equal(ui.split('/* PB1753 deleted order reconciliation */').length,2);
  const marker='function pb1753VisibleLabOrders(rows,mode){',start=ui.indexOf(marker);
  assert(start>=0);
  const helper=ui.slice(start,ui.indexOf('\n/* PB1753 deleted order reconciliation */',start));
  const context={};
  vm.runInNewContext(helper+'\nresult=pb1753VisibleLabOrders([{id:"ok",mode:"print",status:"downloaded"},{id:"cancelled",mode:"print",status:"cancelled"},{id:"removed",mode:"print",deleted_at:"2026-11-10"},{id:"album",mode:"album",status:"sent"}],"print")',context);
  assert.deepEqual(Array.from(context.result,row=>row.id),['ok']);
  assert(fs.readFileSync(root+'/index.html','utf8').includes('deletedOrders=r1757'));
 }
});
test('R1753: native hot update checksums are valid and no local files are removed',()=>{
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 for(const name of ['index.html','assets/index-UIRefine-v655-r84.js']){
  const entry=manifest.files.find(item=>item.name===name);assert(entry);
  assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex'));
 }
 const patch=fs.readFileSync('scripts/enable-r1753-deleted-orders-native-sync.mjs','utf8');
 assert(!/unlinkSync|rmSync|DELETE FROM|UPDATE orders|deleteStoredKeyBestEffort/.test(patch));
});

test('R1756: patch the actual R1631 live refresh without removing transitions',()=>{
 const previous=fs.readFileSync('scripts/enable-r1631-order-exit.mjs','utf8');
 const current=fs.readFileSync('scripts/enable-r1753-deleted-orders-native-sync.mjs','utf8');
 const old="f(previous=>window.pb1631PreserveExits?.((data.orders||[]).filter(row=>String(row.mode||'print')===o),previous)||(data.orders||[]).filter(row=>String(row.mode||'print')===o));";
 const replacement="f(previous=>window.pb1631PreserveExits?.(pb1753VisibleLabOrders(data.orders||[],o),previous)||pb1753VisibleLabOrders(data.orders||[],o));";
 assert(previous.includes('pb1631PreserveExits'));
 assert(previous.includes('const refresh='));
 assert(current.includes(old));
 assert(current.includes(replacement));
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const ui=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(ui.includes(replacement));
  assert(!ui.includes(old));
  assert(ui.includes('window.pb1631PreserveExits?.('));
 }
});

test('R1757: real installer declares live queue anchors on separate physical lines',()=>{
 const script=fs.readFileSync('scripts/enable-r1753-deleted-orders-native-sync.mjs','utf8');
 assert.match(script,/^const old=/m);
 assert.match(script,/^const fresh=/m);
 assert.equal(script.split('const old=').length,2);
 assert.equal(script.split('const fresh=').length,2);
 assert(!script.includes('setter.\\n// Match'));
 assert(!script.includes('setter.\\nconst old='));
 assert(!script.includes('setter.\\nconst fresh='));
});
