'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {LabStore}=require('../store.cjs');
const {applyPolicy}=require('../document-policy.cjs');
test('R1919: repeated menu/order/invoice policy calls do not open another SQLite transaction',()=>{
 const store=new LabStore(':memory:'),lab='123e4567-e89b-12d3-a456-426614174000';
 store.set('labId',lab);store.set('deviceId','device-test');store.set('auth',{lab:{id:lab}});
 const original=store.transaction.bind(store);let transactions=0;
 store.transaction=(fn)=>{transactions++;return original(fn);};
 try{
  applyPolicy(store);
  const before=transactions;assert(before>0);
  assert.equal(store.get('documentPolicyAppliedV1:'+lab),true);
  for(let i=0;i<300;i++)applyPolicy(store);
  assert.equal(transactions,before,'no repeat migration when loading menus, invoices and status');
  const s=store.get('localBusiness:v1:'+lab);
  assert.equal(s.documentPolicyVersion,1);
 }finally{store.db.close();}
});
test('R1919: changing the authenticated lab performs its own first migration',()=>{
 const store=new LabStore(':memory:');store.set('deviceId','device-test');
 const a='123e4567-e89b-12d3-a456-426614174000',b='123e4567-e89b-12d3-a456-426614174001';
 try{for(const lab of [a,b]){store.set('labId',lab);store.set('auth',{lab:{id:lab}});applyPolicy(store);assert.equal(store.get('documentPolicyAppliedV1:'+lab),true);assert.equal(store.get('localBusiness:v1:'+lab).documentPolicyVersion,1);}}finally{store.db.close();}
});
