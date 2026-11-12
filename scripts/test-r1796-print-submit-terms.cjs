'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('dist/api/server.js','utf8');
const start=source.indexOf("        if (submitCustomerOrder && req.method === 'POST')"),end=source.indexOf('        const customerReceiptPresign',start);
assert(start>=0&&end>start,'test the final composed customer submit route');
const route=source.slice(start,end);
async function submit({live='ledger',draftTerms='ledger',missingPrice=false,album=false,shortStock=false,termsError=false,pure=false,exempt=false}={}){
 const calls=[],events=[],notifications=[];
 let saved,invoiceCount=0,released=false,rollbacks=0,response;
 const order={id:'order',mode:album?'album':'print',settlement_mode:draftTerms,customer_id:'customer',invoice_required:!exempt,customer_kind:'coworker',status:'uploading',album_data:album?{spreads:1,size:{widthCm:10,heightCm:15},paperCounts:{luster:1},pricing:{albumPricingMode:'combined'}}:null};
 const file={id:'file',print_size_id:'size',copies:1,chassis:false,frame:shortStock,addon_selection:shortStock?{frame:{id:'custom-frame'}}:{}};
 const c={async query(sql,args){calls.push({sql,args,client:'transaction'});
  if(sql==='BEGIN'||sql==='COMMIT')return {rows:[],rowCount:0};
  if(sql==='ROLLBACK'){rollbacks++;return {rows:[],rowCount:0}}
  if(sql.includes('FROM order_files'))return {rows:[file]};
  if(sql.startsWith('SELECT ui_preferences'))return {rows:[{ui_preferences:{printTariffCatalog:{stocks:{size:{'custom-frame':0}}}}}]};
  if(sql.startsWith('SELECT settlement_mode FROM orders')){if(termsError)throw Error('db_unavailable');return {rowCount:1,rows:[{settlement_mode:live}]}}
  if(sql.startsWith('UPDATE orders SET status=')){saved={...order,status:args[1],payment_status:args[2],settlement_mode:live};return {rowCount:1,rows:[saved]}}
  throw Error('unexpected transaction query: '+sql);
 },release(){released=true}};
 const pool={async query(sql,args){calls.push({sql,args,client:'pool'});
  if(sql.startsWith('SELECT * FROM orders'))return {rowCount:1,rows:[order]};
  if(sql.startsWith('SELECT count(*)'))return {rows:[{n:1}]};
  if(sql.includes('JOIN labs l'))return {rows:[{id:'file',width:1000,height:1500,print_type:'luster',crop_handling:'none',crop_delegation_enabled:false}]};
  if(sql.startsWith('SELECT payment_card_number'))return {rows:[{payment_account_holder:'Lab'}]};
  throw Error('unexpected pool query: '+sql);
 },connect:async()=>c};
 const context={req:{method:'POST'},submitCustomerOrder:['','order'],pool,labId:'lab',a:{userId:'customer',name:'Customer'},res:{},
  sendJson:(res,status,body)=>{response={status,body};return response},simplePrintUploadPilotEnabled:async()=>true,
  normalizePrintCatalog:raw=>raw,orderInvoicePriceRequirements:async()=>missingPrice?[{key:'missing',resolved:false}]:[],
  productInvoiceRequired:order=>order.invoice_required!==false,isNoPrintOrder:async()=>pure,
  statusEvent:async()=>{},createOrGetInvoice:async()=>{invoiceCount++;return {id:'invoice',total:100}},
  audit:async()=>{},publishLabEvent:(...args)=>events.push(args),notifyLabManagerSms:async(...args)=>{notifications.push(args)},notifyLabCustomerForStatus:async()=>{}};
 const helperStart=source.indexOf('async function pb1799ProductInvoice(');
 if(helperStart>=0)context.pb1799ProductInvoice=vm.runInNewContext('('+source.slice(helperStart,source.indexOf('async function financeDocumentsForCustomer(',helperStart))+')',context);
 let error;
 try{await vm.runInNewContext('(async()=>{'+route+'})()',context)}catch(e){error=e}
 return {response,calls,saved,invoiceCount,released,rollbacks,events,notifications,error};
}
function succeeded(result){if(result.error)throw result.error;assert.equal(result.response.status,200);assert(result.released);assert.equal(result.rollbacks,0)}
test('R1796 final print submit without frame/chassis completes instead of referencing missing liveTerms',async()=>{
 const result=await submit();succeeded(result);
 assert.equal(result.response.body.order.status,'sent');
 assert.equal(result.response.body.paymentRequired,false);
 assert.equal(result.invoiceCount,0);assert.equal(result.events.length,1);
 const lock=result.calls.findIndex(c=>c.sql.startsWith('SELECT settlement_mode FROM orders'));
 const update=result.calls.findIndex(c=>c.sql.startsWith('UPDATE orders SET status='));
 assert(lock>=0&&lock<update);assert.match(result.calls[lock].sql,/FOR UPDATE/);
 assert.deepEqual(Array.from(result.calls[lock].args),['order','lab','customer']);
});
test('R1796 checkout uses live locked prepaid terms rather than stale ledger terms',async()=>{
 const result=await submit({live:'prepaid',draftTerms:'ledger'});succeeded(result);
 assert.equal(result.response.body.paymentRequired,true);assert.equal(result.saved.status,'awaiting_payment');
 assert.equal(result.saved.payment_status,'awaiting_receipt');assert.equal(result.invoiceCount,1);
});
test('R1796 a live change to ledger does not force an obsolete prepaid invoice',async()=>{
 const result=await submit({live:'ledger',draftTerms:'prepaid'});succeeded(result);
 assert.equal(result.response.body.paymentRequired,false);assert.equal(result.saved.status,'sent');assert.equal(result.invoiceCount,0);
});
test('R1796 unpriced prepaid orders still wait for pricing, with no premature invoice',async()=>{
 const result=await submit({live:'prepaid',missingPrice:true});succeeded(result);
 assert.equal(result.response.body.pricingRequired,true);assert.equal(result.saved.payment_status,'pricing_required');assert.equal(result.invoiceCount,0);
});
test('R1796 preserving settlement terms does not bypass custom-model stock checks',async()=>{
 const result=await submit({shortStock:true});if(result.error)throw result.error;
 assert.equal(result.response.status,409);assert.equal(result.response.body.error,'stock_unavailable');
 assert.equal(result.rollbacks,1);assert(result.released);assert.equal(result.saved,undefined);assert.equal(result.invoiceCount,0);assert.equal(result.events.length,0);
});
test('R1796 album checkout also retains its live settlement declaration',async()=>{
 const result=await submit({album:true});succeeded(result);assert.equal(result.saved.status,'sent');
});
test('R1796 a failed settlement lock rolls back rather than submitting with guessed terms',async()=>{
 const result=await submit({termsError:true});assert.equal(result.error?.message,'db_unavailable');
 assert.equal(result.rollbacks,1);assert(result.released);assert.equal(result.saved,undefined);assert.equal(result.events.length,0);
});

module.exports={submit};
