'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {listLabOrdersPage,params}=require('../dist/api/lab-order-pages-r1944.cjs');
const asset='assets/index-UIRefine-v655-r84.js';

test('R1944: invalid stage or mode fail before queries; page sizes fixed at 10',()=>{
 for(const query of ['stage=bad','mode=other','stage=completed%3BDROP%20TABLE']){
  assert.throws(()=>params(new URL('https://localhost/api/lab/orders?'+query)),/invalid_/);
 }
 assert.equal(params(new URL('https://localhost/api/lab/orders?stage=flow&mode=print&page=9999999999')).page,100000);
 assert.equal(params(new URL('https://localhost/api/lab/orders')).limit,10);
});

test('R1944: newest 10 records from the selected tab and full-history photo-file search',async()=>{
 const calls=[],id=(n)=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 const pool={query:async(sql,par)=>{
   calls.push({sql,par});
   if(sql.includes('count(*) FILTER'))return{rows:[{flow:115,ready:54,completed:305}]};
   return{rows:Array.from({length:10},(_,i)=>({id:id(i),number:800-i}))};
 }};
 const r=await listLabOrdersPage(pool,'lab-test',new URL('https://local/api/lab/orders?paged=1&mode=print&stage=completed&page=5&q=child-photo.jpg'));
 assert.equal(r.orders.length,10);
 assert.equal(r.total,305);
 assert.equal(r.pages,31);
 assert.equal(r.page,5);
 assert.deepEqual(r.counts,{flow:115,ready:54,completed:305});
 assert.equal(calls.length,2);
 const q=calls[1];
 assert.match(q.sql,/WITH page_ids AS MATERIALIZED/);
 assert.match(q.sql,/LIMIT \$4 OFFSET \$5/);
 assert.match(q.sql,/ORDER BY o\.created_at DESC,o\.id DESC/);
 assert.match(q.sql,/original_name.*ILIKE/);
 assert.match(q.sql,/invoice_pricing_missing_count/);
 assert.match(q.sql,/o\.status='completed'/);
 assert.deepEqual(q.par,['lab-test','print','child-photo.jpg',10,40]);
 assert(!q.sql.includes('lab_order_queue_hidden'));
 assert(q.sql.includes('o.lab_id=$1'));
});

test('R1944: out-of-range page clamps instead of emptying the last page',async()=>{
 const calls=[],pool={query:async(sql,args)=>{
   calls.push(args);
   return sql.includes('count(*) FILTER')?{rows:[{flow:6,ready:0,completed:0}]}:{rows:[{id:'latest'}]};
 }};
 const r=await listLabOrdersPage(pool,'lab',new URL('https://local/api/lab/orders?stage=flow&mode=album&page=100&q='));
 assert.equal(r.page,1);assert.equal(r.pages,1);assert.equal(r.total,6);
 assert.deepEqual(calls.at(-1).slice(-2),[10,0]);
});

test('R1944: delivered site/server preserves legacy endpoint and changes no financial or folder code',()=>{
 const api=fs.readFileSync('dist/api/server.js','utf8');
 const route=api.indexOf('/* PB1944 ten-order server pages */');
 const legacy=api.indexOf("if (req.method === 'GET' && url.pathname === '/api/lab/orders')",route);
 assert(route>0&&legacy>route);
 assert(api.slice(route,legacy).includes("url.searchParams.get('paged') === '1'"));
 const source=fs.readFileSync('dist/api/lab-order-pages-r1944.cjs','utf8');
 assert(!/DELETE FROM|UPDATE invoices|INSERT INTO|lab_order_queue_hidden/.test(source));
});

test('R1944: web and native show ten-row live server pages and sticky controls',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const ui=fs.readFileSync(root+'/'+asset,'utf8');
  const html=fs.readFileSync(root+'/index.html','utf8');
  assert(ui.includes('PB1944 server-paged lab queue'),root+' missing paged fetch');
  assert(ui.includes('paged=1&mode='),root+' missing server route');
  assert(ui.includes('r1944Toolbar'),root+' missing controls');
  assert(ui.includes('className:"r1954QueueBar"'),root+' compact third header must be outside the sticky bar');
  assert(!ui.includes('className:"r1952StatusTabs"'),root+' duplicated status buttons must not be mounted');
  assert(html.includes('id="pb1954-lab-third-header"'),root+' compact third-header CSS is missing');
  const statusEnd='children:["تحویل‌شده ",e.jsx("b",{children:V(ge.completed)})]})]})';
  const statusEndAt=ui.indexOf(statusEnd);
  assert(statusEndAt>0,root+' legacy status anchor missing');
  assert(ui.slice(statusEndAt+statusEnd.length,statusEndAt+statusEnd.length+100).startsWith(']})'+',e.jsx("section",{className:"r1954QueueBar"'),root+' pager must be outside the old sticky header');
  assert(ui.includes('PB1954: background refresh must not flash loading UI'),root+' polling flicker guard missing');
  assert(ui.includes('JSON.stringify(previous)===JSON.stringify(next)?previous:next'),root+' unchanged rows must not re-render');
  assert(!ui.includes('r1944Pending?"در حال دریافت سفارش‌ها…":'),root+' temporary loading summary must not blink');
  assert(!ui.includes('disabled:r1944Pending||r1944Page'),root+' pagination must not toggle disabled on polling');
  assert(ui.includes('r1944Query'),root+' missing full-history search field');
   assert(!ui.includes('className:"labQueueSearchSlot desktopQueueSearch"'),root+' duplicate legacy search must not render');
   assert(html.includes('PB1949:'),root+' final CSS must override legacy header grid');
  assert(ui.includes('nativeOffline?pb1945Legacy():Me(uri).catch('),root+' must retain offline cached orders and fallback if server paging fails');
  assert(ui.includes('__pb1945Legacy'),root+' missing fallback status marker');
  assert(ui.includes('stage.slice((r1944Page-1)*10,r1944Page*10)'),root+' fallback pages must show no more than ten');
  assert(ui.includes('Math.min(r1944Pages,typeof window!=="undefined"&&window.innerWidth<=820?3:5)'),root+' missing compact mobile pagination');
  assert(html.includes('id="pb1944-lab-pager"'),root+' missing fixed bar CSS');
  assert(html.includes('.r1954QueueBar > .r1944Toolbar'),root+' pager must render in third header');
  assert(!html.includes('.labQueueStickyBar:has(>.r1944Toolbar)'),root+' advanced parent selector must not hide desktop pager');
  assert(html.includes('labStage=r1954'),root+' stale bundle URL');
  assert(!ui.includes('lab_order_queue_hidden'),root+' should not contain old delete feature');
 }
});
