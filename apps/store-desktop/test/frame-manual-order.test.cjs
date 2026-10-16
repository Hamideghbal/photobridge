'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{randomUUID:id}=require('node:crypto');
const {Store}=require('../store.cjs');
require('../offline-frame-orders.cjs').install(Store);
const frame=id(),equipment=id(),p=id(),q=id();
function payload(shopId,category='frame_chassis'){return {protocol:1,shopId,meta:{shop:{id:shopId,business_category:category,sale_enabled:true}},entities:{shop:[{id:shopId,name:'قاب‌سازی',business_category:category,sale_enabled:true}],items:[],saleItems:[{id:p,shop_id:shopId,title:'قاب PVC سفید',sale_price:150000,active:true,stock_total:0},{id:q,shop_id:shopId,title:'شاسی',sale_price:220000,active:true,stock_total:0}],bookings:[],bookingItems:[],photographers:[],invoices:[],entries:[],shortages:[],saleOrders:[]}};}
const order=()=>({buyerName:'مشتری حضوری',buyerMobile:'09121234567',items:[{saleItemId:p,quantity:2},{saleItemId:q,quantity:1}]});
test('manual frame order remains durable, creates printable lines, queues only one batch',()=>{
 const store=new Store(':memory:');store.changeAccount(frame,{user:{id:id()}});store.install(payload(frame));
 const r=store.mutate('POST','/api/rental/manual-sale-orders',order());
 assert.equal(r.queued,true);assert.match(r.invoiceRef,/^OFF-[A-Z0-9-]+$/);
 assert.equal(r.totalAmount,520000);assert.equal(r.lines.length,2);
 const rows=store.overview().saleOrders;assert.equal(rows.length,2);assert(rows.every(x=>x._offline));
 assert(rows.every(x=>x.notes.includes(r.invoiceRef)));assert.equal(store.rows().length,1);
 const fresh=payload(frame);store.install(fresh);
 assert.equal(store.overview().saleOrders.length,2);
 store.close();
});
test('frame offline order rejects negative totals, duplicated catalog items and unrelated store types',()=>{
 const store=new Store(':memory:');store.changeAccount(frame,{user:{id:id()}});store.install(payload(frame));
 assert.throws(()=>store.mutate('POST','/api/rental/manual-sale-orders',{...order(),items:[{saleItemId:p,quantity:1},{saleItemId:p,quantity:2}]}),/invalid_manual_lines/);
 assert.throws(()=>store.mutate('POST','/api/rental/manual-sale-orders',{...order(),items:[{saleItemId:p,quantity:-1}]}),/invalid_manual_lines/);
 assert.throws(()=>store.mutate('POST','/api/rental/manual-sale-orders',{...order(),items:[{saleItemId:id(),quantity:2}]}),/manual_item_unavailable/);
 assert.equal(store.rows().length,0);
 store.changeAccount(equipment,{user:{id:id()}});store.install(payload(equipment,'equipment_rental_sale'));
 assert.throws(()=>store.mutate('POST','/api/rental/manual-sale-orders',order()),/manual_sale_not_allowed/);
 store.close();
});
test('frame owner A and equipment store B never share sale outbox or manual invoices',()=>{
 const store=new Store(':memory:');store.changeAccount(frame,{user:{id:id()}});store.install(payload(frame));
 store.mutate('POST','/api/rental/manual-sale-orders',order());
 store.changeAccount(equipment,{user:{id:id()}});store.install(payload(equipment,'equipment_rental_sale'));
 assert.equal(store.rows().length,0);assert.equal(store.overview().saleOrders.length,0);
 store.changeAccount(frame,{user:{id:id()}});
 assert.equal(store.rows().length,1);assert.equal(store.overview().saleOrders.length,2);
 store.close();
});
