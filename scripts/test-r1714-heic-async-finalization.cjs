'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('R1714 routes HEIC conversion via 202 + authenticated status polling, retaining old JPEG completion',()=>{
 const src=fs.readFileSync('dist/api/server.js','utf8');
 const a=src.indexOf("const pb1714PendingJobs = new Map()");
 const b=src.indexOf('async function ensurePrintReadyJpeg(row) {',a);
 assert(a>0&&b>a,'serial conversion queue installed');
 const start=src.indexOf("if (req.method === 'POST' && url.pathname === '/api/customer/uploads/complete') {");
 const end=src.indexOf("\n    return sendJson(res, 404, { error: 'not_found' });",start);
 assert(start>0&&end>start);
 const route=src.slice(start,end);
 assert(route.includes("if (pb1666IsHeic(row)) {"));
 assert(route.includes("pb1714Enqueue(row)"));
 assert(route.includes("return sendJson(res, 202, { ok: true, status: 'processing'"));
 assert(route.includes("if (String(row.original_state || '') === 'active')"));
 assert(route.includes("await ensurePrintReadyJpeg(row)"),'JPEG and other types keep existing flow');
 const status=src.slice(start-2000,start);
 assert(status.includes('pb1714StatusMatch'));
 assert(status.includes("id=$1 AND lab_id=$2 AND customer_id=$3"),'poll must verify owner and lab');
 assert(status.includes("if (req.method === 'GET' && pb1714StatusMatch)"));
 assert(status.includes("original_state || '') === 'active'"));
 assert(status.includes("if (!job) pb1714Enqueue(row)"),'recover interrupted queue after server restart');
 assert(src.includes("AND print_conversion_status='ready' AND print_object_key IS NOT NULL"),'activate only verified converted file');
});

test('R1714 queue deduplicates file and converts HEIC one at a time',async()=>{
 const src=fs.readFileSync('dist/api/server.js','utf8');
 const a=src.indexOf('const pb1714PendingJobs = new Map()');
 const b=src.indexOf('async function ensurePrintReadyJpeg(row) {',a);
 assert(a>0&&b>a);
 const body=src.slice(a,b);
 const originals=new Map();
 const make=id=>({id,lab_id:'lab',customer_id:'customer',order_id:'order',original_state:'pending'});
 originals.set('one',make('one')); originals.set('two',make('two'));
 let active=0,max=0,changed=0,releaseFirst;
 const firstGate=new Promise(resolve=>{releaseFirst=resolve});
 const pool={async query(sql,args){
  if(sql.includes('SELECT f.* FROM order_files f JOIN orders'))return {rowCount:originals.has(args[0])?1:0,rows:originals.has(args[0])?[originals.get(args[0])]:[]};
  if(sql.includes("SET original_state='active'")){
   const row=originals.get(args[0]);if(!row||row.original_state!=='pending')return {rowCount:0,rows:[]};
   row.original_state='active';changed++;return {rowCount:1,rows:[{id:row.id}]};
  }
  if(sql.includes("print_conversion_status='failed'"))return {rowCount:1,rows:[]};
  throw Error('unexpected query: '+sql);
 }};
 const convert=async row=>{
  active++;max=Math.max(max,active);
  if(row.id==='one')await firstGate;
  active--;
 };
 const helpers=Function('pool','ensurePrintReadyJpeg','console',body+';return {enqueue:pb1714Enqueue,jobs:pb1714PendingJobs}')(pool,convert,{error(){}});
 const first=helpers.enqueue(make('one'));
 const same=helpers.enqueue(make('one'));
 assert.strictEqual(first,same,'repeat POST must not convert twice');
 const second=helpers.enqueue(make('two'));
 await new Promise(resolve=>setTimeout(resolve,10));
 assert.equal(changed,0,'never activate before successful conversion');
 releaseFirst();
 await Promise.all([first.promise,second.promise]);
 assert.equal(first.status,'ready');
 assert.equal(second.status,'ready');
 assert.equal(max,1,'only one HEIC converter runs concurrently');
 assert.equal(changed,2);
});

test('R1714 conversion failures leave original pending and report 422 through status',async()=>{
 const src=fs.readFileSync('dist/api/server.js','utf8');
 const a=src.indexOf('const pb1714PendingJobs = new Map()'),b=src.indexOf('async function ensurePrintReadyJpeg(row) {',a);
 let activated=0,failed=0;
 const row={id:'failure',lab_id:'lab',customer_id:'customer',original_state:'pending'};
 const pool={async query(sql){
  if(sql.includes('SELECT f.* FROM order_files f JOIN orders'))return {rowCount:1,rows:[row]};
  if(sql.includes("SET original_state='active'")){activated++;return {rowCount:1,rows:[row]};}
  if(sql.includes("print_conversion_status='failed'")){failed++;return {rowCount:1,rows:[]};}
  throw Error('unexpected query');
 }};
 const helper=Function('pool','ensurePrintReadyJpeg','console',src.slice(a,b)+';return pb1714Enqueue')(pool,async()=>{const e=new Error('decoder-error');e.phase='decode';e.reason='فایل تبدیل نشد';throw e},{error(){}});
 const job=helper(row);
 await job.promise;
 assert.equal(job.status,'failed');assert.equal(job.phase,'decode');
 assert.equal(activated,0);assert.equal(row.original_state,'pending');assert.equal(failed,1);
});

test('R1714 print/album clients poll and keep draft when confirmation is still processing',()=>{
 const bundle='assets/index-UIRefine-v655-r84.js';
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=fs.readFileSync(root+'/'+bundle,'utf8');
  assert(js.includes('async function pb1714FinishUpload(fileId, signal)'));
  assert(js.includes('await pb1714FinishUpload(Gt.fileId,ue.signal)'));
  assert(js.includes('await pb1714FinishUpload(An.fileId,ht.signal)'));
  assert(js.includes('!ye?.pb1714Pending&&await Me('));
  assert(js.includes('print_conversion_still_processing'));
  assert(js.includes('/api/customer/uploads/status/'));
  assert(fs.readFileSync(root+'/index.html','utf8').includes('heicAsync=r1714'));
 }
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.includes("await deployStep('./enable-r1714-heic-async-finalization.mjs')"));
 assert(build.includes("scripts/test-r1714-heic-async-finalization.cjs"));
});
