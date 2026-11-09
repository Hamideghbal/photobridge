'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('scripts/r1550-order-storage.js.txt','utf8');
test('R1664 routes only walk-in/direct customers into customer folder, photographers to coworker folder',()=>{
 const context={window:{pbLabLocalIntakeStorage:{}},Map,Promise,Date,pb1450Root:async()=>null};
 vm.createContext(context);vm.runInContext(code,context);
 const fn=context.pb1664StorageBucket;
 assert.equal(fn({source:'walkin',walkin_customer_name:'مشتری'}),'moshtari');
 assert.equal(fn({source:'manual_invoice'}),'moshtari');
 assert.equal(fn({source:'print',customer_name:'عکاسی'}),'Hamkar');
 assert.equal(fn({source:'web',mode:'album'}),'Hamkar');
 assert.equal(fn({walkin_customer_mobile:'09123456789'}),'moshtari');
 const previous=context.pb1664PreviousStorageBucket;
 assert.equal(previous({source:'print'}),'hamkar');
 assert.equal(previous({source:'walkin'}),null);
 const legacy=context.pb1664LegacyStorageBucket;
 assert.equal(legacy({source:'walkin'}),'مشتریان');
 assert.equal(legacy({source:'print'}),'همکاران');
});
test('R1664 new storage layout includes category, date, named party and order-size subfolder',()=>{
 assert.match(code,/\[pb1664StorageBucket\(detail\.order\),day,saved\.customer,Uy\(detail,file\)\]/);
 assert.match(code,/for\(const prefix of \[\[pb1664StorageBucket\(detail\.order\),day,customer\],\.\.\.\(previous\?\[\[previous,day,customer\]\]:\[\]\),\[pb1664LegacyStorageBucket\(detail\.order\),day,customer\],\[day,customer\]\]\)/);
 assert.match(code,/if\(old\)return\{root,dir:pb1550Decode\(old\.dir\),day:old\.day\}/);
});
test('R1664 browser and native installs use the same guarded source without migrating old orders',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(js.includes('function pb1664StorageBucket(order)'),root);
  assert(js.includes('pb1550NativeLegacy(detail)'),root);
  assert(js.includes('function pb1550Probe(root,detail)'),root);
 }
});
