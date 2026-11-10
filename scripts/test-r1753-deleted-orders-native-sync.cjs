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
  assert(ui.includes('f(pb1753VisibleLabOrders(data.orders||[],o));'));
  assert(ui.includes('setInterval(refresh,3000)'));
  assert.equal(ui.split('/* PB1753 deleted order reconciliation */').length,2);
  const marker='function pb1753VisibleLabOrders(rows,mode){',start=ui.indexOf(marker);
  assert(start>=0);
  const helper=ui.slice(start,ui.indexOf('\n/* PB1753 deleted order reconciliation */',start));
  const context={};
  vm.runInNewContext(helper+'\nresult=pb1753VisibleLabOrders([{id:"ok",mode:"print",status:"downloaded"},{id:"cancelled",mode:"print",status:"cancelled"},{id:"removed",mode:"print",deleted_at:"2026-11-10"},{id:"album",mode:"album",status:"sent"}],"print")',context);
  assert.deepEqual(Array.from(context.result,row=>row.id),['ok']);
  assert(fs.readFileSync(root+'/index.html','utf8').includes('deletedOrders=r1753'));
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
