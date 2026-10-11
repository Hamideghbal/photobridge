const {test}=require('node:test'),assert=require('node:assert/strict'),{Pool}=require('pg'),crypto=require('node:crypto'),fs=require('node:fs'),vm=require('node:vm');
test('real gallery create: three free galleries, paid fourth, deletion, rollback and concurrent requests',async()=>{
 const url=process.env.PB_TEST_DATABASE_URL||process.env.DATABASE_URL||'';
 if(!url.includes('host=/workspace/photobridge-env/run')&&!(new URL(url).hostname==='127.0.0.1'&&new URL(url).pathname==='/photobridge_test'))throw Error('Use the disposable local PostgreSQL database only');
 const schema='gallery_trial_'+crypto.randomBytes(6).toString('hex'),admin=new Pool({connectionString:url});
 await admin.query(`CREATE SCHEMA ${schema}`);
 const pool=new Pool({connectionString:url,options:`-c search_path=${schema}`});
 try{
 await pool.query(`CREATE TABLE photographer_service_wallets(user_id uuid PRIMARY KEY,balance bigint NOT NULL,updated_at timestamptz DEFAULT now());
 CREATE TABLE audit_log(actor_id uuid,lab_id uuid,action text,entity_type text,entity_id text,data jsonb);
 CREATE TABLE photographer_client_galleries(id uuid PRIMARY KEY,owner_id uuid,lab_id uuid,title text,customer_name text,customer_mobile text,public_token text,access_code_hash text,status text,digital_price bigint,note text,expires_at timestamptz,photo_limit int,creation_fee bigint,wallet_transaction_id uuid,selection_enabled boolean,ordering_enabled boolean,watermark_enabled boolean,watermark_text text,lifetime_days_snapshot int,post_completion_days_snapshot int);
 CREATE TABLE photographer_service_wallet_transactions(id uuid DEFAULT gen_random_uuid(),user_id uuid,service_key text,kind text,amount bigint CHECK(amount>0),balance_after bigint,reference_type text,reference_id text,reference_key text,note text,metadata jsonb);
 CREATE TABLE photographer_gallery_print_tariff_states(gallery_id uuid,size_id text,active boolean,updated_at timestamptz,UNIQUE(gallery_id,size_id));
 CREATE TABLE photographer_gallery_print_tariffs(owner_id uuid,size_id text,active boolean);
 CREATE TABLE photographer_gallery_custom_sizes(id text,owner_id uuid,active boolean);
 CREATE TABLE print_sizes(id text,active boolean,owner_lab_id uuid);
 CREATE TABLE lab_hidden_print_sizes(lab_id uuid,size_id text);`);
 const {galleryCreationOffer,recordGalleryTrial}=await import('../dist/api/gallery-trial.js');
 const source=fs.readFileSync('dist/api/server.js','utf8'),start=source.indexOf("if (req.method === 'POST' && url.pathname === '/api/customer/client-galleries')"),end=source.indexOf('const customerGalleryRenew',start);
 const lifeStart=source.indexOf('function galleryLifetimeDays('),lifeEnd=source.indexOf('function galleryPostCompletionDays(',lifeStart);
 const lifetime=vm.runInNewContext(source.slice(lifeStart,lifeEnd)+';galleryLifetimeDays');
 const run=vm.runInNewContext('(async function(req,url,a,labId,res){'+source.slice(start,end)+'})',{
  pool,crypto,moneyAmount:value=>Math.max(0,Number(value)||0),passwordHash:()=> 'hash',bodyJson:async req=>req.body,normalizeMobile:s=>s,cleanGalleryCode:s=>s,
  sendJson:(_res,status,body)=>({status,body}),isUnlimitedAdminPhotographer:async()=>false,
  photographerWalletEnsure:async()=>{},photographerEffectivePrice:async()=>({enabled:true,customer_enabled:true,effective_price:10000,metadata:{lifetime_days:45}}),
  galleryServiceMaxPhotos:()=>500,galleryLifetimeDays:lifetime,galleryPostCompletionDays:()=>7,
  galleryCreationOffer,recordGalleryTrial,CLIENT_GALLERY_SERVICE_KEY:'client_gallery',PUBLIC_APP_URL:'https://test.invalid',audit:async()=>{}
 });
 const user=crypto.randomUUID(),lab=crypto.randomUUID(),create=id=>run({method:'POST',body:{title:'Trial',customerName:'Customer',customerMobile:'',accessCode:'1234',digitalPrice:1200,orderingEnabled:true,selectionEnabled:false}},{pathname:'/api/customer/client-galleries'},{userId:id},lab,{});
 await pool.query('INSERT INTO photographer_service_wallets VALUES($1,0,now())',[user]);
 for(let i=0;i<3;i++){const r=await create(user);assert.equal(r.status,201);assert.equal(r.body.chargedAmount,0);assert.equal(r.body.balance,0)}
 const dates=await pool.query("SELECT selection_enabled,ordering_enabled,digital_price,lifetime_days_snapshot,extract(epoch from (expires_at-now()))/86400 days FROM photographer_client_galleries WHERE owner_id=$1",[user]);assert(dates.rows.every(g=>g.lifetime_days_snapshot===45&&Number(g.days)>44.99&&Number(g.days)<=45),'creation uses the actual admin lifetime setting');
 assert(dates.rows.every(g=>g.selection_enabled&&g.ordering_enabled&&Number(g.digital_price)===1200),'orders always permit photo selection and optional price is saved on creation');
 assert.equal((await create(user)).status,402);
 assert.equal((await pool.query('SELECT count(*)::int n FROM audit_log')).rows[0].n,3);
 await pool.query('DELETE FROM photographer_client_galleries');assert.equal((await create(user)).status,402,'deletion must not restore trials');
 await pool.query('UPDATE photographer_service_wallets SET balance=20000 WHERE user_id=$1',[user]);
 assert.equal((await create(user)).body.chargedAmount,10000);assert.equal((await pool.query('SELECT balance FROM photographer_service_wallets WHERE user_id=$1',[user])).rows[0].balance,'10000');
 const concurrent=crypto.randomUUID();await pool.query('INSERT INTO photographer_service_wallets VALUES($1,100000,now())',[concurrent]);
 const results=await Promise.all(Array.from({length:6},()=>create(concurrent)));
 assert(results.every(r=>r.status===201));assert.equal(results.filter(r=>r.body.chargedAmount===0).length,3);assert.equal(results.filter(r=>r.body.chargedAmount===10000).length,3);
 const failed=crypto.randomUUID();await pool.query('INSERT INTO photographer_service_wallets VALUES($1,0,now())',[failed]);
 await pool.query('DROP TABLE photographer_gallery_print_tariff_states');
 await assert.rejects(()=>create(failed),'failed creation must roll back the gallery and free receipt together');
 assert.equal((await pool.query('SELECT count(*)::int n FROM audit_log WHERE actor_id=$1',[failed])).rows[0].n,0);
 assert.equal((await pool.query('SELECT count(*)::int n FROM photographer_client_galleries WHERE owner_id=$1',[failed])).rows[0].n,0);
 const c=await pool.connect();try{await c.query('BEGIN');const other=crypto.randomUUID();await c.query('INSERT INTO photographer_service_wallets VALUES($1,0,now())',[other]);await recordGalleryTrial(c,other,lab,crypto.randomUUID());await c.query('ROLLBACK');assert.equal((await pool.query('SELECT count(*)::int n FROM audit_log WHERE actor_id=$1',[other])).rows[0].n,0)}finally{c.release()}
 const unlimited=await galleryCreationOffer(pool,user,{unlimited:true,standardFee:10000});assert.equal(unlimited.fee,0);assert.equal(unlimited.trial,false);
 assert(source.includes('renewalFee: standardFee'),'trial must not waive renewal charges');
 }finally{await pool.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end()}
});
