const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path'),{spawnSync}=require('node:child_process'),{Pool}=require('pg');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',F='33333333-3333-4333-8333-333333333333';
test('real PostgreSQL: durable dedup across processes, concurrent three-per-day budget, and scoped origin names',async t=>{
 const url=process.env.PB_TEST_DATABASE_URL;if(!url)return t.skip('Disposable PostgreSQL test URL required');
 const parsed=new URL(url);assert(parsed.pathname==='/photobridge_test'&&(parsed.hostname==='127.0.0.1'||parsed.hostname==='localhost'||parsed.searchParams.get('host')==='/workspace/photobridge-env/run'),'disposable local test database only');
 const schema='r1852_'+crypto.randomBytes(8).toString('hex'),admin=new Pool({connectionString:url});await admin.query('CREATE SCHEMA '+schema);
 const pool=new Pool({connectionString:url,options:'-c search_path='+schema,max:8});
 const guard=await import('./r1852-sms-alert-guard.mjs'),options={provider:'test',mobile:'09120000000',adminId:A};
 const incident={id:'test',source:'server',stage:'download',status:503,code:'StorageTimeout',route:'/api/lab/orders/:id/download',labId:A,photographerId:B};
 try{
  // Ephemeral fixtures use the existing production table contract, not migrations.
  await pool.query(`CREATE TABLE sms_delivery_log(id bigserial PRIMARY KEY,provider text,purpose text,event_key text,target_mobile text,user_id uuid,lab_id uuid,status text,error_code text,metadata jsonb,created_at timestamptz DEFAULT now(),provider_reference text);
   CREATE TABLE labs(id uuid PRIMARY KEY,name text);CREATE TABLE users(id uuid PRIMARY KEY,name text);CREATE TABLE photographer_profiles(user_id uuid PRIMARY KEY,studio_name text);CREATE TABLE order_files(id uuid PRIMARY KEY,lab_id uuid,customer_id uuid);`);
  const claim=await guard.reserveAdminAlert(pool,incident,options);assert.equal(claim.reserved,true);await guard.completeAdminAlert(pool,claim,{success:true,reference:'test-only'});
  const child=`import pg from 'pg';const guard=await import(process.env.PB_GUARD_FILE);const pool=new pg.Pool({connectionString:process.env.PB_TEST_DATABASE_URL,options:'-c search_path='+process.env.PB_TEST_SCHEMA});try{console.log(JSON.stringify(await guard.reserveAdminAlert(pool,JSON.parse(process.env.PB_TEST_INCIDENT),JSON.parse(process.env.PB_TEST_OPTIONS))))}finally{await pool.end()}`;
  const restarted=spawnSync(process.execPath,['--input-type=module','-e',child],{cwd:process.cwd(),encoding:'utf8',timeout:20000,env:{...process.env,PB_GUARD_FILE:require('node:url').pathToFileURL(path.resolve('scripts/r1852-sms-alert-guard.mjs')).href,PB_TEST_SCHEMA:schema,PB_TEST_INCIDENT:JSON.stringify({...incident,id:'after-restart'}),PB_TEST_OPTIONS:JSON.stringify(options)}});
  assert.equal(restarted.status,0,restarted.stderr);assert.equal(JSON.parse(restarted.stdout).reason,'duplicate');
  // Already-sent error alerts from older releases consume the same rolling budget.
  await pool.query("INSERT INTO sms_delivery_log(provider,purpose,event_key,target_mobile,status,metadata) VALUES('legacy','admin_alert','application_error','09120000000','sent','{}'),('legacy','admin_alert','application_error','09120000000','sent','{}')");
  assert.equal((await guard.reserveAdminAlert(pool,{...incident,code:'AfterUpgrade'},options)).reason,'daily_cap','release upgrade must not reset the administrator SMS allowance');
  await pool.query('TRUNCATE sms_delivery_log');
  const claims=await Promise.all(Array.from({length:8},(_,i)=>guard.reserveAdminAlert(pool,{...incident,code:'Concurrent'+i},options)));
  assert.equal(claims.filter(c=>c.reserved).length,3);assert.equal(claims.filter(c=>c.reason==='daily_cap').length,5);assert.equal((await pool.query('SELECT count(*)::int AS n FROM sms_delivery_log')).rows[0].n,3);
  await pool.query("UPDATE sms_delivery_log SET created_at=now()-interval '25 hours'");
  assert.equal((await guard.reserveAdminAlert(pool,{...incident,code:'NewDay'},options)).reserved,true);
  assert.equal((await guard.reserveAdminAlert(pool,{...incident,code:'Concurrent'+claims.findIndex(c=>c.reserved)},options)).reason,'duplicate','old signatures stay suppressed even when the daily budget resets');
  await pool.query('INSERT INTO labs VALUES($1,$2)',[A,'لابراتوار مرکزی']);await pool.query('INSERT INTO users VALUES($1,$2)',[B,'مدیر عکاسی']);await pool.query('INSERT INTO photographer_profiles VALUES($1,$2)',[B,'هنر هفتم']);await pool.query('INSERT INTO order_files VALUES($1,$2,$3)',[F,A,B]);
  const origin=await guard.loadSmsOrigin(pool,{labId:A,fileId:F});assert.equal(origin.lab,'لابراتوار مرکزی');assert.equal(origin.photographer,'هنر هفتم');assert.equal(origin.photographerId,B);
  const outside=await guard.loadSmsOrigin(pool,{labId:F,fileId:F});assert.equal(outside.photographerId,null);assert.equal(outside.photographer,'نامشخص');
 }finally{await pool.end();await admin.query('DROP SCHEMA '+schema+' CASCADE');await admin.end()}
});
