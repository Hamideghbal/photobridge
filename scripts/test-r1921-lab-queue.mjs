import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pageLabOrders,setQueueHidden,pageParams} from '../dist/api/lab-order-queue-page.js';

test('R1921: bounded SQL pagination loads ten latest records and computes all three counts',async()=>{
 const calls=[];
 const pool={query:async(sql,params)=>{calls.push({sql,params});return sql.includes('count(*) FILTER')?{rows:[{flow:137,ready:9,completed:54321}]}:{rows:Array.from({length:10},(_,i)=>({id:'order-'+i}))};}};
 const data=await pageLabOrders(pool,'lab-one',new URL('https://local/api/lab/orders?tab=completed&page=3&mode=print&q=استودیو'));
 assert.equal(data.orders.length,10);assert.equal(data.pageSize,10);assert.equal(data.page,3);assert.equal(data.pages,5433);
 assert.equal(data.counts.completed,54321);assert.equal(data.total,54321);
 assert.deepEqual(calls[1].params,['lab-one','print','استودیو',20,'completed']);
 assert.match(calls[1].sql,/WITH paged AS/);assert.match(calls[1].sql,/LIMIT 10 OFFSET \$4/);
 assert.match(calls[1].sql,/ORDER BY o.created_at DESC,o.id DESC/);
 assert.match(calls[0].sql,/o.lab_id=\$1/);
 assert.match(calls[0].sql,/si.number::text ILIKE/);
 assert(!calls[0].sql.includes('استودیو'),'search must remain parameterized, not interpolated');
});
test('R1921: invalid page and tab input fail into safe page 1 with bounded query',()=>{
 assert.deepEqual(pageParams(new URL('https://local/api/lab/orders?tab=bad&page=-8&mode=foo&q= hello ')),{mode:'print',tab:'flow',page:1,q:'hello'});
 assert.equal(pageParams(new URL('https://local/api/lab/orders?page=99999999')).page,100000);
});
test('R1921: empty result still has first page; completed search does not load full orders',async()=>{
 const sql=[];
 const pool={query:async(q,args)=>{sql.push({q,args});return q.includes('count(*) FILTER')?{rows:[{flow:0,ready:0,completed:0}]}:{rows:[]};}};
 const result=await pageLabOrders(pool,'lab-one',new URL('https://local/api/lab/orders?tab=completed&page=999&mode=album'));
 assert.equal(result.page,1);assert.equal(result.pages,1);assert.equal(result.total,0);
 assert.equal(sql[1].args[3],0);assert.equal(sql[1].args[4],'completed');
 assert.match(sql[1].q,/o.mode=\$2/);
 assert.match(sql[1].q,/lab_queue_hidden/);
});
test('R1921: hide and restore emit queue-visibility history only, preserving invoices and files',async()=>{
 const statements=[];let state=null;const orderId='60aa717d-59c3-4f5f-91ad-448d93080e97';
 const client={query:async(q,args)=>{statements.push(q);
  if(q.includes('SELECT id,customer_id,status FROM orders'))return{rowCount:1,rows:[{id:orderId,customer_id:'customer',status:'completed'}]};
  if(q.includes('SELECT status FROM order_status_events'))return{rows:state?[{status:state}]:[]};
  if(q.includes('INSERT INTO order_status_events')){state=args[3];return{rowCount:1};}
  return{rowCount:1};
 },release(){}};
 const pool={connect:async()=>client};
 const a=await setQueueHidden(pool,{labId:'lab-one',actorId:'actor-one',orderId,hidden:true});
 const b=await setQueueHidden(pool,{labId:'lab-one',actorId:'actor-one',orderId,hidden:true});
 assert.equal(a.ok,true);assert.equal(b.hidden,true);
 assert.equal(statements.filter(x=>x.includes('INSERT INTO order_status_events')).length,1,'hiding is idempotent');
 const c=await setQueueHidden(pool,{labId:'lab-one',actorId:'actor-one',orderId,hidden:false});
 assert.equal(c.hidden,false);assert.equal(statements.filter(x=>x.includes('INSERT INTO order_status_events')).length,2);
 assert(statements.every(x=>!/(DELETE FROM|UPDATE) (?:invoices|order_files|finance_)/i.test(x)), 'financial and photo records cannot be touched');
});
test('R1921: real UI fetches server-side tab and page instead of old 300-order local filtering',()=>{
 const ui=readFileSync(new URL('../dist/web/assets/index-UIRefine-v655-r84.js',import.meta.url),'utf8');
 const server=readFileSync(new URL('../dist/api/server.js',import.meta.url),'utf8');
 assert.match(ui,/new URLSearchParams\(\{tab:T,page:String\(pb1921Page\),mode:o,q:pb1921Query\}\)/);
 assert.match(ui,/pageSize:10,onPage:pb1921SetPage/);
 assert.match(ui,/queue-hide/);
 assert.match(ui,/le.downloaded_at&&le.invoice_id&&le.invoice_pdf_ready/);
 assert.match(ui,/return nt==="download"\?\(!!le.downloaded_at\|\|kn/);
 assert.match(ui,/if\(le!==pb1921Latest.id\)return/);
 assert(!ui.includes('ma=le=>!(le!=null&&le.downloaded_at)'), 'all old invoices must offer a safe hide button');
 assert.match(server,/await pageLabOrders\(pool,labId,url\)/);
 assert.match(server,/await setQueueHidden\(pool/);
});
