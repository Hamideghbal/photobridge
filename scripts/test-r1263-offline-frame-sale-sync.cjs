'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{randomUUID:uuid}=require('node:crypto');
const shopId=uuid(),userId=uuid(),a=uuid(),b=uuid();
async function setup({frame=true,price=250000,saleEnabled=true}={}){
 const {createStoreDesktopSync}=await import('../dist/api/storeDesktopSync.js');
 const orders=[],receipts=new Map(),products=new Map([
 [a,{id:a,shop_id:shopId,title:'قاب PVC سفید',sale_price:price,active:true,deleted_at:null,stock_total:0}],
 [b,{id:b,shop_id:shopId,title:'شاسی',sale_price:60000,active:true,deleted_at:null,stock_total:0}]]);
 const query=async(statement,params=[])=>{
  if(statement.includes('SELECT payload_hash,result FROM equipment_store_desktop_operations')){const x=receipts.get(params[1]);return{rows:x?[x]:[]}}
  if(statement.includes('SELECT local_id,server_id FROM equipment_store_desktop_ids'))return{rows:[]};
  if(statement.includes('SELECT id,shop_id,active,deleted_at,sale_price,stock_total,title FROM equipment_sale_items')){const x=products.get(params[1]);return{rows:x?[x]:[]}}
  if(statement.includes('INSERT INTO equipment_sale_orders')){const row={id:params[0],shop_id:params[1],sale_item_id:params[2],buyer_name:params[3],buyer_mobile:params[4],quantity:params[5],unit_price:params[6],total_amount:params[7],status:'confirmed',payment_status:'unpaid',notes:params[8]};orders.push(row);return{rows:[row]}}
  if(statement.includes('INSERT INTO equipment_store_desktop_operations')){receipts.set(params[1],{payload_hash:params[3],result:JSON.parse(params[4])});return{rows:[]}}
  return{rows:[]};
 };
 const shop={id:shopId,business_category:frame?'frame_chassis':'equipment_rental_sale',sale_enabled:saleEnabled};
 const handler=createStoreDesktopSync({pool:{connect:async()=>({query,release(){}})},shopFor:async()=>shop,bodyJson:async req=>req.payload,sendJson:(res,status,data)=>{res.status=status;res.data=data}});
 const request=async payload=>{const res={};await handler({method:'POST',payload},res,new URL('https://photobridge.ir/api/rental/desktop/operation'),{userId});return res};
 return{request,orders,receipts,products};
}
const make=()=>({id:uuid(),deviceId:uuid(),entityId:uuid(),entity:'saleOrders',action:'saleBatch.create',payload:{
 buyerName:'مشتری حضوری',buyerMobile:'09121234567',invoiceRef:'OFF-ABCDEF123456',expectedTotal:560000,
 lines:[{orderId:uuid(),saleItemId:a,quantity:2,expectedUnitPrice:250000},{orderId:uuid(),saleItemId:b,quantity:1,expectedUnitPrice:60000}]
}});
test('offline frame invoice syncs atomically and replay does not create duplicate sale rows',async()=>{
 const env=await setup(),op=make();
 const first=await env.request(op);
 assert.equal(first.status,200);assert.equal(first.data.ok,true);
 assert.equal(first.data.record.invoiceRef,op.payload.invoiceRef);
 assert.equal(env.orders.length,2);assert.equal(env.orders[0].total_amount,500000);assert.equal(env.orders[1].total_amount,60000);
 assert(env.orders.every(x=>x.notes.includes(op.payload.invoiceRef)));
 assert(env.orders.every(x=>x.status==='confirmed'&&x.payment_status==='unpaid'));
 const again=await env.request(op);assert.equal(again.status,200);assert.equal(again.data.replayed,true);assert.equal(env.orders.length,2);
 const reused=structuredClone(op);reused.payload.buyerName='نام دیگر';
 assert.equal((await env.request(reused)).status,409);
});
test('offline manual orders block equipment accounts, disabled sale, and stale catalog prices',async()=>{
 for(const options of [{frame:false},{saleEnabled:false}]){
  const env=await setup(options),response=await env.request(make());
  assert.equal(response.status,403);assert.equal(env.orders.length,0);
 }
 const env=await setup({price:251000}),response=await env.request(make());
 assert.equal(response.status,409);assert.equal(response.data.error,'manual_price_changed');assert.equal(env.orders.length,0);
 const missing=await setup(),op=make();op.payload.lines[0].saleItemId=uuid();
 assert.equal((await missing.request(op)).status,409);assert.equal(missing.orders.length,0);
});
