'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {LabStore}=require('../store.cjs');
const {cachedInvoicePdf}=require('../invoice-render-cache.cjs');
const fake=(tag)=>Buffer.from('%PDF-1.4\n'+tag+'\n%%EOF');
test('R1919: identical issued invoice PDF is rendered once; changed HTML is always rerendered',async()=>{
 const store=new LabStore(':memory:');let calls=0;
 const render=async html=>{calls++;return fake(String(calls)+html);};
 try{
  const a=await cachedInvoicePdf({store,lab:'lab-a',invoice:'invoice-a',html:'<html>100</html>',render});
  const b=await cachedInvoicePdf({store,lab:'lab-a',invoice:'invoice-a',html:'<html>100</html>',render});
  assert.equal(calls,1);assert.deepEqual(a,b);
  const changed=await cachedInvoicePdf({store,lab:'lab-a',invoice:'invoice-a',html:'<html>200</html>',render});
  assert.equal(calls,2);assert.notDeepEqual(b,changed);
 }finally{store.db.close();}
});
test('R1919: PDF cache never leaks across laboratories or invoice IDs',async()=>{
 const store=new LabStore(':memory:');let calls=0;
 try{
  const render=async()=>fake(++calls);
  for(const [lab,invoice]of [['a','1'],['b','1'],['a','2']]){
   await cachedInvoicePdf({store,lab,invoice,html:'<html>same</html>',render});
  }
  assert.equal(calls,3);
 }finally{store.db.close();}
});
test('R1919: renderer failure and account switch do not insert invalid or cross-account PDFs',async()=>{
 const store=new LabStore(':memory:');
 try{
  await assert.rejects(cachedInvoicePdf({store,lab:'a',invoice:'1',html:'<html></html>',render:async()=>Buffer.from('NOT A PDF')}),/invalid_invoice_pdf/);
  await assert.rejects(cachedInvoicePdf({store,lab:'a',invoice:'2',html:'<html></html>',render:async()=>fake('ok'),checkAccount:()=>{throw Error('account_changed')}}),/account_changed/);
  assert.equal(store.db.prepare('SELECT count(*) n FROM local_invoice_render_cache').get().n,0);
 }finally{store.db.close();}
});
