const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const C='33333333-3333-4333-8333-333333333333';
const D='44444444-4444-4444-8444-444444444444';
const E='55555555-5555-4555-8555-555555555555';
const F='66666666-6666-4666-8666-666666666666';
let helpers;
test.before(async()=>{helpers=await import('./r1851-upload-health.mjs');});
function event(overrides={}){return {eventId:A,sessionId:B,fileId:C,attemptId:D,
  stage:'transfer',state:'failed',errorCode:'network_error',httpStatus:0,
  totalBytes:120,sentBytes:30,orderId:E,serverFileId:F,online:true,client:'web',...overrides};}
test('R1851 normalizes allowlisted events without leaking names/URLs',()=>{
  const data=helpers.normalizeUploadHealthEvent({...event(),name:'private.jpg',uploadUrl:'https://secret.example?signature=123'});
  assert.equal(data.category,'storage_or_network');
  assert.equal(data.totalBytes,120);
  assert.equal(data.fileId,C);
  assert.ok(!JSON.stringify(data).includes('private.jpg'));
  assert.ok(!JSON.stringify(data).includes('secret.example'));
});
test('R1851 classifies offline, HEIC, timeout and quota errors separately',()=>{
  assert.equal(helpers.classifyUploadHealth({stage:'transfer',state:'failed',online:false}),'offline');
  assert.equal(helpers.classifyUploadHealth({stage:'complete',state:'failed',httpStatus:422}),'derivative');
  assert.equal(helpers.classifyUploadHealth({stage:'transfer',state:'failed',httpStatus:504}),'timeout');
  assert.equal(helpers.classifyUploadHealth({stage:'transfer',state:'failed',httpStatus:413}),'size_or_quota');
  assert.equal(helpers.classifyUploadHealth({stage:'transfer',state:'ok'}),'none');
});
test('R1851 blocks forged IDs, oversized fields and invalid progress',()=>{
  assert.throws(()=>helpers.normalizeUploadHealthEvent(event({sessionId:'broken'})),/invalid_event_id/);
  assert.throws(()=>helpers.normalizeUploadHealthEvent(event({stage:'billing'})),/invalid_upload_stage/);
  assert.throws(()=>helpers.normalizeUploadHealthEvent(event({sentBytes:130})),/invalid_byte_progress/);
  assert.equal(helpers.normalizeUploadHealthEvent(event({errorCode:'dangerous key'})).errorCode,'dangerous_key');
});
test('R1851 persists authorized events within a single transaction',async()=>{
  const statements=[];let released=false;
  const conn={async query(sql,params){statements.push({sql,params});return {rowCount:1,rows:[{id:A}]};},release(){released=true;}};
  const result=await helpers.recordUploadHealthEvents({async connect(){return conn;}},{
    photographerId:A,labId:B,events:[event()]});
  assert.deepEqual(result,{accepted:1,duplicates:0});
  assert.equal(statements[0].sql,'BEGIN');
  assert.equal(statements.at(-1).sql,'COMMIT');
  assert.ok(statements.some(x=>x.sql.includes('customer_id=$2 AND lab_id=$3')));
  assert.ok(statements.some(x=>x.sql.includes('ON CONFLICT(id) DO NOTHING')));
  assert.equal(released,true);
});
test('R1851 scrubs an unverified file ID but retains failure diagnostics',async()=>{
  const statements=[];let released=false;
  const conn={async query(sql,params){
    statements.push(sql);
    if(sql.startsWith('SELECT 1 FROM order_files'))return {rowCount:0};
    return {rowCount:1};
  },release(){released=true;}};
  const result=await helpers.recordUploadHealthEvents({async connect(){return conn;}},{
    photographerId:A,labId:B,events:[event()]});
  assert.equal(result.accepted,1);
  assert.ok(statements.includes('COMMIT'));
  assert.ok(!statements.includes('ROLLBACK'));
  assert.equal(released,true);
});
test('R1851 rejects unbounded batches before opening a DB connection',async()=>{
  let opened=false;
  await assert.rejects(helpers.recordUploadHealthEvents({async connect(){opened=true;}},{
    photographerId:A,labId:B,events:Array(17).fill(event())}),/invalid_event_batch/);
  assert.equal(opened,false);
});
test('R1851 wiring is present in the final generated server and browser shell',()=>{
  const root=path.resolve(__dirname,'..'),server=fs.readFileSync(path.join(root,'dist/api/server.js'),'utf8');
  const html=fs.readFileSync(path.join(root,'dist/web/index.html'),'utf8');
  assert.ok(server.includes('/api/customer/uploads/health-events'));
  assert.ok(server.includes('/api/admin/upload-health'));
  assert.ok(server.includes("requireRole(actor,'platform_admin')"));
  assert.ok(html.includes('photobridge-upload-health-r1851.js'));
  assert.ok(fs.readFileSync(path.join(root,'dist/web/photobridge-upload-health-r1851.js'),'utf8').includes('XMLHttpRequest.prototype.send'));
});
