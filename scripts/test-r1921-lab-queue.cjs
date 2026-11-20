const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pageLabOrders,conditions,PAGE_SIZE}=require('../dist/api/lab-order-pages.cjs');
const ui=fs.readFileSync(path.join(__dirname,'../dist/web/assets/index-UIRefine-v655-r84.js'),'utf8');
const server=fs.readFileSync(path.join(__dirname,'../dist/api/server.js'),'utf8');
test('R1921: three tabs and newest-first are strictly paged at ten rows on server',async()=>{
 const seen=[];const pool={query:async(sql,params)=>{seen.push({sql,params});if(/SELECT count\(\*\)::int AS total/.test(sql))return{rows:[{total:32}]};if(/SELECT o.id FROM orders/.test(sql))return{rows:Array.from({length:10},(_,i)=>({id:'00000000-0000-4000-8000-'+String(i).padStart(12,'0')}))};return{rows:Array.from({length:10},(_,i)=>({id:i}))};}};
 const result=await pageLabOrders(pool,'lab-uuid',new URLSearchParams('tab=completed&mode=print&page=2&q=studio'));
 assert.equal(PAGE_SIZE,10);assert.equal(result.orders.length,10);assert.equal(result.pages,4);assert.equal(result.page,2);assert.equal(result.counts.completed,32);
 const idRead=seen.find(x=>x.sql.includes('SELECT o.id FROM orders'));assert(idRead.sql.includes('ORDER BY o.created_at DESC,o.id DESC LIMIT $4 OFFSET $5'));assert.deepEqual(idRead.params.slice(-2),[10,10]);
 const detail=seen.find(x=>x.sql.includes('SELECT o.*,COALESCE'));assert.equal(detail.params[1].length,10);assert(detail.sql.includes('o.id=ANY($2::uuid[])'));
 assert(seen.every(x=>x.sql.includes('o.lab_id=$1')));
});
test('R1921: invalid tab/page never make a database query',async()=>{const pool={query:()=>{throw Error('database must not run')}};assert.equal((await pageLabOrders(pool,'a',new URLSearchParams('tab=bad'))).status,400);assert.equal((await pageLabOrders(pool,'a',new URLSearchParams('tab=flow&page=-5'))).status,400)});
test('R1921: hide is not a destructive delete; invoices remain as financial records',()=>{
 assert(server.includes('lab_hidden_order_cards(lab_id,order_id,hidden_by,reason)'));
 assert(server.includes('financialRecordsPreserved:true'));
 assert(ui.includes('/hide'));assert(ui.includes('فاکتور، پرداخت‌ها و فایل‌های این سفارش حذف نمی‌شوند'));
 assert(conditions('flow','').includes('NOT EXISTS (SELECT 1 FROM lab_hidden_order_cards'));
});
test('R1921: queue uses backend pages, search and previous/next, not render all',()=>{
 assert(ui.includes('/api/lab/orders?tab='));assert(ui.includes('_pbSetPage(v=>Math.min(_pbPages,v+1))'));assert(ui.includes('labQueuePageControls'));
 assert(ui.includes('if(le.downloaded_at&&le.invoice_id&&le.invoice_issued_at)'));
 assert(ui.includes('فاکتور قبلی محفوظ است'));
});
