import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {prepareLocalBatch,localBatchInsert,handleLocalBatch,localBatchPath} from '../dist/api/lab-local-batch.js';
const labId='11111111-1111-4111-8111-111111111111',
 orderId='22222222-2222-4222-8222-222222222222',
 customerId='33333333-3333-4333-8333-333333333333',
 sizeId='44444444-4444-4444-8444-444444444444';
const order={id:orderId,mode:'print',status:'uploading',customer_id:customerId};
const file=(n,copies=1)=>({clientFileId:'55555555-5555-4555-8555-'+String(n).padStart(12,'0'),
 name:'photo_'+n+'.jpg',relativePath:'photo_'+n+'.jpg',bytes:1234,contentType:'image/jpeg',
 printSizeId:sizeId,printType:'luster',printCopies:copies});
const opts={labId,order,safeFileName:x=>x,maxBytes:50_000_000};
test('batch preserves local-only storage, name suffix and exact 19-column shape',()=>{
 const list=prepareLocalBatch([file(1,3),file(2,1)],opts);
 assert.equal(list[0].rows[4],'photo_1 = 3.jpg');
 assert.match(list[0].rows[6],/^client-local-recovery\//);
 assert.equal(list[0].rows[18],'active');
 assert.equal(list[1].rows[4],'photo_2.jpg');
 const {sql,params}=localBatchInsert(list);
 assert.equal(params.length,38);
 assert.match(sql,/ON CONFLICT \(id\) DO UPDATE/);
 assert.match(sql,/AND order_files\.object_key LIKE/);
 assert.match(sql,/RETURNING id/);
 assert.equal((sql.match(/\$\d+/g)||[]).length,38);
});
test('malformed, duplicate, nonlocal and oversized input fails before database insert',()=>{
 assert.throws(()=>prepareLocalBatch([file(1),file(1)],opts),/invalid_or_duplicate_client_file_id/);
 assert.throws(()=>prepareLocalBatch([{...file(1),printCopies:101}],opts),/invalid_print_copies/);
 assert.throws(()=>prepareLocalBatch([{...file(1),bytes:0}],opts),/invalid_file_size/);
 assert.throws(()=>prepareLocalBatch([{...file(1),printType:'unknown'}],opts),/print_selection_required/);
 assert.throws(()=>prepareLocalBatch(Array.from({length:101},(_,i)=>file(i)),opts),/invalid_local_batch_size/);
 assert.match('/api/lab/delegated-orders/'+orderId+'/files/local-batch',localBatchPath);
});
function setup({primary=true,allowed=true,found=true,insertCount=2}={}){
 const calls=[];let reply,rollbacks=0,commits=0,released=0;
 const c={query:async(sql,args)=>{calls.push({sql,args});
  if(sql.includes('FROM lab_delegated_order_intakes'))return {rows:found?[order]:[],rowCount:found?1:0};
  if(sql.includes('INSERT INTO order_files'))return {rows:[],rowCount:insertCount};
  if(sql==='ROLLBACK')rollbacks++;
  if(sql==='COMMIT')commits++;
  return {rows:[],rowCount:0};
 },release:()=>released++};
 const input={req:{method:'POST'},url:{pathname:'/api/lab/delegated-orders/'+orderId+'/files/local-batch'},res:{},
  pool:{connect:async()=>c},labId,bodyJson:async()=>({localOnly:true,files:[file(1),file(2)]}),
  sendJson:(_res,status,data)=>reply={status,data},
  requireLocalIntakePrimary:async()=>primary,labCanUsePrintSize:async()=>allowed,
  safeFileName:x=>x,maxBytes:50_000_000};
 return {input,calls,reply:()=>reply,rollbacks:()=>rollbacks,commits:()=>commits,released:()=>released};
}
test('100 local photos use a single metadata INSERT transaction, not 100 HTTP/SQL inserts',async()=>{
 const f=setup();
 const result=await handleLocalBatch(f.input);
 assert.equal(result,true);
 assert.equal(f.reply().status,201);
 assert.equal(f.reply().data.files.length,2);
 assert.equal(f.calls.filter(x=>x.sql.includes('INSERT INTO order_files')).length,1);
 assert.equal(f.commits(),1);assert.equal(f.released(),1);
});
test('not-primary device and foreign order never commit',async()=>{
 const denied=setup({primary:false});await handleLocalBatch(denied.input);
 assert.equal(denied.calls.length,0);
 const foreign=setup({found:false});await handleLocalBatch(foreign.input);
 assert.equal(foreign.reply().status,404);
 assert.equal(foreign.rollbacks(),1);
});
test('partial conflict rolls entire batch back instead of confirming fake local files',async()=>{
 const f=setup({insertCount:1});await handleLocalBatch(f.input);
 assert.equal(f.reply().status,409);
 assert.equal(f.reply().data.error,'local_batch_conflict');
 assert.equal(f.commits(),0);assert.equal(f.rollbacks(),1);
});
test('release payload has optimized, syntax-valid web and native finance and local manual intake',()=>{
 const web=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),
  native=fs.readFileSync('dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js','utf8'),
  manual=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8'),
  server=fs.readFileSync('dist/api/server.js','utf8');
 for(const bundle of [web,native]){
  assert.match(bundle,/PB1569 finance focused loads/);
  assert.match(bundle,/pb1569FinanceReady/);
  assert.match(bundle,/w==="payments"\?"\/api\/lab\/finance\/payments"/);
 }
 assert.match(manual,/PB1569 manual intake latency/);
 assert.match(manual,/files\/local-batch/);
 assert.match(manual,/pb1569MapLimit\(pb1569Files,3,pb1569Digest\)/);
 assert.match(server,/PB1569 lab performance/);
 assert.match(server,/invoice_totals AS/);
 assert.doesNotMatch(server.slice(server.indexOf("url.pathname === '/api/lab/finance/summary'"),server.indexOf("url.pathname === '/api/lab/finance/payments'")),/COALESCE\(\(SELECT sum\(i\.total\)/);
 const manifest=JSON.parse(fs.readFileSync('dist/web/lab-desktop-ui/manifest.json','utf8'));
 for(const name of ['index.html','photobridge-r1137-lab-local-intake.js','assets/index-UIRefine-v655-r84.js']){
  const row=manifest.files.find(f=>f.name===name);
  assert(row);
  const hash=crypto.createHash('sha256').update(fs.readFileSync('dist/web/lab-desktop-ui/'+name)).digest('hex');
  assert.equal(row.sha256,hash);
 }
});
