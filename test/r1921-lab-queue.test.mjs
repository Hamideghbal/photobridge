import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const queue=require('../dist/api/lab-order-queue-r1921.cjs');

test('R1921: page parameters are bounded and stage/mode cannot inject SQL',()=>{
 const u=new URL('https://local.test/api/lab/orders?paged=1&mode=print&stage=completed&page=200000&q=abc');
 assert.deepEqual(queue.params(u),{stage:'completed',mode:'print',page:100000,search:'abc',limit:10,offset:999990});
 for(const qs of ['stage=completed%3BDROP%20TABLE','mode=other','stage=cancelled'])
  assert.throws(()=>queue.params(new URL('https://local.test/?'+qs)),/invalid_/);
});

test('R1921: only 10 newest matching orders are enriched; search counts are across ALL matching orders',async()=>{
 const calls=[];
 const pool={query:async(sql,params)=>{calls.push({sql,params});return /WITH page_ids/.test(sql)?{rows:[{id:'new',created_at:'2026-11-20'}]}:{rows:[{flow:500,ready:40,completed:9000}]};}};
 const url=new URL('https://local.test/api/lab/orders?paged=1&mode=print&stage=completed&page=3&q=عکاسی');
 const result=await queue.listLabOrdersPage(pool,'lab-1',url);
 assert.equal(calls.length,2);
 assert.deepEqual(calls[0].params,['lab-1','print','عکاسی',10,20]);
 assert.match(calls[0].sql,/page_ids AS MATERIALIZED/);
 assert.match(calls[0].sql,/LIMIT \$4 OFFSET \$5/);
 assert.match(calls[0].sql,/o\.status='completed'/);
 assert.match(calls[0].sql,/ORDER BY o\.created_at DESC,o\.id DESC/);
 assert.match(calls[0].sql,/lab_order_queue_hidden/);
 assert.match(calls[0].sql,/invoice_pricing_missing_count/);
 assert.match(calls[1].sql,/count\(\*\) FILTER/);
 assert.match(calls[1].sql,/ii\.number::text ILIKE/);
 assert.equal(result.total,9000);assert.equal(result.pages,900);assert.equal(result.orders.length,1);
});

test('R1921: hiding old invoiced/downloaded order is a reversible visibility record, never DELETE financial history',async()=>{
 const executed=[],client={query:async(sql,args=[])=>{executed.push(sql);if(sql.startsWith('SELECT id,status'))return{rowCount:1,rows:[{id:'order',status:'completed'}]};return{rowCount:1,rows:[]}},release:()=>{}};
 const pool={connect:async()=>client,query:async(sql)=>{executed.push(sql);return{rowCount:1,rows:[{order_id:'order'}]}}};
 const hide=await queue.hideLabOrderFromQueue(pool,{labId:'lab',orderId:'order',actorId:'actor'});
 assert.equal(hide.status,200);assert.equal(hide.body.invoicePreserved,true);assert.equal(hide.body.filesPreserved,true);
 assert(executed.some(sql=>sql.includes('INSERT INTO lab_order_queue_hidden')));
 assert(executed.every(sql=>!/DELETE FROM (orders|invoices|finance|order_files)/.test(sql)));
 const restore=await queue.unhideLabOrderFromQueue(pool,{labId:'lab',orderId:'order'});
 assert.equal(restore.status,200);assert.equal(restore.body.restored,true);
});

test('R1921: new lab UI fetches paged server data, has search and no old 300-card loop or destructive delete action',()=>{
 const web=fs.readFileSync(new URL('../dist/web/assets/index-UIRefine-v655-r84.js',import.meta.url),'utf8');
 assert(web.includes('paged=1&mode='));
 assert(web.includes('r1921SetCounts'));
 assert(web.includes('صفحه بعد')&&web.includes('صفحه قبل'));
 assert(web.includes('hide-from-queue'));
 assert(web.includes('عکاسی یا فاکتور'));
 assert(web.includes('local invoice folder unavailable'));
 assert(!web.includes('ma=le=>!(le!=null&&le.downloaded_at)'));
});

test('R1921: backend keeps legacy callers but exposes protected paged + soft-hide routes',()=>{
 const server=fs.readFileSync(new URL('../dist/api/server.js',import.meta.url),'utf8');
 assert.match(server,/url\.searchParams\.get\('paged'\) === '1'/);
 assert(server.includes('queue.hideLabOrderFromQueue'));
 assert(server.includes('queue.unhideLabOrderFromQueue'));
 assert(server.includes("data.confirm!==true"));
 assert(server.includes('SELECT o.*,COALESCE(o.walkin_customer_name'));
 const migration=fs.readFileSync(new URL('../migrations/198_lab_order_queue_hidden.sql',import.meta.url),'utf8');
 assert(migration.includes('PRIMARY KEY (lab_id, order_id)'));
 assert(!migration.includes('DELETE FROM invoices'));
});
