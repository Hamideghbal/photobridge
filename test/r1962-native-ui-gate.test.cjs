'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validatePagedLabQueue}=require('../verify-native-ui.cjs');
test('old storage-compatible bundles cannot masquerade as paged Lab UI',()=>{
  assert.throws(()=>validatePagedLabQueue('function pbStorageBridge(){}'),/native_paged_lab_ui_stale/);
});
test('paged UI requires read generations and offline ten-order fallback',()=>{
  const source=['PB1944 server-paged lab queue','paged=1&mode=',
    'seq!==pbLiveOrders.current.seq','__pb1945Legacy',
    'stage.slice((r1944Page-1)*10,r1944Page*10)'].join(';');
  assert.doesNotThrow(()=>validatePagedLabQueue(source));
  assert.throws(()=>validatePagedLabQueue(source.replace('seq!==pbLiveOrders.current.seq','')),/native_paged_lab_ui_stale/);
});
