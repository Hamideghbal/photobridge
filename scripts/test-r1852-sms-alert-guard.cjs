const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
let guard,incident;
test.before(async()=>{
  guard=await import('./r1852-sms-alert-guard.mjs');
  incident=await import('./r1850-error-monitor.mjs');
});
const error=(other={})=>({source:'server',stage:'download',status:503,
  code:'StorageTimeout',route:'/api/lab/orders/:id/download',labId:A,photographerId:B,
  id:'PB-1234ABCD',...other});
function db({existing=false,count=0}={}){
  let calls=[],inserted=0,updated=0,rolledBack=0;
  const conn={
    async query(sql,params){
      calls.push({sql,params});
      if(sql.includes("metadata->>'guardFingerprint'=$1"))return {rowCount:existing?1:0,rows:existing?[{id:3}]:[]};
      if(sql.includes("AS cnt"))return {rowCount:1,rows:[{cnt:count}]};
      if(sql.includes('INSERT INTO sms_delivery_log')){inserted++;return {rowCount:1,rows:[{id:15}]}};
      if(sql==='ROLLBACK')rolledBack++;
      return {rowCount:1,rows:[]};
    },
    release(){calls.push({sql:'RELEASE'});}
  };
  return {pool:{async connect(){return conn;},async query(sql,params){updated++;calls.push({sql,params});return {rowCount:1};}},
    calls,get inserted(){return inserted},get updated(){return updated},get rolledBack(){return rolledBack}};
}
test('R1852 alerts only for server-confirmed download/upload 5xx, not noisy browser/network',()=>{
  assert.equal(guard.shouldNotifySms(error()),true);
  assert.equal(guard.shouldNotifySms(error({stage:'complete',status:500})),true);
  assert.equal(guard.shouldNotifySms(error({source:'upload'})),false);
  assert.equal(guard.shouldNotifySms(error({source:'api'})),false);
  assert.equal(guard.shouldNotifySms(error({stage:'browser'})),false);
  assert.equal(guard.shouldNotifySms(error({status:404})),false);
  assert.equal(guard.shouldNotifySms(error({stage:'api'})),false);
  assert.equal(guard.shouldNotifySms(error({channel:'network_path'})),false);
  assert.equal(guard.stageFromErrorPath('/api/lab/files/download?token=secret'),'download');
  assert.equal(guard.stageFromErrorPath('/api/customer/uploads/complete'),'complete');
});
test('R1852 fingerprint isolates laboratories and photographers but not incident ID',()=>{
  const first=guard.fingerprintSms(error());
  assert.equal(first,guard.fingerprintSms(error({id:'PB-ANOTHER'})));
  assert.notEqual(first,guard.fingerprintSms(error({labId:B})));
  assert.notEqual(first,guard.fingerprintSms(error({photographerId:A})));
  assert.notEqual(first,guard.fingerprintSms(error({code:'DifferentCode'})));
});
test('R1852 sends clear bounded labels and does not print ambiguous origin',()=>{
  const msg=guard.formatAlertSms(error(),{lab:'لابراتوار مرکزی\nدیگر',photographer:'عکاسی نمونه'});
  assert.match(msg,/لابراتوار: لابراتوار مرکزی دیگر/);
  assert.match(msg,/عکاسی: عکاسی نمونه/);
  assert.match(msg,/عملیات: دانلود عکس/);
  assert.match(msg,/StorageTimeout/);
  assert.doesNotMatch(msg,/signedUrl|AWS_SECRET|token=/);
  const unknown=guard.formatAlertSms(error(),{});
  assert.match(unknown,/لابراتوار: نامشخص/);
  assert.match(unknown,/عکاسی: نامشخص/);
});
test('R1852 reserves DB claim atomically before external SMS',async()=>{
  const d=db(),result=await guard.reserveAdminAlert(d.pool,error(),{
    provider:'test',mobile:'09120000000',adminId:A});
  assert.equal(result.reserved,true);
  assert.equal(result.id,15);
  assert.equal(d.inserted,1);
  assert.equal(d.calls[0].sql,'BEGIN');
  assert.ok(d.calls.some(c=>c.sql.includes('pg_advisory_xact_lock')));
  assert.ok(d.calls.some(c=>c.sql==='COMMIT'));
  assert.equal(d.calls.at(-1).sql,'RELEASE');
  await guard.completeAdminAlert(d.pool,result,{success:true,reference:'PROVIDER-42'});
  assert.equal(d.updated,1);
  assert.ok(d.calls.some(c=>c.sql.includes('UPDATE sms_delivery_log')));
});
test('R1852 repeated signature is blocked regardless of reboots',async()=>{
  const d=db({existing:true});
  const result=await guard.reserveAdminAlert(d.pool,error(),{
    provider:'test',mobile:'09120000000',adminId:A});
  assert.deepEqual({reserved:result.reserved,reason:result.reason},{reserved:false,reason:'duplicate'});
  assert.equal(d.inserted,0);
});
test('R1852 enforces shared daily budget of three alerts',async()=>{
  const d=db({count:3});
  const result=await guard.reserveAdminAlert(d.pool,error(),{
    provider:'test',mobile:'09120000000',adminId:A});
  assert.equal(result.reserved,false);
  assert.equal(result.reason,'daily_cap');
  assert.equal(d.inserted,0);
});
test('R1852 fails closed when DB cannot record claim',async()=>{
  let sent=0;
  const pool={async connect(){return {async query(sql){
    if(sql.includes('pg_advisory_xact_lock'))throw Error('DB down');
    return {rowCount:0};
  },release(){}};}};
  await assert.rejects(()=>guard.reserveAdminAlert(pool,error(),{provider:'test',mobile:'0',adminId:A}),/DB down/);
  assert.equal(sent,0);
});
test('R1852 server scope only accepts UUIDs and separates lab incidents in memory',()=>{
  const a=incident.cleanIncident({...error(),url:'https://signed.example?secret',arbitrary:'SECRET'});
  assert.equal(a.labId,A);assert.equal(a.photographerId,B);
  assert.doesNotMatch(JSON.stringify(a),/signed\.example|SECRET/);
  const untrusted=incident.cleanIncident({...error(),labId:'unsafe',photographerId:'invalid'});
  assert.equal(untrusted.labId,'');assert.equal(untrusted.photographerId,'');
});
test('R1852 build generated server has authenticated context and download classification',()=>{
  const server=fs.readFileSync('dist/api/server.js','utf8');
  assert.match(server,/stage:stageFromErrorPath\(req.url\)/);
  assert.match(server,/req\.PB1852labId=labId/);
  assert.ok(server.includes("fileId:String(req.url||'').split('?')[0].split('/').find"));
  assert.match(server,/reserveAdminAlert\(pool,incident/);
  assert.match(server,/shouldNotifySms\(incident\)/);
  assert.match(server,/shouldAlert:shouldNotifySms/);
  assert.match(server,/photographerId:requestPortal\(req\)==='photographer'\?actor\.userId:null/);
  for(const file of ['dist/api/server.js','dist/api/sms-alert-guard.mjs','dist/api/error-monitor.mjs']){
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
  }
});

test('R1852 ignores browser errors before the SMS budget and keeps incident counts',async t=>{
  const fsPromises=require('node:fs/promises');
  const os=require('node:os'),path=require('node:path');
  const folder=await fsPromises.mkdtemp(path.join(os.tmpdir(),'pb1852-sms-'));
  let current=1000000,sent=0;
  const monitor=incident.createErrorMonitor({directory:folder,now:()=>current,
    shouldAlert:guard.shouldNotifySms,alert:async()=>{sent++;},log:{error(){}}});
  t.after(async()=>{monitor.close();await monitor.flush();await fsPromises.rm(folder,{recursive:true,force:true});});
  for(let i=0;i<15;i++)await monitor.record({source:'browser',stage:'browser',code:'error_'+i,status:0});
  await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(sent,0);
  await monitor.record(error());
  await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(sent,1);
  current+=700000; // after the previous 10-minute cooldown
  await monitor.record(error());
  await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(sent,1);
  const row=(await monitor.list()).find(x=>x.code==='StorageTimeout');
  assert.equal(row.count,2);
});

test('R1852 resolves the photographer of a lab download only after an actionable error',async()=>{
  let queries=[];
  const localPool={async query(sql,params){
    queries.push({sql,params});
    if(sql.includes('FROM order_files WHERE id=$1'))return {rows:[{customer_id:B}]};
    return {rows:[{lab_name:'لابراتوار یک',photographer_name:'آتلیه دو'}]};
  }};
  const result=await guard.loadSmsOrigin(localPool,{
    labId:A,fileId:'33333333-3333-4333-8333-333333333333'});
  assert.equal(result.lab,'لابراتوار یک');
  assert.equal(result.photographer,'آتلیه دو');
  assert.equal(result.photographerId,B);
  assert.equal(queries.length,2);
  assert.equal(queries[0].params[1],A);
});
