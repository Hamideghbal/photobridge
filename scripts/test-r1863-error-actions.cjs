const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{Pool}=require('pg');
let mod;test.before(async()=>{mod=await import('./r1863-error-actions.mjs')});
const lab='11111111-1111-4111-8111-111111111111',studio='22222222-2222-4222-8222-222222222222',actor='33333333-3333-4333-8333-333333333333';
const fs=require('node:fs'),vm=require('node:vm');
test('generated route rejects nonadmins before body/recipient lookup; no arbitrary mobile accepted',async()=>{
 const installer=fs.readFileSync('scripts/enable-r1861-error-monitor.mjs','utf8');const start=installer.indexOf("    if(url.pathname==='/api/admin/error-resolution-sms'");const end=installer.indexOf('    // R1861: read-only',start);assert(start>0&&end>start);
 const route=installer.slice(start,end);let sent;
 const run=new vm.Script('(async()=>{'+route+'})()');
 await run.runInNewContext({url:{pathname:'/api/admin/error-resolution-sms'},req:{method:'POST'},res:{},auth:async()=>({}),requireRole:()=>false,sendJson:(res,status,body)=>{sent={status,body}}});assert.equal(sent.status,403);
 for(const input of [{},{requestId:crypto.randomUUID(),message:''},{requestId:crypto.randomUUID(),message:'a'.repeat(701)}])await assert.rejects(()=>mod.sendErrorResolution({input}),/invalid_/);
});
test('PostgreSQL: batch counts, contact scope, concurrent exactly-once SMS claims and uncertain response',async t=>{
 const url=process.env.PB_TEST_DATABASE_URL;if(!url)return t.skip('Disposable local PostgreSQL required');const parsed=new URL(url);assert(parsed.pathname==='/photobridge_test'&&(parsed.hostname==='127.0.0.1'||parsed.hostname==='localhost'||parsed.searchParams.get('host')==='/workspace/photobridge-env/run'));
 const schema='r1863_'+crypto.randomBytes(8).toString('hex'),admin=new Pool({connectionString:url});await admin.query('CREATE SCHEMA '+schema);const pool=new Pool({connectionString:url,options:'-c search_path='+schema,max:12});
 try{
 await pool.query(`CREATE TABLE labs(id uuid PRIMARY KEY,name text);CREATE TABLE users(id uuid PRIMARY KEY,name text,mobile text,active boolean DEFAULT true);CREATE TABLE lab_memberships(lab_id uuid,user_id uuid,role text,active boolean,created_at timestamptz DEFAULT now());CREATE TABLE photographer_profiles(user_id uuid,studio_name text);
 CREATE TABLE orders(id uuid PRIMARY KEY,lab_id uuid,customer_id uuid,number int,status text,total int);
 CREATE TABLE order_files(id uuid PRIMARY KEY,order_id uuid,lab_id uuid,customer_id uuid,original_state text);
 CREATE TABLE upload_health_sessions(id uuid PRIMARY KEY,lab_id uuid,photographer_id uuid,order_id uuid,client_kind text);
 CREATE TABLE upload_health_files(id uuid PRIMARY KEY,session_id uuid,server_file_id uuid);
 CREATE TABLE upload_health_timeline_events(id uuid PRIMARY KEY,session_id uuid,file_id uuid,state text,stage text,category text,received_at timestamptz,sent_bytes bigint,total_bytes bigint,duration_ms int,online boolean,error_code text,http_status int);
 CREATE TABLE upload_success_metrics(order_id uuid,lab_id uuid,lab_name text,mode text,file_count int,original_bytes bigint,unknown_size_files int,historical_snapshot boolean,sent_at timestamptz);
 CREATE TABLE application_error_incidents(id text,last_at timestamptz,payload jsonb);
 CREATE TABLE sms_delivery_log(id bigserial PRIMARY KEY,provider text,purpose text,event_key text,target_mobile text,user_id uuid,lab_id uuid,status text,error_code text,metadata jsonb,created_at timestamptz DEFAULT now(),provider_reference text);`);
 const order=crypto.randomUUID(),session=crypto.randomUUID();
 await pool.query("INSERT INTO labs VALUES($1,'lab')",[lab]);await pool.query("INSERT INTO users VALUES($1,'studio','09120000000',true),($2,'admin','09121111111',true)",[studio,actor]);
 await pool.query("INSERT INTO lab_memberships VALUES($1,$2,'lab_admin',true,now())",[lab,actor]);await pool.query("INSERT INTO orders VALUES($1,$2,$3,1,'uploading',1000)",[order,lab,studio]);await pool.query("INSERT INTO upload_health_sessions VALUES($1,$2,$3,$4,'web')",[session,lab,studio,order]);
 for(let i=0;i<10;i++){const f=crypto.randomUUID();await pool.query('INSERT INTO order_files VALUES($1,$2,$3,$4,$5)',[f,order,lab,studio,i<6?'active':'pending']);await pool.query('INSERT INTO upload_health_files VALUES($1,$2,$1)',[f,session]);for(let n=0;n<(i>=6?3:0);n++)await pool.query("INSERT INTO upload_health_timeline_events(id,session_id,file_id,state,category,received_at) VALUES($1,$2,$3,'failed','storage_or_network','2026-11-15T10:00:00Z')",[crypto.randomUUID(),session,f]);}
 let rows=(await pool.query(mod.dailyBatchesSql,['2026-11-15',lab,studio,200,0])).rows;assert.equal(rows.length,1);assert.equal(rows[0].recorded_files,10);assert.equal(rows[0].verified_files,6);assert.equal(rows[0].affected_files,4);assert.equal(rows[0].error_events,12);
 assert.equal((await pool.query(mod.dailyBatchesSql,['2026-11-15',crypto.randomUUID(),null,200,0])).rowCount,0);
 const report=await import('./r1861-error-dashboard-data.mjs');const data=await report.getDailyErrorReport(pool,{day:'2026-11-15'});assert.equal(data.summary[0].batches,1);assert.equal(data.summary[0].photographer_mobile,'09120000000');assert.equal(data.summary[0].lab_mobile,'09121111111');
 await assert.rejects(()=>mod.errorContact(pool,{labId:crypto.randomUUID(),photographerId:studio,target:'photographer'}),/recipient_unavailable/);
 assert.equal((await mod.errorContact(pool,{labId:lab,target:'lab'})).id,actor);
 let calls=0;const options={pool,actorId:actor,normalizeMobile:x=>x,sendSms:async()=>{calls++;return {reference:'mock-only'}}},input={labId:lab,photographerId:studio,target:'photographer',requestId:crypto.randomUUID(),message:mod.resolutionDefault};
 const outcomes=await Promise.all(Array.from({length:8},()=>mod.sendErrorResolution({...options,input})));assert.equal(calls,1);assert.equal(outcomes.filter(x=>!x.replay).length,1);
 const replay=await mod.sendErrorResolution({...options,input});assert.equal(replay.state,'accepted');assert.equal(calls,1);
 await assert.rejects(()=>mod.sendErrorResolution({...options,input:{...input,message:'different'}}),/request_conflict/);
 await assert.rejects(()=>mod.sendErrorResolution({...options,input:{...input,requestId:crypto.randomUUID()}}),/recipient_rate_limited/);
 const uncertain={...input,target:'lab',requestId:crypto.randomUUID()};await assert.rejects(()=>mod.sendErrorResolution({...options,sendSms:async()=>{calls++;throw Error('timeout')},input:uncertain}),/delivery_unconfirmed/);
 const retry=await mod.sendErrorResolution({...options,input:uncertain});assert.equal(retry.state,'needs_attention');assert.equal(calls,2,'uncertain provider response must not send again');
 // Same browser session can span multiple orders: use verified file ownership/order linkage.
 const secondOrder=crypto.randomUUID(),secondFile=crypto.randomUUID();await pool.query("INSERT INTO orders VALUES($1,$2,$3,2,'uploading',1000)",[secondOrder,lab,studio]);await pool.query("INSERT INTO order_files VALUES($1,$2,$3,$4,'pending')",[secondFile,secondOrder,lab,studio]);await pool.query('INSERT INTO upload_health_files VALUES($1,$2,$1)',[secondFile,session]);await pool.query("INSERT INTO upload_health_timeline_events(id,session_id,file_id,state,category,received_at) VALUES($1,$2,$3,'failed','storage_or_network','2026-11-15T11:00:00Z')",[crypto.randomUUID(),session,secondFile]);
 const grouped=(await pool.query(mod.dailyBatchesSql,['2026-11-15',lab,studio,200,0])).rows;assert.equal(grouped.length,2);assert.equal(grouped.find(r=>r.order_id===order).recorded_files,10);assert.equal(grouped.find(r=>r.order_id===secondOrder).recorded_files,1);assert.equal((await report.getDailyErrorReport(pool,{day:'2026-11-15'})).summary[0].batches,2);
 const page=(await pool.query(mod.dailyBatchesSql,['2026-11-15',lab,studio,1,1])).rows;assert.equal(page.length,1);assert.equal(page[0].total_rows,2);
 // Provider accepted but updating the reservation failed: replay still cannot send again.
 await pool.query("UPDATE sms_delivery_log SET created_at=now()-interval '6 minutes'");let breakUpdate=true;const brokenPool={connect:()=>pool.connect(),query:async(sql,args)=>{if(breakUpdate&&sql.startsWith("UPDATE sms_delivery_log SET status='sent'")){breakUpdate=false;throw Error('simulated DB outage')}return pool.query(sql,args)}};
 const dbGap={...input,requestId:crypto.randomUUID()};await assert.rejects(()=>mod.sendErrorResolution({...options,pool:brokenPool,input:dbGap}),/delivery_unconfirmed/);const callsAfterDbGap=calls;assert.equal((await mod.sendErrorResolution({...options,input:dbGap})).state,'needs_attention');assert.equal(calls,callsAfterDbGap);
 await pool.query("UPDATE order_files SET original_state='active' WHERE order_id=$1",[order]);await pool.query("UPDATE orders SET status='sent' WHERE id=$1",[order]);rows=(await pool.query(mod.dailyBatchesSql,['2026-11-15',null,null,200,0])).rows;assert.equal(rows.find(r=>r.order_id===order).verified_files,10);assert.equal(rows.find(r=>r.order_id===order).order_status,'sent');
 }finally{await pool.end();await admin.query('DROP SCHEMA '+schema+' CASCADE');await admin.end()}
});

test('aggregate progress tracks verified originals and never reaches 100 before submit',()=>{
 const {uploadProgress}=require('./r1854-print-recovery.cjs');const snap={state:'uploading',groups:[{files:Array.from({length:10},(_,i)=>({size:100,state:i<6?'done':'uploading',progress:100}))}]};assert.equal(uploadProgress(snap),60);snap.state='verifying';snap.groups[0].files.forEach(f=>f.state='done');assert.equal(uploadProgress(snap),99);snap.state='submitted';assert.equal(uploadProgress(snap),100);assert.equal(uploadProgress(null),0);
});

test('transmission bar advances during a file, is weighted by bytes, and stops before verified completion',()=>{
 const {uploadProgress}=require('./r1854-print-recovery.cjs');const snap={state:'uploading',groups:[{files:[{id:'a',size:100,state:'done'},{id:'b',size:300,state:'uploading'}]}]};assert.equal(uploadProgress(snap,{b:50}),62);assert.equal(uploadProgress(snap,{b:100}),95);snap.groups[0].files[1].state='verifying';assert.equal(uploadProgress(snap),96);snap.groups[0].files[1].state='done';assert.equal(uploadProgress(snap),99);snap.state='submitted';assert.equal(uploadProgress(snap),100);
});
